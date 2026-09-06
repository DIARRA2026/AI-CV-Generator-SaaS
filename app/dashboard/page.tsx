"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResumeData, PlanTier, BusinessProfile } from "@/lib/types";
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
  Download,
  Lock,
  LogIn,
  User,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Globe,
  ExternalLink,
  Crown,
  Briefcase,
  Wand2,
  Settings,
  Building,
  Building2,
  Users,
  Search,
  MessageCircle,
  AlertTriangle,
  Loader2,
  Check,
  RefreshCw,
  Phone,
  Filter,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
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

  // États Spécifiques Espace Entreprise / Recruteur
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

      // Si le compte est un compte entreprise, on active par défaut l'Espace Recruteur
      if (isBiz) {
        setActiveTab("business");
      }

      // Hydratation Cloud Full-Stack si l'utilisateur est connecté
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

  // Filtrage des candidats pour la recherche dans le vivier entreprise
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

  // Handler Lettre de Motivation IA (règle des formules payantes Pack Pro 2500 & VIP 5000 & Entreprise)
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

  // Handler Demande d'Emploi Officielle (règle des formules payantes Pack Pro 2500 & VIP 5000 & Entreprise)
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

  // Export direct Word (.docx) sans passer par l'éditeur
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
    // Vérification du quota pour les comptes entreprises
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
    if (confirm("Voulez-vous vraiment supprimer ce candidat ? Cette action est irréversible.")) {
      const updated = await SupabaseService.deleteResume(id);
      setResumes(updated);
      setBusinessQuota(StorageManager.getBusinessQuotaInfo());
    }
  };

  const handleDuplicate = async (resume: ResumeData) => {
    const dup = StorageManager.createNewResume(`${resume.title} (Copie)`, resume);
    await SupabaseService.syncResumeToCloud(dup).catch(() => {});
    setResumes(StorageManager.getResumes());
    setBusinessQuota(StorageManager.getBusinessQuotaInfo());
  };

  const handleLogout = () => {
    StorageManager.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsAuthOpen(true);
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

      {/* Contenu principal selon statut de connexion */}
      {!isLoggedIn ? (
        /* Écran Verrouillé invitant à la connexion */
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-blue-600/10 border border-blue-100">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full uppercase tracking-wider">
                Espace Candidat Protégé
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Connectez-vous pour voir vos CVs
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Retrouvez l'ensemble de vos CVs créés, modifiez vos informations à tout moment et téléchargez vos exports PDF en haute fidélité.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Se connecter / S'inscrire</span>
              </button>

              <Link
                href="/"
                className="block w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                ← Retour à la page d'accueil
              </Link>
            </div>
          </div>
        </main>
      ) : (
        /* Tableau de bord complet de l'utilisateur connecté */
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          
          {/* SÉLECTEUR DE VUE DÉDIÉE : ESPACE ENTREPRISE / ESPACE CANDIDAT */}
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
                  <span>Espace Entreprise &amp; Recruteur</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black">
                    Vivier RH
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
                  <span>Mon CV Personnel</span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold w-full sm:w-auto justify-center sm:justify-end">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Régime Commercial Conforme OHADA</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* A. VUE 1 : ESPACE RECRUTEUR & ENTREPRISE DÉDIÉ                            */}
          {/* ========================================================================= */}
          {isBusinessAccount && activeTab === "business" ? (
            <div className="space-y-6 fade-in">
              
              {/* 1. BANNIÈRE PRESTIGE DE L'ENTREPRISE */}
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

                  {/* Actions Rapides Supérieures Entreprise */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsInvoiceOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md shadow-xs"
                      title="Générer et imprimer votre Facture Commerciale Normalisée OHADA"
                    >
                      <FileText className="w-4 h-4 text-amber-300" />
                      <span>Facture Normalisée OHADA</span>
                    </button>

                    <a
                      href="https://wa.me/2250700510524?text=Bonjour%20INNOVA%20GROUP,%20je%20suis%20client%20Entreprise%20sur%20MonCV.ai%20et%20j'ai%20besoin%20d'assistance%20prioritaire."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                      title="Support VIP WhatsApp dédié 7j/7 avec gestionnaire de compte"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Assistance VIP WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Paramètres de facturation, RCCM et compte"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* 2. JAUGE D'UTILISATION DU QUOTA CONFORME AUX OFFRES B2B */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          Formule Active :
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-extrabold">
                          {currentUser?.planTier === "enterprise200"
                            ? "Pack Entreprise Premium (200 Candidats)"
                            : currentUser?.planTier === "enterprise75"
                            ? "Pack Business Pro (75 Candidats)"
                            : currentUser?.planTier === "enterprise30"
                            ? "Pack Starter PME (30 Candidats)"
                            : currentUser?.planTier === "cyber15"
                            ? "Pass Cybercafé (15 Candidats)"
                            : "Formule Entreprise Personnalisée"}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-300">
                        {businessQuota?.allowedCount ? (
                          <>
                            <strong>{businessQuota.usedCount} profils utilisés</strong> sur un quota de <strong>{businessQuota.allowedCount} candidats débloqués</strong> ({businessQuota.remainingCount} profils restants disponibles).
                          </>
                        ) : (
                          "Activez un pack entreprise pour débloquer votre vivier de 30, 75 ou 200 profils candidats."
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
                        <span>Recharger mes Crédits</span>
                      </button>
                    </div>
                  </div>

                  {/* Barre de progression visuelle */}
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
                      <span>Consommation vivier : <strong>{businessQuota?.usagePercent || 0}%</strong></span>
                      <span>Crédits valables à vie sans expiration</span>
                    </div>
                  </div>

                  {/* Note de conformité des règles de licence */}
                  <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>Règle stricte anti-gaspillage :</strong> 1 crédit est consommé par identité candidat distincte (Prénom + Nom). Une fois débloqué, le candidat bénéficie de retouches illimitées, d'exports Word (.docx) et PDF HD vectoriels sans filigrane, ainsi que de la rédaction illimitée de lettres de motivation IA et demandes d'emploi officielles.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. SECTION DU VIVIER DE CANDIDATS AVEC BARRE DE RECHERCHE & ACTIONS */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Vivier de Candidats ({resumes.length})
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
                    <span>+ Ajouter un Candidat au Vivier</span>
                  </button>
                </div>

                {/* Barre de Recherche Dynamique des Candidats */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={candidateSearchQuery}
                      onChange={(e) => setCandidateSearchQuery(e.target.value)}
                      placeholder="Rechercher par nom, prénom, intitulé de poste, ville, email ou template..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    {candidateSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCandidateSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        Effacer
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium w-full sm:w-auto justify-between sm:justify-start">
                    <span>
                      Affichage : <strong>{filteredResumes.length}</strong> / {resumes.length} profil(s)
                    </span>
                  </div>
                </div>

                {/* Grille des Candidats du Vivier */}
                {resumes.length === 0 ? (
                  <div className="py-16 text-center space-y-4 border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50/50">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100">
                      <Users className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h3 className="text-lg font-black text-slate-900">
                        Votre Vivier de Candidats est prêt
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Ajoutez vos premiers postulants ou employés pour générer leurs CVs d'élite, lettres de motivation IA et dossiers de candidature conformes aux normes internationales ATS.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingModal(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter le premier profil candidat</span>
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
                      Réinitialiser la recherche
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
                            {/* En-tête de la Carte Candidat */}
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

                            {/* Badges de conformité ATS & Formule */}
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

                            {/* Date de mise à jour */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                Mis à jour le {new Date(cv.updatedAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>

                            {/* Lien Public / Portfolio Web du Candidat */}
                            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl mb-4 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-indigo-600" />
                                  CV &amp; Portfolio en Ligne
                                </span>
                                <a
                                  href={`/c/${cv.slug}?from=enterprise`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 text-[10.5px]"
                                >
                                  <span>Ouvrir</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono truncate">
                                moncv.ai/c/{cv.slug}
                              </p>
                            </div>
                          </div>

                          {/* Grille d'actions pour le Candidat */}
                          <div className="space-y-2 pt-3 border-t border-slate-100">
                            {/* Bouton Éditer Principal */}
                            <button
                              type="button"
                              onClick={() => handleOpenResume(cv)}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Modifier dans l'Éditeur</span>
                            </button>

                            {/* Documents de Candidature Officiels (Demande d'Emploi & Lettre IA) */}
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenJobApplication(cv)}
                                className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title="Créer la Demande d'Emploi Officielle"
                              >
                                <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">Demande d'emploi</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenCoverLetter(cv)}
                                className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title="Rédiger une Lettre de Motivation IA"
                              >
                                <Wand2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="truncate">Lettre IA</span>
                              </button>
                            </div>

                            {/* Export Word & Actions de Gestion */}
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
                                title="Télécharger directement le CV au format Microsoft Word (.docx)"
                              >
                                {isUnlockingDocx ? (
                                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                ) : hasDocxExported ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                )}
                                <span className="truncate">
                                  {hasDocxExported ? "Word Téléchargé !" : "Export Word (.docx)"}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicate(cv)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                                title="Dupliquer ce profil"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(cv.id)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-100 cursor-pointer"
                                title="Supprimer ce profil du vivier"
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
            /* ========================================================================= */
            /* B. VUE 2 : ESPACE CANDIDAT PERSONNEL (CVs INDIVIDUELS)                    */
            /* ========================================================================= */
            <div className="space-y-6 fade-in">
              {/* Bannière de retour direct dans l'espace entreprise pour comptes entreprise */}
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
                    <span>RETOUR DANS L'ESPACE ENTREPRISE</span>
                  </button>
                </div>
              )}
              {/* En-tête Dashboard avec profil */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Connecté : {currentUser?.firstName || currentUser?.email?.split("@")[0] || "Mon Espace"}
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
                      title="Modifier votre profil, mot de passe et préférences"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Paramètres du compte</span>
                    </button>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Mes CVs &amp; Candidatures
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Gérez vos CVs, générez vos lettres de motivation IA et créez vos demandes d'emploi officielles.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenJobApplication()}
                      className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-[0.98]"
                      title="Créer une Demande d'Emploi Officielle (Pack Pro & VIP)"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Demande d'Emploi</span>
                      <span className="text-[9px] bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded-full font-black uppercase">Pro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCoverLetter()}
                      className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-[0.98]"
                      title="Générer une Lettre de Motivation IA (Pack Pro & VIP)"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Lettre IA</span>
                      <span className="text-[9px] bg-indigo-200/90 text-indigo-950 px-1.5 py-0.5 rounded-full font-black uppercase">Pro</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreatingModal(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-md shadow-blue-600/20 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Créer un CV</span>
                  </button>
                </div>
              </div>

              {/* Bannière VIP Portfolio Web Moderne */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-purple-800/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-base text-white">Portfolio Web Professionnel &amp; CV en Ligne</h2>
                      <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9.5px] font-black uppercase">
                        Inclus Pack VIP
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/90 mt-0.5 max-w-xl">
                      Transformez vos expériences en un véritable site web interactif de prestige (Dark/Light mode, showcase de projets, stack technique et formulaire de devis).
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
                    <span>Voir le Portfolio Démo</span>
                  </Link>
                </div>
              </div>

              {/* Cartes statistiques rapides Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">{resumes.length}</div>
                    <div className="text-[11px] font-medium text-slate-500">CV{resumes.length > 1 ? "s" : ""} créé{resumes.length > 1 ? "s" : ""}</div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">
                      {currentUser?.planTier === "5000"
                        ? "Pack VIP"
                        : currentUser?.planTier === "2500"
                        ? "Pack Pro"
                        : currentUser?.planTier === "1500"
                        ? "Essentiel"
                        : currentUser?.planTier?.startsWith("enterprise")
                        ? "Entreprise"
                        : "Gratuit"}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">Formule Active</div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">Demande Pro</div>
                    <div className="text-[11px] font-medium text-slate-500">Word &amp; PDF</div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">Lettre IA</div>
                    <div className="text-[11px] font-medium text-slate-500">Génération STAR</div>
                  </div>
                </div>
              </div>

              {/* Grille des CVs Personnels */}
              {resumes.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Aucun CV créé pour le moment</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Lancez l'assistant intelligent pour créer votre premier CV professionnel en 5 minutes.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreatingModal(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer"
                  >
                    Créer mon premier CV
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
                            Modèle {cv.design.template}
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
                            Mis à jour {new Date(cv.updatedAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>

                        {/* Badge Formule Débloquée */}
                        <div className="mb-3">
                          {isBusinessAccount || isEnterpriseFormulaActive(cv) ? (
                            <div className="p-2.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                <Crown className="w-3.5 h-3.5 text-amber-600" />
                                Formule Entreprise (Offres Personnelles Offertes)
                              </span>
                              <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full">
                                100% Offert
                              </span>
                            </div>
                          ) : cv.planTier === "5000" ? (
                            <div className="p-2.5 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                              <span className="font-black text-purple-900 flex items-center gap-1.5">
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                                Pack VIP &amp; Portfolio Activé
                              </span>
                              <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                                Complet
                              </span>
                            </div>
                          ) : cv.planTier === "2500" ? (
                            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                              <span className="font-black text-blue-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                Pack Pro (Sans filigrane + Lettres)
                              </span>
                              <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                                Actif
                              </span>
                            </div>
                          ) : cv.planTier === "1500" ? (
                            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Pack Essentiel (CV Sans Filigrane)
                              </span>
                              <span className="text-[10px] bg-slate-700 text-white font-bold px-2 py-0.5 rounded-full">
                                Actif
                              </span>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Offre Découverte (Filigrane actif)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  StorageManager.saveActiveResume(cv);
                                  setIsPaymentOpen(true);
                                }}
                                className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer"
                              >
                                Débloquer
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Section Portfolio Web Site du Candidat */}
                        <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl mb-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                              <Globe className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>{cv.planTier === "5000" || isBusinessAccount || isEnterpriseFormulaActive(cv) ? "Portfolio Web Site VIP (Offert)" : "Lien Public de Partage"}</span>
                            </div>
                            <span className={`px-2 py-0.5 font-bold text-[9.5px] rounded-md flex items-center gap-1 ${
                              cv.planTier === "5000" || isBusinessAccount || isEnterpriseFormulaActive(cv) ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {cv.planTier === "5000" ? "VIP En Ligne" : isBusinessAccount || isEnterpriseFormulaActive(cv) ? "VIP Entreprise" : "Actif"}
                            </span>
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
                              <span>{cv.planTier === "5000" || isBusinessAccount || isEnterpriseFormulaActive(cv) ? "Consulter le Portfolio Web VIP" : "Voir le CV en Ligne"}</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Actions CV Individuel */}
                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        {/* Bouton Éditeur Principal */}
                        <button
                          type="button"
                          onClick={() => handleOpenResume(cv)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modifier dans l'Éditeur</span>
                        </button>

                        {/* Boutons Documents de Candidature Officiels (Demande d'Emploi & Lettre IA) */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenJobApplication(cv)}
                            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                              cv.planTier === "2500" || cv.planTier === "5000" || isBusinessAccount || isEnterpriseFormulaActive(cv)
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 shadow-xs"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                            title={
                              cv.planTier === "2500" || cv.planTier === "5000" || isBusinessAccount || isEnterpriseFormulaActive(cv)
                                ? "Créer la Demande d'Emploi Officielle (Offerte)"
                                : "Demande d'Emploi (Inclus dans le Pack Pro 2 500 FCFA)"
                            }
                          >
                            <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">Demande d'emploi</span>
                            {cv.planTier !== "2500" && cv.planTier !== "5000" && !isBusinessAccount && !isEnterpriseFormulaActive(cv) && (
                              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCoverLetter(cv)}
                            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                              cv.planTier === "2500" || cv.planTier === "5000" || isBusinessAccount || isEnterpriseFormulaActive(cv)
                                ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200 shadow-xs"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                            title={
                              cv.planTier === "2500" || cv.planTier === "5000" || isBusinessAccount || isEnterpriseFormulaActive(cv)
                                ? "Générer la Lettre de Motivation IA (Offerte)"
                                : "Lettre IA (Inclus dans le Pack Pro 2 500 FCFA)"
                            }
                          >
                            <Wand2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">Lettre IA</span>
                            {cv.planTier !== "2500" && cv.planTier !== "5000" && !isBusinessAccount && !isEnterpriseFormulaActive(cv) && (
                              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                          </button>
                        </div>

                        {/* Export Word & Actions Complémentaires */}
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
                            title="Télécharger directement le CV au format Microsoft Word (.docx)"
                          >
                            {isExportingDocxId === cv.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                            ) : exportSuccessId === cv.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                            <span className="truncate">
                              {exportSuccessId === cv.id ? "Téléchargé !" : "Export Word"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedForShare(cv)}
                            className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                            title="Partager le CV ou générer le QR Code"
                          >
                            <Share2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Partager</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(cv)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                            title="Dupliquer ce CV"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(cv.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-100 cursor-pointer"
                            title="Supprimer ce CV"
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

          {/* Footer Dashboard Officiel */}
          <footer className="pt-8 pb-12 border-t border-slate-200 mt-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-slate-900">MonCV<span className="text-blue-600">.ai</span></span>
              <span className="text-slate-400">
                <span className="hidden sm:inline">•</span> Développé par <strong className="text-slate-700 font-semibold">INNOVA GROUP</strong>
              </span>
            </div>
            <div className="flex items-center justify-center gap-5 font-semibold">
              <Link href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors">
                Conditions d'Utilisation
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors">
                Nous Contacter
              </Link>
              {isBusinessAccount && (
                <button
                  type="button"
                  onClick={() => setIsInvoiceOpen(true)}
                  className="text-amber-600 hover:text-amber-700 font-bold"
                >
                  Facture OHADA
                </button>
              )}
            </div>
          </footer>
        </main>
      )}

      {/* Modal Créer Nouveau CV / Candidat */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">
                {isBusinessAccount ? "Ajouter un Candidat au Vivier" : "Nommez votre nouveau CV"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {isBusinessAccount
                ? "Entrez le nom complet du candidat ou l'intitulé du poste pour créer son dossier complet."
                : "Ex: CV Commercial B2B, CV Responsable Marketing, CV International"}
            </p>
            <form onSubmit={handleCreateNew} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                placeholder={isBusinessAccount ? "Ex: CV Kouamé Jean — Directeur Logistique" : "Ex: CV Responsable Commercial"}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 font-medium"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Créer et éditer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Partage & QR Code */}
      {selectedForShare && (
        <ShareModal
          isOpen={true}
          onClose={() => setSelectedForShare(null)}
          resumeData={selectedForShare}
        />
      )}

      {/* Modal Paiement Mobile Money & Packs Entreprises */}
      <MobileMoneyModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        defaultPlan={paymentDefaultPlan}
        onSuccess={() => {
          setResumes(StorageManager.getResumes());
          setIsBusinessAccount(StorageManager.isBusinessAccount());
          setBusinessQuota(StorageManager.getBusinessQuotaInfo());
        }}
      />

      {/* Modale Facture Normalisée OHADA */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        user={currentUser}
        planTier={currentUser?.planTier || StorageManager.getPlanTier()}
      />

      {/* Modale Lettre de Motivation IA */}
      {selectedForCoverLetter && (
        <CoverLetterModal
          isOpen={isCoverLetterOpen}
          onClose={() => {
            setIsCoverLetterOpen(false);
            setSelectedForCoverLetter(null);
          }}
          resumeData={selectedForCoverLetter}
        />
      )}

      {/* Modale Demande d'Emploi Officielle */}
      {selectedForJobApp && (
        <JobApplicationModal
          isOpen={isJobAppOpen}
          onClose={() => {
            setIsJobAppOpen(false);
            setSelectedForJobApp(null);
          }}
          resumeData={selectedForJobApp}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsLoggedIn(true);
          const u = StorageManager.getUser();
          setCurrentUser(u);
          const isBiz = StorageManager.isBusinessAccount();
          setIsBusinessAccount(isBiz);
          if (isBiz) {
            setActiveTab("business");
          }
          setBusinessQuota(StorageManager.getBusinessQuotaInfo());
          setResumes(StorageManager.getResumes());
          setIsAuthOpen(false);
        }}
        defaultMode="login"
        defaultAccountType={isBusinessAccount ? "business" : "candidate"}
      />

      {/* Modale Paramètres de Compte Client & Entreprise */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setCurrentUser(StorageManager.getUser());
          setIsBusinessAccount(StorageManager.isBusinessAccount());
        }}
        onOpenPayment={(p) => {
          setPaymentDefaultPlan(p || (isBusinessAccount ? "enterprise75" : "2500"));
          setIsPaymentOpen(true);
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}
