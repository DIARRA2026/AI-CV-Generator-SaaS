import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAuthConfig,
  safeCompare,
  generateAdminToken,
  verifyAdminToken,
} from "@/lib/adminAuth";
import { checkRateLimit, isRateLimited, resetRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

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
        const email = tokenCheck.email.toLowerCase().trim();
        if (config.allowedEmails.length === 0 || config.allowedEmails.includes(email)) {
          return NextResponse.json({
            authenticated: true,
            email,
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

      const rawEmail = (body?.email || "").toLowerCase().trim();
      const rawPasskey = (body?.passkey || "").trim();

      if (!rawPasskey) {
        return NextResponse.json(
          { success: false, error: "Veuillez renseigner la clé maître SuperAdmin ou votre mot de passe." },
          { status: 400 }
        );
      }

      if (!rawEmail) {
        return NextResponse.json(
          { success: false, error: "Veuillez renseigner l'adresse email administrateur." },
          { status: 400 }
        );
      }

      // Vérification de l'email administrateur autorisé
      const isEmailValid = config.allowedEmails.length === 0 || config.allowedEmails.includes(rawEmail);

      // Vérification cryptographique contre les clés configurées (masterKey + backupKeys)
      const authorizedKeys = [config.masterKey, ...config.backupKeys];
      let isKeyValid = false;
      for (const authorizedKey of authorizedKeys) {
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
          maxAge: 86400 * 7,
          httpOnly: true,
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
