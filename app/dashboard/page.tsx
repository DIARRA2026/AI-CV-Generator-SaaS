"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResumeData, PlanTier, Invoice } from "@/lib/types";
import { StorageManager, UserSession } from "@/lib/storage";
import { SupabaseService } from "@/lib/supabaseService";
import { InvoiceService } from "@/lib/invoiceService";
import { CreditService } from "@/lib/creditService";
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
import { compressImage } from "@/lib/image-utils";
import confetti from "canvas-confetti";
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
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  Receipt,
  CreditCard,
  TrendingUp,
  BookOpen,
  ChevronRight,
  Award,
  Zap,
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
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);

  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [activeTab, setActiveTab] = useState<"business" | "candidate">("candidate");
  const [candidateSubTab, setCandidateSubTab] = useState<"overview" | "resumes" | "invoices" | "tips">("overview");
  const [userInvoices, setUserInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
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

  const enterpriseLogoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<string | null>(null);

  // 1. Initialisation et paramètres d'URL (exécuté une seule fois au montage)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (params.get("new") === "true" || params.get("create") === "true") {
      setIsCreatingModal(true);
    }
    if (params.get("tab") === "business" || params.get("section") === "candidate-pool" || hash === "#candidate-pool-section") {
      setActiveTab("business");
      if (params.get("section") === "candidate-pool" || hash === "#candidate-pool-section") {
        setTimeout(() => {
          const el = document.getElementById("candidate-pool-section");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            el.classList.add("ring-4", "ring-amber-400/50");
            setTimeout(() => el.classList.remove("ring-4", "ring-amber-400/50"), 1500);
            const searchInput = el.querySelector("input");
            if (searchInput) searchInput.focus();
          }
        }, 300);
      }
    } else if (params.get("tab") === "candidate") {
      setActiveTab("candidate");
    }

    const subtabParam = params.get("subtab") || params.get("view");
    if (subtabParam === "invoices" || subtabParam === "factures" || hash === "#invoices") {
      setCandidateSubTab("invoices");
    } else if (subtabParam === "resumes" || subtabParam === "cvs" || hash === "#resumes") {
      setCandidateSubTab("resumes");
    } else if (subtabParam === "tips" || subtabParam === "conseils" || hash === "#tips") {
      setCandidateSubTab("tips");
    }

    if (params.get("payment") === "success") {
      const packCode = params.get("pack") || "votre formule";
      setPaymentSuccessToast(packCode);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {}
    }
  }, []);


  // Fermeture du modal de création avec la touche Echap
  useEffect(() => {
    if (!isCreatingModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCreatingModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreatingModal]);

  // 2. Synchronisation de l'état local (écoute passive des événements storage locaux, sans boucle réseau)
  useEffect(() => {
    const syncLocalState = () => {
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

      if (isBiz && typeof window !== "undefined" && !window.location.search.includes("tab=candidate")) {
        setActiveTab("business");
      }

      if (!logged) {
        setIsAuthOpen(false);
        router.replace("/login?redirect=/dashboard");
        return;
      } else {
        setIsAuthOpen(false);
      }
    };

    syncLocalState();
    window.addEventListener("storage", syncLocalState);
    return () => window.removeEventListener("storage", syncLocalState);
  }, []);

  // 3. Synchronisation Cloud asynchrone (exécutée une seule fois au montage pour éviter les boucles)
  useEffect(() => {
    let isMounted = true;
    const user = StorageManager.getUser();
    if (!user?.email) return;

    const syncCloud = async () => {
      try {
        const refreshed = await SupabaseService.refreshSessionFromCloud();
        if (!isMounted) return;
        if (refreshed) {
          const u = StorageManager.getUser();
          const b = StorageManager.isBusinessAccount();
          const q = StorageManager.getBusinessQuotaInfo();
          setCurrentUser(u);
          setIsBusinessAccount(b);
          setBusinessQuota(q);
          if (b && typeof window !== "undefined" && !window.location.search.includes("tab=candidate")) {
            setActiveTab("business");
          }
        }
      } catch (e) {
        console.warn("Erreur synchronisation cloud session:", e);
      }

      try {
        const cloudList = await SupabaseService.getResumes(user.email);
        if (!isMounted) return;
        if (cloudList && cloudList.length > 0) {
          setResumes(cloudList);
          setBusinessQuota(StorageManager.getBusinessQuotaInfo());
        }
      } catch (e) {
        console.warn("Erreur synchronisation cloud CVs:", e);
      }
    };

    syncCloud();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigateToVivier = () => {
    setActiveTab("business");
    setTimeout(() => {
      const el = document.getElementById("candidate-pool-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("ring-4", "ring-amber-400/50");
        setTimeout(() => el.classList.remove("ring-4", "ring-amber-400/50"), 1500);
        const searchInput = el.querySelector("input");
        if (searchInput) searchInput.focus();
      }
    }, 100);
  };

  useEffect(() => {
    const handleVivierNavEvent = () => {
      handleNavigateToVivier();
    };
    window.addEventListener("moncv_navigate_to_vivier", handleVivierNavEvent);
    return () => window.removeEventListener("moncv_navigate_to_vivier", handleVivierNavEvent);
  }, []);

  const getPlanDetails = (tier?: string) => {
    switch (tier) {
      case "5000":
        return {
          name: "Pack VIP & Portfolio",
          badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
          credits: 800,
          candidates: 4,
          price: "5 000 FCFA",
          features: ["4 CVs ATS Débloqués", "Portfolio Web VIP", "Word (.docx) & PDF A4", "Support Prioritaire"],
        };
      case "2500":
        return {
          name: "Pack Candidature Pro",
          badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
          credits: 350,
          candidates: 2,
          price: "2 500 FCFA",
          features: ["2 CVs ATS Débloqués", "Portfolio Web Inclus", "Word (.docx) & PDF A4", "Méthode STAR IA"],
        };
      case "1500":
        return {
          name: "Pack Essentiel",
          badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
          credits: 150,
          candidates: 1,
          price: "1 500 FCFA",
          features: ["1 CV ATS Débloqué", "Téléchargement Word & PDF", "Générateur STAR IA", "Accès 12 mois"],
        };
      case "cyber15":
        return {
          name: "Pack Cyber 15",
          badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
          credits: 2500,
          candidates: 15,
          price: "15 000 FCFA",
          features: ["15 Profils RH", "Vivier Entreprise", "Facturation OHADA"],
        };
      case "enterprise30":
        return {
          name: "Pack Starter PME",
          badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
          credits: 5000,
          candidates: 30,
          price: "20 000 FCFA",
          features: ["30 Profils Candidats", "Vivier RH Illimité", "Accès Multi-recruteur"],
        };
      case "enterprise75":
        return {
          name: "Pack Business Pro",
          badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
          credits: 15000,
          candidates: 75,
          price: "45 000 FCFA",
          features: ["75 Profils Candidats", "Vivier RH Illimité", "Facturation Pro OHADA"],
        };
      case "enterprise200":
        return {
          name: "Pack Entreprise Premium",
          badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
          credits: 50000,
          candidates: 200,
          price: "100 000 FCFA",
          features: ["200 Profils Candidats", "Audit RH dédié", "Marque blanche"],
        };
      default:
        return {
          name: "Formule Découverte",
          badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
          credits: 30,
          candidates: 1,
          price: "Gratuit",
          features: ["30 crédits d'essai IA", "Modèles de CV ATS", "Aperçu en ligne direct"],
        };
    }
  };

  const planInfo = useMemo(() => getPlanDetails(currentUser?.planTier), [currentUser?.planTier]);
  const effectiveCredits = creditBalance !== null ? creditBalance : planInfo.credits;

  const displayName = useMemo(() => {
    if (currentUser?.firstName) {
      return `${currentUser.firstName} ${currentUser.lastName || ""}`.trim();
    }
    if (currentUser?.email) {
      return currentUser.email.split("@")[0];
    }
    return "Candidat";
  }, [currentUser]);

  const loadUserInvoicesAndCredits = async (email?: string, userId?: string) => {
    if (!email) return;
    try {
      setIsLoadingInvoices(true);
      const allInvoices = await InvoiceService.getAllInvoices();
      const cleanEmail = email.toLowerCase().trim();
      const filtered = allInvoices.filter((inv) => {
        const cEmail = (inv.clientEmail || "").toLowerCase().trim();
        const compId = (inv.compteId || "").toLowerCase().trim();
        return cEmail === cleanEmail || compId === cleanEmail;
      });
      setUserInvoices(filtered);
    } catch (err) {
      console.warn("Erreur chargement factures:", err);
    } finally {
      setIsLoadingInvoices(false);
    }

    try {
      const targetId = userId || email;
      const solde = await CreditService.getSolde(targetId, "user");
      if (solde && typeof solde.solde === "number" && solde.solde >= 0) {
        setCreditBalance(solde.solde);
      }
    } catch (err) {
      console.warn("Erreur chargement solde crédits:", err);
    }
  };

  useEffect(() => {
    if (currentUser?.email) {
      loadUserInvoicesAndCredits(currentUser.email, currentUser.id);
    }
  }, [currentUser?.email, currentUser?.id, currentUser?.planTier]);

  useEffect(() => {
    const refreshData = () => {
      if (currentUser?.email) {
        loadUserInvoicesAndCredits(currentUser.email, currentUser.id);
      }
    };
    window.addEventListener("moncv_credits_updated", refreshData);
    window.addEventListener("storage", refreshData);
    return () => {
      window.removeEventListener("moncv_credits_updated", refreshData);
      window.removeEventListener("storage", refreshData);
    };
  }, [currentUser]);

  const handleOpenInvoice = (inv?: Invoice) => {
    setSelectedInvoiceForModal(inv || (userInvoices.length > 0 ? userInvoices[0] : null));
    setIsInvoiceOpen(true);
  };

  const filteredResumes = useMemo(() => {
    if (!candidateSearchQuery.trim()) return resumes;
    const q = candidateSearchQuery.toLowerCase();
    return resumes.filter((r) => {
      const name = `${r.personal?.firstName || ""} ${r.personal?.lastName || ""}`.toLowerCase();
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
    if (targetCv) setSelectedForCoverLetter(targetCv);
    setIsCoverLetterOpen(true);
  };

  const handleOpenJobApplication = (cv?: ResumeData) => {
    const targetCv = cv || resumes[0] || StorageManager.getActiveResume();
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

  const handleEnterpriseLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Le fichier sélectionné est trop volumineux. Veuillez choisir une image de moins de 3 Mo.");
      return;
    }

    try {
      setIsUploadingLogo(true);
      setLogoFeedback(null);
      const compressedDataUrl = await compressImage(file, 400, 400);

      const res = StorageManager.updateBusinessProfile({
        logoUrl: compressedDataUrl,
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        SupabaseService.updateBusinessProfile({ logoUrl: compressedDataUrl }).catch(() => {});
        setLogoFeedback(dict.dashboard.logoUpdatedSuccess);
        setTimeout(() => setLogoFeedback(null), 3500);
      }
    } catch (err) {
      console.error("Erreur lors du téléversement du logo:", err);
      alert("Impossible de charger cette image. Veuillez utiliser un format PNG, JPG ou WebP valide.");
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveEnterpriseLogo = () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer le logo de l'entreprise ?")) return;
    const res = StorageManager.updateBusinessProfile({
      logoUrl: "",
    });
    if (res.success && res.user) {
      setCurrentUser(res.user);
      SupabaseService.updateBusinessProfile({ logoUrl: "" }).catch(() => {});
      setLogoFeedback(dict.dashboard.logoRemovedSuccess);
      setTimeout(() => setLogoFeedback(null), 3000);
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
          `Votre quota entreprise de ${businessQuota.allowedCount} profils est entièrement utilisé.\n\nVeuillez recharger vos crédits candidats pour ajouter un nouveau profil au vivier.`
        );
        setPaymentDefaultPlan("enterprise75");
        setIsPaymentOpen(true);
        return;
      }
    }

    const title = customTitle || `Candidat ${resumes.length + 1}`;
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
    const dup = StorageManager.createNewResume(`${resume.title} (${dict.dashboard.duplicateCv})`, resume);
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
        onCandidatePoolClick={handleNavigateToVivier}
        candidateCount={resumes.length}
      />

      {/* Bannière de confirmation de paiement réussi */}
      {paymentSuccessToast && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white px-4 py-3 shadow-md sticky top-16 z-30 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in slide-in-from-top-2 duration-300">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-100" />
              <span>
                <strong className="font-bold">Paiement validé avec succès !</strong> Votre formule <strong className="uppercase">{paymentSuccessToast}</strong> a été rattachée à votre compte et vos crédits sont maintenant disponibles.
              </span>
            </div>
            <button
              onClick={() => setPaymentSuccessToast(null)}
              className="p-1 hover:bg-white/20 rounded-lg text-emerald-100 hover:text-white transition cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                onClick={() => router.push("/login?redirect=/dashboard")}
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
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === "business"
                      ? "bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-md shadow-indigo-950/20"
                      : "text-slate-700 hover:bg-slate-300/70"
                  }`}
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
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === "candidate"
                      ? "bg-white text-blue-900 shadow-sm border border-slate-200"
                      : "text-slate-700 hover:bg-slate-300/70"
                  }`}
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
                {logoFeedback && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl flex items-center gap-2 text-emerald-200 text-xs font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{logoFeedback}</span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    {/* Logo de l'Entreprise avec interaction de téléversement */}
                    <div className="relative group shrink-0">
                      <div
                        onClick={() => enterpriseLogoInputRef.current?.click()}
                        title={currentUser?.business?.logoUrl ? dict.dashboard.changeLogoBtn : dict.dashboard.addLogoBtn}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border-2 border-indigo-400/30 flex items-center justify-center overflow-hidden cursor-pointer shadow-lg hover:border-amber-400/80 transition-all hover:scale-105"
                      >
                        {currentUser?.business?.logoUrl ? (
                          <img
                            src={currentUser.business.logoUrl}
                            alt={currentUser.business.companyName || "Logo Entreprise"}
                            className="w-full h-full object-contain p-2 bg-white"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex flex-col items-center justify-center text-white">
                            <Building2 className="w-8 h-8 text-amber-300" />
                            <span className="text-[9px] font-bold text-amber-200 mt-0.5 tracking-tight">+ Logo</span>
                          </div>
                        )}

                        {isUploadingLogo && (
                          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Badge flottant pour changer le logo */}
                      <button
                        type="button"
                        onClick={() => enterpriseLogoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        title={currentUser?.business?.logoUrl ? dict.dashboard.changeLogoBtn : dict.dashboard.addLogoBtn}
                        className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-md transition-all hover:scale-110 cursor-pointer border border-slate-900"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      <input
                        ref={enterpriseLogoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleEnterpriseLogoUpload}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                          {currentUser?.business?.companyType || "Cabinet RH & Recrutement"}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          {currentUser?.business?.rccm ? `RCCM : ${currentUser.business.rccm}` : "RCCM Certifié OHADA"}
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
                    {/* Bouton Ajouter / Modifier le logo */}
                    <button
                      type="button"
                      onClick={() => enterpriseLogoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md shadow-xs"
                      title={currentUser?.business?.logoUrl ? dict.dashboard.changeLogoBtn : dict.dashboard.addLogoBtn}
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-amber-300" />
                      )}
                      <span>{currentUser?.business?.logoUrl ? dict.dashboard.changeLogoBtn : dict.dashboard.addLogoBtn}</span>
                    </button>

                    {currentUser?.business?.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveEnterpriseLogo}
                        className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                        title={dict.dashboard.removeLogoBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

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
                        className={`h-full rounded-full transition-all duration-500 ${
                          (businessQuota?.usagePercent || 0) >= 90
                            ? "bg-rose-500"
                            : (businessQuota?.usagePercent || 0) >= 70
                            ? "bg-amber-500"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(4, businessQuota?.usagePercent || 0))}%` }}
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

              <div
                id="candidate-pool-section"
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5 scroll-mt-24 transition-all duration-300"
              >
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
                      const fullName = `${cv.personal?.firstName || ""} ${cv.personal?.lastName || ""}`.trim() || cv.title;
                      const initials = `${(cv.personal?.firstName?.[0] || cv.title?.[0] || "C").toUpperCase()}${(cv.personal?.lastName?.[0] || "").toUpperCase()}`;
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
                                  href={`/c/${cv.slug}?from=enterprise`}
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
                                className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                                  hasDocxExported
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                }`}
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
              {/* Alerte si le compte dispose également d'un accès Entreprise */}
              {isBusinessAccount && (
                <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-indigo-900/60 shadow-md flex flex-wrap items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-2.5 text-xs">
                    <Building className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Vous êtes sur votre <strong>Tableau de Bord Candidat</strong>. Votre compte dispose également d'un accès Vivier RH Entreprise actif.
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

              {/* 1. HERO HEADER CANDIDAT - Vrai Cockpit de Bienvenue */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                  <div className="flex items-start gap-4">
                    {/* Avatar Initiale du Candidat */}
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0 border-2 border-white">
                      {(displayName[0] || "C").toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Badge de la Formule */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border flex items-center gap-1 ${planInfo.badgeColor}`}>
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span>{planInfo.name}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Compte Actif & Vérifié
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          Conforme OHADA & ATS
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Bonjour, {displayName} 👋
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                        Bienvenue sur votre tableau de bord MonCV.ai. Pilotez vos candidatures, optimisez vos scores de recrutement avec l'IA et téléchargez vos documents aux formats officiels.
                      </p>
                    </div>
                  </div>

                  {/* Actions Rapides En-tête */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPaymentOpen(true)}
                      className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-950 font-black text-xs border border-amber-300/80 flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                      title="Recharger vos crédits ou changer de pack"
                    >
                      <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>Recharger en crédits Wave</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200/80 flex items-center gap-1.5 transition-all cursor-pointer"
                      title={dict.nav.settings}
                    >
                      <Settings className="w-4 h-4 text-slate-600" />
                      <span className="hidden sm:inline">Mon Compte</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCreatingModal(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-md shadow-blue-600/25 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{dict.dashboard.newCvButton}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. CARTES KPIS & SOLDE DU COCKPIT CANDIDAT (4 Cartes Modernes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1 : Solde Crédits IA */}
                <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-50 to-white rounded-3xl border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-amber-400 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                        Crédits IA Disponibles
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-1.5">
                        <span>{effectiveCredits}</span>
                        <span className="text-xs font-bold text-amber-700">Crédits</span>
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                      <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-900 font-medium pt-1 border-t border-amber-200/50">
                    <span>Valables à vie</span>
                    <button
                      type="button"
                      onClick={() => setIsPaymentOpen(true)}
                      className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <span>+ Recharger</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* KPI 2 : Mes CVs Enregistrés */}
                <div className="p-5 bg-gradient-to-br from-blue-500/10 via-blue-50 to-white rounded-3xl border border-blue-200/80 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-blue-400 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                        Mes CVs Créés
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-1.5">
                        <span>{resumes.length}</span>
                        <span className="text-xs font-bold text-blue-700">{resumes.length > 1 ? "CVs" : "CV"}</span>
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-blue-900 font-medium pt-1 border-t border-blue-200/50">
                    <span>Formats Word & PDF A4</span>
                    <button
                      type="button"
                      onClick={() => setCandidateSubTab("resumes")}
                      className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <span>Gérer ({resumes.length})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* KPI 3 : Score ATS & Conformité */}
                <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-white rounded-3xl border border-emerald-200/80 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-400 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                        Optimisation ATS
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-1.5">
                        <span>98%</span>
                        <span className="text-xs font-bold text-emerald-700">Conforme</span>
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-900 font-medium pt-1 border-t border-emerald-200/50">
                    <span>Filtres RH internationaux</span>
                    <button
                      type="button"
                      onClick={() => setCandidateSubTab("tips")}
                      className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <span>Guide ATS</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* KPI 4 : Factures OHADA & Règlements */}
                <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-indigo-50 to-white rounded-3xl border border-indigo-200/80 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-indigo-400 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                        Factures & Reçus OHADA
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-baseline gap-1.5">
                        <span>{userInvoices.length}</span>
                        <span className="text-xs font-bold text-indigo-700">{userInvoices.length > 1 ? "Factures" : "Facture"}</span>
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-indigo-900 font-medium pt-1 border-t border-indigo-200/50">
                    <span>INNOVA GROUP SARL</span>
                    <button
                      type="button"
                      onClick={() => setCandidateSubTab("invoices")}
                      className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <span>Consulter</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. BARRE DE NAVIGATION DES ONGLETS CANDIDAT */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 gap-2 overflow-x-auto">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setCandidateSubTab("overview")}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      candidateSubTab === "overview"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Vue d'ensemble (Cockpit)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCandidateSubTab("resumes")}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      candidateSubTab === "resumes"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Mes CVs</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                      candidateSubTab === "resumes" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}>
                      {resumes.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCandidateSubTab("invoices")}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      candidateSubTab === "invoices"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Mes Factures OHADA</span>
                    {userInvoices.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                        candidateSubTab === "invoices" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}>
                        {userInvoices.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCandidateSubTab("tips")}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      candidateSubTab === "tips"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Guide & Conseils IA</span>
                  </button>
                </div>
              </div>

              {/* 4. CONTENU : ONGLET 1 - VUE D'ENSEMBLE (COCKPIT) */}
              {candidateSubTab === "overview" && (
                <div className="space-y-6">
                  {/* Actions Rapides Intelligentes */}
                  <div className="space-y-3">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Actions Rapides de Candidature</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Action 1 : Nouveau CV IA */}
                      <div
                        onClick={() => setIsCreatingModal(true)}
                        className="p-5 bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            Nouveau CV IA
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            Création guidée avec structure professionnelle, mots-clés ATS et formats Word/PDF.
                          </p>
                        </div>
                        <div className="text-xs font-bold text-blue-600 flex items-center gap-1 pt-1">
                          <span>Créer un CV</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Action 2 : Lettre de Motivation STAR */}
                      <div
                        onClick={() => handleOpenCoverLetter()}
                        className="p-5 bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                          <Wand2 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                            Lettre STAR
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            Rédaction percutante basée sur la méthode STAR adaptée à l'offre et l'entreprise.
                          </p>
                        </div>
                        <div className="text-xs font-bold text-indigo-600 flex items-center gap-1 pt-1">
                          <span>Rédiger une lettre</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Action 3 : Demande d'Emploi Officielle */}
                      <div
                        onClick={() => handleOpenJobApplication()}
                        className="p-5 bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                            Demande d'Emploi
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            Modèle officiel et conforme pour candidatures spontanées ou concours publics.
                          </p>
                        </div>
                        <div className="text-xs font-bold text-amber-600 flex items-center gap-1 pt-1">
                          <span>Générer la demande</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>

                      {/* Action 4 : Portfolio Web */}
                      <Link
                        href="/portfolio"
                        target="_blank"
                        className="p-5 bg-white rounded-3xl border border-slate-200/90 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
                          <Globe className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                            Portfolio Web
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            Page web interactive partageable sur LinkedIn ou par WhatsApp avec les recruteurs.
                          </p>
                        </div>
                        <div className="text-xs font-bold text-purple-600 flex items-center gap-1 pt-1">
                          <span>Voir mon portfolio</span>
                          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Portfolio Web Banner */}
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
                          Transformez vos expériences professionnelles en un véritable site web interactif de prestige.
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

                  {/* Mes CVs Récents OU Onboarding Guidé */}
                  {resumes.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-xs">
                      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100 shadow-inner">
                        <FileText className="w-10 h-10" />
                      </div>
                      <div className="space-y-2 max-w-md mx-auto">
                        <h3 className="text-xl font-black text-slate-900">
                          Bienvenue sur votre cockpit MonCV.ai !
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          Vous n'avez pas encore créé de CV. Suivez ces 3 étapes simples pour lancer votre première candidature optimisée :
                        </p>
                      </div>

                      {/* Roadmap 3 étapes */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto text-left">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                            1
                          </div>
                          <h4 className="font-bold text-xs text-slate-900">Intitulé & Expériences</h4>
                          <p className="text-[11px] text-slate-500">
                            Renseignez vos postes ou importez un texte brut.
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                            2
                          </div>
                          <h4 className="font-bold text-xs text-slate-900">Optimisation STAR IA</h4>
                          <p className="text-[11px] text-slate-500">
                            L'IA enrichit vos réalisations avec des verbes d'action.
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                            3
                          </div>
                          <h4 className="font-bold text-xs text-slate-900">Export Word & PDF</h4>
                          <p className="text-[11px] text-slate-500">
                            Téléchargez votre dossier 98% conforme ATS.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCreatingModal(true)}
                        className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-blue-600/25 cursor-pointer inline-flex items-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Créer mon premier CV maintenant</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Mes CVs Récents ({Math.min(3, resumes.length)} sur {resumes.length})</span>
                        </h2>
                        <button
                          type="button"
                          onClick={() => setCandidateSubTab("resumes")}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>Voir tous mes CVs ({resumes.length})</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {resumes.slice(0, 3).map((cv) => (
                          <div
                            key={cv.id}
                            className="bg-white rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between hover:shadow-xl hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-300 group"
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

                              <h3 className="font-bold text-slate-900 text-base leading-tight mb-1 truncate" title={cv.title}>
                                {cv.title}
                              </h3>
                              <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                                {cv.personal?.title || "Titre professionnel"}
                              </p>

                              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ATS 98% Conforme
                                </span>
                                <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(cv.updatedAt).toLocaleDateString("fr-FR")}
                                </span>
                              </div>

                              <div className="p-2.5 bg-purple-50/70 border border-purple-200/70 rounded-xl mb-4 flex items-center justify-between text-[11px]">
                                <span className="font-bold text-purple-900 flex items-center gap-1 truncate">
                                  <Globe className="w-3 h-3 text-purple-600 shrink-0" />
                                  <span className="truncate">moncv.ai/c/{cv.slug}</span>
                                </span>
                                <a
                                  href={`/c/${cv.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5 text-[10.5px] shrink-0"
                                >
                                  <span>Voir</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
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

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleExportDocx(cv)}
                                  disabled={isExportingDocxId === cv.id}
                                  className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                                    exportSuccessId === cv.id
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {isExportingDocxId === cv.id ? (
                                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                  ) : exportSuccessId === cv.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {exportSuccessId === cv.id ? "Téléchargé !" : "Télécharger Word"}
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
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dernière Facture OHADA (si disponible) */}
                  {userInvoices.length > 0 && (
                    <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl border border-indigo-900/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">
                              Dernière Facture OHADA : {userInvoices[0].numero}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9.5px] font-black uppercase">
                              Payée & Archivée
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            Formule : <strong>{userInvoices[0].packNom}</strong> • Montant : <strong>{userInvoices[0].montantFcfa.toLocaleString("fr-FR")} FCFA</strong> • Émise le {new Date(userInvoices[0].creeLe).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(userInvoices[0])}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Imprimer / Télécharger le reçu</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Conseils Express de Coaching IA */}
                  <div className="bg-slate-100/80 rounded-3xl p-6 border border-slate-200/80 space-y-3">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Conseils Express pour Décrocher des Entretiens</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div className="p-3 bg-white rounded-2xl border border-slate-200/60 space-y-1">
                        <strong className="text-slate-900 block font-bold">1. Chiffrez vos résultats</strong>
                        <span>Utilisez des pourcentages, des montants ou des volumes pour rendre chaque expérience tangible.</span>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-slate-200/60 space-y-1">
                        <strong className="text-slate-900 block font-bold">2. Alignez les mots-clés ATS</strong>
                        <span>Reprenez exactement les compétences listées dans l'offre d'emploi cible.</span>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-slate-200/60 space-y-1">
                        <strong className="text-slate-900 block font-bold">3. Joignez une demande formelle</strong>
                        <span>En Afrique, joindre une lettre de demande d'emploi augmente de 60% la prise en compte du dossier.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CONTENU : ONGLET 2 - MES CVS */}
              {candidateSubTab === "resumes" && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {dict.dashboard.myResumesTitle} ({resumes.length})
                        </h2>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                          ATS Conforme
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Gérez vos dossiers de candidature, téléchargez en Word .docx ou PDF A4 et partagez vos liens personnalisés.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCreatingModal(true)}
                      className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-md shadow-blue-600/25 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{dict.dashboard.newCvButton}</span>
                    </button>
                  </div>

                  {/* Barre de Recherche */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={candidateSearchQuery}
                        onChange={(e) => setCandidateSearchQuery(e.target.value)}
                        placeholder="Rechercher par titre de poste, entreprise, ville ou modèle..."
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
                        Affichage : <strong>{filteredResumes.length}</strong> / {resumes.length}
                      </span>
                    </div>
                  </div>

                  {resumes.length === 0 ? (
                    <div className="py-16 text-center space-y-4 border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50/50">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100">
                        <FileText className="w-8 h-8" />
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
                        Aucun CV ne correspond à "{candidateSearchQuery}"
                      </p>
                      <button
                        type="button"
                        onClick={() => setCandidateSearchQuery("")}
                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        {dict.dashboard.searchReset}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                      {filteredResumes.map((cv) => (
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

                            <h3 className="font-bold text-slate-900 text-base leading-tight mb-1 truncate" title={cv.title}>
                              {cv.title}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                              {cv.personal?.title || "Titre professionnel"}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ATS 98% Conforme
                              </span>
                              <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(cv.updatedAt).toLocaleDateString("fr-FR")}
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
                                  href={`/c/${cv.slug}`}
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
                                className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                                  exportSuccessId === cv.id
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                }`}
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
                                title={dict.dashboard.shareCv}
                              >
                                <Share2 className="w-3.5 h-3.5 text-slate-500" />
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
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. CONTENU : ONGLET 3 - MES FACTURES OHADA */}
              {candidateSubTab === "invoices" && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
                  {/* Bannière OHADA */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase">
                          OHADA Conforme
                        </span>
                        <span className="text-xs text-slate-400">RCCM CI-BKE-2019-A-228 • IFU 2400000X</span>
                      </div>
                      <h2 className="text-lg font-black text-white">
                        Mes Factures & Reçus de Souscription
                      </h2>
                      <p className="text-xs text-slate-300 max-w-xl">
                        Toutes vos souscriptions réglées par Wave ou Mobile Money sont archivées légalement par INNOVA GROUP SARL. Vous pouvez visualiser et télécharger vos factures normalisées à tout moment.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPaymentOpen(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap self-start sm:self-auto"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>Nouvelle formule Wave</span>
                    </button>
                  </div>

                  {userInvoices.length === 0 ? (
                    <div className="py-12 text-center space-y-4 border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50/50">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100">
                        <Receipt className="w-8 h-8" />
                      </div>
                      <div className="space-y-1 max-w-md mx-auto">
                        <h3 className="text-lg font-black text-slate-900">
                          Aucune facture pour le moment
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Vous êtes actuellement sur la <strong>Formule Découverte Gratuite</strong> (30 crédits offerts). Lors de votre premier règlement par Wave ou Mobile Money, votre facture officielle OHADA sera immédiatement archivée et téléchargeable ici.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPaymentOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer inline-flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Découvrir les offres à partir de 1 500 FCFA</span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4 rounded-l-xl">N° Facture</th>
                            <th className="py-3 px-4">Date d'émission</th>
                            <th className="py-3 px-4">Formule Souscrite</th>
                            <th className="py-3 px-4">Montant (FCFA)</th>
                            <th className="py-3 px-4">Mode de Paiement</th>
                            <th className="py-3 px-4">Statut</th>
                            <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {userInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                {inv.numero}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {new Date(inv.creeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{inv.packNom}</div>
                                <div className="text-[10.5px] text-slate-500">{inv.credits} crédits IA</div>
                              </td>
                              <td className="py-3.5 px-4 font-extrabold text-slate-900">
                                {inv.montantFcfa.toLocaleString("fr-FR")} FCFA
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {inv.modePaiement || "Wave Mobile Money"}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Payée
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvoice(inv)}
                                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-all border border-blue-200 cursor-pointer shadow-2xs"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Télécharger / Imprimer</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 7. CONTENU : ONGLET 4 - GUIDE & CONSEILS ATS */}
              {candidateSubTab === "tips" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span>Guide d'Excellence & Optimisation ATS</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                      MonCV.ai intègre les critères d'évaluation des plus grands logiciels de recrutement au monde (Workday, Taleo, Greenhouse). Voici comment maximiser vos chances :
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Conseil 1 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-base shadow-xs">
                        🎯
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        1. Passer les filtres ATS (Score 98%)
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Les robots ATS éliminent jusqu'à 75% des CVs à cause de polices exotiques, de tableaux imbriqués ou de colonnes graphiques complexes. Tous les modèles de MonCV.ai sont conçus pour être 100% lisibles par les parseurs de données RH.
                      </p>
                      <div className="p-3 bg-blue-50/60 rounded-xl text-[11px] text-blue-900 font-medium">
                        💡 <strong>Astuce :</strong> Exportez toujours au format Word (.docx) ou PDF A4 standard généré depuis la plateforme.
                      </div>
                    </div>

                    {/* Conseil 2 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-base shadow-xs">
                        ⚡
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        2. La Méthode STAR pour chaque réalisation
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Ne listez pas simplement vos tâches quotidiennes. Utilisez la formule : <strong>Situation</strong>, <strong>Tâche</strong>, <strong>Action</strong> et <strong>Résultat mesuré</strong>. Un recruteur retient un chiffre : "+35% de productivité" ou "gestion d'un budget de 50M FCFA".
                      </p>
                      <div className="p-3 bg-indigo-50/60 rounded-xl text-[11px] text-indigo-900 font-medium">
                        💡 <strong>Astuce :</strong> Utilisez le bouton "Optimiser avec l'IA" dans l'éditeur pour reformuler vos puces selon STAR.
                      </div>
                    </div>

                    {/* Conseil 3 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-base shadow-xs">
                        ✍️
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        3. L'importance de la Demande d'Emploi
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Dans les entreprises ivoiriennes et ouest-africaines, une demande manuscrite ou formelle est souvent requise en plus du CV. Notre générateur de demande d'emploi vous produit un document officiel prêt à signer en Word et PDF.
                      </p>
                      <div className="p-3 bg-amber-50/60 rounded-xl text-[11px] text-amber-900 font-medium">
                        💡 <strong>Astuce :</strong> Cliquez sur "Demande d'emploi" depuis n'importe quel CV pour la générer en 5 secondes.
                      </div>
                    </div>

                    {/* Conseil 4 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-base shadow-xs">
                        🌐
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        4. Votre Portfolio Web comme déclencheur d'entretien
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        90% des candidats envoient un simple fichier PDF par email. Avec MonCV.ai, vous disposez d'un lien web interactif (ex: moncv.ai/c/votre-nom) responsive, adapté aux smartphones des directeurs et recruteurs.
                      </p>
                      <div className="p-3 bg-purple-50/60 rounded-xl text-[11px] text-purple-900 font-medium">
                        💡 <strong>Astuce :</strong> Ajoutez votre lien dans la signature de vos emails et sur votre profil LinkedIn.
                      </div>
                    </div>
                  </div>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreatingModal(false);
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsCreatingModal(false);
          }}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 my-auto relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">
                {isBusinessAccount ? dict.dashboard.modalTitleCandidate : dict.dashboard.modalTitleNewCv}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
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
          resumeData={selectedForShare}
        />
      )}

      {isCoverLetterOpen && (
        <CoverLetterModal
          isOpen={isCoverLetterOpen}
          onClose={() => setIsCoverLetterOpen(false)}
          resumeData={selectedForCoverLetter || resumes[0] || StorageManager.getActiveResume()}
        />
      )}

      {isJobAppOpen && (
        <JobApplicationModal
          isOpen={isJobAppOpen}
          onClose={() => setIsJobAppOpen(false)}
          resumeData={selectedForJobApp || resumes[0] || StorageManager.getActiveResume()}
        />
      )}

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
        onClose={() => {
          setIsInvoiceOpen(false);
          setSelectedInvoiceForModal(null);
        }}
        invoice={selectedInvoiceForModal}
        packSlug={selectedInvoiceForModal?.packSlug || currentUser?.planTier || "2500"}
        clientNom={
          selectedInvoiceForModal?.clientNom ||
          currentUser?.business?.companyName ||
          `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() ||
          currentUser?.email?.split("@")[0] ||
          "Client MonCV.ai"
        }
        clientEmail={selectedInvoiceForModal?.clientEmail || currentUser?.email || ""}
        user={currentUser}
        planTier={selectedInvoiceForModal?.packSlug as any || currentUser?.planTier}
      />

      <MobileMoneyModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => {
          setIsPaymentOpen(false);
          const u = StorageManager.getUser();
          const isBiz = u?.accountType === "business" || StorageManager.isBusinessAccount();
          setCurrentUser(u);
          setIsBusinessAccount(isBiz);
          setBusinessQuota(StorageManager.getBusinessQuotaInfo());
          if (u?.email) {
            loadUserInvoicesAndCredits(u.email, u.id);
          }
          if (isBiz) {
            setActiveTab("business");
          }
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
          const u = StorageManager.getUser();
          const isBiz = u?.accountType === "business" || StorageManager.isBusinessAccount();
          setCurrentUser(u);
          setIsBusinessAccount(isBiz);
          setBusinessQuota(StorageManager.getBusinessQuotaInfo());
          setResumes(StorageManager.getResumes());
          if (u?.email) {
            loadUserInvoicesAndCredits(u.email, u.id);
          }
          if (isBiz) {
            setActiveTab("business");
          }
        }}
      />
    </div>
  );
}
