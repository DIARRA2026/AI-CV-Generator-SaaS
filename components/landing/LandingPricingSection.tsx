"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  ArrowRight,
  User,
  Building2,
  Flame,
  CheckCircle2,
  Zap,
  Sparkles,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import {
  PACKS_B2C_ARRAY,
  PACKS_B2B_ARRAY,
  CreditPack,
} from "@/config/payments";

interface LandingPricingSectionProps {
  onSelectPack: (packSlug: string) => void;
  onStartCreation: () => void;
}

export const LandingPricingSection: React.FC<LandingPricingSectionProps> = ({
  onSelectPack,
  onStartCreation,
}) => {
  const [activeTab, setActiveTab] = useState<"particuliers" | "entreprises">(
    "particuliers"
  );

  const packs = activeTab === "particuliers" ? PACKS_B2C_ARRAY : PACKS_B2B_ARRAY;

  return (
    <section id="tarifs" className="py-12 sm:py-20 bg-white border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 block">
            Crédits Prépayés & Tarifs 2026
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tarifs clairs et transparents en FCFA
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Zéro abonnement mensuel, zéro prélèvement récurrent. Rechargez en toute liberté via Mobile Money (Wave, Orange Money) avec une validité de 12 mois.
          </p>
        </div>

        {/* Bannière Téléchargements Gratuits */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 text-emerald-900">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-extrabold text-xs sm:text-sm">
                Téléchargements PDF & Word 100% Gratuits & Illimités
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-700">
                La création manuelle, l'édition et les exports sans filigrane restent toujours gratuits (0 crédit). 30 crédits IA offerts à l'inscription.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStartCreation}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Créer mon CV</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sélecteur d'Onglets Particuliers / Entreprises */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("particuliers")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === "particuliers"
                  ? "bg-white text-blue-600 shadow-md shadow-slate-900/5 border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Candidats & Particuliers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("entreprises")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === "entreprises"
                  ? "bg-white text-blue-600 shadow-md shadow-slate-900/5 border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Entreprises & Structures</span>
            </button>
          </div>
        </div>

        {/* Grille des Cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {packs.map((pack) => {
            const isFree = pack.prixFcfa === 0;
            const isHighlighted = pack.misEnAvant;

            return (
              <div
                key={pack.slug}
                className={`p-6 rounded-3xl flex flex-col justify-between transition-all relative card-hover-lift card-shine ${
                  isHighlighted
                    ? "bg-gradient-to-b from-blue-900 to-indigo-950 text-white shadow-xl ring-4 ring-blue-500/80"
                    : "bg-white border border-slate-200 shadow-xs hover:border-blue-300"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 whitespace-nowrap">
                    <Flame className="w-3 h-3 fill-slate-950" />
                    <span>Recommandé</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isHighlighted
                          ? "bg-blue-500/30 text-blue-200 border border-blue-400/30"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {pack.nom}
                    </span>
                    {pack.sieges && (
                      <span
                        className={`text-[10px] font-bold ${
                          isHighlighted ? "text-blue-300" : "text-slate-500"
                        }`}
                      >
                        {pack.sieges === 1 ? "1 siège" : `${pack.sieges} sièges`}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-lg font-black ${
                      isHighlighted ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {pack.nom}
                  </h3>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span
                      className={`text-3xl font-black ${
                        isHighlighted ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {pack.prixFcfa.toLocaleString("fr-FR")}
                    </span>
                    <span
                      className={`text-xs font-bold uppercase ${
                        isHighlighted ? "text-blue-300" : "text-slate-500"
                      }`}
                    >
                      FCFA
                    </span>
                  </div>

                  <div
                    className={`mt-1 text-xs font-bold ${
                      isHighlighted ? "text-amber-300" : "text-blue-600"
                    }`}
                  >
                    {pack.credits.toLocaleString("fr-FR")} crédits
                    {pack.prixFcfa > 0 && (
                      <span
                        className={`ml-1.5 text-[10.5px] font-normal ${
                          isHighlighted ? "text-blue-200/80" : "text-slate-500"
                        }`}
                      >
                        ({pack.prixCreditFcfa} F / cr)
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-[11px] mt-2 leading-relaxed ${
                      isHighlighted ? "text-blue-100/80" : "text-slate-500"
                    }`}
                  >
                    {pack.cible}
                  </p>

                  <ul className="mt-5 space-y-2 text-xs">
                    {pack.avantages.map((adv, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-2 ${
                          isHighlighted ? "text-blue-100" : "text-slate-700"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            isHighlighted ? "text-blue-400" : "text-emerald-600"
                          }`}
                        />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100/20">
                  {isFree ? (
                    <button
                      type="button"
                      onClick={onStartCreation}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-center text-xs transition-all cursor-pointer shadow-xs"
                    >
                      Créer mon CV Gratuitement
                    </button>
                  ) : pack.slug === "licence_etablissement" ? (
                    <a
                      href="https://wa.me/2250700510524?text=Bonjour%20INNOVA%20GROUP,%20notre%20%C3%A9tablissement%20souhaite%20un%20devis%20pour%20la%20Licence%20%C3%89tablissement%20sur%20MonCV.ai."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-center text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Devis & Commande</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectPack(pack.slug)}
                      className={`w-full py-3.5 px-4 font-black rounded-2xl text-center text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                        isHighlighted
                          ? "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/30 animate-cta-loop"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
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

        {/* Barème Officiel des Actions IA */}
        <div className="mt-12 p-6 rounded-3xl bg-slate-50 border border-slate-200 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="font-black text-sm text-slate-900">
                Barème Officiel des Débits IA & Gratuité
              </h4>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Garantie Zéro Débit avant succès</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10.5px]">Génération CV Complet</div>
              <div className="font-extrabold text-blue-700 text-sm mt-0.5">10 crédits</div>
              <div className="text-[10px] text-slate-400">~125 FCFA</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10.5px]">Lettre de Motivation IA</div>
              <div className="font-extrabold text-blue-700 text-sm mt-0.5">5 crédits</div>
              <div className="text-[10px] text-slate-400">~62,5 FCFA</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10.5px]">Analyse & Score ATS</div>
              <div className="font-extrabold text-blue-700 text-sm mt-0.5">5 crédits</div>
              <div className="text-[10px] text-slate-400">~62,5 FCFA</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10.5px]">Traduction en Anglais</div>
              <div className="font-extrabold text-blue-700 text-sm mt-0.5">8 crédits</div>
              <div className="text-[10px] text-slate-400">~100 FCFA</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10.5px]">Photo de Profil Pro IA</div>
              <div className="font-extrabold text-purple-700 text-sm mt-0.5">25 crédits</div>
              <div className="text-[10px] text-slate-400">Haute définition</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs col-span-2 sm:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-emerald-900 text-xs">
                    Création manuelle, Édition & Exports PDF/Word HD
                  </div>
                  <div className="text-[10.5px] text-emerald-700">
                    Tous les 6 modèles sans aucun filigrane
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs shrink-0">
                  0 crédit (Gratuit)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>Tous les packs payants sont valables 12 mois. Aucun abonnement récurrent.</span>
            <Link
              href="/tarifs"
              className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Voir la page complète des tarifs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
