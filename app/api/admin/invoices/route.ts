import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { InvoiceService } from "@/lib/invoiceService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/invoices
 * Récupère l'ensemble des factures de souscription pour la console SuperAdmin
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthUser(request);
    // Autoriser l'accès pour l'administration
    if (!auth.authenticated || !auth.isAdmin) {
      // Si requête interne depuis la console admin avec header ou token
      const authHeader = request.headers.get("authorization");
      if (!authHeader && !request.cookies.get("moncv_admin_session")) {
        return NextResponse.json(
          { success: false, message: "Accès réservé aux administrateurs" },
          { status: 403 }
        );
      }
    }

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("invoices")
        .select("*")
        .order("cree_le", { ascending: false })
        .limit(300);

      if (!error && Array.isArray(data)) {
        const formatted = data.map((row) => ({
          id: row.id,
          numero: row.numero,
          claimId: row.claim_id,
          compteId: row.compte_id,
          compteType: row.compte_type,
          clientNom: row.client_nom,
          clientEmail: row.client_email,
          clientTelephone: row.client_telephone || null,
          clientRccm: row.client_rccm,
          clientIfu: row.client_ifu,
          packSlug: row.pack_slug,
          packNom: row.pack_nom,
          credits: row.credits,
          montantFcfa: row.montant_fcfa,
          modePaiement: "Wave / Mobile Money (Vérifié)",
          referencePaiement: row.claim_id ? `CLAIM_${row.claim_id.slice(0, 8)}` : null,
          statut: "payee",
          pdfUrl: row.pdf_url,
          creeLe: row.cree_le,
        }));
        return NextResponse.json({ success: true, invoices: formatted });
      }
    }

    // Si Supabase indisponible, retourner un tableau vide
    return NextResponse.json({ success: true, invoices: [] });
  } catch (error: any) {
    console.error("Erreur GET /api/admin/invoices:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/invoices
 * Création manuelle d'une facture de souscription depuis la console
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthUser(request);
    if (!auth.authenticated || !auth.isAdmin) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader && !request.cookies.get("moncv_admin_session")) {
        return NextResponse.json(
          { success: false, message: "Accès réservé aux administrateurs" },
          { status: 403 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const { clientNom, clientEmail, clientTelephone, clientRccm, packSlug, packNom, montantFcfa, modePaiement } = body;

    if (!clientNom || !montantFcfa) {
      return NextResponse.json(
        { success: false, message: "Nom du client et montant requis" },
        { status: 400 }
      );
    }

    const newInvoice = await InvoiceService.createInvoice({
      clientNom,
      clientEmail,
      clientTelephone,
      clientRccm,
      packSlug: packSlug || "custom",
      packNom: packNom || "Abonnement Personnalisé",
      montantFcfa: Number(montantFcfa),
      modePaiement: modePaiement || "Paiement Direct Console Admin",
    });

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error: any) {
    console.error("Erreur POST /api/admin/invoices:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur lors de la création de la facture" },
      { status: 500 }
    );
  }
}
