import { ATSAnalysisResult, ResumeData } from "./types";

/**
 * Moteur d'analyse de compatibilité ATS (Applicant Tracking Systems)
 */
export class ATSEngine {
  private static dictionaryKeywords = [
    "prospection", "négociation", "crm", "salesforce", "hubspot", "b2b", "b2c",
    "closing", "reporting", "chiffre d'affaires", "fidélisation", "stratégie",
    "management", "leadership", "kpi", "pipeline", "excel", "powerpoint", "canva",
    "react", "javascript", "typescript", "python", "sql", "api", "node.js", "git",
    "gestion de projet", "agile", "scrum", "comptabilité", "trésorerie", "audit",
    "recrutement", "ressources humaines", "marketing digital", "seo", "sea",
    "communication", "anglais", "français", "autonomie", "rigueur", "analyse",
    "service client", "satisfaction client", "ventes", "commerce", "cross-selling"
  ];

  static analyze(resume: ResumeData, jobDescription: string): ATSAnalysisResult {
    const jobText = jobDescription.toLowerCase();

    // 1. Extraire les mots-clés présents dans l'offre
    const jobKeywords = this.dictionaryKeywords.filter((kw) =>
      jobText.includes(kw)
    );

    // Si aucun mot-clé spécifique n'est trouvé, extraire les termes significatifs (longueur > 4)
    const fallbackTerms = jobText
      .replace(/[^\w\sàâäéèêëîïôöùûüç]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !["cette", "votre", "notre", "poste", "profil", "missions", "entreprise", "recherche"].includes(w))
      .slice(0, 12);

    const targetKeywords = Array.from(
      new Set([...jobKeywords, ...fallbackTerms])
    ).slice(0, 15);

    // 2. Extraire tout le texte du CV
    const cvTexts: string[] = [
      resume.personal.title,
      resume.summary,
      ...resume.experiences.map((e) => `${e.role} ${e.company} ${e.highlights.join(" ")}`),
      ...resume.educations.map((e) => `${e.degree} ${e.field}`),
      ...resume.skills.flatMap((s) => s.items),
    ];
    const fullCvText = cvTexts.join(" ").toLowerCase();

    // 3. Comparaison
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    targetKeywords.forEach((kw) => {
      if (fullCvText.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const matchRatio =
      targetKeywords.length > 0
        ? matchedKeywords.length / targetKeywords.length
        : 0.8;
    const matchScore = Math.min(
      98,
      Math.max(35, Math.round(matchRatio * 100))
    );

    // 4. Recommandations personnalisées
    const recommendations: string[] = [];

    if (missingKeywords.length > 0) {
      recommendations.push(
        `Intégrez les mots-clés cruciaux suivants dans vos expériences ou compétences : ${missingKeywords.slice(0, 4).join(", ")}.`
      );
    }

    if (!fullCvText.includes("kpi") && !fullCvText.includes("%") && !fullCvText.includes("chiffre")) {
      recommendations.push(
        "Quantifiez vos réalisations avec des chiffres et pourcentages réels pour valoriser l'impact de vos actions."
      );
    }

    if (resume.summary.length < 50) {
      recommendations.push(
        "Développez votre accroche professionnelle pour inclure les intitulés exacts du poste recherché."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Excellent alignement ! Votre CV correspond remarquablement aux critères de cette offre d'emploi."
      );
    }

    // 5. Suggestions d'optimisation ciblée des bullet points existants
    const optimizedBulletPoints = resume.experiences.slice(0, 2).map((exp, idx) => {
      const firstBullet = exp.highlights[0] || "Gestion des missions opérationnelles";
      const missingTerm = missingKeywords[idx] || "objectifs stratégiques";
      return {
        experienceId: exp.id,
        before: firstBullet,
        after: `${firstBullet} en intégrant les enjeux de ${missingTerm} et l'optimisation des livrables.`,
        reason: `Permet d'ajouter naturellement la compétence "${missingTerm}" demandée par le recruteur sans déformer votre rôle réel.`
      };
    });

    // Extraire le titre du poste depuis l'offre
    const firstLine = jobDescription.split("\n")[0] || "Poste ciblé";
    const jobTitle = firstLine.length < 50 ? firstLine.replace(/^(poste|offre|titre)\s*:\s*/i, "").trim() : "Poste ciblé";

    return {
      jobTitle: jobTitle || "Offre d'emploi",
      matchScore,
      matchedKeywords,
      missingKeywords,
      recommendations,
      optimizedBulletPoints
    };
  }
}
