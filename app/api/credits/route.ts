import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/credits
 * Retourne le solde, les lots actifs et l historique du compte connecte.
 * Supporte ?orgId=<uuid> pour retourner le solde d une organisation.
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecte" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");

  const compteId = orgId ?? auth.user.id;
  const compteType = orgId ? "org" : "user";

  try {
    // 1. Solde consolide (via fonction DB)
    const { data: soldeData } = await supabaseAdmin.rpc("solde_credits", {
      p_compte: compteId,
      p_type: compteType,
    });

    const summary = {
      balance: soldeData?.[0]?.solde ?? 0,
      nearest_expiry: soldeData?.[0]?.prochaine_expiration ?? null,
      active_batches: soldeData?.[0]?.nb_lots ?? 0,
      // Compat legacy
      nearestExpiry: soldeData?.[0]?.prochaine_expiration ?? null,
      activeBatchesCount: soldeData?.[0]?.nb_lots ?? 0,
    };

    // 2. Lots actifs
    const { data: batchesData } = await supabaseAdmin
      .from("credit_batches")
      .select("*")
      .eq("compte_id", compteId)
      .eq("compte_type", compteType)
      .gt("restant", 0)
      .or("expire_le.is.null,expire_le.gt." + new Date().toISOString())
      .order("expire_le", { ascending: true, nullsFirst: false });

    // 3. Historique grand livre
    const { data: ledgerData } = await supabaseAdmin
      .from("credit_ledger")
      .select("*")
      .eq("compte_id", compteId)
      .eq("compte_type", compteType)
      .order("cree_le", { ascending: false })
      .limit(50);

    // Mapper vers les anciens noms de champs pour compat frontend existant
    const batches = (batchesData ?? []).map((b: any) => ({
      id: b.id,
      userId: b.compte_id,
      compteId: b.compte_id,
      compteType: b.compte_type,
      packCode: b.pack_slug,
      packSlug: b.pack_slug,
      creditsInitial: b.credits_initiaux,
      creditsRemaining: b.restant,
      creditsInitiaux: b.credits_initiaux,
      restant: b.restant,
      source: b.origine,
      origine: b.origine,
      purchasedAt: b.cree_le,
      creeLe: b.cree_le,
      expiresAt: b.expire_le,
      expireLe: b.expire_le,
      createdAt: b.cree_le,
    }));

    const ledger = (ledgerData ?? []).map((l: any) => ({
      id: l.id,
      userId: l.compte_id,
      compteId: l.compte_id,
      compteType: l.compte_type,
      batchId: l.lot_id,
      lotId: l.lot_id,
      action: l.action,
      delta: l.montant,
      montant: l.montant,
      balanceAfter: 0, // calcule cote client si besoin
      reference: l.reference,
      ref: l.reference,
      meta: l.meta,
      createdAt: l.cree_le,
      creeLe: l.cree_le,
    }));

    return NextResponse.json({
      success: true,
      summary,
      batches,
      ledger,
      compteId,
      compteType,
    });
  } catch (err: any) {
    console.error("Erreur GET /api/credits:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
