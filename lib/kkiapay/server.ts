import "server-only";
import crypto from "crypto";

/**
 * Interface normalisée pour la réponse de vérification KKiaPay
 */
export interface KKiaPayVerificationResponse {
  status: "SUCCESS" | "FAILED" | string;
  type?: "DEBIT" | string;
  amount: number;
  fees?: number;
  income?: number;
  feeSupportedBy?: string;
  source?: string;
  source_common_name?: string;
  partnerId?: string;
  state?: string;
  transactionId: string;
  performed_at?: string;
  failureCode?: string;
  failureMessage?: string;
  client?: {
    fullname?: string;
    phone?: string;
    email?: string;
  };
}

/**
 * Récupère et valide la configuration serveur KKiaPay
 */
export function getKKiaPayServerConfig() {
  const publicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY?.trim();
  const privateKey = process.env.KKIAPAY_PRIVATE_KEY?.trim();
  const secretKey = process.env.KKIAPAY_SECRET?.trim();
  const webhookSecret = process.env.KKIAPAY_WEBHOOK_SECRET?.trim();
  const isSandbox = (process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX || "").toLowerCase() === "true";
  const vercelEnv = process.env.VERCEL_ENV;

  // RÈGLE 6 : Pas de sandbox en production
  if (vercelEnv === "production" && isSandbox) {
    throw new Error(
      "CONFIGURATION INTERDITE : Le mode sandbox KKiaPay ne peut pas être actif lorsque VERCEL_ENV === 'production'."
    );
  }

  if (!publicKey) {
    throw new Error("Variable NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY manquante.");
  }
  if (!privateKey) {
    throw new Error("Variable KKIAPAY_PRIVATE_KEY manquante.");
  }
  if (!secretKey) {
    throw new Error("Variable KKIAPAY_SECRET manquante.");
  }

  const baseUrl = isSandbox
    ? "https://api-sandbox.kkiapay.me"
    : "https://api.kkiapay.me";

  return {
    publicKey,
    privateKey,
    secretKey,
    webhookSecret,
    isSandbox,
    baseUrl,
  };
}

/**
 * Vérifie une transaction directement auprès de l'API REST officielle KKiaPay
 * @param transactionId - Identifiant de la transaction retourné par le widget ou le webhook
 * @param timeoutMs - Délai d'attente maximal en millisecondes (défaut : 10 000 ms)
 */
export async function verifyTransaction(
  transactionId: string,
  timeoutMs: number = 10000
): Promise<KKiaPayVerificationResponse> {
  const cleanTxId = transactionId?.trim();
  if (!cleanTxId) {
    throw new Error("transactionId requis pour la vérification KKiaPay.");
  }

  const config = getKKiaPayServerConfig();
  const url = `${config.baseUrl}/api/v1/transactions/status`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": config.publicKey,
        "x-secret-key": config.secretKey,
        "x-private-key": config.privateKey,
      },
      body: JSON.stringify({ transactionId: cleanTxId }),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(errorText);
      } catch {}

      if (res.status === 404 || parsedError?.reason === "Transaction Not Found") {
        throw new Error("TRANSACTION_NOT_FOUND");
      }
      if (res.status === 403 || res.status === 401) {
        throw new Error("AUTHENTICATION_FAILED_WITH_KKIAPAY");
      }
      throw new Error(`KKIAPAY_VERIFY_ERROR_${res.status}: ${errorText || res.statusText}`);
    }

    const data = (await res.json()) as KKiaPayVerificationResponse;
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("KKIAPAY_TIMEOUT: Le serveur KKiaPay n'a pas répondu dans le délai imparti.");
    }
    throw err;
  }
}

/**
 * Vérifie l'en-tête secret du webhook en temps constant pour éviter les timing attacks
 */
export function verifyWebhookSecretHeader(incomingSecret: string | null): boolean {
  if (!incomingSecret) return false;

  const expectedSecret = process.env.KKIAPAY_WEBHOOK_SECRET?.trim();
  if (!expectedSecret) return false;

  const bufIncoming = Buffer.from(incomingSecret);
  const bufExpected = Buffer.from(expectedSecret);

  if (bufIncoming.length !== bufExpected.length) return false;

  return crypto.timingSafeEqual(bufIncoming, bufExpected);
}
