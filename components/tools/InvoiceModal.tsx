"use client";

import React, { useRef, useEffect } from "react";
import { X, Printer, CheckCircle2, ShieldCheck, FileText } from "lucide-react";
import { Invoice } from "@/lib/types";
import { getCreditPack } from "@/config/payments";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  packSlug?: string;
  clientNom?: string;
  clientEmail?: string;
  user?: any;
  planTier?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  packSlug = "carriere",
  clientNom = "Client MonCV.ai",
  clientEmail = "",
  user,
  planTier,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const resolvedPack = invoice
    ? { nom: invoice.packNom, credits: invoice.credits, prixFcfa: invoice.montantFcfa }
    : getCreditPack(packSlug || planTier || "carriere") || { nom: "Pack Carrière", credits: 600, prixFcfa: 5000 };

  const numeroFacture = invoice?.numero || `INV-${new Date().getFullYear()}-SIMUL`;
  const dateEmission = invoice?.creeLe
    ? new Date(invoice.creeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const nomClient = invoice?.clientNom || user?.business?.companyName || (user?.firstName ? `${user?.firstName} ${user?.lastName || ""}`.trim() : clientNom);
  const emailClient = invoice?.clientEmail || user?.email || clientEmail;
  const rccmClient = invoice?.clientRccm || user?.business?.rccm || null;
  const ifuClient = invoice?.clientIfu || null;
  const montantFcfa = invoice?.montantFcfa || resolvedPack.prixFcfa || 0;
  const credits = invoice?.credits || resolvedPack.credits || 0;

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Barre d actions superieure */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-sm sm:text-base">
              Facture Normalisée OHADA — MonCV.ai
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps imprimable de la facture */}
        <div ref={printRef} className="p-8 sm:p-12 text-slate-800 bg-white space-y-8 print:p-6 print:m-0">
          {/* En-tete : Emetteur & Client */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                  M
                </div>
                <span className="text-xl font-black text-slate-950 tracking-tight">MonCV.ai</span>
              </div>
              <p className="text-xs font-bold text-slate-700 mt-2">INNOVA GROUP SARL</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                RCCM : CI-BKE-2019-A-228<br />
                Régime d Imposition : Réel Simplifié / Services Numériques<br />
                Boulevard de la République, Plateau, Abidjan, Côte d Ivoire<br />
                Email : innovagroup225@gmail.com | Tél : +225 07 00 51 05 24
              </p>
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl w-full sm:w-auto border sm:border-0 border-slate-200">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-extrabold text-[10px] uppercase tracking-wider">
                Destinataire Facture
              </span>
              <h4 className="text-base font-black text-slate-900 mt-1">{nomClient}</h4>
              {emailClient && <p className="text-xs text-slate-600 font-mono">{emailClient}</p>}
              {rccmClient && <p className="text-[11px] text-slate-500">RCCM : {rccmClient}</p>}
              {ifuClient && <p className="text-[11px] text-slate-500">IFU / CC : {ifuClient}</p>}
              <p className="text-[11px] text-slate-500">Abidjan, Côte d Ivoire</p>
            </div>
          </div>

          {/* Details facture */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">N° Facture</span>
              <span className="font-mono font-black text-slate-900">{numeroFacture}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Date d émission</span>
              <span className="font-bold text-slate-900">{dateEmission}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Règlement</span>
              <span className="font-bold text-slate-900">Mobile Money (Wave)</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Statut</span>
              <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[10.5px]">
                <CheckCircle2 className="w-3 h-3" />
                ACQUITTÉE
              </span>
            </div>
          </div>

          {/* Tableau articles */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px]">
                  <th className="p-3.5">Désignation de la prestation numérique</th>
                  <th className="p-3.5 text-center">Crédits IA</th>
                  <th className="p-3.5 text-right">Durée Validité</th>
                  <th className="p-3.5 text-right">Montant Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-4">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">
                      Pack de Crédits IA — {resolvedPack.nom}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Recharge de {credits.toLocaleString("fr-FR")} crédits prépayés utilisables sur l ensemble des fonctionnalités d intelligence artificielle (CV, lettre de motivation, analyse ATS, traduction).
                    </p>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-900">
                    {credits.toLocaleString("fr-FR")}
                  </td>
                  <td className="p-4 text-right text-slate-600">
                    12 mois
                  </td>
                  <td className="p-4 text-right font-black text-slate-900 text-sm">
                    {montantFcfa.toLocaleString("fr-FR")} FCFA
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totaux & Mentions OHADA */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-2 text-xs text-slate-500 max-w-md">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Facture Normalisée OHADA — Article 13 & 14 de l AUDCG</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                TVA non applicable selon le régime des micro-entreprises et prestations de services digitaux (Code Général des Impôts de Côte d Ivoire). Paiement intégralement acquitté lors de la transaction Mobile Money.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Hors Taxes (HT) :</span>
                <span className="font-semibold">{montantFcfa.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TVA (0%) :</span>
                <span className="font-semibold">0 FCFA</span>
              </div>
              <div className="flex justify-between text-slate-950 font-black text-sm pt-2 border-t border-slate-200">
                <span>Total Net à Payer :</span>
                <span className="text-blue-600">{montantFcfa.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
