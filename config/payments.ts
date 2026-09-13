/**
 * MONCV.AI — CONFIGURATION CENTRALISÉE DES PAIEMENTS WAVE
 * 
 * Marchand Wave : MonCV.ai / INNOVA GROUP
 * Identifiant Marchand : M_iWih2Nsg7dr8
 * Pays : Côte d'Ivoire (CI) - Devise : FCFA (XOF)
 * 
 * RÔLE DU FICHIER :
 * Point unique de vérité pour tous les liens et paramètres de facturation Wave.
 * Garantit l'immuabilité des montants pour empêcher toute falsification côté client.
 */

import { PlanTier } from "@/lib/types";

export interface WavePaymentPlan {
  id: PlanTier;
  name: string;
  category: "particulier" | "entreprise";
  amount: number;
  formattedAmount: string;
  currency: "FCFA";
  paymentUrl: string;
  badge: string;
  description: string;
}

/**
 * Liens de paiement Wave officiels (Marchand M_iWih2Nsg7dr8 / Côte d'Ivoire)
 * Les montants sont figés dans l'URL et vérifiés pour prévenir tout contournement.
 */
export const WAVE_PAYMENT_CONFIG: Record<PlanTier, WavePaymentPlan | null> = {
  // ── 1. Formules Particuliers ──
  "1500": {
    id: "1500",
    name: "Essentiel",
    category: "particulier",
    amount: 1500,
    formattedAmount: "1 500 FCFA",
    currency: "FCFA",
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=1500",
    badge: "1 Profil Débloqué",
    description: "Export PDF Vectoriel Haute Définition & Word (.docx) sans aucun filigrane.",
  },
  "2500": {
    id: "2500",
    name: "Candidature Pro",
    category: "particulier",
    amount: 2500,
    formattedAmount: "2 500 FCFA",
    currency: "FCFA",
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=2500",
    badge: "Recommandé ★",
    description: "Générateur IA de Lettre de motivation + Demande d'emploi officielle OHADA + 2 profils.",
  },
  "5000": {
    id: "5000",
    name: "VIP & Portfolio Web",
    category: "particulier",
    amount: 5000,
    formattedAmount: "5 000 FCFA",
    currency: "FCFA",
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=5000",
    badge: "Prestige VIP",
    description: "Site Web Portfolio interactif personnel + QR Code Recruteur HD + 4 profils.",
  },

  // ── 2. Formules Entreprises (B2B / Cabinets RH / Recruteurs) ──
  "enterprise30": {
    id: "enterprise30",
    name: "Starter PME (30 Candidats)",
    category: "entreprise",
    amount: 20000,
    formattedAmount: "20 000 FCFA",
    currency: "FCFA",
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=20000",
    badge: "30 Profils",
    description: "Vivier RH de 30 candidats avec téléchargements et modèles illimités à vie.",
  },
  "enterprise75": {
    id: "enterprise75",
    name: "Business Pro (75 Candidats)",
    category: "entreprise",
    amount: 45000,
    formattedAmount: "45 000 FCFA",
    currency: "FCFA",
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=45000",
    badge: "Recommandé RH ★",
    description: "Vivier RH de 75 profils + Facture normalisée OHADA + Support Prioritaire WhatsApp VIP.",
  },
  "enterprise200": {
    id: "enterprise200",
    name: "Entreprise Premium (200 Candidats)",
    category: "entreprise",
    amount: 100000,
    formattedAmount: "100 000 FCFA",
    currency: "FCFA",
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=100000",
    badge: "Volume Élite",
    description: "200 profils candidats à tarif plancher garanti (500 F/profil) + Gestionnaire de compte dédié.",
  },
  "cyber15": {
    id: "cyber15",
    name: "Pack Cyber Café (15 Profils)",
    category: "entreprise",
    amount: 10000,
    formattedAmount: "10 000 FCFA",
    currency: "FCFA",
    paymentUrl: "https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=10000",
    badge: "Cyber",
    description: "15 profils pour cybercafés et centres de saisie.",
  },

  // Plan gratuit
  "free": null,
};

/**
 * Récupère l'URL de paiement Wave directe pour une formule donnée.
 * @param planId Identifiant de formule (ex: "1500", "2500", "5000")
 * @returns L'URL Wave sécurisée, ou null si non éligible
 */
export function getWavePaymentUrl(planId: PlanTier | string): string | null {
  const plan = WAVE_PAYMENT_CONFIG[planId as PlanTier];
  return plan ? plan.paymentUrl : null;
}

/**
 * Récupère la configuration complète d'un plan Wave
 */
export function getWavePlanConfig(planId: PlanTier | string): WavePaymentPlan | null {
  return WAVE_PAYMENT_CONFIG[planId as PlanTier] || null;
}

/**
 * Vérifie si une formule dispose d'un lien de paiement Wave officiel
 */
export function hasWavePayment(planId: PlanTier | string): boolean {
  return Boolean(getWavePaymentUrl(planId));
}
