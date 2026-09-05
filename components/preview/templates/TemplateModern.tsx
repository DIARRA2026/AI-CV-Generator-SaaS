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
  Calendar,
  Users,
} from "lucide-react";
import { getResumeDensity } from "@/lib/resume-density";

interface TemplateProps {
  data: ResumeData;
}

export const TemplateModern: React.FC<TemplateProps> = ({ data }) => {
  const { personal, summary, experiences, educations, skills, languages, sections, design } = data;
  const color = design.primaryColor || "#2563eb";
  const density = getResumeDensity(data);

  return (
    <div className="flex flex-1 h-full min-h-[297mm] max-h-[297mm] overflow-hidden bg-white text-slate-800 font-sans leading-relaxed">
      {/* Sidebar Gauche — 33% (Auto-équilibrée sur toute la hauteur A4) */}
      <div
        className="w-[33%] text-white flex flex-col justify-between h-full min-h-[297mm] max-h-[297mm] shrink-0 overflow-hidden"
        style={{ backgroundColor: color, padding: density.spacing.sidebarPadding }}
      >
        {/* Bloc supérieur : Photo + Contact */}
        <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
          {/* Photo */}
          {design.showPhoto && personal.photoUrl && (
            <div className="flex justify-center mb-1">
              <div className="relative p-1 bg-white/20 rounded-2xl shadow-md backdrop-blur-xs">
                <img
                  src={personal.photoUrl}
                  alt={`${personal.firstName} ${personal.lastName}`}
                  style={{ width: density.spacing.photoSize, height: density.spacing.photoSize }}
                  className="rounded-xl object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          )}

          {/* Contact */}
          <div>
            <h3
              style={{ fontSize: density.fontSize.xs }}
              className="uppercase tracking-widest font-extrabold text-white/90 border-b border-white/20 pb-1.5 mb-2.5"
            >
              Contact
            </h3>
            <div className="space-y-1.5" style={{ fontSize: density.fontSize.xs }}>
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
              {(personal.birthDate || personal.birthPlace) && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/80" />
                  <span className="font-medium leading-snug">
                    {[
                      personal.birthDate ? `Né(e) le ${personal.birthDate}` : "",
                      personal.birthPlace ? `à ${personal.birthPlace}` : ""
                    ].filter(Boolean).join(" ")}
                  </span>
                </div>
              )}
              {personal.maritalStatus && (
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 shrink-0 text-white/80" />
                  <span className="font-medium leading-snug">{personal.maritalStatus}</span>
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
        </div>

        {/* Bloc médian : Compétences */}
        {skills && skills.length > 0 && (
          <div className="my-auto py-2">
            <h3
              style={{ fontSize: density.fontSize.xs }}
              className="uppercase tracking-widest font-extrabold text-white/90 border-b border-white/20 pb-1.5 mb-2.5"
            >
              Compétences
            </h3>
            <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
              {skills.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <p
                    style={{ fontSize: density.fontSize.xs }}
                    className="font-bold text-white/95 tracking-wider uppercase"
                  >
                    {cat.category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((item, idx) => (
                      <span
                        key={idx}
                        style={{ fontSize: density.fontSize.xs }}
                        className="inline-block px-2 py-0.5 rounded-md bg-white/20 border border-white/25 text-white font-semibold leading-tight shadow-xs"
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

        {/* Bloc inférieur : Langues & Centres d'intérêt */}
        <div className="space-y-3 pt-2">
          {/* Langues */}
          {languages && languages.length > 0 && (
            <div>
              <h3
                style={{ fontSize: density.fontSize.xs }}
                className="uppercase tracking-widest font-extrabold text-white/90 border-b border-white/20 pb-1.5 mb-2"
              >
                Langues
              </h3>
              <div className="space-y-1">
                {languages.map((lang) => (
                  <div
                    key={lang.id}
                    style={{ fontSize: density.fontSize.xs }}
                    className="flex justify-between items-center py-0.5 border-b border-white/10 last:border-0"
                  >
                    <span className="font-semibold text-white">{lang.name}</span>
                    <span
                      style={{ fontSize: density.fontSize.xs }}
                      className="font-medium text-white/85 bg-white/15 px-2 py-0.5 rounded"
                    >
                      {lang.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Centres d'intérêt */}
          {sections?.interests && sections.interests.length > 0 && (
            <div className="pt-2 border-t border-white/20">
              <h4
                style={{ fontSize: density.fontSize.xs }}
                className="uppercase font-extrabold tracking-widest text-white/80 mb-1.5"
              >
                Centres d'intérêt
              </h4>
              <div className="flex flex-wrap gap-1">
                {sections.interests.map((interest, i) => (
                  <span
                    key={i}
                    style={{ fontSize: density.fontSize.xs }}
                    className="inline-block px-2 py-0.5 bg-white/15 rounded text-white/90 leading-tight font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu Principal Droite — 67% (Remplissage A4 ordonné avec justification de texte) */}
      <div
        className="w-[67%] flex flex-col justify-between h-full min-h-[297mm] max-h-[297mm] overflow-hidden"
        style={{ padding: density.spacing.pagePadding }}
      >
        <div
          className="flex flex-col min-h-0"
          style={{ gap: density.spacing.sectionGap }}
        >
          {/* Header Nom & Titre */}
          <div className="border-b-2 pb-2.5" style={{ borderColor: `${color}30` }}>
            <h1
              style={{ fontSize: density.fontSize.title }}
              className="font-black text-slate-900 tracking-tight uppercase leading-tight"
            >
              {personal.firstName} <span style={{ color }}>{personal.lastName}</span>
            </h1>
            <p
              style={{ fontSize: density.fontSize.role }}
              className="font-bold uppercase tracking-wider text-slate-600 mt-0.5"
            >
              {personal.title}
            </p>
          </div>

          {/* Profil Professionnel */}
          {summary && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" style={{ color }} />
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="font-bold uppercase tracking-wider text-slate-900"
                >
                  Profil Professionnel
                </h2>
              </div>
              <p
                style={{
                  fontSize: density.fontSize.summary,
                  lineHeight: density.lineHeight,
                  padding: density.spacing.summaryPadding,
                }}
                className="text-slate-700 cv-pro-text bg-slate-50/80 rounded-xl border border-slate-100"
              >
                {summary}
              </p>
            </div>
          )}

          {/* Expériences */}
          {experiences && experiences.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Briefcase className="w-3.5 h-3.5" style={{ color }} />
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="font-bold uppercase tracking-wider text-slate-900"
                >
                  Expériences Professionnelles
                </h2>
              </div>
              <div style={{ gap: density.spacing.itemGap }} className="flex flex-col">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="relative pl-3.5 border-l-2 bg-slate-50/50 p-2.5 rounded-r-xl border-slate-100"
                    style={{ borderColor: `${color}50` }}
                  >
                    {/* Alignement tabulaire Word Processor : Titre à gauche, dates à droite */}
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3
                        style={{ fontSize: density.fontSize.base }}
                        className="font-bold text-slate-900"
                      >
                        {exp.role}
                      </h3>
                      <span
                        style={{ fontSize: density.fontSize.xs }}
                        className="font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0 shadow-2xs"
                      >
                        {exp.startDate} – {exp.current ? "Présent" : exp.endDate}
                      </span>
                    </div>
                    <p
                      style={{ color, fontSize: density.fontSize.sm }}
                      className="font-semibold mb-1"
                    >
                      {exp.company} {exp.city ? `— ${exp.city}` : ""}
                    </p>
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul
                        style={{ gap: density.spacing.bulletGap }}
                        className="text-slate-600 flex flex-col"
                      >
                        {exp.highlights.map((h, i) => (
                          <li
                            key={i}
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
              <div className="flex items-center gap-1.5 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" style={{ color }} />
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="font-bold uppercase tracking-wider text-slate-900"
                >
                  Formation & Diplômes
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
                      className="font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0 shadow-2xs"
                    >
                      {edu.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications & Projets */}
          {((sections?.certifications && sections.certifications.length > 0) ||
            (sections?.projects && sections.projects.length > 0)) && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Award className="w-3.5 h-3.5" style={{ color }} />
                <h2
                  style={{ fontSize: density.fontSize.heading }}
                  className="font-bold uppercase tracking-wider text-slate-900"
                >
                  Certifications & Réalisations
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sections?.certifications?.map((c) => (
                  <div
                    key={c.id}
                    style={{ padding: density.spacing.cardPadding }}
                    className="bg-slate-50 rounded-xl border border-slate-100"
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
                      {c.issuer} • {c.year}
                    </p>
                  </div>
                ))}
                {sections?.projects?.map((p) => (
                  <div
                    key={p.id}
                    style={{ padding: density.spacing.cardPadding }}
                    className="bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <p
                      style={{ fontSize: density.fontSize.base }}
                      className="font-bold text-slate-900 leading-snug"
                    >
                      {p.name}
                    </p>
                    <p
                      style={{ fontSize: density.fontSize.xs }}
                      className="text-slate-500 mt-0.5 line-clamp-1"
                    >
                      {p.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info discrète */}
        <div
          style={{ fontSize: density.fontSize.xs }}
          className="pt-2 text-center border-t border-slate-100 text-slate-400 mt-auto shrink-0"
        >
          Document certifié conforme • MonCV.ai
        </div>
      </div>
    </div>
  );
};
