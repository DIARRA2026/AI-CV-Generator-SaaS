import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { ResumeData } from "@/lib/types";

/**
 * API ROUTE HANDLER FULL-STACK : /api/resumes
 * Gère la persistance cloud PostgreSQL (Supabase) pour les CVs
 */

// GET /api/resumes?email=... ou /api/resumes?id=...
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json({ success: false, message: "Supabase non configuré" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    // Recherche par ID ou Slug
    if (id || slug) {
      const query = supabase.from("resumes").select("*");
      if (id) query.eq("id", id);
      else if (slug) query.eq("slug", slug);

      const { data, error } = await query.single();
      if (error || !data) {
        return NextResponse.json({ success: false, message: "CV introuvable" }, { status: 404 });
      }

      return NextResponse.json({ success: true, resume: data.resume_data, record: data });
    }

    // Recherche par email
    if (email) {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_email", email)
        .order("updated_at", { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const list = (data || []).map((row) => row.resume_data as ResumeData);
      return NextResponse.json({ success: true, resumes: list, count: list.length });
    }

    // Par défaut, retourner les CVs publics récents
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const publicResumes = (data || []).map((row) => row.resume_data as ResumeData);
    return NextResponse.json({ success: true, resumes: publicResumes });
  } catch (error: any) {
    console.error("Erreur GET /api/resumes:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erreur interne" }, { status: 500 });
  }
}

// POST /api/resumes - Sauvegarde / Upsert complet du CV dans Supabase Cloud
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json({ success: false, message: "Supabase non configuré" }, { status: 503 });
    }

    const body = await request.json();
    const resume = body?.resume as ResumeData;
    const userEmail = (body?.userEmail || resume?.userEmail || resume?.personal?.email || "").toLowerCase().trim();

    if (!resume || !resume.id) {
      return NextResponse.json({ success: false, message: "Données de CV invalides ou ID manquant" }, { status: 400 });
    }

    // 1. Déterminer le user_id si un profil correspondant existe dans Supabase
    let userId: string | null = null;
    if (userEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();

      if (profile?.id) {
        userId = profile.id;
      }
    }

    const title = resume.title || resume.personal?.title || "Mon CV Professionnel";
    const slug = resume.slug || `cv-${(resume.personal?.firstName || "candidat").toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const payload = {
      id: resume.id,
      user_id: userId,
      user_email: userEmail || null,
      title: title,
      slug: slug,
      resume_data: {
        ...resume,
        slug: slug,
        userEmail: userEmail || resume.userEmail,
        updatedAt: nowIso,
      },
      ats_score: 85,
      is_public: true,
      updated_at: nowIso,
    };

    const { data, error } = await supabase
      .from("resumes")
      .upsert(payload, { onConflict: "id" })
      .select();

    if (error) {
      console.error("Erreur Supabase upsert resumes:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "CV synchronisé avec succès sur le Cloud",
      syncedAt: nowIso,
      resume: payload.resume_data,
    });
  } catch (error: any) {
    console.error("Erreur POST /api/resumes:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erreur interne" }, { status: 500 });
  }
}

// DELETE /api/resumes?id=...
export async function DELETE(request: NextRequest) {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return NextResponse.json({ success: false, message: "Supabase non configuré" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID manquant" }, { status: 400 });
    }

    const { error } = await supabase.from("resumes").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "CV supprimé du cloud" });
  } catch (error: any) {
    console.error("Erreur DELETE /api/resumes:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erreur interne" }, { status: 500 });
  }
}
