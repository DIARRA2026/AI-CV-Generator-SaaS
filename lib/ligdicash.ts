/**
 * MONCV.AI — CLIENT OFFICIEL PASSERELLE LIGDICASH
 * 
 * Documentation officielle : https://developers.ligdicash.com
 * Marché UEMOA (XOF) : Côte d'Ivoire, Burkina Faso, Sénégal, Mali, Bénin, Togo, Niger.
 * Opérateurs pris en charge : Orange Money, MTN Mobile Money, Moov Money, Wave, Carte Bancaire.
 */

import { PlanTier } from "./types";

export interface CreateInvoiceParams {
  planTier: PlanTier;
  planName: string;
  planDescription: string;
  amount: number;
  transactionRef: string;
  userId: string;
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  appUrl: string;
}

export interface LigdiCashInvoiceResponse {
  success: boolean;
  checkoutUrl?: string;
  invoiceToken?: string;
  message?: string;
  rawResponse?: any;
}

export interface LigdiCashConfirmResponse {
  success: boolean;
  status: "completed" | "pending" | "notcompleted" | "error";
  amount?: number;
  operatorName?: string;
  transactionId?: string;
  customerPhone?: string;
  rawResponse?: any;
}

export class LigdiCashClient {
  private static getBaseUrl(): string {
    return process.env.LIGDICASH_BASE_URL?.trim() || "https://app.ligdicash.com/pay/v01";
  }

  private static getApiKey(): string {
    return process.env.LIGDICASH_API_KEY?.trim() || "";
  }

  private static getApiToken(): string {
    return process.env.LIGDICASH_API_TOKEN?.trim() || "";
  }

  /**
   * Vérifie si les identifiants LigdiCash réels sont configurés
   */
  public static isConfigured(): boolean {
    const key = this.getApiKey();
    const token = this.getApiToken();
    return Boolean(key && token && !key.includes("votre_") && !key.includes("ici"));
  }

  /**
   * 1. Initialise une facture de paiement (Payin avec Redirection)
   * Endpoint : POST /pay/v01/redirect/checkout-invoice/create
   */
  public static async createInvoice(
    params: CreateInvoiceParams
  ): Promise<LigdiCashInvoiceResponse> {
    const {
      planTier,
      planName,
      planDescription,
      amount,
      transactionRef,
      userId,
      customerEmail,
      customerFirstName = "Candidat",
      customerLastName = "MonCV",
      customerPhone = "",
      appUrl,
    } = params;

    // Mode simulation / bac à sable si les identifiants ne sont pas encore configurés
    if (!this.isConfigured()) {
      console.warn("LigdiCash non configuré ou clés de test : activation du mode bac à sable.");
      const mockToken = `MOCK_LC_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const simulatedUrl = `${appUrl}/dashboard?payment=success&ref=${transactionRef}&simulated=true&token=${mockToken}`;
      return {
        success: true,
        checkoutUrl: simulatedUrl,
        invoiceToken: mockToken,
        message: "Facture simulée créée avec succès (Mode Sandbox).",
      };
    }

    const payload = {
      commande: {
        invoice: {
          items: [
            {
              name: planName,
              description: planDescription,
              quantity: 1,
              unit_price: amount,
              total_price: amount,
            },
          ],
          total_amount: amount,
          devise: "XOF",
          description: `MonCV.ai - ${planName}`,
          customer: customerPhone.replace(/[^0-9]/g, ""),
          customer_firstname: customerFirstName,
          customer_lastname: customerLastName,
          customer_email: customerEmail,
          external_id: transactionRef,
          otp: "",
        },
        store: {
          name: "MonCV.ai",
          website_url: appUrl,
        },
        actions: {
          cancel_url: `${appUrl}/dashboard?payment=cancelled&ref=${transactionRef}`,
          return_url: `${appUrl}/dashboard?payment=success&ref=${transactionRef}`,
          callback_url: `${appUrl}/api/webhooks/ligdicash`,
        },
        custom_data: {
          transaction_id: transactionRef,
          user_id: userId,
          user_email: customerEmail,
          plan_tier: planTier,
        },
      },
    };

    try {
      const endpoint = `${this.getBaseUrl()}/redirect/checkout-invoice/create`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Apikey: this.getApiKey(),
          Authorization: `Bearer ${this.getApiToken()}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      // LigdiCash renvoie response_code: "00" en cas de succès
      if (response.ok && data.response_code === "00" && data.response_text) {
        return {
          success: true,
          checkoutUrl: data.response_text,
          invoiceToken: data.token,
          message: "Facture LigdiCash générée avec succès.",
          rawResponse: data,
        };
      }

      console.error("Échec création facture LigdiCash :", data);
      return {
        success: false,
        message: data.description || data.message || "Erreur lors de la création de la facture LigdiCash.",
        rawResponse: data,
      };
    } catch (err: any) {
      console.error("Erreur réseau vers l'API LigdiCash :", err);
      return {
        success: false,
        message: err.message || "Impossible de joindre la passerelle de paiement LigdiCash.",
      };
    }
  }

  /**
   * 2. Pattern de Re-Vérification Officiel LigdiCash
   * Endpoint : GET /pay/v01/redirect/checkout-invoice/confirm/?invoiceToken={token}
   * Obligatoire pour authentifier la réalité d'un paiement après réception du webhook.
   */
  public static async confirmInvoice(
    invoiceToken: string
  ): Promise<LigdiCashConfirmResponse> {
    if (!invoiceToken) {
      return { success: false, status: "error" };
    }

    // Gestion du token de simulation sandbox
    if (invoiceToken.startsWith("MOCK_LC_") || !this.isConfigured()) {
      return {
        success: true,
        status: "completed",
        amount: 0,
        operatorName: "LIGDICASH MOCK (Wave/Orange/MTN)",
      };
    }

    try {
      const params = new URLSearchParams({ invoiceToken });
      const endpoint = `${this.getBaseUrl()}/redirect/checkout-invoice/confirm/?${params.toString()}`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Apikey: this.getApiKey(),
          Authorization: `Bearer ${this.getApiToken()}`,
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data) {
        const rawStatus = (data.status || "").toLowerCase().trim();
        const status: "completed" | "pending" | "notcompleted" =
          rawStatus === "completed"
            ? "completed"
            : rawStatus === "pending"
            ? "pending"
            : "notcompleted";

        // Extraction de l'identifiant de transaction depuis custom_data si présent
        let transactionId = data.external_id || "";
        if (!transactionId && Array.isArray(data.custom_data)) {
          const matched = data.custom_data.find((c: any) => c.keyof_customdata === "transaction_id");
          if (matched) transactionId = matched.valueof_customdata;
        }

        return {
          success: status === "completed",
          status,
          amount: data.amount || data.montant || 0,
          operatorName: data.operator_name || "Mobile Money",
          transactionId,
          customerPhone: data.customer || data.customer_details?.phone,
          rawResponse: data,
        };
      }

      return {
        success: false,
        status: "notcompleted",
        rawResponse: data,
      };
    } catch (err: any) {
      console.error("Erreur re-vérification LigdiCash :", err);
      return {
        success: false,
        status: "error",
      };
    }
  }
}
