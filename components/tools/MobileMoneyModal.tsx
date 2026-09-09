"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { X, Check, ShieldCheck, Sparkles, Smartphone, CreditCard, RefreshCw, CheckCircle2, Crown, Globe, FileText, Lock, Building, Users } from "lucide-react";
import { StorageManager } from "@/lib/storage";
import { registerPaymentSuccess } from "@/lib/license-manager";
import { PlanTier } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { SupabaseService } from "@/lib/supabaseService";

// ─── Configuration unique de toutes les offres ───────────────────────────────
type PlanCategory = "particulier" | "entreprise";

interface PlanConfig {
  id: PlanTier;
  category: PlanCategory;
  name: string;
  price: string;
  priceNumber: string;
  perProfile?: string;
  badge: string;
  badgeColor?: string;
  desc: string;
  features: string[];
  highlight: boolean;
  // Confirmation post-paiement
  confirmTitle: string;
  confirmDesc: string;
  confirmGradient: string;
  confirmBorder: string;
  confirmTextColor: string;
}

const ALL_PLANS: (Omit<PlanConfig, "icon">)[] = [
  // ── Particulier ──
  {
    id: "1500",
    category: "particulier",
    name: "Pack Essentiel (1 Profil)",
    price: "1 500 FCFA",
    priceNumber: "1 500",
    badge: "Profil Unique",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    highlight: false,
    desc: "Idéal pour finaliser et exporter un CV professionnel sans filigrane.",
    features: [
      "1 profil candidat complet débloqué",
      "Téléchargements illimités PDF Vectoriel HD & Word (.docx)",
      "Retouches et modèles de CV à volonté",
    ],
    confirmTitle: "CV HD Sans Filigrane Débloqué",
    confirmDesc: "Le filigrane a été retiré. Vous pouvez désormais exporter votre CV au format A4 Vectoriel Haute Définition.",
    confirmGradient: "from-blue-50 to-blue-50",
    confirmBorder: "border-blue-200",
    confirmTextColor: "text-blue-700",
  },
  {
    id: "2500",
    category: "particulier",
    name: "Pack Candidature Pro",
    price: "2 500 FCFA",
    priceNumber: "2 500",
    badge: "Recommandé ★",
    badgeColor: "bg-amber-500 text-white shadow-xs",
    highlight: true,
    desc: "La formule complète pour réussir ses recrutements avec lettre et demande.",
    features: [
      "Jusqu'à 2 profils candidats complets",
      "Générateur IA de Lettre de motivation personnalisée",
      "Demande d'emploi administrative officielle OHADA",
      "Exports PDF HD & Word (.docx) sans filigrane",
    ],
    confirmTitle: "Candidature Pro 100% Débloquée !",
    confirmDesc: "Vous avez accès au générateur de lettre de motivation IA et de demande d'emploi administrative sur 2 profils candidats.",
    confirmGradient: "from-indigo-50 to-indigo-50",
    confirmBorder: "border-indigo-200",
    confirmTextColor: "text-indigo-700",
  },
  {
    id: "5000",
    category: "particulier",
    name: "Pack VIP & Portfolio Web",
    price: "5 000 FCFA",
    priceNumber: "5 000",
    badge: "Prestige VIP",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    highlight: false,
    desc: "Pour cadres et consultants : vitrine web moderne avec QR Code recruteur.",
    features: [
      "Jusqu'à 4 profils candidats complets",
      "Site Web Portfolio personnel en ligne (URL exclusive)",
      "Générateur de QR Code HD pour recruteurs",
      "Accès prioritaire à tous les 6 modèles & outils IA",
    ],
    confirmTitle: "Portfolio VIP & QR Code Activés !",
    confirmDesc: "Votre page web personnelle est en ligne. Partagez votre lien exclusif et votre QR Code auprès des recruteurs.",
    confirmGradient: "from-purple-50 to-purple-50",
    confirmBorder: "border-purple-200",
    confirmTextColor: "text-purple-700",
  },
  // ── Entreprise / B2B (Les 3 Offres Officielles Conformes à l'Image) ──
  {
    id: "enterprise30",
    category: "entreprise",
    name: "Pack Starter PME",
    price: "20 000 FCFA",
    priceNumber: "20 000",
    perProfile: "~667 F / profil",
    badge: "30 Candidats",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    highlight: false,
    desc: "Idéal pour petites structures, startups & promotions de 20-30 apprenants.",
    features: [
      "30 Candidats / Profils complets débloqués",
      "Téléchargements illimités (PDF Vectoriel HD + Word DOCX)",
      "Tous les 6 modèles de CV de prestige inclus",
      "Mise en page anti-débordement A4 stricte",
      "Crédits valables à vie sans date d'expiration",
    ],
    confirmTitle: "Pack Starter PME (30 Candidats) Activé !",
    confirmDesc: "Votre vivier de 30 profils candidats est immédiatement opérationnel. Toutes les offres personnelles vous sont 100% offertes.",
    confirmGradient: "from-emerald-50 to-teal-50",
    confirmBorder: "border-emerald-200",
    confirmTextColor: "text-emerald-800",
  },
  {
    id: "enterprise75",
    category: "entreprise",
    name: "Pack Business Pro",
    price: "45 000 FCFA",
    priceNumber: "45 000",
    perProfile: "600 F / profil",
    badge: "Recommandé ★",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs",
    highlight: true,
    desc: "La formule reine pour cabinets de recrutement, agences d'intérim & DRH actives.",
    features: [
      "75 Candidats / Profils complets débloqués",
      "Demandes d'Emploi Officielles & Lettres IA incluses",
      "Téléchargements illimités (PDF HD + Word DOCX)",
      "Accès aux 6 templates de prestige sans filigrane",
      "Support Prioritaire VIP WhatsApp 7j/7 (< 15 min)",
      "Reçu & Facture d'entreprise normalisée",
    ],
    confirmTitle: "Pack Business Pro (75 Candidats) Activé !",
    confirmDesc: "Votre vivier RH de 75 profils est débloqué à vie. Vos recrutements sont accélérés avec l'assistance dédiée INNOVA GROUP.",
    confirmGradient: "from-amber-50 to-orange-50",
    confirmBorder: "border-amber-200",
    confirmTextColor: "text-amber-900",
  },
  {
    id: "enterprise200",
    category: "entreprise",
    name: "Pack Entreprise Premium",
    price: "100 000 FCFA",
    priceNumber: "100 000",
    perProfile: "500 F / profil (-67%)",
    badge: "Volume Élite",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    highlight: false,
    desc: "Pour grandes entreprises, ONG internationales, universités & réseaux de cybercafés.",
    features: [
      "200 Candidats / Profils complets débloqués",
      "Tarif plancher garanti : 500 F par profil",
      "Tous les 6 modèles + Portfolios Web activables",
      "Accompagnement prise en main pour vos équipes RH",
      "Ligne WhatsApp dédiée 24/7 & gestionnaire de compte",
      "Facture normalisée conforme OHADA (N° RCCM / IFU)",
    ],
    confirmTitle: "Pack Entreprise (200 Candidats) Activé !",
    confirmDesc: "Votre compte bénéficie du quota maximum de 200 profils candidats, d'un gestionnaire de compte dédié et de la priorité absolue.",
    confirmGradient: "from-purple-50 to-indigo-50",
    confirmBorder: "border-purple-200",
    confirmTextColor: "text-purple-800",
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
  const { t, dict, isRTL } = useTranslation();

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

  const handleFinishAndNavigate = () => {
    const isEnterprisePlan = selectedPlan.startsWith("enterprise") || selectedPlan === "cyber15";
    const u = StorageManager.getUser();
    const isBiz = isEnterprisePlan || u?.accountType === "business" || StorageManager.isBusinessAccount();

    onSuccess();
    onClose();
    setIsDone(false);

    if (isBiz) {
      router.push("/dashboard?tab=business");
    } else {
      router.push("/dashboard");
    }
  };

  // Redirection automatique vers l'espace entreprise ou candidat après paiement validé
  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => {
        handleFinishAndNavigate();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isDone, selectedPlan]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

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

    // Sauvegarde locale de la souscription
    StorageManager.setPlanTier(selectedPlan, {
      paymentMethod: `Mobile Money (${paymentMethod.toUpperCase()})`,
      phoneNumber: phoneNumber.trim(),
      transactionRef,
    });

    // Synchronisation Cloud Supabase immédiate (Auth metadata, profil, quota & transactions)
    const currentPriceStr = currentPlan?.priceNumber || "0";
    const parsedAmount = parseInt(currentPriceStr.replace(/\s+/g, ""), 10) || 0;
    try {
      await SupabaseService.syncSubscriptionToCloud(selectedPlan, {
        provider: paymentMethod === "card" ? "card" : "mobile_money",
        paymentMethod: `Mobile Money (${paymentMethod.toUpperCase()})`,
        phoneNumber: phoneNumber.trim(),
        transactionRef,
        amount: parsedAmount,
        currency: "FCFA",
      });
    } catch (err) {
      console.warn("Erreur syncSubscriptionToCloud:", err);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }

    setIsProcessing(false);
    setIsDone(true);
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md fade-in overflow-hidden">
      <div className="bg-white w-full max-w-xl sm:max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden transform transition-all">
        
        {/* ── En-tête Fixe ── */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-md shadow-blue-600/20 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                  Débloquer MonCV.ai
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full border border-emerald-200 shrink-0 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  100% Sécurisé
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                Paiement unique sans abonnement • Déblocage instantané
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={isDone ? handleFinishAndNavigate : onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Onglets Particulier / Entreprise Fixes (Toujours visibles en haut) ── */}
        {!isDone && (
          <div className="px-5 py-3 sm:px-6 bg-slate-100/70 border-b border-slate-200/70 shrink-0">
            <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => handleTabSwitch("particulier")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  planTab === "particulier"
                    ? "bg-white text-slate-900 shadow-sm font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className={`w-4 h-4 ${planTab === "particulier" ? "text-blue-600" : "text-slate-500"}`} />
                <span>{dict.pricing.candidatesTab}</span>
                <span className="hidden sm:inline text-[10px] font-semibold text-slate-400">
                  (1 à 4 CV)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("entreprise")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  planTab === "entreprise"
                    ? "bg-white text-slate-900 shadow-sm font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building className={`w-4 h-4 ${planTab === "entreprise" ? "text-indigo-600" : "text-slate-500"}`} />
                <span>{dict.pricing.enterprisesTab}</span>
                <span className="hidden sm:inline text-[10px] font-semibold text-slate-400">
                  (15 à 200 CV)
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── Corps ── */}
        {isDone ? (
          <div className="p-6 sm:p-8 text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                Paiement Validé avec Succès ! 🎉
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                Votre formule <strong>{currentPlan.name}</strong> ({currentPlan.price}) est désormais active à 100%.
              </p>
            </div>

            {/* Confirmation dynamique */}
            <div className={`p-4 sm:p-5 bg-gradient-to-r ${currentPlan.confirmGradient} border ${currentPlan.confirmBorder} rounded-2xl text-left space-y-1.5 shadow-xs`}>
              <div className={`flex items-center gap-2 font-black text-xs sm:text-sm ${currentPlan.confirmTextColor}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{currentPlan.confirmTitle}</span>
              </div>
              <p className={`text-xs leading-relaxed ${currentPlan.confirmTextColor} font-medium`}>
                {currentPlan.confirmDesc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {selectedPlan.startsWith("enterprise") || selectedPlan === "cyber15" ? (
                <button
                  type="button"
                  onClick={handleFinishAndNavigate}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <Building className="w-4 h-4" />
                  <span>Accéder à mon Espace Vivier RH Entreprise →</span>
                </button>
              ) : selectedPlan === "5000" ? (
                <button
                  type="button"
                  onClick={handleFinishAndNavigate}
                  className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>Accéder à mon Espace Portfolio Web VIP →</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishAndNavigate}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Accéder à mon Espace Candidat →</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleFinishAndNavigate}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Fermer</span>
              </button>
            </div>
          </div>
        ) : (
          <form id="mobile-money-form" onSubmit={handlePay} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-6">
              
              {/* ── Section 1 : Sélection de l'offre ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black">1</span>
                    <span>Sélectionnez votre pack {planTab === "entreprise" ? "Entreprise" : "Particulier"} :</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {planTab === "entreprise" ? "Facture normalisée OHADA incluse" : "Paiement unique sans abonnement"}
                  </span>
                </div>

                <div className="space-y-3">
                  {visiblePlans.map((p) => {
                    const isSel = selectedPlan === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlan(p.id)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                          isSel
                            ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-md"
                            : p.highlight
                            ? "border-amber-300 bg-amber-50/20 hover:border-amber-400"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        {/* Ligne 1 : Nom + Badge + Prix + Radio */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                              className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                                isSel
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {PLAN_ICONS[p.id]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-black text-slate-900 text-sm leading-tight">
                                  {p.name}
                                </h4>
                                {p.badge && (
                                  <span
                                    className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                                      p.badgeColor || "bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                                  >
                                    {p.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-medium mt-1 leading-snug">
                                {p.desc}
                              </p>
                            </div>
                          </div>

                          {/* Prix & Bouton Radio */}
                          <div className="text-right shrink-0 flex items-center gap-3 pl-2">
                            <div>
                              <div className="font-black text-slate-900 text-sm sm:text-base leading-none">
                                {p.price}
                              </div>
                              {p.perProfile && (
                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 inline-block mt-1">
                                  {p.perProfile}
                                </span>
                              )}
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSel
                                  ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>

                        {/* Ligne 2 : Avantages bien rangés en grille/puces claires */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                          {p.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 min-w-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-medium text-slate-700 truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Section 2 : Mode de règlement ── */}
              <div className="space-y-2.5 pt-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black">2</span>
                  <span>Sélectionnez votre moyen de paiement :</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {([
                    { id: "wave", name: "Wave", fee: "0% frais", bg: "bg-[#1dc4fe] text-white" },
                    { id: "orange", name: "Orange Money", fee: "Instantané", bg: "bg-[#ff7900] text-white" },
                    { id: "mtn", name: "MTN MoMo", fee: "Instantané", bg: "bg-[#ffcc00] text-slate-950" },
                    { id: "card", name: "Carte Bancaire", fee: "Visa / Mastercard", bg: "bg-slate-900 text-white" },
                  ] as const).map((pm) => {
                    const isSel = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-3 rounded-2xl text-xs font-bold text-center border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer relative ${
                          isSel
                            ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-black ${pm.bg}`}>
                          {pm.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {pm.fee}
                        </span>
                        {isSel && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Section 3 : Coordonnées de règlement ── */}
              <div className="space-y-2 pt-1">
                {paymentMethod !== "card" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black">3</span>
                      <span>Numéro de téléphone {paymentMethod.toUpperCase()} :</span>
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+225 07 00 51 05 24"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:bg-white transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-1">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Une notification Push ou un code de validation SMS sera transmis à ce numéro.</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black">3</span>
                      <span>Numéro de Carte Bancaire (Visa / Mastercard) :</span>
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
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-1">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Paiement sécurisé avec protocole 3D-Secure et chiffrement SSL 256-bit.</span>
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* ── Pied de validation Fixe ── */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0 space-y-2.5 shadow-xl">
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
                  ? "Validation de la transaction en cours..."
                  : `Valider et payer ${currentPlan.price}`}
              </button>

              <div className="flex items-center justify-center gap-3 text-[10.5px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Paiement 100% sécurisé</span>
                </span>
                <span>•</span>
                <span>Facture normalisée OHADA</span>
                <span>•</span>
                <span>Déblocage immédiat</span>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
