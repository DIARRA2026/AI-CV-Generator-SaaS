"use client";

import React from "react";
import { LanguageItem } from "@/lib/types";
import { Plus, Trash2, Globe2 } from "lucide-react";

interface StepLanguagesProps {
  languages: LanguageItem[];
  onChangeLanguages: (languages: LanguageItem[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepLanguages: React.FC<StepLanguagesProps> = ({
  languages,
  onChangeLanguages,
  onNext,
  onPrev,
}) => {
  const levels: LanguageItem["level"][] = [
    "Débutant",
    "Intermédiaire",
    "Courant",
    "Bilingue / Natif",
  ];

  const handleAddLanguage = (name: string = "") => {
    const newLang: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: name || "Nouvelle langue",
      level: "Intermédiaire",
    };
    onChangeLanguages([...languages, newLang]);
  };

  const handleUpdate = (id: string, updates: Partial<LanguageItem>) => {
    onChangeLanguages(
      languages.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const handleDelete = (id: string) => {
    onChangeLanguages(languages.filter((l) => l.id !== id));
  };

  const quickLanguages = ["Français", "Anglais", "Espagnol", "Arabe", "Allemand", "Chinois (Mandarin)", "Baoulé", "Wolof", "Dioula"];

  return (
    <div className="space-y-6 slide-up max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
          Étape 7 sur 8 — Vos Langues
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Quelles langues maîtrisez-vous ?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Indiquez votre niveau de maîtrise pour chaque langue parlée ou écrite.
        </p>
      </div>

      {/* Suggestions rapides */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-600">Ajout rapide :</p>
        <div className="flex flex-wrap gap-1.5">
          {quickLanguages.map((lang) => {
            const alreadyAdded = languages.some(
              (l) => l.name.toLowerCase() === lang.toLowerCase()
            );
            return (
              <button
                key={lang}
                type="button"
                disabled={alreadyAdded}
                onClick={() => handleAddLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  alreadyAdded
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                + {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des langues */}
      <div className="space-y-3">
        {languages.map((l) => (
          <div
            key={l.id}
            className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 w-full sm:w-1/2">
              <Globe2 className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="text"
                value={l.name}
                onChange={(e) => handleUpdate(l.id, { name: e.target.value })}
                placeholder="Nom de la langue"
                className="w-full font-semibold text-slate-900 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <select
                value={l.level}
                onChange={(e) =>
                  handleUpdate(l.id, { level: e.target.value as any })
                }
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleDelete(l.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => handleAddLanguage()}
          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Ajouter une autre langue
        </button>
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
          Continuer vers les options supplémentaires
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
