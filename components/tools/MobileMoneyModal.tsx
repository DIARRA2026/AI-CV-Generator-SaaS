"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { X, Check, ShieldCheck, Sparkles, Smartphone, CreditCard, RefreshCw, CheckCircle2, Crown, Globe, FileText, Lock } from "lucide-react";
import { StorageManager } from "@/lib/storage";

interface MobileMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPlan?: "1500" | "2500" | "5000";
}

export const MobileMoneyModal: React.FC<MobileMoneyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPlan = "2500",
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"1500" | "2500" | "5000">(defaultPlan);
  const [paymentMethod, setPaymentMethod] = useState<"wave" | "orange" | "mtn" | "card">("wave");
  const [phoneNumber, setPhoneNumber] = useState("+225 07 ");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Synchroniser l'offre sélectionnée lorsque la boîte de dialogue s'ouvre
  useEffect(() => {
    if (isOpen && defaultPlan) {
      setSelectedPlan(defaultPlan);
    }
  }, [isOpen, defaultPlan]);

  if (!isOpen) return null;

  const plans = [
    {
      id: "1500" as const,
      name: "Pack Essentiel",
      price: "1 500 FCFA",
      badge: "Standard",
      desc: "Téléchargement PDF Haute Définition sans filigrane",
      icon: <FileText className="w-4 h-4 text-blue-600" />,
      highlight: false,
    },
    {
      id: "2500" as const,
      name: "Pack Candidature Pro",
      price: "2 500 FCFA",
      badge: "Recommandé",
      desc: "CV sans filigrane + Lettre IA + Demande d'emploi officielle",
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      highlight: true,
    },
    {
      id: "5000" as const,
      name: "Pack VIP & Portfolio",
      price: "5 000 FCFA",
      badge: "Carrière Ultime",
      desc: "Tout inclus + Génération de Portfolio Web personnel",
      icon: <Crown className="w-4 h-4 text-purple-500" />,
      highlight: false,
    },
  ];

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      // Marquer le CV actif avec son offre exacte
      const activeCv = StorageManager.getActiveResume();
      if (activeCv) {
        StorageManager.saveActiveResume({
          ...activeCv,
          isPremium: true,
          planTier: selectedPlan,
        });
      }
      StorageManager.setPlanTier(selectedPlan);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      setIsProcessing(false);
      setIsDone(true);
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
      });
    }, 1200);
  };

  const getSelectedPlanDetails = () => {
    return plans.find((p) => p.id === selectedPlan) || plans[1];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md fade-in overflow-hidden">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden transform transition-all">
        
        {/* En-tête Fixe (Sticky Header) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-md shadow-blue-600/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                  Débloquer MonCV.ai
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full border border-emerald-200">
                  Sécurisé
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Paiement unique sécurisé par Mobile Money (Wave, Orange, MTN)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps Défilant (Scrollable Body) */}
        {isDone ? (
          <div className="p-6 sm:p-8 text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">
                Paiement Validé avec Succès ! 🎉
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
                Votre formule <strong>{getSelectedPlanDetails().name}</strong> ({getSelectedPlanDetails().price}) est désormais active à 100%.
              </p>
            </div>

            {/* Détails spécifiques selon l'offre */}
            {selectedPlan === "1500" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-left space-y-1.5">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                  <span>CV HD Sans Filigrane Débloqué</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Le filigrane a été retiré. Vous pouvez désormais exporter votre CV au format A4 Vectoriel Haute Définition.
                </p>
              </div>
            )}

            {selectedPlan === "2500" && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-left space-y-1.5">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs sm:text-sm">
                  <Sparkles className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                  <span>Pack Candidature Pro Complet Débloqué</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Votre CV sans filigrane, votre Demande d'emploi officielle et votre Lettre de motivation IA sont tous prêts à l'emploi.
                </p>
              </div>
            )}

            {selectedPlan === "5000" && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl text-left space-y-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs sm:text-sm">
                  <Crown className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                  <span>Pack VIP & Portfolio Web Personnel Activé !</span>
                </div>
                <p className="text-xs text-purple-700 leading-relaxed">
                  Votre site web Portfolio complet est désormais en ligne avec lien public, exports illimités et Support VIP WhatsApp 7j/7.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {selectedPlan === "5000" ? (
                <a
                  href={`/c/${StorageManager.getActiveResume().slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span>Voir mon Portfolio Web VIP</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSuccess();
                    onClose();
                    setIsDone(false);
                  }}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Accéder à mes fonctionnalités</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                  setIsDone(false);
                }}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Fermer</span>
              </button>
            </div>
          </div>
        ) : (
          <form id="mobile-money-form" onSubmit={handlePay} className="flex flex-col flex-1 overflow-hidden">
            
            {/* Zone de formulaire défilante */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              
              {/* Choix des 3 offres payantes */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  1. Sélectionnez votre formule :
                </label>
                <div className="space-y-2.5">
                  {plans.map((p) => {
                    const isSel = selectedPlan === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlan(p.id)}
                        className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all relative flex items-center justify-between gap-3 cursor-pointer ${
                          isSel
                            ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2.5 rounded-xl border shrink-0 ${isSel ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                            {p.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                                {p.name}
                              </h4>
                              {p.badge && (
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    p.highlight
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                              {p.desc}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="font-black text-slate-900 text-xs sm:text-sm">
                            {p.price}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSel ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}>
                            {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opérateur de règlement */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  2. Opérateur de règlement :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "wave", name: "Wave", bg: "bg-[#1dc4fe] text-white" },
                    { id: "orange", name: "Orange", bg: "bg-[#ff7900] text-white" },
                    { id: "mtn", name: "MTN MoMo", bg: "bg-[#ffcc00] text-slate-900" },
                    { id: "card", name: "Carte Visa", bg: "bg-slate-800 text-white" },
                  ].map((pm) => {
                    const isSel = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`py-2.5 px-3 rounded-2xl text-xs font-bold text-center border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isSel
                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black ${pm.bg}`}>
                          {pm.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saisie numéro Mobile Money */}
              <div className="space-y-1.5 pt-1">
                {paymentMethod !== "card" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      3. Numéro Mobile Money ({paymentMethod.toUpperCase()}) :
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:bg-white transition-all"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Une validation par notification Push ou SMS sera demandée sur votre téléphone.</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      3. Numéro de Carte Bancaire (Visa / Mastercard) :
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="4000 1234 5678 9010"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Pied de Page Fixe Toujours Visible (Sticky Submit Footer) */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0 space-y-2 shadow-lg">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 transition-all cursor-pointer animate-cta-loop"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {isProcessing
                  ? "Validation du paiement en cours..."
                  : `Valider et payer ${getSelectedPlanDetails().price}`}
              </button>

              <p className="text-[10px] text-center text-slate-400 font-medium">
                🔒 Paiement 100% sécurisé et instantané • Déblocage immédiat du CV & Portfolio
              </p>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
