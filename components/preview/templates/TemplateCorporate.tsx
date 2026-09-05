import React from "react";
import { ResumeData } from "@/lib/types";
import { Mail, Phone, MapPin, Linkedin, Globe, Briefcase, GraduationCap, Award, Wrench } from "lucide-react";
import { getResumeDensity } from "@/lib/resume-density";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateCorporate: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#1e3a8a";
  const density = getResumeDensity(data);

  return (
    <div
      className="min-h-[297mm] max-h-[297mm] h-full flex-1 bg-white text-slate-800 font-sans leading-relaxed flex flex-col justify-between overflow-hidden"
      style={{ padding: density.spacing.pagePadding }}
    >
      <div
        className="flex-1 flex flex-col justify-between min-h-0"
        style={{ gap: density.spacing.sectionGap }}
      >
        {/* Header Corporate En Bandeau */}
        <div
          className="flex items-center justify-between border-b-2 pb-3 mb-2"
          style={{ borderColor: color }}
        >
          <div className="flex items-center gap-4">
            {design.showPhoto && personal.photoUrl && (
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                style={{ width: density.spacing.photoSize, height: density.spacing.photoSize, borderColor: color }}
                className="rounded-xl object-cover border-2 shadow-sm shrink-0"
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1
                style={{ fontSize: density.fontSize.title }}
                className="font-black text-slate-900 tracking-tight uppercase leading-tight"
              >
                {personal.firstName} {personal.lastName}
              </h1>
              <p
                style={{ color, fontSize: density.fontSize.role }}
                className="font-bold uppercase tracking-wider mt-0.5"
              >
                {personal.title}
              </p>
            </div>
          </div>

          {/* Contact En-tête */}
          <div
            className="text-right space-y-0.5 text-slate-600 shrink-0"
            style={{ fontSize: density.fontSize.xs }}
          >
            {personal.email && <p className="font-semibold text-slate-900">{personal.email}</p>}
            {personal.phone && <p>{personal.phone}</p>}
            {(personal.city || personal.country) && (
              <p>{[personal.city, personal.country].filter(Boolean).join(", ")}</p>
            )}
            {(personal.birthDate || personal.birthPlace) && (
              <p>
                {[
                  personal.birthDate ? `Né(e) le ${personal.birthDate}` : "",
                  personal.birthPlace ? `à ${personal.birthPlace}` : ""
                ].filter(Boolean).join(" ")}
              </p>
            )}
            {personal.maritalStatus && <p>{personal.maritalStatus}</p>}
            {personal.linkedin && <p className="text-slate-500">{personal.linkedin}</p>}
          </div>
        </div>

        {/* Résumé Exécutif */}
        {summary && (
          <div
            className="bg-slate-50/80 rounded-xl border-l-4 shadow-xs"
            style={{
              borderColor: color,
              padding: density.spacing.summaryPadding,
            }}
          >
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="font-bold uppercase tracking-wider text-slate-900 mb-1"
            >
              Synthèse Professionnelle
            </h2>
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

        {/* 2 Colonnes Structurées (Remplissage A4 ordonné) */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 pt-1">
          {/* Colonne Gauche (7/12) : Expériences & Formations */}
          <div
            className="col-span-7 flex flex-col min-h-0"
            style={{ gap: density.spacing.sectionGap }}
          >
            {experiences && experiences.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 mb-2 pb-1 border-b"
                  style={{ borderColor: `${color}30` }}
                >
                  <Briefcase className="w-3.5 h-3.5" style={{ color }} />
                  <h2
                    style={{ fontSize: density.fontSize.heading }}
                    className="font-bold uppercase tracking-wider text-slate-900"
                  >
                    Parcours Professionnel
                  </h2>
                </div>
                <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                  {experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="relative pl-3 border-l-2 bg-slate-50/50 p-2 rounded-r-lg border-slate-100"
                      style={{ borderColor: `${color}40` }}
                    >
                      {/* Alignement Tabulaire */}
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3
                          style={{ fontSize: density.fontSize.base }}
                          className="font-bold text-slate-900"
                        >
                          {exp.role}
                        </h3>
                        <span
                          style={{ fontSize: density.fontSize.xs }}
                          className="font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0 shadow-2xs"
                        >
                          {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                        </span>
                      </div>
                      <p
                        style={{ color, fontSize: density.fontSize.sm }}
                        className="font-semibold mb-1"
                      >
                        {exp.company} {exp.city ? `(${exp.city})` : ""}
                      </p>
                      {exp.highlights && exp.highlights.length > 0 && (
                        <ul
                          style={{ gap: density.spacing.bulletGap }}
                          className="text-slate-600 flex flex-col"
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

            {/* Formations */}
            {educations && educations.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 mb-2 pb-1 border-b"
                  style={{ borderColor: `${color}30` }}
                >
                  <GraduationCap className="w-3.5 h-3.5" style={{ color }} />
                  <h2
                    style={{ fontSize: density.fontSize.heading }}
                    className="font-bold uppercase tracking-wider text-slate-900"
                  >
                    Diplômes & Cursus
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
                        style={{ fontSize: density.fontSize.xs }}
                        className="font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border shrink-0 shadow-2xs"
                      >
                        {edu.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne Droite (5/12) : Compétences, Langues, Extra */}
          <div
            className="col-span-5 flex flex-col min-h-0"
            style={{ gap: density.spacing.sectionGap }}
          >
            {/* Compétences */}
            {skills && skills.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 mb-2 pb-1 border-b"
                  style={{ borderColor: `${color}30` }}
                >
                  <Wrench className="w-3.5 h-3.5" style={{ color }} />
                  <h2
                    style={{ fontSize: density.fontSize.heading }}
                    className="font-bold uppercase tracking-wider text-slate-900"
                  >
                    Domaines d'Expertise
                  </h2>
                </div>
                <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                  {skills.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <h4
                        style={{ fontSize: density.fontSize.xs }}
                        className="font-bold text-slate-900 uppercase tracking-wide"
                      >
                        {cat.category}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.items.map((item, idx) => (
                          <span
                            key={idx}
                            style={{ fontSize: density.fontSize.xs }}
                            className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-semibold rounded-lg border border-slate-200"
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
                  className="flex items-center gap-2 mb-2 pb-1 border-b"
                  style={{ borderColor: `${color}30` }}
                >
                  <Award className="w-3.5 h-3.5" style={{ color }} />
                  <h2
                    style={{ fontSize: density.fontSize.heading }}
                    className="font-bold uppercase tracking-wider text-slate-900"
                  >
                    Certifications & Permis
                  </h2>
                </div>
                <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                  {sections.certifications.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: density.spacing.cardPadding,
                      }}
                      className="bg-slate-50 rounded-lg border border-slate-100"
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
                        {c.issuer} ({c.year})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Langues */}
            {languages && languages.length > 0 && (
              <div>
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
                      style={{ fontSize: density.fontSize.sm }}
                      className="flex justify-between items-center py-1 border-b border-slate-100"
                    >
                      <span className="font-bold text-slate-800">{l.name}</span>
                      <span
                        style={{ fontSize: density.fontSize.xs }}
                        className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                      >
                        {l.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{ fontSize: density.fontSize.xs }}
        className="pt-2 text-center border-t border-slate-100 text-slate-400 shrink-0"
      >
        Profil Professionnel • Certifié MonCV.ai
      </div>
    </div>
  );
};
