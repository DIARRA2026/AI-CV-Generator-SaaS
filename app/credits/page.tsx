"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { WavePaymentClaimModal } from "@/components/tools/WavePaymentClaimModal";
import {
  Zap, Clock, ShieldCheck, Plus, History, Layers,
  AlertCircle, CheckCircle2, XCircle, ArrowUpRight, ArrowDownLeft, RefreshCw
} from "lucide-react";
import { CreditBatch, CreditLedgerEntry, PaymentClaim, UserCreditSummary } from "@/lib/types";
import { CREDIT_PACKS } from "@/config/payments";

export default function CreditsPage() {
  const [summary, setSummary] = useState<UserCreditSummary | null>(null);
  const [batches, setBatches] = useState<CreditBatch[]>([]);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWaveModalOpen, setIsWaveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"batches" | "ledger" | "claims">("batches");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [credRes, claimsRes] = await Promise.all([
        fetch("/api/credits"),
        fetch("/api/payment-claims"),
      ]);

      if (credRes.ok) {
        const data = await credRes.json();
        setSummary(data.summary || null);
        setBatches(data.batches || []);
        setLedger(data.ledger || []);
      }

      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(claimsData.claims || []);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des crédits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatExpiry = (dateStr?: string | null) => {
    if (!dateStr) return "Aucune expiration (illimité)";
    const date = new Date(dateStr);
    const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 3600 * 24));
    if (diffDays <= 0) return "Expiré";
    if (diffDays === 1) return "Expire demain";
    return `Dans ${diffDays} jours (${date.toLocaleDateString("fr-FR")})`;
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "welcome_gift":
        return "Cadeau de bienvenue (30 crédits)";
      case "purchase":
        return "Achat de pack de crédits Wave";
      case "cv_generate":
        return "Génération / Réécriture CV IA";
      case "cover_letter":
        return "Rédaction Lettre de motivation IA";
      case "ats_analysis":
        return "Optimisation & Score ATS IA";
      case "translate_en":
        return "Traduction CV en Anglais IA";
      case "pro_photo":
        return "Photo de profil professionnelle IA";
      case "refund":
      case "refund_failed_ia":
        return "Remboursement suite à incident IA";
      default:
        return action;
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
              <Zap className="w-3.5 h-3.5 fill-amber-500" />
              Espace Crédits IA
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Gestion de votre solde et historique
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Consultez vos lots de crédits disponibles, vos consommations et vos réclamations de paiement Wave.
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
              onClick={() => setIsWaveModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Recharger mes crédits Wave
            </button>
          </div>
        </div>

        {/* Balance Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Balance */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg space-y-3 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-100">
                Solde disponible
              </span>
              <div className="p-2 rounded-xl bg-white/10 text-white">
                <Zap className="w-5 h-5 fill-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">
                {summary ? summary.balance : "—"}
              </span>
              <span className="text-sm font-semibold text-blue-200">
                crédits actifs
              </span>
            </div>
            <p className="text-xs text-blue-100/90 pt-1">
              Prêt pour vos prochaines générations de CV et lettres de motivation.
            </p>
          </div>

          {/* Card 2: Next Expiration */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Prochaine expiration
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {summary ? formatExpiry(summary.nearestExpiry) : "Chargement..."}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Règle FIFO : vos crédits les plus proches de l'échéance sont consommés en premier.
            </p>
          </div>

          {/* Card 3: Free Guarantee */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Exports & Édition
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              100% Gratuit & Illimité
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Téléchargez vos CV en PDF et Word sans filigrane même avec un solde à 0 crédit.
            </p>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Tabs bar */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 pt-4 gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab("batches")}
              className={`pb-3.5 border-b-2 transition flex items-center gap-2 ${
                activeTab === "batches"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              Lots de crédits actifs ({batches.length})
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`pb-3.5 border-b-2 transition flex items-center gap-2 ${
                activeTab === "ledger"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History className="w-4 h-4" />
              Historique des opérations ({ledger.length})
            </button>

            <button
              onClick={() => setActiveTab("claims")}
              className={`pb-3.5 border-b-2 transition flex items-center gap-2 ${
                activeTab === "claims"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              Paiements Wave ({claims.length})
            </button>
          </div>

          {/* Tab 1: Active Batches */}
          {activeTab === "batches" && (
            <div className="p-6">
              {batches.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Aucun lot de crédits actif pour le moment
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Rechargez un pack via Wave dès 1 500 FCFA pour débloquer l'ensemble des fonctionnalités IA.
                  </p>
                  <button
                    onClick={() => setIsWaveModalOpen(true)}
                    className="mt-2 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Recharger des crédits
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Lot / Pack</th>
                        <th className="py-3 px-4">Origine</th>
                        <th className="py-3 px-4">Crédits restants</th>
                        <th className="py-3 px-4">Date d'expiration</th>
                        <th className="py-3 px-4 text-right">Progression</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {batches.map((batch) => {
                        const pack = batch.packCode ? CREDIT_PACKS[batch.packCode] : null;
                        const pct = batch.creditsInitial > 0
                          ? Math.round((batch.creditsRemaining / batch.creditsInitial) * 100)
                          : 0;
                        return (
                          <tr key={batch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                              {pack?.label || batch.packCode || "Crédits"}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-500 capitalize">
                              {batch.source === "offert" ? "🎁 Cadeau d'inscription" : "💳 Achat Wave"}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {batch.creditsRemaining}
                              </span>
                              <span className="text-xs text-slate-400"> / {batch.creditsInitial}</span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                              {formatExpiry(batch.expiresAt)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-500">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Ledger History */}
          {activeTab === "ledger" && (
            <div className="p-6">
              {ledger.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aucun mouvement enregistré pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4 text-center">Variation</th>
                        <th className="py-3 px-4 text-right">Solde après</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ledger.map((entry) => {
                        const isPositive = entry.delta > 0;
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                              {new Date(entry.createdAt).toLocaleString("fr-FR")}
                            </td>
                            <td className="py-3 px-4 text-xs font-medium text-slate-800 dark:text-slate-200">
                              {getActionLabel(entry.action)}
                              {entry.ref && (
                                 <span className="block text-[10px] font-mono text-slate-400">
                                   Réf: {entry.ref}
                                 </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${
                                  isPositive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                }`}
                              >
                                {isPositive ? (
                                  <>
                                    <ArrowUpRight className="w-3 h-3" />
                                    +{entry.delta}
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownLeft className="w-3 h-3" />
                                    {entry.delta}
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-xs text-slate-700 dark:text-slate-300">
                              {entry.balanceAfter} crédits
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Payment Claims */}
          {activeTab === "claims" && (
            <div className="p-6">
              {claims.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Aucune réclamation de paiement en cours
                  </p>
                  <p className="text-xs text-slate-500">
                    Lorsque vous effectuez un paiement via Wave, signalez-le pour recevoir vos crédits rapidement.
                  </p>
                  <button
                    onClick={() => setIsWaveModalOpen(true)}
                    className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition"
                  >
                    Effectuer une recharge Wave
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {claims.map((claim) => {
                    const pack = claim.packCode ? CREDIT_PACKS[claim.packCode] : null;
                    const isPending = claim.status === "pending";
                    const isApproved = claim.status === "approved";
                    const isRejected = claim.status === "rejected";

                    return (
                      <div
                        key={claim.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {pack?.label || claim.packCode}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({(claim.amountFcfa || 0).toLocaleString("fr-FR")} FCFA)
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Réf. Wave : <span className="font-mono text-slate-700 dark:text-slate-300">{claim.waveReference}</span> · Soumis le {new Date(claim.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                          {isRejected && claim.rejectionReason && (
                            <p className="text-xs text-rose-500 font-medium">
                              Motif du rejet : {claim.rejectionReason}
                            </p>
                          )}
                        </div>

                        <div>
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              En attente de validation
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Validé & Crédité
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejeté
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Wave Claim */}
      <WavePaymentClaimModal
        isOpen={isWaveModalOpen}
        onClose={() => setIsWaveModalOpen(false)}
        onClaimSubmitted={() => {
          fetchData();
        }}
      />
    </div>
  );
}
