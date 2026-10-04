import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { WalletService } from "@/lib/credits/walletService";

export const dynamic = "force-dynamic";

/**
 * POST /api/credits/reserve
 * Réservation atomique préalable d'AI Coins
 */
export async function POST(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { operationId, operationType, amount, ttlMinutes = 10, metadata } = body;

    if (!operationId || !operationType || typeof amount !== "number") {
      return NextResponse.json(
        { success: false, message: "operationId, operationType et amount requis." },
        { status: 400 }
      );
    }

    const result = await WalletService.reserve({
      userId: auth.user.id,
      operationId,
      operationType,
      amount,
      ttlMinutes,
      metadata,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "INSUFFICIENT_CREDITS",
          message: result.message || "Solde d'AI Coins insuffisant.",
          availableCredits: result.availableCredits,
          requiredCredits: result.requiredCredits,
          missingCredits: result.missingCredits,
        },
        { status: 402 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message }, { status: 500 });
  }
}
