import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/credits
 * Statistiques globales et liste des portefeuilles AI COINS pour le panneau d'administration
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
    let wallets: any[] = [];
    let stats = {
      totalWallets: 0,
      totalAvailable: 0,
      totalReserved: 0,
      totalPurchased: 0,
      totalConsumed: 0,
    };

    if (supabaseAdmin) {
      // Récupérer les portefeuilles
      const { data: walletsData, error: walletsErr } = await supabaseAdmin
        .from("credit_wallets")
        .select("*")
        .order("available_credits", { ascending: false })
        .limit(100);

      if (!walletsErr && Array.isArray(walletsData)) {
        wallets = walletsData;

        // Associer les profils / emails
        const userIds = wallets.map((w) => w.user_id);
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        wallets = wallets.map((w) => {
          const prof = profileMap.get(w.user_id);
          return {
            id: w.id,
            userId: w.user_id,
            email: prof?.email || "Inconnu",
            fullName: `${prof?.first_name || ""} ${prof?.last_name || ""}`.trim() || prof?.email || "Utilisateur",
            availableCredits: w.available_credits,
            reservedCredits: w.reserved_credits,
            lifetimeEarned: w.lifetime_earned,
            lifetimePurchased: w.lifetime_purchased,
            lifetimeConsumed: w.lifetime_consumed,
            updatedAt: w.updated_at,
          };
        });

        // Calcul stats
        wallets.forEach((w) => {
          stats.totalAvailable += w.availableCredits || 0;
          stats.totalReserved += w.reservedCredits || 0;
          stats.totalPurchased += w.lifetimePurchased || 0;
          stats.totalConsumed += w.lifetimeConsumed || 0;
        });
        stats.totalWallets = wallets.length;
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      wallets,
    });
  } catch (err: any) {
    console.error("Erreur GET /api/admin/credits:", err);
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
