"use client";

import React, { useState, useEffect } from "react";
import {
  Zap, Clock, CheckCircle2, XCircle, Search, RefreshCw,
  ExternalLink, Copy, Check, Eye, AlertCircle, X, ShieldCheck
} from "lucide-react";
import { PaymentClaim } from "@/lib/types";
import { CREDIT_PACKS } from "@/config/payments";

interface AdminWaveClaimsTabProps {
  onNotify?: (message: string, type: "success" | "error" | "info") => void;
}

export const AdminWaveClaimsTab: React.FC<AdminWaveClaimsTabProps> = ({ onNotify }) => {
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [zoomScreenshotUrl, setZoomScreenshotUrl] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectingClaim, setRejectingClaim] = useState<PaymentClaim | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("Référence Wave introuvable ou montant incorrect");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment-claims?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok && data.claims) {
        setClaims(data.claims);
      } else {
        onNotify?.(data.message || "Erreur chargement réclamations", "error");
      }
    } catch (err: any) {
      onNotify?.(err.message || "Erreur de connexion", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  // Fermeture des modales avec la touche Échap
  useEffect(() => {
    if (!zoomScreenshotUrl && !rejectModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomScreenshotUrl) setZoomScreenshotUrl(null);
        if (rejectModalOpen) setRejectModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomScreenshotUrl, rejectModalOpen]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (claim: PaymentClaim) => {
    if (!confirm(`Valider le paiement de ${(claim.amountFcfa || 0).toLocaleString("fr-FR")} FCFA et créditer l'utilisateur ?`)) {
      return;
    }

    setActionLoadingId(claim.id);
    try {
      const res = await fetch("/api/admin/payment-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          claimId: claim.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotify?.(data.message || "Paiement validé avec succès !", "success");
        // Mise à jour locale du statut
        setClaims((prev) =>
          prev.map((c) => (c.id === claim.id ? { ...c, status: "approved" } : c))
        );
      } else {
        onNotify?.(data.message || "Échec de validation", "error");
      }
    } catch (err: any) {
      onNotify?.(err.message || "Erreur réseau", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingClaim) return;

    setActionLoadingId(rejectingClaim.id);
    try {
      const res = await fetch("/api/admin/payment-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          claimId: rejectingClaim.id,
          reason: rejectReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotify?.("Demande rejetée.", "info");
        setClaims((prev) =>
          prev.map((c) =>
            c.id === rejectingClaim.id
              ? { ...c, status: "rejected", rejectionReason: rejectReason.trim() }
              : c
          )
        );
        setRejectModalOpen(false);
        setRejectingClaim(null);
      } else {
        onNotify?.(data.message || "Échec du rejet", "error");
      }
    } catch (err: any) {
      onNotify?.(err.message || "Erreur réseau", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtrage par recherche
  const filteredClaims = claims.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.waveReference && c.waveReference.toLowerCase().includes(q)) ||
      (c.packCode && c.packCode.toLowerCase().includes(q)) ||
      (c.userEmail && c.userEmail.toLowerCase().includes(q))
    );
  });

  const pendingCount = claims.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            Réclamations de Paiement Wave & Recharges de Crédits
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Vérifiez les références Wave et validez en 1 clic l'attribution des packs de crédits aux utilisateurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchClaims}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "pending"
                ? "bg-amber-500 text-slate-950 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            En attente ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "approved"
                ? "bg-emerald-600 text-white font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Validées
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "rejected"
                ? "bg-rose-600 text-white font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejetées
          </button>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-blue-600 text-white font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Toutes
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher réf. Wave, pack, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Content: Cards View (Responsive for Mobile & Desktop) */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
          Chargement des réclamations Wave...
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Aucune réclamation trouvée
          </p>
          <p className="text-xs text-slate-500">
            Toutes les demandes de cette catégorie sont traitées.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClaims.map((claim) => {
            const pack = claim.packCode ? CREDIT_PACKS[claim.packCode] : null;
            const isPending = claim.status === "pending";
            const isApproved = claim.status === "approved";
            const isRejected = claim.status === "rejected";
            const isActionBusy = actionLoadingId === claim.id;

            return (
              <div
                key={claim.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  {/* Top line: pack and status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-sm text-white flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {pack?.label || claim.packCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isPending
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : isApproved
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {isPending ? "En attente" : isApproved ? "Validé" : "Rejeté"}
                    </span>
                  </div>

                  {/* Amount & Credits */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Montant payé
                      </span>
                      <span className="text-lg font-black text-white">
                        {(claim.amountFcfa || 0).toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Crédits à ajouter
                      </span>
                      <span className="text-sm font-bold text-blue-400">
                        +{pack?.credits || 0} crédits
                      </span>
                    </div>
                  </div>

                  {/* User info */}
                  <div className="space-y-1 text-xs">
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Utilisateur :</span>
                      <span className="font-medium text-slate-200 truncate max-w-[180px]">
                        {claim.userEmail || (claim.userId ? claim.userId.slice(0, 8) : "")}
                      </span>
                    </div>
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Date soumission :</span>
                      <span className="text-slate-300">
                        {new Date(claim.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </div>

                  {/* Wave Reference */}
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Réf Wave
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400 truncate block">
                        {claim.waveReference}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(claim.waveReference, claim.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                      title="Copier la référence Wave"
                    >
                      {copiedId === claim.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Screenshot Thumbnail */}
                  {claim.screenshotUrl && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setZoomScreenshotUrl(claim.screenshotUrl!)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Voir la capture d'écran Wave</span>
                      </button>
                    </div>
                  )}

                  {/* Rejection reason if any */}
                  {isRejected && claim.rejectionReason && (
                    <div className="p-2.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-xs text-rose-300">
                      <strong>Motif de rejet :</strong> {claim.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Actions: 1-Click Approve / Reject */}
                {isPending && (
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isActionBusy}
                      onClick={() => handleApprove(claim)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
                    >
                      {isActionBusy ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Valider & Créditer</span>
                    </button>

                    <button
                      type="button"
                      disabled={isActionBusy}
                      onClick={() => {
                        setRejectingClaim(claim);
                        setRejectReason("Référence Wave introuvable ou montant incorrect");
                        setRejectModalOpen(true);
                      }}
                      className="py-2 px-3 rounded-xl border border-rose-500/40 hover:bg-rose-500/10 text-rose-400 font-semibold text-xs flex items-center justify-center gap-1 transition disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rejeter</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Zoom Screenshot */}
      {zoomScreenshotUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setZoomScreenshotUrl(null);
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setZoomScreenshotUrl(null);
          }}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-800 p-2 overflow-hidden shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomScreenshotUrl(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomScreenshotUrl}
              alt="Preuve paiement Wave"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Modal Rejet */}
      {rejectModalOpen && rejectingClaim && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectModalOpen(false);
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRejectModalOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                Rejeter la réclamation Wave
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <p className="text-xs text-slate-300">
                Vous vous apprêtez à rejeter la réclamation de{" "}
                <strong>{(rejectingClaim.amountFcfa || 0).toLocaleString("fr-FR")} FCFA</strong> (Réf:{" "}
                <span className="font-mono text-amber-400">{rejectingClaim.waveReference}</span>).
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Motif du rejet (visible par l'utilisateur) :
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Confirmer le Rejet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
