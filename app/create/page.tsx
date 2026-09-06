"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ResumeData } from "@/lib/types";
import { initialResumeData } from "@/lib/initialData";
import { StorageManager } from "@/lib/storage";
import { downloadResumePDF } from "@/lib/pdf-export";
import { downloadResumeDocx } from "@/lib/docx-export";
import { QuestionnaireWizard } from "@/components/wizard/QuestionnaireWizard";
import { CVPreviewCanvas } from "@/components/preview/CVPreviewCanvas";
import { ATSOptimizerModal } from "@/components/tools/ATSOptimizerModal";
import { CoverLetterModal } from "@/components/tools/CoverLetterModal";
import { ShareModal } from "@/components/tools/ShareModal";
import { MobileMoneyModal } from "@/components/tools/MobileMoneyModal";
import { JobApplicationModal } from "@/components/tools/JobApplicationModal";
import { ScanConvertModal } from "@/components/tools/ScanConvertModal";
import { SmartGenerateModal } from "@/components/tools/SmartGenerateModal";
import { AuthModal } from "@/components/tools/AuthModal";
import { Navbar } from "@/components/Navbar";
import { SupabaseService } from "@/lib/supabaseService";
import { getLicenseStatus, isEnterpriseFormulaActive } from "@/lib/license-manager";
import {
  Download,
  Share2,
  Sparkles,
  FileText,
  Eye,
  Edit3,
  ZoomIn,
  ZoomOut,
  Crown,
  RotateCcw,
  RefreshCw,
  Check,
  CheckCircle2,
  Wand2,
  ScanLine,
  Briefcase,
  Maximize2,
  Globe,
  Cloud,
  ShieldAlert,
  ShieldCheck,
  Building,
} from "lucide-react";

