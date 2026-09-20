import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Route statut : Désactivée et remplacée par statut actif permanent (accès gratuit).
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    status: "active",
    planTier: "5000",
    message: "Accès libre et gratuit. Aucun paiement requis.",
  });
}
