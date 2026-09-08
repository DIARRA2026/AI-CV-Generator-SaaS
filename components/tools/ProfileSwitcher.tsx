"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  User,
  Building,
  Check,
  ChevronDown,
  Plus,
  LayoutDashboard,
  Globe,
  Sparkles,
  ArrowRight,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { StorageManager } from "@/lib/storage";
import { ResumeData } from "@/lib/types";

interface ProfileSwitcherProps {
  currentSlug?: string;
  className?: string;
  isDark?: boolean;
}

export const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({
  currentSlug,
  className = "",
  isDark = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeData | null>(null);
  const [isBusiness, setIsBusiness] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const loadData = () => {
    const list = StorageManager.getResumes();
    setResumes(list);

    const active = StorageManager.getActiveResume();
    setActiveResume(active);

    const biz = StorageManager.isBusinessAccount();
    setIsBusiness(biz);

    const user = StorageManager.getUser();
    if (user?.business?.companyName) {
      setCompanyName(user.business.companyName);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorage = () => loadData();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentDisplayedResume =
    (currentSlug && resumes.find((r) => r.slug === currentSlug || r.id === currentSlug)) ||
    activeResume ||
    resumes[0] ||
    null;

  const currentDisplayName = currentDisplayedResume
    ? `${currentDisplayedResume.personal.firstName || ""} ${
        currentDisplayedResume.personal.lastName || ""
      }`.trim() || currentDisplayedResume.title
    : "Sélectionner un profil";

  const currentRole = currentDisplayedResume?.personal.title || "Candidat";

  const handleSelectResume = (cv: ResumeData) => {
    StorageManager.saveActiveResume(cv);
    setActiveResume(cv);
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("moncv_view_mode", "client");
      window.dispatchEvent(new Event("storage"));
    }
    const targetSlug = cv.slug || cv.id;
    router.push(`/c/${targetSlug}`);
  };

  const handleGoToEnterprise = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("moncv_view_mode", "enterprise");
      window.dispatchEvent(new Event("storage"));
    }
    setIsOpen(false);
    router.push("/dashboard?tab=business");
  };

  const handleGoToDashboard = () => {
    setIsOpen(false);
    router.push("/dashboard");
  };

  const handleGoToLanding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("moncv_view_mode", "landing");
      window.dispatchEvent(new Event("storage"));
    }
    setIsOpen(false);
    router.push("/?landing=true");
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    router.push("/create");
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Bouton Déclencheur du Sélecteur de Profil */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs hover:scale-105 active:scale-95 whitespace-nowrap ${
          isDark
            ? "bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 shadow-slate-950/40"
            : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs"
        }`}
        title="Changer de profil client ou d'espace"
      >
        <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
          {currentDisplayedResume?.personal.firstName?.[0]?.toUpperCase() || "P"}
        </div>

        <div className="flex flex-col text-left leading-none">
          <span className="text-[11px] font-black truncate max-w-[130px] sm:max-w-[170px]">
            {currentDisplayName}
          </span>
          <span className="text-[9px] text-blue-500 dark:text-blue-400 font-medium truncate max-w-[130px] sm:max-w-[170px]">
            {currentRole}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-500" : ""
          }`}
        />
      </button>

      {/* Menu Déroulant du Changement de Profil */}
      {isOpen && (
        <div
          className={`absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 max-w-[90vw] rounded-2xl shadow-2xl border p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
            isDark
              ? "bg-[#111218] border-slate-800 text-slate-200 shadow-black/80"
              : "bg-white border-slate-200 text-slate-800 shadow-slate-900/15"
          }`}
        >
          {/* En-tête du menu */}
          <div
            className={`px-3 py-2 rounded-xl mb-2 flex items-center justify-between border ${
              isDark ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-100"
            }`}
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Changement de Profil
              </span>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Afficher la page exclusive du client
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 text-[10px] font-black">
              {resumes.length} profil(s)
            </span>
          </div>

          {/* Liste des Profils Clients */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Profils Clients Disponibles
            </div>

            {resumes.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                Aucun profil enregistré pour le moment.
              </div>
            ) : (
              resumes.map((cv) => {
                const fullName = `${cv.personal.firstName || ""} ${
                  cv.personal.lastName || ""
                }`.trim() || cv.title;
                const isCurrent =
                  currentDisplayedResume?.id === cv.id ||
                  (currentSlug && (cv.slug === currentSlug || cv.id === currentSlug));

                return (
                  <button
                    key={cv.id}
                    type="button"
                    onClick={() => handleSelectResume(cv)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      isCurrent
                        ? isDark
                          ? "bg-blue-950/60 text-white border border-blue-800/80"
                          : "bg-blue-50 text-blue-950 border border-blue-200/80 font-bold"
                        : isDark
                        ? "hover:bg-slate-900 text-slate-300"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : isDark
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {cv.personal.firstName?.[0]?.toUpperCase() || "C"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold truncate text-xs">{fullName}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {cv.personal.title || "Poste non défini"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9.5px] font-black flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          Actif
                        </span>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

          {/* Raccourcis et Actions Globales */}
          <div className="space-y-1">
            {isBusiness && (
              <button
                type="button"
                onClick={handleGoToEnterprise}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  isDark
                    ? "text-amber-300 hover:bg-amber-950/40"
                    : "text-amber-900 hover:bg-amber-50"
                }`}
              >
                <Building className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex-1 truncate">
                  <span>Espace Entreprise</span>
                  {companyName ? (
                    <span className="text-[10px] block text-slate-400 font-normal truncate">
                      {companyName}
                    </span>
                  ) : null}
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={handleGoToDashboard}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                isDark ? "text-slate-300 hover:bg-slate-900" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Gérer les profils (Tableau de bord)</span>
            </button>

            <button
              type="button"
              onClick={handleGoToLanding}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                isDark ? "text-slate-300 hover:bg-slate-900" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Accueil Découverte MonCV.ai (Site public)</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                isDark
                  ? "text-blue-400 hover:bg-blue-950/40"
                  : "text-blue-700 hover:bg-blue-50"
              }`}
            >
              <Plus className="w-4 h-4 text-blue-600 shrink-0" />
              <span>+ Créer un nouveau profil client</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
