import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCreditPack } from "@/config/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/kkiapay/orders
 * ============================================================
 * Crée ou réutilise une intention d'achat (commande) côté serveur.
 * RÈGLE 1 : Le client fournit uniquement le planId. Le montant est exclusivement déterminé par le serveur.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthUser(request);
    if (!auth.authenticated || !auth.user?.id) {
      return NextResponse.json(
        { success: false, message: "Authentification requise pour initier un paiement." },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Service de base de données indisponible." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawPlanId = (body.planId || body.plan_id || "").toString().toLowerCase().trim();

    if (!rawPlanId) {
      return NextResponse.json(
        { success: false, message: "L'identifiant de la formule (planId) est requis." },
        { status: 400 }
      );
    }

    // Normalisation des slugs (compatibilité avec pro / evolution, vip / carriere)
    let canonicalPlanId = rawPlanId;
    if (rawPlanId === "1500") canonicalPlanId = "essentiel";
    if (rawPlanId === "2500" || rawPlanId === "evolution") canonicalPlanId = "pro";
    if (rawPlanId === "5000" || rawPlanId === "carriere") canonicalPlanId = "vip";

    // 1. Lire le prix officiel depuis la table `plans` en base de données
    let planData: { id: string; name: string; price_xof: number } | null = null;

    const { data: dbPlan } = await supabaseAdmin
      .from("plans")
      .select("id, name, price_xof")
      .eq("id", canonicalPlanId)
      .maybeSingle();

    if (dbPlan) {
      planData = dbPlan;
    } else {
      // Fallback sur config/payments.ts si la migration n'a pas encore été injectée localement
      const staticPack = getCreditPack(canonicalPlanId);
      if (staticPack && staticPack.prixFcfa > 0) {
        planData = {
          id: canonicalPlanId,
          name: staticPack.nom,
          price_xof: staticPack.prixFcfa,
        };
      }
    }

    if (!planData || planData.price_xof <= 0) {
      return NextResponse.json(
        { success: false, message: `Formule payante invalide ou introuvable : ${rawPlanId}` },
        { status: 400 }
      );
    }

    const userId = auth.user.id;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // 2. Recherche d'une commande `pending` récente pour éviter d'inonder la table
    const { data: recentPendingOrder } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", planData.id)
      .eq("amount_xof", planData.price_xof)
      .eq("status", "pending")
      .gt("created_at", fifteenMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentPendingOrder) {
      return NextResponse.json({
        success: true,
        orderId: recentPendingOrder.id,
        amount: recentPendingOrder.amount_xof,
        currency: recentPendingOrder.currency || "XOF",
        planName: planData.name,
        planId: planData.id,
      });
    }

    // 3. Création d'une nouvelle commande sécurisée
    const { data: newOrder, error: createError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        plan_id: planData.id,
        amount_xof: planData.price_xof,
        currency: "XOF",
        status: "pending",
      })
      .select()
      .single();

    if (createError || !newOrder) {
      console.error("[KKiaPay orders] Erreur création commande:", createError);
      return NextResponse.json(
        { success: false, message: "Impossible de générer la commande." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      amount: newOrder.amount_xof,
      currency: newOrder.currency,
      planName: planData.name,
      planId: planData.id,
    });
  } catch (err: any) {
    console.error("[KKiaPay orders] Exception:", err);
    return NextResponse.json(
      { success: false, message: "Erreur interne lors de la création de la commande." },
      { status: 500 }
    );
  }
}
