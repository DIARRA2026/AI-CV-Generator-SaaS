/**
-- =========================================================================
-- TYPES TYPESCRIPT : SYSTÈME DE MONNAIE VIRTUELLE INTERNE "AI COINS"
-- MonCV.ai — Portefeuille Virtuel, Ledger & Réservations Atomiques
-- =========================================================================
*/

export type CreditTransactionType =
  | "purchase"
  | "subscription"
  | "bonus"
  | "signup_bonus"
  | "referral_bonus"
  | "promotion"
  | "usage"
  | "refund"
  | "admin_adjustment"
  | "expiration"
  | "migration";

export interface CreditWallet {
  id: string;
  userId: string;
  availableCredits: number;
  reservedCredits: number;
  lifetimeEarned: number;
  lifetimePurchased: number;
  lifetimeConsumed: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  walletId: string;
  type: CreditTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference: string;
  operationId?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type CreditReservationStatus =
  | "pending"
  | "reserved"
  | "processing"
  | "completed"
  | "released"
  | "expired";

export interface CreditReservation {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  operationId: string;
  operationType: string;
  status: CreditReservationStatus;
  expiresAt: string;
  createdAt: string;
  reservedAt: string;
  completedAt?: string | null;
  releasedAt?: string | null;
  metadata?: Record<string, any>;
}

export interface CreditPackage {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  credits: number;
  price: number;
  currency: string;
  bonusCredits: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCost {
  id: string;
  featureKey: string;
  name: string;
  cost: number;
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIUsageLog {
  id: string;
  userId: string;
  operationId: string;
  feature: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedProviderCost: number;
  creditsUsed: number;
  createdAt: string;
}

export interface WalletSummary {
  id?: string;
  userId: string;
  availableCredits: number;
  reservedCredits: number;
  lifetimeEarned: number;
  lifetimePurchased: number;
  lifetimeConsumed: number;
  totalBalance: number;
  updatedAt?: string;
}

export interface ReserveCreditsResult {
  ok: boolean;
  reservationId?: string;
  operationId?: string;
  amount?: number;
  availableCredits?: number;
  reservedCredits?: number;
  expiresAt?: string;
  error?: string;
  message?: string;
  missingCredits?: number;
  requiredCredits?: number;
  idempotent?: boolean;
}

export interface CompleteReservationResult {
  ok: boolean;
  operationId?: string;
  consumedCredits?: number;
  availableCredits?: number;
  reservedCredits?: number;
  transactionId?: string;
  error?: string;
  message?: string;
  idempotent?: boolean;
}

export interface ReleaseReservationResult {
  ok: boolean;
  operationId?: string;
  releasedCredits?: number;
  availableCredits?: number;
  reservedCredits?: number;
  reason?: string;
  error?: string;
  message?: string;
  idempotent?: boolean;
}

export interface PurchaseCreditsResult {
  ok: boolean;
  creditsAdded?: number;
  bonusAdded?: number;
  totalAdded?: number;
  availableCredits?: number;
  reservedCredits?: number;
  transactionId?: string;
  bonusTransactionId?: string;
  error?: string;
  message?: string;
  idempotent?: boolean;
}

export interface SignupBonusResult {
  ok: boolean;
  granted?: number;
  availableCredits?: number;
  transactionId?: string;
  alreadyGranted?: boolean;
  error?: string;
  message?: string;
}

export interface AdminAdjustmentResult {
  ok: boolean;
  adjustment?: number;
  availableCredits?: number;
  transactionId?: string;
  reference?: string;
  error?: string;
  message?: string;
}
