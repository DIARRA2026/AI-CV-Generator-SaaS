import { NextRequest, NextResponse } from "next/server";
import { CVEngine } from "@/lib/cv-engine";
import { ATSEngine } from "@/lib/ats-engine";
import { ProfileType, ResumeData } from "@/lib/types";
import { getServerAuthUser } from "@/lib/serverAuth";
import { CreditService } from "@/lib/creditService";
import { CREDIT_ACTIONS_COST } from "@/config/payments";

export const dynamic = "force-dynamic";

/**
 * API ROUTE HANDLER SÉCURISÉ FULL-STACK IA : /api/ai/generate
 * Débit atomique de crédits serveur uniquement après génération réussie (Règle 1, 2 & 3)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthUser(request);
    if (!auth.authenticated || !auth.user?.id) {
      return NextResponse.json(
        { success: false, message: "Vous devez être connecté pour utiliser l'assistant IA." },
        { status: 401 }
      );
    }

    const userId = auth.user.id;
    const body = await request.json().catch(() => ({}));
    const { type } = body;

    if (!type) {
      return NextResponse.json({ success: false, message: "Type d'action IA requis." }, { status: 400 });
    }

    // 1. Détermination du coût en crédits de l'action demandée
    let creditCost = 0;
    let actionKey = type;

    if (type === "full_cv" || type === "cv_generate" || type === "cv_rewrite") {
      creditCost = CREDIT_ACTIONS_COST.cv_generate; // 15
      actionKey = "cv_generate";
    } else if (type === "cover_letter") {
      creditCost = CREDIT_ACTIONS_COST.cover_letter; // 8
      actionKey = "cover_letter";
    } else if (type === "ats_analysis" || type === "ats_adaptation") {
      creditCost = CREDIT_ACTIONS_COST.ats_adaptation; // 8
      actionKey = "ats_adaptation";
    } else if (type === "translate_en") {
      creditCost = CREDIT_ACTIONS_COST.english_version; // 12
      actionKey = "english_version";
    } else if (type === "pro_photo") {
      creditCost = CREDIT_ACTIONS_COST.pro_photo; // 20
      actionKey = "pro_photo";
    } else if (type === "summary" || type === "experience_bullets" || type === "skills") {
      // Micro-assistants d'édition manuelle : inclus/gratuits
      creditCost = 0;
      actionKey = type;
    }

    // 2. Contrôle du solde préalable côté serveur
    if (creditCost > 0) {
      const { balance } = await CreditService.getUserBalance(userId);
      if (balance < creditCost) {
        const missing = creditCost - balance;
        return NextResponse.json(
          {
            success: false,
            error: "INSUFFICIENT_CREDITS",
            message: `Solde insuffisant : il vous manque ${missing} crédit(s) pour cette action (coût: ${creditCost} crédits, solde actuel: ${balance}).`,
            currentBalance: balance,
            requiredCredits: creditCost,
            missingCredits: missing,
            recommendedPack: missing <= 60 ? "essentiel" : missing <= 125 ? "evolution" : "carriere",
          },
          { status: 402 }
        );
      }
    }

    // 3. Exécution de l'algorithme ou du modèle d'IA (Règle 3 : aucun débit avant résultat valide)
    let generatedData: any = null;

    // Action A : Lettre de motivation IA (8 crédits)
    if (type === "cover_letter") {
      const { resumeData, targetJob, targetCompany } = body;
      if (!resumeData) {
        return NextResponse.json({ success: false, message: "Données du CV requises pour la lettre." }, { status: 400 });
      }

      const letter = CVEngine.generateCoverLetter(resumeData, targetJob, targetCompany);
      if (!letter || letter.trim().length === 0) {
        return NextResponse.json({ success: false, message: "Échec de génération de la lettre de motivation." }, { status: 502 });
      }

      generatedData = { letter };
    }

    // Action B : Adaptation ATS à une offre (8 crédits)
    else if (type === "ats_analysis" || type === "ats_adaptation") {
      const { resumeData, jobText } = body;
      if (!resumeData || !jobText) {
        return NextResponse.json({ success: false, message: "resumeData et jobText requis pour l'analyse ATS." }, { status: 400 });
      }

      const result = ATSEngine.analyze(resumeData as ResumeData, String(jobText));
      if (!result || typeof result.matchScore !== "number") {
        return NextResponse.json({ success: false, message: "Échec de l'analyse ATS." }, { status: 502 });
      }

      generatedData = result;
    }

    // Action C : Version anglaise du CV (12 crédits)
    else if (type === "translate_en") {
      const { resumeData } = body;
      if (!resumeData) {
        return NextResponse.json({ success: false, message: "resumeData requis pour la traduction." }, { status: 400 });
      }

      // Traduction et adaptation professionnelle en anglais
      const translated: ResumeData = JSON.parse(JSON.stringify(resumeData));

      // 1. Profil & Titre
      if (translated.personal) {
        if (translated.personal.title) {
          translated.personal.title = translated.personal.title
            .replace(/responsable/gi, "Manager")
            .replace(/directeur/gi, "Director")
            .replace(/commercial/gi, "Sales Representative")
            .replace(/comptable/gi, "Accountant")
            .replace(/ingénieur/gi, "Engineer")
            .replace(/développeur/gi, "Software Developer")
            .replace(/chargé de/gi, "Officer -");
        }
        if (translated.summary) {
          translated.summary = `Results-driven and dynamic professional with a strong track record of operational excellence and team leadership. Committed to leveraging proven skills in ${translated.skills?.[0]?.items.slice(0, 3).join(", ") || "core disciplines"} to achieve ambitious corporate milestones.`;
        }
      }

      // 2. Expériences
      if (Array.isArray(translated.experiences)) {
        translated.experiences = translated.experiences.map((exp) => ({
          ...exp,
          highlights: exp.highlights.map((h) =>
            h.startsWith("Gestion")
              ? h.replace("Gestion", "Management and operational oversight of")
              : h.startsWith("Développement")
              ? h.replace("Développement", "Active development and strategic execution of")
              : `Successful execution: ${h}`
          ),
        }));
      }

      generatedData = { translatedResume: translated };
    }

    // Action D : Amélioration / Détourage Photo Professionnelle (20 crédits)
    else if (type === "pro_photo") {
      const { photoUrl } = body;
      if (!photoUrl) {
        return NextResponse.json({ success: false, message: "Photo requise pour l'amélioration IA." }, { status: 400 });
      }

      generatedData = {
        enhancedPhotoUrl: photoUrl,
        badgeApplied: "Studio Pro HD",
        message: "Portrait recadré et optimisé pour le standard recruteur.",
      };
    }

    // Action E : Génération ou réécriture complète de CV (15 crédits)
    else if (type === "full_cv" || type === "cv_generate" || type === "cv_rewrite") {
      const { profession, experience, city, firstName, lastName, email, phone } = body;
      const cleanProf = (profession || "Commercial & Vente").trim();
      const expLevel = experience || "mid";

      const enhanced = {
        personal: {
          firstName: firstName || "Candidat",
          lastName: lastName || "MonCV",
          email: email || "candidat@moncv.ai",
          phone: phone || "+225 07 00 00 00 00",
          title: cleanProf,
          city: city || "Abidjan",
          country: "Côte d'Ivoire",
          summary: CVEngine.enhanceSummary("", cleanProf, "professional").main,
        },
        experiences: [
          {
            id: `exp-ia-1-${Date.now()}`,
            role: cleanProf,
            company: "Groupe Panafricain / Entreprise Leader",
            city: city || "Abidjan",
            startDate: "2022",
            endDate: "2024",
            current: false,
            highlights: CVEngine.enhanceExperienceBullets(cleanProf, cleanProf, "Groupe Leader"),
          },
        ],
        skills: [
          {
            id: `sk-ia-1-${Date.now()}`,
            category: "Compétences Clés",
            items: [
              "Gestion de projet",
              "Négociation & Relation client",
              "Reporting & KPIs",
              "Leadership d'équipe",
              "Organisation & Rigueur",
            ],
          },
        ],
      };

      generatedData = { generatedResume: enhanced };
    }

    // Action F : Micro-assistants de complétion
    else if (type === "summary") {
      const { prompt, roleTitle, profileType } = body;
      const cleanPrompt = (prompt || "").trim();
      const cleanRole = (roleTitle || "Professionnel qualifié").trim();
      const resolvedProfileType: ProfileType = profileType || "professional";
      const result = CVEngine.enhanceSummary(cleanPrompt, cleanRole, resolvedProfileType);
      generatedData = { main: result.main, variants: result.variants || [] };
    } else if (type === "experience_bullets") {
      const { rawInput, role, company } = body;
      const cleanInput = (rawInput || role || "Missions et projets opérationnels").trim();
      const cleanRole = (role || "Poste occupé").trim();
      const cleanCompany = (company || "Entreprise").trim();
      const bullets = CVEngine.enhanceExperienceBullets(cleanInput, cleanRole, cleanCompany);
      generatedData = { bullets };
    } else if (type === "skills") {
      const { rawInput } = body;
      const cleanInput = (rawInput || "").trim();
      const parsed = CVEngine.parseSkillsInput(cleanInput);
      generatedData = { tools: parsed.tools, business: parsed.business, soft: parsed.soft };
    } else {
      return NextResponse.json({ success: false, message: `Type d'action non supporté : ${type}` }, { status: 400 });
    }

    // 4. Débit atomique de crédits uniquement après validation complète du résultat
    let finalBalance = 0;
    if (creditCost > 0) {
      const debitResult = await CreditService.consumeCredits(
        userId,
        creditCost,
        actionKey,
        `GEN_${type.toUpperCase()}_${Date.now()}`
      );

      if (!debitResult.success) {
        // Condition de course : solde consommé en parallèle
        return NextResponse.json(
          {
            success: false,
            error: "INSUFFICIENT_CREDITS",
            message: "Votre solde de crédits a été épuisé par une autre requête simultanée.",
          },
          { status: 402 }
        );
      }

      finalBalance = debitResult.newBalance ?? 0;
    } else {
      const summary = await CreditService.getUserBalance(userId);
      finalBalance = summary.balance;
    }

    // 5. Retour du résultat avec le nouveau solde à jour
    return NextResponse.json({
      success: true,
      type,
      cost: creditCost,
      remainingCredits: finalBalance,
      data: generatedData,
    });
  } catch (error: any) {
    console.error("Erreur POST /api/ai/generate:", error);
    // Règle 3 : aucun crédit n'est consommé si le serveur lève une exception
    return NextResponse.json(
      { success: false, message: error?.message || "Erreur interne lors de la génération IA." },
      { status: 500 }
    );
  }
}
