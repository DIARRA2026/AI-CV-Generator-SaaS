import React from "react";
import { ResumeData } from "@/lib/types";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  FolderGit2,
} from "lucide-react";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateModern: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#2563eb";

  return (
    <div className="flex h-full min-h-[297mm] bg-white text-slate-800 font-sans text-[11px] leading-relaxed">
      {/* Sidebar Gauche — 33% */}
      <div
        className="w-[33%] p-6 text-white flex flex-col justify-between"
        style={{ backgroundColor: color }}
      >
        <div className="space-y-5">
          {/* Photo */}
          {design.showPhoto && personal.photoUrl && (
            <div className="flex justify-center mb-1">
              <div className="relative p-1 bg-white/20 rounded-2xl shadow-md backdrop-blur-xs">
                <img
                  src={personal.photoUrl}
                  alt={`${personal.firstName} ${personal.lastName}`}
                  className="w-24 h-24 rounded-xl object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          )}

          {/* Contact */}
          <div>
            <h3 className="text-[11px] uppercase tracking-widest font-extrabold text-white/90 border-b border-white/20 pb-1.5 mb-2.5">
              Contact
            </h3>
            <div className="space-y-2 text-[10px]">
              {personal.email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/80" />
                  <span className="break-all font-medium leading-snug">{personal.email}</span>
                </div>
              )}
              {personal.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-white/80" />
                  <span className="font-medium leading-snug">{personal.phone}</span>
                </div>
              )}
              {(personal.city || personal.country) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/80" />
                  <span className="font-medium leading-snug">
                    {[personal.city, personal.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {personal.linkedin && (
                <div className="flex items-start gap-2">
                  <Linkedin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/80" />
                  <span className="break-all font-medium leading-snug">{personal.linkedin}</span>
                </div>
              )}
              {personal.website && (
                <div className="flex items-start gap-2">
                  <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/80" />
                  <span className="break-all font-medium leading-snug">{personal.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Compétences */}
          {skills && skills.length > 0 && (
            <div>
              <h3 className="text-[11px] uppercase tracking-widest font-extrabold text-white/90 border-b border-white/20 pb-1.5 mb-2.5">
                Compétences
              </h3>
              <div className="space-y-3">
                {skills.map((cat) => (
                  <div key={cat.id} className="space-y-1.5">
                    <p className="font-bold text-white/95 text-[9.5px] tracking-wider uppercase">
                      {cat.category}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2.5 py-1 rounded-md bg-white/20 border border-white/25 text-white text-[9.5px] font-semibold leading-tight shadow-xs"
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
              <h3 className="text-[11px] uppercase tracking-widest font-extrabold text-white/90 border-b border-white/20 pb-1.5 mb-2">
                Langues
              </h3>
              <div className="space-y-1.5">
                {languages.map((lang) => (
                  <div
                    key={lang.id}
                    className="flex justify-between items-center py-0.5 border-b border-white/10 last:border-0 text-[10px]"
                  >
                    <span className="font-semibold text-white">{lang.name}</span>
                    <span className="text-[9px] font-medium text-white/85 bg-white/15 px-2 py-0.5 rounded">
                      {lang.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied de sidebar / Centres d'intérêt */}
        {sections.interests && sections.interests.length > 0 && (
          <div className="pt-3 border-t border-white/20 mt-4">
            <h4 className="text-[9.5px] uppercase font-extrabold tracking-widest text-white/80 mb-1.5">
              Centres d'intérêt
            </h4>
            <div className="flex flex-wrap gap-1">
              {sections.interests.map((interest, i) => (
                <span
                  key={i}
                  className="inline-block px-2 py-0.5 bg-white/15 rounded text-[9px] text-white/90 leading-tight font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contenu Principal Droite — 67% */}
      <div className="w-[67%] p-7 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header Nom & Titre */}
          <div className="border-b-2 pb-3" style={{ borderColor: `${color}30` }}>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">
              {personal.firstName} <span style={{ color }}>{personal.lastName}</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-0.5">
              {personal.title}
            </p>
          </div>

          {/* Profil Professionnel */}
          {summary && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color }} />
                <h2 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                  Profil Professionnel
                </h2>
              </div>
              <p className="text-slate-600 text-[10px] leading-relaxed text-justify bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                {summary}
              </p>
            </div>
          )}

          {/* Expériences */}
          {experiences && experiences.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Briefcase className="w-3.5 h-3.5" style={{ color }} />
                <h2 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                  Expériences Professionnelles
                </h2>
              </div>
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="relative pl-3 border-l-2"
                    style={{ borderColor: `${color}50` }}
                  >
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-bold text-slate-900 text-[11px]">
                        {exp.role}
                      </h3>
                      <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                      </span>
                    </div>
                    <p className="font-semibold text-[10px] mb-1" style={{ color }}>
                      {exp.company} {exp.city ? `— ${exp.city}` : ""}
                    </p>
                    <ul className="space-y-0.5 text-slate-600 text-[9.5px]">
                      {exp.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-slate-400 font-bold mt-[-1px]">•</span>
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
              <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap className="w-3.5 h-3.5" style={{ color }} />
                <h2 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                  Formation & Diplômes
                </h2>
              </div>
              <div className="space-y-2">
                {educations.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-start bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-[10.5px]">
                        {edu.degree} {edu.field ? `— ${edu.field}` : ""}
                      </h3>
                      <p className="text-[9.5px] text-slate-600 mt-0.5">
                        {edu.school} {edu.city ? `(${edu.city})` : ""}
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {edu.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications & Projets */}
          {((sections.certifications && sections.certifications.length > 0) ||
            (sections.projects && sections.projects.length > 0)) && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Award className="w-3.5 h-3.5" style={{ color }} />
                <h2 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
                  Certifications & Réalisations
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sections.certifications?.map((c) => (
                  <div key={c.id} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="font-bold text-[9.5px] text-slate-900 leading-snug">{c.title}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{c.issuer} • {c.year}</p>
                  </div>
                ))}
                {sections.projects?.map((p) => (
                  <div key={p.id} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <p className="font-bold text-[9.5px] text-slate-900 leading-snug">{p.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info discrète */}
        <div className="pt-3 text-center border-t border-slate-100 text-[8px] text-slate-400">
          Document certifié conforme • MonCV.ai
        </div>
      </div>
    </div>
  );
};
