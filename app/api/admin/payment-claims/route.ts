import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { livrerPackAdmin, rejeterClaim } from "@/lib/livrerPack";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payment-claims
 * Liste toutes les declarations (admin seulement)
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.isAdmin) {
    return NextResponse.json({ success: false, message: "Acces admin requis" }, { status: 403 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service DB indisponible" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const statut = searchParams.get("statut") ?? "all";

  let query = supabaseAdmin
    .from("payment_claims")
    .select("*, credit_packs(nom, credits, prix_fcfa)")
    .order("cree_le", { ascending: false });

  if (statut !== "all") {
    query = query.eq("statut", statut);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, claims: data ?? [] });
}

/**
 * POST /api/admin/payment-claims
 * Valider ou rejeter une declaration (admin seulement)
 * body: { claimId, action: 'valider' | 'rejeter', motif? }
 */
export async function POST(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.isAdmin || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Acces admin requis" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { claimId, action, motif } = body as {
    claimId?: string;
    action?: "valider" | "rejeter";
    motif?: string;
  };

  if (!claimId || !action) {
    return NextResponse.json({ success: false, message: "claimId et action requis" }, { status: 400 });
  }

  if (action === "valider") {
    const result = await livrerPackAdmin(claimId, auth.user.id);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (action === "rejeter") {
    const result = await rejeterClaim(claimId, auth.user.id, motif ?? "Reference introuvable ou montant incorrect");
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  return NextResponse.json({ success: false, message: "Action invalide: " + action }, { status: 400 });
}
