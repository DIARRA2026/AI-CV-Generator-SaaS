import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Définition des mocks pour Supabase Admin
const mockRpc = vi.fn();
const mockOrderUpdate = vi.fn();
const mockOrderSelect = vi.fn();

vi.mock("@/lib/supabaseAdmin", () => {
  return {
    supabaseAdmin: {
      from: (table: string) => {
        if (table === "orders") {
          return {
            select: (...args: any[]) => ({
              eq: (col: string, val: any) => ({
                maybeSingle: () => mockOrderSelect(col, val),
              }),
            }),
            update: (values: any) => ({
              eq: (col: string, val: any) => mockOrderUpdate(values, col, val),
            }),
          };
        }
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
        };
      },
      rpc: (fnName: string, params: any) => mockRpc(fnName, params),
    },
  };
});

// Import après le mock de supabaseAdmin
import { confirmKKiaPayPayment } from "@/lib/payments/confirm-kkiapay-payment";
import { verifyWebhookSecretHeader, getKKiaPayServerConfig } from "@/lib/kkiapay/server";

describe("KKiaPay Payment Verification Suite (confirmKKiaPayPayment)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY: "pk_test_12345",
      NEXT_PUBLIC_KKIAPAY_SANDBOX: "true",
      KKIAPAY_PRIVATE_KEY: "pr_test_secret",
      KKIAPAY_SECRET: "sk_test_secret",
      KKIAPAY_WEBHOOK_SECRET: "whsec_moncv_test_secret_123",
      VERCEL_ENV: "preview",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // CAS 1 : Paiement SUCCESS avec bon montant et bonne commande
  it("Scénario 1 : Paiement SUCCESS avec le bon montant et la bonne commande -> statut 'paid'", async () => {
    const mockOrder = {
      id: "ord-test-001",
      user_id: "usr-valid-123",
      plan_id: "pro",
      amount_xof: 2500,
      status: "pending",
    };

    mockOrderSelect.mockResolvedValueOnce({ data: mockOrder, error: null });
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "ord-test-001",
        plan_id: "pro",
        subscription_id: "sub-uuid-001",
        expires_at: "2026-10-31T12:00:00.000Z",
        message: "Abonnement activé avec succès.",
      },
      error: null,
    });

    const result = await confirmKKiaPayPayment({
      transactionId: "tx-kkiapay-success-1",
      expectedOrderId: "ord-test-001",
      expectedUserId: "usr-valid-123",
      mockVerifyResponse: {
        status: "SUCCESS",
        type: "DEBIT",
        amount: 2500,
        partnerId: "ord-test-001",
        transactionId: "tx-kkiapay-success-1",
        source: "MTN",
        source_common_name: "MTN Mobile Money",
      },
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("paid");
    expect(result.planId).toBe("pro");
    expect(result.expiresAt).toBe("2026-10-31T12:00:00.000Z");
    expect(mockRpc).toHaveBeenCalledWith("confirm_kkiapay_payment", {
      p_order_id: "ord-test-001",
      p_transaction_id: "tx-kkiapay-success-1",
      p_amount: 2500,
      p_fees: 0,
      p_payment_method: "MTN Mobile Money",
      p_environment: "sandbox",
      p_raw_reference: expect.any(Object),
    });
  });

  // CAS 2 : Paiement FAILED
  it("Scénario 2 : Paiement FAILED -> statut de commande 'failed', aucune activation", async () => {
    mockOrderUpdate.mockResolvedValueOnce({ data: null, error: null });

    const result = await confirmKKiaPayPayment({
      transactionId: "tx-kkiapay-failed-2",
      expectedOrderId: "ord-test-002",
      mockVerifyResponse: {
        status: "FAILED",
        amount: 2500,
        partnerId: "ord-test-002",
        transactionId: "tx-kkiapay-failed-2",
        failureCode: "INSUFFICIENT_FUNDS",
        failureMessage: "Solde insuffisant",
      },
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("not_success");
    expect(mockOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed" }),
      "id",
      "ord-test-002"
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // CAS 3 : Paiement SUCCESS rejoué (idempotence)
  it("Scénario 3 : Paiement SUCCESS rejoué une deuxième fois -> réponse identique et idempotente sans erreur", async () => {
    const mockOrder = {
      id: "ord-test-003",
      user_id: "usr-valid-123",
      plan_id: "vip",
      amount_xof: 5000,
      status: "paid",
    };

    mockOrderSelect.mockResolvedValueOnce({ data: mockOrder, error: null });
    // Le RPC SQL gère l'idempotence et retourne la souscription existante
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        order_id: "ord-test-003",
        plan_id: "vip",
        subscription_id: "sub-uuid-already-created",
        expires_at: "2026-11-01T12:00:00.000Z",
        message: "Commande déjà confirmée (idempotence).",
      },
      error: null,
    });

    const result = await confirmKKiaPayPayment({
      transactionId: "tx-already-processed",
      expectedOrderId: "ord-test-003",
      expectedUserId: "usr-valid-123",
      mockVerifyResponse: {
        status: "SUCCESS",
        type: "DEBIT",
        amount: 5000,
        partnerId: "ord-test-003",
        transactionId: "tx-already-processed",
      },
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("paid");
    expect(result.planId).toBe("vip");
  });

  // CAS 4 : Transaction inconnue de KKiaPay
  it("Scénario 4 : Transaction inconnue de KKiaPay -> rejetée, statut inchangé", async () => {
    // Si verifyTransaction throw TRANSACTION_NOT_FOUND
    const kkiapayServer = await import("@/lib/kkiapay/server");
    const verifySpy = vi.spyOn(kkiapayServer, "verifyTransaction").mockRejectedValueOnce(
      new Error("TRANSACTION_NOT_FOUND")
    );

    const result = await confirmKKiaPayPayment({
      transactionId: "tx-unknown-999",
      expectedOrderId: "ord-test-004",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("unknown_transaction");
    expect(mockRpc).not.toHaveBeenCalled();

    verifySpy.mockRestore();
  });

  // CAS 5 : Montant payé différent du montant de la commande (Tentative de fraude)
  it("Scénario 5 : Montant payé différent de la commande -> rejeté avec 'amount_mismatch'", async () => {
    const mockOrder = {
      id: "ord-test-005",
      user_id: "usr-valid-123",
      plan_id: "vip",
      amount_xof: 5000, // Attendu : 5000
      status: "pending",
    };

    mockOrderSelect.mockResolvedValueOnce({ data: mockOrder, error: null });

    const result = await confirmKKiaPayPayment({
      transactionId: "tx-tampered-amt",
      expectedOrderId: "ord-test-005",
      expectedUserId: "usr-valid-123",
      mockVerifyResponse: {
        status: "SUCCESS",
        type: "DEBIT",
        amount: 1500, // Triche : payé seulement 1500
        partnerId: "ord-test-005",
        transactionId: "tx-tampered-amt",
      },
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("amount_mismatch");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // CAS 6 : Signature du webhook invalide
  it("Scénario 6 : Signature du webhook invalide ou absente -> rejetée (false)", () => {
    const secret = "whsec_moncv_test_secret_123";
    process.env.KKIAPAY_WEBHOOK_SECRET = secret;

    expect(verifyWebhookSecretHeader(null)).toBe(false);
    expect(verifyWebhookSecretHeader("")).toBe(false);
    expect(verifyWebhookSecretHeader("wrong_secret_key")).toBe(false);
    expect(verifyWebhookSecretHeader("whsec_moncv_test_secret_124")).toBe(false);
    expect(verifyWebhookSecretHeader(secret)).toBe(true);
  });

  // CAS 7 : Transaction d'un autre utilisateur
  it("Scénario 7 : Transaction d'un autre utilisateur -> rejetée avec 'user_mismatch'", async () => {
    const mockOrder = {
      id: "ord-test-007",
      user_id: "usr-legit-owner",
      plan_id: "essentiel",
      amount_xof: 1500,
      status: "pending",
    };

    mockOrderSelect.mockResolvedValueOnce({ data: mockOrder, error: null });

    const result = await confirmKKiaPayPayment({
      transactionId: "tx-hijack-attempt",
      expectedOrderId: "ord-test-007",
      expectedUserId: "usr-attacker-different", // Utilisateur fraudeur
      mockVerifyResponse: {
        status: "SUCCESS",
        type: "DEBIT",
        amount: 1500,
        partnerId: "ord-test-007",
        transactionId: "tx-hijack-attempt",
      },
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("user_mismatch");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // CAS 8 : Transaction associée à une autre commande
  it("Scénario 8 : Transaction associée à une autre commande -> rejetée avec 'order_mismatch'", async () => {
    const mockOrder = {
      id: "ord-real-999",
      user_id: "usr-valid-123",
      plan_id: "essentiel",
      amount_xof: 1500,
      status: "pending",
    };

    mockOrderSelect.mockResolvedValueOnce({ data: mockOrder, error: null });

    const result = await confirmKKiaPayPayment({
      transactionId: "tx-order-mismatch",
      expectedOrderId: "ord-mismatch-requested", // Ne correspond pas à ord-real-999
      expectedUserId: "usr-valid-123",
      mockVerifyResponse: {
        status: "SUCCESS",
        type: "DEBIT",
        amount: 1500,
        partnerId: "ord-real-999",
        transactionId: "tx-order-mismatch",
      },
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("order_mismatch");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // CAS 9 : RÈGLE 6 - Blocage sandbox en production
  it("Scénario 9 : Règle 6 - Interdiction formelle du sandbox en production Vercel", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX = "true";

    expect(() => getKKiaPayServerConfig()).toThrow(
      /CONFIGURATION INTERDITE : Le mode sandbox KKiaPay ne peut pas être actif lorsque VERCEL_ENV === 'production'/
    );
  });
});
