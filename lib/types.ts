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
}

export type PlanTier = "free" | "1500" | "2500" | "5000" | "cyber15" | "enterprise30" | "enterprise75" | "enterprise200";

export interface UserSubscriptionInfo {
  planTier: PlanTier;
  amount: number;
  currency: string;
  paymentMethod: string;
  phoneNumber?: string;
  transactionRef: string;
  subscribedAt: string;
  expiresAt: string | null; // null = à vie
  accountType: AccountType;
  allowedCandidates: number;
  companyName?: string;
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
  category: "subscriptions" | "resumes" | "quotas" | "cloud" | "ai" | "storage";
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
}

export interface SystemHealthStatus {
  serverStatus: "operational" | "degraded" | "down";
  cloudDbStatus: "connected" | "disconnected" | "fallback";
  storageStatus: "healthy" | "warning" | "full";
  storageUsedKb: number;
  maintenanceMode: boolean;
  lastCheckedAt: string;
}
