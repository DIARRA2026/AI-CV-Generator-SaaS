import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { LigdiCashClient } from "@/lib/ligdicash";
import { getPaymentPlanConfig } from "@/config/payments";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PlanTier } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      planTier,
      userId,
      userEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      companyName,
    } = body;

    const cleanEmail = (userEmail || body?.customerEmail || "").toLowerCase().trim();
    if (!cleanEmail || !planTier) {
      return NextResponse.json(
        { success: false, message: "L'adresse email et la formule choisie sont obligatoires." },
        { status: 400 }
      );
    }

    const planConfig = getPaymentPlanConfig(planTier as PlanTier);
    if (!planConfig) {
      return NextResponse.json(
        { success: false, message: `La formule '${planTier}' n'est pas reconnue.` },
        { status: 400 }
      );
    }

    // Récupération de l'URL absolue de l'application
    const origin =
      request.headers.get("origin") ||
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const transactionRef = `TRX_LC_${crypto.randomUUID()}`;

    // 1. Appel API LigdiCash pour générer la facture et l'URL de redirection
    const invoiceResult = await LigdiCashClient.createInvoice({
      planTier: planConfig.id,
      planName: planConfig.name,
      planDescription: planConfig.description,
      amount: planConfig.amount,
      transactionRef,
      userId: userId || "",
      customerEmail: cleanEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      appUrl: origin,
    });

    if (!invoiceResult.success || !invoiceResult.checkoutUrl) {
      return NextResponse.json(
        {
          success: false,
          message: invoiceResult.message || "Impossible d'initialiser le paiement LigdiCash.",
        },
        { status: 502 }
      );
    }

    const nowIso = new Date().toISOString();
    const invoiceToken = invoiceResult.invoiceToken || null;
    const isEnterprise =
      planTier === "enterprise30" ||
      planTier === "enterprise75" ||
      planTier === "enterprise200" ||
      planTier === "cyber15";

    // 2. Enregistrement en base de données Supabase (Statut: pending)
    if (supabaseAdmin) {
      try {
        // A. Table subscriptions
        const subPayload: any = {
          user_email: cleanEmail,
          plan_tier: planConfig.id,
          amount: planConfig.amount,
          currency: "FCFA",
          status: "pending",
          payment_method: "LigdiCash Mobile Money",
          phone_number: customerPhone || null,
          transaction_ref: transactionRef,
          external_token: invoiceToken,
          allowed_candidates: planConfig.allowedCandidates,
          metadata: {
            provider: "ligdicash",
            companyName: companyName || null,
            accountType: isEnterprise ? "business" : "candidate",
            invoiceToken,
          },
          created_at: nowIso,
        };
        if (userId && /^[0-9a-f-]{36}$/i.test(userId)) {
          subPayload.user_id = userId;
        }

        await supabaseAdmin.from("subscriptions").insert(subPayload);

        // B. Table transactions
        const txPayload: any = {
          plan_tier: planConfig.id,
          amount_xof: planConfig.amount,
          provider: "ligdicash",
          phone_number: customerPhone || null,
          reference_code: transactionRef,
          external_token: invoiceToken,
          status: "pending",
          created_at: nowIso,
        };
        if (userId && /^[0-9a-f-]{36}$/i.test(userId)) {
          txPayload.user_id = userId;
        }

        await supabaseAdmin.from("transactions").insert(txPayload);
      } catch (dbErr) {
        console.warn("Avertissement enregistrement pré-transaction Supabase :", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: invoiceResult.checkoutUrl,
      transactionRef,
      invoiceToken,
      amount: planConfig.amount,
      planTier: planConfig.id,
    });
  } catch (error: any) {
    console.error("Erreur route POST /api/payments/ligdicash/checkout :", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne lors de la création de la transaction." },
      { status: 500 }
    );
  }
}
