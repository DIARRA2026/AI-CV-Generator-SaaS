import React from "react";
import { ResumeData } from "@/lib/types";
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar, Users, Car } from "lucide-react";
import { getResumeDensity } from "@/lib/resume-density";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateElegant: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#0f172a";
  const density = getResumeDensity(data);

  return (
    <div
      className="min-h-[297mm] max-h-[297mm] h-full flex-1 bg-white text-slate-800 font-serif leading-relaxed flex flex-col justify-between overflow-hidden"
      style={{ padding: density.spacing.pagePadding }}
    >
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{ gap: density.spacing.sectionGap }}
      >
        {/* Header Centré Élégant */}
        <div
          className="text-center pb-3 mb-2"
          style={{ borderBottom: `2px solid ${color}` }}
        >
          {design.showPhoto && personal.photoUrl && (
            <div className="mb-2 flex justify-center">
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                style={{
                  width: density.spacing.photoSize,
                  height: density.spacing.photoSize,
                  border: `2px solid ${color}`,
                }}
                className="rounded-full object-cover p-0.5 shrink-0"
                crossOrigin="anonymous"
              />
            </div>
          )}
          <h1
            style={{ fontSize: density.fontSize.title }}
            className="font-bold tracking-widest uppercase text-slate-900 leading-tight"
          >
            {personal.firstName} {personal.lastName}
          </h1>
          <p
            style={{ color, fontSize: density.fontSize.role }}
            className="uppercase tracking-wider font-sans font-semibold mt-0.5 mb-1.5"
          >
            {personal.title}
          </p>

          {/* Barre de contact horizontale */}
          <div
            style={{ fontSize: density.fontSize.xs }}
            className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-sans text-slate-600 mt-1"
          >
            {personal.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{personal.email}</span>
              </span>
            )}
            {personal.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{personal.phone}</span>
              </span>
            )}
            {(personal.city || personal.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{[personal.city, personal.country].filter(Boolean).join(", ")}</span>
              </span>
            )}
            {(personal.birthDate || personal.birthPlace) && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
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
                <Users className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{personal.maritalStatus}</span>
              </span>
            )}
            {personal.driverLicense && (
              <span className="flex items-center gap-1">
                <Car className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Permis: {personal.driverLicense}</span>
              </span>
            )}
            {personal.linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{personal.linkedin}</span>
              </span>
            )}
            {personal.website && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{personal.website}</span>
              </span>
            )}
          </div>
        </div>

        {/* Profil */}
        {summary && (
          <div>
            <h2
              style={{
                color,
                borderColor: `${color}30`,
                fontSize: density.fontSize.heading,
              }}
              className="uppercase tracking-widest font-bold font-sans border-b pb-0.5 mb-1.5"
            >
              Profil Professionnel
            </h2>
            <p
              style={{
                fontSize: density.fontSize.summary,
                lineHeight: density.lineHeight,
              }}
              className="text-slate-700 italic cv-pro-text"
            >
              {summary}
            </p>
          </div>
        )}

        {/* Corps 2 colonnes */}
        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Gauche — Expérience & Formation */}
          <div className="col-span-2 flex flex-col min-h-0" style={{ gap: density.spacing.sectionGap }}>
            {experiences && experiences.length > 0 && (
              <div>
                <h2
                  style={{
                    color,
                    borderColor: `${color}30`,
                    fontSize: density.fontSize.heading,
                  }}
                  className="uppercase tracking-widest font-bold font-sans border-b pb-0.5 mb-2"
                >
                  Expériences Professionnelles
                </h2>
                <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                  {experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="pl-3 border-l-2"
                      style={{ borderColor: `${color}40` }}
                    >
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3
                          style={{ fontSize: density.fontSize.base }}
                          className="font-bold text-slate-900"
                        >
                          {exp.role}
                        </h3>
                        <span
                          style={{ fontSize: density.fontSize.sm }}
                          className="font-sans text-slate-500 italic shrink-0"
                        >
                          {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                        </span>
                      </div>
                      <p
                        style={{ fontSize: density.fontSize.sm }}
                        className="font-sans font-medium text-slate-600 mb-1"
                      >
                        {exp.company}{exp.city ? ` | ${exp.city}` : ""}
                      </p>
                      <ul
                        style={{ gap: density.spacing.bulletGap }}
                        className="flex flex-col text-slate-700 font-sans"
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
              <div>
                <h2
                  style={{
                    color,
                    borderColor: `${color}30`,
                    fontSize: density.fontSize.heading,
                  }}
                  className="uppercase tracking-widest font-bold font-sans border-b pb-0.5 mb-2"
                >
                  Formation & Diplômes
                </h2>
                <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                  {educations.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start">
                      <div>
                        <h3
                          style={{ fontSize: density.fontSize.base }}
                          className="font-bold text-slate-900"
                        >
                          {edu.degree}{edu.field ? ` — ${edu.field}` : ""}
                        </h3>
                        <p
                          style={{ fontSize: density.fontSize.sm }}
                          className="font-sans text-slate-600 mt-0.5"
                        >
                          {edu.school}{edu.city ? ` (${edu.city})` : ""}
                        </p>
                      </div>
                      <span
                        style={{ fontSize: density.fontSize.sm }}
                        className="font-sans text-slate-500 italic shrink-0"
                      >
                        {edu.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Droite — Compétences, Langues, Intérêts */}
          <div className="col-span-1 flex flex-col min-h-0" style={{ gap: density.spacing.sectionGap }}>
            {skills && skills.length > 0 && (
              <div>
                <h2
                  style={{
                    color,
                    borderColor: `${color}30`,
                    fontSize: density.fontSize.heading,
                  }}
                  className="uppercase tracking-widest font-bold font-sans border-b pb-0.5 mb-2"
                >
                  Compétences
                </h2>
                <div style={{ gap: density.spacing.itemGap }} className="font-sans flex flex-col">
                  {skills.map((cat) => (
                    <div key={cat.id}>
                      <h4
                        style={{ fontSize: density.fontSize.xs }}
                        className="font-bold text-slate-800 uppercase tracking-wide mb-1"
                      >
                        {cat.category}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {cat.items.map((item, idx) => (
                          <span
                            key={idx}
                            style={{ fontSize: density.fontSize.xs }}
                            className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium leading-tight border border-slate-200"
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
              <div>
                <h2
                  style={{
                    color,
                    borderColor: `${color}30`,
                    fontSize: density.fontSize.heading,
                  }}
                  className="uppercase tracking-widest font-bold font-sans border-b pb-0.5 mb-1.5"
                >
                  Langues
                </h2>
                <div className="space-y-1 font-sans">
                  {languages.map((l) => (
                    <div
                      key={l.id}
                      style={{ fontSize: density.fontSize.xs }}
                      className="flex justify-between items-center border-b border-slate-100 pb-0.5 last:border-0"
                    >
                      <span className="font-semibold text-slate-800">{l.name}</span>
                      <span className="text-slate-500 italic">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sections?.interests && sections.interests.length > 0 && (
              <div>
                <h2
                  style={{
                    color,
                    borderColor: `${color}30`,
                    fontSize: density.fontSize.heading,
                  }}
                  className="uppercase tracking-widest font-bold font-sans border-b pb-0.5 mb-1"
                >
                  Intérêts
                </h2>
                <p
                  style={{ fontSize: density.fontSize.xs }}
                  className="font-sans text-slate-600 leading-relaxed"
                >
                  {sections.interests.join(" • ")}
                </p>
              </div>
            )}

            {sections?.certifications && sections.certifications.length > 0 && (
              <div>
                <h2
                  style={{
                    color,
                    borderColor: `${color}30`,
                    fontSize: density.fontSize.heading,
                  }}
                  className="uppercase tracking-widest font-bold font-sans border-b pb-0.5 mb-1"
                >
                  Certifications
                </h2>
                <div className="space-y-1 font-sans">
                  {sections.certifications.map((c) => (
                    <div key={c.id}>
                      <p style={{ fontSize: density.fontSize.sm }} className="font-bold text-slate-800 leading-snug">{c.title}</p>
                      <p style={{ fontSize: density.fontSize.xs }} className="text-slate-500">{c.issuer} — {c.year}</p>
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
        className="text-center font-sans text-slate-400 pt-2 border-t border-slate-100 mt-2 shrink-0"
      >
        CV Réalisé avec MonCV.ai
      </div>
    </div>
  );
};
