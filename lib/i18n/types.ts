export type SupportedLanguage = "fr" | "en" | "es" | "ar";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export interface TranslationDictionary {
  common: {
    loading: string;
    save: string;
    cancel: string;
    confirm: string;
    close: string;
    back: string;
    next: string;
    edit: string;
    delete: string;
    download: string;
    share: string;
    copy: string;
    copied: string;
    success: string;
    error: string;
    view: string;
    preview: string;
    required: string;
    optional: string;
    all: string;
    active: string;
    inactive: string;
    search: string;
    filter: string;
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
    fullName: string;
    password: string;
    free: string;
    recommended: string;
    popular: string;
    vipBadge: string;
    enterpriseBadge: string;
    currency: string;
    perMonth: string;
    oneTime: string;
  };

  nav: {
    atsBadge: string;
    myCvs: string;
    newCv: string;
    portfolioWeb: string;
    vip: string;
    enterprise: string;
    b2b: string;
    loginRegister: string;
    adminConsole: string;
    candidatePool: string;
    backToEnterprise: string;
    backToDashboard: string;
    logout: string;
    settings: string;
    menu: string;
    closeMenu: string;
    switchLanguage: string;
  };

  hero: {
    badge: string;
    titlePart1: string;
    titleHighlight: string;
    titlePart2: string;
    subtitle: string;
    ctaCreateCv: string;
    ctaViewPortfolio: string;
    badgeAts: string;
    badgeAtsDesc: string;
    badgeAi: string;
    badgeAiDesc: string;
    badgeExport: string;
    badgeExportDesc: string;
    badgeMobileMoney: string;
    badgeMobileMoneyDesc: string;
  };

  features: {
    badge: string;
    title: string;
    subtitle: string;
    aiTitle: string;
    aiDesc: string;
    atsTitle: string;
    atsDesc: string;
    portfolioTitle: string;
    portfolioDesc: string;
    mobileMoneyTitle: string;
    mobileMoneyDesc: string;
    exportTitle: string;
    exportDesc: string;
    qrTitle: string;
    qrDesc: string;
  };

  pricing: {
    badge: string;
    title: string;
    subtitle: string;
    candidatesTab: string;
    enterprisesTab: string;
    // Candidats
    candidateFreeTitle: string;
    candidateFreePrice: string;
    candidateFreePeriod: string;
    candidateFreeDesc: string;
    candidateFreeCta: string;
    candidateProTitle: string;
    candidateProPrice: string;
    candidateProPeriod: string;
    candidateProDesc: string;
    candidateProCta: string;
    candidateVipTitle: string;
    candidateVipPrice: string;
    candidateVipPeriod: string;
    candidateVipDesc: string;
    candidateVipCta: string;
    // Entreprises
    enterpriseStarterTitle: string;
    enterpriseStarterPrice: string;
    enterpriseStarterPeriod: string;
    enterpriseStarterRate: string;
    enterpriseStarterDesc: string;
    enterpriseStarterCta: string;
    enterpriseProTitle: string;
    enterpriseProPrice: string;
    enterpriseProPeriod: string;
    enterpriseProRate: string;
    enterpriseProDesc: string;
    enterpriseProCta: string;
    enterprisePremiumTitle: string;
    enterprisePremiumPrice: string;
    enterprisePremiumPeriod: string;
    enterprisePremiumRate: string;
    enterprisePremiumDesc: string;
    enterprisePremiumCta: string;
    recommendedBadge: string;
  };

  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    loginTab: string;
    registerTab: string;
    candidateRole: string;
    candidateRoleDesc: string;
    enterpriseRole: string;
    enterpriseRoleDesc: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    chooseCandidatePlan: string;
    chooseEnterprisePlan: string;
    submitLogin: string;
    submitRegister: string;
    loggingIn: string;
    registering: string;
    noAccount: string;
    hasAccount: string;
    createAccountLink: string;
    loginLink: string;
    forgotPassword: string;
    termsAgreement: string;
    termsLink: string;
    googleAuth: string;
  };

  payment: {
    title: string;
    subtitle: string;
    selectNetwork: string;
    instructionsTitle: string;
    step1: string;
    step2: string;
    step3: string;
    waveDirect: string;
    orangeMoney: string;
    mtnMoney: string;
    moovMoney: string;
    amountToPay: string;
    phoneNumberToTransfer: string;
    copyNumber: string;
    yourSenderPhone: string;
    transactionId: string;
    confirmPayment: string;
    validating: string;
    successMessage: string;
    pendingMessage: string;
  };

  dashboard: {
    welcome: string;
    title: string;
    subtitle: string;
    newCvButton: string;
    statsTotalCvs: string;
    statsViews: string;
    statsDownloads: string;
    statsAtsScore: string;
    myResumesTitle: string;
    noCvsTitle: string;
    noCvsSubtitle: string;
    createFirstCv: string;
    lastUpdated: string;
    editCv: string;
    downloadPdf: string;
    downloadDocx: string;
    shareCv: string;
    duplicateCv: string;
    deleteCv: string;
    confirmDelete: string;
    enterpriseSpace: string;
    candidatePool: string;
  };

  creator: {
    stepperInfo: string;
    stepperExperience: string;
    stepperEducation: string;
    stepperSkills: string;
    stepperLanguages: string;
    stepperProjects: string;
    stepperCertifications: string;
    stepperPreview: string;
    saveProgress: string;
    autoSaved: string;
    generateWithAi: string;
    optimizingWithAi: string;
    atsAudit: string;
    chooseTemplate: string;
    changeColor: string;
    exportPdf: string;
    exportDocx: string;
    viewLivePortfolio: string;
  };

  footer: {
    tagline: string;
    companyName: string;
    rights: string;
    linksTitle: string;
    productTitle: string;
    contactTitle: string;
    legalTitle: string;
    terms: string;
    privacy: string;
    contact: string;
    phoneLabel: string;
    emailLabel: string;
    developedBy: string;
  };
}
