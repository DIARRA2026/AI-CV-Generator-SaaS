import React from "react";
import { ResumeData } from "@/lib/types";
import { Mail, Phone, MapPin, Linkedin, Globe, Briefcase, GraduationCap, Award, Wrench } from "lucide-react";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateCorporate: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#1e3a8a";

  return (
    <div className="p-8 min-h-[297mm] bg-white text-slate-800 font-sans text-[11px] leading-relaxed flex flex-col justify-between">
      <div>
        {/* Header Corporate En Bandeau */}
        <div className="flex items-center justify-between border-b-2 pb-5 mb-6" style={{ borderColor: color }}>
          <div className="flex items-center gap-4">
            {design.showPhoto && personal.photoUrl && (
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                className="w-20 h-20 rounded-xl object-cover border-2 shadow-sm"
                style={{ borderColor: color }}
                crossOrigin="anonymous"
              />
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                {personal.firstName} {personal.lastName}
              </h1>
              <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color }}>
                {personal.title}
              </p>
            </div>
          </div>

          {/* Contact En-tête */}
          <div className="text-right space-y-1 text-[10.5px] text-slate-600">
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
          <div className="mb-6 bg-slate-50 p-4 rounded-xl border-l-4" style={{ borderColor: color }}>
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-1">
              Synthèse Professionnelle
            </h2>
            <p className="text-slate-700 text-[10.5px] leading-relaxed">
              {summary}
            </p>
          </div>
        )}

        {/* 2 Colonnes Structurées */}
        <div className="grid grid-cols-12 gap-6">
          {/* Colonne Gauche (7/12) : Expériences */}
          <div className="col-span-7 space-y-5">
            {experiences && experiences.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-1 border-b" style={{ borderColor: `${color}30` }}>
                  <Briefcase className="w-4 h-4" style={{ color }} />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Parcours Professionnel
                  </h2>
                </div>
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="relative pl-3.5 border-l-2" style={{ borderColor: `${color}40` }}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="font-bold text-slate-900 text-[11.5px]">{exp.role}</h3>
                        <span className="text-[9.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold mb-1" style={{ color }}>
                        {exp.company} {exp.city ? `(${exp.city})` : ""}
                      </p>
                      <ul className="space-y-1 text-slate-600 text-[10px]">
                        {exp.highlights.map((h, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-slate-400 font-bold">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formations */}
            {educations && educations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-1 border-b" style={{ borderColor: `${color}30` }}>
                  <GraduationCap className="w-4 h-4" style={{ color }} />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Diplômes & Cursus
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {educations.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-900 text-[11px]">
                          {edu.degree} {edu.field ? `— ${edu.field}` : ""}
                        </h3>
                        <p className="text-[10px] text-slate-600 mt-0.5">{edu.school} {edu.city ? `(${edu.city})` : ""}</p>
                      </div>
                      <span className="text-[9.5px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border">
                        {edu.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne Droite (5/12) : Compétences, Langues, Extra */}
          <div className="col-span-5 space-y-5">
            {/* Compétences */}
            {skills && skills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-1 border-b" style={{ borderColor: `${color}30` }}>
                  <Wrench className="w-4 h-4" style={{ color }} />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Domaines d'Expertise
                  </h2>
                </div>
                <div className="space-y-3">
                  {skills.map((cat) => (
                    <div key={cat.id} className="space-y-1.5">
                      <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wide">
                        {cat.category}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-semibold rounded-lg text-[9.5px] border border-slate-200"
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

            {/* Langues */}
            {languages && languages.length > 0 && (
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2.5 pb-1 border-b" style={{ borderColor: `${color}30` }}>
                  Langues
                </h3>
                <div className="space-y-2">
                  {languages.map((l) => (
                    <div key={l.id} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-100">
                      <span className="font-bold text-slate-800">{l.name}</span>
                      <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px]">
                        {l.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications / Projets */}
            {sections.certifications && sections.certifications.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 pb-1 border-b" style={{ borderColor: `${color}30` }}>
                  <Award className="w-4 h-4" style={{ color }} />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Certifications
                  </h2>
                </div>
                <div className="space-y-2">
                  {sections.certifications.map((c) => (
                    <div key={c.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[9.5px]">
                      <p className="font-bold text-slate-900 leading-snug">{c.title}</p>
                      <p className="text-slate-500 mt-0.5">{c.issuer} ({c.year})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 text-center border-t border-slate-100 text-[8.5px] text-slate-400">
        Profil Professionnel • Certifié MonCV.ai
      </div>
    </div>
  );
};
