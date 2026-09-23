import { supabase } from "./supabaseClient";
import { supabaseAdmin } from "./supabaseAdmin";
import {
  CreditPackCode,
  CreditBatch,
  CreditLedgerEntry,
  PaymentClaim,
  UserCreditSummary,
} from "./types";
import { getCreditPack } from "@/config/payments";

export class CreditService {
  /**
   * Récupère le résumé du solde et la date d'expiration la plus proche
   */
  static async getUserBalance(userId: string): Promise<UserCreditSummary> {
    const client = supabaseAdmin || supabase;
    if (!client || !userId) {
      return { balance: 0, nearestExpiry: null, activeBatchesCount: 0 };
    }

    try {
      // 1. Appel de la fonction stockée PostgreSQL optimisée
      const { data, error } = await client.rpc("get_user_credit_balance", {
        p_user_id: userId,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          balance: Number(data[0].balance) || 0,
          nearestExpiry: data[0].nearest_expiry || null,
          activeBatchesCount: Number(data[0].active_batches) || 0,
        };
      }

      // 2. Repli direct par requête SELECT si la RPC n'est pas accessible
      const now = new Date().toISOString();
      const { data: batches } = await client
        .from("credit_batches")
        .select("credits_remaining, expires_at")
        .eq("user_id", userId)
        .gt("credits_remaining", 0)
        .or(`expires_at.is.null,expires_at.gt.${now}`);

      if (batches && batches.length > 0) {
        let total = 0;
        let nearest: string | null = null;
        batches.forEach((b: any) => {
          total += Number(b.credits_remaining) || 0;
          if (b.expires_at) {
            if (!nearest || new Date(b.expires_at) < new Date(nearest)) {
              nearest = b.expires_at;
            }
          }
        });
        return {
          balance: total,
          nearestExpiry: nearest,
          activeBatchesCount: batches.length,
        };
      }

      return { balance: 0, nearestExpiry: null, activeBatchesCount: 0 };
    } catch (err) {
      console.warn("Erreur CreditService.getUserBalance:", err);
      return { balance: 0, nearestExpiry: null, activeBatchesCount: 0 };
    }
  }

  /**
   * Attribue de façon idempotente les 20 crédits de bienvenue offerts
   */
  static async grantWelcomeCredits(userId: string): Promise<boolean> {
    const client = supabaseAdmin || supabase;
    if (!client || !userId) return false;

    try {
      const { data, error } = await client.rpc("grant_welcome_credits", {
        p_user_id: userId,
      });
      if (error) {
        console.warn("Erreur grant_welcome_credits:", error);
        return false;
      }
      return Boolean(data);
    } catch (err) {
      console.warn("Erreur CreditService.grantWelcomeCredits:", err);
      return false;
    }
  }

  /**
   * Débit atomique de crédits côté serveur (SECURITY DEFINER)
   */
  static async consumeCredits(
    userId: string,
    amount: number,
    action: string,
    ref?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    if (!supabaseAdmin) {
      return { success: false, error: "Base de données administrative indisponible" };
    }
    if (amount <= 0) {
      return { success: true };
    }

    try {
      const { data, error } = await supabaseAdmin.rpc("consume_user_credits", {
        p_user_id: userId,
        p_amount: amount,
        p_action: action,
        p_ref: ref || null,
      });

      if (error) {
        const msg = error.message || "";
        if (msg.includes("INSUFFICIENT_CREDITS")) {
          return { success: false, error: "INSUFFICIENT_CREDITS" };
        }
        return { success: false, error: msg || "Erreur débit crédits" };
      }

      return { success: true, newBalance: Number(data) };
    } catch (err: any) {
      console.error("Erreur CreditService.consumeCredits:", err);
      return { success: false, error: err.message || "Erreur interne débit crédits" };
    }
  }

  /**
   * Remboursement de crédits en cas d'échec d'une opération
   */
  static async refundCredits(
    userId: string,
    amount: number,
    action: string = "refund",
    ref?: string
  ): Promise<{ success: boolean; newBalance?: number }> {
    if (!supabaseAdmin || amount <= 0) return { success: false };

    try {
      const { data, error } = await supabaseAdmin.rpc("refund_user_credits", {
        p_user_id: userId,
        p_amount: amount,
        p_action: action,
        p_ref: ref || null,
      });

      if (error) {
        console.error("Erreur CreditService.refundCredits:", error);
        return { success: false };
      }

      return { success: true, newBalance: Number(data) };
    } catch (err) {
      console.error("Erreur CreditService.refundCredits:", err);
      return { success: false };
    }
  }

  /**
   * Récupère la liste des lots de crédits de l'utilisateur
   */
  static async getUserBatches(userId: string): Promise<CreditBatch[]> {
    const client = supabaseAdmin || supabase;
    if (!client || !userId) return [];

    try {
      const { data, error } = await client
        .from("credit_batches")
        .select("*")
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false });

      if (error || !data) return [];

