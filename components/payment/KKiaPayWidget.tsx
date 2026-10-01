"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ArrowRight,
  X,
  CreditCard,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { StorageManager } from "@/lib/storage";
import { getCreditPack } from "@/config/payments";

interface KKiaPayWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  onSuccess?: (planId: string) => void;
  onNeedAuth?: (planId: string) => void;
}

declare global {
  interface Window {
    openKkiapayWidget?: (options: any) => void;
    addSuccessListener?: (callback: (response: { transactionId: string }) => void) => void;
    addFailedListener?: (callback: (error: any) => void) => void;
    kkiapayScriptLoaded?: boolean;
  }
}

export const KKiaPayWidgetModal: React.FC<KKiaPayWidgetModalProps> = ({
  isOpen,
  onClose,
  planId,
  onSuccess,
  onNeedAuth,
}) => {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "ordering" | "widget_opened" | "verifying" | "polling" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [pollCountdown, setPollCountdown] = useState<number>(180); // 3 minutes max

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scriptLoadedRef = useRef<boolean>(false);

  const pack = getCreditPack(planId) || getCreditPack("pro");

  // 1. Chargement dynamique asynchrone du script officiel KKiaPay CDN k.js
  useEffect(() => {
    if (typeof window === "undefined" || window.openKkiapayWidget) {
      scriptLoadedRef.current = true;
      return;
    }

    const existingScript = document.getElementById("kkiapay-cdn-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "kkiapay-cdn-script";
      script.src = "https://cdn.kkiapay.me/k.js";
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
      };
      document.body.appendChild(script);
    }
  }, []);

  // Nettoyage de l'intervalle de polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Reset état à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setStep("idle");
      setErrorMessage(null);
      setActiveOrderId(null);
      stopPolling();
    }
  }, [isOpen, stopPolling]);

  // Gestion de la touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "verifying" && step !== "ordering") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, onClose]);

  // 2. Démarrage du polling pour les paiements Mobile Money lents (Étape 4)
  const startPolling = useCallback((orderId: string) => {
    setStep("polling");
    setPollCountdown(180);
    stopPolling();

    const startTime = Date.now();
    const maxDuration = 180 * 1000; // 3 minutes

    pollingIntervalRef.current = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const remainingSec = Math.max(0, Math.floor((maxDuration - elapsed) / 1000));
      setPollCountdown(remainingSec);

      if (elapsed >= maxDuration) {
        stopPolling();
        setStep("idle");
        setErrorMessage(
          "Le paiement est toujours en cours de validation par votre opérateur Mobile Money. Votre accès s'activera automatiquement dès la confirmation."
        );
        return;
      }

      try {
        const res = await fetch(`/api/payments/kkiapay/orders/${orderId}`);
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.order?.status === "paid") {
          stopPolling();
          setConfirmedPlan(data.order.planId);
          setExpiresAt(data.order.expiresAt);
          setStep("success");

          try {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          } catch {}

          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("moncv_credits_updated"));
            window.dispatchEvent(new Event("storage"));
          }
        } else if (data.order?.status === "failed") {
          stopPolling();
          setStep("failed");
          setErrorMessage("La transaction a été refusée ou a échoué.");
        }
      } catch (pollErr) {
        console.warn("[KKiaPay polling] Erreur consultation commande:", pollErr);
      }
    }, 5000); // Polling toutes les 5 secondes
  }, [stopPolling]);

  // 3. Vérification serveur suite à l'événement de succès du widget
  const handleVerifyTransaction = useCallback(
    async (orderId: string, transactionId: string) => {
      setStep("verifying");
      setErrorMessage(null);

      try {
        const res = await fetch("/api/payments/kkiapay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, transactionId }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          // Paiement confirmé avec succès par le serveur !
          setConfirmedPlan(data.plan || planId);
          setExpiresAt(data.expiresAt || null);
          setStep("success");

          // Synchronisation locale pour fluidité UI
          StorageManager.setPlanTier(data.plan || planId, {
            status: "active",
            amount: pack?.prixFcfa || 2500,
            currency: "FCFA",
            paymentMethod: "KKiaPay (Mobile Money / Carte)",
            transactionRef: transactionId,
          });
          StorageManager.clearPendingCheckoutPlan();

          try {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
          } catch {}

          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("moncv_credits_updated"));
            window.dispatchEvent(new Event("storage"));
          }

          if (onSuccess) onSuccess(data.plan || planId);
        } else if (data.status === "pending") {
          // Paiement asynchrone / lent : lancer le polling
          startPolling(orderId);
        } else {
          setStep("failed");
          setErrorMessage(data.message || "Le paiement n'a pas pu être confirmé par le serveur.");
        }
      } catch (err: any) {
        console.error("[handleVerifyTransaction] Erreur:", err);
        // En cas d'erreur de communication réseau : basculer en polling doux
        startPolling(orderId);
      }
    },
    [planId, pack, onSuccess, startPolling]
  );

  // 4. Lancement du paiement : Création commande serveur + Ouverture widget
  const handleStartPayment = async () => {
    setErrorMessage(null);

    const isLogged = StorageManager.isLoggedIn();
    const currentUser = StorageManager.getUser();

    if (!isLogged || !currentUser) {
      if (onNeedAuth) {
        onNeedAuth(planId);
      } else {
        router.push(`/login?redirect=/tarifs&plan=${planId}`);
      }
      return;
    }

    setStep("ordering");

    try {
      // Étape A : Création de la commande côté serveur (Règle 1 : le client n'envoie pas le prix)
      const orderRes = await fetch("/api/payments/kkiapay/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.message || "Impossible de créer la commande de paiement.");
      }

      const orderId = orderData.orderId;
      setActiveOrderId(orderId);

      const publicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY?.trim() || "";
      const isSandbox = (process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX || "").toLowerCase() === "true";

      // Étape B : Configuration des listeners d'événements KKiaPay
      if (typeof window !== "undefined" && window.openKkiapayWidget) {
        // Enregistrement des listeners officiels
        if (window.addSuccessListener) {
          window.addSuccessListener((response) => {
            if (response?.transactionId) {
              handleVerifyTransaction(orderId, response.transactionId);
            }
          });
        }

        if (window.addFailedListener) {
          window.addFailedListener((error) => {
            console.warn("[KKiaPay widget] Paiement échoué:", error);
            setStep("failed");
            setErrorMessage("Le paiement a été interrompu ou refusé par votre opérateur.");
          });
        }

        setStep("widget_opened");

        // Étape C : Ouverture du widget KKiaPay avec les paramètres officiels
        window.openKkiapayWidget({
          amount: orderData.amount,
          api_key: publicKey,
          key: publicKey, // compatibilité script k.js
          sandbox: isSandbox,
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          name: `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || undefined,
          partnerId: orderId,
          data: orderId,
          theme: "#2563eb",
        });
      } else {
        throw new Error("Le module de paiement KKiaPay n'a pas pu être chargé. Veuillez rafraîchir la page.");
      }
    } catch (err: any) {
      console.error("[KKiaPayWidget] Erreur:", err);
      setStep("failed");
      setErrorMessage(err.message || "Une erreur est survenue lors de l'initialisation du paiement.");
    }
  };

  const handleFinishAndRedirect = () => {
    onClose();
    router.push(`/dashboard?payment=success&plan=${confirmedPlan || planId}`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "verifying" && step !== "ordering") {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bande supérieure de prestige */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl">
              💳
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Paiement Sécurisé KKiaPay
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mobile Money (Wave, Orange, MTN, Moov) &amp; Carte Bancaire
              </p>
            </div>
          </div>
          {step !== "verifying" && step !== "ordering" && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Corps du modal selon l'étape */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Étape : SUCCÈS CONFIRMÉ */}
          {step === "success" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Paiement Confirmé !
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Votre abonnement pour la formule <strong>{pack?.label}</strong> est maintenant actif.
                </p>
              </div>

              {expiresAt && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    Valable 30 jours jusqu&apos;au{" "}
                    <strong>{new Date(expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong>
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleFinishAndRedirect}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Accéder à mon tableau de bord</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Étape : VÉRIFICATION SERVEUR EN COURS */}
          {step === "verifying" && (
            <div className="text-center space-y-4 py-6">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Vérification sécurisée en cours...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Le serveur authentifie votre transaction auprès de KKiaPay avant d&apos;activer votre abonnement.
                </p>
              </div>
            </div>
          )}

          {/* Étape : POLLING PAIEMENT MOBILE MONEY LENT */}
          {step === "polling" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Paiement en attente de confirmation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Votre opérateur Mobile Money traite votre demande. Détection automatique en cours ({pollCountdown}s restantes)...
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-500">
                Vous pouvez fermer cet écran en toute sécurité : dès validation de l&apos;opérateur, votre accès sera activé automatiquement.
              </div>
            </div>
          )}

          {/* Étape : VUE COMMANDE NORMALE OU ÉCHEC */}
          {step !== "success" && step !== "verifying" && step !== "polling" && (
            <div className="space-y-5">
              {/* Récapitulatif de la formule */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Formule choisie</span>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">{pack?.label}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Durée 30 jours</span>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {(pack?.prixFcfa || 0).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{pack?.credits} crédits IA activés immédiatement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Exports PDF &amp; Word illimités sans filigrane</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Facture normalisée OHADA mise à disposition</span>
                  </div>
                </div>
              </div>

              {/* Message d'erreur s'il y a lieu */}
              {errorMessage && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Badges de sécurité */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Paiement sécurisé SSL</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Zéro prélèvement automatique</span>
                </div>
              </div>

              {/* Bouton Payer maintenant */}
              <button
                type="button"
                disabled={step === "ordering"}
                onClick={handleStartPayment}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {step === "ordering" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Génération de la commande...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Payer {(pack?.prixFcfa || 0).toLocaleString("fr-FR")} FCFA avec KKiaPay</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
