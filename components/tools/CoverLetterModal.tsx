"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import { ResumeData } from "@/lib/types";
import { CVEngine } from "@/lib/cv-engine";
import { X, Sparkles, Copy, Check, Download, RefreshCw, Wand2, FileText, ChevronDown } from "lucide-react";

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
  isOpen,
  onClose,
  resumeData,
}) => {
  const [targetJob, setTargetJob] = useState(resumeData.personal.title || "Responsable Commercial");
  const [targetCompany, setTargetCompany] = useState("Entreprise Leader");
  const [letterContent, setLetterContent] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = CVEngine.generateCoverLetter(resumeData, targetJob, targetCompany);
      setLetterContent(generated);
      setIsGenerating(false);
    }, 450);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Exporter au format Word (.docx)
  const handleExportWord = () => {
    const filename = `Lettre_Motivation_${resumeData.personal.lastName || "Candidat"}`;
    const formattedParagraphs = letterContent
      .split("\n")
      .map((line) => `<p style="margin-bottom: 10pt; line-height: 1.5; font-family: Arial, sans-serif; font-size: 11pt;">${line.trim() || "&nbsp;"}</p>`)
      .join("");

    const header = `<html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${filename}</title>
    <style>
      @page { size: A4; margin: 2.5cm 2cm 2.5cm 2.5cm; }
      body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1e293b; }
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

  // Exporter au format PDF (.pdf)
  const handleExportPDF = () => {
    const filename = `Lettre_Motivation_${resumeData.personal.lastName || "Candidat"}`;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);

    const marginX = 20;
    let currentY = 25;
    const pageHeight = 297;
    const marginBottom = 20;

    const paragraphs = letterContent.split("\n");

    paragraphs.forEach((p) => {
      if (!p.trim()) {
        currentY += 5;
        return;
      }

      const lines = doc.splitTextToSize(p, 170);
      lines.forEach((line: string) => {
        if (currentY + 7 > pageHeight - marginBottom) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(line, marginX, currentY);
        currentY += 6;
      });
    });

    doc.save(`${filename}.pdf`);
    setShowExportMenu(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Générateur de Lettre de Motivation IA
              </h3>
              <p className="text-xs text-slate-500">
                Synchronisée en temps réel avec votre CV et le poste visé
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Poste visé
              </label>
              <input
                type="text"
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder="Ex: Responsable Commercial"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Entreprise cible
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="Ex: Orange Côte d'Ivoire"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isGenerating ? "Rédaction de votre lettre..." : "Générer la lettre de motivation avec l'IA"}
          </button>

          {letterContent ? (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center relative">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Votre Lettre de Motivation Révisable :
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copié !" : "Copier"}</span>
                  </button>

                  {/* Menu d'exportation Word & PDF */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exporter</span>
                      <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
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
                            <div className="text-[10px] text-slate-400 font-normal">Modifiable sur PC & Mobile</div>
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
                            <div className="text-[10px] text-slate-400 font-normal">Prêt pour envoi direct</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <textarea
                rows={12}
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-sans leading-relaxed focus:ring-2 focus:ring-indigo-600/30 focus:outline-none"
              />
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs">
              Cliquez sur le bouton ci-dessus pour générer automatiquement une lettre de motivation complète et adaptée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
