import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { WalletService } from "@/lib/credits/walletService";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/credits
 * Retourne le portefeuille officiel AI COINS, le grand livre, les réservations et les packs.
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const userId = orgId || auth.user.id;

  try {
    const [wallet, transactions, packages] = await Promise.all([
      WalletService.getWallet(userId),
      WalletService.getTransactions(userId, 50),
      WalletService.getPackages(),
    ]);

    // Formatage unifié & compatibilité ascendante avec l'ancien frontend
    const summary = {
      balance: wallet.availableCredits,
      available_credits: wallet.availableCredits,
      reserved_credits: wallet.reservedCredits,
      lifetime_earned: wallet.lifetimeEarned,
      lifetime_purchased: wallet.lifetimePurchased,
      lifetime_consumed: wallet.lifetimeConsumed,
      total_balance: wallet.totalBalance,
      nearest_expiry: null,
      active_batches: 1,
      // CamelCase compat
      availableCredits: wallet.availableCredits,
      reservedCredits: wallet.reservedCredits,
      lifetimeEarned: wallet.lifetimeEarned,
      lifetimePurchased: wallet.lifetimePurchased,
      lifetimeConsumed: wallet.lifetimeConsumed,
      totalBalance: wallet.totalBalance,
      nearestExpiry: null,
      activeBatchesCount: 1,
    };

    // Mappage du grand livre pour compatibilité
    const ledger = transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      batchId: null,
      action: t.type,
      delta: t.amount,
      montant: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      description: t.description,
      reference: t.reference,
      operationId: t.operationId,
      metadata: t.metadata,
      createdAt: t.createdAt,
      creeLe: t.createdAt,
    }));

    return NextResponse.json({
      success: true,
      summary,
      wallet,
      transactions,
      packages,
      ledger,
      batches: [],
      userId,
    });
  } catch (err: any) {
    console.error("Erreur GET /api/credits:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
