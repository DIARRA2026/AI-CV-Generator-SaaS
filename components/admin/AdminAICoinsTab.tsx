"use client";

import React, { useState, useEffect } from "react";
import {
  Coins,
  Search,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Lock,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from "lucide-react";
import { CreditCost } from "@/lib/types";

interface AdminAICoinsTabProps {
  onNotify?: (message: string, type: "success" | "error" | "info") => void;
}

interface UserWalletRow {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  availableCredits: number;
  reservedCredits: number;
  lifetimeEarned: number;
  lifetimePurchased: number;
  lifetimeConsumed: number;
  updatedAt: string;
}

export const AdminAICoinsTab: React.FC<AdminAICoinsTabProps> = ({ onNotify }) => {
  const [wallets, setWallets] = useState<UserWalletRow[]>([]);
  const [costs, setCosts] = useState<CreditCost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [stats, setStats] = useState({
    totalWallets: 0,
    totalAvailable: 0,
    totalReserved: 0,
    totalPurchased: 0,
    totalConsumed: 0,
  });

  // Modal Ajustement
  const [adjustModalOpen, setAdjustModalOpen] = useState<boolean>(false);
  const [selectedWallet, setSelectedWallet] = useState<UserWalletRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [adjustReason, setAdjustReason] = useState<string>("Geste commercial administrateur");
  const [adjustSubmitting, setAdjustSubmitting] = useState<boolean>(false);

  // Modal Modification Tarif
  const [costModalOpen, setCostModalOpen] = useState<boolean>(false);
  const [selectedCost, setSelectedCost] = useState<CreditCost | null>(null);
  const [editCostValue, setEditCostValue] = useState<number>(20);
  const [costSubmitting, setCostSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [credRes, costsRes] = await Promise.all([
        fetch("/api/admin/credits"),
        fetch("/api/admin/credits/costs"),
      ]);

      if (credRes.ok) {
        const credData = await credRes.json();
        setWallets(credData.wallets || []);
        if (credData.stats) setStats(credData.stats);
      } else {
        onNotify?.("Erreur chargement portefeuilles", "error");
      }

      if (costsRes.ok) {
        const costData = await costsRes.json();
        setCosts(costData.costs || []);
      }
    } catch (err: any) {
      onNotify?.(err.message || "Erreur de connexion", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdjust = (w: UserWalletRow) => {
    setSelectedWallet(w);
    setAdjustAmount(50);
    setAdjustType("add");
    setAdjustReason("Geste commercial administrateur");
    setAdjustModalOpen(true);
  };

  const handleOpenEditCost = (c: CreditCost) => {
    setSelectedCost(c);
    setEditCostValue(c.cost);
    setCostModalOpen(true);
  };

  const submitAdjust = async () => {
    if (!selectedWallet) return;
    if (!adjustReason.trim()) {
      onNotify?.("Un motif d'ajustement est obligatoire.", "error");
      return;
    }

    const finalAmount = adjustType === "add" ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);
    setAdjustSubmitting(true);

    try {
      const res = await fetch("/api/admin/credits/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedWallet.userId,
          amount: finalAmount,
          reason: adjustReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotify?.(data.message || "Ajustement appliqué avec succès", "success");
        setAdjustModalOpen(false);
        fetchData();
      } else {
        onNotify?.(data.message || data.error || "Échec de l'ajustement", "error");
      }
    } catch (err: any) {
      onNotify?.(err.message || "Erreur lors de l'enregistrement", "error");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const submitCostUpdate = async () => {
    if (!selectedCost) return;
    setCostSubmitting(true);

    try {
      const res = await fetch("/api/admin/credits/costs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureKey: selectedCost.featureKey,
          cost: editCostValue,
          name: selectedCost.name,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotify?.(data.message || "Tarif mis à jour avec succès", "success");
        setCostModalOpen(false);
        fetchData();
      } else {
        onNotify?.(data.message || "Échec de mise à jour du tarif", "error");
      }
    } catch (err: any) {
      onNotify?.(err.message || "Erreur lors de la mise à jour", "error");
    } finally {
      setCostSubmitting(false);
    }
  };

  const filteredWallets = wallets.filter((w) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      w.email.toLowerCase().includes(q) ||
      w.fullName.toLowerCase().includes(q) ||
      w.userId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* 1. KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>En Circulation</span>
            <span className="text-base">💎</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.totalAvailable.toLocaleString("fr-FR")}
          </div>
          <div className="text-[11px] text-slate-400">AI Coins disponibles utilisateurs</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>En Réservation</span>
            <span className="text-base text-amber-500">⚡</span>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats.totalReserved.toLocaleString("fr-FR")}
          </div>
          <div className="text-[11px] text-slate-400">Générations IA en cours de traitement</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Cumul Acheté</span>
            <span className="text-base text-emerald-500">💰</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats.totalPurchased.toLocaleString("fr-FR")}
          </div>
          <div className="text-[11px] text-slate-400">Total des AI Coins monétisés</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Cumul Consommé</span>
            <span className="text-base text-blue-500">🔥</span>
          </div>
          <div className="text-2xl font-black text-blue-600">
            {stats.totalConsumed.toLocaleString("fr-FR")}
          </div>
          <div className="text-[11px] text-slate-400">Crédits convertis en calculs IA</div>
        </div>
      </div>

      {/* 2. Tableau des Portefeuilles Utilisateurs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Portefeuilles Utilisateurs ({filteredWallets.length})
            </h3>
            <p className="text-xs text-slate-500">
              Supervision des soldes réels et ajustements administratifs consignés au ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-64"
              />
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {filteredWallets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Aucun portefeuille trouvé pour cette recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Utilisateur</th>
                  <th className="py-3.5 px-6 text-right">Disponible</th>
                  <th className="py-3.5 px-6 text-right">Réservé</th>
                  <th className="py-3.5 px-6 text-right">Acheté</th>
                  <th className="py-3.5 px-6 text-right">Consommé</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWallets.map((w) => (
                  <tr key={w.id || w.userId} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{w.fullName || w.email}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{w.email}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600 text-sm">
                      {w.availableCredits.toLocaleString("fr-FR")} Coins
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-amber-600">
                      {w.reservedCredits} Coins
                    </td>
                    <td className="py-4 px-6 text-right text-slate-600">
                      {w.lifetimePurchased} Coins
                    </td>
                    <td className="py-4 px-6 text-right text-slate-600">
                      {w.lifetimeConsumed} Coins
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenAdjust(w)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                      >
                        Ajuster
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Barème Dynamique des Fonctionnalités IA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Barème & Administration des Prix IA
            </h3>
            <p className="text-xs text-slate-500">
              Modifiez le coût en AI Coins d'une fonctionnalité en temps réel sans redéploiement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {costs.map((c) => (
            <div
              key={c.id || c.featureKey}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="text-xs font-bold text-slate-700">{c.name}</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {c.cost} <span className="text-xs font-bold text-slate-500">Coins</span>
                </div>
                <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate">{c.featureKey}</div>
              </div>

              <button
                onClick={() => handleOpenEditCost(c)}
                className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                Modifier le tarif
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL : Ajustement Administratif */}
      {adjustModalOpen && selectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Ajustement Manuel de Solde
              </h3>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 text-xs space-y-1">
              <div className="text-slate-500">Compte cible :</div>
              <div className="font-bold text-slate-900">{selectedWallet.email}</div>
              <div className="text-slate-500 pt-1">
                Solde actuel : <strong>{selectedWallet.availableCredits} AI Coins</strong>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      adjustType === "add"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Créditer (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("deduct")}
                    className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      adjustType === "deduct"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    Débiter (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant (AI Coins)</label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Motif obligatoire <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Geste commercial suite incident IA, bonus fidélité..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Ce motif sera consigné de façon immuable dans le grand livre (credit_transactions).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitAdjust}
                disabled={adjustSubmitting}
                className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
              >
                {adjustSubmitting ? "Enregistrement..." : "Confirmer l'ajustement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Modification du coût d'une fonctionnalité */}
      {costModalOpen && selectedCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                Modifier le tarif
              </h3>
              <button onClick={() => setCostModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-700">{selectedCost.name}</div>
              <div className="font-mono text-[10px] text-slate-400">{selectedCost.featureKey}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau coût (AI Coins)</label>
              <input
                type="number"
                min="0"
                value={editCostValue}
                onChange={(e) => setEditCostValue(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-black focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCostModalOpen(false)}
                className="w-1/2 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={submitCostUpdate}
                disabled={costSubmitting}
                className="w-1/2 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition disabled:opacity-50"
              >
                {costSubmitting ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
