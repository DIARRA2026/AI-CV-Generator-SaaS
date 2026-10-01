import { supabaseAdmin } from "./supabaseAdmin";
import { LivraisonResult } from "./types";
import { getCreditPack, getCreditPackByAmount, PACK_TO_LEGACY_TIER } from "@/config/payments";

/**
 * Synchronise l'abonnement et le profil utilisateur après validation et livraison effective des crédits.
 */
async function syncDeliveryState(claim: any) {
  if (!supabaseAdmin || !claim || claim.compte_type !== "user") return;

  try {
    const userId = claim.compte_id;
    const packSlug = claim.pack_slug;
    const legacyTier = PACK_TO_LEGACY_TIER[packSlug] || packSlug;
    const txRef = claim.reference_transaction || `CLAIM_${claim.id}`;

    // Récupérer l'email de l'utilisateur
    let userEmail: string | null = null;
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    userEmail = prof?.email || null;

    // 1. Mise à jour de subscriptions -> status: 'active'
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          user_email: userEmail || "client@moncv.ai",
          plan_tier: legacyTier,
          amount: claim.montant_attendu,
          currency: "FCFA",
          status: "active",
          payment_method: claim.operateur === "wave" ? "Wave CI" : claim.operateur,
          phone_number: claim.telephone || null,
          transaction_ref: txRef,
          activated_at: new Date().toISOString(),
        },
        { onConflict: "transaction_ref" }
      );

    // 2. Mise à jour de profiles -> plan_tier
    await supabaseAdmin
      .from("profiles")
      .update({
        plan_tier: legacyTier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // 3. Mise à jour de transactions -> status: 'completed'
    await supabaseAdmin
      .from("transactions")
      .upsert(
        {
          user_id: userId,
          plan_tier: legacyTier,
          amount_xof: claim.montant_attendu,
          provider: claim.operateur || "wave",
          phone_number: claim.telephone || null,
          reference_code: txRef,
          status: "completed",
        },
        { onConflict: "reference_code" }
      );
  } catch (err) {
    console.warn("[livrerPack] syncDeliveryState warning:", err);
  }
}

/**
 * Synchronise l'abonnement et la transaction après rejet / annulation / échec de paiement.
 * RÈGLE STRICTE : AUCUN CRÉDIT N'EST ACCORDÉ.
 */
async function syncRejectionState(claim: any, motif: string) {
  if (!supabaseAdmin || !claim) return;

  try {
    const txRef = claim.reference_transaction || `CLAIM_${claim.id}`;

    // 1. Annulation dans subscriptions
    if (claim.reference_transaction) {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "cancelled",
          metadata: { rejection_reason: motif, rejected_at: new Date().toISOString() },
        })
        .eq("transaction_ref", claim.reference_transaction);
    }

    // 2. Statut failed dans transactions
    if (claim.reference_transaction) {
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
          metadata: { failure_reason: motif, failed_at: new Date().toISOString() },
        })
        .eq("reference_code", claim.reference_transaction);
    }
  } catch (err) {
    console.warn("[livrerPack] syncRejectionState warning:", err);
  }
}

/**
 * MONCV.AI - livrerPack()
 * ============================================================
 * Point d'entrée UNIQUE et IDEMPOTENT pour livrer un pack après paiement validé.
 * RÈGLE D'OR : La créditation des crédits est effective et garantie dès le paiement avec succès.
 *
 * @param claimId - UUID de la déclaration de paiement (payment_claims.id)
 * @param source  - 'admin' | 'webhook'
 */
