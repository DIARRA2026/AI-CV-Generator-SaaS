import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  WalletSummary,
  CreditWallet,
  CreditTransaction,
  CreditReservation,
  CreditPackage,
  CreditCost,
  ReserveCreditsResult,
  CompleteReservationResult,
  ReleaseReservationResult,
  PurchaseCreditsResult,
  SignupBonusResult,
  AdminAdjustmentResult,
} from "./types";

/**
 * Barème de secours si la table de configuration credit_costs est inaccessible
 */
export const DEFAULT_AI_COIN_COSTS: Record<string, number> = {
  CV_GENERATION: 20,
  cv_complet: 20,
  full_cv: 20,
  cv_generate: 20,
  cv_rewrite: 20,
  CV_IMPROVEMENT: 5,
  EXPERIENCE_REWRITE: 5,
  COVER_LETTER: 10,
  cover_letter: 10,
  lettre_motivation: 10,
  CV_TRANSLATION: 10,
  translate_en: 10,
  traduction_anglais: 10,
  CV_ANALYSIS: 10,
  ats_analysis: 10,
  ats_adaptation: 10,
  analyse_ats: 10,
  AI_PHOTO: 50,
  pro_photo: 50,
  photo_ia: 50,
  export_pdf: 0,
  export_docx: 0,
  summary: 0,
  experience_bullets: 0,
  skills: 0,
};

// Simulation mémoire pour tests automatisés ou mode hors-ligne
interface InMemoryState {
  wallets: Map<string, CreditWallet>;
  transactions: Map<string, CreditTransaction>;
  reservations: Map<string, CreditReservation>;
  costs: Map<string, number>;
  packages: CreditPackage[];
}

