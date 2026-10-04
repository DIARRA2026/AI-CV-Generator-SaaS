import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { WalletService } from "@/lib/credits/walletService";

export const dynamic = "force-dynamic";

/**
 * POST /api/credits/release
 * Libération immédiate d'une réservation d'AI Coins suite à un échec ou annulation
 */
export async function POST(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { operationId, reason } = body;

    if (!operationId) {
      return NextResponse.json(
        { success: false, message: "operationId requis." },
        { status: 400 }
      );
    }

    const result = await WalletService.release({
      operationId,
      reason: reason || "CANCELLED_BY_CLIENT",
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message }, { status: 500 });
  }
}
