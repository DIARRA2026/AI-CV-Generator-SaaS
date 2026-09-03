"use client";

import React from "react";
import { ResumeData, TemplateId } from "@/lib/types";
import { Check, Palette, Sparkles, Layout, Type, Download, Share2, Crown, Eye, EyeOff } from "lucide-react";

interface StepDesignCustomizerProps {
  design: ResumeData["design"];
  onChangeDesign: (field: keyof ResumeData["design"], val: any) => void;
  onOpenATS: () => void;
  onOpenCoverLetter: () => void;
  onDownloadPDF: () => void;
  onShare: () => void;
  onOpenPayment: () => void;
}

export const StepDesignCustomizer: React.FC<StepDesignCustomizerProps> = ({
  design,
  onChangeDesign,
  onOpenATS,
  onOpenCoverLetter,
  onDownloadPDF,
  onShare,
  onOpenPayment,
}) => {
  const templates: { id: TemplateId; name: string; desc: string; badge: string }[] = [
    { id: "modern", name: "Moderne", desc: "Sidebar colorée avec en-tête structuré", badge: "Populaire" },
    { id: "elegant", name: "Élégant", desc: "Typographie de prestige & lignes fines", badge: "Cadres & Pro" },
    { id: "corporate", name: "Corporate", desc: "En-tête exécutif et double colonne", badge: "Banque & Conseil" },
    { id: "minimal", name: "Minimaliste", desc: "Design scandinave aéré et clair", badge: "Tech & Design" },
    { id: "creative", name: "Créatif", desc: "Bandeau moderne & tags stylisés", badge: "Marketing" },
    { id: "ats", name: "ATS Pur", desc: "Structure 100% optimisée pour les robots RH", badge: "Recommandé ATS" },
  ];

  const colorPresets = [
    { name: "Bleu Royal", value: "#2563eb" },
    { name: "Noir Élégant", value: "#1e293b" },
    { name: "Vert Émeraude", value: "#059669" },
    { name: "Violet Profond", value: "#7c3aed" },
    { name: "Orange Dynamique", value: "#ea580c" },
    { name: "Rouge Rubis", value: "#dc2626" },
  ];

  return (
    <div className="space-y-6 slide-up max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold mb-2">
          🎨 Personnalisation & Rendu
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Votre CV est prêt ! Personnalisez son design
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Basculez entre nos 6 modèles haute fidélité et ajustez la palette de couleurs en 1 clic.
        </p>
      </div>

      {/* 1. Choix du Template */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Layout className="w-4 h-4 text-blue-600" />
          Modèle de CV (6 Templates)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {templates.map((t) => {
            const isSel = design.template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeDesign("template", t.id)}
                className={`p-3 rounded-xl text-left border-2 transition-all relative ${
                  isSel
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                  {isSel && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                </div>
                <p className="text-[10.5px] text-slate-500 leading-snug">{t.desc}</p>
                <span className="inline-block mt-2 text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {t.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Choix des Couleurs & Options Photo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-blue-600" />
            Couleur Thématique
          </label>
          <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl">
            {colorPresets.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onChangeDesign("primaryColor", c.value)}
                title={c.name}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  design.primaryColor === c.value
                    ? "ring-2 ring-offset-2 ring-blue-600 scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
              >
                {design.primaryColor === c.value && (
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                )}
              </button>
            ))}

            <label className="text-xs text-slate-600 font-medium cursor-pointer flex items-center gap-1 pl-1">
              <input
                type="color"
                value={design.primaryColor}
                onChange={(e) => onChangeDesign("primaryColor", e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-blue-600" />
            Affichage de la photo
          </label>
          <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">
              {design.showPhoto ? "Photo activée sur le CV" : "Photo masquée"}
            </span>
            <button
              type="button"
              onClick={() => onChangeDesign("showPhoto", !design.showPhoto)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                design.showPhoto
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {design.showPhoto ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {design.showPhoto ? "Affichée" : "Masquée"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Actions Rapides (ATS, Lettre IA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onOpenATS}
          className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl text-left hover:border-emerald-300 transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Optimiseur ATS IA</h4>
            <p className="text-[11px] text-emerald-800/80">Collez une offre pour tester la compatibilité</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenCoverLetter}
          className="p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl text-left hover:border-indigo-300 transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Lettre de Motivation IA</h4>
            <p className="text-[11px] text-indigo-800/80">Générer une lettre synchronisée au CV</p>
          </div>
        </button>
      </div>

      {/* 4. Bouton Principal de Téléchargement Direct & Partage */}
      <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">
            Prêt à postuler ? Téléchargez votre CV
          </h3>
          <p className="text-xs text-blue-200 mt-0.5">
            Génère et enregistre immédiatement le fichier PDF sur votre appareil.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onShare}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/20"
          >
            <Share2 className="w-4 h-4" />
            <span>QR & Partage</span>
          </button>
          <button
            type="button"
            onClick={onDownloadPDF}
            className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger le PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
