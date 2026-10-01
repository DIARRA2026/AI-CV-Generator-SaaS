import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { confirmKKiaPayPayment } from "@/lib/payments/confirm-kkiapay-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/kkiapay/verify
 * ============================================================
 * Vérifie côté serveur la transaction transmise par le client après le widget.
 * RÈGLE 2 : Seul le serveur active l'abonnement après vérification auprès de KKiaPay.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthUser(request);
    if (!auth.authenticated || !auth.user?.id) {
      return NextResponse.json(
        { success: false, message: "Non autorisé. Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const orderId = (body.orderId || body.order_id || "").toString().trim();
    const transactionId = (body.transactionId || body.transaction_id || "").toString().trim();

    if (!orderId || !transactionId) {
      return NextResponse.json(
        { success: false, message: "orderId et transactionId sont obligatoires." },
        { status: 400 }
      );
    }

    // Confirmation sécurisée et atomique côté serveur
    const result = await confirmKKiaPayPayment({
      transactionId,
      expectedOrderId: orderId,
      expectedUserId: auth.user.id,
    });

    return NextResponse.json({
      success: result.status === "paid",
      status: result.status,
      plan: result.planId,
      expiresAt: result.expiresAt,
      message: result.message,
      reason: result.reason,
    });
  } catch (err: any) {
    console.error("[KKiaPay verify route] Exception:", err);
    return NextResponse.json(
      { success: false, status: "pending", message: "Erreur lors de la vérification du paiement." },
      { status: 500 }
    );
  }
}
