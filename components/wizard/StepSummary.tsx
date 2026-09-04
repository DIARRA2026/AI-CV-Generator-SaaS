"use client";

import React, { useState } from "react";
import { ProfileType } from "@/lib/types";
import { CVEngine } from "@/lib/cv-engine";
import { Sparkles, Wand2, Check, RefreshCw } from "lucide-react";

interface StepSummaryProps {
  summary: string;
  roleTitle: string;
  profileType: ProfileType;
  onChangeSummary: (val: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepSummary: React.FC<StepSummaryProps> = ({
  summary,
  roleTitle,
  profileType,
  onChangeSummary,
  onNext,
  onPrev,
}) => {
  const [rawPrompt, setRawPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "summary",
          prompt: rawPrompt || summary,
          roleTitle,
          profileType,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          onChangeSummary(json.data.main);
          setSuggestions(json.data.variants || []);
          setIsGenerating(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Repli sur moteur IA local pour StepSummary:", e);
    }
    // Fallback local instantané
    const result = CVEngine.enhanceSummary(rawPrompt || summary, roleTitle, profileType);
    onChangeSummary(result.main);
    setSuggestions(result.variants);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 slide-up max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
          Étape 3 sur 8 — Présentation Professionnelle
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Parlez-nous brièvement de vous
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Écrivez simplement quelques mots. Notre IA formulera une synthèse digne d'un cadre supérieur.
        </p>
      </div>

      {/* Assistant IA Instantané */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 space-y-3">
        <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Assistant de Rédaction IA</span>
        </div>
        <p className="text-xs text-blue-800/80">
          Exemple : <em>"J'ai travaillé 3 ans dans la vente de téléphones et je veux être responsable commercial"</em>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Écrivez votre parcours ou vos points forts ici..."
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          />
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            {isGenerating ? "Optimisation..." : "Générer avec l'IA"}
          </button>
        </div>
      </div>

      {/* Zone d'édition du résumé */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Votre profil rédigé pour le CV
          </label>
          <span className="text-[11px] text-slate-400">
            {summary.length} caractères
          </span>
        </div>
        <textarea
          rows={4}
          value={summary}
          onChange={(e) => onChangeSummary(e.target.value)}
          placeholder="Ex: Commercial dynamique et orienté résultats avec 3 années d'expérience..."
          className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
        />
      </div>

      {/* Variantes alternatives suggérées par l'IA */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">
            Variantes alternatives proposées par l'IA :
          </p>
          <div className="space-y-2">
            {suggestions.map((variant, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all flex items-start justify-between gap-3 text-xs text-slate-700"
              >
                <p className="flex-1 leading-relaxed">{variant}</p>
                <button
                  type="button"
                  onClick={() => onChangeSummary(variant)}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium text-[11px] shrink-0"
                >
                  Utiliser
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all text-sm"
        >
          ← Précédent
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-600/20 transition-all text-sm flex items-center gap-2"
        >
          Continuer vers vos expériences
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
