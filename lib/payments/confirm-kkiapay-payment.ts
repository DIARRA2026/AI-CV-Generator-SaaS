import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyTransaction, KKiaPayVerificationResponse, getKKiaPayServerConfig } from "@/lib/kkiapay/server";

export interface ConfirmPaymentParams {
  transactionId: string;
  expectedOrderId?: string;
  expectedUserId?: string;
  /** Injectable pour tests unitaires automatisés */
  mockVerifyResponse?: KKiaPayVerificationResponse;
}

export interface ConfirmPaymentResult {
  success: boolean;
  status: "paid" | "pending" | "failed";
  reason?: string;
  message: string;
  orderId?: string;
  userId?: string;
  planId?: string;
  expiresAt?: string;
  subscriptionId?: string;
}

/**
 * Journalisation structurée des événements de paiement (Règle 3 & Étape 6)
 * Aucun secret, aucun jeton, aucun numéro de téléphone entier dans les logs.
 */
function logPaymentEvent(
  event: string,
  data: {
    orderId?: string;
    userId?: string;
    transactionId?: string;
    reason?: string;
    amount?: number;
    environment?: string;
  }
) {
  const payload = {
    timestamp: new Date().toISOString(),
    event,
    orderId: data.orderId,
    userId: data.userId ? `${data.userId.substring(0, 8)}...` : undefined,
    transactionId: data.transactionId,
    amount: data.amount,
    reason: data.reason,
    environment: data.environment || (process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX === "true" ? "sandbox" : "live"),
  };
  console.log(`[PAYMENT LOG] ${event}:`, JSON.stringify(payload));
}

/**
 * confirmKKiaPayPayment()
 * ============================================================
 * Fonction UNIQUE et IDEMPOTENTE de confirmation serveur d'un paiement KKiaPay.
 * Appelée à la fois par :
 *   1. La route de vérification navigateur (POST /api/payments/kkiapay/verify)
 *   2. Le webhook KKiaPay officiel (POST /api/webhooks/kkiapay)
 *
 * RÈGLES DE SÉCURITÉ APPLIQUÉES :
 * - Règle 1 : Le serveur établit toujours l'identité et le montant.
 * - Règle 2 : KKiaPay SUCCESS + montant exact + transaction rattachée + idempotence.
 * - Règle 4 : Idempotence garantie en base (verrou FOR UPDATE et contrainte UNIQUE).
 * - Règle 5 : Dans le doute, rien ne s'active (la commande reste pending).
 */
