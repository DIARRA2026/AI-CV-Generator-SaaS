"use client";

import React, { useState } from "react";
import { EducationItem } from "@/lib/types";
import { Plus, Trash2, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";

interface StepEducationProps {
  educations: EducationItem[];
  onChangeEducations: (educations: EducationItem[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepEducation: React.FC<StepEducationProps> = ({
  educations,
  onChangeEducations,
  onNext,
  onPrev,
}) => {
  const [expandedId, setExpandedId] = useState<string>(educations[0]?.id || "");

  const handleAddEducation = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: "Nouveau Diplôme / Formation",
      field: "Domaine d'étude",
      school: "Établissement ou Université",
      city: "Abidjan",
      year: "2024",
    };
    const updated = [newEdu, ...educations];
    onChangeEducations(updated);
    setExpandedId(newEdu.id);
  };

  const handleUpdateEdu = (id: string, updates: Partial<EducationItem>) => {
    const updated = educations.map((e) => (e.id === id ? { ...e, ...updates } : e));
    onChangeEducations(updated);
  };

  const handleDeleteEdu = (id: string) => {
    const updated = educations.filter((e) => e.id !== id);
    onChangeEducations(updated);
  };

  return (
    <div className="space-y-6 slide-up max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
          Étape 5 sur 8 — Vos Formations
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Quels sont vos diplômes et formations ?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Renseignez vos diplômes principaux, formations certifiantes ou certifications académiques.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900 text-sm">
          Formations ({educations.length})
        </h3>
        <button
          type="button"
          onClick={handleAddEducation}
          className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Ajouter une formation
        </button>
      </div>

      <div className="space-y-3">
        {educations.map((edu, idx) => {
          const isExpanded = expandedId === edu.id;
          return (
            <div
              key={edu.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                isExpanded ? "border-blue-300 shadow-md ring-1 ring-blue-100" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                onClick={() => setExpandedId(isExpanded ? "" : edu.id)}
                className="p-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {edu.degree} {edu.field ? `— ${edu.field}` : ""}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {edu.school} • {edu.year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEdu(edu.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Intitulé du diplôme
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdateEdu(edu.id, { degree: e.target.value })}
                      placeholder="Ex: Licence Professionnelle, Master, BTS, Bac"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Spécialité / Domaine d'étude
                    </label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => handleUpdateEdu(edu.id, { field: e.target.value })}
                      placeholder="Ex: Marketing & Vente, Informatique, Gestion"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Établissement / Université
                    </label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => handleUpdateEdu(edu.id, { school: e.target.value })}
                      placeholder="Ex: Université Félix Houphouët-Boigny"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={edu.city}
                        onChange={(e) => handleUpdateEdu(edu.id, { city: e.target.value })}
                        placeholder="Ex: Abidjan"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Année d'obtention
                      </label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => handleUpdateEdu(edu.id, { year: e.target.value })}
                        placeholder="Ex: 2024"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
          Continuer vers vos compétences
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
