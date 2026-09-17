import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerAuthUser } from "@/lib/serverAuth";
import { ResumeData } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * API ROUTE HANDLER SÉCURISÉ : /api/resumes
 * Protection stricte anti-IDOR, contrôle d'accès propriétaire et rôles administratifs
 */

// GET /api/resumes?email=... ou /api/resumes?id=...
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Service de données indisponible" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    // 1. Recherche spécifique par ID ou Slug
    if (id || slug) {
      const query = supabaseAdmin.from("resumes").select("*");
      if (id) query.eq("id", id);
      else if (slug) query.eq("slug", slug);

      const { data, error } = await query.maybeSingle();
      if (error || !data) {
        return NextResponse.json({ success: false, message: "CV introuvable" }, { status: 404 });
      }

      // Si le CV est privé, contrôle strict de propriété
      if (!data.is_public) {
        const auth = await getServerAuthUser(request);
        const isOwner =
          auth.authenticated &&
          (auth.isAdmin ||
            (auth.user?.email && auth.user.email === data.user_email?.toLowerCase().trim()) ||
            (auth.user?.id && auth.user.id === data.user_id));

        if (!isOwner) {
          return NextResponse.json({ success: false, message: "Ce CV est privé" }, { status: 403 });
        }
      }

      return NextResponse.json({ success: true, resume: data.resume_data, record: data });
    }

    // 2. Recherche par email (Protection IDOR : Seul le propriétaire ou le superadmin peut lister ses CVs)
    if (email) {
      const auth = await getServerAuthUser(request);
      const isAuthorized =
        auth.authenticated &&
        (auth.isAdmin || (auth.user?.email && auth.user.email === email));

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, message: "Accès refusé aux CVs de cet utilisateur" },
          { status: 403 }
        );
      }

      const { data, error } = await supabaseAdmin
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

    // 3. Par défaut : retourner uniquement les CVs marqués publics
    const { data, error } = await supabaseAdmin
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

// POST /api/resumes - Sauvegarde / Mise à jour sécurisée du CV (Anti-IDOR)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Service de données indisponible" }, { status: 503 });
    }

    const auth = await getServerAuthUser(request);
    const body = await request.json();
    const resume = body?.resume as ResumeData;
    let userEmail = (body?.userEmail || resume?.userEmail || resume?.personal?.email || "").toLowerCase().trim();

    if (!resume || !resume.id) {
      return NextResponse.json({ success: false, message: "Données de CV invalides ou ID manquant" }, { status: 400 });
    }

    // Contrôle d'existence préalable pour prévenir l'écrasement malveillant (IDOR)
    const { data: existing } = await supabaseAdmin
      .from("resumes")
      .select("id, user_id, user_email")
      .eq("id", resume.id)
      .maybeSingle();

    if (existing) {
      const isOwner =
        auth.authenticated &&
        (auth.isAdmin ||
          (auth.user?.email && auth.user.email === existing.user_email?.toLowerCase().trim()) ||
          (auth.user?.id && auth.user.id === existing.user_id));

      if (!isOwner) {
        return NextResponse.json(
          {
            success: false,
            message: "Accès refusé : vous n'avez pas l'autorisation de modifier ce CV existant.",
          },
          { status: 403 }
        );
      }
    }

    // Déterminer l'identité officielle liée
    let userId: string | null = auth.authenticated && !auth.isAdmin ? auth.user?.id || null : null;
    if (auth.authenticated && !auth.isAdmin && auth.user?.email) {
      userEmail = auth.user.email;
    }

    if (!userId && userEmail) {
      const { data: profile } = await supabaseAdmin
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
      ats_score: typeof (body?.atsScore || (resume as any)?.atsScore) === "number"
        ? (body?.atsScore || (resume as any)?.atsScore)
        : 85,
      is_public: body?.isPublic !== undefined ? Boolean(body.isPublic) : (resume as any)?.isPublic !== false,
      updated_at: nowIso,
    };

    const { error } = await supabaseAdmin
      .from("resumes")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.error("Erreur Supabase upsert resumes:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "CV synchronisé avec succès sur le Cloud sécurisé",
      syncedAt: nowIso,
      resume: payload.resume_data,
    });
  } catch (error: any) {
    console.error("Erreur POST /api/resumes:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erreur interne" }, { status: 500 });
  }
}

// DELETE /api/resumes?id=... (Anti-IDOR)
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Service de données indisponible" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID manquant" }, { status: 400 });
    }

    // Récupérer le CV cible pour vérifier la propriété
    const { data: existing } = await supabaseAdmin
      .from("resumes")
      .select("id, user_id, user_email")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ success: true, message: "CV déjà supprimé ou introuvable" });
    }

    const auth = await getServerAuthUser(request);
    const isAuthorized =
      auth.authenticated &&
      (auth.isAdmin ||
        (auth.user?.email && auth.user.email === existing.user_email?.toLowerCase().trim()) ||
        (auth.user?.id && auth.user.id === existing.user_id));

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          message: "Suppression non autorisée : vous n'êtes pas le propriétaire de ce document.",
        },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin.from("resumes").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "CV supprimé du cloud avec succès" });
  } catch (error: any) {
    console.error("Erreur DELETE /api/resumes:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erreur interne" }, { status: 500 });
  }
}
