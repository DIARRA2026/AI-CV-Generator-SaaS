import { ResumeData } from "./types";

export type DensityMode = "spacious" | "balanced" | "compact";

export interface DensitySettings {
  mode: DensityMode;
  scale: number;
  totalLines: number;

  // Typographie calculée en pixels par formule de composition (Desktop Publishing / PAO)
  fontSize: {
    title: string;
    role: string;
    heading: string;
    summary: string;
    base: string;
    sm: string;
    xs: string;
  };
  lineHeight: number;

  // Espacements géométriques calculés en pixels (justification verticale)
  spacing: {
    pagePadding: string;
    sidebarPadding: string;
    sectionGap: string;
    itemGap: string;
    bulletGap: string;
    cardPadding: string;
    summaryPadding: string;
    photoSize: string;
  };

  // Rétrocompatibilité Tailwind pour les classes existantes
  sectionGap: string;
  itemGap: string;
  bulletGap: string;
  headerMargin: string;
  cardPadding: string;
  summaryPadding: string;
  bodyTextSize: string;
  summaryTextSize: string;
  titleSize: string;
  roleSize: string;
  showDecorativeBadges: boolean;
  expandSummary: boolean;
}

/**
 * Moteur Typographique & Formules Mathématiques de Traitement de Texte (Desktop Publishing).
 * Calcule le budget vertical exact de la page A4 (297 mm) et dérive un facteur
 * d'échelle continu S afin de confiner et d'ajuster parfaitement l'écriture.
 */
