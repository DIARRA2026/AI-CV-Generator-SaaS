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
    <div className="min-h-[297mm] max-h-[297mm] h-full flex-1 bg-white text-slate-800 font-sans leading-normal flex flex-col justify-between overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Banner supérieur élégant et percutant */}
        <div
          className="text-white shrink-0 shadow-sm"
          style={{
            backgroundColor: color,
            paddingLeft: density.spacing.pagePadding,
            paddingRight: density.spacing.pagePadding,
            paddingTop: `${Math.round(20 * density.scale)}px`,
            paddingBottom: `${Math.round(18 * density.scale)}px`,
          }}
        >
          <div className="flex items-center gap-5">
            {design.showPhoto && personal.photoUrl && (
              <div className="relative shrink-0">
                <img
                  src={personal.photoUrl}
                  alt={`${personal.firstName} ${personal.lastName}`}
                  style={{ width: density.spacing.photoSize, height: density.spacing.photoSize }}
                  className="rounded-2xl object-cover border-2 border-white/50 shadow-md"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {personal.title && (
                <span
                  style={{ fontSize: density.fontSize.xs }}
                  className="inline-block bg-white/20 px-3 py-1 rounded-full font-bold tracking-wider uppercase mb-1.5 shadow-xs"
                >
                  {personal.title}
                </span>
              )}
              <h1
                style={{ fontSize: density.fontSize.title }}
                className="font-black tracking-tight leading-tight uppercase text-white"
              >
                {personal.firstName} {personal.lastName}
              </h1>
              {/* Coordonnées & État civil bien ordonnés */}
              <div
                style={{ fontSize: density.fontSize.xs }}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-white/95 font-medium"
              >
                {personal.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>{personal.email}</span>
                  </span>
                )}
                {personal.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>{personal.phone}</span>
                  </span>
                )}
                {(personal.city || personal.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>{[personal.city, personal.country].filter(Boolean).join(", ")}</span>
                  </span>
                )}
                {(personal.birthDate || personal.birthPlace) && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>
                      {[
                        personal.birthDate ? `Né(e) le ${personal.birthDate}` : "",
                        personal.birthPlace ? `à ${personal.birthPlace}` : ""
                      ].filter(Boolean).join(" ")}
                    </span>
                  </span>
                )}
                {personal.maritalStatus && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>{personal.maritalStatus}</span>
                  </span>
                )}
                {personal.linkedin && (
                  <span className="flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>{personal.linkedin}</span>
                  </span>
                )}
                {personal.website && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>{personal.website}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Corps du CV avec structure ordonnée de haut en bas */}
        <div
          className="flex-1 flex flex-col min-h-0"
          style={{
            padding: density.spacing.pagePadding,
            gap: density.spacing.sectionGap,
          }}
        >
          {/* 1. Résumé / Profil Professionnel */}
          {summary && (
            <div
              className="bg-slate-50/90 rounded-2xl border border-slate-200/70 shadow-xs"
              style={{ padding: density.spacing.summaryPadding }}
            >
              <div
                className="flex items-center gap-2 mb-1.5 font-bold uppercase tracking-wider"
                style={{ color, fontSize: density.fontSize.heading }}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Profil Professionnel</span>
              </div>
              <p
                style={{
                  fontSize: density.fontSize.summary,
                  lineHeight: density.lineHeight,
                }}
                className="text-slate-700 cv-pro-text font-normal"
              >
                {summary}
              </p>
            </div>
          )}

          {/* 2. Corps en 2 colonnes harmonieuses (Gauche: 62% Expériences & Études, Droite: 38% Compétences, Permis, Langues) */}
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Colonne Principale Gauche (7 / 12) */}
            <div
              className="col-span-7 flex flex-col min-h-0"
              style={{ gap: density.spacing.sectionGap }}
            >
              {/* Expériences Professionnelles */}
              {experiences && experiences.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-2 pb-1.5 mb-3 border-b-2"
                    style={{ borderColor: `${color}40` }}
                  >
                    <Briefcase className="w-4 h-4 shrink-0" style={{ color }} />
                    <h2
                      style={{ fontSize: density.fontSize.heading }}
                      className="font-extrabold uppercase tracking-wider text-slate-900"
                    >
                      Expériences Professionnelles
                    </h2>
                  </div>
                  <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="bg-slate-50/60 rounded-xl border border-slate-100 relative overflow-hidden"
                        style={{ padding: density.spacing.cardPadding }}
                      >
                        {/* Ligne d'accent gauche */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3
                            style={{ fontSize: density.fontSize.base }}
                            className="font-bold text-slate-900 leading-tight"
                          >
                            {exp.role}
                          </h3>
                          <span
                            style={{ fontSize: density.fontSize.xs }}
                            className="font-semibold text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md shrink-0 shadow-2xs"
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
                        {exp.highlights && exp.highlights.length > 0 && (
                          <ul
                            style={{ gap: density.spacing.bulletGap }}
                            className="text-slate-600 flex flex-col mt-1"
                          >
                            {exp.highlights.map((h, idx) => (
                              <li
                                key={idx}
                                style={{
                                  fontSize: density.fontSize.sm,
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

              {/* Formation & Diplômes */}
              {educations && educations.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-2 pb-1.5 mb-3 border-b-2"
                    style={{ borderColor: `${color}40` }}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" style={{ color }} />
                    <h2
                      style={{ fontSize: density.fontSize.heading }}
                      className="font-extrabold uppercase tracking-wider text-slate-900"
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
                            className="font-bold text-slate-900 leading-snug"
                          >
                            {edu.degree}{edu.field ? ` — ${edu.field}` : ""}
                          </h3>
                          <p
                            style={{ fontSize: density.fontSize.sm }}
                            className="text-slate-600 mt-0.5 font-medium"
                          >
                            {edu.school}{edu.city ? ` (${edu.city})` : ""}
                          </p>
                        </div>
                        <span
                          style={{ fontSize: density.fontSize.xs }}
                          className="font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0 shadow-2xs"
                        >
                          {edu.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne Latérale Droite (5 / 12) */}
            <div
              className="col-span-5 flex flex-col min-h-0"
              style={{ gap: density.spacing.sectionGap }}
            >
              {/* Compétences & Savoir-faire */}
              {skills && skills.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-2 pb-1.5 mb-3 border-b-2"
                    style={{ borderColor: `${color}40` }}
                  >
                    <h3
                      style={{ fontSize: density.fontSize.heading }}
                      className="font-extrabold uppercase tracking-wider text-slate-900"
                    >
                      Compétences Clés
                    </h3>
                  </div>
                  <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                    {skills.map((cat) => (
                      <div key={cat.id}>
                        <h4
                          style={{ fontSize: density.fontSize.xs }}
                          className="font-bold text-slate-800 uppercase tracking-wide mb-1.5"
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
                              className="inline-block px-2.5 py-1 rounded-lg font-bold text-white leading-tight shadow-xs"
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

              {/* Certifications & Permis */}
              {sections?.certifications && sections.certifications.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-2 pb-1.5 mb-2.5 border-b-2"
                    style={{ borderColor: `${color}40` }}
                  >
                    <Award className="w-4 h-4 shrink-0" style={{ color }} />
                    <h3
                      style={{ fontSize: density.fontSize.heading }}
                      className="font-extrabold uppercase tracking-wider text-slate-900"
                    >
                      Permis & Certifications
                    </h3>
                  </div>
                  <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                    {sections.certifications.map((c) => (
                      <div
                        key={c.id}
                        style={{ padding: density.spacing.cardPadding }}
                        className="bg-slate-50/80 rounded-xl border border-slate-100"
                      >
                        <p
                          style={{ fontSize: density.fontSize.base }}
                          className="font-bold text-slate-900 leading-snug"
                        >
                          {c.title}
                        </p>
                        <p
                          style={{ fontSize: density.fontSize.xs }}
                          className="text-slate-600 font-medium mt-0.5"
                        >
                          {c.issuer} {c.year ? `· ${c.year}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projets Notables */}
              {sections?.projects && sections.projects.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-2 pb-1.5 mb-2.5 border-b-2"
                    style={{ borderColor: `${color}40` }}
                  >
                    <FolderGit2 className="w-4 h-4 shrink-0" style={{ color }} />
                    <h3
                      style={{ fontSize: density.fontSize.heading }}
                      className="font-extrabold uppercase tracking-wider text-slate-900"
                    >
                      Projets Notables
                    </h3>
                  </div>
                  <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                    {sections.projects.map((p) => (
                      <div
                        key={p.id}
                        style={{ padding: density.spacing.cardPadding }}
                        className="rounded-xl bg-slate-50/80 border border-slate-100"
                      >
                        <p
                          style={{ fontSize: density.fontSize.base }}
                          className="font-bold text-slate-900 leading-snug"
                        >
                          {p.name}
                        </p>
                        <p
                          style={{ fontSize: density.fontSize.xs }}
                          className="text-slate-600 mt-1 leading-snug font-normal"
                        >
                          {p.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Langues */}
              {languages && languages.length > 0 && (
                <div>
                  <div
                    className="flex items-center gap-2 pb-1.5 mb-2 border-b-2"
                    style={{ borderColor: `${color}40` }}
                  >
                    <Globe className="w-4 h-4 shrink-0" style={{ color }} />
                    <h3
                      style={{ fontSize: density.fontSize.heading }}
                      className="font-extrabold uppercase tracking-wider text-slate-900"
                    >
                      Langues
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {languages.map((l) => (
                      <div
                        key={l.id}
                        style={{
                          fontSize: density.fontSize.sm,
                          paddingTop: "4px",
                          paddingBottom: "4px",
                        }}
                        className="flex justify-between items-center border-b border-slate-100 last:border-0"
                      >
                        <span className="font-bold text-slate-800">{l.name}</span>
                        <span
                          style={{ fontSize: density.fontSize.xs }}
                          className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          {l.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Centres d'intérêt */}
              {sections?.interests && sections.interests.length > 0 && (
                <div>
                  <h4
                    style={{ fontSize: density.fontSize.heading }}
                    className="font-extrabold uppercase tracking-wider text-slate-900 mb-1.5 pb-1 border-b"
                    style-prop-border-color={`${color}30`}
                  >
                    Centres d'intérêt
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {sections.interests.map((interest, i) => (
                      <span
                        key={i}
                        style={{ fontSize: density.fontSize.xs }}
                        className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer sobre et élégant */}
      <div
        style={{ fontSize: density.fontSize.xs }}
        className="px-7 py-2 text-center border-t border-slate-100 text-slate-400 shrink-0"
      >
        Document certifié conforme • MonCV.ai
      </div>
    </div>
  );
};
