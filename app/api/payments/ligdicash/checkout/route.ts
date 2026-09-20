import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Route désactivée : Les moyens de paiement LigdiCash et Wave ont été retirés.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Les moyens de paiement LigdiCash et Wave ont été désactivés. Toutes les fonctionnalités sont en accès libre et gratuit.",
    },
    { status: 410 }
  );
}
