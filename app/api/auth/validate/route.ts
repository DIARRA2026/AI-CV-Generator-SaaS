import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, resetRateLimit, isRateLimited } from "@/lib/rateLimit";
import { validateRegistrationPayload, validateLoginPayload } from "@/lib/validation";

/**
 * ROUTE HANDLER SÉCURISÉ : VALIDATION AUTHENTIFICATION CÔTÉ SERVEUR & RATE LIMITING
 * POST /api/auth/validate
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Détermination de l'adresse IP cliente pour le Rate Limiter
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await request.json();
    const mode = body?.mode || "login";
    const action = body?.action; // "fail" | "reset" | undefined
    const emailKey = body?.email ? `email:${body.email.toLowerCase().trim()}` : null;
    const rateLimitKey = `auth:${ip}:${emailKey || "anon"}`;

    // Si action === "reset" (ex: connexion réussie)
    if (action === "reset") {
      resetRateLimit(rateLimitKey);
      return NextResponse.json({ success: true, remainingAttempts: 4 });
    }

    // Si action === "fail" (mot de passe incorrect avéré)
    if (action === "fail") {
      const rateCheck = checkRateLimit(rateLimitKey, 4, 15 * 60 * 1000);
      return NextResponse.json(
        {
          success: rateCheck.allowed,
          remainingAttempts: rateCheck.remaining,
          resetInSeconds: rateCheck.resetInSeconds,
          error: rateCheck.errorMessage,
        },
        { status: rateCheck.allowed ? 200 : 429 }
      );
    }

    // 2. Contrôle de blocage existant (ne consomme pas de tentative à la simple vérification)
    const currentStatus = isRateLimited(rateLimitKey);
    if (currentStatus.blocked) {
      return NextResponse.json(
        {
          success: false,
          error: currentStatus.errorMessage,
          remainingAttempts: 0,
          resetInSeconds: currentStatus.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(currentStatus.resetInSeconds),
            "X-RateLimit-Limit": "4",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 3. Validation selon le mode
    if (mode === "register") {
      const validation = validateRegistrationPayload(body);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            errors: validation.errors,
            remainingAttempts: 4,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        sanitizedData: validation.sanitizedData,
        remainingAttempts: 4,
      });
    }

    // Mode Connexion (login)
    const loginValidation = validateLoginPayload(body);
    if (!loginValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          errors: loginValidation.errors,
          remainingAttempts: 4,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sanitizedData: loginValidation.sanitizedData,
      remainingAttempts: 4,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Requête malformée ou charge utile non valide.",
      },
      { status: 400 }
    );
  }
}