export async function livrerPack(
  claimId: string,
  source: "admin" | "webhook"
): Promise<LivraisonResult> {
  if (!supabaseAdmin) {
    return { success: false, message: "Service de données indisponible" };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("livrer_pack_pg", {
      p_claim_id: claimId,
      p_admin_id: null,
    });

    if (error) {
      console.error("[livrerPack] Erreur RPC livrer_pack_pg:", error);
      return {
        success: false,
        message: error.message || "Erreur lors de la livraison du pack",
      };
    }

    const result = data as {
      success: boolean;
      message: string;
      credits_accordes?: number;
      pack_slug?: string;
      idempotent?: boolean;
    };

    if (!result.success) {
      return { success: false, message: result.message };
    }

    // Récupérer la déclaration pour synchroniser l'abonnement et le profil
    const { data: claim } = await supabaseAdmin
      .from("payment_claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();

    if (claim) {
      await syncDeliveryState(claim);
    }

    console.log(
      `[livrerPack] Pack livré avec succès - claim=${claimId} source=${source} credits=${result.credits_accordes} pack=${result.pack_slug} idempotent=${result.idempotent ?? false}`
    );

    return {
      success: true,
      message: result.message,
      creditsAccordes: result.credits_accordes,
      packSlug: result.pack_slug,
      idempotent: result.idempotent ?? false,
    };
  } catch (err: any) {
    console.error("[livrerPack] Exception:", err);
    return {
      success: false,
      message: err?.message || "Erreur interne lors de la livraison",
    };
  }
}

/**
 * livrerPackAdmin() - Validation par un administrateur
 */
export async function livrerPackAdmin(
  claimId: string,
  adminId: string
): Promise<LivraisonResult> {
  if (!supabaseAdmin) {
    return { success: false, message: "Service de données indisponible" };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("livrer_pack_pg", {
      p_claim_id: claimId,
      p_admin_id: adminId,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const result = data as {
      success: boolean;
      message: string;
      credits_accordes?: number;
      pack_slug?: string;
      idempotent?: boolean;
    };

    if (!result.success) {
      return { success: false, message: result.message };
    }

    // Synchroniser l'état d'abonnement et profil
    const { data: claim } = await supabaseAdmin
      .from("payment_claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();

    if (claim) {
      await syncDeliveryState(claim);
    }

    return {
      success: result.success,
      message: result.message,
      creditsAccordes: result.credits_accordes,
      packSlug: result.pack_slug,
      idempotent: result.idempotent ?? false,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Erreur interne" };
  }
}

/**
 * rejeterClaim() - Rejeter une déclaration avec motif
 * RÈGLE D'OR : La créditation du compte est STRICTEMENT bloquée.
 */
export async function rejeterClaim(
  claimId: string,
  adminId: string,
  motif: string = "Référence introuvable ou montant incorrect"
): Promise<{ success: boolean; message: string }> {
  if (!supabaseAdmin) {
    return { success: false, message: "Service de données indisponible" };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("rejeter_claim", {
      p_claim_id: claimId,
      p_admin_id: adminId,
      p_motif: motif,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    // Synchroniser l'annulation d'abonnement et échec de transaction
    const { data: claim } = await supabaseAdmin
      .from("payment_claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();

    if (claim) {
      await syncRejectionState(claim, motif);
    }

    console.log(`[rejeterClaim] Déclaration ${claimId} rejetée. Créditation bloquée.`);
    return data as { success: boolean; message: string };
  } catch (err: any) {
    return { success: false, message: err?.message || "Erreur interne" };
  }
}

/**
 * livrerPaiementWaveDirect()
 * ============================================================
 * Appel automatique depuis le Webhook Wave lorsqu'un paiement réussit directement.
 * Crée la déclaration si nécessaire, crédite les crédits de façon effective et génère la facture.
 */
export async function livrerPaiementWaveDirect({
  userId,
  packSlug,
  amount,
  transactionId,
  phone,
}: {
  userId: string;
  packSlug?: string | null;
  amount: number;
  transactionId: string;
  phone?: string | null;
}): Promise<LivraisonResult> {
  if (!supabaseAdmin) {
    return { success: false, message: "Service DB indisponible" };
  }

  // 1. Vérifier si un claim existe déjà pour cette transaction
  const { data: existingClaim } = await supabaseAdmin
    .from("payment_claims")
    .select("*")
    .eq("reference_transaction", transactionId)
    .maybeSingle();

  if (existingClaim) {
    if (existingClaim.statut === "valide") {
      return { success: true, message: "Paiement déjà validé", idempotent: true };
    }
    if (existingClaim.statut === "rejete") {
      return { success: false, message: "Paiement préalablement rejeté" };
    }
    return livrerPack(existingClaim.id, "webhook");
  }

  // 2. Déterminer le pack approprié
  const resolvedPack =
    (packSlug ? getCreditPack(packSlug) : null) ||
    getCreditPackByAmount(amount) ||
    getCreditPack("evolution");

  const finalSlug = resolvedPack?.slug || "evolution";
  const finalAmount = amount > 0 ? amount : resolvedPack?.prixFcfa || 2500;

  // 3. Créer le claim automatiquement
  const { data: newClaim, error: insertErr } = await supabaseAdmin
    .from("payment_claims")
    .insert({
      compte_id: userId,
      compte_type: "user",
      pack_slug: finalSlug,
      montant_attendu: finalAmount,
      telephone: phone || null,
      operateur: "wave",
      reference_transaction: transactionId,
      statut: "en_attente",
    })
    .select()
    .single();

  if (insertErr || !newClaim) {
    console.error("[livrerPaiementWaveDirect] Erreur création claim direct:", insertErr);
    // Fallback direct de créditation si contrainte DB
    try {
      await supabaseAdmin.rpc("crediter_lot", {
        p_compte: userId,
        p_type: "user",
        p_pack_slug: finalSlug,
        p_credits: resolvedPack?.credits || 250,
        p_validite: resolvedPack?.validiteMois || 12,
        p_origine: "achat",
        p_reference: `WAVE_${transactionId}`,
      });

      await syncDeliveryState({
        compte_id: userId,
        compte_type: "user",
        pack_slug: finalSlug,
        montant_attendu: finalAmount,
        telephone: phone,
        operateur: "wave",
        reference_transaction: transactionId,
      });

      return {
        success: true,
        message: `${resolvedPack?.credits || 250} crédits accordés avec succès`,
        creditsAccordes: resolvedPack?.credits || 250,
        packSlug: finalSlug,
      };
    } catch (fbErr: any) {
      return { success: false, message: fbErr?.message || "Échec créditation fallback" };
    }
  }

  // 4. Livrer le pack via la procédure Postgres idempotente
  return livrerPack(newClaim.id, "webhook");
}

/**
 * rejeterPaiementWaveDirect()
 * ============================================================
 * Appel automatique depuis le Webhook Wave lors d'un échec, annulation ou expiration.
 * RÈGLE STRICTE : AUCUN CRÉDIT N'EST CRÉDITÉ. La demande et la transaction sont marquées échouées.
 */
export async function rejeterPaiementWaveDirect({
  transactionId,
  clientRef,
  motif = "Paiement Wave échoué, annulé ou expiré",
}: {
  transactionId?: string | null;
  clientRef?: string | null;
  motif?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!supabaseAdmin) {
    return { success: false, message: "Service DB indisponible" };
  }

  console.log(`[rejeterPaiementWaveDirect] Traitement rejet Wave : tx=${transactionId} ref=${clientRef} motif="${motif}"`);

  let targetClaim: any = null;

  // Recherche du claim par référence de transaction
  if (transactionId) {
    const { data: claimByTx } = await supabaseAdmin
      .from("payment_claims")
      .select("*")
      .eq("reference_transaction", transactionId)
      .maybeSingle();

    if (claimByTx) targetClaim = claimByTx;
  }

  // Recherche du claim par clientRef
  if (!targetClaim && clientRef) {
    const { data: claimById } = await supabaseAdmin
      .from("payment_claims")
      .select("*")
      .eq("id", clientRef)
      .maybeSingle();

    if (claimById) {
      targetClaim = claimById;
    } else {
      const { data: claimByUser } = await supabaseAdmin
        .from("payment_claims")
        .select("*")
        .eq("compte_id", clientRef)
        .eq("statut", "en_attente")
        .order("cree_le", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (claimByUser) targetClaim = claimByUser;
    }
  }

  if (targetClaim) {
    await rejeterClaim(targetClaim.id, "system", motif);
  }

  // Annuler toute souscription et transaction correspondante
  if (transactionId) {
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "cancelled",
        metadata: { failure_reason: motif, updated_at: new Date().toISOString() },
      })
      .eq("transaction_ref", transactionId);

    await supabaseAdmin
      .from("transactions")
      .update({
        status: "failed",
        metadata: { failure_reason: motif, updated_at: new Date().toISOString() },
      })
      .eq("reference_code", transactionId);
  }

  return {
    success: true,
    message: "Échec/annulation enregistrée. Créditation strictement bloquée.",
  };
}