export async function confirmKKiaPayPayment(
  params: ConfirmPaymentParams
): Promise<ConfirmPaymentResult> {
  const { transactionId, expectedOrderId, expectedUserId, mockVerifyResponse } = params;

  if (!transactionId?.trim()) {
    return {
      success: false,
      status: "failed",
      reason: "missing_transaction_id",
      message: "transactionId requis.",
    };
  }

  if (!supabaseAdmin) {
    return {
      success: false,
      status: "pending",
      reason: "database_unavailable",
      message: "Service de données indisponible.",
    };
  }

  logPaymentEvent("payment.verify_started", {
    transactionId,
    orderId: expectedOrderId,
    userId: expectedUserId,
  });

  // 1. VÉRIFICATION DU PAIEMENT AUPRÈS DU SERVEUR KKIAPAY
  // Seule cette réponse vérifiée compte (jamais les données non signées du client)
  let verifyData: KKiaPayVerificationResponse;
  try {
    if (mockVerifyResponse) {
      verifyData = mockVerifyResponse;
    } else {
      verifyData = await verifyTransaction(transactionId);
    }
  } catch (err: any) {
    const errorMsg = err?.message || "Erreur de communication avec KKiaPay";
    console.warn(`[confirmKKiaPayPayment] Échec verifyTransaction (${transactionId}):`, errorMsg);

    if (errorMsg === "TRANSACTION_NOT_FOUND") {
      logPaymentEvent("payment.rejected", {
        transactionId,
        orderId: expectedOrderId,
        userId: expectedUserId,
        reason: "unknown_transaction",
      });
      return {
        success: false,
        status: "failed",
        reason: "unknown_transaction",
        message: "Transaction introuvable auprès de KKiaPay.",
      };
    }

    // Erreur réseau ou timeout : Dans le doute, rien ne s'active, statut pending (Règle 5)
    return {
      success: false,
      status: "pending",
      reason: "verify_network_error",
      message: "Impossible de joindre KKiaPay pour l'instant. La commande reste en attente.",
    };
  }

  const txStatus = (verifyData.status || "").toUpperCase();
  const txType = (verifyData.type || "DEBIT").toUpperCase();

  // 2. CONTRÔLE DU STATUT TRANSACTIONNEL KKIAPAY
  if (txStatus === "FAILED") {
    logPaymentEvent("payment.rejected", {
      transactionId,
      orderId: expectedOrderId,
      userId: expectedUserId,
      reason: "not_success",
    });

    // Enregistrer l'échec en base si la commande est connue
    if (expectedOrderId) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", expectedOrderId);
    }

    return {
      success: false,
      status: "failed",
      reason: "not_success",
      message: "Le paiement a été rejeté ou a échoué chez KKiaPay.",
    };
  }

  if (txStatus !== "SUCCESS" || (txType !== "DEBIT" && txType !== "")) {
    // Statut indéterminé : la commande reste pending (Règle 5)
    return {
      success: false,
      status: "pending",
      reason: "status_not_success",
      message: `Paiement non confirmé (statut: ${txStatus}). Commande maintenue en attente.`,
    };
  }

  // 3. RETROUVER LA COMMANDE (orders) ASSOCIÉE
  // KKiaPay renvoie l'identifiant fourni à l'ouverture du widget dans partnerId (ou state)
  const resolvedOrderId =
    verifyData.partnerId?.trim() ||
    verifyData.state?.trim() ||
    expectedOrderId?.trim();

  if (!resolvedOrderId) {
    logPaymentEvent("payment.rejected", {
      transactionId,
      reason: "missing_order_reference",
    });
    return {
      success: false,
      status: "failed",
      reason: "missing_order_reference",
      message: "Aucune commande associée à cette transaction.",
    };
  }

  // 4. CHARGEMENT DE LA COMMANDE EN BASE
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", resolvedOrderId)
    .maybeSingle();

  if (orderErr || !order) {
    logPaymentEvent("payment.rejected", {
      transactionId,
      orderId: resolvedOrderId,
      reason: "order_not_found",
    });
    return {
      success: false,
      status: "failed",
      reason: "order_not_found",
      message: "Commande introuvable dans la base de données.",
    };
  }

  // 5. CONTRÔLE DE SÉCURITÉ DU RATTACHEMENT (Règle 2)
  // Cas route de vérification avec utilisateur connecté
  if (expectedOrderId && expectedOrderId !== order.id) {
    logPaymentEvent("payment.rejected", {
      transactionId,
      orderId: expectedOrderId,
      reason: "order_mismatch",
    });
    return {
      success: false,
      status: "failed",
      reason: "order_mismatch",
      message: "La transaction ne correspond pas à la commande demandée.",
    };
  }

  if (expectedUserId && expectedUserId !== order.user_id) {
    logPaymentEvent("payment.rejected", {
      transactionId,
      orderId: order.id,
      userId: expectedUserId,
      reason: "user_mismatch",
    });
    return {
      success: false,
      status: "failed",
      reason: "user_mismatch",
      message: "Cette transaction n'appartient pas à votre compte utilisateur.",
    };
  }

  // 6. CONTRÔLE STRICT DU MONTANT (Règle 2 : montant payé exactement celui de la commande)
  const paidAmount = Number(verifyData.amount);
  const expectedAmount = Number(order.amount_xof);

  if (isNaN(paidAmount) || paidAmount !== expectedAmount) {
    logPaymentEvent("payment.rejected", {
      transactionId,
      orderId: order.id,
      userId: order.user_id,
      amount: paidAmount,
      reason: "amount_mismatch",
    });
    return {
      success: false,
      status: "failed",
      reason: "amount_mismatch",
      message: `Montant non conforme : attendu ${expectedAmount} XOF, reçu ${paidAmount} XOF.`,
    };
  }

  // 7. CONFIRMATION ATOMIQUE EN BASE VIA POSTGRES RPC confirm_kkiapay_payment
  const isSandbox = (process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX || "").toLowerCase() === "true";
  const environment = isSandbox ? "sandbox" : "live";

  try {
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "confirm_kkiapay_payment",
      {
        p_order_id: order.id,
        p_transaction_id: transactionId,
        p_amount: paidAmount,
        p_fees: Number(verifyData.fees || 0),
        p_payment_method: verifyData.source_common_name || verifyData.source || "KKiaPay",
        p_environment: environment,
        p_raw_reference: verifyData as any,
      }
    );

    if (rpcError) {
      console.error("[confirmKKiaPayPayment] Erreur RPC confirm_kkiapay_payment:", rpcError);
      return {
        success: false,
        status: "pending",
        reason: "rpc_error",
        message: "Erreur lors de l'enregistrement de l'abonnement.",
      };
    }

    const resRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!resRow || !resRow.success) {
      logPaymentEvent("payment.rejected", {
        transactionId,
        orderId: order.id,
        userId: order.user_id,
        reason: resRow?.message || "db_confirmation_failed",
      });
      return {
        success: false,
        status: "failed",
        reason: resRow?.message || "confirmation_failed",
        message: resRow?.message || "Échec de l'activation de l'abonnement.",
      };
    }

    logPaymentEvent("payment.confirmed", {
      transactionId,
      orderId: order.id,
      userId: order.user_id,
      amount: paidAmount,
      environment,
    });

    logPaymentEvent("subscription.activated", {
      orderId: order.id,
      userId: order.user_id,
      reason: `Plan ${resRow.plan_id} actif jusqu'au ${resRow.expires_at}`,
    });

    return {
      success: true,
      status: "paid",
      message: "Paiement confirmé avec succès. Votre abonnement est actif.",
      orderId: order.id,
      userId: order.user_id,
      planId: resRow.plan_id || order.plan_id,
      expiresAt: resRow.expires_at,
      subscriptionId: resRow.subscription_id,
    };
  } catch (err: any) {
    console.error("[confirmKKiaPayPayment] Exception SQL:", err);
    return {
      success: false,
      status: "pending",
      reason: "internal_error",
      message: "Erreur interne lors de la confirmation.",
    };
  }
}
