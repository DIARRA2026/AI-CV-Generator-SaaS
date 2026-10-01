"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Upload,
  Zap,
  ShieldCheck,
  Image as ImageIcon,
  Trash2,
  ArrowRight,
  UserCheck,
  Lock,
} from "lucide-react";
import { CREDIT_PACKS, PACKS_B2C_ARRAY, getWaveLink } from "@/config/payments";
import { compressImage } from "@/lib/image-utils";
import { StorageManager } from "@/lib/storage";

interface WavePaymentClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPackCode?: string;
  onClaimSubmitted?: () => void;
  onSuccess?: () => void;
  onNeedAuth?: (packCode: string) => void;
  orgId?: string;
}

export const WavePaymentClaimModal: React.FC<WavePaymentClaimModalProps> = ({
  isOpen,
  onClose,
  defaultPackCode = "evolution",
  onClaimSubmitted,
  onSuccess,
  onNeedAuth,
  orgId,
}) => {
  const router = useRouter();

  // ✅ Tous les hooks AVANT tout return conditionnel (Règles des Hooks React)
  const [selectedPackCode, setSelectedPackCode] = useState<string>(defaultPackCode);
  const [waveReference, setWaveReference] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>("");
  const [screenshotName, setScreenshotName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [isVerifiedImmediate, setIsVerifiedImmediate] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // Synchronisation utilisateur
  useEffect(() => {
    if (isOpen) {
      const u = StorageManager.getUser();
      const logged = StorageManager.isLoggedIn();
      setCurrentUser(u);
      setIsUserLoggedIn(logged);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (defaultPackCode) {
      setSelectedPackCode(defaultPackCode);
    }
  }, [defaultPackCode]);

  useEffect(() => {
    if (!isOpen) {
      setWaveReference("");
      setScreenshotDataUrl("");
      setScreenshotName("");
      setErrorMessage(null);
      setIsSubmittedSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // ✅ Return conditionnel après tous les hooks
  if (!isOpen) return null;

  const paidPacks = PACKS_B2C_ARRAY.filter((p) => p.prixFcfa > 0);
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

    // Contrôle d'authentification préalable
    if (!isUserLoggedIn) {
      setErrorMessage("Veuillez vous inscrire ou vous connecter d'abord afin de lier votre paiement à votre compte.");
      if (onNeedAuth) onNeedAuth(currentPack.code);
      return;
    }

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
          packSlug: currentPack.code,
          packCode: currentPack.code,
          pack_code: currentPack.code,
          amountFcfa: currentPack.prixFcfa,
          referenceTransaction: cleanRef,
          waveReference: cleanRef,
          wave_reference: cleanRef,
          screenshotUrl: screenshotDataUrl || null,
          screenshot_url: screenshotDataUrl || null,
          orgId: orgId || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Votre session a expiré. Veuillez vous reconnecter pour finaliser votre recharge.");
        }
        throw new Error(data.message || data.error || "Erreur lors de l'enregistrement de votre demande.");
      }

      // Synchronisation de l'abonnement localement selon statut vérifié ou en attente
      const isVerified = Boolean(data.verified);
      setIsVerifiedImmediate(isVerified);

      StorageManager.setPlanTier(currentPack.code, {
        status: isVerified ? "active" : "pending",
        amount: currentPack.prixFcfa,
        currency: "FCFA",
        paymentMethod: "Wave Côte d'Ivoire",
        transactionRef: cleanRef,
      });
      StorageManager.clearPendingCheckoutPlan();

      // Déclencher les événements de mise à jour des crédits et de la session
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("moncv_credits_updated"));
        window.dispatchEvent(new Event("storage"));
      }

      setIsSubmittedSuccess(true);
      if (onClaimSubmitted) onClaimSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue. Veuillez réessayer.");
      if (err.message?.includes("session") && onNeedAuth) {
        setTimeout(() => onNeedAuth(currentPack.code), 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndRedirect = () => {
    handleClose();
    if (onSuccess) onSuccess();
    router.push(`/dashboard?payment=success&pack=${currentPack.code}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bande supérieure décorative */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl">
              🌊
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Règlement Sécurisé Wave CI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paiement Mobile Money direct et rattaché à votre compte
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSubmittedSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {isVerifiedImmediate ? "Paiement Confirmé & Crédits Débloqués !" : "Paiement Enregistré & En Attente"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {isVerifiedImmediate
                  ? `Votre transaction pour le pack ${currentPack.label} (${currentPack.credits} crédits) est validée et disponible sur votre compte.`
                  : `Votre déclaration pour le pack ${currentPack.label} (${currentPack.credits} crédits) est enregistrée. Vos crédits seront effectifs dès que Wave confirmera votre transaction.`}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-left text-xs space-y-2 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex justify-between">
                <span>Compte bénéficiaire :</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {currentUser?.email || "Connecté"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Formule sélectionnée :</span>
                <span className="font-semibold text-slate-900 dark:text-white">{currentPack.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Montant réglé :</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(currentPack.prixFcfa || 0).toLocaleString("fr-FR")} FCFA
                </span>
              </div>
              <div className="flex justify-between">
                <span>Référence Wave :</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{waveReference}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span>Statut :</span>
                <span className={isVerifiedImmediate ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-bold text-amber-600 dark:text-amber-400"}>
                  {isVerifiedImmediate ? "Immédiat (Crédits alloués)" : "En attente de confirmation Wave"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishAndRedirect}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Accéder à mon tableau de bord</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Rattachement utilisateur */}
            {!isUserLoggedIn ? (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Connexion requise pour finaliser l&apos;achat</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                  Pour garantir la sécurité et attribuer vos crédits, vous devez être authentifié.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    if (onNeedAuth) onNeedAuth(currentPack.code);
                  }}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>S&apos;inscrire ou se connecter maintenant</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-blue-600 dark:text-blue-400 block">
                    Compte rattaché au paiement
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.email})
                  </span>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
            )}

            {/* Étape 1 : Choix du pack */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Formule sélectionnée
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paidPacks.map((pack) => {
                  const isSelected = selectedPackCode === pack.code;
                  return (
                    <button
                      key={pack.code}
                      type="button"
                      onClick={() => setSelectedPackCode(pack.code)}
                      className={`relative p-2.5 sm:p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-600/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {pack.recommended && (
                        <span className="absolute -top-2 right-1.5 px-1 py-0.5 text-[8.5px] font-bold rounded bg-amber-500 text-white">
                          TOP
                        </span>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {pack.label}
                        </div>
                        <div className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">
                          {pack.credits} <span className="text-[10px] font-medium">crédits</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {(pack.prixFcfa || 0).toLocaleString("fr-FR")} F
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Étape 2 : Paiement Wave */}
            {currentPack && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. Réglez {(currentPack.prixFcfa || 0).toLocaleString("fr-FR")} FCFA sur Wave
                </label>
                <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 rounded-xl space-y-2.5">
                  <p className="text-xs text-sky-800 dark:text-sky-300 leading-snug">
                    Cliquez sur le bouton ci-dessous pour ouvrir l&apos;application Wave ou scanner le QR code officiel du marchand.
                  </p>

                  <a
                    href={waveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <span>Ouvrir Wave CI ({(currentPack.prixFcfa || 0).toLocaleString("fr-FR")} FCFA)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Étape 3 : Référence de transaction */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Référence de transaction Wave
              </label>
              <input
                type="text"
                required
                value={waveReference}
                onChange={(e) => setWaveReference(e.target.value)}
                placeholder="Ex: TR-12345678 ou numéro expéditeur Wave"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Disponible dans le SMS de confirmation ou l&apos;historique Wave.
              </p>
            </div>

            {/* Étape 4 : Capture d'écran optionnelle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>4. Capture du reçu Wave</span>
                <span className="text-[10px] text-slate-400">Optionnel</span>
              </label>

              {screenshotDataUrl ? (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
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
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-2.5 flex items-center justify-center gap-2 text-center transition">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Ajouter le reçu Wave (PNG, JPG)
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

            {/* Message d'erreur */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bouton de validation */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting || !isUserLoggedIn}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Validation de votre paiement...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    Valider ma formule ({currentPack?.credits ?? 0} crédits)
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Rattachement immédiat · Facture OHADA générée</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
