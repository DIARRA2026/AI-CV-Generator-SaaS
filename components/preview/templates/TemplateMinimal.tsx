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
    <div className="p-10 min-h-[297mm] h-full flex-1 bg-white text-zinc-800 font-sans leading-relaxed flex flex-col justify-between">
      <div className={`flex-1 flex flex-col justify-between ${density.sectionGap}`}>
        {/* Header minimaliste */}
        <div className="mb-7">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-[26px] font-light tracking-tight text-zinc-900 leading-none">
                <span className="font-bold">{personal.firstName}</span> {personal.lastName}
              </h1>
              <p className="text-[10.5px] tracking-widest text-zinc-500 mt-1.5 uppercase font-medium">
                {personal.title}
              </p>
            </div>
            {design.showPhoto && personal.photoUrl && (
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                className="w-16 h-16 rounded-full grayscale object-cover border border-zinc-300"
                crossOrigin="anonymous"
              />
            )}
          </div>

          {/* Contact en ligne */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9.5px] text-zinc-500 mt-4 pt-3 border-t border-zinc-200">
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
            <h2 className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-400 mb-1.5">
              À Propos
            </h2>
            <p className={`text-zinc-700 ${density.summaryTextSize} ${density.lineHeight} text-justify`}>
              {summary}
            </p>
          </div>
        )}

        {/* Expérience */}
        {experiences && experiences.length > 0 && (
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <h2 className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-400 mb-2">
              Expérience
            </h2>
            <div className={density.itemGap}>
              {experiences.map((exp) => (
                <div key={exp.id} className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 text-[9.5px] text-zinc-400 pt-0.5 leading-snug">
                    {exp.startDate} –{" "}
                    {exp.current ? "Présent" : exp.endDate}
                  </div>
                  <div className="col-span-3">
                    <h3 className={`font-semibold text-zinc-900 ${density.mode === "spacious" ? "text-xs" : "text-[11px]"} leading-tight`}>{exp.role}</h3>
                    <p className="text-[10px] text-zinc-600 mb-1 font-medium mt-0.5">
                      {exp.company}{exp.city ? ` — ${exp.city}` : ""}
                    </p>
                    <ul className={`${density.bulletGap} text-zinc-600 ${density.bodyTextSize}`}>
                      {exp.highlights.map((h, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-zinc-400 font-bold shrink-0">–</span>
                          <span>{h}</span>
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
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <h2 className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-400 mb-2">
              Formation
            </h2>
            <div className={density.mode === "spacious" ? "space-y-3" : "space-y-1.5"}>
              {educations.map((edu) => (
                <div key={edu.id} className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 text-[9.5px] text-zinc-400 pt-0.5">
                    {edu.year}
                  </div>
                  <div className="col-span-3">
                    <h3 className={`font-semibold text-zinc-900 ${density.mode === "spacious" ? "text-xs" : "text-[11px]"} leading-tight`}>
                      {edu.degree}{edu.field ? ` — ${edu.field}` : ""}
                    </h3>
                    <p className="text-[9.5px] text-zinc-500 mt-0.5">
                      {edu.school}{edu.city ? ` (${edu.city})` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compétences & Langues */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-200">
          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-400 mb-2.5">
                Compétences
              </h2>
              <div className="space-y-2">
                {skills.map((s) => (
                  <div key={s.id}>
                    <span className="text-[9.5px] font-bold text-zinc-700">{s.category} : </span>
                    <span className="text-[9.5px] text-zinc-500">{s.items.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {languages && languages.length > 0 && (
              <div>
                <h2 className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-400 mb-2.5">
                  Langues
                </h2>
                <div className="space-y-1">
                  {languages.map((l) => (
                    <div key={l.id} className="flex justify-between text-[9.5px] text-zinc-700">
                      <span className="font-medium">{l.name}</span>
                      <span className="text-zinc-500">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sections.interests && sections.interests.length > 0 && (
              <div>
                <h2 className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-400 mb-1.5">
                  Intérêts
                </h2>
                <p className="text-[9.5px] text-zinc-500 leading-relaxed">
                  {sections.interests.join(" · ")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 text-center text-[8px] text-zinc-400 border-t border-zinc-100">
        Généré avec MonCV.ai
      </div>
    </div>
  );
};
