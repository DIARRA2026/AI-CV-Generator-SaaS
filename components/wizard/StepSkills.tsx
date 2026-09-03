"use client";

import React, { useState } from "react";
import { SkillCategory } from "@/lib/types";
import { CVEngine } from "@/lib/cv-engine";
import { Sparkles, Wand2, Plus, X, Trash2, Tag } from "lucide-react";

interface StepSkillsProps {
  skills: SkillCategory[];
  onChangeSkills: (skills: SkillCategory[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepSkills: React.FC<StepSkillsProps> = ({
  skills,
  onChangeSkills,
  onNext,
  onPrev,
}) => {
  const [rawSkillsInput, setRawSkillsInput] = useState("");
  const [newTagInputs, setNewTagInputs] = useState<{ [key: string]: string }>({});

  const handleSmartOrganize = () => {
    if (!rawSkillsInput.trim()) return;
    const parsed = CVEngine.parseSkillsInput(rawSkillsInput);

    const updated: SkillCategory[] = [
      {
        id: "sk-tools",
        category: "Logiciels & Outils Maîtrisés",
        items: parsed.tools.length > 0 ? parsed.tools : ["Microsoft Excel", "Canva", "Word"],
      },
      {
        id: "sk-business",
        category: "Compétences Techniques Métier",
        items: parsed.business.length > 0 ? parsed.business : ["Gestion Commerciale", "Prospection", "Négociation"],
      },
      {
        id: "sk-soft",
        category: "Qualités Humaines (Soft Skills)",
        items: parsed.soft.length > 0 ? parsed.soft : ["Sens de l'écoute", "Esprit d'équipe", "Rigueur"],
      },
    ];

    onChangeSkills(updated);
    setRawSkillsInput("");
  };

  const handleAddTag = (catId: string) => {
    const val = (newTagInputs[catId] || "").trim();
    if (!val) return;
    const updated = skills.map((c) =>
      c.id === catId ? { ...c, items: [...c.items, val] } : c
    );
    onChangeSkills(updated);
    setNewTagInputs({ ...newTagInputs, [catId]: "" });
  };

  const handleRemoveTag = (catId: string, itemIdx: number) => {
    const updated = skills.map((c) =>
      c.id === catId ? { ...c, items: c.items.filter((_, i) => i !== itemIdx) } : c
    );
    onChangeSkills(updated);
  };

  const handleAddCategory = () => {
    const newCat: SkillCategory = {
      id: `cat-${Date.now()}`,
      category: "Nouvelle Catégorie",
      items: ["Compétence 1"],
    };
    onChangeSkills([...skills, newCat]);
  };

  const handleDeleteCategory = (catId: string) => {
    onChangeSkills(skills.filter((c) => c.id !== catId));
  };

  return (
    <div className="space-y-6 slide-up max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
          Étape 6 sur 8 — Vos Compétences & Outils
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Quels outils, logiciels et savoir-faire utilisez-vous ?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Ne vous embêtez pas à tout trier : saisissez vos outils en vrac, l'assistant les classe automatiquement.
        </p>
      </div>

      {/* Boîte de saisie rapide & Magie IA */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 space-y-3">
        <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Classement Rapide par IA</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Ex: Excel, Canva, Photoshop, Prospection, Word, Esprit d'équipe, Négociation..."
            value={rawSkillsInput}
            onChange={(e) => setRawSkillsInput(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          />
          <button
            type="button"
            onClick={handleSmartOrganize}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Classer par catégories
          </button>
        </div>
      </div>

      {/* Catégories de compétences */}
      <div className="space-y-4">
        {skills.map((cat) => (
          <div key={cat.id} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <input
                type="text"
                value={cat.category}
                onChange={(e) => {
                  const updated = skills.map((c) =>
                    c.id === cat.id ? { ...c, category: e.target.value } : c
                  );
                  onChangeSkills(updated);
                }}
                className="font-bold text-slate-900 text-xs bg-transparent border-b border-dashed border-slate-300 focus:border-blue-600 focus:outline-none pb-0.5"
              />
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badges / Tags */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {cat.items.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium border border-slate-200/60"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(cat.id, idx)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Ajout de nouveau tag */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="+ Ajouter"
                  value={newTagInputs[cat.id] || ""}
                  onChange={(e) =>
                    setNewTagInputs({ ...newTagInputs, [cat.id]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(cat.id);
                    }
                  }}
                  className="px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-24 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(cat.id)}
                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddCategory}
          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Ajouter une nouvelle catégorie de compétences
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
          Continuer vers vos langues
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
