"use client";

import React, { useRef, useEffect } from "react";
import { DemoProfileConfig } from "@/lib/landingDemoResumes";
import { CVPreviewCanvas } from "@/components/preview/CVPreviewCanvas";
import { X, Wand2, Star, CheckCircle2, FileDown } from "lucide-react";

interface LandingResumeModalProps {
  profile: DemoProfileConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

export const LandingResumeModal: React.FC<LandingResumeModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !profile) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* En-tête Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: profile.accent }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Modèle {profile.name} — Aperçu Grand Format A4
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {profile.tag}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exemple fictif : <span className="font-bold text-slate-200">{profile.candidateName}</span> ({profile.candidateRole})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTemplate(profile.id)}
              style={{ backgroundColor: profile.accent }}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-white font-bold rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Utiliser ce modèle</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps A4 défilant */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center items-start scrollbar-thin"
        >
          <div className="shadow-2xl rounded-sm overflow-hidden bg-white">
            <CVPreviewCanvas data={profile.data} scale={0.78} />
          </div>
        </div>

        {/* Pied de modal avec CTA */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Exports PDF HD & Word 100% Gratuits sans filigrane</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              Fermer l'aperçu
            </button>

            <button
              type="button"
              onClick={() => onSelectTemplate(profile.id)}
              style={{ backgroundColor: profile.accent }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-white font-black rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg"
            >
              <Wand2 className="w-4 h-4" />
              <span>Personnaliser ce modèle {profile.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
