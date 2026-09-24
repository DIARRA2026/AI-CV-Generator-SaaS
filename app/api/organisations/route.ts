import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCreditPack } from "@/config/payments";

export const dynamic = "force-dynamic";

/**
 * GET /api/organisations
 * Liste des organisations dont l utilisateur connecte est membre
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecte" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  try {
    // 1. Trouver les affiliations de l utilisateur
    const { data: affiliations, error: affErr } = await supabaseAdmin
      .from("organization_members")
      .select("org_id, role")
      .eq("user_id", auth.user.id);

    if (affErr) {
      return NextResponse.json({ success: false, message: affErr.message }, { status: 500 });
    }

    if (!affiliations || affiliations.length === 0) {
      return NextResponse.json({ success: true, organizations: [] });
    }

    const orgIds = affiliations.map((a) => a.org_id);

    // 2. Recuperer les organisations
    const { data: orgs, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .in("id", orgIds)
      .eq("actif", true);

    if (orgErr) {
      return NextResponse.json({ success: false, message: orgErr.message }, { status: 500 });
    }

    const db = supabaseAdmin;
    const enriched = await Promise.all(
      (orgs || []).map(async (org) => {
        const aff = affiliations.find((a) => a.org_id === org.id);
        const pack = org.pack_slug ? getCreditPack(org.pack_slug) : null;

        // Solde de credits de l organisation
        const { data: soldeData } = await db.rpc("solde_credits", {
          p_compte: org.id,
          p_type: "org",
        });

        // Nombre de membres actifs
        const { count: memberCount } = await db
          .from("organization_members")
          .select("user_id", { count: "exact", head: true })
          .eq("org_id", org.id);

        return {
          id: org.id,
          nom: org.nom,
          slug: org.slug,
          rccm: org.rccm,
          ifu: org.ifu,
          adresse: org.adresse,
          telephone: org.telephone,
          emailFacturation: org.email_facturation,
          logoUrl: org.logo_url,
          couleurPrimaire: org.couleur_primaire || "#2563EB",
          packSlug: org.pack_slug,
          packNom: pack?.nom || "Non defini",
          actif: org.actif,
          creeLe: org.cree_le,
          monRole: aff?.role || "membre",
          siegesMax: pack?.sieges ?? null,
          siegesUtilises: memberCount || 1,
          soldeCredits: soldeData?.[0]?.solde || 0,
          prochaineExpiration: soldeData?.[0]?.prochaine_expiration || null,
        };
      })
    );

    return NextResponse.json({ success: true, organizations: enriched });
  } catch (err: any) {
    console.error("Erreur GET /api/organisations:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/organisations
 * Creer une nouvelle organisation
 */
export async function POST(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecte" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      nom,
      slug,
      rccm,
      ifu,
      adresse,
      telephone,
      emailFacturation,
      logoUrl,
      couleurPrimaire = "#2563EB",
      packSlug = "revendeur",
    } = body;

    if (!nom || !nom.trim()) {
      return NextResponse.json({ success: false, message: "Le nom de l organisation est requis." }, { status: 400 });
    }

    const cleanSlug = (slug || nom)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: orgId, error: rpcErr } = await supabaseAdmin.rpc("create_organization", {
      p_nom: nom.trim(),
      p_slug: cleanSlug,
      p_owner_id: auth.user.id,
      p_pack_slug: packSlug,
      p_rccm: rccm?.trim() || null,
      p_ifu: ifu?.trim() || null,
      p_adresse: adresse?.trim() || null,
      p_telephone: telephone?.trim() || null,
      p_email_facturation: emailFacturation?.trim() || auth.user.email || null,
      p_logo_url: logoUrl || null,
      p_couleur_primaire: couleurPrimaire || "#2563EB",
    });

    if (rpcErr || !orgId) {
      return NextResponse.json({ success: false, message: rpcErr?.message || "Erreur de creation" }, { status: 500 });
    }

    return NextResponse.json({ success: true, orgId });
  } catch (err: any) {
    console.error("Erreur POST /api/organisations:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/organisations
 * Modifier les informations de l organisation (Branding, RCCM, IFU, etc.)
 */
export async function PATCH(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecte" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { orgId, nom, rccm, ifu, adresse, telephone, emailFacturation, logoUrl, couleurPrimaire } = body;

    if (!orgId) {
      return NextResponse.json({ success: false, message: "orgId requis" }, { status: 400 });
    }

    // Verifier que l utilisateur est proprietaire ou admin
    const { data: member } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", auth.user.id)
      .single();

    if (!member || (member.role !== "proprietaire" && member.role !== "admin")) {
      return NextResponse.json({ success: false, message: "Permissions insuffisantes." }, { status: 403 });
    }

    const updates: Record<string, any> = { mis_a_jour: new Date().toISOString() };
    if (nom !== undefined) updates.nom = nom.trim();
    if (rccm !== undefined) updates.rccm = rccm.trim();
    if (ifu !== undefined) updates.ifu = ifu.trim();
    if (adresse !== undefined) updates.adresse = adresse.trim();
    if (telephone !== undefined) updates.telephone = telephone.trim();
    if (emailFacturation !== undefined) updates.email_facturation = emailFacturation.trim();
    if (logoUrl !== undefined) updates.logo_url = logoUrl;
    if (couleurPrimaire !== undefined) updates.couleur_primaire = couleurPrimaire;

    const { error: updErr } = await supabaseAdmin
      .from("organizations")
      .update(updates)
      .eq("id", orgId);

    if (updErr) {
      return NextResponse.json({ success: false, message: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Organisation mise a jour." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
