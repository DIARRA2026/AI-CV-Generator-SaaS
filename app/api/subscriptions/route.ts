import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerAuthUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions
 * Enregistre une intention de souscription (Statut PENDING par défaut).
 * Seul un SuperAdmin authentifié peut forcer le statut 'active'.
 * Les activations standards sont opérées exclusivement par le Webhook de paiement.
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Service de données indisponible" },
        { status: 503 }
      );
    }

    const auth = await getServerAuthUser(request);
    const body = await request.json().catch(() => ({}));
    const {
      email,
      userId,
      planTier,
      amount,
      currency = "FCFA",
      paymentMethod = "Mobile Money",
      phoneNumber,
      transactionRef,
      accountType,
      companyName,
    } = body;

    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail || !planTier) {
      return NextResponse.json(
        { success: false, message: "Email et planTier requis" },
        { status: 400 }
      );
    }

    // Protection anti-contournement de paiement :
    // Interdiction stricte aux clients d'injecter le statut "active"
    const requestedStatus = (body.status || "").toLowerCase().trim();
    if (requestedStatus === "active" && !auth.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Action non autorisée. L'activation d'un abonnement est réservée au webhook de paiement validé ou aux administrateurs.",
        },
        { status: 403 }
      );
    }

    const subStatus = auth.isAdmin && requestedStatus === "active" ? "active" : "pending";

    const isEnterprise =
      planTier === "enterprise30" ||
      planTier === "enterprise75" ||
      planTier === "enterprise200" ||
      planTier === "cyber15";

    const resolvedAccountType = accountType || (isEnterprise ? "business" : "candidate");
    const nowIso = new Date().toISOString();

    // 1. Mise à jour du profil : SEUL un admin authentifié ou un webhook peut changer le plan_tier
    let targetUserId = userId;
    if (auth.isAdmin && subStatus === "active") {
      const updatePayload: any = {
        plan_tier: planTier,
        account_type: resolvedAccountType,
        updated_at: nowIso,
      };
      if (companyName) updatePayload.company_name = companyName;
      if (phoneNumber) updatePayload.phone = phoneNumber;

      if (targetUserId && /^[0-9a-f-]{36}$/i.test(targetUserId)) {
        await supabaseAdmin.from("profiles").update(updatePayload).eq("id", targetUserId);
      } else {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (profile?.id) {
          targetUserId = profile.id;
          await supabaseAdmin.from("profiles").update(updatePayload).eq("id", profile.id);
        } else {
          await supabaseAdmin.from("profiles").update(updatePayload).eq("email", cleanEmail);
        }
      }
    } else {
      // Pour les requêtes utilisateurs, on met uniquement à jour les infos non sensibles (téléphone, entreprise)
      const safeProfileUpdate: any = { updated_at: nowIso };
      if (companyName) safeProfileUpdate.company_name = companyName;
      if (phoneNumber) safeProfileUpdate.phone = phoneNumber;

      if (targetUserId && /^[0-9a-f-]{36}$/i.test(targetUserId)) {
        await supabaseAdmin.from("profiles").update(safeProfileUpdate).eq("id", targetUserId);
      }
    }

    let allowedCandidates = 1;
    if (planTier === "enterprise200") allowedCandidates = 200;
    else if (planTier === "enterprise75") allowedCandidates = 75;
    else if (planTier === "enterprise30") allowedCandidates = 30;
    else if (planTier === "cyber15") allowedCandidates = 15;
    else if (planTier === "5000") allowedCandidates = 4;
    else if (planTier === "2500") allowedCandidates = 2;
    else if (planTier === "1500") allowedCandidates = 1;

    let provider = body.provider || "wave";
    const pLower = (paymentMethod || "").toLowerCase();
    if (pLower.includes("orange")) provider = "orange";
    else if (pLower.includes("mtn")) provider = "mtn";
    else if (pLower.includes("card") || pLower.includes("carte")) provider = "card";
    else if (pLower.includes("wave")) provider = "wave";

    // 2. Enregistrement dans public.subscriptions
    const subRecordPayload: any = {
      user_email: cleanEmail,
      plan_tier: planTier,
      amount: amount || 0,
      currency: currency || "FCFA",
      status: subStatus,
      payment_method: paymentMethod || "Wave Mobile Money (CI)",
      phone_number: phoneNumber || null,
      transaction_ref: transactionRef || `SUB_${crypto.randomUUID()}`,
      allowed_candidates: allowedCandidates,
      metadata: {
        accountType: resolvedAccountType,
        companyName: companyName || null,
        provider,
      },
      created_at: nowIso,
      activated_at: subStatus === "active" ? nowIso : null,
    };

    if (targetUserId && /^[0-9a-f-]{36}$/i.test(targetUserId)) {
      subRecordPayload.user_id = targetUserId;
    }

    try {
      const { error: subErr } = await supabaseAdmin
        .from("subscriptions")
        .upsert(subRecordPayload, { onConflict: "transaction_ref" });
      if (subErr) {
        console.warn("Avertissement insertion subscriptions:", subErr.message);
      }
    } catch (subCatchErr) {
      console.warn("Erreur insertion subscriptions:", subCatchErr);
    }

    // 3. Enregistrement dans public.transactions
    const txPayload: any = {
      plan_tier: planTier,
      amount_xof: amount || 0,
      provider,
      phone_number: phoneNumber || null,
      reference_code: transactionRef || `TRX_${crypto.randomUUID()}`,
      status: subStatus === "active" ? "completed" : "pending",
    };
    if (targetUserId && /^[0-9a-f-]{36}$/i.test(targetUserId)) {
      txPayload.user_id = targetUserId;
    }

    const { error: txError } = await supabaseAdmin.from("transactions").insert(txPayload);
    if (txError) {
      console.warn("Avertissement insertion transaction:", txError.message);
    }

    return NextResponse.json({
      success: true,
      message: subStatus === "active"
        ? "Souscription activée avec succès par l'administrateur."
        : "Intention de souscription enregistrée en attente de paiement.",
      planTier,
      status: subStatus,
      accountType: resolvedAccountType,
    });
  } catch (err: any) {
    console.error("Erreur POST /api/subscriptions:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscriptions
 * Consultation sécurisée des souscriptions (Propriétaire ou SuperAdmin exclusivement)
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Service de données indisponible" },
        { status: 503 }
      );
    }

    const auth = await getServerAuthUser(request);
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const userId = searchParams.get("userId");

    // Contrôle d'autorisation strict
    const isAuthorized =
      auth.authenticated &&
      (auth.isAdmin ||
        (email && auth.user?.email === email) ||
        (userId && auth.user?.id === userId));

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Accès refusé aux données de souscription" },
        { status: 403 }
      );
    }

    let query = supabaseAdmin.from("subscriptions").select("*").order("created_at", { ascending: false });

    if (userId && /^[0-9a-f-]{36}$/i.test(userId)) {
      if (email) {
        query = query.or(`user_id.eq.${userId},user_email.eq.${email}`);
      } else {
        query = query.eq("user_id", userId);
      }
    } else if (email) {
      query = query.eq("user_email", email);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, subscriptions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Erreur serveur" }, { status: 500 });
  }
}
