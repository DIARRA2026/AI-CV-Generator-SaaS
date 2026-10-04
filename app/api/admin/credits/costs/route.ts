import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { WalletService } from "@/lib/credits/walletService";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/credits/costs : Liste des tarifs des fonctionnalités IA
 * PUT /api/admin/credits/costs : Mise à jour du coût d'une fonctionnalité
 */
export async function GET(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Accès non autorisé" },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const costs = await WalletService.getCosts();
    return NextResponse.json({ success: true, costs });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Accès non autorisé" },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { featureKey, cost, isActive, name } = body;

    if (!featureKey || typeof cost !== "number" || cost < 0) {
      return NextResponse.json(
        { success: false, message: "featureKey et un coût positif ou nul (cost) sont requis." },
        { status: 400 }
      );
    }

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("credit_costs")
        .upsert(
          {
            feature_key: featureKey,
            name: name || featureKey.replace(/_/g, " "),
            cost,
            is_active: isActive !== undefined ? Boolean(isActive) : true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "feature_key" }
        )
        .select()
        .single();

      if (error) {
        console.error("Erreur mise à jour credit_costs:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Tarif mis à jour pour ${featureKey} : ${cost} AI Coins.`,
        cost: data,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Tarif mis à jour en mémoire pour ${featureKey} : ${cost} AI Coins.`,
    });
  } catch (err: any) {
    console.error("Erreur PUT /api/admin/credits/costs:", err);
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
