import { ResumeData } from "./types";

export type DensityMode = "spacious" | "balanced" | "compact";

export interface DensitySettings {
  mode: DensityMode;
  // Marges et espacements de section
  sectionGap: string;
  itemGap: string;
  bulletGap: string;
  headerMargin: string;
  // Remplissage intérieur des cartes
  cardPadding: string;
  summaryPadding: string;
  // Typographie adaptable
  bodyTextSize: string;
  summaryTextSize: string;
  titleSize: string;
  roleSize: string;
  lineHeight: string;
  // Badges & détails
  showDecorativeBadges: boolean;
  expandSummary: boolean;
}

/**
 * Analyse le volume total d'informations saisies dans le CV
 * et détermine le mode d'adaptation de densité pour occuper
 * 100% de la hauteur de la page A4 (297 mm) de façon équilibrée et élégante.
 */
export function getResumeDensity(data: ResumeData): DensitySettings {
  const { summary, experiences, educations, skills, sections, languages } = data;

  // 1. Calcul du score de contenu
  let contentScore = 0;

  // Profil
  const summaryLength = summary ? summary.trim().length : 0;
  if (summaryLength > 300) contentScore += 4;
  else if (summaryLength > 150) contentScore += 2.5;
  else if (summaryLength > 0) contentScore += 1.5;

  // Expériences & puces
  if (experiences && experiences.length > 0) {
    experiences.forEach((exp) => {
      contentScore += 2;
      const highlightsCount = exp.highlights?.length || 0;
      contentScore += highlightsCount * 1.2;
    });
  }

  // Formations
  if (educations && educations.length > 0) {
    contentScore += educations.length * 1.8;
  }

  // Compétences
  if (skills && skills.length > 0) {
    skills.forEach((cat) => {
      contentScore += 1;
      contentScore += (cat.items?.length || 0) * 0.3;
    });
  }

  // Langues & autres sections
  if (languages && languages.length > 0) {
    contentScore += languages.length * 0.8;
  }
  if (sections?.certifications && sections.certifications.length > 0) {
    contentScore += sections.certifications.length * 1.2;
  }
  if (sections?.projects && sections.projects.length > 0) {
    contentScore += sections.projects.length * 1.5;
  }
  if (sections?.interests && sections.interests.length > 0) {
    contentScore += 1;
  }

  // 2. Attribution du mode
  let mode: DensityMode = "balanced";

  if (contentScore < 13) {
    mode = "spacious";
  } else if (contentScore > 22) {
    mode = "compact";
  } else {
    mode = "balanced";
  }

  // 3. Configurations graphiques par mode
  switch (mode) {
    case "spacious":
      return {
        mode: "spacious",
        sectionGap: "gap-6 sm:gap-8",
        itemGap: "space-y-4",
        bulletGap: "space-y-2",
        headerMargin: "mb-4",
        cardPadding: "p-4 sm:p-5",
        summaryPadding: "p-4 sm:p-5",
        bodyTextSize: "text-[11px]",
        summaryTextSize: "text-[11px]",
        titleSize: "text-2xl sm:text-3xl",
        roleSize: "text-xs sm:text-[12.5px]",
        lineHeight: "leading-relaxed",
        showDecorativeBadges: true,
        expandSummary: true,
      };

    case "compact":
      return {
        mode: "compact",
        sectionGap: "gap-2.5 sm:gap-3",
        itemGap: "space-y-2",
        bulletGap: "space-y-0.5",
        headerMargin: "mb-1.5",
        cardPadding: "p-2 sm:p-2.5",
        summaryPadding: "p-2 sm:p-2.5",
        bodyTextSize: "text-[9.5px]",
        summaryTextSize: "text-[9.5px]",
        titleSize: "text-xl",
        roleSize: "text-[10px]",
        lineHeight: "leading-snug",
        showDecorativeBadges: false,
        expandSummary: false,
      };

    case "balanced":
    default:
      return {
        mode: "balanced",
        sectionGap: "gap-4 sm:gap-5",
        itemGap: "space-y-3",
        bulletGap: "space-y-1",
        headerMargin: "mb-2.5",
        cardPadding: "p-3",
        summaryPadding: "p-3.5",
        bodyTextSize: "text-[10px]",
        summaryTextSize: "text-[10.5px]",
        titleSize: "text-2xl",
        roleSize: "text-[11px]",
        lineHeight: "leading-normal",
        showDecorativeBadges: true,
        expandSummary: false,
      };
  }
}
