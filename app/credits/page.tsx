"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { WavePaymentClaimModal } from "@/components/tools/WavePaymentClaimModal";
import { KKiaPayWidgetModal } from "@/components/payment/KKiaPayWidget";
import {
  Zap,
  Clock,
  ShieldCheck,
  Plus,
  History,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Coins,
  Sparkles,
  CreditCard,
  Lock,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  WalletSummary,
  CreditTransaction,
  CreditPackage,
  CreditCost,
} from "@/lib/types";

export default function CreditsPage() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [costs, setCosts] = useState<CreditCost[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales de paiement
  const [isWaveModalOpen, setIsWaveModalOpen] = useState(false);
  const [isKKiaPayModalOpen, setIsKKiaPayModalOpen] = useState(false);
  const [selectedPlanForKKiaPay, setSelectedPlanForKKiaPay] = useState<string>("pro");

  // Filtre d'historique
  const [activeTab, setActiveTab] = useState<"all" | "purchase" | "usage" | "bonus">("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [credRes, costsRes] = await Promise.all([
        fetch("/api/credits"),
        fetch("/api/admin/credits/costs").catch(() => null),
      ]);

      if (credRes.ok) {
        const data = await credRes.json();
        setWallet(data.wallet || data.summary || null);
        setTransactions(data.transactions || data.ledger || []);
        if (data.packages && Array.isArray(data.packages)) {
          setPackages(data.packages);
        }
      }

      if (costsRes && costsRes.ok) {
        const costData = await costsRes.json();
        if (costData.costs) setCosts(costData.costs);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données AI Coins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPayment = (packSlug: string) => {
    setSelectedPlanForKKiaPay(packSlug);
    setIsKKiaPayModalOpen(true);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "all") return true;
    if (activeTab === "purchase") return tx.type === "purchase" || tx.type === "subscription";
    if (activeTab === "usage") return tx.type === "usage";
    if (activeTab === "bonus") {
      return (
        tx.type === "bonus" ||
        tx.type === "signup_bonus" ||
        tx.type === "referral_bonus" ||
        tx.type === "promotion"
      );
    }
    return true;
  });

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "purchase":
      case "subscription":
        return {
          label: "Achat Pack",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: ArrowDownLeft,
          color: "text-emerald-600",
        };
      case "signup_bonus":
        return {
          label: "Bonus Inscription",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: Sparkles,
          color: "text-purple-600",
        };
      case "promotion":
      case "bonus":
        return {
          label: "Bonus Pack",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Sparkles,
          color: "text-amber-600",
        };
      case "usage":
        return {
          label: "Consommation IA",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: ArrowUpRight,
          color: "text-blue-600",
        };
      case "refund":
        return {
          label: "Remboursement",
          bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
          icon: ArrowDownLeft,
          color: "text-cyan-600",
        };
      case "admin_adjustment":
        return {
          label: "Geste Admin",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: ShieldCheck,
          color: "text-indigo-600",
        };
      default:
        return {
          label: type,
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: History,
          color: "text-slate-600",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-2">
              <span className="text-sm">💎</span>
              Portefeuille Interne MonCV.ai
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              AI COINS & Grand Livre des Opérations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Mesurez et gérez votre consommation des technologies d'intelligence artificielle.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
              title="Actualiser le solde"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => handleOpenPayment("pro")}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition btn-press cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Recharger mes AI Coins
            </button>
          </div>
        </div>

        {/* SECTION 1 : WALLET CARD PRINCIPALE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Carte Majeure : Solde Disponible & Réservé */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
            <div className="absolute right-12 top-6 opacity-10 text-8xl font-black select-none pointer-events-none">
              💎
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Portefeuille Actif
              </span>
              <div className="px-2.5 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-semibold backdrop-blur-xs">
                Zero Overdraft Guarantee
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-semibold">Solde Disponible</span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                  {wallet ? wallet.availableCredits.toLocaleString("fr-FR") : "—"}
                </span>
                <span className="text-xl font-bold text-amber-400">AI Coins</span>
              </div>
            </div>

            {/* Métriques secondaires */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-400 font-medium">En Réservation</div>
                <div className="text-sm sm:text-base font-bold text-amber-300">
                  {wallet?.reservedCredits || 0} Coins
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-400 font-medium">Cumul Acheté</div>
                <div className="text-sm sm:text-base font-bold text-emerald-400">
                  {wallet?.lifetimePurchased || 0} Coins
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-400 font-medium">Cumul Consommé</div>
                <div className="text-sm sm:text-base font-bold text-blue-300">
                  {wallet?.lifetimeConsumed || 0} Coins
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-400 font-medium">Bonus & Cadeaux</div>
                <div className="text-sm sm:text-base font-bold text-purple-300">
                  {wallet?.lifetimeEarned || 0} Coins
                </div>
              </div>
            </div>
          </div>

          {/* Carte d'Aide & Statut */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl">
                ⚡
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Réservation Sécurisée
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Lorsque vous lancez une tâche IA, le montant requis est temporairement réservé.
                Si le modèle IA rencontre une anomalie, vos AI Coins sont automatiquement restitués.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500">Exports PDF & Word :</span>
              <span className="text-emerald-600 font-bold">100% Illimités & Gratuits</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 : PACKS D'AI COINS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Recharger mon Portefeuille
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paiement instantané par Mobile Money (Wave, Orange, MTN, Moov) et Carte Bancaire.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pack 1 : Starter */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Starter
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                    +50 bonus
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    500 <span className="text-sm font-semibold text-slate-500">AI Coins</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600 mt-1">
                    5 000 FCFA
                  </div>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Soit 25 CV complets ou 50 lettres
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Sans expiration de durée
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Facture disponible
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleOpenPayment("starter")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition cursor-pointer"
              >
                Choisir Starter
              </button>
            </div>

            {/* Pack 2 : Pro (Populaire) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500 shadow-lg relative flex flex-col justify-between space-y-5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider">
                ⭐ Le Plus Populaire
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    Pro Pack
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                    +200 bonus
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    1 500 <span className="text-sm font-semibold text-slate-500">AI Coins</span>
                  </div>
                  <div className="text-lg font-bold text-amber-600 mt-1">
                    12 000 FCFA
                  </div>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Soit 75 CV complets ou 150 lettres
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Photos professionnelles IA incluses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Support prioritaire WhatsApp
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleOpenPayment("pro")}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                Choisir Pro
              </button>
            </div>

            {/* Pack 3 : Business */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Business
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 text-[10px] font-black">
                    +1 000 bonus
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    5 000 <span className="text-sm font-semibold text-slate-500">AI Coins</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600 mt-1">
                    30 000 FCFA
                  </div>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Soit 250 CV complets ou 500 lettres
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Idéal pour cabinets RH & agences
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Facture normalisée OHADA
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleOpenPayment("business")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition cursor-pointer"
              >
                Choisir Business
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3 : GRAND LIVRE DES TRANSACTIONS (IMMUTABLE LEDGER) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Grand Livre des AI Coins
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit trail immuable de chaque crédit, réservation et débit d'AI Coins.
              </p>
            </div>

            {/* Filtres */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setActiveTab("purchase")}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === "purchase" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Achats
              </button>
              <button
                onClick={() => setActiveTab("usage")}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === "usage" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Consommations IA
              </button>
              <button
                onClick={() => setActiveTab("bonus")}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === "bonus" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Bonus
              </button>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Aucun mouvement enregistré pour ce filtre
              </p>
              <p className="text-xs text-slate-500">
                Vos prochaines opérations IA apparaîtront ici avec leur référence unique.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((tx) => {
                const badge = getTransactionTypeBadge(tx.type);
                const isPositive = tx.amount > 0;
                return (
                  <div
                    key={tx.id || tx.reference}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl border ${badge.bg}`}>
                        <badge.icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {tx.description}
                          </span>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{new Date(tx.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px] truncate max-w-[180px] sm:max-w-xs">{tx.reference}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right pl-12 sm:pl-0">
                      <div className={`text-sm sm:text-base font-black ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        {isPositive ? `+${tx.amount}` : tx.amount} AI Coins
                      </div>
                      <div className="text-[10.5px] text-slate-400">
                        Solde après : {tx.balanceAfter} Coins
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 4 : BARÈME OFFICIEL DES FONCTIONNALITÉS */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            Tarification des Fonctionnalités IA (Coûts en AI Coins)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chaque opération est facturée selon un barème transparent, débité uniquement en cas de succès.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">CV Complet IA</div>
              <div className="text-lg font-black text-blue-600">20 AI Coins</div>
              <div className="text-[10px] text-slate-400">Génération / réécriture</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lettre de Motivation</div>
              <div className="text-lg font-black text-amber-600">10 AI Coins</div>
              <div className="text-[10px] text-slate-400">Personnalisée au poste</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Analyse ATS & Traduction</div>
              <div className="text-lg font-black text-purple-600">10 AI Coins</div>
              <div className="text-[10px] text-slate-400">Score & adaptation</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Photo Pro Studio</div>
              <div className="text-lg font-black text-emerald-600">50 AI Coins</div>
              <div className="text-[10px] text-slate-400">Studio HD & fond pro</div>
            </div>
          </div>
        </div>

        {/* SECTION 5 : CLAUSE LÉGALE & DISCLAIMER OBLIGATOIRE */}
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
            <Info className="w-4 h-4 shrink-0" />
            <span>Clause Juridique & Conditions d'Utilisation des AI Coins</span>
          </div>
          <p className="leading-relaxed">
            Les <strong>AI Coins</strong> sont des unités virtuelles internes de facturation à usage strictement réservé au sein du SaaS MonCV.ai.
            Ils ne constituent en aucun cas une monnaie ayant cours légal, un moyen de paiement bancaire, ni un actif financier, token blockchain ou cryptomonnaie.
            Ils ne possèdent aucune valeur monétaire en dehors du service, ne génèrent aucun droit à intérêts et ne peuvent pas être convertis librement en espèces.
          </p>
        </div>
      </main>

      {/* Modal KKiaPay Widget pour le rechargement */}
      <KKiaPayWidgetModal
        isOpen={isKKiaPayModalOpen}
        onClose={() => setIsKKiaPayModalOpen(false)}
        planId={selectedPlanForKKiaPay}
        onSuccess={() => {
          setIsKKiaPayModalOpen(false);
          fetchData();
        }}
      />

      {/* Modal Réclamation Wave */}
      <WavePaymentClaimModal
        isOpen={isWaveModalOpen}
        onClose={() => setIsWaveModalOpen(false)}
        onClaimSubmitted={() => {
          setIsWaveModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}
