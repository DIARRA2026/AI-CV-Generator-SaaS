import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

/**
 * GET /api/resumes/[slug]
 * Récupère un CV par son slug ou son ID depuis Supabase pour affichage public ou recrutement
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

    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json({ success: false, message: "Supabase non configuré" }, { status: 503 });
    }

    // Recherche par slug en premier, puis par id
    const { data, error } = await supabase
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
