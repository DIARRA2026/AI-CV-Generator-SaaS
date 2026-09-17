import { NextRequest, NextResponse } from "next/server";
import { LigdiCashClient } from "@/lib/ligdicash";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPaymentPlanConfig } from "@/config/payments";
import { PlanTier } from "@/lib/types";
import { safeCompare } from "@/lib/adminAuth";

/**
 * MONCV.AI — WEBHOOK OFFICIEL LIGDICASH
 * 
 * Documentation : https://developers.ligdicash.com/api-paiement/callback/securisation
 * Pattern de Re-Vérification :
 * 1. Validation de la signature secrète (si configurée)
 * 2. Extraction du transaction_id depuis custom_data
 * 3. Contrôle d'idempotence (éviter les doubles activations)
 * 4. Re-vérification obligatoire auprès de l'API LigdiCash via le token stocké
 * 5. Activation pérenne de l'abonnement et du profil Supabase
 */

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 0. Vérification cryptographique de la signature secrète du webhook (si configurée)
    const webhookSecret = process.env.LIGDICASH_WEBHOOK_SECRET?.trim();
    if (webhookSecret) {
      const incomingSecret =
        request.headers.get("x-ligdicash-signature") ||
        request.headers.get("x-webhook-signature") ||
        request.headers.get("x-signature") ||
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        "";

      if (!incomingSecret || !safeCompare(incomingSecret, webhookSecret)) {
        console.warn("Signature de webhook LigdiCash non valide ou absente.");
        return NextResponse.json(
          { status: "error", message: "Signature secrète de notification non reconnue." },
          { status: 401 }
        );
      }
    }
    let payload: any = {};

    // LigdiCash peut envoyer les données en JSON ou en application/x-www-form-urlencoded
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      const obj: Record<string, any> = {};
      formData.forEach((value, key) => {
        try {
          obj[key] = JSON.parse(value as string);
        } catch {
          obj[key] = value;
        }
      });
      payload = obj;
    } else {
      payload = await request.json().catch(() => ({}));
    }

    console.log("Reçu callback LigdiCash :", JSON.stringify(payload).substring(0, 300));

    // 1. Extraire transaction_id selon le pattern officiel custom_data
    let transactionId = "";
    if (Array.isArray(payload.custom_data)) {
      const entry = payload.custom_data.find(
        (e: any) => e.keyof_customdata === "transaction_id"
      );
      if (entry) transactionId = entry.valueof_customdata;
    } else if (payload.custom_data?.transaction_id) {
      transactionId = payload.custom_data.transaction_id;
    }

    // Fallbacks si custom_data n'est pas utilisé tel quel
    if (!transactionId) {
      transactionId =
        payload.external_id ||
        payload.transaction_id ||
        payload.commande?.invoice?.external_id ||
        payload.token ||
        "";
    }

    if (!transactionId) {
      console.warn("Webhook LigdiCash : aucun transaction_id trouvé dans le payload.");
      return NextResponse.json(
        { status: "ignored", message: "Identifiant de transaction manquant." },
        { status: 200 } // Retourner 200 pour éviter les retries intempestifs du prestataire
      );
    }

    if (!supabaseAdmin) {
      console.error("Supabase Admin non initialisé pour le webhook LigdiCash.");
      return NextResponse.json({ status: "error", message: "Database unreachable" }, { status: 500 });
    }

    // 2. Retrouver l'abonnement et la transaction en base
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("transaction_ref", transactionId)
      .maybeSingle();

    if (subError) {
      console.error("Erreur recherche souscription :", subError);
    }

    let storedToken = subscription?.external_token;

    // Si non trouvé dans subscriptions, vérifier dans transactions
    if (!storedToken) {
      const { data: tx } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("reference_code", transactionId)
        .maybeSingle();

      storedToken = tx?.external_token || payload.token;
    }

    // 3. Idempotence : si la transaction est déjà active, ne pas retraiter
    if (subscription && subscription.status === "active") {
      console.log(`Webhook LigdiCash : Transaction ${transactionId} déjà validée et active.`);
      return NextResponse.json({ status: "success", message: "Transaction déjà validée." });
    }

    // 4. Pattern de Re-Vérification LigdiCash
    // Ne JAMAIS faire confiance au payload du webhook seul : on interroge l'API LigdiCash
    const verifyToken = storedToken || payload.token || transactionId;
    const confirmResult = await LigdiCashClient.confirmInvoice(verifyToken);

    console.log(`Résultat confirmInvoice LigdiCash pour ${transactionId} :`, {
      status: confirmResult.status,
      operator: confirmResult.operatorName,
      amount: confirmResult.amount,
    });

    const nowIso = new Date().toISOString();

    if (confirmResult.status === "completed") {
      const planTier = (subscription?.plan_tier || "2500") as PlanTier;
      const planConfig = getPaymentPlanConfig(planTier);
      const isEnterprise =
        planTier.startsWith("enterprise") ||
        planTier === "cyber15" ||
        (subscription?.allowed_candidates && subscription.allowed_candidates > 4);

      // A. Mettre à jour la table subscriptions
      if (subscription?.id) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            activated_at: nowIso,
            updated_at: nowIso,
            payment_method: `LigdiCash (${confirmResult.operatorName || "Mobile Money"})`,
            metadata: {
              ...(subscription.metadata || {}),
              operatorName: confirmResult.operatorName,
              confirmedAmount: confirmResult.amount,
              confirmedAt: nowIso,
            },
          })
          .eq("id", subscription.id);
      }

      // B. Mettre à jour la table transactions
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "completed",
        })
        .eq("reference_code", transactionId);

      // C. Débloquer le compte utilisateur dans la table profiles
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
        const { error: profErr } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", targetUserId);

        if (profErr) {
          console.warn("Avertissement mise à jour profile par id:", profErr);
        }
      } else if (targetEmail) {
        const { error: profErr } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("email", targetEmail);

        if (profErr) {
          console.warn("Avertissement mise à jour profile par email:", profErr);
        }
      }

      console.log(`Paiement ${transactionId} validé avec succès pour ${targetEmail || targetUserId} (Plan: ${planTier}).`);
      return NextResponse.json({
        status: "success",
        message: "Paiement validé et abonnement activé.",
        planTier,
      });
    }

    if (confirmResult.status === "notcompleted") {
      // Paiement échoué ou annulé
      if (subscription?.id) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: nowIso,
          })
          .eq("id", subscription.id);
      }

      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
        })
        .eq("reference_code", transactionId);

      return NextResponse.json({
        status: "received",
        result: "notcompleted",
        message: "Paiement non complété.",
      });
    }

    // Statut en attente ou inconnu : on renvoie 200 pour que le serveur de paiement n'échoue pas inutilement
    return NextResponse.json({
      status: "pending",
      message: "Paiement en attente de validation client.",
    });
  } catch (error: any) {
    console.error("Erreur critique route Webhook LigdiCash :", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Erreur interne webhook" },
      { status: 500 }
    );
  }
}
