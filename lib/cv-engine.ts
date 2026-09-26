import { ProfileType, ResumeData } from "./types";
import { AISmartEngine } from "./ai-smart-engine";

/**
 * Moteur d'Intelligence Artificielle pour la reformulation et la valorisation de CV
 */
export class CVEngine {
  /**
   * Reformule une courte description utilisateur en profil professionnel percutant
   */
  static enhanceSummary(
    rawText: string,
    roleTitle: string = "Professionnel",
    profileType: ProfileType = "professional"
  ): { main: string; variants: string[] } {
    return AISmartEngine.generateSummaryVariants(roleTitle, rawText, profileType);
  }

  /**
   * Transforme des tâches brutes en bullet points professionnels orientés résultats (Méthode STAR)
   */
  static enhanceExperienceBullets(
    rawText: string,
    roleTitle: string = "Poste",
    company: string = ""
  ): string[] {
    return AISmartEngine.transformToSTAR(rawText, roleTitle, company);
  }

  /**
   * Structure une liste d'outils et compétences entrés en vrac
   */
  static parseSkillsInput(rawInput: string): {
    tools: string[];
    business: string[];
    soft: string[];
  } {
    const items = rawInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const tools: string[] = [];
    const business: string[] = [];
    const soft: string[] = [];

    const toolKeywords = [
      "excel", "word", "powerpoint", "canva", "photoshop", "illustrator",
      "salesforce", "hubspot", "python", "javascript", "react", "sql",
      "figma", "notion", "trello", "sap", "sage", "quickbooks", "jira"
    ];

    const softKeywords = [
      "communication", "équipe", "rigueur", "autonomie", "adaptation",
      "écoute", "stress", "négociation", "leadership", "ponctualité", "organisation"
    ];

    items.forEach((item) => {
      const lower = item.toLowerCase();
      if (toolKeywords.some((k) => lower.includes(k))) {
        tools.push(item);
      } else if (softKeywords.some((k) => lower.includes(k))) {
        soft.push(item);
      } else {
        business.push(item);
      }
    });

    return { tools, business, soft };
  }

  /**
   * Générateur de lettre de motivation synchronisée avec le CV
   */
  static generateCoverLetter(
    resume: ResumeData,
    targetJob: string = "Poste convoité",
    targetCompany: string = "Entreprise Cible"
  ): string {
    const fullName = `${resume.personal.firstName} ${resume.personal.lastName}`.trim();
    const city = resume.personal.city || "Abidjan";
    const dateStr = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    return `${fullName}
${resume.personal.phone} | ${resume.personal.email}
${city}, ${resume.personal.country}

À l'attention du Responsable du Recrutement
${targetCompany}
${city}

Fait à ${city}, le ${dateStr}

Objet : Candidature au poste de ${targetJob}

Madame, Monsieur,

C'est avec un vif intérêt que je vous adresse ma candidature pour le poste de ${targetJob} au sein de votre entreprise ${targetCompany}, dont la réputation et le dynamisme constituent pour moi une réelle source de motivation.

Fort d'un parcours axé sur la rigueur, l'atteinte des résultats et l'excellence opérationnelle, j'ai développé au cours de mes expériences une solide expertise en ${resume.skills[0]?.items.slice(0, 3).join(", ") || "mon domaine de compétence"}. Mon parcours m'a permis de perfectionner mon autonomie, ma capacité à travailler en équipe sous contraintes de délais et mon sens du service client.

Intégrer ${targetCompany} représente pour moi l'opportunité de mettre mon énergie, mes compétences pratiques et ma polyvalence au service de vos projets de développement. Je suis convaincu que ma motivation sans faille et mon enthousiasme sauront répondre aux exigences de votre structure.

Je reste à votre entière disposition pour un entretien au cours duquel je serai ravi de vous exposer plus en détail les atouts de ma candidature.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${fullName}`;
  }
}
