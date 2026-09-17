import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerAuthUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/resumes/[slug]
 * Récupère un CV par son slug ou son ID depuis Supabase pour affichage public ou recrutement
 * Protège les CVs privés contre les accès non autorisés.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json({ success: false, message: "Slug manquant" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Service de données indisponible" }, { status: 503 });
    }

    // Recherche par slug en premier, puis par id
    const { data, error } = await supabaseAdmin
      .from("resumes")
      .select("*")
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, message: "CV non trouvé" }, { status: 404 });
    }

    // Si le document est privé, vérification stricte de l'identité
    if (data.is_public === false) {
      const auth = await getServerAuthUser(request);
      const isOwner =
        auth.authenticated &&
        (auth.isAdmin ||
          (auth.user?.email && auth.user.email === data.user_email?.toLowerCase().trim()) ||
          (auth.user?.id && auth.user.id === data.user_id));

      if (!isOwner) {
        return NextResponse.json(
          { success: false, message: "Ce CV est privé et inaccessible publiquement." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      resume: data.resume_data,
      record: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        is_public: data.is_public,
        ats_score: data.ats_score,
        updated_at: data.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Erreur GET /api/resumes/[slug]:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erreur serveur" }, { status: 500 });
  }
}
