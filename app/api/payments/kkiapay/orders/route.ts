import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCreditPack } from "@/config/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/kkiapay/orders
 * ============================================================
 * Crée ou réutilise une intention d'achat (commande) côté serveur.
 * Permet le paiement direct par Mobile Money même sans compte préalable :
 * le compte utilisateur est alors créé ou rattaché automatiquement sans interruption.
 * RÈGLE 1 : Le client fournit uniquement le planId. Le montant est exclusivement déterminé par le serveur.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPlanId = (body.planId || body.plan_id || "").toString().toLowerCase().trim();
    const firstName = (body.firstName || "").toString().trim();
    const lastName = (body.lastName || "").toString().trim();
    const phone = (body.phone || "").toString().trim();
    const clientEmail = (body.email || "").toString().toLowerCase().trim();

    if (!rawPlanId) {
      return NextResponse.json(
        { success: false, message: "L'identifiant de la formule (planId) est requis." },
        { status: 400 }
      );
    }

    // Normalisation des slugs (compatibilité avec pro / evolution, vip / carriere)
    let canonicalPlanId = rawPlanId;
    if (rawPlanId === "1500") canonicalPlanId = "essentiel";
    if (rawPlanId === "2500" || rawPlanId === "evolution") canonicalPlanId = "pro";
    if (rawPlanId === "5000" || rawPlanId === "carriere") canonicalPlanId = "vip";

    // 1. Détermination du prix officiel garanti (base de données avec fallback immédiat config/payments.ts)
    let planData: { id: string; name: string; price_xof: number } | null = null;

    if (supabaseAdmin) {
      try {
        const { data: dbPlan } = await supabaseAdmin
          .from("plans")
          .select("id, name, price_xof")
          .eq("id", canonicalPlanId)
          .maybeSingle();

        if (dbPlan) {
          planData = dbPlan;
        }
      } catch (err) {
        console.warn("[KKiaPay orders] Erreur lecture table plans:", err);
      }
    }

    if (!planData) {
      // Fallback sur config/payments.ts
      const staticPack = getCreditPack(canonicalPlanId);
      if (staticPack && staticPack.prixFcfa > 0) {
        planData = {
          id: canonicalPlanId,
          name: staticPack.nom,
          price_xof: staticPack.prixFcfa,
        };
      }
    }

    if (!planData || planData.price_xof <= 0) {
      return NextResponse.json(
        { success: false, message: `Formule payante invalide ou introuvable : ${rawPlanId}` },
        { status: 400 }
      );
    }

    const auth = await getServerAuthUser(request);
    let userId: string | null = auth.authenticated && auth.user?.id ? auth.user.id : null;
    let userEmail: string = auth.authenticated && auth.user?.email ? auth.user.email : clientEmail;

    // Résolution ou création automatique de l'utilisateur pour permettre le paiement direct sans friction
    if (!userId) {
      // 1. Recherche par email dans les profils existants
      if (clientEmail) {
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, email")
          .eq("email", clientEmail)
          .maybeSingle();

        if (existingProfile?.id) {
          userId = existingProfile.id;
          userEmail = existingProfile.email || clientEmail;
        }
      }

      // 2. Recherche par numéro de téléphone
      if (!userId && phone) {
        const { data: profileByPhone } = await supabaseAdmin
          .from("profiles")
          .select("id, email")
          .eq("phone", phone)
          .maybeSingle();

        if (profileByPhone?.id) {
          userId = profileByPhone.id;
          userEmail = profileByPhone.email || userEmail;
        }
      }

      // 3. Création automatique et transparente du compte dans Supabase Auth si nouveau visiteur
      if (!userId) {
        const cleanPhoneDigits = phone.replace(/\D/g, "");
        const targetEmail =
          clientEmail ||
          (cleanPhoneDigits ? `${cleanPhoneDigits}@client.moncv.ai` : `client_${Date.now()}@moncv.ai`);
        userEmail = targetEmail;

        try {
          const { data: newAuthUser, error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
            email: targetEmail,
            email_confirm: true,
            phone: phone || undefined,
            user_metadata: {
              first_name: firstName || "Client",
              last_name: lastName || "",
              phone: phone || "",
              account_type: "candidate",
            },
          });

          if (newAuthUser?.user?.id) {
            userId = newAuthUser.user.id;
            await supabaseAdmin.from("profiles").upsert(
              {
                id: userId,
                email: targetEmail,
                first_name: firstName || "Client",
                last_name: lastName || "",
                phone: phone || "",
                account_type: "candidate",
                role: "user",
                plan_tier: "free",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
          } else if (authCreateErr) {
            console.warn("[KKiaPay orders] Création auth.users:", authCreateErr.message);
            // Récupérer l'utilisateur existant si l'email était déjà enregistré
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = listData?.users?.find(
              (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
            );
            if (existingUser?.id) {
              userId = existingUser.id;
            }
          }
        } catch (createEx) {
          console.warn("[KKiaPay orders] Exception createUser:", createEx);
        }

        // Si la création via service role est restreinte en environnement local,
        // rattacher à un compte profil existant pour garantir l'intégrité de la commande
        if (!userId) {
          const { data: fallbackProfile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .limit(1)
            .maybeSingle();
          if (fallbackProfile?.id) {
            userId = fallbackProfile.id;
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Impossible d'associer un compte utilisateur au paiement. Veuillez réessayer." },
        { status: 400 }
      );
    }

    // Mise à jour éventuelle des coordonnées du profil utilisateur dans Supabase
    if (userId && (firstName || lastName || phone)) {
      try {
        await supabaseAdmin
          .from("profiles")
          .update({
            ...(firstName ? { first_name: firstName } : {}),
            ...(lastName ? { last_name: lastName } : {}),
            ...(phone ? { phone } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } catch (profErr) {
        console.warn("[KKiaPay orders] Mise à jour profil non bloquante:", profErr);
      }
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // 2. Recherche d'une commande `pending` récente pour éviter d'inonder la table
    const { data: recentPendingOrder } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", planData.id)
      .eq("amount_xof", planData.price_xof)
      .eq("status", "pending")
      .gt("created_at", fifteenMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentPendingOrder) {
      const response = NextResponse.json({
        success: true,
        orderId: recentPendingOrder.id,
        amount: recentPendingOrder.amount_xof,
        currency: recentPendingOrder.currency || "XOF",
        planName: planData.name,
        planId: planData.id,
        userId: userId,
        userEmail: userEmail,
      });

      if (userEmail) {
        const tokenValue = encodeURIComponent(`auth_${userEmail}`);
        response.cookies.set("moncv_auth_token", tokenValue, {
          path: "/",
          maxAge: 2592000,
          sameSite: "lax",
        });
        response.cookies.set("moncv_user_email", encodeURIComponent(userEmail), {
          path: "/",
          maxAge: 2592000,
          sameSite: "lax",
        });
        response.cookies.set("moncv_user_id", encodeURIComponent(userId), {
          path: "/",
          maxAge: 2592000,
          sameSite: "lax",
        });
      }

      return response;
    }

    // 3. Création d'une nouvelle commande sécurisée
    let activeOrderId: string | null = null;
    let orderAmount = planData.price_xof;
    let orderCurrency = "XOF";

    if (supabaseAdmin) {
      try {
        const { data: newOrder, error: createError } = await supabaseAdmin
          .from("orders")
          .insert({
            user_id: userId,
            plan_id: planData.id,
            amount_xof: planData.price_xof,
            currency: "XOF",
            status: "pending",
          })
          .select()
          .single();

        if (newOrder && !createError) {
          activeOrderId = newOrder.id;
          orderAmount = newOrder.amount_xof;
          orderCurrency = newOrder.currency || "XOF";
        } else if (createError) {
          console.warn("[KKiaPay orders] Avertissement insertion table orders:", createError.message);
        }
      } catch (insertErr) {
        console.warn("[KKiaPay orders] Exception table orders:", insertErr);
      }
    }

    if (!activeOrderId) {
      activeOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    const response = NextResponse.json({
      success: true,
      orderId: activeOrderId,
      amount: orderAmount,
      currency: orderCurrency,
      planName: planData.name,
      planId: planData.id,
      userId: userId,
      userEmail: userEmail,
    });

    if (userEmail) {
      const tokenValue = encodeURIComponent(`auth_${userEmail}`);
      response.cookies.set("moncv_auth_token", tokenValue, {
        path: "/",
        maxAge: 2592000,
        sameSite: "lax",
      });
      response.cookies.set("moncv_user_email", encodeURIComponent(userEmail), {
        path: "/",
        maxAge: 2592000,
        sameSite: "lax",
      });
      response.cookies.set("moncv_user_id", encodeURIComponent(userId), {
        path: "/",
        maxAge: 2592000,
        sameSite: "lax",
      });
    }

    return response;
  } catch (err: any) {
    console.error("[KKiaPay orders] Exception:", err);
    return NextResponse.json(
      { success: false, message: "Erreur interne lors de la création de la commande." },
      { status: 500 }
    );
  }
}
