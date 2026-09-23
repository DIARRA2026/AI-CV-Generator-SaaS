/**
 * MONCV.AI — CONFIGURATION DU SYSTÈME DE CRÉDITS PRÉPAYÉS & PAIEMENTS WAVE
 * 
 * Marchand Wave : MonCV.ai / INNOVA GROUP
 * Identifiant Marchand : M_iWih2Nsg7dr8
 * Marché : Côte d'Ivoire (CI) & Afrique de l'Ouest
 * 
 * MODÈLE : CRÉDITS PRÉPAYÉS AVEC DURÉE DE VALIDITÉ (ZÉRO ABONNEMENT)
 * Les exports PDF et Word, l'aperçu et les éditions manuelles restent 100% gratuits et illimités.
 */

import { CreditPack, CreditPackCode, PlanTier } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// 1. BARÈME DU COÛT EN CRÉDITS DES ACTIONS IA
// ─────────────────────────────────────────────────────────────────────────────

export const CREDIT_ACTIONS_COST = {
  // Génération ou réécriture complète de CV par l'IA
  cv_generate: 15,
  cv_rewrite: 15,

  // Lettre de motivation ciblée par l'IA
  cover_letter: 8,

  // Adaptation du CV à une offre d'emploi (ATS)
  ats_adaptation: 8,
  ats_analysis: 8,

  // Version anglaise du CV
  english_version: 12,
  translate_en: 12,

  // Photo professionnelle (retouche / amélioration IA de portrait)
  pro_photo: 20,

  // Gratuit & Illimité (ne débite jamais de crédits)
  manual_creation: 0,
  manual_edit: 0,
  preview: 0,
  pdf_export: 0,
  docx_export: 0,
} as const;

export type { CreditPack, CreditPackCode } from "@/lib/types";

export type CreditActionKey = keyof typeof CREDIT_ACTIONS_COST;

