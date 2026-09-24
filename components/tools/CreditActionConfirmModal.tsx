"use client";

import React, { useEffect } from "react";
import { Zap, AlertCircle, CheckCircle, ShieldCheck, ArrowRight, X, Sparkles } from "lucide-react";
import Link from "next/link";

interface CreditActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  actionCost: number;
  actionLabel: string;
  actionDescription?: string;
  currentBalance: number;
  onOpenRecharge?: () => void;
  isGenerating?: boolean;
}

export const CreditActionConfirmModal: React.FC<CreditActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionCost,
  actionLabel,
  actionDescription,
  currentBalance,
  onOpenRecharge,
  isGenerating = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasSufficient = currentBalance >= actionCost;
  const balanceAfter = Math.max(0, currentBalance - actionCost);
  const missingCredits = actionCost - currentBalance;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirmation d'action IA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {actionLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {actionDescription && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {actionDescription}
            </p>
          )}

          {/* Balance breakdown card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Coût de l'action IA :</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Zap className="w-4 h-4 fill-amber-500" />
                {actionCost} {actionCost > 1 ? "crédits" : "crédit"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Votre solde actuel :</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {currentBalance} {currentBalance > 1 ? "crédits" : "crédit"}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Solde après opération :</span>
              <span
                className={`font-bold ${
                  hasSufficient
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-500"
                }`}
              >
                {hasSufficient ? `${balanceAfter} crédits` : "Insuffisant"}
              </span>
            </div>
          </div>

          {/* Case 1: Insufficient Balance */}
          {!hasSufficient ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <p className="font-semibold">
                    Crédits insuffisants (il vous manque {missingCredits} {missingCredits > 1 ? "crédits" : "crédit"})
                  </p>
                  <p>
                    Rechargez un pack pour continuer à profiter de l'IA.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {onOpenRecharge ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRecharge();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    Recharger mes crédits via Wave
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    href="/tarifs"
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    Voir les packs de crédits (dès 1 500 F)
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition"
                >
                  Continuer l'édition manuelle (100% gratuite)
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                💡 L'édition manuelle et les exports PDF & Word restent entièrement gratuits et sans filigrane.
              </p>
            </div>
          ) : (
            /* Case 2: Sufficient Balance */
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Garantie sérénité : aucun débit en cas d'erreur technique de l'IA.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isGenerating}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Confirmer ({actionCost} {actionCost > 1 ? "crédits" : "crédit"})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
