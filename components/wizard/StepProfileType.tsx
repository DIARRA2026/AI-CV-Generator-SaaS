"use client";

import React from "react";
import { ProfileType } from "@/lib/types";
import { GraduationCap, Briefcase, UserCheck, RefreshCw, Globe, Target, Check } from "lucide-react";

interface StepProfileTypeProps {
  value: ProfileType;
  onChange: (val: ProfileType) => void;
  onNext: () => void;
}

export const StepProfileType: React.FC<StepProfileTypeProps> = ({
  value,
  onChange,
  onNext,
}) => {
  const options: {
    id: ProfileType;
    icon: React.ReactNode;
    title: string;
    description: string;
    badge: string;
  }[] = [
    {
      id: "student",
      icon: <GraduationCap className="w-6 h-6 text-blue-600" />,
      title: "Étudiant & Jeune Diplômé",
      description: "Valorise votre formation, vos projets académiques et vos stages clés.",
      badge: "Formation en premier",
    },
    {
      id: "professional",
      icon: <Briefcase className="w-6 h-6 text-indigo-600" />,
      title: "Professionnel Expérimenté",
      description: "Met l'accent sur vos réalisations chiffrées, responsabilités et compétences.",
      badge: "Expérience & Métriques",
    },
    {
      id: "no_exp",
      icon: <UserCheck className="w-6 h-6 text-emerald-600" />,
      title: "Sans Expérience / Débutant",
      description: "Met en lumière vos savoir-être (soft skills), motivations et polyvalence.",
      badge: "Compétences & Atouts",
    },
    {
      id: "career_change",
      icon: <RefreshCw className="w-6 h-6 text-purple-600" />,
      title: "Reconversion Professionnelle",
      description: "Valorise vos compétences transférables et la cohérence de votre nouveau projet.",
      badge: "Compétences transférables",
    },
    {
      id: "international",
      icon: <Globe className="w-6 h-6 text-amber-600" />,
      title: "Candidature Internationale",
      description: "Structure standardisée adaptée aux standards mondiaux et multilingues.",
      badge: "Standard global",
    },
    {
      id: "specific_job",
      icon: <Target className="w-6 h-6 text-rose-600" />,
      title: "Candidature Ciblée / Offre Précise",
      description: "Optimisé sur-mesure pour matcher les mots-clés d'une offre d'emploi donnée.",
      badge: "Optimisé pour une offre",
    },
  ];

  return (
    <div className="space-y-6 slide-up">
      <div className="text-center max-w-lg mx-auto">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
          Étape 1 sur 8 — Votre Profil
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Quel type de profil souhaitez-vous créer ?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          L'assistant adaptera automatiquement la structure et le ton de votre CV.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-2xl mx-auto">
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
              }}
              className={`p-4 rounded-xl text-left border-2 transition-all flex items-start gap-3.5 relative ${
                isSelected
                  ? "border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-600/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
              }`}
            >
              <div className="p-2.5 rounded-lg bg-white border border-slate-100 shadow-sm shrink-0">
                {opt.icon}
              </div>
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{opt.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{opt.description}</p>
                <span className="inline-block mt-2 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {opt.badge}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-600/25 transition-all text-sm flex items-center gap-2"
        >
          Continuer vers vos informations
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
