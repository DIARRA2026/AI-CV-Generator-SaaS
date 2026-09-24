import { supabaseAdmin } from "./supabaseAdmin";
import { LivraisonResult } from "./types";

/**
 * MONCV.AI - livrerPack()
 * ============================================================
 * Point d entree UNIQUE et IDEMPOTENT pour livrer un pack apres paiement valide.
 * Peut etre appele par :
 *   - Un administrateur via l interface /admin/paiements
 *   - Un webhook de paiement futur (structure identique)
 *
 * Idempotence garantie par :
 *   - Verrou FOR UPDATE sur payment_claims en Postgres
 *   - Contrainte UNIQUE(reference) sur credit_ledger
 *   - Statut 'valide' retourne succes sans re-crediter
 *
 * @param claimId - UUID de la declaration de paiement (payment_claims.id)
 * @param source  - 'admin' | 'webhook' (pour logs et audit)
 */
export async function livrerPack(
  claimId: string,
  source: "admin" | "webhook"
): Promise<LivraisonResult> {
  if (!supabaseAdmin) {
    return { success: false, message: "Service de donnees indisponible" };
  }

  const adminId = source === "admin" ? null : null; // null = systeme automatique

  try {
    const { data, error } = await supabaseAdmin.rpc("livrer_pack_pg", {
      p_claim_id: claimId,
      p_admin_id: adminId,
    });

    if (error) {
      console.error("[livrerPack] Erreur RPC livrer_pack_pg:", error);
      return {
        success: false,
        message: error.message || "Erreur lors de la livraison du pack",
      };
    }

    const result = data as {
      success: boolean;
      message: string;
      credits_accordes?: number;
      pack_slug?: string;
      idempotent?: boolean;
    };

    if (!result.success) {
      return { success: false, message: result.message };
    }

    console.log(
      `[livrerPack] Pack livre - claim=${claimId} source=${source} credits=${result.credits_accordes} pack=${result.pack_slug} idempotent=${result.idempotent ?? false}`
    );

    return {
      success: true,
      message: result.message,
      creditsAccordes: result.credits_accordes,
      packSlug: result.pack_slug,
      idempotent: result.idempotent ?? false,
    };
  } catch (err: any) {
    console.error("[livrerPack] Exception:", err);
    return {
      success: false,
      message: err?.message || "Erreur interne lors de la livraison",
    };
  }
}

/**
 * livrerPackAdmin() - Variante avec contexte admin (ID de l admin)
 */
export async function livrerPackAdmin(
  claimId: string,
  adminId: string
): Promise<LivraisonResult> {
  if (!supabaseAdmin) {
    return { success: false, message: "Service de donnees indisponible" };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("livrer_pack_pg", {
      p_claim_id: claimId,
      p_admin_id: adminId,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const result = data as {
      success: boolean;
      message: string;
      credits_accordes?: number;
      pack_slug?: string;
      idempotent?: boolean;
    };

    return {
      success: result.success,
      message: result.message,
      creditsAccordes: result.credits_accordes,
      packSlug: result.pack_slug,
      idempotent: result.idempotent ?? false,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Erreur interne" };
  }
}

/**
 * rejeterClaim() - Rejeter une declaration avec motif
 */
export async function rejeterClaim(
  claimId: string,
  adminId: string,
  motif: string = "Reference introuvable ou montant incorrect"
): Promise<{ success: boolean; message: string }> {
  if (!supabaseAdmin) {
    return { success: false, message: "Service de donnees indisponible" };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("rejeter_claim", {
      p_claim_id: claimId,
      p_admin_id: adminId,
      p_motif: motif,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return data as { success: boolean; message: string };
  } catch (err: any) {
    return { success: false, message: err?.message || "Erreur interne" };
  }
}
