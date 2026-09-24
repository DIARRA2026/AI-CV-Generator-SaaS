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
    waveLink: prixFcfa > 0 ? WAVE_BASE + prixFcfa : null,
    label: nom, code: slug, priceFcfa: prixFcfa,
    validityDays: validiteMois ? validiteMois * 30 : null,
    unitPriceFcfa: prixCreditFcfa, recommended: misEnAvant,
    description: cible, features: avantages,
  };
}

const PACKS_B2C: Record<string, CreditPack> = {
  decouverte: makePack('decouverte', 'Decouverte', 'b2c', 0, 30, null, 1, 1, false,
    'Tout utilisateur qui cree un compte', 0,
    ['30 credits offerts a l inscription', 'Genere 1 CV + 1 lettre + 1 analyse ATS',
     'Creation manuelle illimitee', 'Export PDF et Word sans filigrane', 'Facture normalisee OHADA']),
  essentiel: makePack('essentiel', 'Essentiel', 'b2c', 1500, 120, 12, 1, 2, false,
    'Candidat en recherche active', 12.5,
    ['120 credits valables 12 mois', 'Soit 12 CV complets ou 24 lettres',
     '12,5 F le credit', 'Export PDF et Word sans filigrane', 'Facture normalisee OHADA']),
  evolution: makePack('evolution', 'Evolution', 'b2c', 2500, 250, 12, 1, 3, false,
    'Candidat qui multiplie les candidatures', 10,
    ['250 credits valables 12 mois', 'Soit 25 CV complets ou 50 lettres',
     '10 F le credit (economie 20%)', 'Traductions Anglais incluses',
     'Export PDF et Word sans filigrane', 'Facture normalisee OHADA']),
  carriere: makePack('carriere', 'Carriere', 'b2c', 5000, 600, 12, 1, 4, true,
    'Candidat exigeant, reconversion, international', 8.33,
    ['600 credits valables 12 mois', 'Soit 60 CV complets - photo IA incluse',
     '8,33 F le credit - meilleur rapport B2C', 'Photo de profil IA',
     'Traductions Anglais illimitees', 'Export PDF et Word sans filigrane', 'Facture normalisee OHADA']),
};

const PACKS_B2B: Record<string, CreditPack> = {
  revendeur: makePack('revendeur', 'Revendeur', 'b2b', 10000, 1500, 12, 1, 5, false,
    'Agence RH, cabinet, point de vente', 6.67,
    ['1 500 credits valables 12 mois', 'Soit 150 profils complets',
     '6,67 F le credit', 'Compte structure avec nom de l agence',
     'Recharge en un clic', 'Facture normalisee OHADA']),
  structure: makePack('structure', 'Structure', 'b2b', 25000, 5000, 12, 3, 6, false,
    'PME, ONG, structure educative', 5,
    ['Tout Revendeur +', '5 000 credits valables 12 mois', '5,00 F le credit',
     '3 utilisateurs simultanes', 'Logo et couleurs de la structure',
     'Export groupe CSV', 'Facture normalisee OHADA']),
  business_pro: makePack('business_pro', 'Business Pro', 'b2b', 60000, 15000, 12, 10, 7, true,
    'Entreprise RH, cabinet conseil, ecole', 4,
    ['Tout Structure +', '15 000 credits valables 12 mois', '4,00 F le credit',
     '10 utilisateurs simultanes', 'Tableau de bord analytics',
     'Import en lot (CSV)', 'Support WhatsApp prioritaire', 'Facture normalisee OHADA']),
  licence_etablissement: makePack('licence_etablissement', 'Licence Etablissement', 'b2b', 150000, 50000, 12, null, 8, false,
    'Grande ecole, universite', 3,
    ['Tout Business Pro +', '50 000 credits valables 12 mois', '3,00 F le credit',
     'Utilisateurs illimites', 'Espaces par promotion', 'Gestionnaire de compte dedie',
     'Devis sur bon de commande', 'Facture normalisee OHADA']),
};

export const ALL_PACKS: Record<string, CreditPack> = {
  ...PACKS_B2C, ...PACKS_B2B,
};

export const PACKS_B2C_ARRAY: CreditPack[] = Object.values(PACKS_B2C).sort((a, b) => a.ordre - b.ordre);
export const PACKS_B2B_ARRAY: CreditPack[] = Object.values(PACKS_B2B).sort((a, b) => a.ordre - b.ordre);
export const ALL_PACKS_ARRAY: CreditPack[] = [...PACKS_B2C_ARRAY, ...PACKS_B2B_ARRAY];

export function getCreditPack(slug: string): CreditPack | null {
  return ALL_PACKS[slug as PackSlug] ?? null;
}
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
