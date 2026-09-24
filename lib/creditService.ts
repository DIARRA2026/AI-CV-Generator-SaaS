import { supabase } from "./supabaseClient";
import { supabaseAdmin } from "./supabaseAdmin";
import { SoldeCredits, CreditBatchV2, CreditLedgerEntryV2, PaymentClaimV2 } from "./types";
import { getCreditPack } from "@/config/payments";

export type CompteType = "user" | "org";

/**
 * CreditService — Couche d acces aux donnees du systeme de credits.
 * Toutes les methodes acceptent compteId + compteType pour supporter B2B (orgs).
 * Le debit atomique passe TOUJOURS par executerAction() ou consommer_credits() en DB.
 * Ne jamais debiter directement depuis ce service dans une route IA.
 */
export class CreditService {
  /**
   * Solde consolide du compte (user ou org)
   */
  static async getSolde(
    compteId: string,
    compteType: CompteType = "user"
  ): Promise<SoldeCredits> {
    const client = supabaseAdmin || supabase;
    if (!client || !compteId) {
      return { solde: 0, prochaineExpiration: null, nbLots: 0 };
    }
    try {
      const { data } = await client.rpc("solde_credits", {
        p_compte: compteId,
        p_type: compteType,
      });
      if (Array.isArray(data) && data.length > 0) {
        return {
          solde: Number(data[0].solde) || 0,
          prochaineExpiration: data[0].prochaine_expiration || null,
          nbLots: Number(data[0].nb_lots) || 0,
        };
      }
      return { solde: 0, prochaineExpiration: null, nbLots: 0 };
    } catch {
      return { solde: 0, prochaineExpiration: null, nbLots: 0 };
    }
  }

  /**
   * Alias compat legacy - utilise user comme compte_type
   */
  static async getUserBalance(userId: string): Promise<{
    balance: number; nearestExpiry: string | null; activeBatchesCount: number;
  }> {
    const s = await CreditService.getSolde(userId, "user");
    return { balance: s.solde, nearestExpiry: s.prochaineExpiration, activeBatchesCount: s.nbLots };
  }

  /**
   * Lots de credits actifs du compte
   */
  static async getLots(
    compteId: string,
    compteType: CompteType = "user"
  ): Promise<CreditBatchV2[]> {
    const client = supabaseAdmin || supabase;
    if (!client || !compteId) return [];
    try {
      const now = new Date().toISOString();
      const { data } = await client
        .from("credit_batches")
        .select("*")
        .eq("compte_id", compteId)
        .eq("compte_type", compteType)
        .gt("restant", 0)
        .or(`expire_le.is.null,expire_le.gt.${now}`)
        .order("expire_le", { ascending: true, nullsFirst: false });
      if (!data) return [];
      return data.map((b: any) => ({
        id: b.id,
        compteId: b.compte_id,
        compteType: b.compte_type,
        packSlug: b.pack_slug,
        creditsInitiaux: b.credits_initiaux,
        restant: b.restant,
        creeLe: b.cree_le,
        expireLe: b.expire_le,
        origine: b.origine,
        actif: b.actif,
      }));
    } catch { return []; }
  }

  /**
   * Alias compat legacy
   */
  static async getUserBatches(userId: string) {
    const lots = await CreditService.getLots(userId, "user");
    return lots.map(l => ({
      id: l.id,
      userId: l.compteId,
      creditsInitial: l.creditsInitiaux,
      creditsRemaining: l.restant,
      source: l.origine,
      packCode: l.packSlug,
      purchasedAt: l.creeLe,
      expiresAt: l.expireLe,
      createdAt: l.creeLe,
    }));
  }

  /**
   * Historique comptable (grand livre)
   */
  static async getLedger(
    compteId: string,
    compteType: CompteType = "user",
    limit = 50
  ): Promise<CreditLedgerEntryV2[]> {
    const client = supabaseAdmin || supabase;
    if (!client || !compteId) return [];
    try {
      const { data } = await client
        .from("credit_ledger")
        .select("*")
        .eq("compte_id", compteId)
        .eq("compte_type", compteType)
        .order("cree_le", { ascending: false })
        .limit(limit);
      if (!data) return [];
      return data.map((l: any) => ({
        id: l.id,
        compteId: l.compte_id,
        compteType: l.compte_type,
        lotId: l.lot_id,
        action: l.action,
        montant: l.montant,
        reference: l.reference,
        meta: l.meta || {},
        creeLe: l.cree_le,
      }));
    } catch { return []; }
  }

  /**
   * Alias compat legacy
   */
  static async getUserLedger(userId: string, limit = 50) {
    const ledger = await CreditService.getLedger(userId, "user", limit);
    return ledger.map(l => ({
      id: l.id,
      userId: l.compteId,
      batchId: l.lotId,
      action: l.action,
      delta: l.montant,
      balanceAfter: 0,
      ref: l.reference,
      createdAt: l.creeLe,
    }));
  }

