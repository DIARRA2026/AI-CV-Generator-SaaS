"use client";

import React, { useState } from "react";
import { ResumeData } from "@/lib/types";
import { Plus, Trash2, Award, FolderGit2, Heart, Users, Check, Sparkles } from "lucide-react";

interface StepAdditionalProps {
  sections: ResumeData["sections"];
  onChangeSections: (sections: ResumeData["sections"]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepAdditional: React.FC<StepAdditionalProps> = ({
  sections,
  onChangeSections,
  onNext,
  onPrev,
}) => {
  const [activeTabs, setActiveTabs] = useState<{
    certifications: boolean;
    projects: boolean;
    interests: boolean;
    references: boolean;
    volunteer: boolean;
  }>({
    certifications: (sections.certifications?.length || 0) > 0,
    projects: (sections.projects?.length || 0) > 0,
    interests: (sections.interests?.length || 0) > 0,
    references: (sections.references?.length || 0) > 0,
    volunteer: (sections.volunteer?.length || 0) > 0,
  });

  const [rawInterest, setRawInterest] = useState("");

  const toggleTab = (key: keyof typeof activeTabs) => {
    setActiveTabs({ ...activeTabs, [key]: !activeTabs[key] });
  };

  // Handlers
  const handleAddCert = () => {
    const newCert = {
      id: `cert-${Date.now()}`,
      title: "Certification HubSpot Inbound Sales",
      issuer: "HubSpot Academy",
      year: "2024",
    };
    onChangeSections({
      ...sections,
      certifications: [...(sections.certifications || []), newCert],
    });
  };

  const handleAddProject = () => {
    const newProj = {
      id: `proj-${Date.now()}`,
      name: "Campagne de Prospection Terrain",
      description: "Acquisition de 45 nouveaux clients professionnels en 60 jours.",
    };
    onChangeSections({
      ...sections,
      projects: [...(sections.projects || []), newProj],
    });
  };

  const handleAddInterest = () => {
    if (!rawInterest.trim()) return;
    onChangeSections({
      ...sections,
      interests: [...(sections.interests || []), rawInterest.trim()],
    });
    setRawInterest("");
  };

  return (
    <div className="space-y-6 slide-up max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
          Étape 8 sur 8 — Sections Complémentaires
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Souhaitez-vous ajouter d'autres atouts ?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Cochez uniquement ce qui vous concerne pour enrichir votre CV.
        </p>
      </div>

      {/* Sélection des sections à activer */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[
          { key: "certifications", label: "Certifications", icon: <Award className="w-4 h-4 text-amber-500" /> },
          { key: "projects", label: "Projets & Réalisations", icon: <FolderGit2 className="w-4 h-4 text-blue-500" /> },
          { key: "interests", label: "Centres d'intérêt", icon: <Heart className="w-4 h-4 text-rose-500" /> },
          { key: "references", label: "Références Pro", icon: <Users className="w-4 h-4 text-emerald-500" /> },
          { key: "volunteer", label: "Bénévolat & Associations", icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
        ].map((item) => {
          const isAct = (activeTabs as any)[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleTab(item.key as any)}
              className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition-all ${
                isAct
                  ? "bg-blue-50/70 border-blue-400 text-blue-900 ring-1 ring-blue-400/30"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {isAct && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </button>
          );
        })}
      </div>

      {/* Détails Certifications */}
      {activeTabs.certifications && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Vos Certifications
            </h4>
            <button
              type="button"
              onClick={handleAddCert}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              + Ajouter une certification
            </button>
          </div>
          {sections.certifications?.map((c, i) => (
            <div key={c.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="text"
                value={c.title}
                onChange={(e) => {
                  const updated = [...(sections.certifications || [])];
                  updated[i].title = e.target.value;
                  onChangeSections({ ...sections, certifications: updated });
                }}
                placeholder="Titre de la certif"
                className="col-span-5 px-2 py-1 text-xs bg-white border rounded"
              />
              <input
                type="text"
                value={c.issuer}
                onChange={(e) => {
                  const updated = [...(sections.certifications || [])];
                  updated[i].issuer = e.target.value;
                  onChangeSections({ ...sections, certifications: updated });
                }}
                placeholder="Organisme"
                className="col-span-4 px-2 py-1 text-xs bg-white border rounded"
              />
              <input
                type="text"
                value={c.year}
                onChange={(e) => {
                  const updated = [...(sections.certifications || [])];
                  updated[i].year = e.target.value;
                  onChangeSections({ ...sections, certifications: updated });
                }}
                placeholder="Année"
                className="col-span-2 px-2 py-1 text-xs bg-white border rounded"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = sections.certifications?.filter((_, idx) => idx !== i);
                  onChangeSections({ ...sections, certifications: updated });
                }}
                className="col-span-1 text-slate-400 hover:text-rose-500 flex justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Détails Projets */}
      {activeTabs.projects && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <FolderGit2 className="w-4 h-4 text-blue-500" />
              Projets Notables
            </h4>
            <button
              type="button"
              onClick={handleAddProject}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              + Ajouter un projet
            </button>
          </div>
          {sections.projects?.map((p, i) => (
            <div key={p.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => {
                    const updated = [...(sections.projects || [])];
                    updated[i].name = e.target.value;
                    onChangeSections({ ...sections, projects: updated });
                  }}
                  placeholder="Nom du projet"
                  className="font-bold text-xs bg-white border px-2 py-1 rounded w-3/4"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = sections.projects?.filter((_, idx) => idx !== i);
                    onChangeSections({ ...sections, projects: updated });
                  }}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={p.description}
                onChange={(e) => {
                  const updated = [...(sections.projects || [])];
                  updated[i].description = e.target.value;
                  onChangeSections({ ...sections, projects: updated });
                }}
                placeholder="Description courte ou impact chiffré"
                className="w-full text-xs bg-white border px-2 py-1 rounded"
              />
            </div>
          ))}
        </div>
      )}

      {/* Détails Centres d'intérêt */}
      {activeTabs.interests && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500" />
            Centres d'intérêt / Passions
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Basketball, Lecture de livres de développement, Veille tech..."
              value={rawInterest}
              onChange={(e) => setRawInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddInterest();
                }
              }}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
            />
            <button
              type="button"
              onClick={handleAddInterest}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sections.interests?.map((item, idx) => (
              <span
                key={idx}
                className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 border"
              >
                {item}
                <button
                  type="button"
                  onClick={() => {
                    const updated = sections.interests?.filter((_, i) => i !== idx);
                    onChangeSections({ ...sections, interests: updated });
                  }}
                  className="text-slate-400 hover:text-rose-500"
                >
                  ×
                </button>
              </span>
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
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm flex items-center gap-2"
        >
          ✨ Finaliser & Personnaliser mon CV
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