export default function CreateCVPage() {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [scale, setScale] = useState<number>(0.75);
  const [viewTab, setViewTab] = useState<"editor" | "preview">("editor");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Modals state
  const [isATSOpen, setIsATSOpen] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDefaultPlan, setPaymentDefaultPlan] = useState<"1500" | "2500" | "5000">("2500");
  const [isJobApplicationOpen, setIsJobApplicationOpen] = useState(false);
  const [isScanConvertOpen, setIsScanConvertOpen] = useState(false);
  const [isSmartGenerateOpen, setIsSmartGenerateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingAction, setPendingAction] = useState<"coverLetter" | "jobApplication" | "smartGenerate" | null>(null);

  // Indicateur Full-Stack Cloud Auto-Save
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"saved" | "saving" | "local" | "error">("saved");
  const [lastSyncTime, setLastSyncTime] = useState<string>("À l'instant");
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ouvre auth si pas connecté, sinon ouvre directement le modal
  const requireAuth = (action: typeof pendingAction, openFn: () => void) => {
    if (isLoggedIn) { openFn(); return; }
    setPendingAction(action);
    setIsAuthOpen(true);
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const fitToScreen = useCallback(() => {
    if (previewContainerRef.current) {
      const containerWidth = previewContainerRef.current.clientWidth - 32;
      if (containerWidth > 120) {
        // 794px est la largeur géométrique A4 standard à 96 DPI
        const idealScale = Math.min(1.0, Math.max(0.35, Math.floor((containerWidth / 794) * 100) / 100));
        setScale(idealScale);
        return;
      }
    }
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width < 450) setScale(0.44);
      else if (width < 768) setScale(0.55);
      else if (width < 1280) setScale(0.64);
      else setScale(0.68);
    }
  }, []);

  // Charger le CV actif au montage, hydrater depuis le Cloud Supabase & synchroniser l'authentification
  useEffect(() => {
    const syncAuth = () => {
      const logged = StorageManager.isLoggedIn();
      setIsLoggedIn(logged);
      if (!logged) {
        setCloudSyncStatus("local");
      }
    };
    syncAuth();

    const active = StorageManager.getActiveResume();
    if (active) {
      setResumeData(active);
    }

    // Hydratation Cloud si l'utilisateur est connecté
    const user = StorageManager.getUser();
    if (user?.email) {
      setCloudSyncStatus("saving");
      SupabaseService.getResumes(user.email)
        .then((cloudList) => {
          if (cloudList && cloudList.length > 0) {
            const currentActiveId = StorageManager.getActiveResume()?.id;
            const match = cloudList.find((r) => r.id === currentActiveId) || cloudList[0];
            if (match) {
              setResumeData(match);
              StorageManager.saveActiveResume(match);
              setCloudSyncStatus("saved");
              const d = new Date();
              setLastSyncTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
            }
          } else if (active) {
            // Premier envoi du CV vers Supabase
            SupabaseService.syncResumeToCloud(active, user.email).then((res) => {
              if (res.success) setCloudSyncStatus("saved");
            });
          }
        })
        .catch(() => {
          setCloudSyncStatus("saved");
        });
    }

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  // Calcul automatique optimal au montage et redimensionnement
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToScreen();
    }, 150);

    const handleResize = () => {
      fitToScreen();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [fitToScreen]);

  // Recalcul immédiat lors du basculement d'onglet vers l'aperçu sur mobile
  useEffect(() => {
    if (viewTab === "preview") {
      const timer = setTimeout(() => fitToScreen(), 80);
      return () => clearTimeout(timer);
    }
  }, [viewTab, fitToScreen]);

  // Sauvegarder automatiquement : LocalStorage immédiat + Débounced Cloud Sync Full-Stack (700ms)
  const handleUpdateData = (updated: ResumeData) => {
    setResumeData(updated);
    StorageManager.saveActiveResume(updated);

    // Déclencher la synchronisation Cloud
    setCloudSyncStatus("saving");
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const user = StorageManager.getUser();
        const res = await SupabaseService.syncResumeToCloud(updated, user?.email);
        if (res.success) {
          setCloudSyncStatus("saved");
          const d = new Date();
          setLastSyncTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
        } else {
          setCloudSyncStatus(user?.email ? "error" : "local");
        }
      } catch (err) {
        setCloudSyncStatus("local");
      }
    }, 700);
  };

  // Téléchargement direct du PDF prévisualisé (immédiat et sans blocage)
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const success = await downloadResumePDF("cv-printable-page", resumeData);
    setIsDownloading(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  // Téléchargement natif Word (.docx) professionnel
  const handleDownloadWord = async () => {
    setIsDownloading(true);
    const success = await downloadResumeDocx(resumeData);
    setIsDownloading(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const isEnterpriseActive = StorageManager.isPersonalOffersOffered() || isEnterpriseFormulaActive(resumeData);
  const planTier = isEnterpriseActive ? "5000" : (resumeData.planTier || (resumeData.isPremium ? "2500" : "free"));
  const licenseStatus = getLicenseStatus(resumeData);

  // Ouverture Lettre IA (Inclus dès la formule Entreprise ou Pack Pro 2500 FCFA & VIP 5000 FCFA)
  const handleOpenCoverLetter = () => {
    requireAuth("coverLetter", () => {
      if (!isEnterpriseActive && (planTier === "free" || planTier === "1500")) {
        setPaymentDefaultPlan("2500");
        setIsPaymentOpen(true);
        return;
      }
      setIsCoverLetterOpen(true);
    });
  };

  // Ouverture Demande d'emploi (Inclus dès la formule Entreprise ou Pack Pro 2500 FCFA & VIP 5000 FCFA)
  const handleOpenJobApplication = () => {
    requireAuth("jobApplication", () => {
      if (!isEnterpriseActive && (planTier === "free" || planTier === "1500")) {
        setPaymentDefaultPlan("2500");
        setIsPaymentOpen(true);
        return;
      }
      setIsJobApplicationOpen(true);
    });
  };

  const handleResetData = () => {
    if (confirm("Voulez-vous réinitialiser ce CV avec le profil de démonstration ?")) {
      setResumeData(initialResumeData);
      StorageManager.saveActiveResume(initialResumeData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar
        onOpenPayment={() => { setPaymentDefaultPlan("2500"); setIsPaymentOpen(true); }}
        isEditorPage={true}
      />

      {/* Action Header Bar — Organisée en 3 pôles logiques */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 no-print">
        {/* Pôle Gauche : Titre du CV & Statut de Sauvegarde */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={resumeData.title}
            onChange={(e) =>
              handleUpdateData({ ...resumeData, title: e.target.value })
            }
            className="font-bold text-slate-900 text-sm bg-transparent border-b border-dashed border-slate-300 focus:border-blue-600 focus:outline-none px-1"
            title="Cliquez pour renommer ce CV"
          />
          <button
            type="button"
            onClick={handleResetData}
            title="Réinitialiser les données"
            className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Bouton RETOUR DANS L'ESPACE ENTREPRISE */}
          {(isEnterpriseActive || StorageManager.isBusinessAccount()) && (
            <Link
              href="/dashboard?tab=business"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("moncv_view_mode", "enterprise");
                  window.dispatchEvent(new Event("storage"));
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap border border-amber-400/50"
              title="Retourner à l'Espace Entreprise & Vivier RH"
            >
              <Building className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>RETOUR DANS L'ESPACE ENTREPRISE</span>
            </Link>
          )}

          {/* Indicateur Cloud Sync */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold"
            title={
              cloudSyncStatus === "saved"
                ? `Sauvegardé à ${lastSyncTime}`
                : cloudSyncStatus === "saving"
                ? "Synchronisation..."
                : "Enregistré en local"
            }
          >
            {cloudSyncStatus === "saving" ? (
              <span className="flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-600" />
                <span>Sync...</span>
              </span>
            ) : cloudSyncStatus === "saved" ? (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                <Cloud className="w-2.5 h-2.5 text-emerald-600" />
                <span>Sauvegardé ✓</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                <Cloud className="w-2.5 h-2.5 text-slate-400" />
                <span>Local</span>
              </span>
            )}
          </div>
        </div>

        {/* Pôle Centre : Outils IA & Documents de Candidature */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setIsATSOpen(true)}
            className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Analyser la compatibilité avec les logiciels recruteurs ATS"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Score ATS</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCoverLetter}
            className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-slate-800 hover:text-indigo-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Générer une Lettre de Motivation IA personnalisée"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Lettre IA</span>
          </button>

          <button
            type="button"
            onClick={handleOpenJobApplication}
            className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-900 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Rédiger la Demande d'Emploi Officielle"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            <span>Demande d'Emploi</span>
          </button>

          <Link
            href={`/c/${resumeData.slug || "demo"}`}
            target="_blank"
            className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-slate-800 hover:text-purple-900 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Consulter le Portfolio Web interactif"
          >
            <Globe className="w-3.5 h-3.5 text-purple-600" />
            <span>Portfolio Web</span>
          </Link>
        </div>

        {/* Pôle Droite : Actions d'Export & Partage */}
        <div className="flex items-center gap-2">
          {/* Mobile View Toggle */}
          <div className="flex xl:hidden bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewTab("editor")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewTab === "editor" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Saisie</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab("preview")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewTab === "preview" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Aperçu</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
            title="Partager le lien public ou QR Code"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Partager</span>
          </button>

          {/* Téléchargement Word (.docx) */}
          <button
            type="button"
            onClick={handleDownloadWord}
            disabled={isDownloading}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-200 transition-all cursor-pointer shadow-xs"
            title="Télécharger en fichier Microsoft Word (.docx)"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Word (.docx)</span>
          </button>

          {/* Télécharger PDF (Action Principale) */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`px-4 py-1.5 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              downloadSuccess
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            }`}
            title="Télécharger le CV au format PDF Haute Définition"
          >
            {isDownloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : downloadSuccess ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isDownloading ? "Génération..." : downloadSuccess ? "Téléchargé !" : "Télécharger PDF"}</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Colonne Éditeur & Questionnaire (7/12 sur grand écran) */}
        <div
          className={`xl:col-span-7 space-y-6 ${
            viewTab === "editor" ? "block" : "hidden xl:block"
          }`}
        >
          <QuestionnaireWizard
            resumeData={resumeData}
            onChangeData={handleUpdateData}
            onOpenATS={() => setIsATSOpen(true)}
            onOpenCoverLetter={() => setIsCoverLetterOpen(true)}
            onDownloadPDF={handleDownloadPDF}
            onDownloadWord={handleDownloadWord}
            onShare={() => setIsShareOpen(true)}
            onOpenPayment={() => setIsPaymentOpen(true)}
          />
        </div>

        {/* Colonne Aperçu A4 en Direct (5/12 sur grand écran) */}
        <div
          className={`xl:col-span-5 sticky top-20 ${
            viewTab === "preview" ? "block" : "hidden xl:block"
          }`}
        >
          {/* Zoom controls & Banner */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 mb-3 flex flex-wrap items-center justify-between gap-2 no-print shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                Aperçu Page A4
              </span>
              {isEnterpriseActive ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Crown className="w-3 h-3 text-amber-600" />
                  Offres Personnelles Offertes (Formule Entreprise)
                </span>
              ) : licenseStatus.isUnlocked ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Profil Débloqué (Illimité)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentDefaultPlan("1500");
                    setIsPaymentOpen(true);
                  }}
                  className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 cursor-pointer transition-all"
                  title="Supprimer le filigrane pour ce profil"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Retirer le filigrane (1 500 F)
                </button>
              )}
            </div>

            {/* Presets & Zoom Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fitToScreen}
                className="px-2 py-1 text-[10.5px] font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1 cursor-pointer btn-press"
                title="Ajuster automatiquement à la largeur de votre écran"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Ajuster</span>
              </button>

              <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

              <button
                type="button"
                onClick={() => setScale(0.46)}
                className={`px-1.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                  Math.abs(scale - 0.46) < 0.03 ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-100"
                }`}
                title="Zoom Mobile"
              >
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setScale(0.75)}
                className={`px-1.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                  Math.abs(scale - 0.75) < 0.03 ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-100"
                }`}
                title="Zoom 75%"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setScale(1)}
                className={`px-1.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                  Math.abs(scale - 1) < 0.03 ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-100"
                }`}
                title="Taille Réelle 100%"
              >
                100%
              </button>

              <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

              <button
                type="button"
                onClick={() => setScale((prev) => Math.max(0.35, prev - 0.05))}
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer btn-press"
                title="Zoomer en arrière"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-700 min-w-[34px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((prev) => Math.min(1.2, prev + 0.05))}
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer btn-press"
                title="Zoomer en avant"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Alerte Pédagogique si Changement d'Identité Détecté */}
          {!isEnterpriseActive && licenseStatus.isNameChangedFromPrimary && (
            <div className="mb-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs no-print">
              <div className="flex items-start gap-2.5 text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-900">Nouvelle identité détectée</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Votre formule a activé le CV de <strong>{licenseStatus.primaryDisplayName}</strong>. Pour exporter le CV de <strong>{licenseStatus.candidateDisplayName}</strong> sans filigrane, activez ce nouveau profil ou passez au Pack Multi-Profils.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentDefaultPlan("1500");
                  setIsPaymentOpen(true);
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 cursor-pointer shadow-xs text-xs whitespace-nowrap"
              >
                Activer ce profil (1 500 F)
              </button>
            </div>
          )}

          {/* Canvas A4 */}
          <div
            ref={previewContainerRef}
            className="w-full flex justify-center bg-slate-200/70 p-2 sm:p-4 rounded-3xl border border-slate-300/70 overflow-x-auto min-h-[600px] shadow-inner"
          >
            <CVPreviewCanvas ref={previewRef} data={resumeData} scale={scale} />
          </div>

          {/* Barre d'information & conformité sous le canvas */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-slate-200 no-print shadow-xs text-xs">
            <div className="text-slate-600 flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Format A4 officiel calibré • Marges 1,5 cm • 100% conforme aux filtres ATS</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Synchronisation Cloud temps réel</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton Flottant Mobile d'Alternance (Édition <-> Aperçu A4) */}
      <div className="fixed bottom-5 right-5 z-30 xl:hidden no-print">
        {viewTab === "editor" ? (
          <button
            type="button"
            onClick={() => {
              setViewTab("preview");
              fitToScreen();
            }}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs rounded-2xl shadow-xl shadow-blue-600/35 cursor-pointer btn-press animate-pulse-glow"
          >
            <Eye className="w-4 h-4" />
            <span>Voir le CV (Aperçu A4)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setViewTab("editor")}
            className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white font-black text-xs rounded-2xl shadow-xl shadow-slate-900/35 cursor-pointer btn-press"
          >
            <Edit3 className="w-4 h-4" />
            <span>Retourner à la Saisie</span>
          </button>
        )}
      </div>

      {/* Modals & Tools */}
      <ATSOptimizerModal
        isOpen={isATSOpen}
        onClose={() => setIsATSOpen(false)}
        resumeData={resumeData}
        onApplyOptimization={handleUpdateData}
      />

      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        resumeData={resumeData}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        resumeData={resumeData}
      />

      <MobileMoneyModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        defaultPlan={paymentDefaultPlan}
        onSuccess={() => {
          const fresh = StorageManager.getActiveResume();
          if (fresh) {
            setResumeData(fresh);
          }
        }}
      />

      {/* Nouveaux Modals */}
      <JobApplicationModal
        isOpen={isJobApplicationOpen}
        onClose={() => setIsJobApplicationOpen(false)}
        resumeData={resumeData}
      />

      <ScanConvertModal
        isOpen={isScanConvertOpen}
        onClose={() => setIsScanConvertOpen(false)}
        resumeData={resumeData}
      />

      <SmartGenerateModal
        isOpen={isSmartGenerateOpen}
        onClose={() => setIsSmartGenerateOpen(false)}
        onGenerate={(generated) => {
          handleUpdateData(generated);
        }}
      />

      {/* Auth Modal — déclenché par Lettre IA, Demande d'emploi, Générer CV, Nouveau CV */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => { setIsAuthOpen(false); setPendingAction(null); }}
        onSuccess={() => {
          setIsLoggedIn(true);
          setIsAuthOpen(false);
          if (pendingAction === "coverLetter") setIsCoverLetterOpen(true);
          else if (pendingAction === "jobApplication") setIsJobApplicationOpen(true);
          else if (pendingAction === "smartGenerate") setIsSmartGenerateOpen(true);
          setPendingAction(null);
        }}
        defaultMode="register"
      />
    </div>
  );
}
