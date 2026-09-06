"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { X, Check, ShieldCheck, Sparkles, Smartphone, CreditCard, RefreshCw, CheckCircle2, Crown, Globe, FileText, Lock, Building, Users } from "lucide-react";
import { StorageManager } from "@/lib/storage";
import { registerPaymentSuccess } from "@/lib/license-manager";
import { PlanTier } from "@/lib/types";

// ─── Configuration unique de toutes les offres ───────────────────────────────
type PlanCategory = "particulier" | "entreprise";

interface PlanConfig {
  id: PlanTier;
  category: PlanCategory;
  name: string;
  price: string;
  badge: string;
  desc: string;
  icon: React.ReactNode;
  highlight: boolean;
  // Confirmation post-paiement
  confirmTitle: string;
  confirmDesc: string;
  confirmGradient: string;
  confirmBorder: string;
  confirmTextColor: string;
}

const ALL_PLANS: Omit<PlanConfig, "icon">[] = [
  // ── Particulier ──
  {
    id: "1500", category: "particulier",
    name: "Pack Essentiel (1 Profil)", price: "1 500 FCFA",
    badge: "Profil Unique", highlight: false,
    desc: "Téléchargements PDF & Word illimités • 1 Candidat (retouches et modèles à volonté)",
    confirmTitle: "CV HD Sans Filigrane Débloqué",
    confirmDesc: "Le filigrane a été retiré. Vous pouvez désormais exporter votre CV au format A4 Vectoriel Haute Définition.",
    confirmGradient: "from-blue-50 to-blue-50", confirmBorder: "border-blue-200", confirmTextColor: "text-blue-700",
  },
  {
    id: "2500", category: "particulier",
    name: "Pack Candidature Pro", price: "2 500 FCFA",
    badge: "Recommandé", highlight: true,
    desc: "Export PDF HD + Lettre de motivation IA + Demande d'emploi officielle • Jusqu'à 2 profils",
    confirmTitle: "Candidature Pro 100% Débloquée !",
    confirmDesc: "Vous avez accès au générateur de lettre de motivation IA et de demande d'emploi administrative sur 2 profils candidats.",
    confirmGradient: "from-indigo-50 to-indigo-50", confirmBorder: "border-indigo-200", confirmTextColor: "text-indigo-700",
  },
  {
    id: "5000", category: "particulier",
    name: "Pack VIP & Portfolio Web", price: "5 000 FCFA",
    badge: "Prestige VIP", highlight: false,
    desc: "Tous les outils + Page Web Portfolio personnelle en ligne avec QR Code HD • 4 profils",
    confirmTitle: "Portfolio VIP & QR Code Activés !",
    confirmDesc: "Votre page web personnelle est en ligne. Partagez votre lien exclusif et votre QR Code auprès des recruteurs.",
    confirmGradient: "from-purple-50 to-purple-50", confirmBorder: "border-purple-200", confirmTextColor: "text-purple-700",
  },
  // ── Entreprise / B2B ──
  {
    id: "cyber15", category: "entreprise",
    name: "Pass Cybercafé & Secrétariat", price: "15 000 FCFA",
    badge: "Centres de Services", highlight: false,
    desc: "15 Profils candidats complets (1 000 F/CV) • Exports Word (.docx) & PDF illimités • Support WhatsApp prioritaire",
    confirmTitle: "Pass Cybercafé (15 Candidats) Activé !",
    confirmDesc: "Vos 15 crédits candidats sans expiration sont disponibles dans votre Espace Recruteur avec facturation normalisée OHADA.",
    confirmGradient: "from-teal-50 to-teal-50", confirmBorder: "border-teal-200", confirmTextColor: "text-teal-700",
  },
  {
    id: "enterprise30", category: "entreprise",
    name: "Pack Starter PME", price: "45 000 FCFA",
    badge: "Starter RH", highlight: false,
    desc: "30 Profils candidats complets • Vivier centralisé • Facture normalisée OHADA • Exports Word/PDF",
    confirmTitle: "Pack Starter RH (30 Candidats) Activé !",
    confirmDesc: "Votre vivier de 30 profils candidats est immédiatement opérationnel. Toutes les offres personnelles vous sont 100% offertes.",
    confirmGradient: "from-emerald-50 to-emerald-50", confirmBorder: "border-emerald-200", confirmTextColor: "text-emerald-700",
  },
  {
    id: "enterprise75", category: "entreprise",
    name: "Pack Business Pro RH", price: "95 000 FCFA",
    badge: "Le Plus Choisi", highlight: true,
    desc: "75 Profils candidats complets • Vivier RH collaboratif • Facture OHADA • Assistance prioritaire 7j/7",
    confirmTitle: "Pack Business Pro (75 Candidats) Activé !",
    confirmDesc: "Votre vivier RH de 75 profils est débloqué à vie. Vos recrutements sont accélérés avec l'assistance dédiée INNOVA GROUP.",
    confirmGradient: "from-amber-50 to-amber-50", confirmBorder: "border-amber-200", confirmTextColor: "text-amber-700",
  },
  {
    id: "enterprise200", category: "entreprise",
    name: "Pack Entreprise & Cabinet", price: "195 000 FCFA",
    badge: "Volume Élite", highlight: false,
    desc: "200 Profils candidats complets • Gestionnaire de compte dédié • Facture OHADA avec RCCM • Intégration sur mesure",
    confirmTitle: "Pack Entreprise (200 Candidats) Activé !",
    confirmDesc: "Votre compte bénéficie du quota maximum de 200 profils candidats, d'un gestionnaire de compte dédié et de la priorité absolue.",
    confirmGradient: "from-purple-50 to-purple-50", confirmBorder: "border-purple-200", confirmTextColor: "text-purple-700",
  },
];