export function getActionCost(action: CreditActionKey | string): number {
  return (CREDIT_ACTIONS_COST as Record<string, number>)[action] ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. NOUVELLE GRILLE OFFICIELLE DES PACKS DE CRÉDITS
// ─────────────────────────────────────────────────────────────────────────────

export const CREDIT_PACKS: Record<CreditPackCode, CreditPack> = {
  decouverte: {
    code: "decouverte",
    label: "Découverte",
    priceFcfa: 0,
    credits: 20,
    validityDays: null, // Permanent
    unitPriceFcfa: 0,
    waveLink: null,
    active: true,
    badge: "Offert à l'inscription",
    description: "20 crédits offerts immédiatement pour tester la puissance de notre IA.",
    features: [
      "20 crédits offerts à la création du compte",
      "Génération complète d'un CV par IA (15 crédits)",
      "Création manuelle illimitée 100% gratuite",
      "Export PDF & Word sans filigrane illimité",
    ],
  },
  essentiel: {
    code: "essentiel",
    label: "Essentiel",
    priceFcfa: 1500,
    credits: 60,
    validityDays: 30, // 1 mois
    unitPriceFcfa: 25, // 25 FCFA / crédit
    waveLink: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=1500",
    active: true,
    badge: "1 Mois de validité",
    description: "Idéal pour postuler rapidement à plusieurs offres d'emploi ciblées.",
    features: [
      "60 crédits valables 30 jours (25 F / crédit)",
      "Jusqu'à 4 générations complètes de CV par l'IA",
      "Ou 7 lettres de motivation percutantes",
      "Exports PDF et Word HD sans filigrane illimités",
    ],
  },
  evolution: {
    code: "evolution",
    label: "Évolution",
    priceFcfa: 2500,
    credits: 125,
    validityDays: 90, // 3 mois
    unitPriceFcfa: 20, // 20 FCFA / crédit
    waveLink: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=2500",
    active: true,
    recommended: true,
    badge: "Recommandé ★ • 3 Mois",
    description: "Le pack le plus équilibré pour maximiser vos entretiens d'embauche.",
    features: [
      "125 crédits valables 90 jours (20 F / crédit)",
      "Générations de CV + Lettres de motivation illimitées",
      "Adaptations ATS directes aux offres d'emploi",
      "Traductions en version anglaise incluses",
      "Économie de 20% par rapport au tarif unitaire",
    ],
  },
  carriere: {
    code: "carriere",
    label: "Carrière",
    priceFcfa: 5000,
    credits: 300,
    validityDays: 180, // 6 mois
    unitPriceFcfa: 16.6, // 16,6 FCFA / crédit
    waveLink: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=5000",
    active: true,
    badge: "Meilleure Valeur • 6 Mois",
    description: "Pack longue durée pour booster votre carrière et vos candidatures internationales.",
    features: [
      "300 crédits valables 180 jours (16,6 F / crédit)",
      "Retouches photo professionnelle par IA incluses",
      "Adaptations ATS illimitées pour toutes vos candidatures",
      "Versions anglaises et portfolios en ligne",
      "Tarif préférentiel plancher garanti",
    ],
  },
};

export const CREDIT_PACKS_ARRAY: CreditPack[] = [
  CREDIT_PACKS.decouverte,
  CREDIT_PACKS.essentiel,
  CREDIT_PACKS.evolution,
  CREDIT_PACKS.carriere,
];

export function getCreditPack(code: CreditPackCode | string): CreditPack | null {
  return CREDIT_PACKS[code as CreditPackCode] || null;
}

export function getWaveLink(code: CreditPackCode | string): string | null {
  const pack = getCreditPack(code);
  return pack?.waveLink || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILITÉ RÉTROACTIVE (Pont transparent pour les anciennes références)
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentPlanConfig {
  id: PlanTier;
  name: string;
  category: "particulier" | "entreprise";
  amount: number;
  formattedAmount: string;
  currency: "FCFA";
  badge: string;
  description: string;
  allowedCandidates: number;
  features: string[];
}

export function getPaymentPlanConfig(planId: PlanTier | string): PaymentPlanConfig | null {
  if (planId === "1500") {
    return {
      id: "1500",
      name: "Pack Essentiel (60 Crédits)",
      category: "particulier",
      amount: 1500,
      formattedAmount: "1 500 FCFA",
      currency: "FCFA",
      badge: "60 Crédits",
      description: "Pack prépayé 60 crédits valable 30 jours.",
      allowedCandidates: 1,
      features: CREDIT_PACKS.essentiel.features || [],
    };
  }
  if (planId === "2500") {
    return {
      id: "2500",
      name: "Pack Évolution (125 Crédits)",
      category: "particulier",
      amount: 2500,
      formattedAmount: "2 500 FCFA",
      currency: "FCFA",
      badge: "125 Crédits",
      description: "Pack prépayé 125 crédits valable 90 jours.",
      allowedCandidates: 2,
      features: CREDIT_PACKS.evolution.features || [],
    };
  }
  if (planId === "5000") {
    return {
      id: "5000",
      name: "Pack Carrière (300 Crédits)",
      category: "particulier",
      amount: 5000,
      formattedAmount: "5 000 FCFA",
      currency: "FCFA",
      badge: "300 Crédits",
      description: "Pack prépayé 300 crédits valable 180 jours.",
      allowedCandidates: 4,
      features: CREDIT_PACKS.carriere.features || [],
    };
  }
  return null;
}

export function getPlanAmount(planId: PlanTier | string): number {
  if (planId === "1500") return 1500;
  if (planId === "2500") return 2500;
  if (planId === "5000") return 5000;
  return 0;
}

export function getWavePaymentUrl(planId: PlanTier | string): string | null {
  if (planId === "1500" || planId === "essentiel") return CREDIT_PACKS.essentiel.waveLink;
  if (planId === "2500" || planId === "evolution") return CREDIT_PACKS.evolution.waveLink;
  if (planId === "5000" || planId === "carriere") return CREDIT_PACKS.carriere.waveLink;
  return null;
}
