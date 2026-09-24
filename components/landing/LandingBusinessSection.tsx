"use client";

import React from "react";
import Link from "next/link";
import {
  Building,
  Building2,
  Zap,
  TrendingUp,
  ShieldCheck,
  Award,
  Users,
  Flame,
  CheckCircle2,
  Crown,
  ChevronRight,
  MessageCircle,
  Lock,
  FileText,
} from "lucide-react";
import { PACKS_B2B_ARRAY } from "@/config/payments";

interface LandingBusinessSectionProps {
  onSelectPack: (packSlug: string) => void;
  onOpenBusinessAuth: () => void;
}

export const LandingBusinessSection: React.FC<LandingBusinessSectionProps> = ({
  onSelectPack,
  onOpenBusinessAuth,
}) => {
  return (
    <section
      id="business"
      className="py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden border-t border-slate-800"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/15 to-purple-600/15 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span>Offres B2B & Solutions Entreprises</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tight leading-tight">
            Multipliez la Puissance de vos Recrutements. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">
              Organisation Multi-utilisateurs & Crédits Mutualisés
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed font-normal">
            Cabinets de recrutement, PME, universités, ONG et agences d'intérim : centralisez la gestion de vos candidatures, partagez un solde de crédits prépayés pour toute votre équipe et bénéficiez de factures normalisées OHADA conformes.
          </p>
        </div>

        {/* 4 Piliers B2B */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:border-blue-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">Crédits Mutualisés d'Équipe</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Un seul compte pour toute l'organisation. Tous les collaborateurs autorisés puisent dans un solde commun sans frottement.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">Gestion des Sièges Collaborateurs</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Attribuez les rôles (propriétaire, administrateur, membre) selon le quota de sièges de votre formule (1 à illimités).
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">Audit de Consommation & Export CSV</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traçabilité intégrale de chaque génération IA avec date, collaborateur, action et export comptable en un clic.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">Factures Normalisées OHADA</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Chaque recharge émet une facture en bonne et due forme avec mentions légales complètes (RCCM, IFU d'INNOVA GROUP SARL).
            </p>
          </div>
        </div>

        {/* 4 Formules B2B */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-4">
          {PACKS_B2B_ARRAY.map((pack) => {
            const isHighlighted = pack.misEnAvant;
            const isLicence = pack.slug === "licence_etablissement";

            return (
              <div
                key={pack.slug}
                className={`p-6 rounded-3xl flex flex-col justify-between transition-all relative card-hover-lift card-shine backdrop-blur-md ${
                  isHighlighted
                    ? "bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-2 border-indigo-400 shadow-2xl ring-4 ring-indigo-500/20 scale-[1.02] z-10"
                    : "bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-[10px] sm:text-[11px] px-4 py-1 rounded-full uppercase tracking-wider shadow-xl flex items-center gap-1.5 whitespace-nowrap z-20">
                    <Flame className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Recommandé Cabinets & Entreprises</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {pack.nom}
                    </span>
                    <span className="text-[10.5px] font-bold text-amber-300">
                      {pack.sieges ? `${pack.sieges} sièges` : "Sièges illimités"}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white">{pack.nom}</h3>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white">
                      {pack.prixFcfa.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      FCFA
                    </span>
                  </div>

                  <div className="mt-1 text-xs font-bold text-emerald-400">
                    {pack.credits.toLocaleString("fr-FR")} crédits
                    <span className="ml-1 text-[10.5px] font-normal text-slate-400">
                      ({pack.prixCreditFcfa} F / cr)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {pack.cible}
                  </p>

                  <ul className="mt-5 space-y-2 text-xs text-slate-300">
                    {pack.avantages.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  {isLicence ? (
                    <a
                      href="https://wa.me/2250700510524?text=Bonjour%20INNOVA%20GROUP,%20notre%20%C3%A9tablissement%20souhaite%20un%20devis%20B2B%20pour%20la%20Licence%20%C3%89tablissement%20sur%20MonCV.ai."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Devis & Commande</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectPack(pack.slug)}
                      className={`w-full py-3.5 px-4 font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        isHighlighted
                          ? "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/40 animate-cta-loop"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Recharger ({pack.prixFcfa.toLocaleString("fr-FR")} F)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Accord-Cadre & Grandes Écoles */}
        <div className="mt-10 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-950/70 via-indigo-950/70 to-purple-950/70 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left backdrop-blur-md">
          <div className="space-y-1 max-w-xl">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-300 block">
              Accord-Cadre & Grandes Écoles
            </span>
            <h4 className="text-base sm:text-lg font-black text-white">
              Besoin de plus de 50 000 crédits ou d'un accord sur-mesure ?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Grandes écoles, universités, ministères ou groupes panafricains : nous configurons votre structure avec utilisateurs illimités et facturation centralisée.
            </p>
          </div>
          <a
            href="https://wa.me/2250700510524?text=Bonjour%20INNOVA%20GROUP,%20notre%20organisation%20souhaite%20un%20devis%20B2B%20sur-mesure%20pour%20plus%20de%2050%20000%20cr%C3%A9dits%20sur%20MonCV.ai."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer group"
          >
            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Devis Institutionnel sur WhatsApp</span>
            <ChevronRight className="w-4 h-4 text-emerald-200" />
          </a>
        </div>

        {/* Accès Espace Organisation Box */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white">
                Vous êtes un Cabinet RH, une Entreprise ou une École ?
              </h5>
              <p className="text-xs text-slate-300">
                Créez ou connectez votre Espace Organisation pour piloter vos collaborateurs, vos crédits mutualisés et vos factures normalisées.
              </p>
            </div>
          </div>
          <Link
            href="/organisation"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
          >
            <span>Accéder à l'Espace Organisation</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Paiement 100% sécurisé via Wave & Mobile Money (zéro prélèvement automatique)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Factures délivrées par INNOVA GROUP SARL (RCCM CI-ABJ-03-2024-B12-04871)</span>
          </div>
        </div>
      </div>
    </section>
  );
};
