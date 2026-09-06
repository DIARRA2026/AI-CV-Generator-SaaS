const fs = require('fs');
const path = require('path');

const dashboardContent = `"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResumeData, PlanTier } from "@/lib/types";
import { StorageManager, UserSession } from "@/lib/storage";
import { SupabaseService } from "@/lib/supabaseService";
import { Navbar } from "@/components/Navbar";
import { ShareModal } from "@/components/tools/ShareModal";
import { MobileMoneyModal } from "@/components/tools/MobileMoneyModal";
import { AuthModal } from "@/components/tools/AuthModal";
import { CoverLetterModal } from "@/components/tools/CoverLetterModal";
import { JobApplicationModal } from "@/components/tools/JobApplicationModal";
import { AccountSettingsModal } from "@/components/tools/AccountSettingsModal";
import { InvoiceModal } from "@/components/tools/InvoiceModal";
import { exportResumeToDocx } from "@/lib/docx-export";
import { isEnterpriseFormulaActive } from "@/lib/license-manager";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  Plus,
  Edit3,
  Trash2,
  Copy,
  Share2,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  LogIn,
  User,
  ShieldCheck,
  Settings,
  Building,
  Building2,
  Users,
  Search,
  MessageCircle,
  Loader2,
  Check,
  RefreshCw,
  Globe,
  ExternalLink,
  Crown,
  Briefcase,
  Wand2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { dict, t, isRTL, language } = useTranslation();
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [selectedForShare, setSelectedForShare] = useState<ResumeData | null>(null);
  const [selectedForCoverLetter, setSelectedForCoverLetter] = useState<ResumeData | null>(null);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [selectedForJobApp, setSelectedForJobApp] = useState<ResumeData | null>(null);
  const [isJobAppOpen, setIsJobAppOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [paymentDefaultPlan, setPaymentDefaultPlan] = useState<PlanTier>("2500");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [activeTab, setActiveTab] = useState<"business" | "candidate">("candidate");
  const [candidateSearchQuery, setCandidateSearchQuery] = useState("");
  const [isExportingDocxId, setIsExportingDocxId] = useState<string | null>(null);
  const [exportSuccessId, setExportSuccessId] = useState<string | null>(null);
  const [businessQuota, setBusinessQuota] = useState<{
    allowedCount: number;
    usedCount: number;
    remainingCount: number;
    usagePercent: number;
    isExhausted: boolean;
    distinctIdentities: string[];
    planTier: PlanTier;
  } | null>(null);

  useEffect(() => {
    const syncState = () => {
      const logged = StorageManager.isLoggedIn();
      const user = StorageManager.getUser();
      const isBiz = StorageManager.isBusinessAccount();
      const quota = StorageManager.getBusinessQuotaInfo();

      setIsLoggedIn(logged);
      setCurrentUser(user);
      setIsBusinessAccount(isBiz);
      setBusinessQuota(quota);
      setResumes(StorageManager.getResumes());
      setIsInitialized(true);

      if (isBiz) {
        setActiveTab("business");
      }

      if (user?.email) {
        SupabaseService.getResumes(user.email)
          .then((cloudList) => {
            if (cloudList && cloudList.length > 0) {
              setResumes(cloudList);
              setBusinessQuota(StorageManager.getBusinessQuotaInfo());
            }
          })
          .catch(() => {});
      }

      if (!logged) {
        setIsAuthOpen(true);
      } else {
        setIsAuthOpen(false);
      }

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("new") === "true" || params.get("create") === "true") {
          setIsCreatingModal(true);
        }
        if (params.get("tab") === "business") {
          setActiveTab("business");
        } else if (params.get("tab") === "candidate") {
          setActiveTab("candidate");
        }
      }
    };

    syncState();
    window.addEventListener("storage", syncState);
    return () => window.removeEventListener("storage", syncState);
  }, []);

  const filteredResumes = useMemo(() => {
    if (!candidateSearchQuery.trim()) return resumes;
    const q = candidateSearchQuery.toLowerCase();
    return resumes.filter((r) => {
      const name = \`\${r.personal?.firstName || ""} \${r.personal?.lastName || ""}\`.toLowerCase();
      const title = (r.personal?.title || "").toLowerCase();
      const email = (r.personal?.email || "").toLowerCase();
      const city = (r.personal?.city || "").toLowerCase();
      const template = (r.design?.template || "").toLowerCase();
      return (
        name.includes(q) ||
        title.includes(q) ||
        email.includes(q) ||
        city.includes(q) ||
        template.includes(q)
      );
    });
  }, [resumes, candidateSearchQuery]);

  const handleOpenCoverLetter = (cv?: ResumeData) => {
    const targetCv = cv || resumes[0] || StorageManager.getActiveResume();
    const isOffered = isBusinessAccount || StorageManager.isPersonalOffersOffered() || isEnterpriseFormulaActive(targetCv);
    const tier = isOffered ? "5000" : (targetCv?.planTier || (targetCv?.isPremium ? "2500" : "free"));

    if (!isOffered && (tier === "free" || tier === "1500")) {
      if (targetCv) StorageManager.saveActiveResume(targetCv);
      setPaymentDefaultPlan("2500");
      setIsPaymentOpen(true);
      return;
    }

    if (targetCv) setSelectedForCoverLetter(targetCv);
    setIsCoverLetterOpen(true);
  };

  const handleOpenJobApplication = (cv?: ResumeData) => {
    const targetCv = cv || resumes[0] || StorageManager.getActiveResume();
    const isOffered = isBusinessAccount || StorageManager.isPersonalOffersOffered() || isEnterpriseFormulaActive(targetCv);
    const tier = isOffered ? "5000" : (targetCv?.planTier || (targetCv?.isPremium ? "2500" : "free"));

    if (!isOffered && (tier === "free" || tier === "1500")) {
      if (targetCv) StorageManager.saveActiveResume(targetCv);
      setPaymentDefaultPlan("2500");
      setIsPaymentOpen(true);
      return;
    }

    if (targetCv) setSelectedForJobApp(targetCv);
    setIsJobAppOpen(true);
  };

  const handleExportDocx = async (cv: ResumeData) => {
    try {
      setIsExportingDocxId(cv.id);
      const success = await exportResumeToDocx(cv);
      setIsExportingDocxId(null);
      if (success) {
        setExportSuccessId(cv.id);
        setTimeout(() => setExportSuccessId(null), 3000);
      } else {
        alert("Une erreur est survenue lors de l'export Word. Veuillez réessayer.");
      }
    } catch {
      setIsExportingDocxId(null);
      alert("Erreur technique lors de la génération du fichier Word.");
    }
  };

  const handleOpenResume = (resume: ResumeData) => {
    StorageManager.saveActiveResume(resume);
    router.push("/create");
  };

  const handleStartNewCvDirect = (customTitle?: string) => {
    if (isBusinessAccount && businessQuota && businessQuota.allowedCount > 0) {
      if (businessQuota.isExhausted) {
        alert(
          \`Votre quota entreprise de \${businessQuota.allowedCount} profils est entièrement utilisé.\\n\\nVeuillez recharger vos crédits candidats pour ajouter un nouveau profil au vivier.\`
        );
        setPaymentDefaultPlan("enterprise75");
        setIsPaymentOpen(true);
        return;
      }
    }

    const title = customTitle || \`Candidat \${resumes.length + 1}\`;
    const newCv = StorageManager.createNewResume(title);
    StorageManager.saveActiveResume(newCv);
    SupabaseService.syncResumeToCloud(newCv).catch(() => {});
    router.push("/create");
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      handleStartNewCvDirect();
      return;
    }
    handleStartNewCvDirect(newTitle.trim());
    setNewTitle("");
    setIsCreatingModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(dict.dashboard.confirmDelete)) {
      const updated = await SupabaseService.deleteResume(id);
      setResumes(updated);
      setBusinessQuota(StorageManager.getBusinessQuotaInfo());
    }
  };

  const handleDuplicate = async (resume: ResumeData) => {
    const dup = StorageManager.createNewResume(\`\${resume.title} (\${dict.dashboard.duplicateCv})\`, resume);
    await SupabaseService.syncResumeToCloud(dup).catch(() => {});
    setResumes(StorageManager.getResumes());
    setBusinessQuota(StorageManager.getBusinessQuotaInfo());
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white font-sans">
      <Navbar
        onOpenPayment={() => setIsPaymentOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        isEnterprisePage={isBusinessAccount && activeTab === "business"}
      />

      {!isLoggedIn ? (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-blue-600/10 border border-blue-100">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full uppercase tracking-wider">
                {dict.dashboard.candidateSpaceBadge}
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {dict.dashboard.protectedAreaTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {dict.dashboard.protectedAreaSubtitle}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{dict.dashboard.signInPrompt}</span>
              </button>

              <Link
                href="/"
                className="block w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                ← {dict.common.back}
              </Link>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {isBusinessAccount && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-200/80 rounded-2xl border border-slate-300/80 shadow-xs">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("business")}
                  className={\`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer \${
                    activeTab === "business"
                      ? "bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-md shadow-indigo-950/20"
                      : "text-slate-700 hover:bg-slate-300/70"
                  }\`}
                >
                  <Building className="w-4 h-4 text-amber-400" />
                  <span>{dict.dashboard.recruiterTab}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black">
                    {dict.dashboard.candidatePool}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("candidate")}
                  className={\`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer \${
                    activeTab === "candidate"
                      ? "bg-white text-blue-900 shadow-sm border border-slate-200"
                      : "text-slate-700 hover:bg-slate-300/70"
                  }\`}
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <span>{dict.dashboard.personalTab}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold w-full sm:w-auto justify-center sm:justify-end">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Régime Commercial Conforme OHADA</span>
              </div>
            </div>
          )}

          {isBusinessAccount && activeTab === "business" ? (
            <div className="space-y-6 fade-in">
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-xl space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30 shrink-0 border border-indigo-400/30">
                      <Building2 className="w-7 h-7 text-amber-300" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                          {currentUser?.business?.companyType || "Cabinet RH & Recrutement"}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          {currentUser?.business?.rccm ? \`RCCM : \${currentUser.business.rccm}\` : "RCCM Certifié OHADA"}
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {currentUser?.business?.companyName || "Mon Entreprise"}
                      </h1>
                      <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2 pt-0.5">
                        <span>Responsable Vivier : <strong className="text-white">{currentUser?.firstName} {currentUser?.lastName}</strong> ({currentUser?.business?.managerRole || "Directeur des Ressources Humaines"})</span>
                        <span className="text-slate-500">•</span>
                        <span>Email pro : <strong className="text-white">{currentUser?.email}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsInvoiceOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md shadow-xs"
                    >
                      <FileText className="w-4 h-4 text-amber-300" />
                      <span>{dict.dashboard.invoiceOhadaBtn}</span>
                    </button>

                    <a
                      href="https://wa.me/2250700510524?text=Bonjour%20INNOVA%20GROUP,%20je%20suis%20client%20Entreprise%20sur%20MonCV.ai%20et%20j'ai%20besoin%20d'assistance%20prioritaire."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{dict.dashboard.supportVipBtn}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          Formule Active :
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-extrabold">
                          {currentUser?.planTier === "enterprise200"
                            ? dict.pricing.enterprisePremiumTitle
                            : currentUser?.planTier === "enterprise75"
                            ? dict.pricing.enterpriseProTitle
                            : currentUser?.planTier === "enterprise30"
                            ? dict.pricing.enterpriseStarterTitle
                            : "Formule Entreprise"}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-300">
                        {businessQuota?.allowedCount ? (
                          <>
                            <strong>{businessQuota.usedCount} {dict.dashboard.quotaUsed}</strong> sur un quota de <strong>{businessQuota.allowedCount} candidats débloqués</strong> ({businessQuota.remainingCount} {dict.dashboard.quotaRemaining}).
                          </>
                        ) : (
                          "Activez un pack entreprise pour débloquer votre vivier de candidats."
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentDefaultPlan("enterprise75");
                          setIsPaymentOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{dict.dashboard.reloadCreditsBtn}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full h-3 rounded-full bg-slate-800/90 overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className={\`h-full rounded-full transition-all duration-500 \${
                          (businessQuota?.usagePercent || 0) >= 90
                            ? "bg-rose-500"
                            : (businessQuota?.usagePercent || 0) >= 70
                            ? "bg-amber-500"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }\`}
                        style={{ width: \`\${Math.min(100, Math.max(4, businessQuota?.usagePercent || 0))}%\` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                      <span>{dict.dashboard.quotaConsumption} <strong>{businessQuota?.usagePercent || 0}%</strong></span>
                      <span>{dict.dashboard.unlimitedCreditsNote}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p>{dict.dashboard.antiWasteRule}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {dict.dashboard.candidatePool} ({resumes.length})
                      </h2>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                        {businessQuota?.usedCount || 0} Débloqués
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gérez vos postulants, personnalisez leurs dossiers et téléchargez leurs CVs aux formats Word et PDF A4.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreatingModal(true)}
                    className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-md shadow-blue-600/25 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{dict.dashboard.addCandidateBtn}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={candidateSearchQuery}
                      onChange={(e) => setCandidateSearchQuery(e.target.value)}
                      placeholder={dict.dashboard.searchCandidatePlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    {candidateSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCandidateSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        {dict.dashboard.searchReset}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium w-full sm:w-auto justify-between sm:justify-start">
                    <span>
                      {dict.dashboard.displayCount} <strong>{filteredResumes.length}</strong> / {resumes.length}
                    </span>
                  </div>
                </div>

                {resumes.length === 0 ? (
                  <div className="py-16 text-center space-y-4 border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50/50">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100">
                      <Users className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h3 className="text-lg font-black text-slate-900">
                        {dict.dashboard.noCvsTitle}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {dict.dashboard.noCvsSubtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingModal(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{dict.dashboard.createFirstCv}</span>
                    </button>
                  </div>
                ) : filteredResumes.length === 0 ? (
                  <div className="py-12 text-center space-y-2 border border-slate-200 rounded-2xl bg-slate-50">
                    <p className="text-sm font-bold text-slate-700">
                      Aucun candidat ne correspond à "{candidateSearchQuery}"
                    </p>
                    <button
                      type="button"
                      onClick={() => setCandidateSearchQuery("")}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {dict.dashboard.searchReset}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredResumes.map((cv) => {
                      const fullName = \`\${cv.personal?.firstName || ""} \${cv.personal?.lastName || ""}\`.trim() || cv.title;
                      const initials = \`\${(cv.personal?.firstName?.[0] || cv.title?.[0] || "C").toUpperCase()}\${(cv.personal?.lastName?.[0] || "").toUpperCase()}\`;
                      const isUnlockingDocx = isExportingDocxId === cv.id;
                      const hasDocxExported = exportSuccessId === cv.id;

                      return (
                        <div
                          key={cv.id}
                          className="bg-white rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 group relative"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                                  {initials}
                                </div>
                                <div className="overflow-hidden">
                                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate" title={fullName}>
                                    {fullName}
                                  </h3>
                                  <p className="text-xs text-slate-500 truncate" title={cv.personal?.title || "Titre professionnel"}>
                                    {cv.personal?.title || "Titre professionnel"}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md shrink-0">
                                {cv.design.template}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ATS 98% Conforme
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10.5px] font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-blue-600" />
                                Profil Débloqué
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {dict.dashboard.lastUpdated} {new Date(cv.updatedAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>

                            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl mb-4 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-indigo-600" />
                                  {dict.dashboard.portfolioBadge}
                                </span>
                                <a
                                  href={\`/c/\${cv.slug}?from=enterprise\`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 text-[10.5px]"
                                >
                                  <span>{dict.common.view}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono truncate">
                                moncv.ai/c/{cv.slug}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleOpenResume(cv)}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{dict.dashboard.editCv}</span>
                            </button>

                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenJobApplication(cv)}
                                className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              >
                                <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">{dict.creator.jobAppBtn}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenCoverLetter(cv)}
                                className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              >
                                <Wand2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="truncate">{dict.creator.coverLetterBtn}</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleExportDocx(cv)}
                                disabled={isUnlockingDocx}
                                className={\`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer \${
                                  hasDocxExported
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                }\`}
                              >
                                {isUnlockingDocx ? (
                                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                ) : hasDocxExported ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                )}
                                <span className="truncate">
                                  {hasDocxExported ? "Téléchargé !" : dict.dashboard.downloadDocx}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicate(cv)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                                title={dict.dashboard.duplicateCv}
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(cv.id)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-100 cursor-pointer"
                                title={dict.dashboard.deleteCv}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 fade-in">
              {isBusinessAccount && (
                <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-indigo-900/60 shadow-md flex flex-wrap items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-2.5 text-xs">
                    <Building className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Vous êtes en vue <strong>CV Personnel</strong>. Votre compte dispose d'un accès Vivier RH Entreprise actif.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("business")}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Building className="w-4 h-4 text-slate-950" />
                    <span>{dict.nav.backToEnterprise}</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {currentUser?.firstName || currentUser?.email?.split("@")[0] || "Mon Espace"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {resumes.length} {resumes.length > 1 ? "CVs enregistrés" : "CV enregistré"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">•</span>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{dict.nav.settings}</span>
                    </button>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {dict.dashboard.myResumesTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {dict.dashboard.subtitle}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenJobApplication()}
                      className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-[0.98]"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{dict.creator.jobAppBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCoverLetter()}
                      className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-[0.98]"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{dict.creator.coverLetterBtn}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreatingModal(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-md shadow-blue-600/20 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>{dict.dashboard.newCvButton}</span>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-purple-800/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-base text-white">{dict.nav.portfolioWeb}</h2>
                      <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9.5px] font-black uppercase">
                        {dict.common.vipBadge}
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/90 mt-0.5 max-w-xl">
                      Transformez vos expériences en un véritable site web interactif de prestige.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    href="/portfolio"
                    target="_blank"
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{dict.dashboard.portfolioDemoBtn}</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">{resumes.length}</div>
                    <div className="text-[11px] font-medium text-slate-500">{dict.dashboard.statsTotalCvs}</div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">
                      {currentUser?.planTier === "5000"
                        ? dict.pricing.candidateVipTitle
                        : currentUser?.planTier === "2500"
                        ? dict.pricing.candidateProTitle
                        : currentUser?.planTier === "1500"
                        ? dict.pricing.candidateEssentialTitle
                        : currentUser?.planTier?.startsWith("enterprise")
                        ? "Entreprise"
                        : dict.pricing.candidateFreeTitle}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">{dict.dashboard.statsAtsScore}</div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">{dict.creator.jobAppBtn}</div>
                    <div className="text-[11px] font-medium text-slate-500">Word & PDF</div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">{dict.creator.coverLetterBtn}</div>
                    <div className="text-[11px] font-medium text-slate-500">STAR Method</div>
                  </div>
                </div>
              </div>

              {resumes.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{dict.dashboard.noCvsTitle}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {dict.dashboard.noCvsSubtitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreatingModal(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer"
                  >
                    {dict.dashboard.createFirstCv}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {resumes.map((cv) => (
                    <div
                      key={cv.id}
                      className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col justify-between hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 group relative"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                            {cv.design.template}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
                          {cv.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1 mb-4">
                          {cv.personal.title || "Titre professionnel"}
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {dict.dashboard.lastUpdated} {new Date(cv.updatedAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>

                        <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl mb-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                              <Globe className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>{dict.dashboard.portfolioBadge}</span>
                            </div>
                          </div>

                          <p className="text-[10.5px] text-purple-700 font-mono truncate">
                            moncv.ai/c/{cv.slug}
                          </p>

                          <div className="pt-0.5">
                            <a
                              href={\`/c/\${cv.slug}\`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{dict.common.view}</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenResume(cv)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{dict.dashboard.editCv}</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenJobApplication(cv)}
                            className="py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 shadow-xs"
                          >
                            <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{dict.creator.jobAppBtn}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCoverLetter(cv)}
                            className="py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200 shadow-xs"
                          >
                            <Wand2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{dict.creator.coverLetterBtn}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleExportDocx(cv)}
                            disabled={isExportingDocxId === cv.id}
                            className={\`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer \${
                              exportSuccessId === cv.id
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            }\`}
                          >
                            {isExportingDocxId === cv.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                            ) : exportSuccessId === cv.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                            <span className="truncate">
                              {exportSuccessId === cv.id ? "Téléchargé !" : dict.dashboard.downloadDocx}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedForShare(cv)}
                            className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{dict.dashboard.shareCv}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(cv)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(cv.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <footer className="pt-8 pb-12 border-t border-slate-200 mt-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-slate-900">MonCV<span className="text-blue-600">.ai</span></span>
              <span className="text-slate-400">
                <span className="hidden sm:inline">•</span> {dict.footer.developedBy} <strong className="text-slate-700 font-semibold">{dict.footer.companyName}</strong>
              </span>
            </div>
            <div className="flex items-center justify-center gap-5 font-semibold">
              <Link href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors">
                {dict.footer.terms}
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors">
                {dict.footer.contact}
              </Link>
            </div>
          </footer>
        </main>
      )}

      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">
                {isBusinessAccount ? dict.dashboard.modalTitleCandidate : dict.dashboard.modalTitleNewCv}
              </h3>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {dict.dashboard.modalInputLabel}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={dict.dashboard.modalInputPlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  {dict.dashboard.modalCancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {dict.dashboard.modalCreateBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedForShare && (
        <ShareModal
          isOpen={!!selectedForShare}
          onClose={() => setSelectedForShare(null)}
          resume={selectedForShare}
        />
      )}

      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        resume={selectedForCoverLetter || resumes[0] || StorageManager.getActiveResume()}
      />

      <JobApplicationModal
        isOpen={isJobAppOpen}
        onClose={() => setIsJobAppOpen(false)}
        resume={selectedForJobApp || resumes[0] || StorageManager.getActiveResume()}
      />

      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={() => {
          StorageManager.logout();
          setIsLoggedIn(false);
          setCurrentUser(null);
          setIsAuthOpen(true);
        }}
      />

      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        user={currentUser}
      />

      <MobileMoneyModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => {
          setBusinessQuota(StorageManager.getBusinessQuotaInfo());
          alert("Votre formule a été activée avec succès !");
        }}
        defaultPlan={paymentDefaultPlan}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          if (StorageManager.isLoggedIn()) {
            setIsAuthOpen(false);
          }
        }}
        onSuccess={() => {
          setIsAuthOpen(false);
          setIsLoggedIn(true);
          setCurrentUser(StorageManager.getUser());
          setResumes(StorageManager.getResumes());
        }}
      />
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, '../app/dashboard/page.tsx'), dashboardContent, 'utf-8');
console.log('Successfully generated localized app/dashboard/page.tsx');
