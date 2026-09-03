import React from "react";
import { ResumeData } from "@/lib/types";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateATS: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;

  return (
    <div className="px-10 pt-9 pb-7 min-h-[297mm] bg-white text-black font-sans text-[11px] leading-normal flex flex-col justify-between">
      <div>
        {/* Header ATS — centré, sobre, standardisé */}
        <div className="text-center pb-4 mb-5 border-b-2 border-black">
          {design.showPhoto && personal.photoUrl && (
            <div className="mb-2.5 flex justify-center">
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                className="w-20 h-20 rounded-full object-cover border border-black"
                crossOrigin="anonymous"
              />
            </div>
          )}
          <h1 className="text-[22px] font-bold uppercase tracking-tight text-black leading-tight">
            {personal.firstName} {personal.lastName}
          </h1>
          <p className="text-[10.5px] font-semibold text-black mt-0.5">
            {personal.title}
          </p>
          <p className="text-[10px] text-black mt-1.5 leading-snug">
            {[
              personal.email,
              personal.phone,
              [personal.city, personal.country].filter(Boolean).join(", "),
              personal.linkedin,
              personal.website,
            ]
              .filter(Boolean)
              .join("  |  ")}
          </p>
        </div>

        {/* Résumé Professionnel */}
        {summary && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
              RÉSUMÉ PROFESSIONNEL
            </h2>
            <p className="text-[10.5px] leading-relaxed text-black">
              {summary}
            </p>
          </div>
        )}

        {/* Expérience Professionnelle */}
        {experiences && experiences.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2.5">
              EXPÉRIENCE PROFESSIONNELLE
            </h2>
            <div className="space-y-3.5">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-bold text-[11px] text-black">
                    <span>{exp.role}</span>
                    <span className="font-semibold text-[10px]">
                      {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-black mb-1">
                    <span className="italic font-medium">{exp.company}</span>
                    {exp.city && <span className="italic">{exp.city}</span>}
                  </div>
                  <ul className="list-disc list-outside ml-5 space-y-0.5 text-[10px] text-black">
                    {exp.highlights.map((h, idx) => (
                      <li key={idx} className="leading-snug">{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formation */}
        {educations && educations.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2.5">
              FORMATION & DIPLÔMES
            </h2>
            <div className="space-y-2.5">
              {educations.map((edu) => (
                <div key={edu.id} className="flex justify-between items-start text-[10.5px] text-black">
                  <div>
                    <span className="font-bold">{edu.degree}</span>
                    {edu.field && <span> — {edu.field}</span>}
                    <span className="italic block text-[10px] mt-0.5">
                      {edu.school}{edu.city ? `, ${edu.city}` : ""}
                    </span>
                  </div>
                  <span className="font-semibold text-[10px] shrink-0">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compétences */}
        {skills && skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
              COMPÉTENCES TECHNIQUES & LOGICIELS
            </h2>
            <div className="space-y-1 text-[10px] text-black">
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
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
              LANGUES
            </h2>
            <p className="text-[10px] text-black">
              {languages.map((l) => `${l.name} (${l.level})`).join("  |  ")}
            </p>
          </div>
        )}

        {/* Certifications */}
        {sections.certifications && sections.certifications.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
              CERTIFICATIONS
            </h2>
            <div className="space-y-1 text-[10px] text-black">
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
        {sections.projects && sections.projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
              PROJETS & RÉALISATIONS
            </h2>
            <div className="space-y-1.5 text-[10px] text-black">
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

      <div className="text-center text-[8px] text-gray-500 pt-3 border-t border-gray-300 mt-4">
        CV Optimisé ATS (Applicant Tracking System) · MonCV.ai
      </div>
    </div>
  );
};
