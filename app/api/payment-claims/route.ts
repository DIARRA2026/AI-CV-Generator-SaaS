import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { CreditService } from "@/lib/creditService";
import { CreditPackCode } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment-claims
 * Soumet une déclaration de paiement Wave avec référence et capture d'écran
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthUser(request);
    if (!auth.authenticated || !auth.user?.id) {
      return NextResponse.json(
        { success: false, message: "Vous devez être connecté pour soumettre un paiement." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const packCode = body.packCode || body.pack_code;
    const waveReference = body.waveReference || body.wave_reference;
    const screenshotUrl = body.screenshotUrl || body.screenshot_url;

    if (!packCode || !waveReference) {
      return NextResponse.json(
        { success: false, message: "Le pack et la référence de transaction Wave sont requis." },
        { status: 400 }
      );
    }

    const validPacks: CreditPackCode[] = ["essentiel", "evolution", "carriere"];
    if (!validPacks.includes(packCode as CreditPackCode)) {
      return NextResponse.json(
        { success: false, message: "Pack de crédits non valide pour le paiement." },
        { status: 400 }
      );
    }

    const result = await CreditService.submitPaymentClaim({
      userId: auth.user.id,
      userEmail: auth.user.email,
      packCode: packCode as CreditPackCode,
      waveReference: String(waveReference).trim(),
      screenshotUrl: screenshotUrl || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Erreur enregistrement de la réclamation." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      claim: result.claim,
      message: "Votre déclaration de paiement Wave a été enregistrée avec succès. Elle sera validée très rapidement par l'équipe administrative.",
    });
  } catch (error: any) {
    console.error("Erreur POST /api/payment-claims:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment-claims
 * Liste les déclarations de paiement de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthUser(request);
    if (!auth.authenticated || !auth.user?.id) {
      return NextResponse.json(
        { success: false, message: "Authentification requise." },
        { status: 401 }
      );
    }

    const claims = await CreditService.getUserClaims(auth.user.id);
    return NextResponse.json({ success: true, claims });
  } catch (error: any) {
    console.error("Erreur GET /api/payment-claims:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur lors de la récupération." },
      { status: 500 }
    );
  }
}
