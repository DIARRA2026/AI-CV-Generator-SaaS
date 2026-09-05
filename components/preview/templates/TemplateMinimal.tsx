import React from "react";
import { ResumeData } from "@/lib/types";
import { getResumeDensity } from "@/lib/resume-density";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateMinimal: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#111827";
  const density = getResumeDensity(data);

  return (
    <div
      className="min-h-[297mm] max-h-[297mm] h-full flex-1 bg-white text-zinc-800 font-sans leading-relaxed flex flex-col justify-between overflow-hidden"
      style={{ padding: density.spacing.pagePadding }}
    >
      <div
        className="flex-1 flex flex-col justify-between min-h-0"
        style={{ gap: density.spacing.sectionGap }}
      >
        {/* Header minimaliste */}
        <div className="mb-2">
          <div className="flex justify-between items-start">
            <div>
              <h1
                style={{ fontSize: density.fontSize.title }}
                className="font-light tracking-tight text-zinc-900 leading-none"
              >
                <span className="font-bold">{personal.firstName}</span> {personal.lastName}
              </h1>
              <p
                style={{ fontSize: density.fontSize.role }}
                className="tracking-widest text-zinc-500 mt-1 uppercase font-medium"
              >
                {personal.title}
              </p>
            </div>
            {design.showPhoto && personal.photoUrl && (
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                style={{ width: density.spacing.photoSize, height: density.spacing.photoSize }}
                className="rounded-full grayscale object-cover border border-zinc-300 shrink-0"
                crossOrigin="anonymous"
              />
            )}
          </div>

          {/* Contact en ligne */}
          <div
            style={{ fontSize: density.fontSize.xs }}
            className="flex flex-wrap gap-x-3 gap-y-1 text-zinc-500 mt-2.5 pt-2 border-t border-zinc-200"
          >
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>· {personal.phone}</span>}
            {(personal.city || personal.country) && (
              <span>· {[personal.city, personal.country].filter(Boolean).join(", ")}</span>
            )}
            {(personal.birthDate || personal.birthPlace) && (
              <span>
                · {[
                  personal.birthDate ? `Né(e) le ${personal.birthDate}` : "",
                  personal.birthPlace ? `à ${personal.birthPlace}` : ""
                ].filter(Boolean).join(" ")}
              </span>
            )}
            {personal.maritalStatus && <span>· {personal.maritalStatus}</span>}
            {personal.linkedin && <span>· {personal.linkedin}</span>}
            {personal.website && <span>· {personal.website}</span>}
          </div>
        </div>

        {/* Profil */}
        {summary && (
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="uppercase font-bold tracking-widest text-zinc-400 mb-1"
            >
              À Propos
            </h2>
            <p
              style={{
                fontSize: density.fontSize.summary,
                lineHeight: density.lineHeight,
              }}
              className="text-zinc-700 cv-pro-text"
            >
              {summary}
            </p>
          </div>
        )}

        {/* Expérience */}
        {experiences && experiences.length > 0 && (
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="uppercase font-bold tracking-widest text-zinc-400 mb-1.5"
            >
              Expérience
            </h2>
            <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
              {experiences.map((exp) => (
                <div key={exp.id} className="grid grid-cols-4 gap-3">
                  <div
                    style={{ fontSize: density.fontSize.xs }}
                    className="col-span-1 text-zinc-400 pt-0.5 leading-snug"
                  >
                    {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                  </div>
                  <div className="col-span-3">
                    <h3
                      style={{ fontSize: density.fontSize.base }}
                      className="font-semibold text-zinc-900 leading-tight"
                    >
                      {exp.role}
                    </h3>
                    <p
                      style={{ fontSize: density.fontSize.sm }}
                      className="text-zinc-600 mb-1 font-medium mt-0.5"
                    >
                      {exp.company}{exp.city ? ` — ${exp.city}` : ""}
                    </p>
                    <ul
                      style={{ gap: density.spacing.bulletGap }}
                      className="flex flex-col text-zinc-600"
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
                          <span className="text-zinc-400 font-bold shrink-0">–</span>
                          <span className="flex-1">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formation */}
        {educations && educations.length > 0 && (
          <div className="flex-1 flex flex-col justify-center min-h-0 pt-1">
            <h2
              style={{ fontSize: density.fontSize.heading }}
              className="uppercase font-bold tracking-widest text-zinc-400 mb-1.5"
            >
              Formation
            </h2>
            <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
              {educations.map((edu) => (
                <div key={edu.id} className="grid grid-cols-4 gap-3">
                  <div
                    style={{ fontSize: density.fontSize.xs }}
                    className="col-span-1 text-zinc-400 pt-0.5"
                  >
                    {edu.year}
                  </div>
                  <div className="col-span-3">
                    <h3
                      style={{ fontSize: density.fontSize.base }}
                      className="font-semibold text-zinc-900 leading-tight"
                    >
                      {edu.degree}{edu.field ? ` — ${edu.field}` : ""}
                    </h3>
                    <p
                      style={{ fontSize: density.fontSize.xs }}
                      className="text-zinc-500 mt-0.5"
                    >
                      {edu.school}{edu.city ? ` (${edu.city})` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compétences & Langues */}
        <div className="grid grid-cols-2 gap-5 pt-2.5 border-t border-zinc-200">
          {skills && skills.length > 0 && (
            <div>
              <h2
                style={{ fontSize: density.fontSize.heading }}
                className="uppercase font-bold tracking-widest text-zinc-400 mb-1.5"
              >
                Compétences
              </h2>
              <div className="space-y-1">
                {skills.map((s) => (
                  <div key={s.id} style={{ fontSize: density.fontSize.xs }}>
                    <span className="font-bold text-zinc-700">{s.category} : </span>
                    <span className="text-zinc-500">{s.items.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {languages && languages.length > 0 && (
              <div>
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="uppercase font-bold tracking-widest text-zinc-400 mb-1.5"
                >
                  Langues
                </h2>
                <div className="space-y-0.5">
                  {languages.map((l) => (
                    <div
                      key={l.id}
                      style={{ fontSize: density.fontSize.xs }}
                      className="flex justify-between text-zinc-700"
                    >
                      <span className="font-medium">{l.name}</span>
                      <span className="text-zinc-500">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sections?.interests && sections.interests.length > 0 && (
              <div>
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="uppercase font-bold tracking-widest text-zinc-400 mb-1"
                >
                  Intérêts
                </h2>
                <p
                  style={{ fontSize: density.fontSize.xs }}
                  className="text-zinc-500 leading-relaxed"
                >
                  {sections.interests.join(" · ")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{ fontSize: density.fontSize.xs }}
        className="pt-2 text-center text-zinc-400 border-t border-zinc-100 shrink-0"
      >
        Généré avec MonCV.ai
      </div>
    </div>
  );
};
