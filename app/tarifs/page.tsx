"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { CREDIT_PACKS_ARRAY, CREDIT_ACTIONS_COST, CreditPack } from "@/config/payments";
import { WavePaymentClaimModal } from "@/components/tools/WavePaymentClaimModal";
import {
  Zap, Check, ShieldCheck, Sparkles, HelpCircle,
  Clock, ArrowRight, Download, FileText, CheckCircle2, Lock, ExternalLink
} from "lucide-react";

export default function TarifsPage() {
  const [selectedPackCode, setSelectedPackCode] = useState<string>("evolution");
  const [isWaveModalOpen, setIsWaveModalOpen] = useState(false);

  const handleSelectPack = (pack: CreditPack) => {
    if (pack.priceFcfa === 0) return;
    setSelectedPackCode(pack.code);
    setIsWaveModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-blue-600" />
            Packs de crédits prépayés — Sans engagement
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Tarifs transparents, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500">
              payez uniquement ce que vous utilisez
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Choisissez votre pack de crédits avec une durée de validité généreuse et réglez en toute simplicité par Wave. Zéro engagement, zéro prélèvement surprise.
          </p>
        </div>

        {/* Free Features Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Téléchargements PDF & Word 100% Gratuits & Illimités
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                L'édition manuelle de vos CV et l'export sans filigrane restent totalement gratuits à vie (0 crédit).
              </p>
            </div>
          </div>
          <Link
            href="/create"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            Créer un CV gratuitement
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Credit Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CREDIT_PACKS_ARRAY.map((pack) => {
            const isFree = pack.priceFcfa === 0;
            const isPopular = pack.recommended;
            const isBestValue = pack.code === "carriere";

            return (
              <div
                key={pack.code}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 transition-all duration-300 ${
                  isPopular
                    ? "bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 scale-105 z-10"
                    : isBestValue
                    ? "bg-white dark:bg-slate-900 border-2 border-indigo-500/60 dark:border-indigo-400/50 shadow-lg"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Badges */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black tracking-wider uppercase shadow-md">
                    Le plus populaire
                  </div>
                )}
                {isBestValue && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-black tracking-wider uppercase shadow-md">
                    Meilleur rapport
                  </div>
                )}

                <div className="space-y-5">
                  {/* Top info */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {pack.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                      {pack.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {isFree ? "0" : pack.priceFcfa.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        FCFA
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-blue-600" />
                        {pack.credits} crédits
                      </span>
                      {pack.unitPriceFcfa > 0 && (
                        <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                          {pack.unitPriceFcfa} F / crédit
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Validité : <strong className="text-slate-700 dark:text-slate-300">{pack.validityDays ? `${pack.validityDays} jours` : "Illimité"}</strong></span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    {(pack.features || []).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action button */}
                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {isFree ? (
                    <Link
                      href="/create"
                      className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                    >
                      Commencer gratuitement
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectPack(pack)}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition ${
                        isPopular
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
                          : "bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                      }`}
                    >
                      <span>Acheter avec Wave</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Cost Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Grille tarifaire par fonctionnalité
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Une clarté absolue : chaque action IA a un coût fixé en crédits, débité uniquement si l'IA produit votre résultat.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Fonctionnalité</th>
                  <th className="py-3 px-4">Détails</th>
                  <th className="py-3 px-4 text-right">Coût</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    Génération & Réécriture CV IA
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    Reformulation percutante de vos expériences et compétences
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs">
                      <Zap className="w-3.5 h-3.5 fill-amber-500" />
                      {CREDIT_ACTIONS_COST.cv_generate} crédits
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    Lettre de motivation IA
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    Rédaction personnalisée et argumentée pour le poste visé
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs">
                      <Zap className="w-3.5 h-3.5 fill-amber-500" />
                      {CREDIT_ACTIONS_COST.cover_letter} crédits
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    Adaptation & Score ATS
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    Analyse des mots-clés et compatibilité avec les logiciels recruteurs
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs">
                      <Zap className="w-3.5 h-3.5 fill-amber-500" />
                      {CREDIT_ACTIONS_COST.ats_analysis} crédits
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    Traduction CV en Anglais
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    Traduction professionnelle avec terminologie RH anglophone
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs">
                      <Zap className="w-3.5 h-3.5 fill-amber-500" />
                      {CREDIT_ACTIONS_COST.translate_en} crédits
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    Photo de profil Professionnelle IA
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    Détourage studio et mise en valeur professionnelle
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs">
                      <Zap className="w-3.5 h-3.5 fill-amber-500" />
                      {CREDIT_ACTIONS_COST.pro_photo} crédits
                    </span>
                  </td>
                </tr>

                {/* Free features row */}
                <tr className="bg-emerald-50/60 dark:bg-emerald-950/20 font-medium">
                  <td className="py-3.5 px-4 font-bold text-emerald-800 dark:text-emerald-300">
                    Création manuelle, Édition & Exports (PDF / DOCX)
                  </td>
                  <td className="py-3.5 px-4 text-xs text-emerald-700 dark:text-emerald-400">
                    Tous les modèles, aperçu en direct, téléchargements illimités sans filigrane
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs">
                      0 crédit (GRATUIT)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Guarantees Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Garantie Zéro Débit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Si l'IA rencontre un incident de connexion ou ne produit pas le résultat attendu, aucun crédit n'est prélevé. Tout débit accidentel est remboursé.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Consommation FIFO
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Le système utilise automatiquement en priorité les crédits qui expirent le plus tôt, préservant ainsi la durée de validité de vos recharges récentes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Zéro Prélèvement Surprise
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Aucun prélèvement automatique récurrent. Vous achetez exactement le pack dont vous avez besoin quand vous en avez besoin via Wave.
            </p>
          </div>
        </div>
      </main>

      {/* Modal Wave Claim */}
      <WavePaymentClaimModal
        isOpen={isWaveModalOpen}
        onClose={() => setIsWaveModalOpen(false)}
        defaultPackCode={selectedPackCode}
      />
    </div>
  );
}
