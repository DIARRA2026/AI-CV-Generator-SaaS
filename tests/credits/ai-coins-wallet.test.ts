import { describe, it, expect, beforeEach } from "vitest";
import { WalletService } from "@/lib/credits/walletService";
import { executerAction } from "@/lib/actionRunner";

describe("Système de Monnaie Virtuelle Interne AI COINS - Suite de Tests Complète", () => {
  beforeEach(() => {
    // Réinitialisation de l'état mémoire avant chaque test
    WalletService.resetMemoryState();
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 1 : Inscription -> Wallet créé -> Bonus unique (50 AI Coins)
  // -------------------------------------------------------------------------
  it("Scénario 1 : Inscription -> Wallet créé -> Bonus d'inscription unique de 50 AI Coins (Idempotence)", async () => {
    const userId = "usr-signup-test-001";

    // 1. Première attribution du bonus
    const result1 = await WalletService.grantSignupBonus({
      userId,
      amount: 50,
      email: "newuser@moncv.ai",
    });

    expect(result1.ok).toBe(true);
    expect(result1.granted).toBe(50);
    expect(result1.availableCredits).toBe(50);

    // Vérification de l'état du wallet
    const wallet1 = await WalletService.getWallet(userId);
    expect(wallet1.availableCredits).toBe(50);
    expect(wallet1.reservedCredits).toBe(0);
    expect(wallet1.lifetimeEarned).toBe(50);

    // 2. Seconde tentative (protection d'idempotence)
    const result2 = await WalletService.grantSignupBonus({
      userId,
      amount: 50,
      email: "newuser@moncv.ai",
    });

    expect(result2.ok).toBe(true);
    expect(result2.alreadyGranted).toBe(true);

    // Le solde ne doit JAMAIS avoir doublé
    const wallet2 = await WalletService.getWallet(userId);
    expect(wallet2.availableCredits).toBe(50);
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 2 : Achat pack -> Confirmation -> Crédits et bonus ajoutés
  // -------------------------------------------------------------------------
  it("Scénario 2 : Achat pack -> Crédits et bonus promotionnel enregistrés distinctement dans le grand livre", async () => {
    const userId = "usr-purchase-test-002";

    // Solde initial = 50 (bonus d'inscription)
    await WalletService.grantSignupBonus({ userId, amount: 50 });

    // Achat du Pack Pro : 1 500 AI Coins + 200 Bonus
    const purchaseResult = await WalletService.purchase({
      userId,
      credits: 1500,
      bonus: 200,
      reference: "ORDER_KKIAPAY_PRO_002",
      description: "Pack Pro 1 500 AI Coins",
    });

    expect(purchaseResult.ok).toBe(true);
    expect(purchaseResult.creditsAdded).toBe(1500);
    expect(purchaseResult.bonusAdded).toBe(200);
    expect(purchaseResult.totalAdded).toBe(1700);
    expect(purchaseResult.availableCredits).toBe(1750); // 50 + 1500 + 200

    // Vérification du grand livre
    const transactions = await WalletService.getTransactions(userId);
    const purchaseTx = transactions.find((t) => t.type === "purchase");
    const bonusTx = transactions.find((t) => t.type === "promotion");

    expect(purchaseTx).toBeDefined();
    expect(purchaseTx?.amount).toBe(1500);
    expect(bonusTx).toBeDefined();
    expect(bonusTx?.amount).toBe(200);
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 3 : Webhook / Confirmation envoyé deux fois -> Idempotence absolue
  // -------------------------------------------------------------------------
  it("Scénario 3 : Webhook reçu en double -> Idempotence absolue, aucun double-crédit", async () => {
    const userId = "usr-webhook-test-003";
    const ref = "KKIAPAY_TX_DUPLICATE_003";

    // 1ère confirmation
    const call1 = await WalletService.purchase({
      userId,
      credits: 500,
      bonus: 50,
      reference: ref,
      description: "Pack Starter",
    });
    expect(call1.ok).toBe(true);
    expect(call1.availableCredits).toBe(550);

    // 2ème confirmation identique (rejouée par réseau/webhook)
    const call2 = await WalletService.purchase({
      userId,
      credits: 500,
      bonus: 50,
      reference: ref,
      description: "Pack Starter",
    });
    expect(call2.ok).toBe(true);
    expect(call2.idempotent).toBe(true);

    // Le solde doit rester 550 et non 1 100
    const wallet = await WalletService.getWallet(userId);
    expect(wallet.availableCredits).toBe(550);
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 4 : Réservation 20 sur solde 500 -> 480 dispo / 20 réservé
  // -------------------------------------------------------------------------
  it("Scénario 4 : Réservation de 20 sur solde 500 -> 480 disponible / 20 réservé", async () => {
    const userId = "usr-reserve-test-004";
    await WalletService.purchase({ userId, credits: 500, reference: "SEED_500" });

    const reserveRes = await WalletService.reserve({
      userId,
      operationId: "OP_CV_GEN_004",
      operationType: "cv_complet",
      amount: 20,
    });

    expect(reserveRes.ok).toBe(true);
    expect(reserveRes.availableCredits).toBe(480);
    expect(reserveRes.reservedCredits).toBe(20);

    const wallet = await WalletService.getWallet(userId);
    expect(wallet.availableCredits).toBe(480);
    expect(wallet.reservedCredits).toBe(20);
    expect(wallet.totalBalance).toBe(500); // Conservation de la masse monétaire
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 5 : Concurrence atomique -> 2 requêtes simultanées de 20 sur solde 20
  // -------------------------------------------------------------------------
  it("Scénario 5 : Concurrence atomique -> Deux requêtes de 20 pour solde 20 -> 1 succès, 1 rejet", async () => {
    const userId = "usr-concurrency-test-005";
    // Attribution exacte de 20 AI Coins
    await WalletService.purchase({ userId, credits: 20, reference: "SEED_EXACT_20" });

    // Lancement de 2 réservations simultanées de 20 chacune
    const [resA, resB] = await Promise.all([
      WalletService.reserve({
        userId,
        operationId: "OP_CONCURRENT_A",
        operationType: "cv_complet",
        amount: 20,
      }),
      WalletService.reserve({
        userId,
        operationId: "OP_CONCURRENT_B",
        operationType: "cv_complet",
        amount: 20,
      }),
    ]);

    // Une seule réservation doit réussir
    const successCount = [resA, resB].filter((r) => r.ok).length;
    const failureCount = [resA, resB].filter((r) => !r.ok).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    // Le solde disponible ne doit jamais être négatif
    const wallet = await WalletService.getWallet(userId);
    expect(wallet.availableCredits).toBe(0);
    expect(wallet.reservedCredits).toBe(20);
    expect(wallet.availableCredits).toBeGreaterThanOrEqual(0);
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 6 : Échec IA -> Libération de la réservation -> Crédits restitués
  // -------------------------------------------------------------------------
  it("Scénario 6 : Échec de l'IA -> Libération immédiate -> Restitution intégrale des crédits", async () => {
    const userId = "usr-fail-ia-test-006";
    await WalletService.purchase({ userId, credits: 100, reference: "SEED_100_FAIL_TEST" });

    // Exécution avec executerAction qui rencontre une erreur IA
    const result = await executerAction({
      compteId: userId,
      action: "cv_complet", // Coût 20
      reference: "GEN_FAILING_IA_006",
      generer: async () => {
        throw new Error("Timeout du fournisseur IA Google Gemini");
      },
      valider: () => true,
    });

    expect(result.ok).toBe(false);
    expect(result.motif).toContain("echec_ia");

    // Vérifier que la réservation a bien été libérée et le solde de 100 restauré
    const wallet = await WalletService.getWallet(userId);
    expect(wallet.availableCredits).toBe(100);
    expect(wallet.reservedCredits).toBe(0);
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 7 : Timeout / Retry -> Nettoyage sans remboursement prématuré
  // -------------------------------------------------------------------------
  it("Scénario 7 : Réservation orpheline expirée -> Nettoyage et restitution au solde disponible", async () => {
    const userId = "usr-timeout-test-007";
    await WalletService.purchase({ userId, credits: 50, reference: "SEED_50_TIMEOUT" });

    // Création d'une réservation avec TTL = 0 (immédiatement expirée pour le test)
    await WalletService.reserve({
      userId,
      operationId: "OP_EXPIRED_007",
      operationType: "cv_complet",
      amount: 20,
      ttlMinutes: -1, // Expirée dans le passé
    });

    const walletBeforeClean = await WalletService.getWallet(userId);
    expect(walletBeforeClean.availableCredits).toBe(30);
    expect(walletBeforeClean.reservedCredits).toBe(20);

    // Lancement du nettoyage des réservations expirées
    const cleanedCount = await WalletService.cleanupExpiredReservations(0);
    expect(cleanedCount).toBeGreaterThanOrEqual(1);

    // Les crédits doivent être retournés au solde disponible
    const walletAfterClean = await WalletService.getWallet(userId);
    expect(walletAfterClean.availableCredits).toBe(50);
    expect(walletAfterClean.reservedCredits).toBe(0);
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 8 : Isolation RLS & Utilisateurs -> L'utilisateur A ne peut pas toucher B
  // -------------------------------------------------------------------------
  it("Scénario 8 : Isolation des comptes -> Les portefeuilles A et B sont strictement séparés", async () => {
    const userA = "usr-alice-008";
    const userB = "usr-bob-008";

    await WalletService.purchase({ userId: userA, credits: 100, reference: "SEED_ALICE" });
    await WalletService.purchase({ userId: userB, credits: 30, reference: "SEED_BOB" });

    // Réservation pour Alice
    await WalletService.reserve({
      userId: userA,
      operationId: "OP_ALICE_ACTION",
      operationType: "cv_complet",
      amount: 20,
    });

    const walletAlice = await WalletService.getWallet(userA);
    const walletBob = await WalletService.getWallet(userB);

    expect(walletAlice.availableCredits).toBe(80);
    expect(walletAlice.reservedCredits).toBe(20);

    // Le portefeuille de Bob doit être strictement intact
    expect(walletBob.availableCredits).toBe(30);
    expect(walletBob.reservedCredits).toBe(0);
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 9 : Protection anti-fraude -> Solde négatif strictement interdit
  // -------------------------------------------------------------------------
  it("Scénario 9 : Protection anti-fraude -> Tentative de sur-consommation refusée, solde non négatif", async () => {
    const userId = "usr-fraud-test-009";
    await WalletService.purchase({ userId, credits: 10, reference: "SEED_10" });

    // Tenter de réserver 50 AI Coins avec seulement 10 disponibles
    const reserveRes = await WalletService.reserve({
      userId,
      operationId: "OP_OVERDRAW_009",
      operationType: "photo_ia",
      amount: 50,
    });

    expect(reserveRes.ok).toBe(false);
    expect(reserveRes.error).toBe("INSUFFICIENT_CREDITS");
    expect(reserveRes.missingCredits).toBe(40);

    const wallet = await WalletService.getWallet(userId);
    expect(wallet.availableCredits).toBe(10);
    expect(wallet.availableCredits).toBeGreaterThanOrEqual(0);
  });

  // -------------------------------------------------------------------------
  // SCÉNARIO 10 : Ajustement administrateur -> Enregistrement obligatoire avec motif
  // -------------------------------------------------------------------------
  it("Scénario 10 : Ajustement admin -> Motif obligatoire et enregistrement immuable au ledger", async () => {
    const adminId = "admin-super-010";
    const userId = "usr-customer-010";

    await WalletService.grantSignupBonus({ userId, amount: 50 });

    // 1. Refus sans motif
    const invalidAdjust = await WalletService.adminAdjust({
      adminId,
      userId,
      amount: 100,
      reason: "", // Motif vide
    });
    expect(invalidAdjust.ok).toBe(false);
    expect(invalidAdjust.error).toBe("REASON_REQUIRED");

    // 2. Succès avec motif valide
    const validAdjust = await WalletService.adminAdjust({
      adminId,
      userId,
      amount: 100,
      reason: "Geste commercial suite incident technique",
    });

    expect(validAdjust.ok).toBe(true);
    expect(validAdjust.availableCredits).toBe(150); // 50 + 100

    // Vérification de la présence dans le grand livre
    const transactions = await WalletService.getTransactions(userId);
    const adminTx = transactions.find((t) => t.type === "admin_adjustment");

    expect(adminTx).toBeDefined();
    expect(adminTx?.amount).toBe(100);
    expect(adminTx?.description).toContain("Geste commercial suite incident technique");
  });
});