  /**
   * Soumettre une declaration de paiement
   */
  static async submitPaymentClaim(payload: {
    compteId: string;
    compteType?: CompteType;
    packSlug: string;
    telephone?: string;
    operateur?: "wave" | "orange_money" | "autre";
    referenceTransaction?: string;
    screenshotUrl?: string;
    // legacy
    userId?: string;
    userEmail?: string;
    packCode?: string;
    waveReference?: string;
  }): Promise<{ success: boolean; claim?: PaymentClaimV2; message?: string }> {
    const client = supabaseAdmin || supabase;
    if (!client) return { success: false, message: "Service indisponible" };

    const compteId = payload.compteId || payload.userId || "";
    const compteType = payload.compteType ?? "user";
    const packSlug = payload.packSlug || payload.packCode || "";

    const pack = getCreditPack(packSlug);
    if (!pack || pack.prixFcfa <= 0) {
      return { success: false, message: "Pack payant invalide: " + packSlug };
    }

    try {
      const { data, error } = await client
        .from("payment_claims")
        .insert({
          compte_id: compteId,
          compte_type: compteType,
          pack_slug: packSlug,
          montant_attendu: pack.prixFcfa,
          telephone: payload.telephone?.trim() || null,
          operateur: payload.operateur ?? "wave",
          reference_transaction: (payload.referenceTransaction || payload.waveReference)?.trim() || null,
          screenshot_url: payload.screenshotUrl || null,
          statut: "en_attente",
        })
        .select()
        .single();

      if (error || !data) {
        return { success: false, message: error?.message || "Erreur enregistrement" };
      }

      return {
        success: true,
        claim: {
          id: data.id,
          compteId: data.compte_id,
          compteType: data.compte_type,
          packSlug: data.pack_slug,
          montantAttendu: data.montant_attendu,
          telephone: data.telephone,
          operateur: data.operateur,
          referenceTransaction: data.reference_transaction,
          screenshotUrl: data.screenshot_url,
          statut: data.statut,
          creeLe: data.cree_le,
        },
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Declarations de paiement d un compte
   */
  static async getClaims(
    compteId: string,
    compteType: CompteType = "user"
  ): Promise<PaymentClaimV2[]> {
    const client = supabaseAdmin || supabase;
    if (!client || !compteId) return [];
    try {
      const { data } = await client
        .from("payment_claims")
        .select("*")
        .eq("compte_id", compteId)
        .eq("compte_type", compteType)
        .order("cree_le", { ascending: false });
      if (!data) return [];
      return data.map((c: any) => ({
        id: c.id,
        compteId: c.compte_id,
        compteType: c.compte_type,
        packSlug: c.pack_slug,
        montantAttendu: c.montant_attendu,
        telephone: c.telephone,
        operateur: c.operateur,
        referenceTransaction: c.reference_transaction,
        screenshotUrl: c.screenshot_url,
        statut: c.statut,
        validePar: c.valide_par,
        valideLe: c.valide_le,
        note: c.note,
        creeLe: c.cree_le,
      }));
    } catch { return []; }
  }

  /**
   * Alias legacy getUserClaims
   */
  static async getUserClaims(userId: string) {
    const claims = await CreditService.getClaims(userId, "user");
    return claims.map(c => ({
      id: c.id,
      userId: c.compteId,
      userEmail: "",
      packCode: c.packSlug,
      amountFcfa: c.montantAttendu,
      waveReference: c.referenceTransaction ?? "",
      screenshotUrl: c.screenshotUrl,
      status: c.statut === "en_attente" ? "pending" : c.statut === "valide" ? "approved" : "rejected",
      rejectionReason: c.note,
      reviewedBy: c.validePar,
      reviewedAt: c.valideLe,
      createdAt: c.creeLe,
    }));
  }

  /**
   * Admin : toutes les declarations
   */
  static async getAdminClaims(statusFilter = "all") {
    if (!supabaseAdmin) return [];
    try {
      let query = supabaseAdmin
        .from("payment_claims")
        .select("*")
        .order("cree_le", { ascending: false });
      if (statusFilter !== "all") {
        const statut = statusFilter === "pending" ? "en_attente" : statusFilter === "approved" ? "valide" : statusFilter;
        query = query.eq("statut", statut);
      }
      const { data } = await query.limit(200);
      return (data ?? []).map((c: any) => ({
        id: c.id,
        userId: c.compte_id,
        userEmail: "",
        packCode: c.pack_slug,
        amountFcfa: c.montant_attendu,
        waveReference: c.reference_transaction ?? "",
        screenshotUrl: c.screenshot_url,
        status: c.statut === "en_attente" ? "pending" : c.statut === "valide" ? "approved" : "rejected",
        rejectionReason: c.note,
        reviewedBy: c.valide_par,
        reviewedAt: c.valide_le,
        createdAt: c.cree_le,
      }));
    } catch { return []; }
  }

  /** Alias legacy approveClaim */
  static async approveClaim(claimId: string, adminId: string) {
    const { livrerPackAdmin } = await import("./livrerPack");
    return livrerPackAdmin(claimId, adminId);
  }

  /** Alias legacy rejectClaim */
  static async rejectClaim(claimId: string, adminId: string, reason: string) {
    const { rejeterClaim } = await import("./livrerPack");
    return rejeterClaim(claimId, adminId, reason);
  }

  /** Alias legacy grantWelcomeCredits */
  static async grantWelcomeCredits(userId: string): Promise<boolean> {
    const client = supabaseAdmin || supabase;
    if (!client || !userId) return false;
    try {
      const { data } = await client.rpc("grant_decouverte", {
        p_compte_id: userId,
        p_type: "user",
        p_email: null,
      });
      return Boolean(data);
    } catch { return false; }
  }

  /** Alias legacy consumeCredits - NE PAS UTILISER dans les routes IA - utiliser executerAction() */
  static async consumeCredits(userId: string, amount: number, action: string, ref?: string) {
    console.warn("[CreditService.consumeCredits] Deprecated. Utiliser executerAction() dans les routes IA.");
    if (!supabaseAdmin) return { success: false, error: "Admin DB indisponible" };
    try {
      const { data } = await supabaseAdmin.rpc("consommer_credits", {
        p_compte: userId, p_type: "user", p_action: action,
        p_reference: ref ?? "LEGACY_" + Date.now(), p_meta: {},
      });
      const r = data?.[0];
      if (!r?.ok) return { success: false, error: r?.motif ?? "debit_echoue" };
      return { success: true, newBalance: r.restant };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
