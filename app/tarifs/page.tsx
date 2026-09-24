"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { PACKS_B2C_ARRAY, PACKS_B2B_ARRAY, CreditPack } from "@/config/payments";
import { WavePaymentClaimModal } from "@/components/tools/WavePaymentClaimModal";
import {
  Zap, Check, ShieldCheck, Sparkles, Building2, User,
  Clock, ArrowRight, Download, FileText, CheckCircle2, Phone, ExternalLink
} from "lucide-react";

export default function TarifsPage() {
  const [activeTab, setActiveTab] = useState<"particuliers" | "entreprises">("particuliers");
  const [selectedPackCode, setSelectedPackCode] = useState<string>("carriere");
  const [isWaveModalOpen, setIsWaveModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash === "#entreprises") {
        setActiveTab("entreprises");
      } else if (hash === "#particuliers") {
        setActiveTab("particuliers");
      }
    }
  }, []);

  const handleTabChange = (tab: "particuliers" | "entreprises") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.location.hash = tab;
    }
  };

  const handleSelectPack = (pack: CreditPack) => {
    if (pack.prixFcfa === 0) return;
    setSelectedPackCode(pack.slug);
    setIsWaveModalOpen(true);
  };

  const currentPacks = activeTab === "particuliers" ? PACKS_B2C_ARRAY : PACKS_B2B_ARRAY;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-blue-600" />
            Crédits prépayés — Aucun abonnement — Règlement Wave
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Tarifs clairs et transparents en FCFA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500">
              pour candidats et organisations
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Rechargez vos crédits en toute liberté avec Wave ou Orange Money. Validité 12 mois, zéro prélèvement récurrent, facture normalisée OHADA délivrée sur chaque achat.
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
                La création manuelle, l édition et les exports sans filigrane restent toujours gratuits (0 crédit).
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

        {/* 2 Tabs Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700">
            <button
              onClick={() => handleTabChange("particuliers")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === "particuliers"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-900/5"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              Candidats & Particuliers
            </button>
            <button
              onClick={() => handleTabChange("entreprises")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === "entreprises"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-slate-900/5"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Entreprises & Établissements
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                Tarifs de gros
              </span>
            </button>
          </div>
        </div>

        {/* Credit Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentPacks.map((pack) => {
            const isFree = pack.prixFcfa === 0;
            const isHighlighted = pack.misEnAvant;
            const unitPrice = pack.prixFcfa > 0 ? (pack.prixFcfa / pack.credits).toFixed(2).replace(".", ",") : "Offert";

            return (
              <div
                key={pack.slug}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 transition-all duration-300 ${
                  isHighlighted
                    ? "bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 scale-105 z-10"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black tracking-wider uppercase shadow-md">
                    Recommandé
                  </div>
                )}

                <div className="space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      {pack.nom}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                      {pack.cible}
                    </p>
                  </div>

                  <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                        {pack.prixFcfa === 0 ? "0 FCFA" : `${pack.prixFcfa.toLocaleString("fr-FR")} F`}
                      </span>
                      {pack.prixFcfa > 0 && <span className="text-xs text-slate-400 font-semibold">CFA</span>}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {pack.credits.toLocaleString("fr-FR")} crédits
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {pack.prixFcfa > 0 ? `${unitPrice} F / crédit` : "Inscription"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pack.validiteMois ? `Validité : ${pack.validiteMois} mois` : "Validité permanente"}</span>
                      {pack.sieges && (
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 ml-auto">
                          {pack.sieges} siège{pack.sieges > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Avantages */}
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    {pack.avantages.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                  {isFree ? (
                    <Link
                      href="/create"
                      className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 font-bold text-xs text-slate-900 dark:text-white transition flex items-center justify-center gap-2"
                    >
                      Commencer gratuitement
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : pack.slug === "licence_etablissement" ? (
                    <a
                      href="https://wa.me/2250700510524?text=Bonjour,%20je%20souhaite%20obtenir%20un%20devis%20pour%20la%20Licence%20Etablissement%20MonCV.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      Demander un devis sur mesure
                    </a>
                  ) : (
                    <button
                      onClick={() => handleSelectPack(pack)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                        isHighlighted
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                          : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      }`}
                    >
                      Acheter par Wave
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Table of Action Costs (§1.1) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Barème officiel d utilisation des crédits
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Chaque action IA consomme un montant fixe de crédits. Vos crédits ne sont débités QUE si la génération réussit.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
              Exports PDF & Word : 0 crédit garanti
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Génération / Réécriture CV complet IA", cost: "10 crédits", desc: "Refonte intégrale avec accroche, missions et compétences clés" },
              { label: "Lettre de motivation personnalisée IA", cost: "5 crédits", desc: "Rédigée sur mesure selon l offre d emploi et l entreprise visée" },
              { label: "Analyse & Optimisation Score ATS", cost: "5 crédits", desc: "Audit de conformité avec les mots-clés des recruteurs" },
              { label: "Traduction du CV en Anglais professionnel", cost: "8 crédits", desc: "Traduction adaptée aux standards internationaux" },
              { label: "Photo de profil professionnelle IA", cost: "25 crédits", desc: "Optimisation studio HD et recadrage recruteur certifié" },
              { label: "Export PDF & Word sans filigrane", cost: "0 crédit (Gratuit)", desc: "Téléchargements illimités à vie de tous vos CV créés", highlight: true },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  item.highlight
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                    : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
                }`}
              >
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-black text-xs shrink-0 whitespace-nowrap ${
                    item.highlight
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  }`}
                >
                  {item.cost}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto font-black text-lg">
              🌊
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Paiement Mobile Money Sécurisé</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Payez instantanément par Wave ou Orange Money depuis votre téléphone sans frais cachés.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Facture Normalisée OHADA</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Toutes vos recharges émettent une facture conforme avec numéro séquentiel et coordonnées légales.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Validité Longue Durée (12 mois)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vos crédits restent valides pendant un an entier. Utilisez-les à votre rythme au fil de vos candidatures.
            </p>
          </div>
        </div>
      </main>

      <WavePaymentClaimModal
        isOpen={isWaveModalOpen}
        onClose={() => setIsWaveModalOpen(false)}
        defaultPackCode={selectedPackCode}
      />
    </div>
  );
}
