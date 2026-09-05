import React from "react";
import { ResumeData } from "@/lib/types";
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar, Users } from "lucide-react";
import { getResumeDensity } from "@/lib/resume-density";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateElegant: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#0f172a";
  const density = getResumeDensity(data);

  return (
    <div className="p-9 min-h-[297mm] h-full flex-1 bg-white text-slate-800 font-serif leading-relaxed flex flex-col justify-between">
      <div className={`flex-1 flex flex-col justify-between ${density.sectionGap}`}>
        {/* Header Centré Élégant */}
        <div className="text-center pb-5 mb-5" style={{ borderBottom: `2px solid ${color}` }}>
          {design.showPhoto && personal.photoUrl && (
            <div className="mb-3 flex justify-center">
              <img
                src={personal.photoUrl}
                alt={`${personal.firstName} ${personal.lastName}`}
                className="w-24 h-24 rounded-full object-cover p-0.5"
                style={{ border: `2px solid ${color}` }}
                crossOrigin="anonymous"
              />
            </div>
          )}
          <h1 className="text-[22px] font-bold tracking-widest uppercase text-slate-900 leading-tight">
            {personal.firstName} {personal.lastName}
          </h1>
          <p
            className="text-[10.5px] uppercase tracking-wider font-sans font-semibold mt-1 mb-3"
            style={{ color }}
          >
            {personal.title}
          </p>

          {/* Barre de contact horizontale */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[9.5px] font-sans text-slate-600 mt-1">
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
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <h2
              className="text-[10px] uppercase tracking-widest font-bold font-sans border-b pb-1 mb-2"
              style={{ color, borderColor: `${color}30` }}
            >
              Profil Professionnel
            </h2>
            <p className={`text-slate-700 italic ${density.summaryTextSize} ${density.lineHeight} text-justify`}>
              {summary}
            </p>
          </div>
        )}

        {/* Corps 2 colonnes (Remplissage A4 dynamique) */}
        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Gauche — Expérience & Formation */}
          <div className="col-span-2 flex flex-col justify-between h-full">
            {experiences && experiences.length > 0 && (
              <div className="flex-1 flex flex-col justify-center min-h-0">
                <h2
                  className="text-[10px] uppercase tracking-widest font-bold font-sans border-b pb-1 mb-2"
                  style={{ color, borderColor: `${color}30` }}
                >
                  Expériences Professionnelles
                </h2>
                <div className={density.itemGap}>
                  {experiences.map((exp) => (
                    <div key={exp.id} className="pl-3 border-l-2" style={{ borderColor: `${color}40` }}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`font-bold text-slate-900 ${density.mode === "spacious" ? "text-xs" : "text-[11px]"}`}>{exp.role}</h3>
                        <span className="text-[9px] font-sans text-slate-500 italic shrink-0">
                          {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                        </span>
                      </div>
                      <p className="text-[10px] font-sans font-medium text-slate-600 mb-1">
                        {exp.company}{exp.city ? ` | ${exp.city}` : ""}
                      </p>
                      <ul className={`list-disc list-outside ml-4 ${density.bulletGap} text-slate-700 ${density.bodyTextSize} font-sans`}>
                        {exp.highlights.map((h, idx) => (
                          <li key={idx} className="leading-snug">{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {educations && educations.length > 0 && (
              <div className="flex-1 flex flex-col justify-center min-h-0 pt-2">
                <h2
                  className="text-[10px] uppercase tracking-widest font-bold font-sans border-b pb-1 mb-2"
                  style={{ color, borderColor: `${color}30` }}
                >
                  Formation & Diplômes
                </h2>
                <div className={density.mode === "spacious" ? "space-y-3" : "space-y-1.5"}>
                  {educations.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-bold text-slate-900 ${density.mode === "spacious" ? "text-xs" : "text-[11px]"}`}>
                          {edu.degree}{edu.field ? ` — ${edu.field}` : ""}
                        </h3>
                        <p className="text-[10px] font-sans text-slate-600 mt-0.5">
                          {edu.school}{edu.city ? ` (${edu.city})` : ""}
                        </p>
                      </div>
                      <span className="text-[9.5px] font-sans text-slate-500 italic shrink-0">
                        {edu.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Droite — Compétences, Langues, Intérêts */}
          <div className="col-span-1 flex flex-col justify-between h-full">
            {skills && skills.length > 0 && (
              <div className="flex-1 flex flex-col justify-center min-h-0">
                <h2
                  className="text-[10px] uppercase tracking-widest font-bold font-sans border-b pb-1 mb-2"
                  style={{ color, borderColor: `${color}30` }}
                >
                  Compétences
                </h2>
                <div className={`${density.mode === "spacious" ? "space-y-3" : "space-y-1.5"} font-sans`}>
                  {skills.map((cat) => (
                    <div key={cat.id}>
                      <h4 className="font-bold text-slate-800 text-[9.5px] uppercase tracking-wide mb-1">
                        {cat.category}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {cat.items.map((item, idx) => (
                          <span
                            key={idx}
                            className={`inline-block ${density.mode === "spacious" ? "px-2.5 py-1 text-[9.5px]" : "px-2 py-0.5 text-[9px]"} bg-slate-100 text-slate-700 rounded font-medium leading-tight border border-slate-200`}
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
              <div className="flex-1 flex flex-col justify-center min-h-0 pt-1">
                <h2
                  className="text-[10px] uppercase tracking-widest font-bold font-sans border-b pb-1 mb-2"
                  style={{ color, borderColor: `${color}30` }}
                >
                  Langues
                </h2>
                <div className="space-y-1 font-sans">
                  {languages.map((l) => (
                    <div key={l.id} className="flex justify-between items-center text-[10px] border-b border-slate-100 pb-1 last:border-0">
                      <span className="font-semibold text-slate-800">{l.name}</span>
                      <span className="text-slate-500 italic text-[9px]">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sections.interests && sections.interests.length > 0 && (
              <div className="flex-1 flex flex-col justify-center min-h-0 pt-1">
                <h2
                  className="text-[10px] uppercase tracking-widest font-bold font-sans border-b pb-1 mb-1.5"
                  style={{ color, borderColor: `${color}30` }}
                >
                  Intérêts
                </h2>
                <p className="text-[9.5px] font-sans text-slate-600 leading-relaxed">
                  {sections.interests.join(" • ")}
                </p>
              </div>
            )}

            {sections.certifications && sections.certifications.length > 0 && (
              <div className="flex-1 flex flex-col justify-center min-h-0 pt-1">
                <h2
                  className="text-[10px] uppercase tracking-widest font-bold font-sans border-b pb-1 mb-1.5"
                  style={{ color, borderColor: `${color}30` }}
                >
                  Certifications
                </h2>
                <div className="space-y-1.5 font-sans">
                  {sections.certifications.map((c) => (
                    <div key={c.id} className="text-[9.5px]">
                      <p className="font-bold text-slate-800 leading-snug">{c.title}</p>
                      <p className="text-slate-500">{c.issuer} — {c.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center font-sans text-[8px] text-slate-400 pt-3 border-t border-slate-100 mt-4">
        CV Réalisé avec MonCV.ai
      </div>
    </div>
  );
};
