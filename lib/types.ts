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

export type PlanTier = "free" | "1500" | "2500" | "5000";

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
