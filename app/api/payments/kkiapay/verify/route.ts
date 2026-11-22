import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { confirmKKiaPayPayment } from "@/lib/payments/confirm-kkiapay-payment";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    const body = await request.json().catch(() => ({}));
    const orderId = (body.orderId || body.order_id || "").toString().trim();
    const transactionId = (body.transactionId || body.transaction_id || "").toString().trim();

    if (!orderId || !transactionId) {
      return NextResponse.json(
        { success: false, message: "orderId et transactionId sont obligatoires." },
        { status: 400 }
      );
    }

    const auth = await getServerAuthUser(request);
    let expectedUserId: string | undefined =
      auth.authenticated && auth.user?.id ? auth.user.id : undefined;

    // Si la session n'était pas active côté SSR, récupérer le user_id rattaché à la commande
    if (!expectedUserId && supabaseAdmin) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("user_id")
        .eq("id", orderId)
        .maybeSingle();

      if (order?.user_id) {
        expectedUserId = order.user_id;
      }
    }

    // Confirmation sécurisée et atomique côté serveur
    const result = await confirmKKiaPayPayment({
      transactionId,
      expectedOrderId: orderId,
      expectedUserId,
    });

    const response = NextResponse.json({
      success: result.status === "paid",
      status: result.status,
      plan: result.planId,
      expiresAt: result.expiresAt,
      message: result.message,
      reason: result.reason,
    });

    // Synchronisation de la session pour que l'utilisateur soit directement connecté sur son dashboard
    if (result.userId && supabaseAdmin) {
      try {
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", result.userId)
          .maybeSingle();

        if (prof?.email) {
          const tokenValue = encodeURIComponent(`auth_${prof.email}`);
          response.cookies.set("moncv_auth_token", tokenValue, {
            path: "/",
            maxAge: 2592000,
            sameSite: "lax",
          });
          response.cookies.set("moncv_user_email", encodeURIComponent(prof.email), {
            path: "/",
            maxAge: 2592000,
            sameSite: "lax",
          });
          response.cookies.set("moncv_user_id", encodeURIComponent(result.userId), {
            path: "/",
            maxAge: 2592000,
            sameSite: "lax",
          });
        }
      } catch (cookieErr) {
        console.warn("[KKiaPay verify] Cookie sync:", cookieErr);
      }
    }

    return response;
  } catch (err: any) {
    console.error("[KKiaPay verify route] Exception:", err);
    return NextResponse.json(
      { success: false, status: "pending", message: "Erreur lors de la vérification du paiement." },
      { status: 500 }
    );
  }
}
