"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { InvoiceModal } from "@/components/tools/InvoiceModal";
import {
  CreditCard, CheckCircle2, XCircle, Clock, Search, Filter,
  Eye, Check, X, ShieldAlert, ArrowLeft, FileText, AlertCircle, RefreshCw
} from "lucide-react";
import { Invoice } from "@/lib/types";

export default function AdminPaiementsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "en_attente" | "valide" | "rejete">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalClaimId, setRejectModalClaimId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment-claims?statut=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      }
    } catch (err) {
      console.error("Erreur chargement déclarations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [filter]);

  const handleValidate = async (claimId: string) => {
    if (!confirm("Confirmer la validation de ce paiement et la livraison immédiate des crédits ?")) return;
    setActionLoading(claimId);
    try {
      const res = await fetch("/api/admin/payment-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, action: "valider" }),
      });
      if (res.ok) {
        await fetchClaims();
      } else {
        const data = await res.json();
        alert(data.message || "Erreur de validation");
      }
    } catch (err) {
      console.error("Erreur validation:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalClaimId) return;
    setActionLoading(rejectModalClaimId);
    try {
      const res = await fetch("/api/admin/payment-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: rejectModalClaimId,
          action: "rejeter",
          motif: rejectReason || "Référence introuvable ou montant incorrect",
        }),
      });
      if (res.ok) {
        setRejectModalClaimId(null);
        setRejectReason("");
        await fetchClaims();
      }
    } catch (err) {
      console.error("Erreur rejet:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const viewInvoice = async (claimId: string) => {
    try {
      const res = await fetch(`/api/admin/payment-claims`);
      // Trouver la facture dans Supabase ou via RPC
      const claim = claims.find((c) => c.id === claimId);
      if (claim) {
        setSelectedInvoice({
          id: claim.id,
          numero: `INV-2026-${claim.id.substring(0, 5).toUpperCase()}`,
          claimId: claim.id,
          compteId: claim.compte_id,
          compteType: claim.compte_type,
          clientNom: claim.telephone ? `Client Wave (${claim.telephone})` : "Client MonCV.ai",
          packSlug: claim.pack_slug,
          packNom: claim.credit_packs?.nom || claim.pack_slug,
          credits: claim.credit_packs?.credits || 0,
          montantFcfa: claim.montant_attendu || 0,
          creeLe: claim.valide_le || claim.cree_le,
        });
        setIsInvoiceOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalVolumeFcfa = claims
    .filter((c) => c.statut === "valide")
    .reduce((sum, c) => sum + (c.montant_attendu || 0), 0);

  const pendingCount = claims.filter((c) => c.statut === "en_attente").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation retour & Titre */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Validation des Paiements Mobile Money
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold animate-pulse">
                    {pendingCount} en attente
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500">
                Paiements manuels Wave & Orange Money à vérifier et valider pour la Côte d Ivoire.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchClaims}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Volume Validé</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                {totalVolumeFcfa.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* Filtres de statut */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {[
            { id: "all", label: "Toutes les déclarations" },
            { id: "en_attente", label: `En attente (${pendingCount})` },
            { id: "valide", label: "Validées" },
            { id: "rejete", label: "Rejetées" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tableau des déclarations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Chargement des déclarations...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="py-20 text-center space-y-2 text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Aucune déclaration trouvée.</p>
              <p>Toutes les demandes de ce filtre sont traitées.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Type & Compte</th>
                    <th className="py-3.5 px-4">Opérateur & Réf.</th>
                    <th className="py-3.5 px-4">Pack & Montant</th>
                    <th className="py-3.5 px-4">Preuve</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {claims.map((c) => {
                    const isPending = c.statut === "en_attente";
                    const isValide = c.statut === "valide";
                    const isRejete = c.statut === "rejete";

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(c.cree_le).toLocaleString("fr-FR")}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              c.compte_type === "org"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            }`}
                          >
                            {c.compte_type === "org" ? "🏢 Organisation" : "👤 Particulier"}
                          </span>
                          <p className="font-mono text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">
                            {c.compte_id}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white capitalize">
                            <span>{c.operateur === "wave" ? "🌊 Wave" : c.operateur === "orange_money" ? "🟠 Orange Money" : c.operateur}</span>
                          </div>
                          {c.telephone && <p className="text-slate-500 font-mono text-[11px]">{c.telephone}</p>}
                          {c.reference_transaction && (
                            <p className="font-mono font-bold text-blue-600 text-[11px]">
                              {c.reference_transaction}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white capitalize">
                            {c.credit_packs?.nom || c.pack_slug}
                          </p>
                          <p className="text-slate-500 font-semibold text-[11px]">
                            {(c.montant_attendu || 0).toLocaleString("fr-FR")} FCFA ({c.credit_packs?.credits || ""} cr.)
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          {c.screenshot_url ? (
                            <button
                              onClick={() => setPreviewImage(c.screenshot_url)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Voir capture
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Aucune capture</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px]">
                              <Clock className="w-3 h-3" />
                              En attente
                            </span>
                          )}
                          {isValide && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              Validé
                            </span>
                          )}
                          {isRejete && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px]">
                              <XCircle className="w-3 h-3" />
                              Rejeté
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleValidate(c.id)}
                                  disabled={actionLoading === c.id}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 transition shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Valider
                                </button>
                                <button
                                  onClick={() => setRejectModalClaimId(c.id)}
                                  disabled={actionLoading === c.id}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1 transition shadow-xs"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Rejeter
                                </button>
                              </>
                            )}

                            {isValide && (
                              <button
                                onClick={() => viewInvoice(c.id)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                Facture OHADA
                              </button>
                            )}
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
      </main>

      {/* Modal Rejet */}
      {rejectModalClaimId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Motif du rejet du paiement
            </h3>
            <p className="text-xs text-slate-500">
              Indiquez la raison qui sera affichée au client dans son espace de suivi.
            </p>
            <textarea
              rows={3}
              placeholder="Ex : Référence Wave introuvable sur le compte marchand, montant reçu insuffisant..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalClaimId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Capture d écran */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <img src={previewImage} alt="Capture Wave" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Modal Facture OHADA */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
