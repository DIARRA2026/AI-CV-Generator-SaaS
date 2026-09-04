import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateEmail, validateName, validatePhone, sanitizeString } from "@/lib/validation";

/**
 * ROUTE HANDLER SÉCURISÉ : CONTACT AVEC VALIDATION CÔTÉ SERVEUR & RATE LIMITING
 * POST /api/contact
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Rate limiting strict : 4 soumissions max par 15 minutes
    const rateCheck = checkRateLimit(`contact:${ip}`, 4, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Trop de messages envoyés (maximum 4 autorisés). Veuillez patienter 15 minutes.",
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

    const body = await request.json();
    const errors: Record<string, string> = {};

    const nameVal = validateName(body?.name, "Le nom");
    if (!nameVal.isValid) errors.name = nameVal.error!;

    const emailVal = validateEmail(body?.email);
    if (!emailVal.isValid) errors.email = emailVal.error!;

    const phoneVal = validatePhone(body?.phone);
    if (!phoneVal.isValid) errors.phone = phoneVal.error!;

    const message = sanitizeString(body?.message);
    if (!message || message.length < 10) {
      errors.message = "Le message doit contenir au moins 10 caractères.";
    } else if (message.length > 3000) {
      errors.message = "Le message ne peut excéder 3000 caractères.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, errors, remainingAttempts: rateCheck.remaining },
        { status: 400 }
      );
    }

    // Le message est validé côté serveur
    return NextResponse.json({
      success: true,
      message: "Votre message a été transmis avec succès à l'équipe INNOVA GROUP.",
      remainingAttempts: rateCheck.remaining,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erreur lors du traitement du message." },
      { status: 400 }
    );
  }
}
