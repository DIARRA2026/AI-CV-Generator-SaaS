import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Route Webhook LigdiCash : Désactivée
 */
export async function POST() {
  return NextResponse.json(
    {
      status: "disabled",
      message: "La passerelle de paiement LigdiCash a été désactivée.",
    },
    { status: 200 }
  );
}
