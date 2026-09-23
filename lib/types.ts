export type ProfileType =
  | "student"
  | "professional"
  | "no_exp"
  | "career_change"
  | "international"
  | "specific_job";

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  city: string;
  country?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  rawInput?: string;
  highlights: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  field: string;
  school: string;
  city: string;
  year: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  items: string[];
}

export interface LanguageItem {
  id: string;
  name: string;
  level: "Débutant" | "Intermédiaire" | "Courant" | "Bilingue / Natif";
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link?: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  role: string;
  company: string;
  contact: string;
}

export interface VolunteerItem {
  id: string;
  role: string;
  organization: string;
  period: string;
}

export type TemplateId =
  | "modern"
  | "elegant"
  | "corporate"
  | "minimal"
  | "creative"
  | "ats";

export interface ResumeDesign {
  template: TemplateId;
  primaryColor: string;
  fontFamily: "inter" | "serif" | "mono" | "sans";
  showPhoto: boolean;
  spacing: "compact" | "normal" | "spacious";
}

export type AccountType = "candidate" | "business";

export interface BusinessProfile {
  companyName: string;
  companyType?: string;
  managerRole?: string;
  rccm?: string;
  taxId?: string;
  billingAddress?: string;
  whatsappPhone?: string;
  logoUrl?: string;
}

export type PlanTier = "free" | "1500" | "2500" | "5000" | "cyber15" | "enterprise30" | "enterprise75" | "enterprise200";

export type SubscriptionStatus = "pending" | "active" | "cancelled" | "expired";

export interface UserSubscriptionInfo {
  planTier: PlanTier;
  amount: number;
  currency: string;
  status?: SubscriptionStatus;
  paymentMethod: string;
  provider?: string;
  phoneNumber?: string;
  transactionRef: string;
  externalToken?: string;
  subscribedAt: string;
  expiresAt: string | null; // null = à vie
  accountType: AccountType;
  allowedCandidates: number;
  companyName?: string;
}

export interface SubscriptionRecord {
  id?: string;
  userId?: string;
  userEmail: string;
  planTier: PlanTier;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  paymentMethod: string;
  phoneNumber?: string;
  transactionRef: string;
  externalToken?: string;
  allowedCandidates: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  activatedAt?: string | null;
  expiresAt?: string | null;
}

export interface LicenseAccess {
  planTier: PlanTier;
  paidAt?: string;
  transactionRef?: string;
  allowedProfilesCount: number;
  unlockedIdentities: string[];
  primaryIdentity?: string;
}

export interface ResumeData {
  id: string;
  userId?: string;
  userEmail?: string;
  title: string;
  updatedAt: string;
  targetProfile: ProfileType;
  language: "fr" | "en";
  slug: string;
  isPremium?: boolean;
  planTier?: PlanTier;
  license?: LicenseAccess;
  personal: {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    birthDate?: string;
    birthPlace?: string;
    maritalStatus?: string;
    driverLicense?: string;
    linkedin: string;
    website: string;
    photoUrl: string;
  };
  summary: string;
  experiences: ExperienceItem[];
  educations: EducationItem[];
  skills: SkillCategory[];
  languages: LanguageItem[];
  sections: {
    certifications: CertificationItem[];
    projects: ProjectItem[];
    interests: string[];
    references: ReferenceItem[];
    volunteer: VolunteerItem[];
  };
  design: ResumeDesign;
}

export interface ATSAnalysisResult {
  jobTitle: string;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
  optimizedBulletPoints: {
    experienceId: string;
    before: string;
    after: string;
    reason: string;
  }[];
}

export interface TransactionRecord {
  id: string;
  userId?: string | null;
  userEmail?: string;
  planTier: PlanTier;
  amountXof: number;
  amount?: number;
  currency?: string;
  provider: string;
  paymentMethod?: string;
  phoneNumber?: string;
  referenceCode: string;
  externalToken?: string;
  status: "completed" | "pending" | "failed" | "cancelled";
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

// === ADMINISTRATION & SUPERVISION GLOBALE ===

export type UserRole = "candidate" | "business" | "admin" | "superadmin";

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetUserEmail?: string;
  details?: string;
  severity?: "info" | "warning" | "error" | "success";
}

export interface SystemDiagnosticCheck {
  id: string;
  title: string;
  category: "subscriptions" | "resumes" | "quotas" | "cloud" | "ai" | "storage" | "payments";
  status: "healthy" | "warning" | "critical" | "pending";
  message: string;
  lastRunAt?: string;
  affectedCount?: number;
  autoFixAvailable?: boolean;
  fixActionId?: string;
}

export interface SystemMetricSummary {
  totalUsers: number;
  totalCandidates: number;
  totalBusinesses: number;
  totalAdmins: number;
  totalResumes: number;
  paidUsersCount: number;
  conversionRate: number; // en %
  totalRevenueFcfa: number;
  revenueByPlan: Record<PlanTier, { count: number; revenueFcfa: number }>;
  activeSubscriptionsCount: number;
  averageAtsScore: number;
  totalTransactions?: number;
  completedTransactions?: number;
  pendingTransactions?: number;
  failedTransactions?: number;
  mobileMoneyVolumeFcfa?: number;
}

export interface SystemHealthStatus {
  serverStatus: "operational" | "degraded" | "down";
  cloudDbStatus: "connected" | "disconnected" | "fallback";
  storageStatus: "healthy" | "warning" | "full";
  storageUsedKb: number;
  maintenanceMode: boolean;
  lastCheckedAt: string;
}

// =========================================================================
// SYSTÈME DE CRÉDITS PRÉPAYÉS & PAIEMENT WAVE SANS ABONNEMENT
// =========================================================================

export type CreditPackCode = "decouverte" | "essentiel" | "evolution" | "carriere";

export interface CreditPack {
  code: CreditPackCode;
  label: string;
  priceFcfa: number;
  credits: number;
  validityDays: number | null; // null = permanent
  unitPriceFcfa: number;
  waveLink: string | null;
  active: boolean;
  features?: string[];
  recommended?: boolean;
  badge?: string;
  description?: string;
}

export type CreditSource = "offert" | "achat" | "migration" | "bonus";

export interface CreditBatch {
  id: string;
  userId: string;
  creditsInitial: number;
  creditsRemaining: number;
  source: CreditSource;
  packCode: CreditPackCode | null;
  purchasedAt: string;
  expiresAt: string | null;
  createdAt: string;
}

export type CreditActionType =
  | "welcome_gift"
  | "purchase"
  | "cv_generate"
  | "cv_rewrite"
  | "cover_letter"
  | "ats_adaptation"
  | "english_version"
  | "pro_photo"
  | "refund"
  | "migration";

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  batchId?: string | null;
  action: CreditActionType | string;
  delta: number;
  balanceAfter: number;
  ref?: string | null;
  createdAt: string;
}

export type PaymentClaimStatus = "pending" | "approved" | "rejected";

export interface PaymentClaim {
  id: string;
  userId: string;
  userEmail?: string;
  packCode: CreditPackCode;
  amountFcfa: number;
  waveReference: string;
  screenshotUrl?: string | null;
  status: PaymentClaimStatus;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface UserCreditSummary {
  balance: number;
  nearestExpiry: string | null;
  activeBatchesCount: number;
}

