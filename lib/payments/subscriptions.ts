import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface ActiveSubscriptionInfo {
  isSubscribed: boolean;
  planId: string | null;
  status: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number;
}

/**
 * getActiveSubscription()
 * ============================================================
 * Vérifie côté serveur si un utilisateur dispose d'un abonnement actif valide.
 * RÈGLE FONDAMENTALE : L'accès payant se définit partout par :
 *   status = 'active' ET expires_at > now()
 *
 * @param userId - UUID de l'utilisateur authentifié
 */
export async function getActiveSubscription(
  userId: string
): Promise<ActiveSubscriptionInfo> {
  const defaultInactive: ActiveSubscriptionInfo = {
    isSubscribed: false,
    planId: null,
    status: null,
    startedAt: null,
    expiresAt: null,
    daysRemaining: 0,
  };

  if (!userId || !supabaseAdmin) {
    return defaultInactive;
  }

  try {
    const now = new Date().toISOString();

    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("expires_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error || !sub) {
      return defaultInactive;
    }

    let daysRemaining = 30;
    if (sub.expires_at) {
      const msDiff = new Date(sub.expires_at).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    }

    return {
      isSubscribed: true,
      planId: sub.plan_id || sub.plan_tier || null,
      status: sub.status,
      startedAt: sub.started_at || sub.activated_at || null,
      expiresAt: sub.expires_at || null,
      daysRemaining,
    };
  } catch (err) {
    console.warn("[getActiveSubscription] Exception lors de la vérification:", err);
    return defaultInactive;
  }
}
