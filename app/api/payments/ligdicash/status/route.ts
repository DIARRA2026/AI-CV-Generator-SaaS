import { NextRequest, NextResponse } from "next/server";
import { LigdiCashClient } from "@/lib/ligdicash";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPaymentPlanConfig } from "@/config/payments";
import { PlanTier } from "@/lib/types";

/**
 * MONCV.AI — VÉRIFICATION DU STATUT DE PAIEMENT LIGDICASH
 * 
 * Endpoint : GET /api/payments/ligdicash/status?ref={transactionRef}&token={token}
 * Permet au frontend (Dashboard ou Modal) de vérifier en temps réel l'activation
 * d'un paiement LigdiCash après la redirection du client.
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get("ref") || "";
    const token = searchParams.get("token") || "";

    if (!ref && !token) {
      return NextResponse.json(
        { success: false, message: "Référence ou token de transaction obligatoire." },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Base de données non disponible." },
        { status: 503 }
      );
    }

    // 1. Recherche dans subscriptions
    let query = supabaseAdmin.from("subscriptions").select("*");
    if (ref) {
      query = query.eq("transaction_ref", ref);
    } else {
      query = query.eq("external_token", token);
    }
    const { data: subscription, error } = await query.maybeSingle();

    if (error) {
      console.warn("Erreur recherche subscription status:", error);
    }

    // 2. Si déjà actif en base
    if (subscription && subscription.status === "active") {
      return NextResponse.json({
        success: true,
        status: "active",
        planTier: subscription.plan_tier,
        amount: subscription.amount,
        currency: subscription.currency,
        allowedCandidates: subscription.allowed_candidates,
        transactionRef: subscription.transaction_ref,
      });
    }

    // 3. Si en attente (pending), faire une confirmation directe auprès de LigdiCash
    const invoiceToken = subscription?.external_token || token;
    if (invoiceToken) {
      const confirmResult = await LigdiCashClient.confirmInvoice(invoiceToken);

      if (confirmResult.status === "completed") {
        const nowIso = new Date().toISOString();
        const planTier = (subscription?.plan_tier || "2500") as PlanTier;
        const planConfig = getPaymentPlanConfig(planTier);
        const isEnterprise =
          planTier.startsWith("enterprise") ||
          planTier === "cyber15" ||
          (subscription?.allowed_candidates && subscription.allowed_candidates > 4);

        if (subscription?.id) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              activated_at: nowIso,
              updated_at: nowIso,
              payment_method: `LigdiCash (${confirmResult.operatorName || "Mobile Money"})`,
            })
            .eq("id", subscription.id);
        }

        if (ref) {
          await supabaseAdmin
            .from("transactions")
            .update({ status: "completed" })
            .eq("reference_code", ref);
        }

        // Débloquer le profile Supabase
        const targetUserId = subscription?.user_id;
        const targetEmail = subscription?.user_email;
        const profileUpdate: any = {
          plan_tier: planTier,
          is_unlocked: true,
          account_type: isEnterprise ? "business" : "candidate",
          allowed_candidates: planConfig?.allowedCandidates || subscription?.allowed_candidates || 1,
          updated_at: nowIso,
        };

        if (targetUserId) {
          await supabaseAdmin.from("profiles").update(profileUpdate).eq("id", targetUserId);
        } else if (targetEmail) {
          await supabaseAdmin.from("profiles").update(profileUpdate).eq("email", targetEmail);
        }

        return NextResponse.json({
          success: true,
          status: "active",
          planTier,
          amount: confirmResult.amount || subscription?.amount,
          transactionRef: ref || subscription?.transaction_ref,
          message: "Paiement validé avec succès.",
        });
      }

      if (confirmResult.status === "notcompleted") {
        return NextResponse.json({
          success: false,
          status: "failed",
          message: "Paiement échoué ou annulé.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: subscription?.status || "pending",
      planTier: subscription?.plan_tier,
      transactionRef: ref,
    });
  } catch (err: any) {
    console.error("Erreur route GET /api/payments/ligdicash/status :", err);
    return NextResponse.json(
      { success: false, message: "Erreur interne lors de la vérification." },
      { status: 500 }
    );
  }
}