const memoryState: InMemoryState = {
  wallets: new Map(),
  transactions: new Map(),
  reservations: new Map(),
  costs: new Map(Object.entries(DEFAULT_AI_COIN_COSTS)),
  packages: [
    {
      id: "pkg-1",
      slug: "decouverte",
      name: "Pack Découverte",
      description: "Pour explorer la plateforme",
      credits: 30,
      price: 0,
      currency: "FCFA",
      bonusCredits: 0,
      isActive: true,
      displayOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pkg-2",
      slug: "essentiel",
      name: "Pack Essentiel",
      description: "Idéal pour peaufiner son CV",
      credits: 120,
      price: 1500,
      currency: "FCFA",
      bonusCredits: 0,
      isActive: true,
      displayOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pkg-3",
      slug: "evolution",
      name: "Pack Évolution",
      description: "Pour candidatures multiples",
      credits: 250,
      price: 2500,
      currency: "FCFA",
      bonusCredits: 25,
      isActive: true,
      displayOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pkg-4",
      slug: "carriere",
      name: "Pack Carrière",
      description: "Offre complète avec photo IA",
      credits: 600,
      price: 5000,
      currency: "FCFA",
      bonusCredits: 100,
      isActive: true,
      displayOrder: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pkg-5",
      slug: "starter",
      name: "Pack Starter",
      description: "500 AI Coins",
      credits: 500,
      price: 5000,
      currency: "FCFA",
      bonusCredits: 50,
      isActive: true,
      displayOrder: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pkg-6",
      slug: "pro",
      name: "Pack Pro",
      description: "1 500 AI Coins",
      credits: 1500,
      price: 12000,
      currency: "FCFA",
      bonusCredits: 200,
      isActive: true,
      displayOrder: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "pkg-7",
      slug: "business",
      name: "Pack Business",
      description: "5 000 AI Coins",
      credits: 5000,
      price: 30000,
      currency: "FCFA",
      bonusCredits: 1000,
      isActive: true,
      displayOrder: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

/**
 * Service centralisé pour le portefeuille virtuel interne "AI COINS"
 */
export class WalletService {
  /**
   * Permet de réinitialiser l'état mémoire lors des tests
   */
  public static resetMemoryState() {
    memoryState.wallets.clear();
    memoryState.transactions.clear();
    memoryState.reservations.clear();
    memoryState.costs = new Map(Object.entries(DEFAULT_AI_COIN_COSTS));
  }

  /**
   * Récupère le portefeuille officiel de l'utilisateur
   */
  public static async getWallet(userId: string): Promise<WalletSummary> {
    if (!userId) {
      return {
        userId: "",
        availableCredits: 0,
        reservedCredits: 0,
        lifetimeEarned: 0,
        lifetimePurchased: 0,
        lifetimeConsumed: 0,
        totalBalance: 0,
      };
    }

    if (supabaseAdmin) {
      try {
        const rpcResult = await (supabaseAdmin.rpc("get_or_create_wallet", {
          p_user_id: userId,
        }) as any);
        const data = rpcResult?.data;
        const error = rpcResult?.error;

        if (!error && data) {
          const w = typeof data === "string" ? JSON.parse(data) : data;
          const available = Number(w.available_credits ?? 0);
          const reserved = Number(w.reserved_credits ?? 0);
          return {
            id: w.id,
            userId: w.user_id || userId,
            availableCredits: available,
            reservedCredits: reserved,
            lifetimeEarned: Number(w.lifetime_earned ?? 0),
            lifetimePurchased: Number(w.lifetime_purchased ?? 0),
            lifetimeConsumed: Number(w.lifetime_consumed ?? 0),
            totalBalance: available + reserved,
            updatedAt: w.updated_at,
          };
        }
      } catch (err) {
        console.warn("[WalletService.getWallet] RPC error, falling back to memory:", err);
      }
    }

    // Fallback mémoire
    let mem = memoryState.wallets.get(userId);
    if (!mem) {
      mem = {
        id: `mem-w-${userId}`,
        userId,
        availableCredits: 0,
        reservedCredits: 0,
        lifetimeEarned: 0,
        lifetimePurchased: 0,
        lifetimeConsumed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryState.wallets.set(userId, mem);
    }

    return {
      id: mem.id,
      userId: mem.userId,
      availableCredits: mem.availableCredits,
      reservedCredits: mem.reservedCredits,
      lifetimeEarned: mem.lifetimeEarned,
      lifetimePurchased: mem.lifetimePurchased,
      lifetimeConsumed: mem.lifetimeConsumed,
      totalBalance: mem.availableCredits + mem.reservedCredits,
      updatedAt: mem.updatedAt,
    };
  }

  /**
   * Obtient le coût officiel d'une fonctionnalité IA (depuis la base de données)
   */
  public static async getFeatureCost(featureKey: string): Promise<number> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("credit_costs")
          .select("cost, is_active")
          .eq("feature_key", featureKey)
          .maybeSingle();

        if (!error && data && data.is_active) {
          return Number(data.cost);
        }
      } catch (err) {
        console.warn("[WalletService.getFeatureCost] Error reading credit_costs:", err);
      }
    }

    return memoryState.costs.get(featureKey) ?? DEFAULT_AI_COIN_COSTS[featureKey] ?? 10;
  }

  /**
   * Phase 1 : Réservation atomique préalable d'AI Coins
   */
  public static async reserve(params: {
    userId: string;
    operationId: string;
    operationType: string;
    amount: number;
    ttlMinutes?: number;
    metadata?: Record<string, any>;
  }): Promise<ReserveCreditsResult> {
    const { userId, operationId, operationType, amount, ttlMinutes = 10, metadata = {} } = params;

    if (amount <= 0) {
      return { ok: true, amount: 0, availableCredits: 0, reservedCredits: 0 };
    }

    if (supabaseAdmin) {
      try {
        const rpcResult = await (supabaseAdmin.rpc("reserve_credits", {
          p_user_id: userId,
          p_operation_id: operationId,
          p_operation_type: operationType,
          p_amount: amount,
          p_ttl_minutes: ttlMinutes,
          p_metadata: metadata,
        }) as any);
        const data = rpcResult?.data;
        const error = rpcResult?.error;

        if (!error && data) {
          const res = typeof data === "string" ? JSON.parse(data) : data;
          if (res.ok) {
            return {
              ok: true,
              reservationId: res.reservation_id,
              operationId: res.operation_id,
              amount: res.amount,
              availableCredits: res.available_credits,
              reservedCredits: res.reserved_credits,
              expiresAt: res.expires_at,
              idempotent: res.idempotent,
            };
          }
          return {
            ok: false,
            error: res.error || "INSUFFICIENT_CREDITS",
            message: res.message || "Solde d'AI Coins insuffisant pour cette opération.",
            availableCredits: res.available_credits,
            requiredCredits: res.required_credits || amount,
            missingCredits: res.missing_credits || (amount - (res.available_credits ?? 0)),
          };
        }
      } catch (err: any) {
        console.warn("[WalletService.reserve] RPC error, falling back to memory:", err?.message);
      }
    }

    // Gestion mémoire atomique
    const existing = memoryState.reservations.get(operationId);
    if (existing) {
      if (existing.status === "reserved" || existing.status === "processing") {
        const wallet = await this.getWallet(userId);
        return {
          ok: true,
          idempotent: true,
          reservationId: existing.id,
          operationId: existing.operationId,
          amount: existing.amount,
          availableCredits: wallet.availableCredits,
          reservedCredits: wallet.reservedCredits,
        };
      }
      if (existing.status === "completed") {
        return { ok: false, error: "ALREADY_COMPLETED", message: "Cette opération a déjà été consommée." };
      }
      if (existing.status === "released") {
        return { ok: false, error: "ALREADY_RELEASED", message: "Cette réservation a déjà été libérée." };
      }
    }

    const wallet = memoryState.wallets.get(userId) || {
      id: `mem-w-${userId}`,
      userId,
      availableCredits: 0,
      reservedCredits: 0,
      lifetimeEarned: 0,
      lifetimePurchased: 0,
      lifetimeConsumed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryState.wallets.set(userId, wallet);

    if (wallet.availableCredits < amount) {
      return {
        ok: false,
        error: "INSUFFICIENT_CREDITS",
        availableCredits: wallet.availableCredits,
        requiredCredits: amount,
        missingCredits: amount - wallet.availableCredits,
        message: `Solde insuffisant : ${wallet.availableCredits} disponible, ${amount} requis.`,
      };
    }

    wallet.availableCredits -= amount;
    wallet.reservedCredits += amount;
    wallet.updatedAt = new Date().toISOString();

    const reservation: CreditReservation = {
      id: `mem-res-${operationId}`,
      userId,
      walletId: wallet.id,
      amount,
      operationId,
      operationType,
      status: "reserved",
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      reservedAt: new Date().toISOString(),
      metadata,
    };
    memoryState.reservations.set(operationId, reservation);

    return {
      ok: true,
      reservationId: reservation.id,
      operationId,
      amount,
      availableCredits: wallet.availableCredits,
      reservedCredits: wallet.reservedCredits,
      expiresAt: reservation.expiresAt,
    };
  }

  /**
   * Phase 2 Succès : Consommation définitive de la réservation
   */
  public static async complete(params: {
    operationId: string;
    feature?: string;
    metadata?: Record<string, any>;
    provider?: string;
    model?: string;
    tokensIn?: number;
    tokensOut?: number;
    cost?: number;
  }): Promise<CompleteReservationResult> {
    const {
      operationId,
      feature = "ia_operation",
      metadata = {},
      provider = "google",
      model = "gemini-1.5-flash",
      tokensIn = 0,
      tokensOut = 0,
      cost = 0,
    } = params;

    if (supabaseAdmin) {
      try {
        const rpcResult = await (supabaseAdmin.rpc("complete_credit_reservation", {
          p_operation_id: operationId,
          p_feature: feature,
          p_metadata: metadata,
          p_provider: provider,
          p_model: model,
          p_tokens_in: tokensIn,
          p_tokens_out: tokensOut,
          p_cost: cost,
        }) as any);
        const data = rpcResult?.data;
        const error = rpcResult?.error;

        if (!error && data) {
          const res = typeof data === "string" ? JSON.parse(data) : data;
          if (res.ok) {
            return {
              ok: true,
              operationId: res.operation_id,
              consumedCredits: res.consumed_credits,
              availableCredits: res.available_credits,
              reservedCredits: res.reserved_credits,
              transactionId: res.transaction_id,
              idempotent: res.idempotent,
            };
          }
          return { ok: false, error: res.error, message: res.message };
        }
      } catch (err: any) {
        console.warn("[WalletService.complete] RPC error, falling back to memory:", err?.message);
      }
    }

    // Gestion mémoire
    const res = memoryState.reservations.get(operationId);
    if (!res) {
      return { ok: false, error: "RESERVATION_NOT_FOUND", message: "Réservation introuvable." };
    }

    if (res.status === "completed") {
      const wallet = memoryState.wallets.get(res.userId);
      return {
        ok: true,
        idempotent: true,
        operationId,
        consumedCredits: res.amount,
        availableCredits: wallet?.availableCredits ?? 0,
        reservedCredits: wallet?.reservedCredits ?? 0,
      };
    }

    const wallet = memoryState.wallets.get(res.userId);
    if (wallet) {
      wallet.reservedCredits = Math.max(0, wallet.reservedCredits - res.amount);
      wallet.lifetimeConsumed += res.amount;
      wallet.updatedAt = new Date().toISOString();
    }

    res.status = "completed";
    res.completedAt = new Date().toISOString();

    const tx: CreditTransaction = {
      id: `mem-tx-${operationId}`,
      userId: res.userId,
      walletId: res.walletId,
      type: "usage",
      amount: -res.amount,
      balanceBefore: (wallet?.availableCredits ?? 0) + res.amount,
      balanceAfter: wallet?.availableCredits ?? 0,
      description: `Consommation AI Coins : ${feature}`,
      reference: `USAGE_${operationId}`,
      operationId,
      metadata: { ...metadata, feature, reservationId: res.id },
      createdAt: new Date().toISOString(),
    };
    memoryState.transactions.set(tx.reference, tx);

    return {
      ok: true,
      operationId,
      consumedCredits: res.amount,
      availableCredits: wallet?.availableCredits ?? 0,
      reservedCredits: wallet?.reservedCredits ?? 0,
      transactionId: tx.id,
    };
  }

  /**
   * Phase 2 Échec : Libération et restitution intégrale de la réservation
   */
  public static async release(params: {
    operationId: string;
    reason?: string;
  }): Promise<ReleaseReservationResult> {
    const { operationId, reason = "AI_OPERATION_FAILED" } = params;

    if (supabaseAdmin) {
      try {
        const rpcResult = await (supabaseAdmin.rpc("release_credit_reservation", {
          p_operation_id: operationId,
          p_reason: reason,
        }) as any);
        const data = rpcResult?.data;
        const error = rpcResult?.error;

        if (!error && data) {
          const res = typeof data === "string" ? JSON.parse(data) : data;
          if (res.ok) {
            return {
              ok: true,
              operationId: res.operation_id,
              releasedCredits: res.released_credits,
              availableCredits: res.available_credits,
              reservedCredits: res.reserved_credits,
              reason: res.reason,
              idempotent: res.idempotent,
            };
          }
          return { ok: false, error: res.error, message: res.message };
        }
      } catch (err: any) {
        console.warn("[WalletService.release] RPC error, falling back to memory:", err?.message);
      }
    }

    // Gestion mémoire
    const res = memoryState.reservations.get(operationId);
    if (!res) {
      return { ok: false, error: "RESERVATION_NOT_FOUND", message: "Réservation introuvable." };
    }

    if (res.status === "released") {
      const wallet = memoryState.wallets.get(res.userId);
      return {
        ok: true,
        idempotent: true,
        operationId,
        releasedCredits: res.amount,
        availableCredits: wallet?.availableCredits ?? 0,
        reservedCredits: wallet?.reservedCredits ?? 0,
      };
    }

    if (res.status === "completed") {
      return { ok: false, error: "CANNOT_RELEASE_COMPLETED", message: "Impossible de libérer une réservation consommée." };
    }

    const wallet = memoryState.wallets.get(res.userId);
    if (wallet) {
      wallet.availableCredits += res.amount;
      wallet.reservedCredits = Math.max(0, wallet.reservedCredits - res.amount);
      wallet.updatedAt = new Date().toISOString();
    }

    res.status = "released";
    res.releasedAt = new Date().toISOString();

    return {
      ok: true,
      operationId,
      releasedCredits: res.amount,
      availableCredits: wallet?.availableCredits ?? 0,
      reservedCredits: wallet?.reservedCredits ?? 0,
      reason,
    };
  }

  /**
   * Crédit d'un achat de pack ou paiement avec bonus séparé
   */
  public static async purchase(params: {
    userId: string;
    credits: number;
    bonus?: number;
    reference?: string;
    description?: string;
    packageId?: string;
    metadata?: Record<string, any>;
  }): Promise<PurchaseCreditsResult> {
    const {
      userId,
      credits,
      bonus = 0,
      reference = `PURCHASE_${Date.now()}_${userId.substring(0, 6)}`,
      description = "Achat Pack AI Coins",
      packageId,
      metadata = {},
    } = params;

    if (credits <= 0) {
      return { ok: false, error: "INVALID_CREDITS", message: "Le nombre de crédits doit être positif." };
    }

    if (supabaseAdmin) {
      try {
        const rpcResult = await (supabaseAdmin.rpc("credit_wallet_purchase", {
          p_user_id: userId,
          p_credits: credits,
          p_bonus: bonus,
          p_reference: reference,
          p_description: description,
          p_package_id: packageId,
          p_metadata: metadata,
        }) as any);
        const data = rpcResult?.data;
        const error = rpcResult?.error;

        if (!error && data) {
          const res = typeof data === "string" ? JSON.parse(data) : data;
          if (res.ok) {
            return {
              ok: true,
              creditsAdded: res.credits_added,
              bonusAdded: res.bonus_added,
              totalAdded: res.total_added,
              availableCredits: res.available_credits,
              reservedCredits: res.reserved_credits,
              transactionId: res.transaction_id,
              bonusTransactionId: res.bonus_transaction_id,
              idempotent: res.idempotent,
            };
          }
          return { ok: false, error: res.error, message: res.message };
        }
      } catch (err: any) {
        console.warn("[WalletService.purchase] RPC error, falling back to memory:", err?.message);
      }
    }

    // Gestion mémoire idempotente
    if (memoryState.transactions.has(reference)) {
      const wallet = memoryState.wallets.get(userId);
      return {
        ok: true,
        idempotent: true,
        message: "Cette transaction a déjà été confirmée.",
        availableCredits: wallet?.availableCredits ?? 0,
        reservedCredits: wallet?.reservedCredits ?? 0,
      };
    }

    const wallet = memoryState.wallets.get(userId) || {
      id: `mem-w-${userId}`,
      userId,
      availableCredits: 0,
      reservedCredits: 0,
      lifetimeEarned: 0,
      lifetimePurchased: 0,
      lifetimeConsumed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryState.wallets.set(userId, wallet);

    const balBefore = wallet.availableCredits;
    wallet.availableCredits += credits;
    wallet.lifetimePurchased += credits;

    const tx: CreditTransaction = {
      id: `mem-tx-${reference}`,
      userId,
      walletId: wallet.id,
      type: "purchase",
      amount: credits,
      balanceBefore: balBefore,
      balanceAfter: wallet.availableCredits,
      description,
      reference,
      metadata: { ...metadata, packageId },
      createdAt: new Date().toISOString(),
    };
    memoryState.transactions.set(reference, tx);

    let bonusTxId: string | undefined;
    if (bonus > 0) {
      const bonusRef = `${reference}_BONUS`;
      const bonusBefore = wallet.availableCredits;
      wallet.availableCredits += bonus;
      wallet.lifetimeEarned += bonus;

      const bonusTx: CreditTransaction = {
        id: `mem-tx-${bonusRef}`,
        userId,
        walletId: wallet.id,
        type: "promotion",
        amount: bonus,
        balanceBefore: bonusBefore,
        balanceAfter: wallet.availableCredits,
        description: `Bonus additionnel : ${description}`,
        reference: bonusRef,
        metadata: { ...metadata, parentReference: reference },
        createdAt: new Date().toISOString(),
      };
      memoryState.transactions.set(bonusRef, bonusTx);
      bonusTxId = bonusTx.id;
    }

    wallet.updatedAt = new Date().toISOString();

    return {
      ok: true,
      creditsAdded: credits,
      bonusAdded: bonus,
      totalAdded: credits + bonus,
      availableCredits: wallet.availableCredits,
      reservedCredits: wallet.reservedCredits,
      transactionId: tx.id,
      bonusTransactionId: bonusTxId,
    };
  }

  /**
   * Attribution du bonus d'inscription unique
   */
  public static async grantSignupBonus(params: {
    userId: string;
    amount?: number;
    email?: string;
  }): Promise<SignupBonusResult> {
    const { userId, amount = 50, email } = params;

    if (supabaseAdmin) {
      try {
        const rpcResult = await (supabaseAdmin.rpc("grant_signup_bonus", {
          p_user_id: userId,
          p_amount: amount,
          p_email: email,
        }) as any);
        const data = rpcResult?.data;
        const error = rpcResult?.error;

        if (!error && data) {
          const res = typeof data === "string" ? JSON.parse(data) : data;
          if (res.ok) {
            return {
              ok: true,
              granted: res.granted,
              availableCredits: res.available_credits,
              transactionId: res.transaction_id,
              alreadyGranted: res.already_granted,
            };
          }
          return { ok: false, error: res.error, message: res.message };
        }
      } catch (err: any) {
        console.warn("[WalletService.grantSignupBonus] RPC error, falling back to memory:", err?.message);
      }
    }

    // Gestion mémoire idempotente
    const ref = `SIGNUP_BONUS_${userId}`;
    if (memoryState.transactions.has(ref)) {
      const wallet = memoryState.wallets.get(userId);
      return {
        ok: true,
        alreadyGranted: true,
        message: "Bonus de bienvenue déjà reçu.",
        availableCredits: wallet?.availableCredits ?? 0,
      };
    }

    const wallet = memoryState.wallets.get(userId) || {
      id: `mem-w-${userId}`,
      userId,
      availableCredits: 0,
      reservedCredits: 0,
      lifetimeEarned: 0,
      lifetimePurchased: 0,
      lifetimeConsumed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryState.wallets.set(userId, wallet);

    const balBefore = wallet.availableCredits;
    wallet.availableCredits += amount;
    wallet.lifetimeEarned += amount;
    wallet.updatedAt = new Date().toISOString();

    const tx: CreditTransaction = {
      id: `mem-tx-${ref}`,
      userId,
      walletId: wallet.id,
      type: "signup_bonus",
      amount,
      balanceBefore: balBefore,
      balanceAfter: wallet.availableCredits,
      description: "Bonus de bienvenue inscription (AI Coins)",
      reference: ref,
      metadata: { email },
      createdAt: new Date().toISOString(),
    };
    memoryState.transactions.set(ref, tx);

    return {
      ok: true,
      granted: amount,
      availableCredits: wallet.availableCredits,
      transactionId: tx.id,
    };
  }

  /**
   * Ajustement administratif avec motif obligatoire
   */
  public static async adminAdjust(params: {
    adminId: string;
    userId: string;
    amount: number;
    reason: string;
    metadata?: Record<string, any>;
  }): Promise<AdminAdjustmentResult> {
    const { adminId, userId, amount, reason, metadata = {} } = params;

    if (amount === 0) {
      return { ok: false, error: "ZERO_AMOUNT", message: "Le montant ne peut pas être nul." };
    }

    if (!reason || !reason.trim()) {
      return { ok: false, error: "REASON_REQUIRED", message: "Un motif d'ajustement est obligatoire." };
    }

    if (supabaseAdmin) {
      try {
        const rpcResult = await (supabaseAdmin.rpc("admin_adjust_credits", {
          p_admin_id: adminId,
          p_user_id: userId,
          p_amount: amount,
          p_reason: reason.trim(),
          p_metadata: metadata,
        }) as any);
        const data = rpcResult?.data;
        const error = rpcResult?.error;

        if (!error && data) {
          const res = typeof data === "string" ? JSON.parse(data) : data;
          if (res.ok) {
            return {
              ok: true,
              adjustment: res.adjustment,
              availableCredits: res.available_credits,
              transactionId: res.transaction_id,
              reference: res.reference,
            };
          }
          return { ok: false, error: res.error, message: res.message };
        }
      } catch (err: any) {
        console.warn("[WalletService.adminAdjust] RPC error, falling back to memory:", err?.message);
      }
    }

    // Gestion mémoire
    const wallet = memoryState.wallets.get(userId) || {
      id: `mem-w-${userId}`,
      userId,
      availableCredits: 0,
      reservedCredits: 0,
      lifetimeEarned: 0,
      lifetimePurchased: 0,
      lifetimeConsumed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryState.wallets.set(userId, wallet);

    const balBefore = wallet.availableCredits;
    const balAfter = balBefore + amount;

    if (balAfter < 0) {
      return {
        ok: false,
        error: "INSUFFICIENT_FUNDS",
        message: "L'ajustement entraînerait un solde négatif.",
      };
    }

    wallet.availableCredits = balAfter;
    if (amount > 0) wallet.lifetimeEarned += amount;
    else wallet.lifetimeConsumed += Math.abs(amount);
    wallet.updatedAt = new Date().toISOString();

    const ref = `ADMIN_ADJ_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tx: CreditTransaction = {
      id: `mem-tx-${ref}`,
      userId,
      walletId: wallet.id,
      type: "admin_adjustment",
      amount,
      balanceBefore: balBefore,
      balanceAfter: balAfter,
      description: `Ajustement administrateur : ${reason.trim()}`,
      reference: ref,
      metadata: { ...metadata, adminId, reason: reason.trim() },
      createdAt: new Date().toISOString(),
    };
    memoryState.transactions.set(ref, tx);

    return {
      ok: true,
      adjustment: amount,
      availableCredits: balAfter,
      transactionId: tx.id,
      reference: ref,
    };
  }

  /**
   * Grand livre des transactions de l'utilisateur
   */
  public static async getTransactions(userId: string, limit = 50, offset = 0): Promise<CreditTransaction[]> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("credit_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && Array.isArray(data)) {
          return data.map((t: any) => ({
            id: t.id,
            userId: t.user_id,
            walletId: t.wallet_id,
            type: t.type,
            amount: t.amount,
            balanceBefore: t.balance_before,
            balanceAfter: t.balance_after,
            description: t.description,
            reference: t.reference,
            operationId: t.operation_id,
            metadata: t.metadata,
            createdAt: t.created_at,
          }));
        }
      } catch (err) {
        console.warn("[WalletService.getTransactions] Error:", err);
      }
    }

    // Mémoire
    return Array.from(memoryState.transactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Liste des packs d'AI Coins disponibles
   */
  public static async getPackages(): Promise<CreditPackage[]> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("credit_packages")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            description: p.description,
            credits: p.credits,
            price: p.price,
            currency: p.currency,
            bonusCredits: p.bonus_credits,
            isActive: p.is_active,
            displayOrder: p.display_order,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }));
        }
      } catch (err) {
        console.warn("[WalletService.getPackages] Error:", err);
      }
    }

    return memoryState.packages;
  }

  /**
   * Barème officiel complet des fonctionnalités IA
   */
  public static async getCosts(): Promise<CreditCost[]> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("credit_costs")
          .select("*")
          .order("cost", { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((c: any) => ({
            id: c.id,
            featureKey: c.feature_key,
            name: c.name,
            cost: c.cost,
            isActive: c.is_active,
            category: c.category,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          }));
        }
      } catch (err) {
        console.warn("[WalletService.getCosts] Error:", err);
      }
    }

    return Object.entries(DEFAULT_AI_COIN_COSTS).map(([key, cost]) => ({
      id: `cost-${key}`,
      featureKey: key,
      name: key.replace(/_/g, " "),
      cost,
      isActive: true,
      category: "ia",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  /**
   * Nettoyage automatique des réservations expirées
   */
  public static async cleanupExpiredReservations(olderThanMinutes = 15): Promise<number> {
    if (supabaseAdmin) {
      try {
        const rpcResult = await (supabaseAdmin.rpc("cleanup_expired_reservations", {
          p_older_than_minutes: olderThanMinutes,
        }) as any);
        const data = rpcResult?.data;
        const error = rpcResult?.error;
        if (!error && typeof data === "number") {
          return data;
        }
      } catch (err) {
        console.warn("[WalletService.cleanupExpiredReservations] Error:", err);
      }
    }

    let cleaned = 0;
    const now = Date.now();
    for (const res of Array.from(memoryState.reservations.values())) {
      if ((res.status === "reserved" || res.status === "processing") && new Date(res.expiresAt).getTime() < now) {
        await this.release({ operationId: res.operationId, reason: "EXPIRED_CLEANUP" });
        cleaned++;
      }
    }
    return cleaned;
  }
}
