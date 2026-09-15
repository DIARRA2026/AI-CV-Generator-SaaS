import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LigdiCashClient } from "@/lib/ligdicash";
import { getPaymentPlanConfig } from "@/config/payments";
import { PlanTier } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Validation du jeton de session SuperAdmin (HMAC SHA-256)
 */
function verifyAdminRequest(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("moncv_admin_token")?.value;
    const token = (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) || cookieToken;

    if (!token) return false;

    const secret =
      process.env.ADMIN_SECRET_KEY?.trim() ||
      "b8f3d4a2c91e057f8623b49e1a75c60238d9f1e4a7c2b5d80361e94f72a5b8c1";

    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [email, timestampStr, hmac] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // 24 heures de validité
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return false;

    const expectedHmac = crypto
      .createHmac("sha256", secret)
      .update(`${email}:${timestampStr}`)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(expectedHmac, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/transactions
 * Récupère l'intégralité des transactions et abonnements enregistrés dans Supabase
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ success: false, message: "Accès non autorisé" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Base de données Supabase indisponible" }, { status: 503 });
  }

  try {
    // 1. Récupérer toutes les transactions ordonnées par date décroissante
    const { data: transactionsData, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);

    if (txError) {
      console.warn("Erreur requête transactions Supabase:", txError);
    }

    // 2. Récupérer tous les abonnements
    const { data: subscriptionsData, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);

    if (subError) {
      console.warn("Erreur requête subscriptions Supabase:", subError);
    }

    // Associer les emails d'abonnements aux transactions si user_email est manquant
    const subEmailByRef = new Map<string, string>();
    (subscriptionsData || []).forEach((s: any) => {
      if (s.transaction_ref && s.user_email) {
        subEmailByRef.set(s.transaction_ref, s.user_email);
      }
    });

    const enrichedTransactions = (transactionsData || []).map((tx: any) => {
      return {
        id: tx.id,
        userId: tx.user_id,
        userEmail: tx.user_email || subEmailByRef.get(tx.reference_code) || "Client Mobile Money",
        planTier: tx.plan_tier as PlanTier,
        amountXof: tx.amount_xof || tx.amount || 0,
        currency: tx.currency || "FCFA",
        provider: tx.provider || "ligdicash",
        phoneNumber: tx.phone_number || "—",
        referenceCode: tx.reference_code,
        externalToken: tx.external_token,
        status: tx.status,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        metadata: tx.metadata || {},
      };
    });

    // 3. Calculer les statistiques réelles
    let totalVolumeXof = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    enrichedTransactions.forEach((t: any) => {
      if (t.status === "completed") {
        completedCount++;
        totalVolumeXof += Number(t.amountXof) || 0;
      } else if (t.status === "pending") {
        pendingCount++;
      } else {
        failedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      transactions: enrichedTransactions,
      subscriptions: subscriptionsData || [],
      stats: {
        total: enrichedTransactions.length,
        completed: completedCount,
        pending: pendingCount,
        failed: failedCount,
        totalVolumeXof,
      },
    });
  } catch (err: any) {
    console.error("Erreur GET /api/admin/transactions:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/transactions
 * Actions administrateur : re-vérification LigdiCash ou validation manuelle forcée
 */
export async function POST(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ success: false, message: "Accès non autorisé" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Base de données Supabase indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { action, referenceCode, token, userEmail, planTier } = body;

    // A. Re-vérifier une transaction auprès de l'API LigdiCash
    if (action === "reverify") {
      if (!token && !referenceCode) {
        return NextResponse.json({ success: false, message: "Token ou Référence manquante" }, { status: 400 });
      }

      let statusResult: any = null;

      if (token) {
        statusResult = await LigdiCashClient.confirmInvoice(token);
      }

      if (!statusResult || !statusResult.status) {
        return NextResponse.json({
          success: false,
          message: "Impossible d'obtenir le statut auprès de LigdiCash pour ce jeton.",
        });
      }

      const isPaid = statusResult.status.toLowerCase() === "completed";
      const newStatus = isPaid ? "completed" : statusResult.status.toLowerCase();

      // Mettre à jour la transaction dans Supabase
      await supabaseAdmin
        .from("transactions")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .or(`reference_code.eq.${referenceCode},external_token.eq.${token}`);

      // Si payé, activer l'abonnement
      if (isPaid) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("transaction_ref", referenceCode);
      }

      return NextResponse.json({
        success: true,
        status: newStatus,
        isPaid,
        details: statusResult,
        message: isPaid
          ? "Paiement confirmé avec succès par LigdiCash ! Abonnement activé."
          : `Statut actuel retourné par LigdiCash : ${newStatus}`,
      });
    }

    // B. Validation manuelle forcée par le SuperAdmin (ex: confirmation par SMS opérateur)
    if (action === "validate_manual") {
      if (!referenceCode) {
        return NextResponse.json({ success: false, message: "Référence manquante" }, { status: 400 });
      }

      // 1. Mettre à jour la transaction
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("reference_code", referenceCode);

      // 2. Mettre à jour ou créer la souscription
      const resolvedPlan = (planTier || "2500") as PlanTier;
      const planCfg = getPaymentPlanConfig(resolvedPlan);
      const planAmount = planCfg?.amount || 2500;
      const planAllowedCandidates = planCfg?.allowedCandidates || 2;

      await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            transaction_ref: referenceCode,
            user_email: userEmail || "client.valide@moncv.ai",
            plan_tier: resolvedPlan,
            amount: planAmount,
            currency: "FCFA",
            status: "active",
            payment_method: "LigdiCash (Validation Manuelle SuperAdmin)",
            allowed_candidates: planAllowedCandidates,
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "transaction_ref" }
        );

      return NextResponse.json({
        success: true,
        message: `La transaction ${referenceCode} a été validée manuellement. L'abonnement est désormais ACTIF.`,
      });
    }

    return NextResponse.json({ success: false, message: "Action non reconnue" }, { status: 400 });
  } catch (err: any) {
    console.error("Erreur POST /api/admin/transactions:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
