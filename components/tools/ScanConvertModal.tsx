"use client";

import React, { useState, useRef } from "react";
import { ResumeData } from "@/lib/types";
import { X, ScanLine, Upload, FileSpreadsheet, FileText, Download, Loader2, Sparkles, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
}

type OutputFormat = "pdf" | "word" | "excel";

export const ScanConvertModal: React.FC<Props> = ({ isOpen, onClose, resumeData }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("pdf");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (file) {
      setSelectedFile(file);
      setIsDone(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConvert = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    await new Promise((res) => setTimeout(res, 2200));

    // Génération d'un fichier simulé — dans un vrai projet, ce serait une API backend
    if (outputFormat === "pdf") {
      // Utilise les données du CV actuel comme base
      const { downloadResumePDF } = await import("@/lib/pdf-export");
      await downloadResumePDF("cv-printable-page", resumeData);
    } else if (outputFormat === "word") {
      // Génère un .txt formaté (simulé Word)
      const content = buildWordContent(resumeData);
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      triggerDownload(blob, `CV_${resumeData.personal.firstName}_${resumeData.personal.lastName}.txt`);
    } else if (outputFormat === "excel") {
      const csv = buildCSVContent(resumeData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      triggerDownload(blob, `CV_${resumeData.personal.firstName}_${resumeData.personal.lastName}.csv`);
    }

    setIsProcessing(false);
    setIsDone(true);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildWordContent = (data: ResumeData): string => {
    const p = data.personal;
    let out = `${p.firstName} ${p.lastName}\n${p.title}\n`;
    out += `${p.email} | ${p.phone} | ${[p.city, p.country].filter(Boolean).join(", ")}\n\n`;
    if (data.summary) out += `PROFIL PROFESSIONNEL\n${data.summary}\n\n`;
    if (data.experiences.length) {
      out += "EXPÉRIENCES PROFESSIONNELLES\n";
      data.experiences.forEach((e) => {
        out += `\n${e.role} — ${e.company} (${e.startDate} - ${e.current ? "Présent" : e.endDate})\n`;
        e.highlights.forEach((h) => (out += `• ${h}\n`));
      });
      out += "\n";
    }
    if (data.educations.length) {
      out += "FORMATION\n";
      data.educations.forEach((e) => {
        out += `${e.degree}${e.field ? ` — ${e.field}` : ""} | ${e.school} | ${e.year}\n`;
      });
      out += "\n";
    }
    if (data.skills.length) {
      out += "COMPÉTENCES\n";
      data.skills.forEach((s) => (out += `${s.category} : ${s.items.join(", ")}\n`));
    }
    return out;
  };

  const buildCSVContent = (data: ResumeData): string => {
    const rows: string[][] = [
      ["Champ", "Valeur"],
      ["Prénom", data.personal.firstName],
      ["Nom", data.personal.lastName],
      ["Titre", data.personal.title],
      ["Email", data.personal.email],
      ["Téléphone", data.personal.phone],
      ["Ville", data.personal.city],
      ["Pays", data.personal.country],
      ...(data.personal.birthDate ? [["Date de naissance", data.personal.birthDate]] : []),
      ...(data.personal.birthPlace ? [["Lieu de naissance", data.personal.birthPlace]] : []),
      ...(data.personal.maritalStatus ? [["Situation matrimoniale", data.personal.maritalStatus]] : []),
      ["Profil", data.summary],
      [""],
      ["EXPÉRIENCES", ""],
    ];
    data.experiences.forEach((e) => {
      rows.push([`${e.role} — ${e.company}`, `${e.startDate} - ${e.current ? "Présent" : e.endDate}`]);
      e.highlights.forEach((h) => rows.push(["", h]));
    });
    rows.push([""]);
    rows.push(["FORMATION", ""]);
    data.educations.forEach((e) => {
      rows.push([`${e.degree} — ${e.school}`, e.year]);
    });
    rows.push([""]);
    rows.push(["COMPÉTENCES", ""]);
    data.skills.forEach((s) => rows.push([s.category, s.items.join(", ")]));
    return rows.map((r) => r.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  };

  const formats: { id: OutputFormat; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: "pdf",
      label: "PDF",
      desc: "Télécharge le CV au format PDF haute qualité",
      icon: <FileText className="w-5 h-5" />,
      color: "text-red-600 bg-red-50 border-red-200",
    },
    {
      id: "word",
      label: "Word (.txt)",
      desc: "Exporte le contenu structuré du CV (compatible Word)",
      icon: <FileText className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      id: "excel",
      label: "Excel (.csv)",
      desc: "Exporte les données en tableau CSV (compatible Excel)",
      icon: <FileSpreadsheet className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/30">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Scanner & Convertir</h2>
              <p className="text-slate-500 text-xs">Importe un document et convertis-le en PDF, Word ou Excel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Zone de dépôt */}
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Document à scanner (image, PDF, Word)
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-violet-400 bg-violet-50"
                  : selectedFile
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              {selectedFile ? (
                <div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-emerald-700 text-sm">{selectedFile.name}</p>
                  <p className="text-emerald-600 text-xs mt-0.5">{(selectedFile.size / 1024).toFixed(1)} Ko — Cliquer pour changer</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 text-sm">Glisser-déposer un fichier ici</p>
                  <p className="text-slate-400 text-xs mt-1">ou cliquer pour parcourir — PDF, JPG, PNG, DOCX</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </div>

          {/* Format de sortie */}
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">Format de sortie</p>
            <div className="grid grid-cols-3 gap-3">
              {formats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOutputFormat(f.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    outputFormat === f.id
                      ? f.color + " border-opacity-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className={outputFormat === f.id ? f.color.split(" ")[0] : "text-slate-500"}>
                    {f.icon}
                  </div>
                  <p className="font-bold text-slate-900 text-sm mt-1.5">{f.label}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5 leading-snug">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Note IA */}
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-violet-800 text-xs leading-relaxed">
                <span className="font-bold">Astuce IA :</span> Les données de votre CV actuel seront utilisées pour générer le fichier converti avec la mise en forme optimale. Pour scanner un document physique, prenez une photo claire et importez-la.
              </p>
            </div>
          </div>

          {/* Bouton conversion */}
          {isDone ? (
            <div className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-2xl text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Fichier téléchargé avec succès !
            </div>
          ) : (
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conversion en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Convertir & Télécharger ({outputFormat.toUpperCase()})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
