import { WalletService } from "./credits/walletService";
import { ExecuterActionResult } from "./types";

/**
 * MONCV.AI - executerAction()
 * ============================================================
 * ARCHITECTURE SÉCURISÉE EN DEUX PHASES (TWO-PHASE COMMIT) :
 * 1. Détermination du coût officiel depuis credit_costs (DB).
 * 2. Réservation atomique préalable des AI Coins (FOR UPDATE).
 * 3. Exécution de la génération IA.
 * 4. Validation stricte du résultat produit.
 * 5. Si succès : Consommation définitive de la réservation + Inscription au Ledger.
 * 6. Si échec ou exception : Libération immédiate et restitution des AI Coins au solde disponible.
 */
export async function executerAction<T>({
  compteId,
  compteType = "user",
  action,
  reference,
  generer,
  valider,
}: {
  compteId: string;
  compteType?: "user" | "org";
  action: string;
  reference: string;
  generer: () => Promise<T>;
  valider: (result: T) => boolean;
}): Promise<ExecuterActionResult<T>> {
  if (!compteId) {
    return { ok: false, motif: "compte_requis" };
  }

  // 1. Lire le coût de l'action dans le barème officiel
  const cout = await WalletService.getFeatureCost(action);
  const operationId = reference || `OP_${Date.now()}_${compteId.substring(0, 6)}`;

  // 2. Si action gratuite : exécuter directement sans réservation
  if (cout === 0) {
    let resultat: T;
    try {
      resultat = await generer();
    } catch (err: any) {
      console.error("[executerAction] Échec génération gratuite:", err);
      return { ok: false, motif: "echec_ia:" + (err?.message ?? "erreur interne") };
    }

    if (!valider(resultat)) {
      return { ok: false, motif: "resultat_invalide" };
    }

    const wallet = await WalletService.getWallet(compteId);
    return {
      ok: true,
      resultat,
      solde: wallet.availableCredits,
      motif: "gratuit",
    };
  }

  // 3. PHASE 1 : Réservation préalable atomique
  const reservation = await WalletService.reserve({
    userId: compteId,
    operationId,
    operationType: action,
    amount: cout,
    ttlMinutes: 10,
    metadata: { action, reference, compteType },
  });

  if (!reservation.ok) {
    const available = reservation.availableCredits ?? 0;
    const required = cout;
    console.warn(
      `[executerAction] Réservation refusée - compte=${compteId} action=${action} dispo=${available} requis=${required}`
    );
    return {
      ok: false,
      solde: available,
      motif: `solde_insuffisant:${available}:${required}`,
    };
  }

  // 4. Exécution de la génération IA (les crédits sont réservés, non encore consommés)
  let resultat: T;
  try {
    resultat = await generer();
  } catch (err: any) {
    // ÉCHEC IA -> LIBÉRATION IMMÉDIATE DE LA RÉSERVATION
    console.error(`[executerAction] Échec IA pour ${operationId}, libération des crédits:`, err?.message);
    await WalletService.release({
      operationId,
      reason: `AI_ERROR: ${err?.message || "erreur interne"}`,
    });

    const wallet = await WalletService.getWallet(compteId);
    return {
      ok: false,
      solde: wallet.availableCredits,
      motif: "echec_ia:" + (err?.message ?? "erreur interne"),
    };
  }

  // 5. Validation du résultat retourné
  if (!valider(resultat)) {
    console.warn(`[executerAction] Résultat invalide pour ${operationId}, libération des crédits`);
    await WalletService.release({
      operationId,
      reason: "VALIDATION_FAILED",
    });

    const wallet = await WalletService.getWallet(compteId);
    return {
      ok: false,
      solde: wallet.availableCredits,
      motif: "resultat_invalide",
    };
  }

  // 6. PHASE 2 SUCCÈS : Consommation définitive de la réservation
  const completion = await WalletService.complete({
    operationId,
    feature: action,
    metadata: { reference, action, cout },
  });

  if (!completion.ok) {
    // Cas de secours exceptionnel
    console.error(
      `[executerAction] Erreur lors de la complétion pour ${operationId}:`,
      completion.message
    );
  }

  const wallet = await WalletService.getWallet(compteId);

  return {
    ok: true,
    resultat,
    solde: completion.availableCredits ?? wallet.availableCredits,
    motif: "ok",
  };
}
