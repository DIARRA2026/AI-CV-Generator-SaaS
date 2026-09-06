"use client";

import React, { useRef } from "react";
import { X, Printer, Download, CheckCircle2, Building, ShieldCheck, FileText } from "lucide-react";
import { UserSession } from "@/lib/storage";
import { PlanTier } from "@/lib/types";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null;
  planTier?: PlanTier;
}

const PLAN_DETAILS: Record<string, { name: string; price: number; profiles: number }> = {
  enterprise30: { name: "Pack Starter PME (30 Candidats)", price: 20000, profiles: 30 },
  enterprise75: { name: "Pack Business Pro (75 Candidats)", price: 45000, profiles: 75 },
  enterprise200: { name: "Pack Entreprise Premium (200 Candidats)", price: 100000, profiles: 200 },
  cyber15: { name: "Pass Distributeur Cybercafé (15 Profils)", price: 15000, profiles: 15 },
  "5000": { name: "Pack VIP & Multi-Profils (4 Candidats)", price: 5000, profiles: 4 },
  "2500": { name: "Pack Candidature Pro (2 Candidats)", price: 2500, profiles: 2 },
  "1500": { name: "Pack Essentiel (1 Candidat)", price: 1500, profiles: 1 },
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  user,
  planTier = "enterprise75",
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const plan = PLAN_DETAILS[planTier] || PLAN_DETAILS.enterprise75;
  const companyName = user?.business?.companyName || user?.lastName ? `${user?.firstName} ${user?.lastName}` : "Entreprise Partenaire";
  const managerName = user?.business?.managerRole ? `${user?.firstName} ${user?.lastName} (${user?.business.managerRole})` : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Direction Générale";
  const rccm = user?.business?.rccm || "En cours d'immatriculation";
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const invoiceNumber = `FAC-${new Date().getFullYear()}-${Math.abs((user?.email || "recruteur").split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 90000 + 10000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Barre d'actions supérieure (masquée à l'impression) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-sm sm:text-base">Facture d'Entreprise Normalisée (OHADA)</span>
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
        <div ref={printRef} className="p-8 sm:p-12 text-slate-800 bg-white space-y-8 print:p-0">
          
          {/* En-tête : Vendeur & Client */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                  M
                </div>
                <span className="text-xl font-black text-slate-950 tracking-tight">MonCV.ai</span>
              </div>
              <p className="text-xs font-bold text-slate-600 mt-2">INNOVA GROUP SARL</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                RCCM : CI-ABJ-03-2024-B12-04892<br />
                Régime d'Imposition : Réel Simplifié<br />
                Plateau, Boulevard de la République, Abidjan<br />
                Email : innovagroup225@gmail.com | Tél / WhatsApp : +225 07 00 51 05 24
              </p>
            </div>

            {/* Informations Client */}
            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl w-full sm:w-auto border sm:border-0 border-slate-200">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-extrabold text-[10px] uppercase tracking-wider">
                Client Professionnel
              </span>
              <h4 className="text-base font-black text-slate-900 mt-2">{companyName}</h4>
              <p className="text-xs text-slate-600 font-medium">{managerName}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                N° RCCM / IFU : <strong className="text-slate-800">{rccm}</strong><br />
                {user?.city || "Abidjan"}, {user?.country || "Côte d'Ivoire"}<br />
                Email : {user?.email}
              </p>
            </div>
          </div>

          {/* Numéro de Facture & Date */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">N° Facture</span>
              <span className="font-mono font-black text-slate-900">{invoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Date d'émission</span>
              <span className="font-bold text-slate-900">{today}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Règlement</span>
              <span className="font-bold text-slate-900">Mobile Money / Wave</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Statut</span>
              <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[10.5px]">
                <CheckCircle2 className="w-3 h-3" />
                ACQUITTÉE
              </span>
            </div>
          </div>

          {/* Lignes de facturation */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px]">
                  <th className="p-3.5">Désignation de la prestation logicielle</th>
                  <th className="p-3.5 text-center">Quota Profils</th>
                  <th className="p-3.5 text-right">Prix Unitaire</th>
                  <th className="p-3.5 text-right">Montant Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-4">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">{plan.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Licence SaaS multi-candidats avec accès illimité aux 6 templates de prestige, exports vectoriels PDF HD sans filigrane, documents Word (.docx) éditables, Lettres de motivation IA et Demandes d'Emploi Officielles.
                    </p>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-800">{plan.profiles} candidats</td>
                  <td className="p-4 text-right font-medium text-slate-600">{plan.price.toLocaleString("fr-FR")} F</td>
                  <td className="p-4 text-right font-black text-slate-900">{plan.price.toLocaleString("fr-FR")} FCFA</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totaux & Rapprochement Financier */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 pt-2">
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Mentions Légales & Conformité OHADA :</p>
              <p>Facture acquittée en devises locales (Franc CFA - XOF).</p>
              <p>Exonération de TVA conformément aux dispositions sur les services numériques dématérialisés.</p>
              <p className="text-emerald-700 font-semibold">Crédits de profils acquis à vie sans date d'expiration.</p>
            </div>

            <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Brut HT :</span>
                <span className="font-bold">{plan.price.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TVA (0%) :</span>
                <span className="font-bold">0 FCFA</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-black text-sm">
                <span>Net à Payer TTC :</span>
                <span className="text-blue-700">{plan.price.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
          </div>

          {/* Cachet numérique officiel & Signature */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Certifié conforme par INNOVA GROUP • Système de signature numérique automatisé</span>
            </div>
            <div className="border-2 border-dashed border-emerald-500/60 rounded-xl p-3 bg-emerald-50/50 text-center">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                Cachet Numérique MonCV.ai
              </span>
              <span className="text-[9.5px] font-bold text-emerald-700 block">
                PAYÉ & VALIDÉ LE {today.toUpperCase()}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
