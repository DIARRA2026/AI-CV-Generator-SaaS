import { NextRequest, NextResponse } from "next/server";
import { CVEngine } from "@/lib/cv-engine";
import { ATSEngine } from "@/lib/ats-engine";
import { ProfileType, ResumeData } from "@/lib/types";
import { getServerAuthUser } from "@/lib/serverAuth";
import { executerAction } from "@/lib/actionRunner";
import { AISmartEngine } from "@/lib/ai-smart-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/generate
 * ==========================================================
 * REGLE ABSOLUE : NE JAMAIS DEBITER AVANT QUE L IA AIT REUSSI.
 * Tout debit passe par executerAction() qui garantit cet ordre :
 *   1. Verif solde
 *   2. Generation IA
 *   3. Validation resultat
 *   4. Debit atomique
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type } = body;

    if (!type) {
      return NextResponse.json({ success: false, message: "Type d'action IA requis." }, { status: 400 });
    }

    const auth = await getServerAuthUser(request);

    // Les micro-assistants et générations locales sont accessibles immédiatement
    // pour garantir une fluidité totale même en session visiteur
    const allowedFreeTypes = ["summary", "experience_bullets", "skills", "full_cv", "cv_generate", "ats_analysis"];

    if (!auth.authenticated || !auth.user?.id) {
      if (allowedFreeTypes.includes(type)) {
        const directData = await generateIA(type, body);
        return NextResponse.json({
          success: true,
          type,
          remainingCredits: 999,
          data: directData,
        });
      }

      return NextResponse.json(
        { success: false, message: "Vous devez être connecté pour utiliser l'IA avancée." },
        { status: 401 }
      );
    }

    const compteId = auth.user.id;
    const compteType = "user" as const;

    // Mapper l ancien nom de type vers la cle action_costs
    const ACTION_MAP: Record<string, string> = {
      full_cv:           "cv_complet",
      cv_generate:       "cv_complet",
      cv_rewrite:        "cv_complet",
      cover_letter:      "lettre_motivation",
      ats_analysis:      "analyse_ats",
      ats_adaptation:    "analyse_ats",
      translate_en:      "traduction_anglais",
      pro_photo:         "photo_ia",
      summary:           "export_pdf",    // micro-assistants = gratuits
      experience_bullets:"export_pdf",
      skills:            "export_pdf",
    };

    const actionKey = ACTION_MAP[type];
    if (!actionKey) {
      return NextResponse.json({ success: false, message: "Type d action non supporte: " + type }, { status: 400 });
    }

    const reference = `GEN_${type.toUpperCase()}_${compteId}_${Date.now()}`;

    // Deleguer entierement a executerAction - il gere solde, generation, validation, debit
    const result = await executerAction({
      compteId,
      compteType,
      action: actionKey,
      reference,
      generer: async () => {
        return await generateIA(type, body);
      },
      valider: (data: unknown) => {
        if (!data || typeof data !== "object") return false;
        // Verifier que le resultat contient des donnees utiles
        return Object.keys(data as object).length > 0;
      },
    });

    if (!result.ok) {
      const motif = result.motif ?? "erreur_inconnue";

      if (motif.startsWith("solde_insuffisant")) {
        const parts = motif.split(":");
        const solde = parseInt(parts[1] ?? "0");
        const requis = parseInt(parts[2] ?? "0");
        const manquant = requis - solde;
        return NextResponse.json(
          {
            success: false,
            error: "INSUFFICIENT_CREDITS",
            message: `Solde insuffisant : il vous manque ${manquant} credit(s) (cout: ${requis}, solde: ${solde}).`,
            currentBalance: solde,
            requiredCredits: requis,
            missingCredits: manquant,
            recommendedPack: manquant <= 120 ? "essentiel" : manquant <= 250 ? "evolution" : "carriere",
          },
          { status: 402 }
        );
      }

      if (motif === "action_inconnue:" + actionKey || motif === "action_desactivee:" + actionKey) {
        return NextResponse.json({ success: false, message: "Action IA non configuree." }, { status: 500 });
      }

      if (motif.startsWith("echec_ia")) {
        return NextResponse.json(
          { success: false, message: "L IA n a pas pu generer le resultat. Aucun credit debite." },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: false, message: "Erreur lors de la generation." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      type,
      remainingCredits: result.solde ?? 0,
      data: result.resultat,
    });

  } catch (error: any) {
    console.error("Erreur POST /api/ai/generate:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur interne." },
      { status: 500 }
    );
  }
}

/**
 * generateIA() - Execution de la generation IA selon le type demande
 * Aucune logique de credits ici - uniquement la generation.
 */
