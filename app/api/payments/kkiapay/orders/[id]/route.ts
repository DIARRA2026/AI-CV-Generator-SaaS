import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/payments/kkiapay/orders/[id]
 * ============================================================
 * Renvoie l'état courant d'une commande pour l'utilisateur propriétaire.
 * Utilisé pour :
 *   - Le rechargement de page
 *   - Le polling lors d'un paiement Mobile Money à confirmation asynchrone (lente)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getServerAuthUser(request);
    if (!auth.authenticated || !auth.user?.id) {
      return NextResponse.json(
        { success: false, message: "Non autorisé." },
        { status: 401 }
      );
    }

    const orderId = params?.id?.trim();
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Identifiant de commande requis." },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Service DB indisponible." },
        { status: 503 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, plans(name, duration_days)")
      .eq("id", orderId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { success: false, message: "Commande introuvable." },
        { status: 404 }
      );
    }

    // Récupérer l'abonnement actif si la commande est payée
    let activeSubExpiresAt: string | null = null;
    if (order.status === "paid") {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("expires_at")
        .eq("user_id", auth.user.id)
        .eq("status", "active")
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub?.expires_at) {
        activeSubExpiresAt = sub.expires_at;
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        planId: order.plan_id,
        planName: order.plans?.name || order.plan_id,
        amount: order.amount_xof,
        currency: order.currency,
        status: order.status,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        expiresAt: activeSubExpiresAt,
      },
    });
  } catch (err: any) {
    console.error("[KKiaPay order status route] Exception:", err);
    return NextResponse.json(
      { success: false, message: "Erreur interne lors de la consultation de la commande." },
      { status: 500 }
    );
  }
}
