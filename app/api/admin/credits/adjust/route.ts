import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { WalletService } from "@/lib/credits/walletService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/credits/adjust
 * Ajustement administratif manuel d'AI Coins avec motif obligatoire et traçabilité
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
    const { userId, amount, reason } = body;

    if (!userId || typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { success: false, message: "userId et un montant non nul (amount) sont requis." },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, message: "Un motif clair d'ajustement administratif est obligatoire." },
        { status: 400 }
      );
    }

    const adminId = auth.email || "super_admin";

    const result = await WalletService.adminAdjust({
      adminId,
      userId,
      amount,
      reason: reason.trim(),
      metadata: { adminEmail: auth.email },
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Ajustement de ${amount > 0 ? "+" : ""}${amount} AI Coins effectué avec succès.`,
      ...result,
    });
  } catch (err: any) {
    console.error("Erreur POST /api/admin/credits/adjust:", err);
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
