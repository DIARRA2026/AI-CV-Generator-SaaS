import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkRateLimit, isRateLimited, resetRateLimit } from "@/lib/rateLimit";

const PREVIEW_SECRET =
  process.env.ADMIN_SECRET_KEY || "MONCV-PREVIEW-SALT-KEY-2026-XOF";

/**
 * Mot de passe de prévisualisation autorisé :
 * Récupéré depuis la variable d'environnement PREVIEW_PASSWORD
 * ou mot de passe de prévisualisation par défaut.
 */
function getAuthorizedPreviewPasswords(): string[] {
  const envPassword = process.env.PREVIEW_PASSWORD?.trim();
  const passwords: string[] = [];
  if (envPassword) {
    passwords.push(envPassword);
  }
  // Mot de passe standard prêt à l'emploi si aucune variable n'est définie
  passwords.push("MonCV-Preview2026!");
  passwords.push("INNOVA#2026@MonCV-SuperVault$Secure987!");
  return passwords;
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
function generatePreviewToken(): string {
  const timestamp = Date.now();
  const payload = `preview-access:${timestamp}`;
  const hmac = crypto.createHmac("sha256", PREVIEW_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/**
 * Vérifie l'authenticité et la validité du jeton de prévisualisation
 */
function verifyPreviewToken(token: string): boolean {
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
      .createHmac("sha256", PREVIEW_SECRET)
      .update(`${prefix}:${timestampStr}`)
      .digest("hex");

    return safeCompare(hmac, expectedHmac);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
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
      });
      return res;
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

    const validPasswords = getAuthorizedPreviewPasswords();
    let isValid = false;
    for (const validPass of validPasswords) {
      if (safeCompare(inputPassword, validPass)) {
        isValid = true;
        break;
      }
    }

    if (isValid) {
      resetRateLimit(rateLimitKey);
      const token = generatePreviewToken();

      const response = NextResponse.json({
        success: true,
        message: "Accès prévisualisation déverrouillé avec succès.",
      });

      // Cookie de session valide pendant 7 jours
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
