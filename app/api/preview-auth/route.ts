import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkRateLimit, isRateLimited, resetRateLimit } from "@/lib/rateLimit";

/**
 * Récupère la configuration sécurisée du sas de prévisualisation.
 * Échec sécurisé si la clé de hachage ou le mot de passe ne sont pas configurés.
 */
function getPreviewAuthConfig(): {
  secret: string;
  password: string;
} | null {
  const secret = process.env.PREVIEW_SECRET_KEY?.trim();
  const password = process.env.PREVIEW_PASSWORD?.trim();

  if (!secret || !password) {
    return null;
  }

  return { secret, password };
}

/**
 * Comparaison temporelle constante anti-timing attack
 */
function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = crypto.createHash("sha256").update(a).digest();
    const bufB = crypto.createHash("sha256").update(b).digest();
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Génère un jeton signé HMAC pour la session de prévisualisation
 */
function generatePreviewToken(secret: string): string {
  const timestamp = Date.now();
  const payload = `preview-access:${timestamp}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/**
 * Vérifie l'authenticité et la validité du jeton de prévisualisation
 */
function verifyPreviewToken(token: string, secret: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [prefix, timestampStr, hmac] = parts;
    if (prefix !== "preview-access") return false;

    const timestamp = parseInt(timestampStr, 10);
    // Valide pendant 7 jours
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
      return false;
    }

    const expectedHmac = crypto
      .createHmac("sha256", secret)
      .update(`${prefix}:${timestampStr}`)
      .digest("hex");

    return safeCompare(hmac, expectedHmac);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = getPreviewAuthConfig();
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le sas de prévisualisation n'est pas configuré sur le serveur (PREVIEW_SECRET_KEY ou PREVIEW_PASSWORD manquant).",
        },
        { status: 503 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimitKey = `preview_lock:${ip}`;

    const body = await request.json().catch(() => ({}));
    const action = body?.action || "login";

    if (action === "logout") {
      const res = NextResponse.json({ success: true });
      res.cookies.set("moncv_preview_auth", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      return res;
    }

    if (action === "verify") {
      const token = request.cookies.get("moncv_preview_auth")?.value;
      if (token && verifyPreviewToken(token, config.secret)) {
        return NextResponse.json({ authenticated: true });
      }
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Vérification de blocage anti-brute-force
    const currentBlock = isRateLimited(rateLimitKey);
    if (currentBlock.blocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Trop de tentatives. Veuillez patienter ${Math.ceil(
            currentBlock.resetInSeconds / 60
          )} minute(s).`,
          blocked: true,
        },
        { status: 429 }
      );
    }

    const inputPassword = (body?.password || "").trim();
    if (!inputPassword) {
      return NextResponse.json(
        { success: false, error: "Veuillez renseigner le mot de passe d'accès." },
        { status: 400 }
      );
    }

    // Comparaison stricte avec le mot de passe d'environnement
    const isValid = safeCompare(inputPassword, config.password);

    if (isValid) {
      resetRateLimit(rateLimitKey);
      const token = generatePreviewToken(config.secret);

      const response = NextResponse.json({
        success: true,
        message: "Accès prévisualisation déverrouillé avec succès.",
      });

      // Cookie de session valide pendant 7 jours, strictement protégé
      response.cookies.set("moncv_preview_auth", token, {
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    }

    const rateCheck = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);
    return NextResponse.json(
      {
        success: false,
        error: "Code d'accès incorrect. Cet espace est strictement confidentiel.",
        remainingAttempts: rateCheck.remaining,
      },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erreur de traitement de sécurité." },
      { status: 500 }
    );
  }
}
