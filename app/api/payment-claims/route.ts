import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCreditPack } from "@/config/payments";

export const dynamic = "force-dynamic";

/**
 * GET /api/payment-claims
 * Declarations de paiement de l utilisateur connecte
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecte" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from("payment_claims")
    .select("*")
    .eq("compte_id", auth.user.id)
    .eq("compte_type", "user")
    .order("cree_le", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, claims: data ?? [] });
}

/**
 * POST /api/payment-claims
 * Soumettre une declaration de paiement Wave / Orange Money
 */
export async function POST(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecte" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    packSlug,
    telephone,
    operateur = "wave",
    referenceTransaction,
    screenshotUrl,
    orgId,
  } = body as {
    packSlug?: string;
    telephone?: string;
    operateur?: "wave" | "orange_money" | "autre";
    referenceTransaction?: string;
    screenshotUrl?: string;
    orgId?: string;
  };

  if (!packSlug) {
    return NextResponse.json({ success: false, message: "packSlug requis" }, { status: 400 });
  }

  const pack = getCreditPack(packSlug);
  if (!pack || pack.prixFcfa <= 0) {
    return NextResponse.json({ success: false, message: "Pack payant invalide: " + packSlug }, { status: 400 });
  }

  const compteId = orgId ?? auth.user.id;
  const compteType = orgId ? "org" : "user";

  const { data, error } = await supabaseAdmin
    .from("payment_claims")
    .insert({
      compte_id: compteId,
      compte_type: compteType,
      pack_slug: packSlug,
      montant_attendu: pack.prixFcfa,
      telephone: telephone?.trim() || null,
      operateur,
      reference_transaction: referenceTransaction?.trim() || null,
      screenshot_url: screenshotUrl || null,
      statut: "en_attente",
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur lors de la soumission" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, claim: data });
}
