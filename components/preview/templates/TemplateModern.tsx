import React from "react";
import { ResumeData } from "@/lib/types";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  FolderGit2,
  Calendar,
  Users,
  Car,
} from "lucide-react";
import { getResumeDensity } from "@/lib/resume-density";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateModern: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#2563eb";
  const density = getResumeDensity(data);

  return (
    <div className="flex flex-1 h-full min-h-[297mm] max-h-[297mm] overflow-hidden bg-white text-slate-800 font-sans leading-relaxed">
      {/* Sidebar Gauche — 38% (Architecture Exécutive : Structure Claire, Alignements Parfaits, Zéro Débordement) */}
      <div
        className="w-[38%] text-white flex flex-col h-full min-h-[297mm] max-h-[297mm] shrink-0 overflow-hidden"
        style={{
          backgroundColor: color,
          paddingTop: density.spacing.pagePaddingTop,
          paddingBottom: density.spacing.pagePaddingBottom,
          paddingLeft: density.spacing.pagePaddingLeft,
          paddingRight: "0.6cm",
          gap: `${Math.max(8, Math.round(11 * density.scale))}px`,
        }}
      >
        {/* Photo de profil — Grand Format Exécutif (3X plus grand, pleine largeur) */}
        {design.showPhoto && personal.photoUrl && (
          <div className="flex justify-center shrink-0 w-full">
            <div className="relative p-1.5 bg-white/20 rounded-2xl shadow-lg backdrop-blur-xs border border-white/30 w-full flex justify-center overflow-hidden">
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                style={{
                  width: density.spacing.photoSize,
                  height: density.spacing.photoSize,
                  maxWidth: "100%",
                }}
                className="rounded-xl object-cover w-full aspect-square"
                crossOrigin="anonymous"
              />
            </div>
          </div>
        )}

        {/* Carte Coordonnées — Disposition Aérée et Sans Débordement */}
        <div className="bg-white/10 rounded-xl p-3.5 border border-white/15 backdrop-blur-xs shadow-xs shrink-0 overflow-visible">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-white/20">
            <h3
              style={{ fontSize: density.fontSize.sm }}
              className="uppercase tracking-wider font-extrabold text-white leading-normal"
            >
              Coordonnées
            </h3>
          </div>
          <div className="space-y-2" style={{ fontSize: density.fontSize.xs }}>
            {/* Email */}
            {personal.email && (
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Mail className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block leading-none mb-0.5">Email</span>
                  <span className="break-all font-semibold text-white leading-tight block">{personal.email}</span>
                </div>
              </div>
            )}

            {/* Téléphone */}
            {personal.phone && (
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Phone className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block leading-none mb-0.5">Téléphone</span>
                  <span className="font-bold text-white tracking-wide block leading-tight">{personal.phone}</span>
                </div>
              </div>
            )}

            {/* Localisation */}
            {(personal.city || personal.country) && (
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block leading-none mb-0.5">Localisation</span>
                  <span className="font-semibold text-white leading-tight block">
                    {[personal.city, personal.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            )}

            {/* Date & Lieu de Naissance */}
            {(personal.birthDate || personal.birthPlace) && (
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Calendar className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block leading-none mb-0.5">Naissance</span>
                  <span className="font-semibold text-white leading-tight block">
                    {[
                      personal.birthDate ? `${personal.birthDate}` : "",
                      personal.birthPlace ? `à ${personal.birthPlace}` : ""
                    ].filter(Boolean).join(" ")}
                  </span>
                </div>
              </div>
            )}

            {/* État Civil */}
            {personal.maritalStatus && (
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block leading-none mb-0.5">État Civil</span>
                  <span className="font-semibold text-white leading-tight block">{personal.maritalStatus}</span>
                </div>
              </div>
            )}

            {/* Permis de Conduire */}
            {personal.driverLicense && (
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Car className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block leading-none mb-0.5">Permis</span>
                  <span className="font-semibold text-white leading-tight block">{personal.driverLicense}</span>
                </div>
              </div>
            )}

            {/* LinkedIn */}
            {personal.linkedin && (
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Linkedin className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block leading-none mb-0.5">LinkedIn</span>
                  <span className="break-all font-semibold text-white leading-tight block">{personal.linkedin}</span>
                </div>
              </div>
            )}

            {/* Site Web */}
            {personal.website && (
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Globe className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block leading-none mb-0.5">Site Web</span>
                  <span className="break-all font-semibold text-white leading-tight block">{personal.website}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carte Compétences */}
        {skills && skills.length > 0 && (
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/15 backdrop-blur-xs shadow-xs shrink-0 overflow-visible">
            <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-white/20">
              <Sparkles className="w-4 h-4 text-white/90 shrink-0" />
              <h3
                style={{ fontSize: density.fontSize.sm }}
                className="uppercase tracking-wider font-extrabold text-white leading-normal"
              >
                Compétences
              </h3>
            </div>
            <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
              {skills.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <p
                    style={{ fontSize: density.fontSize.xs }}
                    className="font-bold text-white/95 tracking-wider uppercase text-[11px]"
                  >
                    {cat.category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((item, idx) => (
                      <span
                        key={idx}
                        style={{ fontSize: density.fontSize.xs }}
                        className="inline-block px-2.5 py-1 rounded-lg bg-white/20 border border-white/25 text-white font-semibold leading-normal shadow-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carte Langues — Jauges Visuelles & Badges Propres Sans Retour à la Ligne */}
        {languages && languages.length > 0 && (
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/15 backdrop-blur-xs shadow-xs shrink-0 overflow-visible">
            <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-white/20">
              <Globe className="w-4 h-4 text-white/90 shrink-0" />
              <h3
                style={{ fontSize: density.fontSize.sm }}
                className="uppercase tracking-wider font-extrabold text-white leading-normal"
              >
                Langues
              </h3>
            </div>
            <div className="space-y-2">
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  className="bg-white/10 rounded-lg p-2 border border-white/15"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white text-sm">{lang.name}</span>
                    <span
                      style={{ fontSize: density.fontSize.xs }}
                      className="font-semibold text-white/95 bg-white/20 px-2.5 py-0.5 rounded-md shadow-2xs whitespace-nowrap"
                    >
                      {lang.level}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-white rounded-full h-1.5 transition-all"
                      style={{
                        width:
                          lang.level === "Bilingue / Natif"
                            ? "100%"
                            : lang.level === "Courant"
                            ? "85%"
                            : lang.level === "Intermédiaire"
                            ? "60%"
                            : "40%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carte Centres d'intérêt — Tags Aérés Sans Débordement Ni Coupure */}
        {sections?.interests && sections.interests.length > 0 && (
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/15 backdrop-blur-xs shadow-xs shrink-0 overflow-visible">
            <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-white/20">
              <Award className="w-4 h-4 text-white/90 shrink-0" />
              <h3
                style={{ fontSize: density.fontSize.sm }}
                className="uppercase tracking-wider font-extrabold text-white leading-normal"
              >
                Centres d'intérêt
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 overflow-visible">
              {sections.interests.map((interest, i) => (
                <span
                  key={i}
                  style={{ fontSize: density.fontSize.xs }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 border border-white/25 rounded-lg text-white font-medium leading-normal shadow-xs overflow-visible"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  <span>{interest}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sceau Bas Discret */}
        <div className="mt-auto pt-2 border-t border-white/20 text-center flex items-center justify-center gap-1.5 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span className="text-white/80 font-bold tracking-wider uppercase text-[10px]">
            Profil Certifié Conforme
          </span>
        </div>
      </div>

      {/* Contenu Principal Droite — 62% (Remplissage A4 ordonné avec justification de texte) */}
      <div
        className="w-[62%] flex flex-col justify-between h-full min-h-[297mm] max-h-[297mm] overflow-hidden"
        style={{
          paddingTop: density.spacing.pagePaddingTop,
          paddingBottom: density.spacing.pagePaddingBottom,
          paddingLeft: "0.6cm",
          paddingRight: density.spacing.pagePaddingRight,
        }}
      >
        <div
          className="flex flex-col min-h-0"
          style={{ gap: density.spacing.sectionGap }}
        >
          {/* Header Nom & Titre */}
          <div className="border-b-2 pb-2.5" style={{ borderColor: `${color}30` }}>
            <h1
              style={{ fontSize: density.fontSize.title }}
              className="font-black text-slate-900 tracking-tight uppercase leading-tight"
            >
              {personal.firstName} <span style={{ color }}>{personal.lastName}</span>
            </h1>
            <p
              style={{ fontSize: density.fontSize.role }}
              className="font-bold uppercase tracking-wider text-slate-600 mt-0.5"
            >
              {personal.title}
            </p>
          </div>

          {/* Profil Professionnel */}
          {summary && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" style={{ color }} />
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="font-bold uppercase tracking-wider text-slate-900"
                >
                  Profil Professionnel
                </h2>
              </div>
              <p
                style={{
                  fontSize: density.fontSize.summary,
                  lineHeight: density.lineHeight,
                  padding: density.spacing.summaryPadding,
                }}
                className="text-slate-700 cv-pro-text bg-slate-50/80 rounded-xl border border-slate-100"
              >
                {summary}
              </p>
            </div>
          )}

          {/* Expériences */}
          {experiences && experiences.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Briefcase className="w-3.5 h-3.5" style={{ color }} />
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="font-bold uppercase tracking-wider text-slate-900"
                >
                  Expériences Professionnelles
                </h2>
              </div>
              <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="relative pl-3.5 border-l-2 bg-slate-50/50 p-2.5 rounded-r-xl border-slate-100"
                    style={{ borderColor: `${color}50` }}
                  >
                    {/* Alignement tabulaire Word Processor : Titre à gauche, dates à droite */}
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3
                        style={{ fontSize: density.fontSize.base }}
                        className="font-bold text-slate-900"
                      >
                        {exp.role}
                      </h3>
                      <span
                        style={{ fontSize: density.fontSize.sm }}
                        className="font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0 shadow-2xs"
                      >
                        {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                      </span>
                    </div>
                    <p
                      style={{ color, fontSize: density.fontSize.sm }}
                      className="font-semibold mb-1"
                    >
                      {exp.company} {exp.city ? `— ${exp.city}` : ""}
                    </p>
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul
                        style={{ gap: density.spacing.bulletGap }}
                        className="text-slate-600 flex flex-col"
                      >
                        {exp.highlights.map((h, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: density.fontSize.base,
                              lineHeight: density.lineHeight,
                            }}
                            className="flex items-start gap-1.5 cv-pro-text"
                          >
                            <span className="text-slate-400 font-bold shrink-0 mt-[-1px]">•</span>
                            <span className="flex-1">{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formations */}
          {educations && educations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" style={{ color }} />
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="font-bold uppercase tracking-wider text-slate-900"
                >
                  Formation & Diplômes
                </h2>
              </div>
              <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                {educations.map((edu) => (
                  <div
                    key={edu.id}
                    style={{ padding: density.spacing.cardPadding }}
                    className="flex justify-between items-start bg-slate-50/60 rounded-xl border border-slate-100"
                  >
                    <div>
                      <h3
                        style={{ fontSize: density.fontSize.base }}
                        className="font-bold text-slate-900"
                      >
                        {edu.degree} {edu.field ? `— ${edu.field}` : ""}
                      </h3>
                      <p
                        style={{ fontSize: density.fontSize.sm }}
                        className="text-slate-600 mt-0.5"
                      >
                        {edu.school} {edu.city ? `(${edu.city})` : ""}
                      </p>
                    </div>
                    <span
                      style={{ fontSize: density.fontSize.sm }}
                      className="font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0 shadow-2xs"
                    >
                      {edu.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications & Projets */}
          {((sections?.certifications && sections.certifications.length > 0) ||
            (sections?.projects && sections.projects.length > 0)) && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Award className="w-3.5 h-3.5" style={{ color }} />
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="font-bold uppercase tracking-wider text-slate-900"
                >
                  Certifications & Réalisations
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sections?.certifications?.map((c) => (
                  <div
                    key={c.id}
                    style={{ padding: density.spacing.cardPadding }}
                    className="bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <p
                      style={{ fontSize: density.fontSize.base }}
                      className="font-bold text-slate-900 leading-snug"
                    >
                      {c.title}
                    </p>
                    <p
                      style={{ fontSize: density.fontSize.xs }}
                      className="text-slate-500 mt-0.5"
                    >
                      {c.issuer} • {c.year}
                    </p>
                  </div>
                ))}
                {sections?.projects?.map((p) => (
                  <div
                    key={p.id}
                    style={{ padding: density.spacing.cardPadding }}
                    className="bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <p
                      style={{ fontSize: density.fontSize.base }}
                      className="font-bold text-slate-900 leading-snug"
                    >
                      {p.name}
                    </p>
                    <p
                      style={{ fontSize: density.fontSize.xs }}
                      className="text-slate-500 mt-0.5 line-clamp-1"
                    >
                      {p.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info discrète */}
        <div
          style={{ fontSize: density.fontSize.xs }}
          className="pt-2 text-center border-t border-slate-100 text-slate-400 mt-auto shrink-0"
        >
          Document certifié conforme • MonCV.ai
        </div>
      </div>
    </div>
  );
};
