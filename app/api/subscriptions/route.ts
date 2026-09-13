import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json(
        { success: false, message: "Supabase non configuré" },
        { status: 503 }
      );
    }

    const body = await request.json();
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

    const isEnterprise =
      planTier === "enterprise30" ||
      planTier === "enterprise75" ||
      planTier === "enterprise200" ||
      planTier === "cyber15";

    const resolvedAccountType = accountType || (isEnterprise ? "business" : "candidate");
    const nowIso = new Date().toISOString();

    // 1. Mettre à jour public.profiles
    const updatePayload: any = {
      plan_tier: planTier,
      account_type: resolvedAccountType,
      updated_at: nowIso,
    };
    if (companyName) updatePayload.company_name = companyName;
    if (phoneNumber) updatePayload.phone = phoneNumber;

    let targetUserId = userId;
    if (targetUserId && /^[0-9a-f-]{36}$/i.test(targetUserId)) {
      await supabase.from("profiles").update(updatePayload).eq("id", targetUserId);
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profile?.id) {
        targetUserId = profile.id;
        await supabase.from("profiles").update(updatePayload).eq("id", profile.id);
      } else {
        await supabase.from("profiles").update(updatePayload).eq("email", cleanEmail);
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

    // 2. Enregistrer dans la table public.subscriptions (Liaison officielle compte ↔ abonnement)
    const subStatus = body.status || "pending";
    const subRecordPayload: any = {
      user_email: cleanEmail,
      plan_tier: planTier,
      amount: amount || 0,
      currency: currency || "FCFA",
      status: subStatus,
      payment_method: paymentMethod || "Wave Mobile Money (CI)",
      phone_number: phoneNumber || null,
      transaction_ref: transactionRef || `WAVE_${Date.now()}`,
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
      const { error: subErr } = await supabase
        .from("subscriptions")
        .upsert(subRecordPayload, { onConflict: "transaction_ref" });
      if (subErr) {
        console.warn("Avertissement insertion subscriptions:", subErr.message);
      }
    } catch (subCatchErr) {
      console.warn("Erreur insertion subscriptions:", subCatchErr);
    }

    // 3. Enregistrer la transaction dans public.transactions
    const txPayload: any = {
      plan_tier: planTier,
      amount_xof: amount || 0,
      provider,
      phone_number: phoneNumber || null,
      reference_code: transactionRef || `TRX_${Date.now()}`,
      status: subStatus === "active" ? "completed" : "pending",
    };
    if (targetUserId && /^[0-9a-f-]{36}$/i.test(targetUserId)) {
      txPayload.user_id = targetUserId;
    }

    const { error: txError } = await supabase.from("transactions").insert(txPayload);
    if (txError) {
      console.warn("Avertissement insertion transaction:", txError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Souscription enregistrée avec succès dans Supabase Cloud",
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

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json(
        { success: false, message: "Supabase non configuré" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const userId = searchParams.get("userId");

    let query = supabase.from("subscriptions").select("*").order("created_at", { ascending: false });

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