      return data.map((b: any) => ({
        id: b.id,
        userId: b.user_id,
        creditsInitial: b.credits_initial,
        creditsRemaining: b.credits_remaining,
        source: b.source,
        packCode: b.pack_code,
        purchasedAt: b.purchased_at,
        expiresAt: b.expires_at,
        createdAt: b.created_at,
      }));
    } catch (err) {
      console.warn("Erreur CreditService.getUserBatches:", err);
      return [];
    }
  }

  /**
   * Récupère l'historique comptable du grand livre (ledger)
   */
  static async getUserLedger(userId: string, limit = 50): Promise<CreditLedgerEntry[]> {
    const client = supabaseAdmin || supabase;
    if (!client || !userId) return [];

    try {
      const { data, error } = await client
        .from("credit_ledger")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      return data.map((l: any) => ({
        id: l.id,
        userId: l.user_id,
        batchId: l.batch_id,
        action: l.action,
        delta: l.delta,
        balanceAfter: l.balance_after,
        ref: l.ref,
        createdAt: l.created_at,
      }));
    } catch (err) {
      console.warn("Erreur CreditService.getUserLedger:", err);
      return [];
    }
  }

  /**
   * Soumission d'une déclaration de paiement Wave par le candidat
   */
  static async submitPaymentClaim(payload: {
    userId: string;
    userEmail: string;
    packCode: CreditPackCode;
    waveReference: string;
    screenshotUrl?: string;
  }): Promise<{ success: boolean; claim?: PaymentClaim; message?: string }> {
    const client = supabaseAdmin || supabase;
    if (!client) {
      return { success: false, message: "Service de données indisponible" };
    }

    const cleanRef = payload.waveReference.trim();
    if (!cleanRef) {
      return { success: false, message: "La référence de paiement Wave est obligatoire" };
    }

    const pack = getCreditPack(payload.packCode);
    if (!pack || pack.priceFcfa <= 0) {
      return { success: false, message: "Pack de crédits payant invalide" };
    }

    try {
      const { data, error } = await client
        .from("payment_claims")
        .insert({
          user_id: payload.userId,
          user_email: payload.userEmail.toLowerCase().trim(),
          pack_code: payload.packCode,
          amount_fcfa: pack.priceFcfa,
          wave_reference: cleanRef,
          screenshot_url: payload.screenshotUrl || null,
          status: "pending",
        })
        .select()
        .single();

      if (error || !data) {
        return { success: false, message: error?.message || "Erreur lors de l'enregistrement" };
      }

      return {
        success: true,
        claim: {
          id: data.id,
          userId: data.user_id,
          userEmail: data.user_email,
          packCode: data.pack_code,
          amountFcfa: data.amount_fcfa,
          waveReference: data.wave_reference,
          screenshotUrl: data.screenshot_url,
          status: data.status,
          createdAt: data.created_at,
        },
      };
    } catch (err: any) {
      console.error("Erreur CreditService.submitPaymentClaim:", err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Récupère les déclarations de paiement de l'utilisateur
   */
  static async getUserClaims(userId: string): Promise<PaymentClaim[]> {
    const client = supabaseAdmin || supabase;
    if (!client || !userId) return [];

    try {
      const { data, error } = await client
        .from("payment_claims")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error || !data) return [];

      return data.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        userEmail: c.user_email,
        packCode: c.pack_code,
        amountFcfa: c.amount_fcfa,
        waveReference: c.wave_reference,
        screenshotUrl: c.screenshot_url,
        status: c.status,
        rejectionReason: c.rejection_reason,
        reviewedBy: c.reviewed_by,
        reviewedAt: c.reviewed_at,
        createdAt: c.created_at,
      }));
    } catch (err) {
      console.warn("Erreur CreditService.getUserClaims:", err);
      return [];
    }
  }

  /**
   * Récupère les réclamations pour la console SuperAdmin
   */
  static async getAdminClaims(statusFilter = "all"): Promise<PaymentClaim[]> {
    if (!supabaseAdmin) return [];

    try {
      let query = supabaseAdmin
        .from("payment_claims")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.limit(100);
      if (error || !data) return [];

      return data.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        userEmail: c.user_email,
        packCode: c.pack_code,
        amountFcfa: c.amount_fcfa,
        waveReference: c.wave_reference,
        screenshotUrl: c.screenshot_url,
        status: c.status,
        rejectionReason: c.rejection_reason,
        reviewedBy: c.reviewed_by,
        reviewedAt: c.reviewed_at,
        createdAt: c.created_at,
      }));
    } catch (err) {
      console.error("Erreur CreditService.getAdminClaims:", err);
      return [];
    }
  }

  /**
   * Validation 1-Clic d'un paiement Wave par l'administrateur
   */
  static async approveClaim(
    claimId: string,
    adminId: string
  ): Promise<{ success: boolean; message: string; newBalance?: number }> {
    if (!supabaseAdmin) {
      return { success: false, message: "Base de données administrative non disponible" };
    }

    try {
      const { data, error } = await supabaseAdmin.rpc("approve_payment_claim", {
        p_claim_id: claimId,
        p_admin_id: adminId || "00000000-0000-0000-0000-000000000000",
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return data as { success: boolean; message: string; newBalance?: number };
    } catch (err: any) {
      console.error("Erreur CreditService.approveClaim:", err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Rejet d'un paiement Wave avec motif par l'administrateur
   */
  static async rejectClaim(
    claimId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    if (!supabaseAdmin) {
      return { success: false, message: "Base de données administrative non disponible" };
    }

    try {
      const { data, error } = await supabaseAdmin.rpc("reject_payment_claim", {
        p_claim_id: claimId,
        p_admin_id: adminId || "00000000-0000-0000-0000-000000000000",
        p_reason: reason || "Référence introuvable",
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return data as { success: boolean; message: string };
    } catch (err: any) {
      console.error("Erreur CreditService.rejectClaim:", err);
      return { success: false, message: err.message };
    }
  }
}
