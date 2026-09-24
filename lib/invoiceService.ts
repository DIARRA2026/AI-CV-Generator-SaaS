import { supabase } from "./supabaseClient";
import { supabaseAdmin } from "./supabaseAdmin";
import { Invoice } from "./types";

export const INNOVA_GROUP_INFO = {
  nom: "INNOVA GROUP SARL",
  service: "MonCV.ai — Plateforme Numérique d IA pour l Emploi",
  rccm: "CI-ABJ-03-2024-B12-00000",
  ifu: "2400000X",
  siege: "Abidjan, Cocody Riviera Palmeraie, Côte d Ivoire",
  telephone: "+225 07 00 00 00 00",
  email: "contact@moncv.ai",
  regimeFiscal: "Régime d imposition des prestations de services numériques — TVA non applicable selon réglementation fiscale OHADA / DGI Côte d Ivoire.",
};

export class InvoiceService {
  /**
   * Récupère la facture associée à une déclaration de paiement
   */
  static async getInvoiceForClaim(claimId: string): Promise<Invoice | null> {
    const client = supabaseAdmin || supabase;
    if (!client || !claimId) return null;

    try {
      const { data, error } = await client
        .from("invoices")
        .select("*")
        .eq("claim_id", claimId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        numero: data.numero,
        claimId: data.claim_id,
        compteId: data.compte_id,
        compteType: data.compte_type,
        clientNom: data.client_nom,
        clientEmail: data.client_email,
        clientRccm: data.client_rccm,
        clientIfu: data.client_ifu,
        packSlug: data.pack_slug,
        packNom: data.pack_nom,
        credits: data.credits,
        montantFcfa: data.montant_fcfa,
        pdfUrl: data.pdf_url,
        creeLe: data.cree_le,
      };
    } catch {
      return null;
    }
  }

  /**
   * Récupère une facture par son identifiant unique
   */
  static async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const client = supabaseAdmin || supabase;
    if (!client || !invoiceId) return null;

    try {
      const { data, error } = await client
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        numero: data.numero,
        claimId: data.claim_id,
        compteId: data.compte_id,
        compteType: data.compte_type,
        clientNom: data.client_nom,
        clientEmail: data.client_email,
        clientRccm: data.client_rccm,
        clientIfu: data.client_ifu,
        packSlug: data.pack_slug,
        packNom: data.pack_nom,
        credits: data.credits,
        montantFcfa: data.montant_fcfa,
        pdfUrl: data.pdf_url,
        creeLe: data.cree_le,
      };
    } catch {
      return null;
    }
  }
}