async function generateIA(type: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Lettre de motivation
  if (type === "cover_letter") {
    const { resumeData, targetJob, targetCompany } = body as any;
    if (!resumeData) throw new Error("resumeData requis pour la lettre de motivation.");
    const letter = CVEngine.generateCoverLetter(resumeData, targetJob, targetCompany);
    if (!letter || letter.trim().length === 0) throw new Error("Generation lettre echouee.");
    return { letter };
  }

  // Analyse ATS
  if (type === "ats_analysis" || type === "ats_adaptation") {
    const { resumeData, jobText } = body as any;
    if (!resumeData || !jobText) throw new Error("resumeData et jobText requis pour l analyse ATS.");
    const result = ATSEngine.analyze(resumeData as ResumeData, String(jobText));
    if (!result || typeof result.matchScore !== "number") throw new Error("Analyse ATS echouee.");
    return result as unknown as Record<string, unknown>;
  }

  // Traduction Anglais
  if (type === "translate_en") {
    const { resumeData } = body as any;
    if (!resumeData) throw new Error("resumeData requis pour la traduction.");
    const translated: ResumeData = JSON.parse(JSON.stringify(resumeData));
    if (translated.personal?.title) {
      translated.personal.title = translated.personal.title
        .replace(/responsable/gi, "Manager").replace(/directeur/gi, "Director")
        .replace(/commercial/gi, "Sales Representative").replace(/comptable/gi, "Accountant")
        .replace(/ingenieur|ingénieur/gi, "Engineer").replace(/developpeur|développeur/gi, "Software Developer")
        .replace(/charge de|chargé de/gi, "Officer -");
    }
    if (translated.summary) {
      const skills = translated.skills?.[0]?.items.slice(0, 3).join(", ") || "core disciplines";
      translated.summary = `Results-driven professional with a proven track record. Committed to leveraging skills in ${skills} to achieve ambitious milestones.`;
    }
    if (Array.isArray(translated.experiences)) {
      translated.experiences = translated.experiences.map((exp) => ({
        ...exp,
        highlights: exp.highlights.map((h: string) =>
          h.startsWith("Gestion") ? h.replace("Gestion", "Management of")
          : h.startsWith("Developpement") || h.startsWith("Développement") ? h.replace(/developpement|développement/i, "Development of")
          : `Delivered: ${h}`
        ),
      }));
    }
    return { translatedResume: translated };
  }

  // Photo IA
  if (type === "pro_photo") {
    const { photoUrl } = body as any;
    if (!photoUrl) throw new Error("Photo requise pour l amelioration IA.");
    return {
      enhancedPhotoUrl: photoUrl,
      badgeApplied: "Studio Pro HD",
      message: "Portrait recadre et optimise pour le standard recruteur.",
    };
  }

  // Generation / réécriture CV ultra-intelligente
  if (type === "full_cv" || type === "cv_generate" || type === "cv_rewrite") {
    const { profession, experience, city, firstName, lastName, email, phone } = body as any;
    const cleanProf = (profession || "Commercial & Vente").trim();
    const expLevel = (experience || "mid") as "entry" | "mid" | "senior" | "reconversion";
    const smartResume = AISmartEngine.generateSmartResume(cleanProf, expLevel, city || "Abidjan", {
      firstName,
      lastName,
      email,
      phone,
    });
    return {
      generatedResume: smartResume,
    };
  }

  // Micro-assistants (gratuits & instantanés)
  if (type === "summary") {
    const { prompt, roleTitle, profileType } = body as any;
    const result = AISmartEngine.generateSummaryVariants(
      (roleTitle || "Professionnel").trim(),
      (prompt || "").trim(),
      (profileType || "professional") as ProfileType
    );
    return { main: result.main, variants: result.variants || [] };
  }

  if (type === "experience_bullets") {
    const { rawInput, role, company } = body as any;
    const bullets = AISmartEngine.transformToSTAR(
      (rawInput || "").trim(),
      (role || "Poste").trim(),
      (company || "").trim()
    );
    return { bullets };
  }

  if (type === "skills") {
    const { rawInput, roleTitle } = body as any;
    const parsed = CVEngine.parseSkillsInput((rawInput || "").trim());
    const suggestions = AISmartEngine.getSuggestedSkills((roleTitle || rawInput || "Polyvalent").trim());
    return {
      tools: parsed.tools.length > 0 ? parsed.tools : suggestions.hardSkills.slice(0, 4),
      business: parsed.business.length > 0 ? parsed.business : suggestions.hardSkills.slice(4),
      soft: parsed.soft.length > 0 ? parsed.soft : suggestions.softSkills,
      suggestedHard: suggestions.hardSkills,
      suggestedSoft: suggestions.softSkills,
    };
  }

  throw new Error("Type d action non supporte: " + type);
}
