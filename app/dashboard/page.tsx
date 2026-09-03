"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResumeData } from "@/lib/types";
import { StorageManager, UserSession } from "@/lib/storage";
import { Navbar } from "@/components/Navbar";
import { ShareModal } from "@/components/tools/ShareModal";
import { MobileMoneyModal } from "@/components/tools/MobileMoneyModal";
import { AuthModal } from "@/components/tools/AuthModal";
import { CoverLetterModal } from "@/components/tools/CoverLetterModal";
import { JobApplicationModal } from "@/components/tools/JobApplicationModal";
import { AccountSettingsModal } from "@/components/tools/AccountSettingsModal";
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
  const [paymentDefaultPlan, setPaymentDefaultPlan] = useState<"1500" | "2500" | "5000">("2500");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const syncState = () => {
      const logged = StorageManager.isLoggedIn();
      const user = StorageManager.getUser();
      setIsLoggedIn(logged);
      setCurrentUser(user);
      setResumes(StorageManager.getResumes());
      setIsInitialized(true);

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
      }
    };
    syncState();
    window.addEventListener("storage", syncState);
    return () => window.removeEventListener("storage", syncState);
  }, []);

  // Handler Lettre de Motivation IA (règle des formules payantes Pack Pro 2500 & VIP 5000)
  const handleOpenCoverLetter = (cv?: ResumeData) => {
    const targetCv = cv || resumes[0] || StorageManager.getActiveResume();
    const tier = targetCv.planTier || (targetCv.isPremium ? "2500" : "free");

    if (tier === "free" || tier === "1500") {
      StorageManager.saveActiveResume(targetCv);
      setPaymentDefaultPlan("2500");
      setIsPaymentOpen(true);
      return;
    }

    setSelectedForCoverLetter(targetCv);
    setIsCoverLetterOpen(true);
  };

  // Handler Demande d'Emploi Officielle (règle des formules payantes Pack Pro 2500 & VIP 5000)
  const handleOpenJobApplication = (cv?: ResumeData) => {
    const targetCv = cv || resumes[0] || StorageManager.getActiveResume();
    const tier = targetCv.planTier || (targetCv.isPremium ? "2500" : "free");

    if (tier === "free" || tier === "1500") {
      StorageManager.saveActiveResume(targetCv);
      setPaymentDefaultPlan("2500");
      setIsPaymentOpen(true);
      return;
    }

    setSelectedForJobApp(targetCv);
    setIsJobAppOpen(true);
  };

  const handleOpenResume = (resume: ResumeData) => {
    StorageManager.saveActiveResume(resume);
    router.push("/create");
  };

  const handleStartNewCvDirect = (customTitle?: string) => {
    const title = customTitle || `Nouveau CV ${resumes.length + 1}`;
    const newCv = StorageManager.createNewResume(title);
    StorageManager.saveActiveResume(newCv);
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

  const handleDelete = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce CV ?")) {
      const updated = StorageManager.deleteResume(id);
      setResumes(updated);
    }
  };

  const handleDuplicate = (resume: ResumeData) => {
    const dup = StorageManager.createNewResume(`${resume.title} (Copie)`, resume);
    setResumes(StorageManager.getResumes());
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
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* En-tête Dashboard avec profil */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connecté : {currentUser?.firstName || "Candidat"}
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
                Mes CVs & Candidatures
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Gérez vos CVs, générez vos lettres de motivation IA et créez vos demandes d'emploi officielles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenJobApplication()}
                className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Créer une Demande d'Emploi Officielle (Pack Pro & VIP)"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                <span>Demande d'Emploi</span>
                <span className="text-[9.5px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded-full font-extrabold">Pro</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCoverLetter()}
                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Générer une Lettre de Motivation IA (Pack Pro & VIP)"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Lettre IA</span>
                <span className="text-[9.5px] bg-indigo-200/80 text-indigo-900 px-1.5 py-0.5 rounded-full font-extrabold">Pro</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreatingModal(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-600/20 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Créer un CV</span>
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
                  <h2 className="font-extrabold text-base text-white">Portfolio Web Professionnel & CV en Ligne</h2>
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
                  {currentUser?.planTier === "5000" ? "Pack VIP" : currentUser?.planTier === "2500" ? "Pack Pro" : currentUser?.planTier === "1500" ? "Essentiel" : "Gratuit"}
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
                <div className="text-[11px] font-medium text-slate-500">Word & PDF</div>
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

          {/* Grille des CVs */}
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
                      {cv.planTier === "5000" ? (
                        <div className="p-2.5 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                          <span className="font-black text-purple-900 flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            Pack VIP & Portfolio Activé
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
                          <span>{cv.planTier === "5000" ? "Portfolio Web Site VIP" : "Lien Public de Partage"}</span>
                        </div>
                        <span className={`px-2 py-0.5 font-bold text-[9.5px] rounded-md flex items-center gap-1 ${
                          cv.planTier === "5000" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {cv.planTier === "5000" ? "VIP En Ligne" : "Actif"}
                        </span>
                      </div>

                      <p className="text-[10.5px] text-purple-700 font-mono truncate">
                        moncv.ai/c/{cv.slug}
                      </p>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <a
                          href={`/c/${cv.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{cv.planTier === "5000" ? "Voir le Portfolio" : "Voir le CV"}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              navigator.clipboard.writeText(`${window.location.origin}/c/${cv.slug}`);
                              alert("Lien copié dans le presse-papier !");
                            }
                          }}
                          className="px-2.5 py-1.5 bg-white border border-purple-200 hover:bg-purple-100 text-purple-800 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copier</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
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
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                          cv.planTier === "2500" || cv.planTier === "5000"
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                        title={
                          cv.planTier === "2500" || cv.planTier === "5000"
                            ? "Créer la Demande d'Emploi Officielle"
                            : "Demande d'Emploi (Inclus dans le Pack Pro 2 500 FCFA)"
                        }
                      >
                        <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Demande d'emploi</span>
                        {cv.planTier !== "2500" && cv.planTier !== "5000" && (
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCoverLetter(cv)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                          cv.planTier === "2500" || cv.planTier === "5000"
                            ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200 shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                        title={
                          cv.planTier === "2500" || cv.planTier === "5000"
                            ? "Générer la Lettre de Motivation IA"
                            : "Lettre IA (Inclus dans le Pack Pro 2 500 FCFA)"
                        }
                      >
                        <Wand2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">Lettre IA</span>
                        {cv.planTier !== "2500" && cv.planTier !== "5000" && (
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedForShare(cv)}
                        className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-slate-500" />
                        <span>Partager</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(cv)}
                        className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Dupliquer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(cv.id)}
                        className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Dashboard */}
          <footer className="pt-8 pb-12 border-t border-slate-200 mt-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">MonCV.ai</span>
              <span>•</span>
              <span>Développé par <strong>INNOVA GROUP</strong></span>
            </div>
            <div className="flex items-center gap-4 font-semibold">
              <Link href="/terms" className="hover:text-blue-600 transition-colors">
                Conditions d'Utilisation
              </Link>
              <Link href="/contact" className="hover:text-blue-600 transition-colors">
                Nous Contacter
              </Link>
            </div>
          </footer>
        </main>
      )}

      {/* Modal Créer Nouveau CV */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Nommez votre nouveau CV
            </h3>
            <p className="text-xs text-slate-500">
              Ex: <em>CV Commercial B2B</em>, <em>CV Responsable Marketing</em>, <em>CV International</em>
            </p>
            <form onSubmit={handleCreateNew} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: CV Responsable Commercial"
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

      <MobileMoneyModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        defaultPlan={paymentDefaultPlan}
        onSuccess={() => {
          setResumes(StorageManager.getResumes());
        }}
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
          setCurrentUser(StorageManager.getUser());
          setResumes(StorageManager.getResumes());
          setIsAuthOpen(false);
        }}
        defaultMode="login"
      />

      {/* Modale Paramètres de Compte Client */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenPayment={(p) => {
          setPaymentDefaultPlan(p || "2500");
          setIsPaymentOpen(true);
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}
