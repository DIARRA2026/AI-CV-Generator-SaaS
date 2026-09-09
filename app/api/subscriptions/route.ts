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

    // 2. Enregistrer la transaction dans public.transactions
    let provider = "wave";
    const pLower = (paymentMethod || "").toLowerCase();
    if (pLower.includes("orange")) provider = "orange";
    else if (pLower.includes("mtn")) provider = "mtn";
    else if (pLower.includes("moov")) provider = "moov";
    else if (pLower.includes("card") || pLower.includes("carte") || pLower.includes("visa")) provider = "card";
    else if (pLower.includes("stripe")) provider = "stripe";
    else if (pLower.includes("paystack")) provider = "paystack";

    const txPayload: any = {
      plan_tier: planTier,
      amount_xof: amount || 0,
      provider,
      phone_number: phoneNumber || null,
      reference_code: transactionRef || `TRX_${Date.now()}`,
      status: "completed",
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
      message: "Souscription synchronisée avec succès avec Supabase Cloud",
      planTier,
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
