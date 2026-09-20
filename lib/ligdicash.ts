/**
 * MONCV.AI — PASSERELLES DE PAIEMENT DÉSACTIVÉES
 * 
 * L'application fonctionne désormais en mode 100% libre et gratuit.
 * Tous les modules (CV, Lettres de motivation, Demandes d'emploi, Export PDF/Word)
 * sont automatiquement débloqués pour l'ensemble des utilisateurs.
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
  public static isConfigured(): boolean {
    return false;
  }

  public static async createInvoice(
    _params: CreateInvoiceParams
  ): Promise<LigdiCashInvoiceResponse> {
    return {
      success: false,
      message: "Passerelle de paiement désactivée. Accès 100% gratuit et libre.",
    };
  }

  public static async confirmInvoice(
    _token: string
  ): Promise<LigdiCashConfirmResponse> {
    return {
      success: true,
      status: "completed",
    };
  }

  public static async verifyInvoiceStatus(
    _token: string
  ): Promise<LigdiCashConfirmResponse> {
    return {
      success: true,
      status: "completed",
    };
  }
}
