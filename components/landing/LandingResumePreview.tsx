"use client";

import React from "react";
import { DemoProfileConfig } from "@/lib/landingDemoResumes";
import {
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  Award,
  Sparkles,
  Eye,
  Wand2,
} from "lucide-react";

interface LandingResumePreviewProps {
  profile: DemoProfileConfig;
  onOpenPreview: (profile: DemoProfileConfig) => void;
  onSelectTemplate: (templateId: string) => void;
}

export const LandingResumePreview: React.FC<LandingResumePreviewProps> = ({
  profile,
  onOpenPreview,
  onSelectTemplate,
}) => {
  const { id, accent, data, candidateName, candidateRole } = profile;
  const { personal, experiences, educations, skills } = data;

  return (
    <div className="relative w-full h-[360px] sm:h-[380px] bg-slate-100/70 p-2.5 sm:p-3 rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner group">
      {/* Feuille A4 miniature ultra-réaliste */}
      <div className="w-full h-full bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden flex flex-col relative select-none transition-transform duration-300 group-hover:scale-[1.01]">
        
        {/* ========================================================================= */}
        {/* MODÈLE MODERNE : Sidebar Gauche Colorée 35% + Colonne Droite 65% */}
        {/* ========================================================================= */}
        {id === "modern" && (
          <div className="flex h-full text-slate-800 text-[10px] leading-tight">
            {/* Sidebar Bleue */}
            <div
              className="w-[36%] p-3 text-white flex flex-col justify-between shrink-0 overflow-hidden"
              style={{ backgroundColor: accent }}
            >
              <div className="space-y-2.5">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-xl border-2 border-white/40 overflow-hidden shadow-md shrink-0 bg-white/20">
                    <img
                      src={personal.photoUrl}
                      alt={candidateName}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-[9px] text-white/90">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 shrink-0 opacity-80" />
                    <span className="truncate">{personal.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 shrink-0 opacity-80" />
                    <span className="truncate">{personal.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-2.5 h-2.5 shrink-0 opacity-80" />
                    <span className="truncate">{personal.email}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-extrabold uppercase tracking-wider text-[8px] text-white/80 border-b border-white/20 pb-0.5">
                    Compétences
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {skills[0]?.items.slice(0, 4).map((sk) => (
                      <span
                        key={sk}
                        className="px-1.5 py-0.5 bg-white/15 rounded text-[8px] font-semibold text-white truncate max-w-full"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-1 border-t border-white/20 text-[8px] text-white/80">
                <span className="font-bold">Langues :</span> FR (Natif) • EN (Courant)
              </div>
            </div>

            {/* Contenu Droit */}
            <div className="w-[64%] p-3 flex flex-col justify-between overflow-hidden bg-white">
              <div className="space-y-2">
                <div>
                  <h4 className="font-black text-slate-900 text-xs tracking-tight">{candidateName}</h4>
                  <p className="font-bold text-[9.5px] mt-0.5" style={{ color: accent }}>
                    {candidateRole}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="font-extrabold text-[8.5px] uppercase tracking-wider text-slate-400">
                    Expériences Clés
                  </p>
                  <div className="space-y-1.5">
                    {experiences.slice(0, 2).map((exp) => (
                      <div key={exp.id} className="border-l-2 pl-2" style={{ borderColor: accent }}>
                        <div className="flex justify-between items-baseline text-[9px] font-bold text-slate-800">
                          <span className="truncate max-w-[110px]">{exp.role}</span>
                          <span className="text-[7.5px] text-slate-400 font-normal shrink-0">{exp.startDate}</span>
                        </div>
                        <p className="text-[8px] font-semibold text-blue-700">{exp.company}</p>
                        <p className="text-[8px] text-slate-600 line-clamp-1 mt-0.5">{exp.highlights[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-0.5 pt-1 border-t border-slate-100">
                  <p className="font-extrabold text-[8.5px] uppercase tracking-wider text-slate-400">Formation</p>
                  <p className="text-[8.5px] font-bold text-slate-800">{educations[0]?.degree}</p>
                  <p className="text-[8px] text-slate-500 truncate">{educations[0]?.school}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[8px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Format Recommandé Recruteurs UEMOA</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÈLE ÉLÉGANT : Typographie Serif Raffinée & En-tête Centré Chic */}
        {/* ========================================================================= */}
        {id === "elegant" && (
          <div className="h-full p-3.5 flex flex-col justify-between text-slate-800 font-serif leading-tight bg-white">
            <div className="space-y-2">
              {/* En-tête centré */}
              <div className="text-center pb-2 border-b-2" style={{ borderColor: accent }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-1 border-2 p-0.5 overflow-hidden" style={{ borderColor: accent }}>
                  <img
                    src={personal.photoUrl}
                    alt={candidateName}
                    className="w-full h-full object-cover rounded-full"
                    crossOrigin="anonymous"
                  />
                </div>
                <h4 className="font-black text-slate-900 text-xs tracking-widest uppercase">{candidateName}</h4>
                <p className="font-sans font-bold text-[9px] uppercase tracking-wider mt-0.5 text-slate-600">
                  {candidateRole}
                </p>
                <div className="font-sans text-[8px] text-slate-500 flex justify-center items-center gap-2 mt-1">
                  <span>{personal.city}</span>
                  <span>•</span>
                  <span>{personal.phone}</span>
                  <span>•</span>
                  <span className="truncate max-w-[110px]">{personal.email}</span>
                </div>
              </div>

              {/* Résumé exécutif */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <p className="text-[8px] text-slate-600 italic leading-relaxed line-clamp-2">
                  « {data.summary} »
                </p>
              </div>

              {/* Expériences */}
              <div className="space-y-1">
                <h5 className="font-bold text-[8.5px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                  Parcours Professionnel
                </h5>
                <div className="space-y-1">
                  {experiences.slice(0, 2).map((exp) => (
                    <div key={exp.id} className="text-[8.5px]">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span className="truncate">{exp.role} — <span className="font-normal text-slate-600">{exp.company}</span></span>
                        <span className="font-sans text-[7.5px] text-slate-400 shrink-0">{exp.startDate}</span>
                      </div>
                      <p className="text-[8px] text-slate-600 line-clamp-1">{exp.highlights[0]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formation */}
              <div className="space-y-0.5 font-sans">
                <h5 className="font-serif font-bold text-[8.5px] uppercase tracking-wider text-slate-900">
                  Diplôme Supérieur
                </h5>
                <p className="text-[8px] font-bold text-slate-800">{educations[0]?.degree}</p>
                <p className="text-[7.5px] text-slate-500 truncate">{educations[0]?.school}</p>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[7.5px] font-sans text-slate-500">
              <span className="font-bold text-slate-700">Droit • Conseil • Direction</span>
              <span className="text-blue-600 font-semibold">Mention OHADA</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÈLE CORPORATE : Bandeau Supérieur Bleu Marine & Blocs Structurés */}
        {/* ========================================================================= */}
        {id === "corporate" && (
          <div className="h-full flex flex-col justify-between text-slate-800 leading-tight bg-white">
            {/* Bannière Corporate Supérieure */}
            <div className="p-3 text-white shrink-0" style={{ backgroundColor: accent }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/30 shrink-0 bg-white/20">
                    <img
                      src={personal.photoUrl}
                      alt={candidateName}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xs uppercase tracking-tight">{candidateName}</h4>
                    <p className="text-[9px] font-medium text-white/90">{candidateRole}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="px-2 py-0.5 rounded bg-white/20 text-[8px] font-black tracking-wider uppercase">
                    SYSCOHADA
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[8px] text-white/80 mt-1.5 pt-1 border-t border-white/20">
                <span>{personal.city}</span>
                <span>•</span>
                <span>{personal.phone}</span>
                <span>•</span>
                <span className="truncate">{personal.email}</span>
              </div>
            </div>

            {/* Corps Corporate */}
            <div className="p-3 space-y-2 flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                    <h5 className="font-black text-[8.5px] uppercase tracking-wider text-slate-900">
                      Postes Exécutifs & Réalisations
                    </h5>
                    <span className="text-[7.5px] font-bold text-blue-800">Contrôle & Trésorerie</span>
                  </div>
                  <div className="space-y-1.5">
                    {experiences.slice(0, 2).map((exp) => (
                      <div key={exp.id} className="text-[8.5px] space-y-0.5">
                        <div className="flex justify-between items-baseline font-bold text-slate-900">
                          <span className="truncate">{exp.role}</span>
                          <span className="text-[7.5px] text-slate-400 font-normal shrink-0">{exp.startDate}</span>
                        </div>
                        <p className="text-[8px] font-semibold text-blue-900">{exp.company}</p>
                        <p className="text-[8px] text-slate-600 line-clamp-1">{exp.highlights[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <h5 className="font-black text-[8.5px] uppercase tracking-wider text-slate-900">
                    Formation Supérieure
                  </h5>
                  <p className="text-[8.5px] font-bold text-slate-800">{educations[0]?.degree}</p>
                  <p className="text-[8px] text-slate-500 truncate">{educations[0]?.school}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                {skills[0]?.items.slice(0, 4).map((sk) => (
                  <span
                    key={sk}
                    className="px-1.5 py-0.5 bg-blue-50 text-blue-900 font-bold rounded text-[7.5px] border border-blue-100"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÈLE MINIMAL : Épure Scandinave, Noir & Blanc Haute Lisibilité */}
        {/* ========================================================================= */}
        {id === "minimal" && (
          <div className="h-full p-4 flex flex-col justify-between text-slate-800 leading-tight bg-white">
            <div className="space-y-2.5">
              {/* En-tête sobre */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm tracking-tight">{candidateName}</h4>
                  <p className="text-[9.5px] font-semibold text-slate-600 mt-0.5">{candidateRole}</p>
                  <p className="text-[8px] text-slate-400 mt-1">
                    {personal.city} • {personal.phone} • {personal.email}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-300 grayscale shrink-0">
                  <img
                    src={personal.photoUrl}
                    alt={candidateName}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              {/* Expérience */}
              <div className="space-y-1">
                <p className="font-extrabold text-[8.5px] uppercase tracking-wider text-slate-900">
                  Expériences Professionnelles
                </p>
                <div className="space-y-1.5">
                  {experiences.slice(0, 2).map((exp) => (
                    <div key={exp.id} className="text-[8.5px] space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-slate-900 truncate">{exp.role} — {exp.company}</span>
                        <span className="text-[7.5px] text-slate-400 shrink-0">{exp.startDate}</span>
                      </div>
                      <p className="text-[8px] text-slate-600 line-clamp-1">{exp.highlights[0]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formation */}
              <div className="space-y-0.5 pt-1 border-t border-slate-100">
                <p className="font-extrabold text-[8.5px] uppercase tracking-wider text-slate-900">Formation</p>
                <p className="text-[8.5px] font-bold text-slate-800">{educations[0]?.degree}</p>
                <p className="text-[8px] text-slate-500 truncate">{educations[0]?.school}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[8px] text-slate-500 font-medium">
              <span>Sobriété absolue</span>
              <span>100% Lisible</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÈLE CRÉATIF : Dégradé Violet Moderne & Badges Design */}
        {/* ========================================================================= */}
        {id === "creative" && (
          <div className="h-full flex flex-col justify-between text-slate-800 leading-tight bg-white">
            {/* Header Dégradé */}
            <div className="p-3 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white/40 shadow-sm shrink-0">
                  <img
                    src={personal.photoUrl}
                    alt={candidateName}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white text-xs tracking-tight truncate">{candidateName}</h4>
                  <p className="text-[9px] text-purple-200 font-medium truncate">{candidateRole}</p>
                  <p className="text-[8px] text-white/80 mt-0.5 truncate">
                    {personal.city} • {personal.website}
                  </p>
                </div>
              </div>
            </div>

            {/* Corps Créatif */}
            <div className="p-3 space-y-2 flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-2">
                <div className="space-y-1">
                  <h5 className="font-black text-[8.5px] uppercase tracking-wider text-purple-900 border-b border-purple-100 pb-0.5">
                    Projets UI/UX & Réalisations
                  </h5>
                  <div className="space-y-1.5">
                    {experiences.slice(0, 2).map((exp) => (
                      <div key={exp.id} className="text-[8.5px] border-l-2 border-purple-500 pl-2">
                        <div className="flex justify-between items-baseline font-bold text-slate-900">
                          <span className="truncate">{exp.role}</span>
                          <span className="text-[7.5px] text-slate-400 font-normal shrink-0">{exp.startDate}</span>
                        </div>
                        <p className="text-[8px] font-semibold text-purple-700">{exp.company}</p>
                        <p className="text-[8px] text-slate-600 line-clamp-1">{exp.highlights[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h5 className="font-black text-[8.5px] uppercase tracking-wider text-purple-900">
                    Diplôme Design
                  </h5>
                  <p className="text-[8.5px] font-bold text-slate-800">{educations[0]?.degree}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-1 border-t border-purple-100">
                {skills[0]?.items.slice(0, 4).map((sk) => (
                  <span
                    key={sk}
                    className="px-1.5 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-md text-[7.5px] border border-purple-200"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODÈLE ATS OPTIMISÉ : Format Linéaire 100% Standardisé Machine */}
        {/* ========================================================================= */}
        {id === "ats" && (
          <div className="h-full p-3 flex flex-col justify-between text-black font-sans leading-tight bg-white">
            <div className="space-y-2">
              {/* Badge ATS Match */}
              <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[8px] font-extrabold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  <span>100% Conforme Robots ATS (Workday, Taleo)</span>
                </span>
                <span>Score : 99/100</span>
              </div>

              {/* En-tête standard ATS */}
              <div className="text-center pb-1 border-b-2 border-black">
                <h4 className="font-bold text-xs uppercase tracking-tight text-black">{candidateName}</h4>
                <p className="font-semibold text-[9px] text-black mt-0.5">{candidateRole}</p>
                <p className="text-[7.5px] text-black mt-0.5">
                  {personal.email} | {personal.phone} | {personal.city}, {personal.country}
                </p>
              </div>

              {/* Section 1 : Expérience Professionnelle */}
              <div className="space-y-1">
                <p className="font-bold text-[8.5px] uppercase tracking-wider text-black border-b border-black pb-0.5">
                  EXPÉRIENCE PROFESSIONNELLE
                </p>
                <div className="space-y-1">
                  {experiences.slice(0, 2).map((exp) => (
                    <div key={exp.id} className="text-[8px] space-y-0.5">
                      <div className="flex justify-between font-bold text-black">
                        <span className="truncate">{exp.role} — {exp.company}</span>
                        <span className="font-normal shrink-0">{exp.startDate}</span>
                      </div>
                      <p className="text-[7.5px] text-slate-800 line-clamp-1">• {exp.highlights[0]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2 : Formation & Certifications */}
              <div className="space-y-0.5">
                <p className="font-bold text-[8.5px] uppercase tracking-wider text-black border-b border-black pb-0.5">
                  FORMATION & CERTIFICATIONS
                </p>
                <p className="text-[8px] font-bold text-black">{educations[0]?.degree} — {educations[0]?.school}</p>
                <p className="text-[7.5px] text-slate-800">• AWS Certified Solutions Architect Associate (2022)</p>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-200 text-[7.5px] text-slate-600 font-mono">
              KEYWORDS: AWS • KUBERNETES • DOCKER • TERRAFORM • CI/CD • LINUX
            </div>
          </div>
        )}

        {/* OVERLAY D'INTERACTION AU SURVOL */}
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2.5 transition-all duration-200 p-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPreview(profile);
            }}
            className="w-full max-w-[200px] py-2 px-3 bg-white text-slate-900 font-black rounded-xl text-xs shadow-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-105"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Aperçu Grand Format A4</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTemplate(id);
            }}
            style={{ backgroundColor: accent }}
            className="w-full max-w-[200px] py-2 px-3 text-white font-black rounded-xl text-xs shadow-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-105 hover:opacity-95"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Choisir ce modèle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
