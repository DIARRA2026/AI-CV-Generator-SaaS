import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCreditPack, PACK_TO_LEGACY_TIER } from "@/config/payments";
import { livrerPack } from "@/lib/livrerPack";

export const dynamic = "force-dynamic";

/**
 * GET /api/payment-claims
 * Déclarations de paiement de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecté" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from("payment_claims")
    .select("*, credit_packs(nom, credits, prix_fcfa)")
    .eq("compte_id", auth.user.id)
    .eq("compte_type", "user")
    .order("cree_le", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, claims: data ?? [] });
}

/**
 * POST /api/payment-claims
 * Soumettre une déclaration de paiement Wave / Orange Money
 *
 * RÈGLES COMMERCIALES ET SÉCURITÉ :
 * 1. Si la transaction a déjà été confirmée par le webhook Wave -> livraison immédiate et effective des crédits !
 * 2. Si la transaction a été annulée ou a échoué chez Wave -> rejet strict et aucun crédit accordé.
 * 3. Si en attente -> déclaration enregistrée ('en_attente'), les crédits seront délivrés dès que Wave confirmera.
 */
export async function POST(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecté" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const rawPackSlug = body.packSlug || body.packCode || body.pack_code;
  const rawReference = body.referenceTransaction || body.waveReference || body.wave_reference;
  const {
    telephone,
    operateur = "wave",
    screenshotUrl,
    orgId,
  } = body as {
    telephone?: string;
    operateur?: "wave" | "orange_money" | "autre";
    screenshotUrl?: string;
    orgId?: string;
  };

  if (!rawPackSlug) {
    return NextResponse.json({ success: false, message: "packSlug requis" }, { status: 400 });
  }

  const pack = getCreditPack(rawPackSlug);
  if (!pack || pack.prixFcfa <= 0) {
    return NextResponse.json(
      { success: false, message: "Pack payant invalide: " + rawPackSlug },
      { status: 400 }
    );
  }

  const compteId = orgId ?? auth.user.id;
  const compteType = orgId ? "org" : "user";
  const cleanRef = rawReference?.trim() || null;
  const legacyTier = PACK_TO_LEGACY_TIER[pack.slug] || pack.slug;

  // =========================================================================
  // CONTRÔLE PRÉALABLE : VÉRIFICATION D'UNE TRANSACTION WAVE EXISTANTE
  // =========================================================================
  if (cleanRef) {
    const { data: existingTx } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("reference_code", cleanRef)
      .maybeSingle();

    if (existingTx) {
      // 1. Transaction Échouée / Annulée -> REJET STRICT
      if (existingTx.status === "failed" || existingTx.status === "cancelled") {
        console.warn(`[payment-claims] Tentative de réclamation sur transaction Wave échouée (${cleanRef})`);
        return NextResponse.json(
          {
            success: false,
            rejected: true,
            message: "Cette transaction a été annulée ou a échoué chez Wave. Aucun crédit n'a été alloué.",
          },
          { status: 400 }
        );
      }

      // 2. Transaction Déjà Confirmée par Wave -> LIVRAISON IMMÉDIATE DES CRÉDITS
      if (existingTx.status === "completed") {
        console.log(`[payment-claims] Transaction ${cleanRef} déjà confirmée par Wave. Livraison immédiate.`);

        // Créer ou retrouver la réclamation
        const { data: claimData } = await supabaseAdmin
          .from("payment_claims")
          .insert({
            compte_id: compteId,
            compte_type: compteType,
            pack_slug: pack.slug,
            montant_attendu: pack.prixFcfa,
            telephone: telephone?.trim() || null,
            operateur,
            reference_transaction: cleanRef,
            screenshot_url: screenshotUrl || null,
            statut: "en_attente",
          })
          .select()
          .single();

        if (claimData) {
          const delivery = await livrerPack(claimData.id, "webhook");
          return NextResponse.json({
            success: true,
            verified: true,
            claim: claimData,
            delivery,
            message: `Paiement Wave vérifié avec succès ! ${delivery.creditsAccordes || pack.credits} crédits ont été ajoutés à votre compte.`,
          });
        }
      }
    }
  }

  // =========================================================================
  // CAS STANDARD : ENREGISTREMENT DE LA DEMANDE EN ATTENTE DE CONFIRMATION
  // =========================================================================
  const { data, error } = await supabaseAdmin
    .from("payment_claims")
    .insert({
      compte_id: compteId,
      compte_type: compteType,
      pack_slug: pack.slug,
      montant_attendu: pack.prixFcfa,
      telephone: telephone?.trim() || null,
      operateur,
      reference_transaction: cleanRef,
      screenshot_url: screenshotUrl || null,
      statut: "en_attente",
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur lors de la soumission" },
      { status: 500 }
    );
  }

  // Enregistrer le statut d'abonnement 'pending' lié à l'utilisateur authentifié
  const txRef = cleanRef || `WAVE_CLAIM_${data.id.substring(0, 8)}`;
  try {
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: auth.user.id,
        user_email: auth.user.email?.toLowerCase().trim() || null,
        plan_tier: legacyTier,
        amount: pack.prixFcfa,
        currency: "FCFA",
        status: "pending",
        payment_method: operateur === "wave" ? "Wave CI" : operateur,
        phone_number: telephone?.trim() || null,
        transaction_ref: txRef,
        allowed_candidates: pack.sieges ?? 1,
        created_at: new Date().toISOString(),
      },
      { onConflict: "transaction_ref" }
    );

    await supabaseAdmin.from("transactions").upsert(
      {
        user_id: auth.user.id,
        plan_tier: legacyTier,
        amount_xof: pack.prixFcfa,
        provider: operateur,
        phone_number: telephone?.trim() || null,
        reference_code: txRef,
        status: "pending",
      },
      { onConflict: "reference_code" }
    );
  } catch (syncErr) {
    console.warn("[payment-claims] Erreur synchronisation subscription pending:", syncErr);
  }

  return NextResponse.json({
    success: true,
    verified: false,
    claim: data,
    message: "Déclaration enregistrée ! Vos crédits seront effectifs dès que Wave confirmera votre transaction.",
  });
}
