"use client";

import React, { useState } from "react";
import {
  X, ExternalLink, CheckCircle2, AlertCircle, Upload,
  Zap, Clock, ShieldCheck, Image as ImageIcon, Trash2
} from "lucide-react";
import { CREDIT_PACKS, CREDIT_PACKS_ARRAY, getWaveLink } from "@/config/payments";
import { compressImage } from "@/lib/image-utils";

interface WavePaymentClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPackCode?: string;
  onClaimSubmitted?: () => void;
}

export const WavePaymentClaimModal: React.FC<WavePaymentClaimModalProps> = ({
  isOpen,
  onClose,
  defaultPackCode = "evolution",
  onClaimSubmitted,
}) => {
  const [selectedPackCode, setSelectedPackCode] = useState<string>(defaultPackCode);
  const [waveReference, setWaveReference] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>("");
  const [screenshotName, setScreenshotName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  // Filtrer les packs payants uniquement
  const paidPacks = CREDIT_PACKS_ARRAY.filter((p) => p.priceFcfa > 0);
  const currentPack = (CREDIT_PACKS as Record<string, any>)[selectedPackCode] || paidPacks[0];
  const waveUrl = currentPack ? getWaveLink(currentPack.code) || "" : "";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Veuillez sélectionner un fichier image valide (JPG, PNG).");
      return;
    }

    try {
      setErrorMessage(null);
      const compressed = await compressImage(file, 800, 800, 0.8);
      setScreenshotDataUrl(compressed);
      setScreenshotName(file.name);
    } catch {
      setErrorMessage("Impossible de lire l'image. Veuillez réessayer.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanRef = waveReference.trim();
    if (!cleanRef || cleanRef.length < 4) {
      setErrorMessage("Veuillez renseigner votre ID de transaction Wave ou numéro expéditeur.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payment-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packCode: currentPack.code,
          pack_code: currentPack.code,
          amountFcfa: currentPack.priceFcfa,
          waveReference: cleanRef,
          wave_reference: cleanRef,
          screenshotUrl: screenshotDataUrl || null,
          screenshot_url: screenshotDataUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Erreur lors de l'enregistrement de votre demande.");
      }

      setIsSubmittedSuccess(true);
      if (onClaimSubmitted) onClaimSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl">
              🌊
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Recharge de crédits Wave
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paiement direct 100% sécurisé via Wave Côte d'Ivoire
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSubmittedSuccess ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                Paiement reçu et en cours de validation !
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Votre transaction pour le pack <strong>{currentPack.label}</strong> ({currentPack.credits} crédits) a bien été enregistrée.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-left text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Pack :</span>
                <span className="font-semibold text-slate-900 dark:text-white">{currentPack.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant :</span>
                <span className="font-semibold text-slate-900 dark:text-white">{(currentPack.priceFcfa || 0).toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Référence Wave :</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{waveReference}</span>
              </div>
              <div className="flex justify-between">
                <span>Délai d'activation :</span>
                <span className="font-semibold text-emerald-600">Généralement en moins de 15 min</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition"
            >
              Fermer & Retourner au tableau de bord
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Step 1: Select Pack */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Choisissez votre pack de crédits
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paidPacks.map((pack) => {
                  const isSelected = selectedPackCode === pack.code;
                  return (
                    <button
                      key={pack.code}
                      type="button"
                      onClick={() => setSelectedPackCode(pack.code)}
                      className={`relative p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/30 dark:ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {pack.recommended && (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500 text-white">
                          RECOMMANDÉ
                        </span>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {pack.label}
                        </div>
                        <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1">
                          {pack.credits} <span className="text-[10px] font-medium">crédits</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {(pack.priceFcfa || 0).toLocaleString("fr-FR")} F
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Pay on Wave */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Effectuez le paiement de {(currentPack.priceFcfa || 0).toLocaleString("fr-FR")} FCFA sur Wave
              </label>
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs text-sky-800 dark:text-sky-200 space-y-1">
                    <p className="font-semibold">
                      Lien de paiement Wave officiel
                    </p>
                    <p className="text-[11px] text-sky-700 dark:text-sky-300">
                      Montant exact : <strong>{(currentPack.priceFcfa || 0).toLocaleString("fr-FR")} FCFA</strong>. Ouvrez l'application Wave ou scannez le QR code.
                    </p>
                  </div>
                </div>

                <a
                  href={waveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <span>Payer {(currentPack.priceFcfa || 0).toLocaleString("fr-FR")} FCFA avec Wave</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Step 3: Transaction Reference */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Entrez votre référence de transaction Wave
              </label>
              <input
                type="text"
                required
                value={waveReference}
                onChange={(e) => setWaveReference(e.target.value)}
                placeholder="Ex: TR-12345678 ou numéro expéditeur Wave"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Vous trouverez cette référence dans votre SMS de confirmation ou l'historique Wave.
              </p>
            </div>

            {/* Step 4: Screenshot Upload (Optional) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>4. Capture d'écran Wave (Recommandé)</span>
                <span className="text-[10px] lowercase font-normal text-slate-400">Optionnel</span>
              </label>

              {screenshotDataUrl ? (
                <div className="relative p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {screenshotName || "Capture jointe"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotDataUrl("");
                      setScreenshotName("");
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-center text-center transition">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ajouter la capture du reçu Wave
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG (optimisé automatiquement)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement de votre réclamation...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    Valider ma recharge ({currentPack.credits} crédits)
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Paiement sécurisé · Activation rapide</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
