/**
 * MONCV.AI — CONFIGURATION CENTRALISÉE DES PAIEMENTS (LIGDICASH & MOBILE MONEY)
 * 
 * Passerelle Principale : LIGDICASH (UEMOA - Côte d'Ivoire, Burkina Faso, Sénégal, Mali, Bénin, Togo)
 * Opérateurs pris en charge : Orange Money, MTN MoMo, Moov Money, Wave, Carte Bancaire
 * Devise officielle : FCFA (XOF)
 * 
 * RÔLE DU FICHIER :
 * Point unique de vérité pour tous les paramètres tarifaires et de facturation.
 * Garantit l'immuabilité absolue des montants pour empêcher toute falsification côté client.
 */

import { PlanTier } from "@/lib/types";

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

export interface WavePaymentPlan extends PaymentPlanConfig {
  paymentUrl: string;
}

/**
 * Grille tarifaire officielle immuable MonCV.ai (Passerelle LigdiCash Panafricaine)
 */
export const PAYMENT_PLANS: Record<PlanTier, PaymentPlanConfig | null> = {
  // ── 1. Formules Particuliers ──
  "1500": {
    id: "1500",
    name: "Essentiel",
    category: "particulier",
    amount: 1500,
    formattedAmount: "1 500 FCFA",
    currency: "FCFA",
    badge: "1 Profil Débloqué",
    description: "Export PDF Vectoriel Haute Définition & Word (.docx) sans aucun filigrane.",
    allowedCandidates: 1,
    features: [
      "1 profil candidat unique complet",
      "Téléchargements illimités PDF HD & Word DOCX",
      "Modèles et retouches illimités à vie",
    ],
  },
  "2500": {
    id: "2500",
    name: "Candidature Pro",
    category: "particulier",
    amount: 2500,
    formattedAmount: "2 500 FCFA",
    currency: "FCFA",
    badge: "Recommandé ★",
    description: "Générateur IA de Lettre de motivation + Demande d'emploi officielle OHADA + 2 profils.",
    allowedCandidates: 2,
    features: [
      "Jusqu'à 2 profils candidats complets",
      "Générateur IA de Lettre de motivation personnalisée",
      "Demande d'emploi administrative officielle OHADA",
      "Exports PDF HD & Word sans filigrane",
    ],
  },
  "5000": {
    id: "5000",
    name: "VIP & Portfolio Web",
    category: "particulier",
    amount: 5000,
    formattedAmount: "5 000 FCFA",
    currency: "FCFA",
    badge: "Prestige VIP",
    description: "Site Web Portfolio interactif personnel + QR Code Recruteur HD + 4 profils.",
    allowedCandidates: 4,
    features: [
      "Jusqu'à 4 profils candidats complets",
      "Site Web Portfolio personnel en ligne (URL exclusive)",
      "Générateur de QR Code HD pour recruteurs",
      "Accès prioritaire à tous les outils IA",
    ],
  },

  // ── 2. Formules Entreprises (B2B / Cabinets RH / Recruteurs) ──
  "cyber15": {
    id: "cyber15",
    name: "Pack Cyber Café (15 Profils)",
    category: "entreprise",
    amount: 10000,
    formattedAmount: "10 000 FCFA",
    currency: "FCFA",
    badge: "Cyber",
    description: "15 profils pour cybercafés et centres de saisie.",
    allowedCandidates: 15,
    features: [
      "15 profils candidats complets débloqués",
      "Exports PDF et Word illimités sans filigrane",
      "Tous les 6 modèles de CV inclus",
    ],
  },
  "enterprise30": {
    id: "enterprise30",
    name: "Starter PME (30 Candidats)",
    category: "entreprise",
    amount: 20000,
    formattedAmount: "20 000 FCFA",
    currency: "FCFA",
    badge: "30 Profils",
    description: "Vivier RH de 30 candidats avec téléchargements et modèles illimités à vie.",
    allowedCandidates: 30,
    features: [
      "Vivier RH de 30 profils candidats débloqués",
      "Toutes les options VIP personnelles 100% offertes",
      "Modèles de prestige et retouches illimitées",
    ],
  },
  "enterprise75": {
    id: "enterprise75",
    name: "Business Pro (75 Candidats)",
    category: "entreprise",
    amount: 45000,
    formattedAmount: "45 000 FCFA",
    currency: "FCFA",
    badge: "Recommandé RH ★",
    description: "Vivier RH de 75 profils + Facture normalisée OHADA + Support Prioritaire WhatsApp VIP.",
    allowedCandidates: 75,
    features: [
      "Vivier RH de 75 profils candidats complets",
      "Facture normalisée conforme OHADA",
      "Support prioritaire WhatsApp VIP",
      "Toutes les options VIP offertes",
    ],
  },
  "enterprise200": {
    id: "enterprise200",
    name: "Entreprise Premium (200 Candidats)",
    category: "entreprise",
    amount: 100000,
    formattedAmount: "100 000 FCFA",
    currency: "FCFA",
    badge: "Volume Élite",
    description: "200 profils candidats à tarif plancher garanti (500 F/profil) + Gestionnaire de compte dédié.",
    allowedCandidates: 200,
    features: [
      "200 profils candidats (500 FCFA / profil)",
      "Gestionnaire de compte dédié INNOVA GROUP",
      "Accès API & Exports groupés",
      "Toutes les options VIP offertes",
    ],
  },

  "free": null,
};

/**
 * Récupère la configuration tarifaire complète pour un plan donné
 */
export function getPaymentPlanConfig(planId: PlanTier | string): PaymentPlanConfig | null {
  return PAYMENT_PLANS[planId as PlanTier] || null;
}

/**
 * Récupère le montant exact en FCFA côté serveur (Immuable)
 */
export function getPlanAmount(planId: PlanTier | string): number {
  const plan = getPaymentPlanConfig(planId);
  return plan?.amount || 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILITÉ ANTÉRIEURE WAVE (Adaptateur transparent)
// ─────────────────────────────────────────────────────────────────────────────
export const WAVE_PAYMENT_CONFIG: Record<PlanTier, WavePaymentPlan | null> = {
  "1500": {
    ...PAYMENT_PLANS["1500"]!,
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=1500",
  },
  "2500": {
    ...PAYMENT_PLANS["2500"]!,
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=2500",
  },
  "5000": {
    ...PAYMENT_PLANS["5000"]!,
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=5000",
  },
  "enterprise30": {
    ...PAYMENT_PLANS["enterprise30"]!,
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=20000",
  },
  "enterprise75": {
    ...PAYMENT_PLANS["enterprise75"]!,
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=45000",
  },
  "enterprise200": {
    ...PAYMENT_PLANS["enterprise200"]!,
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=100000",
  },
  "cyber15": {
    ...PAYMENT_PLANS["cyber15"]!,
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=10000",
  },
  "free": null,
};

export function getWavePaymentUrl(planId: PlanTier | string): string | null {
  const plan = WAVE_PAYMENT_CONFIG[planId as PlanTier];
  return plan ? plan.paymentUrl : null;
}

export function getWavePlanConfig(planId: PlanTier | string): WavePaymentPlan | null {
  return WAVE_PAYMENT_CONFIG[planId as PlanTier] || null;
}

export function hasWavePayment(planId: PlanTier | string): boolean {
  return Boolean(getWavePaymentUrl(planId));
}
