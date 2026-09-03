import { ProfileType, ResumeData } from "./types";

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
    const cleanText = rawText.trim();
    if (!cleanText) {
      return {
        main: `${roleTitle} dynamique et motivé, doté d'une forte capacité d'adaptation et d'un sens aigu des responsabilités. Prêt à mettre ses compétences et son dynamisme au service d'objectifs ambitieux.`,
        variants: [
          `Professionnel rigoureux et engagé, passionné par le domaine de ${roleTitle}, axé sur l'atteinte des résultats et l'amélioration continue.`,
          `Profil polyvalent et orienté solutions, alliant compétences techniques et excellent relationnel pour relever de nouveaux défis en tant que ${roleTitle}.`
        ]
      };
    }

    // Heuristiques intelligentes de transformation selon le profil
    if (profileType === "student" || profileType === "no_exp") {
      const main = `${roleTitle} ambitieux et rigoureux, alliant solide formation académique et sens pratique. Reconnu pour sa capacité d'apprentissage rapide, son esprit d'initiative et sa motivation à contribuer activement aux projets de l'entreprise.`;
      const variants = [
        `Jeune diplômé dynamique orienté vers les métiers de ${roleTitle}. Doté d'une excellente rigueur méthodologique et d'un esprit d'équipe éprouvé lors de projets et stages.`,
        `Profil enthousiaste et proactif, prêt à investir son énergie et ses compétences fraîches au service de votre équipe en qualité de ${roleTitle}.`
      ];
      return { main, variants };
    }

    if (profileType === "career_change") {
      const main = `Professionnel en reconversion vers le métier de ${roleTitle}, valorisant une solide expérience préalable en gestion de projets, résolution de problèmes et relation client. Capacité démontrée d'adaptation rapide et vision transversale.`;
      const variants = [
        `Doté d'un bagage professionnel riche et diversifié, actuellement en transition dynamique vers les opportunités de ${roleTitle}. Motivé, agile et orienté valeur ajoutée.`,
        `Expertise transférable reconnue mise au service de nouveaux challenges opérationnels en tant que ${roleTitle}.`
      ];
      return { main, variants };
    }

    // Profil standard / expérimenté
    const main = `${roleTitle} expérimenté et orienté résultats, fort d'un parcours réussi dans l'optimisation des performances et la satisfaction client. Reconnu pour son autonomie, son sens stratégique et son leadership opérationnel.`;
    const variants = [
      `${roleTitle} passionné et proactif, combinant expertise métier et vision orientée objectifs. Capacité confirmée à piloter des missions complexes et à fidéliser les partenaires.`,
      `Spécialiste en ${roleTitle} reconnu pour sa rigueur, son aisance relationnelle et sa contribution directe à la croissance et à l'efficacité de l'organisation.`
    ];

    return { main, variants };
  }

  /**
   * Transforme des tâches brutes en bullet points professionnels orientés résultats (Méthode STAR)
   */
  static enhanceExperienceBullets(
    rawText: string,
    roleTitle: string = "Poste",
    company: string = ""
  ): string[] {
    const raw = rawText.trim().toLowerCase();

    if (!raw) {
      return [
        `Prise en charge des missions opérationnelles clés liées au poste de ${roleTitle}.`,
        `Collaboration étroite avec l'équipe pour garantir la fluidité des processus et l'atteinte des objectifs.`,
        `Suivi rigoureux des indicateurs de performance et proposition d'actions correctives adaptées.`
      ];
    }

    // Détections contextuelles intelligentes
    const isVente = raw.includes("vend") || raw.includes("vente") || raw.includes("commercial") || raw.includes("client") || raw.includes("boutique") || raw.includes("magasin");
    const isTech = raw.includes("dev") || raw.includes("code") || raw.includes("site") || raw.includes("app") || raw.includes("informatique") || raw.includes("tech") || raw.includes("web");
    const isCompta = raw.includes("compta") || raw.includes("facture") || raw.includes("finance") || raw.includes("chiffre") || raw.includes("caisse");
    const isMarketing = raw.includes("reseau") || raw.includes("marketing") || raw.includes("pub") || raw.includes("post") || raw.includes("social") || raw.includes("comm");
    const isLogistique = raw.includes("stock") || raw.includes("livraison") || raw.includes("colis") || raw.includes("entrepot") || raw.includes("logistique");

    if (isVente) {
      return [
        `Développement d'un portefeuille de clients et commercialisation ciblée des produits et services.`,
        `Conseil personnalisé, écoute active des besoins et accompagnement complet des prospects jusqu'à la conclusion de la vente.`,
        `Dépassement des objectifs quantitatifs et qualitatifs, contribuant directement à la croissance du chiffre d'affaires.`,
        `Gestion de la relation client après-vente et fidélisation avec un haut niveau de satisfaction.`
      ];
    }

    if (isTech) {
      return [
        `Conception, développement et maintenance d'applications web/mobiles performantes et ergonomiques.`,
        `Optimisation des temps de chargement, de la sécurité du code et respect des standards d'architecture logicielle.`,
        `Collaboration active en méthode agile avec les équipes design et produit pour livrer des fonctionnalités à forte valeur.`,
        `Rédaction de tests automatisés et documentation technique pour assurer la pérennité du projet.`
      ];
    }

    if (isCompta) {
      return [
        `Gestion et vérification rigoureuse des écritures comptables, facturations clients et règlements fournisseurs.`,
        `Élaboration des états de rapprochement bancaire et suivi scrupuleux de la trésorerie au quotidien.`,
        `Participation active aux clôtures mensuelles/annuelles et préparation des déclarations fiscales en conformité réglementaire.`,
        `Mise en place de tableaux de bord financiers pour éclairer les décisions de la direction.`
      ];
    }

    if (isMarketing) {
      return [
        `Élaboration et déploiement de stratégies de contenu multi-canaux (réseaux sociaux, newsletters, campagnes web).`,
        `Création de visuels attractifs et rédaction de messages engageants augmentant le taux de conversion de la marque.`,
        `Analyse hebdomadaire des métriques d'audience (KPIs, engagement, ROI) et ajustement des campagnes publicitaires.`,
        `Coordination de partenariats et animation de la communauté pour renforcer la notoriété de l'entreprise.`
      ];
    }

    if (isLogistique) {
      return [
        `Supervision des opérations de réception, stockage, préparation et expédition des commandes dans le respect des délais.`,
        `Optimisation continue de l'organisation des flux d'entrepôt et réduction des écarts d'inventaire.`,
        `Coordination proactive avec les transporteurs et fournisseurs pour garantir la satisfaction client finale.`,
        `Application stricte des règles d'hygiène, sécurité et gestion optimale des niveaux de stock.`
      ];
    }

    // Réécriture générique structurée
    return [
      `Gestion opérationnelle des activités quotidiennes de ${roleTitle} au sein de ${company || "l'organisation"}.`,
      `Mise en œuvre de solutions efficaces pour optimiser la qualité de service et la fluidité du travail d'équipe.`,
      `Suivi attentif des livrables et respect rigoureux des normes de qualité et des échéances imparties.`,
      `Contribution reconnue à la progression des résultats et à la satisfaction des parties prenantes.`
    ];
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
