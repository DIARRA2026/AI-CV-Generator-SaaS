import { NextRequest } from "next/server";
import crypto from "crypto";

export interface AdminAuthConfig {
  secret: string;
  masterKey: string;
  backupKeys: string[];
  allowedEmails: string[];
}

/**
 * Récupère la configuration SuperAdmin depuis les variables d'environnement.
 * Échoue STRICTEMENT (retourne null) si ADMIN_SECRET_KEY ou ADMIN_MASTER_PASSKEY est absent.
 * Aucun secret, mot de passe ou email par défaut n'est codé en dur.
 */
export function getAdminAuthConfig(): AdminAuthConfig | null {
  const secret = process.env.ADMIN_SECRET_KEY?.trim();
  const masterKey = process.env.ADMIN_MASTER_PASSKEY?.trim();

  if (!secret || !masterKey) {
    return null;
  }

  const envBackupKeys = (process.env.ADMIN_BACKUP_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const envAllowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  return {
    secret,
    masterKey,
    backupKeys: envBackupKeys,
    allowedEmails: envAllowedEmails,
  };
}

/**
 * Comparaison temporelle constante pour prévenir les attaques par canal auxiliaire (Timing Attacks)
 */
export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = crypto.createHash("sha256").update(a).digest();
    const bufB = crypto.createHash("sha256").update(b).digest();
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Signature cryptographique HMAC SHA-256 pour le jeton de session SuperAdmin
 */
export function generateAdminToken(email: string, secret: string): string {
  const timestamp = Date.now();
  const payload = `${email}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/**
 * Validation cryptographique du jeton administrateur
 */
export function verifyAdminToken(
  token: string,
  secret: string
): { valid: boolean; email?: string } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return { valid: false };

    const [email, timestampStr, hmac] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Expiration après 24 heures (86 400 000 ms)
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return { valid: false };
    }

    const expectedHmac = crypto
      .createHmac("sha256", secret)
      .update(`${email}:${timestampStr}`)
      .digest("hex");

    if (safeCompare(hmac, expectedHmac)) {
      return { valid: true, email };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Vérification centralisée d'une requête admin (pour les routes API protégées)
 * Retourne le statut d'autorisation et les métadonnées de la session.
 */
export function verifyAdminRequest(request: NextRequest): {
  authorized: boolean;
  email?: string;
  statusCode?: number;
  error?: string;
} {
  const config = getAdminAuthConfig();
  if (!config) {
    return {
      authorized: false,
      statusCode: 503,
      error: "Service d'administration non configuré sur le serveur (variables requises manquantes).",
    };
  }

  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("moncv_admin_token")?.value;
  const token = (authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null) || cookieToken;

  if (!token) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Jeton d'authentification manquant.",
    };
  }

  const tokenCheck = verifyAdminToken(token, config.secret);
  if (!tokenCheck.valid || !tokenCheck.email) {
    return {
      authorized: false,
      statusCode: 401,
      error: "Jeton d'authentification invalide ou expiré.",
    };
  }

  const normalizedEmail = tokenCheck.email.toLowerCase().trim();

  // Si des emails autorisés sont restreints par configuration, vérifier l'appartenance
  if (config.allowedEmails.length > 0 && !config.allowedEmails.includes(normalizedEmail)) {
    return {
      authorized: false,
      statusCode: 403,
      error: "Adresse email non autorisée pour les privilèges administrateur.",
    };
  }

  return {
    authorized: true,
    email: normalizedEmail,
  };
}
