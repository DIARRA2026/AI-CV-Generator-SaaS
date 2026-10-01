import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { livrerPackAdmin, rejeterClaim } from "@/lib/livrerPack";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payment-claims
 * Liste toutes les déclarations de paiement (admin seulement)
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.isAdmin) {
    return NextResponse.json({ success: false, message: "Accès admin requis" }, { status: 403 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service DB indisponible" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const rawStatus = (searchParams.get("status") || searchParams.get("statut") || "all").toLowerCase();

  // Mapping des statuts (support français et anglais)
  let dbStatut: string | null = null;
  if (rawStatus === "pending" || rawStatus === "en_attente") {
    dbStatut = "en_attente";
  } else if (rawStatus === "approved" || rawStatus === "valide") {
    dbStatut = "valide";
  } else if (rawStatus === "rejected" || rawStatus === "rejete") {
    dbStatut = "rejete";
  }

  let query = supabaseAdmin
    .from("payment_claims")
    .select("*, credit_packs(nom, credits, prix_fcfa)")
    .order("cree_le", { ascending: false });

  if (dbStatut) {
    query = query.eq("statut", dbStatut);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  const rawClaims = data ?? [];

  // Récupérer les profils pour associer les adresses email
  const userIds = Array.from(new Set(rawClaims.map((c) => c.compte_id).filter(Boolean)));
  const emailMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", userIds);

    if (profiles) {
      for (const p of profiles) {
        emailMap[p.id] = p.email || "";
      }
    }
  }

  // Normalisation des champs pour compatibilité totale avec les composants React
  const claims = rawClaims.map((c: any) => {
    const statusNormalized =
      c.statut === "valide" ? "approved" : c.statut === "rejete" ? "rejected" : "pending";

    return {
      id: c.id,
      userId: c.compte_id,
      compteId: c.compte_id,
      compteType: c.compte_type,
      userEmail: emailMap[c.compte_id] || "",
      packCode: c.pack_slug,
      packSlug: c.pack_slug,
      packNom: c.credit_packs?.nom || c.pack_slug,
      amountFcfa: c.montant_attendu,
      montantAttendu: c.montant_attendu,
      telephone: c.telephone,
      operateur: c.operateur,
      waveReference: c.reference_transaction || "",
      referenceTransaction: c.reference_transaction || "",
      screenshotUrl: c.screenshot_url,
      statut: c.statut,
      status: statusNormalized,
      rejectionReason: c.note,
      note: c.note,
      validePar: c.valide_par,
      valideLe: c.valide_le,
      reviewedBy: c.valide_par,
      reviewedAt: c.valide_le,
      createdAt: c.cree_le,
      creeLe: c.cree_le,
    };
  });

  return NextResponse.json({ success: true, claims });
}

/**
 * POST /api/admin/payment-claims
 * Valider ou rejeter une déclaration de paiement
 * Compatible avec :
 * - action: 'valider' | 'approve'
 * - action: 'rejeter' | 'reject'
 */
export async function POST(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.isAdmin || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Accès admin requis" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { claimId, action, motif, reason } = body as {
    claimId?: string;
    action?: string;
    motif?: string;
    reason?: string;
  };

  if (!claimId || !action) {
    return NextResponse.json({ success: false, message: "claimId et action requis" }, { status: 400 });
  }

  const normalizedAction = action.toLowerCase().trim();
  const finalReason = (motif || reason || "Référence introuvable ou montant incorrect").trim();

  // 1. Action de validation -> Créditation effective et création de facture
  if (normalizedAction === "valider" || normalizedAction === "approve") {
    const result = await livrerPackAdmin(claimId, auth.user.id);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  // 2. Action de rejet -> Blocage strict de la créditation et marquage échoué
  if (normalizedAction === "rejeter" || normalizedAction === "reject") {
    const result = await rejeterClaim(claimId, auth.user.id, finalReason);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  return NextResponse.json(
    { success: false, message: `Action inconnue: ${action}. Utilisez 'approve'/'valider' ou 'reject'/'rejeter'` },
    { status: 400 }
  );
}
