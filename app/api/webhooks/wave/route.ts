import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  livrerPack,
  livrerPaiementWaveDirect,
  rejeterPaiementWaveDirect,
} from "@/lib/livrerPack";
import { getCreditPack, getCreditPackByAmount } from "@/config/payments";

export const dynamic = "force-dynamic";

/**
 * MONCV.AI - WEBHOOK OFFICIEL WAVE CÔTE D'IVOIRE
 * POST /api/webhooks/wave
 *
 * RÈGLES COMMERCIALES ET SÉCURITÉ :
 * 1. Paiement RÉUSSI (completed / succeeded) :
 *    - Créditation immédiate et effective des crédits sur le compte utilisateur (Postgres RPC crediter_lot).
 *    - Statut d'abonnement activé ('active') dans public.subscriptions.
 *    - Mise à jour du profil utilisateur (plan_tier).
 *    - Émission de la facture normalisée OHADA.
 *
 * 2. Paiement REFUSÉ, ANNULÉ ou ÉCHOUÉ (cancelled / failed / expired) :
 *    - BLOQUER STRICTEMENT toute allocation de crédits (0 crédit).
 *    - Marquer la déclaration de paiement comme rejetée ('rejete').
 *    - Marquer l'abonnement en statut annulé ('cancelled').
 *    - Marquer la transaction en statut échoué ('failed').
 *    - Empêcher tout surclassement de compte.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.WAVE_WEBHOOK_SECRET?.trim();

    // 1. Vérification de la signature cryptographique Wave HMAC-SHA256 (si secret configuré)
    if (webhookSecret && webhookSecret !== "whsec_wave_secret_signature_ici") {
      const signatureHeader = request.headers.get("wave-signature");
      if (!signatureHeader) {
        console.warn("[Wave Webhook] Signature Wave manquante dans les en-têtes.");
        return NextResponse.json({ success: false, error: "Signature manquante" }, { status: 401 });
      }

      // Format Wave : t=timestamp,v1=hash
      const parts = signatureHeader.split(",");
      const timestamp = parts.find((p) => p.startsWith("t="))?.replace("t=", "");
      const receivedHash = parts.find((p) => p.startsWith("v1="))?.replace("v1=", "");

      if (timestamp && receivedHash) {
        const payloadToSign = `${timestamp}.${rawBody}`;
        const computedHash = crypto
          .createHmac("sha256", webhookSecret)
          .update(payloadToSign)
          .digest("hex");

        if (computedHash !== receivedHash) {
          console.warn("[Wave Webhook] Signature invalide reçue.");
          return NextResponse.json({ success: false, error: "Signature invalide" }, { status: 403 });
        }
      }
    }

    const event = JSON.parse(rawBody || "{}");
    const eventType = (event.type || event.event || "").toString().toLowerCase();
    const eventData = event.data || event;

    // Identifiants extraits du payload Wave
    const transactionId = (eventData.id || eventData.transaction_id || "").toString().trim();
    const clientRef = (eventData.client_reference || "").toString().trim();
    const amountNum = Number(eventData.amount || 0);
    const wavePhone = eventData.customer?.mobile || eventData.phone || null;

    console.log(`[Wave Webhook] Événement reçu: "${eventType}"`, {
      id: event.id,
      transactionId,
      amount: amountNum,
      clientRef,
      payment_status: eventData.payment_status,
      status: eventData.status,
    });

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "DB indisponible" }, { status: 503 });
    }

    // Qualification du résultat : SUCCÈS vs ÉCHEC / ANNULATION
    const isFailure =
      eventType.includes("cancelled") ||
      eventType.includes("canceled") ||
      eventType.includes("failed") ||
      eventType.includes("expired") ||
      eventType === "checkout.session.cancelled" ||
      eventType === "checkout.session.expired" ||
      eventType === "payment.failed" ||
      eventData.payment_status === "failed" ||
      eventData.payment_status === "cancelled" ||
      eventData.payment_status === "canceled" ||
      eventData.status === "cancelled" ||
      eventData.status === "canceled" ||
      eventData.status === "failed" ||
      eventData.status === "expired" ||
      eventData.status === "error";

    const isSuccess =
      !isFailure &&
      (eventType.includes("completed") ||
        eventType.includes("succeeded") ||
        eventType === "payment.succeeded" ||
        eventType === "checkout.session.completed" ||
        eventData.payment_status === "succeeded" ||
        eventData.status === "complete" ||
        eventData.status === "succeeded" ||
        eventData.status === "successful");

    // =========================================================================
    // CAS 1 : PAIEMENT REFUSÉ, ANNULÉ OU ÉCHOUÉ -> BLOCAGE STRICT DES CRÉDITS
    // =========================================================================
    if (isFailure) {
      console.warn(`[Wave Webhook] ❌ PAIEMENT ÉCHOUÉ / ANNULÉ (${eventType}). BLOCAGE STRICT DE LA CRÉDITATION.`);

      const rejectResult = await rejeterPaiementWaveDirect({
        transactionId: transactionId || null,
        clientRef: clientRef || null,
        motif: `Événement Wave: ${eventType} (statut: ${eventData.status || eventData.payment_status || "inconnu"})`,
      });

      return NextResponse.json({
        success: true,
        action: "blocked",
        message: "Paiement refusé ou annulé. Créditation du compte strictement bloquée.",
        details: rejectResult,
      });
    }

    // =========================================================================
    // CAS 2 : PAIEMENT RÉUSSI -> CRÉDITATION EFFECTIVE IMMÉDIATE DU COMPTE
    // =========================================================================
    if (isSuccess) {
      console.log(`[Wave Webhook] ✅ PAIEMENT RÉUSSI (${eventType}). CRÉDITATION EFFECTIVE DU COMPTE.`);

      let claimId: string | null = null;
      let userId: string | null = null;
      let packSlug: string | null = null;

      // A. Recherche par transactionId exacte dans payment_claims
      if (transactionId) {
        const { data: claimByRef } = await supabaseAdmin
          .from("payment_claims")
          .select("*")
          .eq("reference_transaction", transactionId)
          .maybeSingle();

        if (claimByRef) {
          claimId = claimByRef.id;
          userId = claimByRef.compte_id;
          packSlug = claimByRef.pack_slug;
        }
      }

      // B. Recherche par clientRef (UUID de claim ou UUID d'utilisateur)
      if (!claimId && clientRef) {
        const { data: claimById } = await supabaseAdmin
          .from("payment_claims")
          .select("*")
          .eq("id", clientRef)
          .maybeSingle();

        if (claimById) {
          claimId = claimById.id;
          userId = claimById.compte_id;
          packSlug = claimById.pack_slug;
        } else {
          // Vérifier si clientRef est un utilisateur avec réclamation en attente
          const { data: claimByUser } = await supabaseAdmin
            .from("payment_claims")
            .select("*")
            .eq("compte_id", clientRef)
            .eq("statut", "en_attente")
            .order("cree_le", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (claimByUser) {
            claimId = claimByUser.id;
            userId = claimByUser.compte_id;
            packSlug = claimByUser.pack_slug;
          } else {
            // clientRef est directement l'UUID de l'utilisateur
            userId = clientRef;
          }
        }
      }

      // C. Si aucune réclamation trouvée mais pack déductible par le montant
      if (!packSlug && amountNum > 0) {
        const matchedPack = getCreditPackByAmount(amountNum);
        if (matchedPack) packSlug = matchedPack.slug;
      }

      // D. LIVRAISON EFFECTIVE
      let deliveryResult: any = null;

      if (claimId) {
        // Cas D1 : Réclamation existante -> Livrer via procédure Postgres
        deliveryResult = await livrerPack(claimId, "webhook");
      } else if (userId) {
        // Cas D2 : Paiement direct sans réclamation préalable -> Créer et livrer immédiatement
        deliveryResult = await livrerPaiementWaveDirect({
          userId,
          packSlug: packSlug || "evolution",
          amount: amountNum,
          transactionId: transactionId || `WAVE_${Date.now()}`,
          phone: wavePhone,
        });
      } else {
        // Cas D3 : Utilisateur non encore rattaché -> Enregistrer la transaction complétée
        // pour réclamation immédiate dès que l'utilisateur entrera sa référence
        const finalRef = transactionId || `WAVE_PENDING_${Date.now()}`;
        await supabaseAdmin.from("transactions").upsert(
          {
            plan_tier: packSlug || "evolution",
            amount_xof: amountNum,
            provider: "wave",
            phone_number: wavePhone,
            reference_code: finalRef,
            status: "completed",
          },
          { onConflict: "reference_code" }
        );

        console.log(`[Wave Webhook] Transaction ${finalRef} enregistrée en attente de réclamation utilisateur.`);
        return NextResponse.json({
          success: true,
          action: "recorded",
          message: "Transaction enregistrée avec succès. En attente de réclamation par l'utilisateur.",
        });
      }

      console.log(`[Wave Webhook] Résultat de créditation effective :`, deliveryResult);

      return NextResponse.json({
        success: true,
        action: "credited",
        message: "Paiement validé et crédits alloués avec succès sur le compte.",
        claimId,
        userId,
        delivery: deliveryResult,
      });
    }

    // =========================================================================
    // CAS 3 : ÉVÉNEMENT NEUTRE / INCONNU -> AUCUNE MODIFICATION DE CRÉDITS
    // =========================================================================
    console.log(`[Wave Webhook] Événement neutre ou non concluant (${eventType}). Aucun crédit alloué.`);
    return NextResponse.json({
      success: true,
      action: "ignored",
      message: "Événement non retenu, aucun crédit alloué.",
    });
  } catch (err: any) {
    console.error("[Wave Webhook] Exception lors du traitement :", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erreur interne webhook" },
      { status: 500 }
    );
  }
}
