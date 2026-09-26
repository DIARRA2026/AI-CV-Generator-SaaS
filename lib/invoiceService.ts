import { supabase } from "./supabaseClient";
import { supabaseAdmin } from "./supabaseAdmin";
import { Invoice } from "./types";

export const INNOVA_GROUP_INFO = {
  nom: "INNOVA GROUP SARL",
  service: "MonCV.ai — Plateforme Numérique d IA pour l Emploi",
  rccm: "CI-BKE-2019-A-228",
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
    if (client && invoiceId) {
      try {
        const { data, error } = await client
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();

        if (!error && data) {
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
        }
      } catch {
        // Fallback local ci-dessous
      }
    }

    if (typeof window !== "undefined") {
      const local = (await import("./storage")).StorageManager.getInvoices();
      const found = local.find((i) => i.id === invoiceId || i.numero === invoiceId);
      if (found) return found;
    }

    return null;
  }

  /**
   * Récupère TOUTES les factures de souscription sauvegardées (Supabase + Console locale)
   */
  static async getAllInvoices(): Promise<Invoice[]> {
    const invoicesMap = new Map<string, Invoice>();

    // 1. Récupérer depuis Supabase si disponible
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        const { data, error } = await client
          .from("invoices")
          .select("*")
          .order("cree_le", { ascending: false });

        if (!error && Array.isArray(data)) {
          data.forEach((row) => {
            const inv: Invoice = {
              id: row.id,
              numero: row.numero,
              claimId: row.claim_id,
              compteId: row.compte_id,
              compteType: row.compte_type,
              clientNom: row.client_nom,
              clientEmail: row.client_email,
              clientRccm: row.client_rccm,
              clientIfu: row.client_ifu,
              packSlug: row.pack_slug,
              packNom: row.pack_nom,
              credits: row.credits,
              montantFcfa: row.montant_fcfa,
              pdfUrl: row.pdf_url,
              creeLe: row.cree_le,
              modePaiement: "Wave / Mobile Money (Vérifié)",
              statut: "payee",
            };
            invoicesMap.set(inv.numero, inv);
          });
        }
      } catch (err) {
        console.warn("Impossible de charger les factures depuis Supabase, utilisation du stockage console:", err);
      }
    }

    // 2. Récupérer depuis le registre local de la console
    if (typeof window !== "undefined") {
      const { StorageManager } = await import("./storage");
      const localInvoices = StorageManager.ensureExistingInvoices();
      localInvoices.forEach((inv) => {
        if (!invoicesMap.has(inv.numero)) {
          invoicesMap.set(inv.numero, inv);
        }
      });
    }

    return Array.from(invoicesMap.values()).sort(
      (a, b) => new Date(b.creeLe).getTime() - new Date(a.creeLe).getTime()
    );
  }

  /**
   * Crée et enregistre une facture de souscription dans Supabase et dans la console
   */
  static async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const year = new Date().getFullYear();
    const numero = invoiceData.numero || `INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullInvoice: Invoice = {
      id: invoiceData.id || `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      numero,
      claimId: invoiceData.claimId || null,
      compteId: invoiceData.compteId || "compte-local",
      compteType: invoiceData.compteType || "user",
      clientNom: invoiceData.clientNom || "Client MonCV.ai",
      clientEmail: invoiceData.clientEmail || null,
      clientTelephone: invoiceData.clientTelephone || null,
      clientRccm: invoiceData.clientRccm || null,
      clientIfu: invoiceData.clientIfu || null,
      packSlug: invoiceData.packSlug || "2500",
      packNom: invoiceData.packNom || "Pack Candidature Pro",
      credits: invoiceData.credits || 350,
      montantFcfa: invoiceData.montantFcfa || 2500,
      modePaiement: invoiceData.modePaiement || "Mobile Money",
      referencePaiement: invoiceData.referencePaiement || `TRX-${Date.now()}`,
      statut: "payee",
      creeLe: invoiceData.creeLe || new Date().toISOString(),
    };

    // Sauvegarde Supabase
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        await client.from("invoices").insert({
          id: fullInvoice.id,
          numero: fullInvoice.numero,
          claim_id: fullInvoice.claimId,
          compte_id: fullInvoice.compteId,
          compte_type: fullInvoice.compteType,
          client_nom: fullInvoice.clientNom,
          client_email: fullInvoice.clientEmail,
          client_rccm: fullInvoice.clientRccm,
          client_ifu: fullInvoice.clientIfu,
          pack_slug: fullInvoice.packSlug,
          pack_nom: fullInvoice.packNom,
          credits: fullInvoice.credits,
          montant_fcfa: fullInvoice.montantFcfa,
          cree_le: fullInvoice.creeLe,
        });
      } catch (err) {
        console.warn("Échec insertion Supabase invoices, sauvegarde locale active:", err);
      }
    }

    // Sauvegarde Console locale
    if (typeof window !== "undefined") {
      const { StorageManager } = await import("./storage");
      StorageManager.saveInvoice(fullInvoice);
    }

    return fullInvoice;
  }

  /**
   * Export des factures au format CSV pour la comptabilité OHADA / DGI
   */
  static exportInvoicesCsv(invoices: Invoice[]): string {
    if (!invoices || invoices.length === 0) return "";
    const headers = [
      "Numéro Facture",
      "Date Émission",
      "Nom Client / Raison Sociale",
      "Email Client",
      "Téléphone",
      "RCCM Client",
      "IFU Client",
      "Type de Compte",
      "Formule / Pack",
      "Crédits Inclus",
      "Montant (FCFA)",
      "Mode de Règlement",
      "Référence Paiement",
      "Statut Fiscal",
      "Émetteur",
      "RCCM Émetteur"
    ];

    const rows = invoices.map((inv) => [
      inv.numero,
      new Date(inv.creeLe).toLocaleDateString("fr-FR"),
      `"${(inv.clientNom || "").replace(/"/g, '""')}"`,
      inv.clientEmail || "",
      inv.clientTelephone || "",
      inv.clientRccm || "N/A",
      inv.clientIfu || "N/A",
      inv.compteType === "org" ? "Entreprise B2B" : "Particulier",
      `"${(inv.packNom || inv.packSlug).replace(/"/g, '""')}"`,
      inv.credits,
      inv.montantFcfa,
      `"${(inv.modePaiement || "Mobile Money").replace(/"/g, '""')}"`,
      inv.referencePaiement || inv.claimId || "",
      "Conforme OHADA - Payée",
      `"${INNOVA_GROUP_INFO.nom}"`,
      INNOVA_GROUP_INFO.rccm
    ]);

    return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  }
}

