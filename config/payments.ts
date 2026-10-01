/**
 * MONCV.AI - CONFIGURATION DU SYSTEME DE CREDITS PREPAYÉS B2C & B2B
 * Marchand Wave : MonCV.ai / INNOVA GROUP - M_iWih2Nsg7dr8
 * REGLE : Le serveur lit TOUJOURS les couts depuis action_costs en DB.
 * INVARIANT : prix_credit(B2B) < prix_credit(meilleur B2C)
 * B2C plancher : 8.33 F/credit (Carriere 5000/600)
 * B2B plafond  : 6.67 F/credit (Revendeur 10000/1500)
 */

export type PackSlug =
  | 'decouverte' | 'essentiel' | 'evolution' | 'carriere'
  | 'revendeur' | 'structure' | 'business_pro' | 'licence_etablissement';

export type PackSegment = 'b2c' | 'b2b';

export interface CreditPack {
  slug: PackSlug;
  nom: string;
  segment: PackSegment;
  prixFcfa: number;
  credits: number;
  validiteMois: number | null;
  sieges: number | null;
  ordre: number;
  actif: boolean;
  misEnAvant: boolean;
  cible: string;
  prixCreditFcfa: number;
  waveLink: string | null;
  avantages: string[];
  label: string;
  code: string;
  priceFcfa: number;
  validityDays: number | null;
  unitPriceFcfa: number;
  recommended: boolean;
  description: string;
  features: string[];
}

export type CreditActionKey =
  | 'cv_complet' | 'lettre_motivation' | 'analyse_ats'
  | 'traduction_anglais' | 'photo_ia' | 'export_pdf' | 'export_docx';

export const CREDIT_ACTIONS_COST = {
  cv_complet:          10,
  lettre_motivation:    5,
  analyse_ats:          5,
  traduction_anglais:   8,
  photo_ia:            25,
  export_pdf:           0,
  export_docx:          0,
  cv_generate:         10,
  cv_rewrite:          10,
  cover_letter:         5,
  ats_adaptation:       5,
  ats_analysis:         5,
  english_version:      8,
  translate_en:         8,
  pro_photo:           25,
  manual_creation:      0,
  manual_edit:          0,
  preview:              0,
} as const;

export type CreditActionKeyCompat = keyof typeof CREDIT_ACTIONS_COST;

export function getActionCost(action: string): number {
  return (CREDIT_ACTIONS_COST as Record<string, number>)[action] ?? 0;
}

const WAVE_BASE = 'https://pay.wave.com/m/M_iWih2Nsg7dr8/c/ci/?amount=';

function makePack(
  slug: PackSlug, nom: string, segment: PackSegment, prixFcfa: number,
  credits: number, validiteMois: number | null, sieges: number | null,
  ordre: number, misEnAvant: boolean, cible: string, prixCreditFcfa: number,
  avantages: string[]
): CreditPack {
  return {
    slug, nom, segment, prixFcfa, credits, validiteMois, sieges, ordre,
    actif: true, misEnAvant, cible, prixCreditFcfa, avantages,
    waveLink: null, // Décision 1 : Retrait des liens statiques non vérifiables
    label: nom, code: slug, priceFcfa: prixFcfa,
    validityDays: 30, // 30 jours par formule mensuelle
    unitPriceFcfa: prixCreditFcfa, recommended: misEnAvant,
    description: cible, features: avantages,
  };
}

const PACKS_B2C: Record<string, CreditPack> = {
  decouverte: makePack('decouverte', 'Découverte', 'b2c', 0, 30, null, 1, 1, false,
    'Tout utilisateur qui crée un compte', 0,
    ['30 crédits offerts à l inscription', 'Génère 1 CV + 1 lettre + 1 analyse ATS',
     'Création manuelle illimitée', 'Export PDF et Word sans filigrane', 'Facture normalisée OHADA']),
  essentiel: makePack('essentiel', 'Essentiel', 'b2c', 1500, 120, 1, 1, 2, false,
    'Candidat en recherche active', 12.5,
    ['120 crédits valables 30 jours', 'Soit 12 CV complets ou 24 lettres de motivation',
     '12,5 F le crédit', 'Export PDF et Word sans filigrane', 'Facture normalisée OHADA']),
  pro: makePack('evolution', 'Pro', 'b2c', 2500, 250, 1, 1, 3, false,
    'Candidat qui multiplie les candidatures', 10,
    ['250 crédits valables 30 jours', 'Soit 25 CV complets ou 50 lettres de motivation',
     '10 F le crédit (économie 20%)', 'Traductions Anglais incluses',
     'Export PDF et Word sans filigrane', 'Facture normalisée OHADA']),
  vip: makePack('carriere', 'VIP & Portfolio', 'b2c', 5000, 600, 1, 1, 4, true,
    'Candidat exigeant, reconversion, international', 8.33,
    ['600 crédits valables 30 jours', 'Soit 60 CV complets — photo IA incluse',
     '8,33 F le crédit — meilleur rapport B2C', 'Portfolio Web professionnel inclus',
     'Traductions Anglais illimitées', 'Export PDF et Word sans filigrane', 'Facture normalisée OHADA']),
};

