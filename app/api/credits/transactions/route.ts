import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { WalletService } from "@/lib/credits/walletService";

export const dynamic = "force-dynamic";

/**
 * GET /api/credits/transactions
 * Grand livre immuable des mouvements AI Coins de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = searchParams.get("limit");
  const rawOffset = searchParams.get("offset");

  const limit = Math.min(100, Math.max(1, rawLimit ? parseInt(rawLimit, 10) : 50));
  const offset = Math.max(0, rawOffset ? parseInt(rawOffset, 10) : 0);

  try {
    const transactions = await WalletService.getTransactions(auth.user.id, limit, offset);
    return NextResponse.json({ success: true, transactions, limit, offset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message }, { status: 500 });
  }
}
