import React from "react";
import { ResumeData } from "@/lib/types";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  Calendar,
  Users,
} from "lucide-react";
import { getResumeDensity } from "@/lib/resume-density";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateCreative: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#7c3aed";
  const density = getResumeDensity(data);

  return (
    <div className="min-h-[297mm] max-h-[297mm] h-full flex-1 bg-white text-slate-800 font-sans leading-relaxed flex flex-col justify-between overflow-hidden">
      <div className="flex-1 flex flex-col justify-between min-h-0">
        {/* Banner supérieur coloré */}
        <div
          className="text-white shrink-0"
          style={{
            backgroundColor: color,
            paddingLeft: density.spacing.pagePadding,
            paddingRight: density.spacing.pagePadding,
            paddingTop: `${Math.round(18 * density.scale)}px`,
            paddingBottom: `${Math.round(16 * density.scale)}px`,
          }}
        >
          <div className="flex items-center gap-4">
            {design.showPhoto && personal.photoUrl && (
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                style={{ width: density.spacing.photoSize, height: density.spacing.photoSize }}
                className="rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0"
                crossOrigin="anonymous"
              />
            )}
            <div className="flex-1 min-w-0">
              <span
                style={{ fontSize: density.fontSize.xs }}
                className="inline-block bg-white/20 px-2.5 py-0.5 rounded-full font-semibold tracking-wider uppercase mb-1"
              >
                {personal.title}
              </span>
              <h1
                style={{ fontSize: density.fontSize.title }}
                className="font-extrabold tracking-tight leading-tight"
              >
                {personal.firstName} {personal.lastName}
              </h1>
              <div
                style={{ fontSize: density.fontSize.xs }}
                className="flex flex-wrap gap-x-3.5 gap-y-1 mt-1.5 text-white/90"
              >
                {personal.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span>{personal.email}</span>
                  </span>
                )}
                {personal.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>{personal.phone}</span>
                  </span>
                )}
                {(personal.city || personal.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{[personal.city, personal.country].filter(Boolean).join(", ")}</span>
                  </span>
                )}
                {(personal.birthDate || personal.birthPlace) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>
                      {[
                        personal.birthDate ? `Né(e) le ${personal.birthDate}` : "",
                        personal.birthPlace ? `à ${personal.birthPlace}` : ""
                      ].filter(Boolean).join(" ")}
                    </span>
                  </span>
                )}
                {personal.maritalStatus && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 shrink-0" />
                    <span>{personal.maritalStatus}</span>
                  </span>
                )}
                {personal.linkedin && (
                  <span className="flex items-center gap-1">
                    <Linkedin className="w-3 h-3 shrink-0" />
                    <span>{personal.linkedin}</span>
                  </span>
                )}
                {personal.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 shrink-0" />
                    <span>{personal.website}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Corps du CV (Remplissage A4 dynamique) */}
        <div
          className="flex-1 flex flex-col justify-between min-h-0"
          style={{
            padding: density.spacing.pagePadding,
            gap: density.spacing.sectionGap,
          }}
        >
          {/* Résumé */}
          {summary && (
            <div
              className="bg-slate-50/80 rounded-xl border border-slate-100"
              style={{ padding: density.spacing.summaryPadding }}
            >
              <div
                className="flex items-center gap-1.5 mb-1 font-bold uppercase tracking-wide"
                style={{ color, fontSize: density.fontSize.heading }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>À Propos de Moi</span>
              </div>
              <p
                style={{
                  fontSize: density.fontSize.summary,
                  lineHeight: density.lineHeight,
                }}
                className="text-slate-700 cv-pro-text"
              >
                {summary}
              </p>
            </div>
          )}

          {/* Corps en 2 colonnes */}
          <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
            {/* Gauche 7/12 — Expériences & Formation */}
            <div className="col-span-7 flex flex-col justify-between h-full min-h-0">
              {experiences && experiences.length > 0 && (
                <div className="flex-1 flex flex-col justify-center min-h-0">
                  <div
                    className="flex items-center gap-1.5 mb-2 pb-1 border-b"
                    style={{ borderColor: `${color}30` }}
                  >
                    <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color }} />
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
                        className="relative pl-3 border-l-2"
                        style={{ borderColor: color }}
                      >
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3
                            style={{ fontSize: density.fontSize.base }}
                            className="font-bold text-slate-900 leading-tight"
                          >
                            {exp.role}
                          </h3>
                          <span
                            style={{ fontSize: density.fontSize.xs }}
                            className="font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0"
                          >
                            {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                          </span>
                        </div>
                        <p
                          style={{ color, fontSize: density.fontSize.sm }}
                          className="font-semibold mb-1"
                        >
                          {exp.company}{exp.city ? ` · ${exp.city}` : ""}
                        </p>
                        <ul
                          style={{ gap: density.spacing.bulletGap }}
                          className="text-slate-600 flex flex-col"
                        >
                          {exp.highlights.map((h, idx) => (
                            <li
                              key={idx}
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {educations && educations.length > 0 && (
                <div className="pt-1.5">
                  <div
                    className="flex items-center gap-1.5 mb-2 pb-1 border-b"
                    style={{ borderColor: `${color}30` }}
                  >
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <h2
                      style={{ fontSize: density.fontSize.heading }}
                      className="font-bold uppercase tracking-wider text-slate-900"
                    >
                      Formation & Études
                    </h2>
                  </div>
                  <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                    {educations.map((edu) => (
                      <div
                        key={edu.id}
                        style={{ padding: density.spacing.cardPadding }}
                        className="flex justify-between items-start bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <div>
                          <h3
                            style={{ fontSize: density.fontSize.base }}
                            className="font-bold text-slate-900 leading-snug"
                          >
                            {edu.degree}{edu.field ? ` — ${edu.field}` : ""}
                          </h3>
                          <p
                            style={{ fontSize: density.fontSize.xs }}
                            className="text-slate-500 mt-0.5"
                          >
                            {edu.school}{edu.city ? ` (${edu.city})` : ""}
                          </p>
                        </div>
                        <span
                          style={{ fontSize: density.fontSize.xs }}
                          className="font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0"
                        >
                          {edu.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Droite 5/12 — Compétences, Langues, Projets */}
            <div className="col-span-5 flex flex-col justify-between h-full min-h-0">
              {skills && skills.length > 0 && (
                <div className="flex-1 flex flex-col justify-center min-h-0">
                  <h3
                    style={{ fontSize: density.fontSize.heading, borderColor: `${color}30` }}
                    className="font-bold uppercase tracking-wider text-slate-900 mb-2 pb-1 border-b"
                  >
                    Compétences & Outils
                  </h3>
                  <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                    {skills.map((cat) => (
                      <div key={cat.id}>
                        <h4
                          style={{ fontSize: density.fontSize.xs }}
                          className="font-bold text-slate-800 uppercase tracking-wide mb-1"
                        >
                          {cat.category}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.items.map((item, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: color,
                                fontSize: density.fontSize.xs,
                              }}
                              className="inline-block px-2 py-0.5 rounded-full font-semibold text-white leading-tight shadow-xs"
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

              {languages && languages.length > 0 && (
                <div className="pt-1.5">
                  <h3
                    style={{ fontSize: density.fontSize.heading, borderColor: `${color}30` }}
                    className="font-bold uppercase tracking-wider text-slate-900 mb-2 pb-1 border-b"
                  >
                    Langues
                  </h3>
                  <div className="space-y-1">
                    {languages.map((l) => (
                      <div
                        key={l.id}
                        style={{ fontSize: density.fontSize.xs }}
                        className="flex justify-between items-center border-b border-slate-100 pb-0.5 last:border-0"
                      >
                        <span className="font-semibold text-slate-800">{l.name}</span>
                        <span className="font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {l.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections?.projects && sections.projects.length > 0 && (
                <div className="pt-1.5">
                  <div
                    className="flex items-center gap-1.5 mb-1.5 pb-1 border-b"
                    style={{ borderColor: `${color}30` }}
                  >
                    <FolderGit2 className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <h3
                      style={{ fontSize: density.fontSize.heading }}
                      className="font-bold uppercase tracking-wider text-slate-900"
                    >
                      Projets Notables
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {sections.projects.map((p) => (
                      <div
                        key={p.id}
                        style={{ padding: density.spacing.cardPadding }}
                        className="rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <p
                          style={{ fontSize: density.fontSize.sm }}
                          className="font-bold text-slate-900 leading-snug"
                        >
                          {p.name}
                        </p>
                        <p
                          style={{ fontSize: density.fontSize.xs }}
                          className="text-slate-500 mt-0.5 leading-snug line-clamp-1"
                        >
                          {p.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections?.certifications && sections.certifications.length > 0 && (
                <div className="pt-1.5">
                  <div
                    className="flex items-center gap-1.5 mb-1.5 pb-1 border-b"
                    style={{ borderColor: `${color}30` }}
                  >
                    <Award className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <h3
                      style={{ fontSize: density.fontSize.heading }}
                      className="font-bold uppercase tracking-wider text-slate-900"
                    >
                      Certifications
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {sections.certifications.map((c) => (
                      <div key={c.id} style={{ fontSize: density.fontSize.xs }}>
                        <p className="font-bold text-slate-800 leading-snug">{c.title}</p>
                        <p className="text-slate-500">{c.issuer} · {c.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{ fontSize: density.fontSize.xs }}
        className="px-7 py-2 text-center border-t border-slate-100 text-slate-400 shrink-0"
      >
        Créé avec MonCV.ai · Design Créatif
      </div>
    </div>
  );
};
