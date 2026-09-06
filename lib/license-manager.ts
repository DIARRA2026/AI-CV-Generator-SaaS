import { ResumeData, PlanTier, LicenseAccess } from "./types";

/**
 * Normalise un nom et prénom pour une identification infaillible :
 * - Supprime les accents (ex: "Konaté" -> "konate")
 * - Convertit en minuscules
 * - Remplace les espaces et tirets par des underscores
 * - Élimine les espaces superflus
 */
export function normalizeIdentity(firstName?: string, lastName?: string): string {
  const cleanFirst = (firstName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const cleanLast = (lastName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (!cleanFirst && !cleanLast) return "anonyme";
  return `${cleanFirst}_${cleanLast}`;
}

/**
 * Récupère l'empreinte normalisée de l'identité actuelle du CV
 */
export function getIdentityKey(resume: ResumeData): string {
  return normalizeIdentity(resume.personal?.firstName, resume.personal?.lastName);
}

/**
 * Nombre de profils / identités physiques autorisés selon la formule
 */
export function getAllowedProfilesCount(plan?: PlanTier): number {
  switch (plan) {
    case "1500":
      return 1; // 1 Candidat unique
    case "2500":
      return 2; // Jusqu'à 2 profils (ou 2 déclinaisons complètes)
    case "5000":
      return 4; // 4 Candidats (Pack Famille / Amis / VIP)
    case "cyber15":
      return 15; // 15 Candidats (Pack Distributeur Cybercafé)
    case "enterprise30":
      return 30; // 30 Candidats (Pack Starter PME)
    case "enterprise75":
      return 75; // 75 Candidats (Pack Business Pro)
    case "enterprise200":
      return 200; // 200 Candidats (Pack Entreprise Premium)
    case "free":
    default:
      return 0;
  }
}

/**
 * Vérifie si l'identité actuelle du CV est déverrouillée et en règle
 * pour un téléchargement immédiat et sans filigrane.
 */
export function isIdentityUnlocked(resume: ResumeData): boolean {
  if (!resume.isPremium || !resume.planTier || resume.planTier === "free") {
    return false;
  }

  const currentKey = getIdentityKey(resume);
  const allowedMax = getAllowedProfilesCount(resume.planTier);

  // Rétrocompatibilité : si le CV a été payé avant l'introduction de l'objet license
  if (!resume.license) {
    return true;
  }

  const unlocked = resume.license.unlockedIdentities || [];

  // Si l'identité actuelle figure déjà dans les identités déverrouillées
  if (unlocked.includes(currentKey)) {
    return true;
  }

  // Si le quota de profils de la formule n'est pas encore atteint, on autorise
  if (unlocked.length < allowedMax) {
    return true;
  }

  return false;
}

/**
 * Détermine si le CV peut être téléchargé en PDF et Word sans filigrane
 */
export function canDownloadWithoutWatermark(resume: ResumeData): boolean {
  return isIdentityUnlocked(resume);
}

/**
 * Enregistre ou met à jour la licence après un paiement Mobile Money validé
 */
export function registerPaymentSuccess(
  resume: ResumeData,
  plan: PlanTier,
  transactionRef?: string
): ResumeData {
  const currentKey = getIdentityKey(resume);
  const allowedCount = getAllowedProfilesCount(plan);

  const existingUnlocked = resume.license?.unlockedIdentities || [];
  const updatedUnlocked = Array.from(new Set([...existingUnlocked, currentKey]));

  const license: LicenseAccess = {
    planTier: plan,
    paidAt: new Date().toISOString(),
    transactionRef: transactionRef || `WAVE_${Date.now()}`,
    allowedProfilesCount: Math.max(allowedCount, updatedUnlocked.length),
    unlockedIdentities: updatedUnlocked,
    primaryIdentity: resume.license?.primaryIdentity || currentKey,
  };

  return {
    ...resume,
    isPremium: true,
    planTier: plan,
    license,
  };
}

/**
 * Diagnostic complet de l'identité et des droits du CV
 */
export function getLicenseStatus(resume: ResumeData) {
  const currentKey = getIdentityKey(resume);
  const isUnlocked = isIdentityUnlocked(resume);
  const plan = resume.planTier || "free";
  const allowedSlots = resume.license?.allowedProfilesCount || getAllowedProfilesCount(plan);
  const usedSlots = resume.license?.unlockedIdentities?.length || (resume.isPremium ? 1 : 0);

  const candidateDisplayName = `${resume.personal?.firstName || ""} ${resume.personal?.lastName || ""}`.trim() || "Candidat";
  const primaryDisplayName = resume.license?.primaryIdentity
    ? resume.license.primaryIdentity.replace(/_/g, " ").toUpperCase()
    : candidateDisplayName;

  const isNameChangedFromPrimary =
    resume.license?.primaryIdentity &&
    resume.license.primaryIdentity !== currentKey &&
    !resume.license.unlockedIdentities?.includes(currentKey);

  return {
    isUnlocked,
    isPremium: !!resume.isPremium && plan !== "free",
    planTier: plan,
    currentKey,
    candidateDisplayName,
    primaryDisplayName,
    usedSlots,
    allowedSlots,
    availableSlots: Math.max(0, allowedSlots - usedSlots),
    isNameChangedFromPrimary: !!isNameChangedFromPrimary,
  };
}
