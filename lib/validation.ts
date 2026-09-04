/**
 * MONCV.AI - MODULE DE VALIDATION & ASSAINISSEMENT SÉCURISÉ CÔTÉ SERVEUR
 * Développé par INNOVA GROUP
 * 
 * Normes de sécurité : OWASP Input Validation & Anti-XSS / Injection
 */

export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: T;
}

/**
 * Nettoyage anti-XSS et suppression des injections HTML/Script
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/\0/g, "") // Supprime les octets nuls
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Supprime les balises scripts
    .replace(/[<>]/g, "") // Échappe les balises chevrons
    .trim();
}

/**
 * Validation stricte d'adresse email conforme RFC 5322
 */
export function validateEmail(email: unknown): { isValid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeString(email).toLowerCase();
  
  if (!sanitized) {
    return { isValid: false, sanitized: "", error: "L'adresse email est requise." };
  }

  if (sanitized.length > 254) {
    return { isValid: false, sanitized, error: "L'adresse email est trop longue (max 254 caractères)." };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, sanitized, error: "Format d'adresse email invalide (ex: nom@domaine.com)." };
  }

  return { isValid: true, sanitized };
}

/**
 * Validation de la robustesse des mots de passe
 */
export function validatePassword(password: unknown): { isValid: boolean; error?: string } {
  if (typeof password !== "string" || !password) {
    return { isValid: false, error: "Le mot de passe est obligatoire." };
  }

  if (password.length < 8) {
    return { isValid: false, error: "Le mot de passe doit comporter au moins 8 caractères." };
  }

  if (password.length > 128) {
    return { isValid: false, error: "Le mot de passe ne peut dépasser 128 caractères." };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit) {
    return { 
      isValid: false, 
      error: "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre." 
    };
  }

  return { isValid: true };
}

/**
 * Validation et nettoyage d'un nom ou prénom
 */
export function validateName(name: unknown, fieldName: string = "Le nom"): { isValid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeString(name);
  if (!sanitized) {
    return { isValid: false, sanitized: "", error: `${fieldName} est requis.` };
  }

  if (sanitized.length < 2) {
    return { isValid: false, sanitized, error: `${fieldName} doit contenir au moins 2 caractères.` };
  }

  if (sanitized.length > 60) {
    return { isValid: false, sanitized, error: `${fieldName} ne peut dépasser 60 caractères.` };
  }

  return { isValid: true, sanitized };
}

/**
 * Validation d'un numéro de téléphone
 */
export function validatePhone(phone: unknown): { isValid: boolean; sanitized: string; error?: string } {
  if (!phone || typeof phone !== "string") {
    return { isValid: true, sanitized: "" }; // Optionnel
  }

  const sanitized = sanitizeString(phone).replace(/[^0-9+ ]/g, "");
  if (sanitized.length > 0 && sanitized.replace(/[^0-9]/g, "").length < 6) {
    return { isValid: false, sanitized, error: "Numéro de téléphone incomplet ou invalide." };
  }

  return { isValid: true, sanitized };
}

/**
 * Validation complète d'un formulaire d'inscription
 */
export function validateRegistrationPayload(payload: any): ValidationResult<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  password: string;
}> {
  const errors: Record<string, string> = {};

  const firstNameVal = validateName(payload?.firstName, "Le prénom");
  if (!firstNameVal.isValid) errors.firstName = firstNameVal.error!;

  const lastNameVal = validateName(payload?.lastName, "Le nom");
  if (!lastNameVal.isValid) errors.lastName = lastNameVal.error!;

  const emailVal = validateEmail(payload?.email);
  if (!emailVal.isValid) errors.email = emailVal.error!;

  const phoneVal = validatePhone(payload?.phone);
  if (!phoneVal.isValid) errors.phone = phoneVal.error!;

  const passwordVal = validatePassword(payload?.password);
  if (!passwordVal.isValid) errors.password = passwordVal.error!;

  const country = sanitizeString(payload?.country) || "Côte d'Ivoire";
  const city = sanitizeString(payload?.city) || "Abidjan";

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: {
      firstName: firstNameVal.sanitized,
      lastName: lastNameVal.sanitized,
      email: emailVal.sanitized,
      phone: phoneVal.sanitized,
      country,
      city,
      password: payload?.password || "",
    },
  };
}

/**
 * Validation de connexion
 */
export function validateLoginPayload(payload: any): ValidationResult<{
  email: string;
  password: string;
}> {
  const errors: Record<string, string> = {};

  const emailVal = validateEmail(payload?.email);
  if (!emailVal.isValid) errors.email = emailVal.error!;

  if (!payload?.password || typeof payload.password !== "string") {
    errors.password = "Le mot de passe est obligatoire.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: {
      email: emailVal.sanitized,
      password: payload?.password || "",
    },
  };
}
