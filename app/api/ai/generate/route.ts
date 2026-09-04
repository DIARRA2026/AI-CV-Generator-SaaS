import { NextRequest, NextResponse } from "next/server";
import { CVEngine } from "@/lib/cv-engine";
import { ATSEngine } from "@/lib/ats-engine";
import { ProfileType, ResumeData } from "@/lib/types";

/**
 * API ROUTE HANDLER FULL-STACK IA : /api/ai/generate
 * Moteur d'intelligence artificielle côté serveur pour les étapes de création de CV
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json({ success: false, message: "Type d'action IA requis" }, { status: 400 });
    }

    // 1. ÉTAPE 3 : Synthèse professionnelle percutante (Profil IA)
    if (type === "summary") {
      const { prompt, roleTitle, profileType } = body;
      const cleanPrompt = (prompt || "").trim();
      const cleanRole = (roleTitle || "Professionnel qualifié").trim();
      const resolvedProfileType: ProfileType = profileType || "professional";

      // Moteur de génération IA éprouvé
      const result = CVEngine.enhanceSummary(cleanPrompt, cleanRole, resolvedProfileType);

      return NextResponse.json({
        success: true,
        type: "summary",
        data: {
          main: result.main,
          variants: result.variants || [],
        },
      });
    }

    // 2. ÉTAPE 4 : Génération de puces de réalisations STAR pour l'expérience
    if (type === "experience_bullets") {
      const { rawInput, role, company } = body;
      const cleanInput = (rawInput || role || "Missions et projets opérationnels").trim();
      const cleanRole = (role || "Poste occupé").trim();
      const cleanCompany = (company || "Entreprise").trim();

      const bullets = CVEngine.enhanceExperienceBullets(cleanInput, cleanRole, cleanCompany);

      return NextResponse.json({
        success: true,
        type: "experience_bullets",
        data: {
          bullets,
        },
      });
    }

    // 3. ÉTAPE 6 : Catégorisation intelligente et enrichissement des compétences
    if (type === "skills") {
      const { rawInput } = body;
      const cleanInput = (rawInput || "").trim();

      const parsed = CVEngine.parseSkillsInput(cleanInput);

      return NextResponse.json({
        success: true,
        type: "skills",
        data: {
          tools: parsed.tools,
          business: parsed.business,
          soft: parsed.soft,
        },
      });
    }

    // 4. ANALYSE ATS : Détection des mots-clés et optimisation de score
    if (type === "ats_analysis") {
      const { resumeData, jobText } = body;
      if (!resumeData || !jobText) {
        return NextResponse.json({ success: false, message: "resumeData et jobText requis" }, { status: 400 });
      }

      const result = ATSEngine.analyze(resumeData as ResumeData, String(jobText));

      return NextResponse.json({
        success: true,
        type: "ats_analysis",
        data: result,
      });
    }

    return NextResponse.json({ success: false, message: `Type d'action IA non reconnu: ${type}` }, { status: 400 });
  } catch (error: any) {
    console.error("Erreur POST /api/ai/generate:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erreur lors de la génération IA" }, { status: 500 });
  }
}
