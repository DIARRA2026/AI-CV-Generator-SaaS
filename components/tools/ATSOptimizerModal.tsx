"use client";

import React, { useState } from "react";
import { ResumeData, ATSAnalysisResult } from "@/lib/types";
import { ATSEngine } from "@/lib/ats-engine";
import { X, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Wand2, ArrowRight } from "lucide-react";

interface ATSOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  onApplyOptimization: (updatedResume: ResumeData) => void;
}

export const ATSOptimizerModal: React.FC<ATSOptimizerModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  onApplyOptimization,
}) => {
  const [jobText, setJobText] = useState(
    `Offre : Responsable Commercial B2B\nEntreprise : Groupe Leader Distribution\n\nMissions :\n- Prospection active et développement du portefeuille B2B.\n- Négociation de contrats stratégiques et closing des opportunités.\n- Utilisation quotidienne de Salesforce / CRM et reporting hebdomadaire des KPIs.\n- Encadrement d'une équipe de vente et pilotage du chiffre d'affaires.\n\nProfil recherché :\n- Expérience d'au moins 3 ans dans la vente commerciale.\n- Maîtrise des techniques de closing et prospection.\n- Bon niveau en anglais et maîtrise d'Excel.`
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ATSAnalysisResult | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!jobText.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ats_analysis",
          resumeData,
          jobText,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setResult(json.data);
          setIsAnalyzing(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Repli sur moteur ATS local:", e);
    }
    const res = ATSEngine.analyze(resumeData, jobText);
    setResult(res);
    setIsAnalyzing(false);
  };

  const handleApplyAll = () => {
    if (!result) return;
    const updated = { ...resumeData };
    result.optimizedBulletPoints.forEach((opt) => {
      const expIdx = updated.experiences.findIndex((e) => e.id === opt.experienceId);
      if (expIdx !== -1 && updated.experiences[expIdx].highlights.length > 0) {
        updated.experiences[expIdx].highlights[0] = opt.after;
      }
    });
    onApplyOptimization(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Optimiseur de Compatibilité ATS
              </h3>
              <p className="text-xs text-slate-500">
                Analysez votre CV face à une offre d'emploi réelle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Collez la description de l'offre d'emploi :
            </label>
            <textarea
              rows={4}
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Collez ici l'annonce ou le descriptif du poste..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-mono"
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !jobText.trim()}
              className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isAnalyzing ? "Analyse sémantique en cours..." : "Lancer l'audit de compatibilité"}
            </button>
          </div>

          {/* Résultats de l'analyse */}
          {result && (
            <div className="space-y-5 slide-up">
              {/* Score Match */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Score de Compatibilité ATS
                  </h4>
                  <p className="text-xs text-slate-600">
                    Niveau de correspondance avec les filtres des recruteurs
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-600">
                    {result.matchScore}%
                  </span>
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase">
                    {result.matchScore >= 80 ? "Excellente adéquation" : "Améliorations conseillées"}
                  </p>
                </div>
              </div>

              {/* Mots-clés Matchés vs Manquants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h5 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Mots-clés présents ({result.matchedKeywords.length})
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {result.matchedKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="bg-emerald-100/80 text-emerald-900 text-[10px] font-medium px-2 py-0.5 rounded"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h5 className="text-xs font-bold text-rose-700 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Mots-clés manquants ({result.missingKeywords.length})
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {result.missingKeywords.length > 0 ? (
                      result.missingKeywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="bg-rose-100/80 text-rose-900 text-[10px] font-medium px-2 py-0.5 rounded"
                        >
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        Aucun mot-clé critique manquant !
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions d'optimisation ciblées */}
              {result.optimizedBulletPoints.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Ajustements suggérés (sans inventer d'expérience) :
                  </h5>
                  {result.optimizedBulletPoints.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs"
                    >
                      <p className="text-slate-400 line-through text-[11px]">{opt.before}</p>
                      <p className="text-slate-900 font-semibold text-[11.5px] flex items-center gap-1.5 text-emerald-800">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {opt.after}
                      </p>
                      <p className="text-[10px] text-slate-500 italic">{opt.reason}</p>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleApplyAll}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    ✨ Appliquer ces optimisations à mon CV
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
