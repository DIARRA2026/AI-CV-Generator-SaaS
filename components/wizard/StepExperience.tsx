"use client";

import React, { useState } from "react";
import { ExperienceItem, ProfileType } from "@/lib/types";
import { CVEngine } from "@/lib/cv-engine";
import { Plus, Trash2, Sparkles, Wand2, Briefcase, Calendar, MapPin, Building, ChevronDown, ChevronUp } from "lucide-react";

interface StepExperienceProps {
  experiences: ExperienceItem[];
  profileType: ProfileType;
  onChangeExperiences: (experiences: ExperienceItem[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepExperience: React.FC<StepExperienceProps> = ({
  experiences,
  profileType,
  onChangeExperiences,
  onNext,
  onPrev,
}) => {
  const [expandedId, setExpandedId] = useState<string>(
    experiences[0]?.id || ""
  );
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);

  const handleAddExperience = () => {
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: "Nouveau Poste",
      company: "Nom de l'entreprise",
      city: "Abidjan",
      startDate: "2023",
      endDate: "Présent",
      current: true,
      rawInput: "",
      highlights: [
        "Prise en charge des missions clés et coordination avec l'équipe opérationnelle.",
        "Atteinte des objectifs fixés avec rigueur et réactivité."
      ],
    };
    const updated = [newExp, ...experiences];
    onChangeExperiences(updated);
    setExpandedId(newExp.id);
  };

  const handleUpdateExp = (id: string, updates: Partial<ExperienceItem>) => {
    const updated = experiences.map((e) => (e.id === id ? { ...e, ...updates } : e));
    onChangeExperiences(updated);
  };

  const handleDeleteExp = (id: string) => {
    const updated = experiences.filter((e) => e.id !== id);
    onChangeExperiences(updated);
  };

  const handleAITransform = (exp: ExperienceItem) => {
    setIsEnhancing(exp.id);
    setTimeout(() => {
      const bullets = CVEngine.enhanceExperienceBullets(
        exp.rawInput || exp.role,
        exp.role,
        exp.company
      );
      handleUpdateExp(exp.id, { highlights: bullets });
      setIsEnhancing(null);
    }, 450);
  };

  const handleAddBullet = (expId: string) => {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp) return;
    const newBullets = [...exp.highlights, "Nouvelle réalisation ou responsabilité clé."];
    handleUpdateExp(expId, { highlights: newBullets });
  };

  const handleUpdateBullet = (expId: string, index: number, text: string) => {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp) return;
    const newBullets = [...exp.highlights];
    newBullets[index] = text;
    handleUpdateExp(expId, { highlights: newBullets });
  };

  const handleDeleteBullet = (expId: string, index: number) => {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp) return;
    const newBullets = exp.highlights.filter((_, i) => i !== index);
    handleUpdateExp(expId, { highlights: newBullets });
  };

  return (
    <div className="space-y-6 slide-up max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
          Étape 4 sur 8 — Vos Expériences
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Quels postes avez-vous occupés ?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Décrivez brièvement ce que vous faisiez. L'IA génère automatiquement des puces professionnelles orientées résultats.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900 text-sm">
          Vos Expériences ({experiences.length})
        </h3>
        <button
          type="button"
          onClick={handleAddExperience}
          className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Ajouter une expérience
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm text-slate-500 mb-3">
            Aucune expérience ajoutée pour le moment.
          </p>
          <button
            type="button"
            onClick={handleAddExperience}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            + Ajouter mon premier poste
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp, idx) => {
            const isExpanded = expandedId === exp.id;
            return (
              <div
                key={exp.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isExpanded ? "border-blue-300 shadow-md ring-1 ring-blue-100" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header de la carte */}
                <div
                  onClick={() => setExpandedId(isExpanded ? "" : exp.id)}
                  className="p-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{exp.role || "Poste non renseigné"}</h4>
                      <p className="text-xs text-slate-500">
                        {exp.company} • {exp.startDate} à {exp.current ? "Présent" : exp.endDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExp(exp.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Formulaire détaillé */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Intitulé du poste
                        </label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => handleUpdateExp(exp.id, { role: e.target.value })}
                          placeholder="Ex: Commercial B2B"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Entreprise / Organisation
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleUpdateExp(exp.id, { company: e.target.value })}
                          placeholder="Ex: Ivoire Télécom"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ville
                        </label>
                        <input
                          type="text"
                          value={exp.city}
                          onChange={(e) => handleUpdateExp(exp.id, { city: e.target.value })}
                          placeholder="Ex: Abidjan"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Date début
                          </label>
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => handleUpdateExp(exp.id, { startDate: e.target.value })}
                            placeholder="Janv. 2022"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Date fin
                          </label>
                          <input
                            type="text"
                            disabled={exp.current}
                            value={exp.current ? "Présent" : exp.endDate}
                            onChange={(e) => handleUpdateExp(exp.id, { endDate: e.target.value })}
                            placeholder="2024"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs disabled:bg-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => handleUpdateExp(exp.id, { current: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor={`current-${exp.id}`} className="text-xs text-slate-700 cursor-pointer">
                        Poste actuellement occupé
                      </label>
                    </div>

                    {/* Zone d'assistance IA pour les bullet points */}
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Générateur de Réalisations IA
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAITransform(exp)}
                          disabled={isEnhancing === exp.id}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
                        >
                          <Wand2 className="w-3 h-3" />
                          {isEnhancing === exp.id ? "Transformation..." : "Transformer en puces IA"}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Ex: Je vendais des téléphones, gérais les clients et faisais le reporting..."
                        value={exp.rawInput || ""}
                        onChange={(e) => handleUpdateExp(exp.id, { rawInput: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                      />
                    </div>

                    {/* Liste des puces de réalisations */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        Points clés de votre mission sur le CV :
                      </label>
                      {exp.highlights.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => handleUpdateBullet(exp.id, bIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteBullet(exp.id, bIdx)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddBullet(exp.id)}
                        className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1 pt-1"
                      >
                        + Ajouter une ligne de réalisation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
          Continuer vers vos formations
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
