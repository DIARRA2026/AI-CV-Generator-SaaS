import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyWebhookSecretHeader } from "@/lib/kkiapay/server";
import { confirmKKiaPayPayment } from "@/lib/payments/confirm-kkiapay-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/kkiapay
 * ============================================================
 * Webhook officiel KKiaPay.
 *
 * RÈGLES DE SÉCURITÉ APPLIQUÉES :
 * - Règle 3 : Les secrets restent côté serveur. Vérification x-kkiapay-secret en temps constant.
 * - Règle 4 : L'idempotence est garantie par la base (FOR UPDATE et contrainte unique).
 * - Règle 5 : Dans le doute, rien ne s'active.
 * - Réponse 2xx obligatoire pour que KKiaPay considère l'événement comme reçu.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const secretHeader = request.headers.get("x-kkiapay-secret");

    // 1. VÉRIFICATION DU SECRET HASH KKIAPAY
    const isValidSecret = verifyWebhookSecretHeader(secretHeader);
    if (!isValidSecret) {
      console.warn("[KKiaPay Webhook] Rejet 401: En-tête x-kkiapay-secret absent ou invalide.");
      return NextResponse.json(
        { success: false, error: "Signature webhook non autorisée." },
        { status: 401 }
      );
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody || "{}");
    } catch {
      console.warn("[KKiaPay Webhook] Rejet 400: Corps JSON invalide.");
      return NextResponse.json({ success: false, error: "Corps JSON invalide." }, { status: 400 });
    }

    const transactionId = (payload.transactionId || payload.transaction_id || "").toString().trim();
    const eventName = (payload.event || (payload.isPaymentSucces ? "transaction.success" : "transaction.event")).toString();

    console.log(`[KKiaPay Webhook] Événement reçu: "${eventName}" pour tx=${transactionId}`);

    // 2. JOURNALISATION IMMÉDIATE DANS payment_events
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from("payment_events").insert({
          transaction_id: transactionId || null,
          event: eventName,
          payload,
          received_at: new Date().toISOString(),
          result: "processing",
        });
      } catch (logErr) {
        console.warn("[KKiaPay Webhook] Impossible d'enregistrer payment_event:", logErr);
      }
    }

    if (!transactionId) {
      console.log("[KKiaPay Webhook] Aucun transactionId dans le payload. Événement ignoré.");
      return NextResponse.json({ received: true, message: "transactionId absent, ignoré." });
    }

    // 3. CONFIRMATION SERVEUR DU PAIEMENT
    // confirmKKiaPayPayment rappelle l'API verify de KKiaPay pour valider la réalité du statut et montant
    const result = await confirmKKiaPayPayment({
      transactionId,
    });

    // Mettre à jour le résultat dans payment_events
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from("payment_events")
          .update({ result: result.status })
          .eq("transaction_id", transactionId);
      } catch {}
    }

    console.log(`[KKiaPay Webhook] Traitement terminé pour tx=${transactionId} -> status: ${result.status}`);

    // Répondre 200 pour acquitter la réception auprès de KKiaPay
    return NextResponse.json({
      received: true,
      status: result.status,
      plan: result.planId,
      expiresAt: result.expiresAt,
    });
  } catch (err: any) {
    console.error("[KKiaPay Webhook] Exception non gérée:", err);
    // Erreur interne 500 pour provoquer un retry de KKiaPay si indisponibilité temporaire
    return NextResponse.json(
      { success: false, error: "Erreur interne webhook" },
      { status: 500 }
    );
  }
}
