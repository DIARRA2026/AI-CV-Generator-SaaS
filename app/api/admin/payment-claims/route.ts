import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { CreditService } from "@/lib/creditService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payment-claims
 * Liste des déclarations de paiement Wave pour le SuperAdmin
 */
export async function GET(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Accès non autorisé" },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    const claims = await CreditService.getAdminClaims(status);
    return NextResponse.json({ success: true, claims });
  } catch (error: any) {
    console.error("Erreur GET /api/admin/payment-claims:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payment-claims
 * Validation 1-clic ou rejet d'une déclaration de paiement Wave
 */
export async function POST(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Accès non autorisé" },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action, claimId, reason } = body;

    if (!claimId || !action) {
      return NextResponse.json(
        { success: false, message: "claimId et action requis" },
        { status: 400 }
      );
    }

    const adminId = "00000000-0000-0000-0000-000000000000";

    // 1. APPROBATION 1-CLIC
    if (action === "approve") {
      const result = await CreditService.approveClaim(claimId, adminId);
      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message || "Échec de l'approbation" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        newBalance: result.newBalance,
      });
    }

    // 2. REJET AVEC MOTIF
    if (action === "reject") {
      const result = await CreditService.rejectClaim(
        claimId,
        adminId,
        reason || "Référence Wave non trouvée ou montant non conforme"
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message || "Échec du rejet" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    return NextResponse.json({ success: false, message: "Action non reconnue" }, { status: 400 });
  } catch (error: any) {
    console.error("Erreur POST /api/admin/payment-claims:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
