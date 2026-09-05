import React from "react";
import { ResumeData } from "@/lib/types";
import { getResumeDensity } from "@/lib/resume-density";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateATS: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const density = getResumeDensity(data);

  return (
    <div
      className="min-h-[297mm] max-h-[297mm] h-full flex-1 bg-white text-black font-sans leading-normal flex flex-col justify-between overflow-hidden"
      style={{ padding: density.spacing.pagePadding }}
    >
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{ gap: density.spacing.sectionGap }}
      >
        {/* Header ATS — centré, sobre, standardisé */}
        <div className="text-center pb-2.5 mb-1 border-b-2 border-black">
          {design.showPhoto && personal.photoUrl && (
            <div className="mb-2 flex justify-center">
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                style={{ width: density.spacing.photoSize, height: density.spacing.photoSize }}
                className="rounded-full object-cover border border-black shrink-0"
                crossOrigin="anonymous"
              />
            </div>
          )}
          <h1
            style={{ fontSize: density.fontSize.title }}
            className="font-bold uppercase tracking-tight text-black leading-tight"
          >
            {personal.firstName} {personal.lastName}
          </h1>
          <p
            style={{ fontSize: density.fontSize.role }}
            className="font-semibold text-black mt-0.5"
          >
            {personal.title}
          </p>
          <p
            style={{ fontSize: density.fontSize.xs }}
            className="text-black mt-1 leading-snug"
          >
            {[
              personal.email,
              personal.phone,
              [personal.city, personal.country].filter(Boolean).join(", "),
              [
                personal.birthDate ? `Né(e) le ${personal.birthDate}` : "",
                personal.birthPlace ? `à ${personal.birthPlace}` : ""
              ].filter(Boolean).join(" "),
              personal.maritalStatus,
              personal.driverLicense ? `Permis: ${personal.driverLicense}` : "",
              personal.linkedin,
              personal.website,
            ]
              .filter(Boolean)
              .join("  |  ")}
          </p>
        </div>

        {/* Résumé Professionnel */}
        {summary && (
          <div>
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1"
            >
              RÉSUMÉ PROFESSIONNEL
            </h2>
            <p
              style={{
                fontSize: density.fontSize.summary,
                lineHeight: density.lineHeight,
              }}
              className="text-black cv-pro-text"
            >
              {summary}
            </p>
          </div>
        )}

        {/* Expérience Professionnelle */}
        {experiences && experiences.length > 0 && (
          <div>
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5"
            >
              EXPÉRIENCE PROFESSIONNELLE
            </h2>
            <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div
                    style={{ fontSize: density.fontSize.base }}
                    className="flex justify-between items-baseline font-bold text-black"
                  >
                    <span>{exp.role}</span>
                    <span style={{ fontSize: density.fontSize.xs }} className="font-semibold shrink-0">
                      {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: density.fontSize.xs }}
                    className="flex justify-between text-black mb-1"
                  >
                    <span className="italic font-medium">{exp.company}</span>
                    {exp.city && <span className="italic">{exp.city}</span>}
                  </div>
                  <ul
                    style={{ gap: density.spacing.bulletGap }}
                    className="flex flex-col text-black"
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
                        <span className="font-bold shrink-0 mt-[-1px]">•</span>
                        <span className="flex-1">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formation */}
        {educations && educations.length > 0 && (
          <div>
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5"
            >
              FORMATION & DIPLÔMES
            </h2>
            <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
              {educations.map((edu) => (
                <div
                  key={edu.id}
                  style={{ fontSize: density.fontSize.base }}
                  className="flex justify-between items-start text-black"
                >
                  <div>
                    <span className="font-bold">{edu.degree}</span>
                    {edu.field && <span> — {edu.field}</span>}
                    <span
                      style={{ fontSize: density.fontSize.xs }}
                      className="italic block mt-0.5"
                    >
                      {edu.school}{edu.city ? `, ${edu.city}` : ""}
                    </span>
                  </div>
                  <span
                    style={{ fontSize: density.fontSize.xs }}
                    className="font-semibold shrink-0"
                  >
                    {edu.year}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compétences */}
        {skills && skills.length > 0 && (
          <div>
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1"
            >
              COMPÉTENCES TECHNIQUES & LOGICIELS
            </h2>
            <div style={{ fontSize: density.fontSize.xs }} className="space-y-1 text-black">
              {skills.map((cat) => (
                <div key={cat.id} className="flex items-start gap-1">
                  <span className="font-bold shrink-0">{cat.category} :</span>
                  <span>{cat.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Langues */}
        {languages && languages.length > 0 && (
          <div>
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1"
            >
              LANGUES
            </h2>
            <p style={{ fontSize: density.fontSize.xs }} className="text-black">
              {languages.map((l) => `${l.name} (${l.level})`).join("  |  ")}
            </p>
          </div>
        )}

        {/* Certifications */}
        {sections?.certifications && sections.certifications.length > 0 && (
          <div>
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5"
            >
              CERTIFICATIONS
            </h2>
            <div style={{ fontSize: density.fontSize.xs }} className="space-y-1 text-black">
              {sections.certifications.map((c) => (
                <div key={c.id} className="flex items-start gap-1">
                  <span className="font-bold shrink-0">–</span>
                  <span><span className="font-bold">{c.title}</span> — {c.issuer} ({c.year})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projets */}
        {sections?.projects && sections.projects.length > 0 && (
          <div>
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5"
            >
              PROJETS & RÉALISATIONS
            </h2>
            <div style={{ fontSize: density.fontSize.xs }} className="space-y-1 text-black">
              {sections.projects.map((p) => (
                <div key={p.id} className="flex items-start gap-1">
                  <span className="font-bold shrink-0">–</span>
                  <span><span className="font-bold">{p.name}</span> : {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        style={{ fontSize: density.fontSize.xs }}
        className="text-center text-gray-500 pt-2 border-t border-gray-300 mt-2 shrink-0"
      >
        CV Optimisé ATS (Applicant Tracking System) · MonCV.ai
      </div>
    </div>
  );
};
