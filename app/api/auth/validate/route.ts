import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";
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
    const emailKey = body?.email ? `email:${body.email.toLowerCase().trim()}` : null;
    const rateLimitKey = `auth:${ip}:${emailKey || "anon"}`;

    // 2. Contrôle strict de Rate Limiting (Seuil de 4 tentatives maximum)
    const rateCheck = checkRateLimit(rateLimitKey, 4, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateCheck.errorMessage,
          remainingAttempts: 0,
          resetInSeconds: rateCheck.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.resetInSeconds),
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
            remainingAttempts: rateCheck.remaining,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        sanitizedData: validation.sanitizedData,
        remainingAttempts: rateCheck.remaining,
      });
    }

    // Mode Connexion (login)
    const loginValidation = validateLoginPayload(body);
    if (!loginValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          errors: loginValidation.errors,
          remainingAttempts: rateCheck.remaining,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sanitizedData: loginValidation.sanitizedData,
      remainingAttempts: rateCheck.remaining,
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
