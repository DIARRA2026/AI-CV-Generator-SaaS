import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { CreditService } from "@/lib/creditService";

export const dynamic = "force-dynamic";

/**
 * GET /api/credits
 * Renvoie le solde actif, la date d'expiration la plus proche, les lots et le grand livre
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthUser(request);
    if (!auth.authenticated || !auth.user?.id) {
      return NextResponse.json(
        { success: false, message: "Authentification requise pour consulter les crédits." },
        { status: 401 }
      );
    }

    const userId = auth.user.id;

    // S'assurer que les crédits de bienvenue sont attribués si nouvellement connecté
    await CreditService.grantWelcomeCredits(userId);

    const [summary, batches, ledger] = await Promise.all([
      CreditService.getUserBalance(userId),
      CreditService.getUserBatches(userId),
      CreditService.getUserLedger(userId, 50),
    ]);

    return NextResponse.json({
      success: true,
      summary,
      batches,
      ledger,
    });
  } catch (error: any) {
    console.error("Erreur GET /api/credits:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur lors de la récupération des crédits." },
      { status: 500 }
    );
  }
}
