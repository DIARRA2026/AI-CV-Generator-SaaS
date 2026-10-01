import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { livrerPack } from "@/lib/livrerPack";
import { getCreditPack } from "@/config/payments";

export const dynamic = "force-dynamic";

/**
 * MONCV.AI - WEBHOOK OFFICIEL WAVE CÔTE D'IVOIRE
 * POST /api/webhooks/wave
 *
 * Rôles :
 * 1. Valide la signature cryptographique Wave HMAC-SHA256 (si secret configuré)
 * 2. Confirme automatiquement la transaction et crédite l'utilisateur
 * 3. Met à jour le statut d'abonnement dans Supabase (status: 'active')
 * 4. Débloque immédiatement l'accès au tableau de bord
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.WAVE_WEBHOOK_SECRET?.trim();

    // 1. Vérification de la signature cryptographique Wave (si secret configuré)
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
    const eventType = event.type || event.event || "";
    const eventData = event.data || event;

    console.log(`[Wave Webhook] Événement reçu: ${eventType}`, {
      id: event.id,
      transaction_id: eventData.id || eventData.transaction_id,
      amount: eventData.amount,
      client_reference: eventData.client_reference,
    });

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "DB indisponible" }, { status: 503 });
    }

    // Identifiants extraits du payload Wave
    const transactionId = (eventData.id || eventData.transaction_id || "").toString().trim();
    const clientRef = (eventData.client_reference || "").toString().trim();
    const amountNum = Number(eventData.amount || 0);
    const wavePhone = eventData.customer?.mobile || eventData.phone || null;

    // Ne traiter que les succès
    const isSuccess =
      eventType.includes("completed") ||
      eventType.includes("succeeded") ||
      eventData.payment_status === "succeeded" ||
      eventData.status === "complete" ||
      eventData.status === "succeeded";

    if (!isSuccess) {
      console.log(`[Wave Webhook] Événement non concluant (${eventType}). Statut ignoré.`);
      return NextResponse.json({ success: true, message: "Événement non retenu" });
    }

    // 2. Recherche de la réclamation de paiement correspondante
    let claimId: string | null = null;
    let userId: string | null = null;
    let packSlug: string | null = null;

    // A. Recherche par référence de transaction exacte
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

    // B. Recherche par client_reference (ID de claim ou ID utilisateur)
    if (!claimId && clientRef) {
      // Cas 1 : clientRef est l'UUID du claim
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
        // Cas 2 : clientRef est le compte_id (user.id) avec une déclaration en attente
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
          userId = clientRef;
        }
      }
    }

    // C. Si un claim a été identifié, exécuter la livraison automatique
    if (claimId) {
      const deliveryResult = await livrerPack(claimId, "webhook");
      console.log(`[Wave Webhook] Résultat livrerPack pour claim ${claimId}:`, deliveryResult);
    }

    // 3. Mise à jour de l'abonnement dans public.subscriptions (Statut: active)
    if (userId) {
      const resolvedPack = packSlug ? getCreditPack(packSlug) : null;
      const finalAmount = amountNum > 0 ? amountNum : resolvedPack?.prixFcfa || 2500;
      const finalRef = transactionId || `WAVE_TX_${Date.now()}`;

      // A. Mettre à jour / insérer l'abonnement actif dans Supabase
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            plan_tier: packSlug || "evolution",
            amount: finalAmount,
            currency: "FCFA",
            status: "active",
            payment_method: "Wave CI",
            phone_number: wavePhone,
            transaction_ref: finalRef,
            activated_at: new Date().toISOString(),
          },
          { onConflict: "transaction_ref" }
        );

      if (subError) {
        console.warn("[Wave Webhook] Erreur mise à jour subscription:", subError);
      }

      // B. Mettre à jour le profil utilisateur (plan_tier)
      await supabaseAdmin
        .from("profiles")
        .update({
          plan_tier: packSlug || "evolution",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      // C. Enregistrer la transaction terminée
      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        plan_tier: packSlug || "evolution",
        amount_xof: finalAmount,
        provider: "wave",
        phone_number: wavePhone,
        reference_code: finalRef,
        status: "completed",
      });

      console.log(`[Wave Webhook] Compte ${userId} mis à niveau avec succès vers le pack ${packSlug || "evolution"}.`);
    }

    return NextResponse.json({
      success: true,
      received: true,
      claimId,
      userId,
      packSlug,
    });
  } catch (err: any) {
    console.error("[Wave Webhook] Exception lors du traitement:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erreur interne webhook" },
      { status: 500 }
    );
  }
}