// Aliases pour compatibilité
(PACKS_B2C as any).evolution = PACKS_B2C.pro;
(PACKS_B2C as any).carriere = PACKS_B2C.vip;

const PACKS_B2B: Record<string, CreditPack> = {
  revendeur: makePack('revendeur', 'Revendeur', 'b2b', 10000, 1500, 12, 1, 5, false,
    'Agence RH, cabinet, point de vente', 6.67,
    ['1 500 crédits valables 12 mois', 'Soit 150 profils complets',
     '6,67 F le crédit', 'Compte structure avec nom de l agence',
     'Recharge en un clic', 'Facture normalisée OHADA']),
  structure: makePack('structure', 'Structure', 'b2b', 25000, 5000, 12, 3, 6, false,
    'PME, ONG, structure éducative', 5,
    ['Tout Revendeur +', '5 000 crédits valables 12 mois', '5,00 F le crédit',
     '3 utilisateurs simultanés', 'Logo et couleurs de la structure',
     'Export groupé CSV', 'Facture normalisée OHADA']),
  business_pro: makePack('business_pro', 'Business Pro', 'b2b', 60000, 15000, 12, 10, 7, true,
    'Entreprise RH, cabinet conseil, école', 4,
    ['Tout Structure +', '15 000 crédits valables 12 mois', '4,00 F le crédit',
     '10 utilisateurs simultanés', 'Tableau de bord analytics',
     'Import en lot (CSV)', 'Support WhatsApp prioritaire', 'Facture normalisée OHADA']),
  licence_etablissement: makePack('licence_etablissement', 'Licence Établissement', 'b2b', 150000, 50000, 12, null, 8, false,
    'Grande école, université', 3,
    ['Tout Business Pro +', '50 000 crédits valables 12 mois', '3,00 F le crédit',
     'Utilisateurs illimités', 'Espaces par promotion', 'Gestionnaire de compte dédié',
     'Devis sur bon de commande', 'Facture normalisée OHADA']),
};

export const ALL_PACKS: Record<string, CreditPack> = {
  ...PACKS_B2C, ...PACKS_B2B,
};

export const PACKS_B2C_ARRAY: CreditPack[] = [
  PACKS_B2C.decouverte,
  PACKS_B2C.essentiel,
  PACKS_B2C.pro,
  PACKS_B2C.vip,
];
export const PACKS_B2B_ARRAY: CreditPack[] = Object.values(PACKS_B2B).sort((a, b) => a.ordre - b.ordre);
export const ALL_PACKS_ARRAY: CreditPack[] = [...PACKS_B2C_ARRAY, ...PACKS_B2B_ARRAY];

const SLUG_ALIASES: Record<string, PackSlug> = {
  free: "decouverte",
  "1500": "essentiel",
  "2500": "evolution",
  "5000": "carriere",
  pro: "evolution",
  vip: "carriere",
  cyber15: "revendeur",
  enterprise30: "structure",
  enterprise75: "business_pro",
  enterprise200: "licence_etablissement",
};

export function getCreditPack(slug: string): CreditPack | null {
  if (!slug) return null;
  const normalized = SLUG_ALIASES[slug.toLowerCase()] || (slug as PackSlug);
  return ALL_PACKS[normalized] ?? null;
}

export function getCreditPackByAmount(amount: number): CreditPack | null {
  if (!amount || amount <= 0) return null;
  const match = ALL_PACKS_ARRAY.find((p) => p.prixFcfa === amount);
  return match ?? null;
}

export const PACK_TO_LEGACY_TIER: Record<string, string> = {
  decouverte: "free",
  essentiel: "1500",
  evolution: "2500",
  carriere: "5000",
  revendeur: "cyber15",
  structure: "enterprise30",
  business_pro: "enterprise75",
  licence_etablissement: "enterprise200",
};

export function getWaveLink(slug: string): string | null {
  return getCreditPack(slug)?.waveLink ?? null;
}
export function getPrixCreditFcfa(slug: string): number {
  const pack = getCreditPack(slug);
  if (!pack || pack.prixFcfa === 0) return 0;
  return Number((pack.prixFcfa / pack.credits).toFixed(2));
}

export type CreditPackCode = PackSlug;
export const CREDIT_PACKS: Record<string, CreditPack> = ALL_PACKS;
export const CREDIT_PACKS_ARRAY = PACKS_B2C_ARRAY;

export function getPaymentPlanConfig(slug: string) {
  const pack = getCreditPack(slug);
  if (!pack) return null;
  return {
    id: pack.slug, name: pack.nom,
    category: (pack.segment === 'b2c' ? 'particulier' : 'entreprise') as 'particulier' | 'entreprise',
    amount: pack.prixFcfa, formattedAmount: pack.prixFcfa.toLocaleString('fr-FR') + ' FCFA',
    currency: 'FCFA' as const, badge: pack.credits + ' Credits',
    description: pack.cible, allowedCandidates: pack.sieges ?? 999, features: pack.avantages,
  };
}
export function getPlanAmount(slug: string): number { return getCreditPack(slug)?.prixFcfa ?? 0; }
export function getWavePaymentUrl(slug: string): string | null { return getWaveLink(slug); }