export function getResumeDensity(data: ResumeData): DensitySettings {
  const { personal, summary, experiences, educations, skills, languages, sections } = data;

  // 1. Budget de lignes équivalentes (Line-Budget Formulation)
  // Overhead fixe : En-tête, identité, marges de sécurité
  let totalLines = 7;

  // Contact et métadonnées
  let contactFieldsCount = 0;
  if (personal?.email) contactFieldsCount++;
  if (personal?.phone) contactFieldsCount++;
  if (personal?.city || personal?.country) contactFieldsCount++;
  if (personal?.birthDate || personal?.birthPlace) contactFieldsCount++;
  if (personal?.maritalStatus) contactFieldsCount++;
  if (personal?.linkedin) contactFieldsCount++;
  if (personal?.website) contactFieldsCount++;
  totalLines += contactFieldsCount * 0.7;

  // Résumé / Profil (environ 75 caractères par ligne imprimée)
  if (summary && summary.trim().length > 0) {
    const summaryClean = summary.trim();
    const summaryLines = Math.max(1, Math.ceil(summaryClean.length / 75));
    totalLines += summaryLines + 2.2; // + titre et padding
  }

  // Expériences professionnelles
  if (experiences && experiences.length > 0) {
    totalLines += 2.2; // Titre de section
    experiences.forEach((exp) => {
      totalLines += 2.0; // Rôle, entreprise, dates
      if (exp.highlights && exp.highlights.length > 0) {
        exp.highlights.forEach((h) => {
          const hLines = Math.max(1, Math.ceil(h.length / 68));
          totalLines += hLines;
        });
      }
      totalLines += 0.5; // Espacement inter-poste
    });
  }

  // Formations & Diplômes
  if (educations && educations.length > 0) {
    totalLines += 2.0; // Titre de section
    educations.forEach(() => {
      totalLines += 1.9; // Diplôme, école, année
    });
  }

  // Compétences
  if (skills && skills.length > 0) {
    totalLines += 2.0; // Titre de section
    skills.forEach((cat) => {
      const itemsCount = cat.items?.length || 0;
      totalLines += 1.2 + Math.ceil(itemsCount / 5) * 0.8;
    });
  }

  // Langues
  if (languages && languages.length > 0) {
    totalLines += 1.5; // Titre
    totalLines += languages.length * 0.85;
  }

  // Certifications & Projets
  if (sections?.certifications && sections.certifications.length > 0) {
    totalLines += 1.5 + sections.certifications.length * 1.3;
  }
  if (sections?.projects && sections.projects.length > 0) {
    totalLines += 1.5 + sections.projects.length * 1.5;
  }
  if (sections?.interests && sections.interests.length > 0) {
    totalLines += 1.5 + Math.ceil(sections.interests.length / 4) * 0.8;
  }

  // 2. Formule Mathématique d'Échelle Typographique (Power-law Type Scaling)
  // Baseline = 28 lignes idéales pour un document A4 standard
  const baselineLines = 28;
  const rawScale = Math.pow(baselineLines / Math.max(14, totalLines), 0.30);
  // Clamping de sécurité typographique : lisibilité minimale 0.90, élégance maximale 1.15
  const scale = Math.max(0.90, Math.min(1.15, rawScale));

  // 3. Calcul continu des grandeurs typographiques et géométriques (Normes d'Édition Pro)
  const fontSize = {
    title: `${Math.round(24 * Math.min(1.12, scale))}px`,
    role: `${(13.2 * scale).toFixed(1)}px`,
    heading: `${(13.0 * scale).toFixed(1)}px`,
    summary: `${(11.5 * scale).toFixed(1)}px`,
    base: `${(11.5 * scale).toFixed(1)}px`,
    sm: `${(10.8 * scale).toFixed(1)}px`,
    xs: `${(10.0 * scale).toFixed(1)}px`,
  };

  // Formule d'interlignage proportionnel équilibré
  const lineHeight = Math.min(1.58, Math.max(1.38, 1.45 * Math.pow(scale, 0.25)));

  // Espacements géométriques
  const spacing = {
    pagePadding: `${Math.round(26 * scale)}px`,
    sidebarPadding: `${Math.round(22 * scale)}px`,
    sectionGap: `${Math.max(12, Math.round(18 * scale))}px`,
    itemGap: `${Math.max(8, Math.round(12 * scale))}px`,
    bulletGap: `${Math.max(3, Math.round(5 * scale))}px`,
    cardPadding: `${Math.max(8, Math.round(12 * scale))}px`,
    summaryPadding: `${Math.max(10, Math.round(14 * scale))}px`,
    photoSize: `${Math.round(92 * Math.min(1.15, Math.max(0.88, scale)))}px`,
  };

  // 4. Catégorisation pour rétrocompatibilité
  let mode: DensityMode = "balanced";
  if (scale > 1.08) {
    mode = "spacious";
  } else if (scale < 0.92) {
    mode = "compact";
  } else {
    mode = "balanced";
  }

  // Retour complet
  return {
    mode,
    scale,
    totalLines,
    fontSize,
    lineHeight,
    spacing,

    // Propriétés rétrocompatibles
    sectionGap:
      mode === "spacious"
        ? "gap-6 sm:gap-8"
        : mode === "compact"
        ? "gap-2.5 sm:gap-3"
        : "gap-4 sm:gap-5",
    itemGap:
      mode === "spacious"
        ? "space-y-4"
        : mode === "compact"
        ? "space-y-1.5"
        : "space-y-2.5",
    bulletGap:
      mode === "spacious"
        ? "space-y-2"
        : mode === "compact"
        ? "space-y-0.5"
        : "space-y-1",
    headerMargin: mode === "spacious" ? "mb-4" : mode === "compact" ? "mb-1.5" : "mb-2.5",
    cardPadding: mode === "spacious" ? "p-4 sm:p-5" : mode === "compact" ? "p-2" : "p-3",
    summaryPadding: mode === "spacious" ? "p-4 sm:p-5" : mode === "compact" ? "p-2.5" : "p-3.5",
    bodyTextSize:
      mode === "spacious"
        ? "text-[11px]"
        : mode === "compact"
        ? "text-[9px]"
        : "text-[10px]",
    summaryTextSize:
      mode === "spacious"
        ? "text-[11px]"
        : mode === "compact"
        ? "text-[9.5px]"
        : "text-[10.5px]",
    titleSize: mode === "spacious" ? "text-2xl sm:text-3xl" : mode === "compact" ? "text-xl" : "text-2xl",
    roleSize: mode === "spacious" ? "text-xs sm:text-[12.5px]" : mode === "compact" ? "text-[10px]" : "text-[11px]",
    showDecorativeBadges: mode !== "compact",
    expandSummary: mode === "spacious",
  };
}