const PLAN_ICONS: Record<PlanTier, React.ReactNode> = {
  "free": <Sparkles className="w-4 h-4" />,
  "1500": <Sparkles className="w-4 h-4" />,
  "2500": <Crown className="w-4 h-4" />,
  "5000": <Globe className="w-4 h-4" />,
  "cyber15": <FileText className="w-4 h-4" />,
  "enterprise30": <Building className="w-4 h-4" />,
  "enterprise75": <Users className="w-4 h-4" />,
  "enterprise200": <Crown className="w-4 h-4" />,
};

// ─── Composant ───────────────────────────────────────────────────────────────

interface MobileMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPlan?: PlanTier;
}

export const MobileMoneyModal: React.FC<MobileMoneyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPlan = "2500",
}) => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(defaultPlan);
  const [paymentMethod, setPaymentMethod] = useState<"wave" | "orange" | "mtn" | "card">("wave");
  const [phoneNumber, setPhoneNumber] = useState("+225 07 ");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [planTab, setPlanTab] = useState<PlanCategory>("particulier");

  useEffect(() => {
    if (isOpen && defaultPlan) {
      setSelectedPlan(defaultPlan);
      setPlanTab(ALL_PLANS.find((p) => p.id === defaultPlan)?.category || "particulier");
    }
  }, [isOpen, defaultPlan]);

  if (!isOpen) return null;

  // ── Helpers ──
  const currentPlan = ALL_PLANS.find((p) => p.id === selectedPlan) || ALL_PLANS[1];
  const visiblePlans = ALL_PLANS.filter((p) => p.category === planTab);

  const handleTabSwitch = (tab: PlanCategory) => {
    setPlanTab(tab);
    const defaultForTab = ALL_PLANS.find((p) => p.category === tab && p.highlight) || ALL_PLANS.find((p) => p.category === tab);
    if (defaultForTab) setSelectedPlan(defaultForTab.id);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      const activeCv = StorageManager.getActiveResume();
      const transactionRef = `MM_${paymentMethod.toUpperCase()}_${Date.now()}`;
      if (activeCv) {
        const updatedWithLicense = registerPaymentSuccess(
          activeCv,
          selectedPlan,
          transactionRef
        );
        StorageManager.saveActiveResume(updatedWithLicense);
      }
      StorageManager.setPlanTier(selectedPlan, {
        paymentMethod: `Mobile Money (${paymentMethod.toUpperCase()})`,
        phoneNumber: phoneNumber.trim(),
        transactionRef,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      setIsProcessing(false);
      setIsDone(true);
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
    }, 1200);
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md fade-in overflow-hidden">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden transform transition-all">
        
        {/* ── En-tête ── */}
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

        {/* ── Corps ── */}
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
                Votre formule <strong>{currentPlan.name}</strong> ({currentPlan.price}) est désormais active à 100%.
              </p>
            </div>

            {/* Confirmation dynamique — piloté par les données du plan */}
            <div className={`p-4 bg-gradient-to-r ${currentPlan.confirmGradient} border ${currentPlan.confirmBorder} rounded-2xl text-left space-y-1.5`}>
              <div className={`flex items-center gap-2 font-bold text-xs sm:text-sm ${currentPlan.confirmTextColor.replace("700", "900")}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{currentPlan.confirmTitle}</span>
              </div>
              <p className={`text-xs leading-relaxed ${currentPlan.confirmTextColor}`}>
                {currentPlan.confirmDesc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {selectedPlan.startsWith("enterprise") || selectedPlan === "cyber15" ? (
                <button
                  type="button"
                  onClick={() => {
                    onSuccess();
                    onClose();
                    setIsDone(false);
                    router.push("/dashboard?tab=business");
                  }}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <Building className="w-4 h-4" />
                  <span>Accéder à mon Espace Vivier RH Entreprise →</span>
                </button>
              ) : selectedPlan === "5000" ? (
                <a
                  href={`/c/${StorageManager.getActiveResume()?.slug}`}
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
                  onClick={() => { onSuccess(); onClose(); setIsDone(false); }}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Accéder à mes fonctionnalités</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => { onSuccess(); onClose(); setIsDone(false); }}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Fermer</span>
              </button>
            </div>
          </div>
        ) : (
          <form id="mobile-money-form" onSubmit={handlePay} className="flex flex-col flex-1 overflow-hidden">
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              
              {/* ── Étape 1 : Choix de la formule ── */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  1. Sélectionnez votre formule :
                </label>

                {/* Onglets Particulier / Entreprise */}
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                  {([
                    { tab: "particulier" as PlanCategory, label: "Particulier", Icon: FileText },
                    { tab: "entreprise" as PlanCategory, label: "Entreprise", Icon: Building },
                  ]).map(({ tab, label, Icon }) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleTabSwitch(tab)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        planTab === tab
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Cartes des offres */}
                <div className="space-y-2.5">
                  {visiblePlans.map((p) => {
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
                            {PLAN_ICONS[p.id]}
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

              {/* ── Étape 2 : Opérateur ── */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  2. Opérateur de règlement :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {([
                    { id: "wave", name: "Wave", bg: "bg-[#1dc4fe] text-white" },
                    { id: "orange", name: "Orange", bg: "bg-[#ff7900] text-white" },
                    { id: "mtn", name: "MTN MoMo", bg: "bg-[#ffcc00] text-slate-900" },
                    { id: "card", name: "Carte Visa", bg: "bg-slate-800 text-white" },
                  ] as const).map((pm) => {
                    const isSel = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
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

              {/* ── Étape 3 : Numéro ── */}
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

            {/* ── Footer de validation ── */}
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
                  : `Valider et payer ${currentPlan.price}`}
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
