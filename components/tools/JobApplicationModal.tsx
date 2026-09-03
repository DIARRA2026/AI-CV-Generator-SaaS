"use client";

import React, { useState, useEffect, useRef } from "react";
import { ResumeData } from "@/lib/types";
import {
  X, Briefcase, Building2, MapPin, FileText, Sparkles, Loader2,
  Copy, Check, ChevronDown, Printer, User, Phone, Mail, Download,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
}

const DESTINATAIRES = [
  "Monsieur le Directeur Général",
  "Madame la Directrice Générale",
  "Monsieur le Directeur des Ressources Humaines",
  "Madame la Directrice des Ressources Humaines",
  "Monsieur le Président Directeur Général",
  "Monsieur le Directeur Administratif et Financier",
  "Monsieur le Chef du Personnel",
  "Madame la Responsable des Ressources Humaines",
  "Monsieur le Responsable du Recrutement",
];

const COUNTRIES = [
  "Côte d'Ivoire", "Sénégal", "Burkina Faso", "Mali", "Cameroun",
  "Guinée", "Bénin", "Togo", "Niger", "France", "Autre",
];

import jsPDF from "jspdf";
import { CountryCityPicker } from "@/components/tools/CountryCityPicker";

export const JobApplicationModal: React.FC<Props> = ({ isOpen, onClose, resumeData }) => {
  const p = resumeData.personal;

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [country, setCountry] = useState(p.country || "Côte d'Ivoire");
  const [destinataire, setDestinataire] = useState(DESTINATAIRES[2]);
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    setCountry(p.country || "Côte d'Ivoire");
    setLetter("");
  }, [p]);

  if (!isOpen) return null;

  const canGenerate = jobTitle.trim() && company.trim();

  const generateLetter = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setLetter("");
    await new Promise((r) => setTimeout(r, 1200));

    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const city = p.city || "Abidjan";
    const senderName = `${p.firstName} ${p.lastName}`.trim();
    const topSkills = resumeData.skills.flatMap((s) => s.items).slice(0, 4).join(", ");
    const topExp = resumeData.experiences[0];
    const topEdu = resumeData.educations[0];
    const isMadame = destinataire.includes("Madame");
    const civilite = isMadame ? "Madame," : "Monsieur,";

    // Paragraphe d'expérience personnalisé depuis le CV
    const expPara = topExp
      ? `Titulaire d'un ${topEdu?.degree || "diplôme"} en ${topEdu?.field || "gestion"} obtenu à ${topEdu?.school || "l'Université"}, j'exerce${topExp.current ? "" : " depuis plusieurs années"} les fonctions de ${topExp.role} au sein de ${topExp.company}. Au cours de cette expérience, j'ai notamment ${topExp.highlights[0]?.toLowerCase() || "contribué au développement de l'entreprise"}${topSkills ? `, en mobilisant des compétences en ${topSkills}` : ""}.`
      : `Récemment diplômé(e) en ${topEdu?.field || "gestion"} de ${topEdu?.school || "l'Université"}, je suis à la recherche d'une première opportunité professionnelle pour valoriser mes compétences${topSkills ? ` en ${topSkills}` : ""}.`;

    const motivPara = jobDescription
      ? `À la lecture de votre offre, j'ai été particulièrement sensible aux missions décrites. ${jobDescription.slice(0, 100)}... Ces exigences correspondent précisément à mon profil et aux compétences développées tout au long de mon parcours.`
      : `Votre réputation d'excellence et votre engagement en faveur du développement professionnel m'ont particulièrement motivé(e) à vous adresser cette candidature. Je suis convaincu(e) que mon profil correspond aux attentes de votre structure.`;

    const generated = `${senderName}
${city}, ${country}
Tél : ${p.phone || "–"}  |  ${p.email || "–"}


                                                      À ${city}, le ${today}


${destinataire}
${company ? `De ${company}` : ""}${companyCity ? `\n${companyCity}` : ""}


Objet : Demande d'emploi au poste de ${jobTitle}


${civilite}

J'ai l'honneur de porter à votre haute attention la présente lettre par laquelle je sollicite un emploi au sein de votre honorable institution au poste de ${jobTitle}.

${expPara}

${motivPara}

Ma rigueur, mon sens des responsabilités et ma capacité d'adaptation constituent des atouts que je souhaite mettre au service de votre structure. Vous trouverez ci-joint mon curriculum vitae qui vous permettra d'apprécier davantage mon profil.

Dans l'espoir que ma candidature retiendra votre bienveillante attention, je me tiens disponible pour tout entretien que vous jugerez nécessaire.

Veuillez agréer, ${civilite} l'expression de mes salutations distinguées.


                                                      ${senderName}`;

    setLetter(generated);
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = () => {
    const filename = `Demande_Emploi_${company}_${jobTitle}`.replace(/\s+/g, "_");
    const formattedParagraphs = letter
      .split("\n")
      .map((line) => `<p style="margin-bottom: 8pt; line-height: 1.5; font-family: 'Times New Roman', serif; font-size: 12pt;">${line.trim() || "&nbsp;"}</p>`)
      .join("");

    const header = `<html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${filename}</title>
    <style>
      @page { size: A4; margin: 2.5cm 2cm 2.5cm 3cm; }
      body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000000; }
    </style>
    </head><body>${formattedParagraphs}</body></html>`;

    const blob = new Blob(['\ufeff', header], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const filename = `Demande_Emploi_${company}_${jobTitle}`.replace(/\s+/g, "_");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const marginX = 25;
    let currentY = 25;
    const pageHeight = 297;
    const marginBottom = 20;

    const paragraphs = letter.split("\n");

    paragraphs.forEach((p) => {
      if (!p.trim()) {
        currentY += 5;
        return;
      }

      const lines = doc.splitTextToSize(p, 160);
      lines.forEach((line: string) => {
        if (currentY + 7 > pageHeight - marginBottom) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(line, marginX, currentY);
        currentY += 6.5;
      });
    });

    doc.save(`${filename}.pdf`);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=800,height=1100");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Lettre de Candidature</title>
    <style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.8;margin:25mm 20mm 20mm 30mm;color:#000;}
    pre{white-space:pre-wrap;font-family:inherit;font-size:inherit;line-height:inherit;}
    @page{size:A4;margin:0;}</style></head><body><pre>${letter}</pre></body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); win.close(); }, 400);
  };

  const Field = ({ icon, value, onChange, placeholder, type = "text" }: {
    icon: React.ReactNode; value: string; onChange: (v: string) => void;
    placeholder: string; type?: string;
  }) => (
    <div className={`flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all`}>
      <span className="text-slate-400 shrink-0">{icon}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm focus:outline-none placeholder-slate-400 text-slate-900" />
    </div>
  );

  const Select = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">

        {/* Header compact */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/30">
              <Briefcase className="w-4.5 h-4.5 text-white" style={{width:"18px",height:"18px"}} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-tight">Demande d'Emploi</h2>
              <p className="text-slate-500 text-[11px]">Lettre officielle générée par IA depuis votre profil</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Corps responsive — 1 col mobile, 2 col desktop */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

          {/* === FORMULAIRE === */}
          <div className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-5 shrink-0">
            <div className="space-y-3">
              {/* Infos pré-remplies du CV */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1.5">
                  <Sparkles className="w-3 h-3 inline mr-1" />Depuis votre CV
                </p>
                <p className="text-sm font-bold text-slate-900">{`${p.firstName} ${p.lastName}`.trim() || "–"}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{p.title || ""}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10.5px] text-slate-500">
                  {p.phone && <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{p.phone}</span>}
                  {p.email && <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{p.email}</span>}
                  {p.city && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{p.city}</span>}
                </div>
              </div>

              {/* Champ poste et entreprise */}
              <div className="space-y-2">
                <Field icon={<Briefcase className="w-4 h-4" />} value={jobTitle} onChange={setJobTitle} placeholder="Poste sollicité *" />
                <Field icon={<Building2 className="w-4 h-4" />} value={company} onChange={setCompany} placeholder="Nom de l'entreprise *" />
                <div className="pt-1 bg-white/70 rounded-xl">
                  <CountryCityPicker
                    selectedCountry={country}
                    selectedCity={companyCity}
                    onCountryChange={setCountry}
                    onCityChange={setCompanyCity}
                    countryLabel="Pays de l'entreprise"
                    cityLabel="Ville de l'entreprise"
                    required={false}
                  />
                </div>
              </div>

              {/* Destinataire */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">À qui adresser la lettre ?</p>
                <Select value={destinataire} onChange={setDestinataire} options={DESTINATAIRES} />
              </div>

              {/* Description optionnelle */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Texte de l'offre (optionnel)</p>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={3}
                  placeholder="Collez ici le texte de l'offre pour une lettre encore plus ciblée..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Bouton générer */}
              <button
                onClick={generateLetter}
                disabled={!canGenerate || isGenerating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Rédaction en cours...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />{letter ? "Régénérer" : "Générer la lettre"}</>
                )}
              </button>
              {!canGenerate && (
                <p className="text-[10px] text-slate-400 text-center">
                  Poste et nom de l'entreprise requis
                </p>
              )}
            </div>
          </div>

          {/* === APERÇU LETTRE === */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {letter && (
              <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 shrink-0 bg-slate-50/60 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Lettre générée
                </span>
                <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                  <button onClick={handleCopy} className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copié" : "Copier"}
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exporter</span>
                      <ChevronDown className="w-3 h-3 opacity-80" />
                    </button>

                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1 fade-in">
                        <button
                          type="button"
                          onClick={handleExportWord}
                          className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                            W
                          </div>
                          <div>
                            <div>Document Word (.docx)</div>
                            <div className="text-[10px] text-slate-400 font-normal">Format modifiable Word</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportPDF}
                          className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-black text-xs shrink-0">
                            PDF
                          </div>
                          <div>
                            <div>Document PDF (.pdf)</div>
                            <div className="text-[10px] text-slate-400 font-normal">Format officiel A4 PDF</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  <button onClick={handlePrint} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                    <Printer className="w-3.5 h-3.5" />Imprimer
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Rédaction en cours...</p>
                  <p className="text-xs text-center max-w-xs text-slate-400">L'IA personnalise la lettre avec vos expériences, diplômes et compétences</p>
                </div>
              ) : letter ? (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 mx-auto"
                  style={{ maxWidth: "560px", fontFamily: "'Times New Roman', Times, serif", fontSize: "11.5px", lineHeight: "1.85" }}>
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit", margin: 0 }}>
                    {letter}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">Aperçu de votre lettre officielle</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Remplissez le poste et l'entreprise à gauche, puis cliquez sur <strong>«&nbsp;Générer la lettre&nbsp;»</strong>. La lettre est automatiquement personnalisée avec vos informations de CV.
                    </p>
                  </div>
                  {/* Miniature exemple */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10px] text-slate-500 font-mono w-full max-w-xs opacity-70 space-y-1">
                    <p>{`${p.firstName || "Prénom"} ${p.lastName || "Nom"}`}</p>
                    <p>{p.city || "Abidjan"}, {p.country || "Côte d'Ivoire"}</p>
                    <div className="h-3" />
                    <p className="text-right">À {p.city || "Abidjan"}, le {new Date().toLocaleDateString("fr-FR")}</p>
                    <div className="h-2" />
                    <p>Monsieur le DRH</p>
                    <p className="underline font-bold">Objet : Demande d'emploi au poste de [...]</p>
                    <div className="h-2" />
                    <p>J'ai l'honneur de porter à votre haute attention...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
