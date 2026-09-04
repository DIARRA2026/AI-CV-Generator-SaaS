"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ResumeData } from "@/lib/types";
import { initialResumeData } from "@/lib/initialData";
import { StorageManager } from "@/lib/storage";
import { downloadResumePDF } from "@/lib/pdf-export";
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

    // Détection de la taille d'écran pour un zoom initial parfaitement adapté
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width < 450) {
        setScale(0.46);
      } else if (width < 768) {
        setScale(0.58);
      } else if (width < 1280) {
        setScale(0.68);
      } else {
        setScale(0.76);
      }
    }

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const fitToScreen = () => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width < 450) setScale(0.46);
      else if (width < 768) setScale(0.58);
      else if (width < 1280) setScale(0.68);
      else setScale(0.76);
    }
  };

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

  // Téléchargement direct du PDF prévisualisé (respect de l'offre)
  const handleDownloadPDF = async () => {
    // Si compte gratuit, l'offre gratuite spécifie "Téléchargement PDF désactivé / avec filigrane"
    if (!resumeData.isPremium || resumeData.planTier === "free") {
      setPaymentDefaultPlan("1500");
      setIsPaymentOpen(true);
      return;
    }

    setIsDownloading(true);
    const success = await downloadResumePDF("cv-printable-page", resumeData);
    setIsDownloading(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const planTier = resumeData.planTier || (resumeData.isPremium ? "2500" : "free");

  // Ouverture Lettre IA (Inclus à partir du Pack Pro 2500 FCFA & VIP 5000 FCFA)
  const handleOpenCoverLetter = () => {
    requireAuth("coverLetter", () => {
      if (planTier === "free" || planTier === "1500") {
        setPaymentDefaultPlan("2500");
        setIsPaymentOpen(true);
        return;
      }
      setIsCoverLetterOpen(true);
    });
  };

  // Ouverture Demande d'emploi (Inclus à partir du Pack Pro 2500 FCFA & VIP 5000 FCFA)
  const handleOpenJobApplication = () => {
    requireAuth("jobApplication", () => {
      if (planTier === "free" || planTier === "1500") {
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
      <Navbar onOpenPayment={() => { setPaymentDefaultPlan("2500"); setIsPaymentOpen(true); }} />

      {/* Action Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={resumeData.title}
            onChange={(e) =>
              handleUpdateData({ ...resumeData, title: e.target.value })
            }
            className="font-bold text-slate-900 text-sm bg-transparent border-b border-dashed border-slate-300 focus:border-blue-600 focus:outline-none px-1"
          />
          <button
            type="button"
            onClick={handleResetData}
            title="Réinitialiser"
            className="text-slate-400 hover:text-slate-600 text-xs p-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Indicateur Full-Stack Cloud Auto-Save */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all"
          title={
            cloudSyncStatus === "saved"
              ? `Dernière synchronisation cloud à ${lastSyncTime}`
              : cloudSyncStatus === "saving"
              ? "Synchronisation vers la base de données cloud..."
              : "Enregistrement en local"
          }
        >
          {cloudSyncStatus === "saving" ? (
            <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50/90 border border-blue-200 px-2 py-0.5 rounded-lg">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
              <span className="text-[10.5px] font-black">Cloud Sync...</span>
            </span>
          ) : cloudSyncStatus === "saved" ? (
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2 py-0.5 rounded-lg">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10.5px] font-black">Cloud Synced ✓</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
              <Cloud className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10.5px] font-semibold">Local</span>
            </span>
          )}
        </div>

        {/* Badge Offre Active (Respect des Formules) */}
        <div className="hidden md:flex items-center gap-2">
          {planTier === "5000" ? (
            <div className="px-2.5 py-1 bg-purple-100 border border-purple-200 text-purple-900 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Pack VIP & Portfolio</span>
              <a
                href="https://wa.me/2250700000000?text=Bonjour%20Support%20VIP%20MonCV.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                title="Support WhatsApp 7j/7 dédié"
              >
                WhatsApp VIP
              </a>
            </div>
          ) : planTier === "2500" ? (
            <div className="px-2.5 py-1 bg-blue-100 border border-blue-200 text-blue-900 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Pack Candidature Pro</span>
            </div>
          ) : planTier === "1500" ? (
            <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pack Essentiel</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPaymentDefaultPlan("2500");
                setIsPaymentOpen(true);
              }}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Offre Découverte</span>
              <span className="text-blue-600 underline font-extrabold text-[11px]">Passer en Pro</span>
            </button>
          )}
        </div>

        {/* Mobile View Toggle */}
        <div className="flex xl:hidden bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewTab("editor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewTab === "editor"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Éditeur</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab("preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewTab === "preview"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Aperçu CV</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsATSOpen(true)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Scanner ATS</span>
          </button>

          {/* Lettre IA (Vérifie Pack Pro 2500F ou VIP) */}
          <button
            type="button"
            onClick={handleOpenCoverLetter}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-200 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Lettre IA</span>
          </button>

          {/* Demande d'emploi (Vérifie Pack Pro 2500F ou VIP) */}
          <button
            type="button"
            onClick={handleOpenJobApplication}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-blue-200 transition-all cursor-pointer btn-press"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Demande d'emploi</span>
          </button>

          {/* Portfolio Web VIP */}
          <Link
            href={`/c/${resumeData.slug || "demo"}`}
            target="_blank"
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-purple-200 transition-all cursor-pointer btn-press"
            title="Ouvrir le Portfolio Web Moderne"
          >
            <Globe className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Portfolio Web</span>
            <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-black">VIP</span>
          </Link>

          {/* Scanner / Convertir */}
          <button
            type="button"
            onClick={() => setIsScanConvertOpen(true)}
            className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-violet-200 transition-all"
          >
            <ScanLine className="w-3.5 h-3.5 text-violet-600" />
            <span className="hidden sm:inline">Scanner / Convertir</span>
          </button>

          {/* Générer un CV → auth requise */}
          <button
            type="button"
            onClick={() => requireAuth("smartGenerate", () => setIsSmartGenerateOpen(true))}
            className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Générer un CV</span>
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
              <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Fidèle
              </span>
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

          {/* Canvas A4 */}
          <div className="w-full flex justify-center bg-slate-200/70 p-2 sm:p-4 rounded-3xl border border-slate-300/70 overflow-x-auto min-h-[600px] shadow-inner">
            <CVPreviewCanvas ref={previewRef} data={resumeData} scale={scale} />
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
