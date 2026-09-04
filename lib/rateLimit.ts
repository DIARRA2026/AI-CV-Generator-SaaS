/**
 * MONCV.AI - MODULE DE RATE LIMITING AVANCÉ (MAXIMUM 4 TENTATIVES)
 * Développé par INNOVA GROUP
 * 
 * Protection stricte contre les attaques par force brute (Brute Force Protection)
 * Conforme aux recommandations OWASP & RGPD.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
  blockedUntil: number | null;
}

// Magasin en mémoire pour les requêtes Next.js
const rateLimitStore = new Map<string, RateLimitRecord>();

// Configuration stricte par défaut
export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 4, // 4 tentatives maximum comme exigé par la politique de sécurité
  WINDOW_MS: 15 * 60 * 1000, // Fenêtre de 15 minutes
  BLOCK_DURATION_MS: 15 * 60 * 1000, // Blocage de 15 minutes dès le dépassement
};

export interface RateLimitResult {
  allowed: boolean;
  attempts: number;
  maxAttempts: number;
  remaining: number;
  resetInSeconds: number;
  errorMessage?: string;
}

/**
 * Vérifie et incrémente le compteur de tentatives pour une clé donnée (IP ou Email)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = RATE_LIMIT_CONFIG.MAX_ATTEMPTS,
  windowMs: number = RATE_LIMIT_CONFIG.WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // 1. Première tentative
  if (!record) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttemptTime: now,
      lastAttemptTime: now,
      blockedUntil: null,
    });

    return {
      allowed: true,
      attempts: 1,
      maxAttempts,
      remaining: maxAttempts - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // 2. Si actuellement bloqué
  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      allowed: false,
      attempts: record.attempts,
      maxAttempts,
      remaining: 0,
      resetInSeconds: remainingSeconds,
      errorMessage: `Trop de tentatives (maximum ${maxAttempts}). Accès temporairement bloqué par mesure de sécurité. Réessayez dans ${Math.ceil(remainingSeconds / 60)} minute(s).`,
    };
  }

  // 3. Si la fenêtre temporelle est expirée, réinitialiser
  if (now - record.firstAttemptTime > windowMs) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttemptTime: now,
      lastAttemptTime: now,
      blockedUntil: null,
    });

    return {
      allowed: true,
      attempts: 1,
      maxAttempts,
      remaining: maxAttempts - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // 4. Incrémenter la tentative
  record.attempts += 1;
  record.lastAttemptTime = now;

  // 5. Vérifier si le seuil maximum (4) est dépassé
  if (record.attempts > maxAttempts) {
    record.blockedUntil = now + RATE_LIMIT_CONFIG.BLOCK_DURATION_MS;
    const remainingSeconds = Math.ceil(RATE_LIMIT_CONFIG.BLOCK_DURATION_MS / 1000);

    return {
      allowed: false,
      attempts: record.attempts,
      maxAttempts,
      remaining: 0,
      resetInSeconds: remainingSeconds,
      errorMessage: `Trop de tentatives (maximum ${maxAttempts} atteint). Votre accès est temporairement verrouillé pendant 15 minutes.`,
    };
  }

  return {
    allowed: true,
    attempts: record.attempts,
    maxAttempts,
    remaining: maxAttempts - record.attempts,
    resetInSeconds: Math.ceil((record.firstAttemptTime + windowMs - now) / 1000),
  };
}

/**
 * Réinitialise le compteur après un succès (ex: mot de passe valide)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Nettoyage périodique des entrées expirées pour éviter les fuites mémoire
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  rateLimitStore.forEach((record, key) => {
    if (record.blockedUntil && now >= record.blockedUntil) {
      rateLimitStore.delete(key);
    } else if (now - record.firstAttemptTime > RATE_LIMIT_CONFIG.WINDOW_MS && !record.blockedUntil) {
      rateLimitStore.delete(key);
    }
  });
}
