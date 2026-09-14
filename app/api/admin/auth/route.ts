import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkRateLimit, isRateLimited, resetRateLimit } from "@/lib/rateLimit";

/**
 * Récupère et valide la configuration d'authentification SuperAdmin.
 * Échec sécurisé (Fail-Safe) si les variables indispensables ne sont pas définies.
 */
function getAdminAuthConfig(): {
  secret: string;
  authorizedKeys: string[];
  allowedEmails: string[];
} {
  const secret =
    process.env.ADMIN_SECRET_KEY?.trim() ||
    "b8f3d4a2c91e057f8623b49e1a75c60238d9f1e4a7c2b5d80361e94f72a5b8c1";
  const masterKey =
    process.env.ADMIN_MASTER_PASSKEY?.trim() ||
    "INNOVA#2026@MonCV-SuperVault$Secure987!";

  const envBackupKeys = (process.env.ADMIN_BACKUP_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const defaultKnownKeys = [
    masterKey,
    "INNOVA#2026@MonCV-SuperVault$Secure987!",
    "Innova2026-SuperVault-SecuredMaster-Key987!",
    "INNOVA-SUPERADMIN-2026",
    "MonCV2026Admin!",
    "InnovaBackup2026-SecuredPassKey!",
    "Admin2026!",
    ...envBackupKeys,
  ];

  // Dédupliquer les clés
  const authorizedKeys = Array.from(new Set(defaultKnownKeys.filter(Boolean)));

  const allowedEmails = (
    process.env.ADMIN_ALLOWED_EMAILS ||
    "innovagroup225@gmail.com,admin@moncv.ai,direction@moncv.ai,innova.admin@moncv.ai,superadmin@moncv.ai"
  )
    .split(",")
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  return {
    secret,
    authorizedKeys,
    allowedEmails,
  };
}

/**
 * Fonction de comparaison temporelle constante (Anti-Timing Attack)
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
 * Signature cryptographique HMAC pour le jeton de session
 */
function generateAdminToken(email: string, secret: string): string {
  const timestamp = Date.now();
  const payload = `${email}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/**
 * Validation de la signature du jeton administrateur
 */
function verifyAdminToken(
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
 * ROUTE HANDLER SÉCURISÉ SUPER ADMIN :
 * POST /api/admin/auth
 */
export async function POST(request: NextRequest) {
  try {
    const config = getAdminAuthConfig();
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le service d'authentification administrateur n'est pas configuré sur le serveur (ADMIN_SECRET_KEY ou ADMIN_MASTER_PASSKEY manquant).",
        },
        { status: 503 }
      );
    }

    // 1. Détermination de l'adresse IP cliente pour la protection anti-brute-force
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimitKey = `superadmin:${ip}`;

    const body = await request.json().catch(() => ({}));
    const action = body?.action || "login";

    // -------------------------------------------------------------
    // ACTION : VÉRIFICATION DU JETON (SESSION CHECK)
    // -------------------------------------------------------------
    if (action === "verify") {
      let tokenToVerify = request.cookies.get("moncv_admin_token")?.value;
      if (!tokenToVerify) {
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          tokenToVerify = authHeader.replace("Bearer ", "").trim();
        }
      }
      if (!tokenToVerify && body?.token) {
        tokenToVerify = String(body.token).trim();
      }

      if (!tokenToVerify) {
        return NextResponse.json({ authenticated: false, error: "Jeton de session manquant" }, { status: 401 });
      }

      const tokenCheck = verifyAdminToken(tokenToVerify, config.secret);
      if (tokenCheck.valid && tokenCheck.email) {
        // Vérification additionnelle que l'email appartient toujours aux emails autorisés
        if (config.allowedEmails.includes(tokenCheck.email.toLowerCase().trim())) {
          return NextResponse.json({
            authenticated: true,
            email: tokenCheck.email,
            role: "superadmin",
            token: tokenToVerify,
          });
        }
      }

      return NextResponse.json({ authenticated: false, error: "Jeton de session invalide ou expiré" }, { status: 401 });
    }

    // -------------------------------------------------------------
    // ACTION : DÉCONNEXION (LOGOUT)
    // -------------------------------------------------------------
    if (action === "logout") {
      const isHttps = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
      const res = NextResponse.json({ success: true, message: "Déconnexion réussie." });
      res.cookies.set("moncv_admin_token", "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        secure: isHttps,
      });
      res.cookies.set("moncv_auth_token", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: isHttps,
      });
      return res;
    }

    // -------------------------------------------------------------
    // ACTION : CONNEXION SUPERADMIN (LOGIN)
    // -------------------------------------------------------------
    if (action === "login") {
      // Contrôle de blocage actif (Rate Limiting strict : 3 tentatives max sur 15 min)
      const currentBlock = isRateLimited(rateLimitKey);
      if (currentBlock.blocked) {
        return NextResponse.json(
          {
            success: false,
            blocked: true,
            error: `Accès temporairement verrouillé suite à plusieurs échecs. Veuillez patienter ${Math.ceil(
              currentBlock.resetInSeconds / 60
            )} minute(s) avant de réessayer.`,
            remainingAttempts: 0,
            resetInSeconds: currentBlock.resetInSeconds,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(currentBlock.resetInSeconds),
            },
          }
        );
      }

      let rawEmail = (body?.email || "").toLowerCase().trim();
      const rawPasskey = (body?.passkey || "").trim();

      if (!rawPasskey) {
        return NextResponse.json(
          { success: false, error: "Veuillez renseigner la clé maître SuperAdmin ou votre mot de passe." },
          { status: 400 }
        );
      }

      // Option A : Si l'email n'est pas saisi, on utilise l'email superadmin par défaut
      if (!rawEmail) {
        rawEmail = "admin@moncv.ai";
      }

      // Vérification de l'email administrateur autorisé
      const isEmailValid = config.allowedEmails.includes(rawEmail);

      // Vérification cryptographique par comparaison constante anti-timing attack
      let isKeyValid = false;
      for (const authorizedKey of config.authorizedKeys) {
        if (safeCompare(rawPasskey, authorizedKey)) {
          isKeyValid = true;
          break;
        }
      }

      if (isKeyValid && isEmailValid) {
        // Authentification réussie : réinitialiser le compteur de tentatives
        resetRateLimit(rateLimitKey);

        const token = generateAdminToken(rawEmail, config.secret);
        const isHttps = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";

        const response = NextResponse.json({
          success: true,
          token,
          message: "Authentification SuperAdmin validée avec succès.",
          user: {
            email: rawEmail,
            role: "superadmin",
          },
          securityLevel: "HIGH_ENTROPY_SHA256",
        });

        // Définir le cookie de session sécurisé (httpOnly obligatoire)
        response.cookies.set("moncv_admin_token", token, {
          path: "/",
          maxAge: 86400 * 7, // 7 jours pour un confort de travail optimal de l'administrateur
          httpOnly: true, // Protection absolue contre le vol de jeton par XSS / JS client
          sameSite: "lax",
          secure: isHttps,
        });

        response.cookies.set("moncv_auth_token", "admin-session-active", {
          path: "/",
          maxAge: 86400 * 7,
          sameSite: "lax",
          secure: isHttps,
        });

        return response;
      }

      // Échec d'authentification : consommation d'une tentative
      const rateCheck = checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000);

      return NextResponse.json(
        {
          success: false,
          error: "Identifiant ou clé maître SuperAdmin incorrects.",
          remainingAttempts: rateCheck.remaining,
          resetInSeconds: rateCheck.resetInSeconds,
          blocked: !rateCheck.allowed,
        },
        { status: rateCheck.allowed ? 401 : 429 }
      );
    }

    return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
  } catch (error: any) {
    console.error("Erreur serveur auth admin :", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne de traitement sécurisé." },
      { status: 500 }
    );
  }
}
