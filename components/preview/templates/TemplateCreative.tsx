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
} from "lucide-react";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateCreative: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#7c3aed";

  return (
    <div className="min-h-[297mm] bg-white text-slate-800 font-sans text-[11px] leading-relaxed flex flex-col justify-between">
      <div>
        {/* Banner supérieur coloré */}
        <div className="px-8 pt-7 pb-6 text-white" style={{ backgroundColor: color }}>
          <div className="flex items-center gap-5">
            {design.showPhoto && personal.photoUrl && (
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0"
                crossOrigin="anonymous"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="inline-block bg-white/20 px-2.5 py-0.5 rounded-full text-[9.5px] font-semibold tracking-wider uppercase mb-1.5">
                {personal.title}
              </span>
              <h1 className="text-[22px] font-extrabold tracking-tight leading-tight">
                {personal.firstName} {personal.lastName}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[9.5px] text-white/90">
                {personal.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span>{personal.email}</span>
                  </span>
                )}
                {personal.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span>{personal.phone}</span>
                  </span>
                )}
                {(personal.city || personal.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{[personal.city, personal.country].filter(Boolean).join(", ")}</span>
                  </span>
                )}
                {personal.linkedin && (
                  <span className="flex items-center gap-1.5">
                    <Linkedin className="w-3 h-3 shrink-0" />
                    <span>{personal.linkedin}</span>
                  </span>
                )}
                {personal.website && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 shrink-0" />
                    <span>{personal.website}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Corps du CV */}
        <div className="p-7 space-y-5">
          {/* Résumé */}
          {summary && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1.5 font-bold text-[10.5px] uppercase tracking-wide" style={{ color }}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>À Propos de Moi</span>
              </div>
              <p className="text-slate-700 text-[10.5px] leading-relaxed">
                {summary}
              </p>
            </div>
          )}

          {/* Corps en 2 colonnes */}
          <div className="grid grid-cols-12 gap-5">
            {/* Gauche 7/12 — Expériences & Formation */}
            <div className="col-span-7 space-y-5">
              {experiences && experiences.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3 pb-1 border-b" style={{ borderColor: `${color}30` }}>
                    <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <h2 className="font-bold text-[10.5px] uppercase tracking-wider text-slate-900">
                      Expériences Professionnelles
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="relative pl-3 border-l-2"
                        style={{ borderColor: color }}
                      >
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="font-bold text-slate-900 text-[11px] leading-tight">{exp.role}</h3>
                          <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                            {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold mb-1.5" style={{ color }}>
                          {exp.company}{exp.city ? ` · ${exp.city}` : ""}
                        </p>
                        <ul className="space-y-0.5 text-slate-600 text-[9.5px]">
                          {exp.highlights.map((h, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-snug">
                              <span className="text-slate-400 font-bold shrink-0">•</span>
                              <span>{h}</span>
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
                  <div className="flex items-center gap-1.5 mb-3 pb-1 border-b" style={{ borderColor: `${color}30` }}>
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <h2 className="font-bold text-[10.5px] uppercase tracking-wider text-slate-900">
                      Formation & Études
                    </h2>
                  </div>
                  <div className="space-y-2.5">
                    {educations.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-start bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <h3 className="font-bold text-slate-900 text-[10.5px] leading-snug">
                            {edu.degree}{edu.field ? ` — ${edu.field}` : ""}
                          </h3>
                          <p className="text-[9.5px] text-slate-500 mt-0.5">
                            {edu.school}{edu.city ? ` (${edu.city})` : ""}
                          </p>
                        </div>
                        <span className="text-[9px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0">
                          {edu.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Droite 5/12 — Compétences, Langues, Projets */}
            <div className="col-span-5 space-y-5">
              {skills && skills.length > 0 && (
                <div>
                  <h3
                    className="font-bold text-[10.5px] uppercase tracking-wider text-slate-900 mb-2.5 pb-1 border-b"
                    style={{ borderColor: `${color}30` }}
                  >
                    Compétences & Outils
                  </h3>
                  <div className="space-y-3">
                    {skills.map((cat) => (
                      <div key={cat.id}>
                        <h4 className="font-bold text-slate-800 text-[9.5px] uppercase tracking-wide mb-1.5">
                          {cat.category}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2.5 py-1 rounded-full text-[9px] font-semibold text-white leading-tight shadow-xs"
                              style={{ backgroundColor: color }}
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
                  <h3
                    className="font-bold text-[10.5px] uppercase tracking-wider text-slate-900 mb-2.5 pb-1 border-b"
                    style={{ borderColor: `${color}30` }}
                  >
                    Langues
                  </h3>
                  <div className="space-y-1.5">
                    {languages.map((l) => (
                      <div key={l.id} className="flex justify-between items-center text-[10px] border-b border-slate-100 pb-1 last:border-0">
                        <span className="font-semibold text-slate-800">{l.name}</span>
                        <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {l.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections.projects && sections.projects.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 pb-1 border-b" style={{ borderColor: `${color}30` }}>
                    <FolderGit2 className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <h3 className="font-bold text-[10.5px] uppercase tracking-wider text-slate-900">
                      Projets Notables
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {sections.projects.map((p) => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="font-bold text-[10px] text-slate-900 leading-snug">{p.name}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections.certifications && sections.certifications.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 pb-1 border-b" style={{ borderColor: `${color}30` }}>
                    <Award className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <h3 className="font-bold text-[10.5px] uppercase tracking-wider text-slate-900">
                      Certifications
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {sections.certifications.map((c) => (
                      <div key={c.id} className="text-[9.5px]">
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

      <div className="px-7 py-3 text-center border-t border-slate-100 text-[8px] text-slate-400">
        Créé avec MonCV.ai · Design Créatif
      </div>
    </div>
  );
};
