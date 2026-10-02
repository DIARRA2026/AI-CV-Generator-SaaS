"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  User,
  KeyRound,
  RotateCw,
  Check,
} from "lucide-react";
import { SupabaseService } from "@/lib/supabaseService";
import { StorageManager } from "@/lib/storage";
import { PlanTier, AccountType } from "@/lib/types";
import { getCreditPack } from "@/config/payments";
import { CANDIDATE_PLANS, BUSINESS_PLANS, normalizePlanId } from "@/components/tools/AuthModal";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get("redirect") || "/dashboard";
  const planParam = (searchParams.get("plan") || searchParams.get("checkout") as PlanTier) || null;
  const initialType = (searchParams.get("type") as AccountType) || "candidate";

  const [accountType, setAccountType] = useState<AccountType>(() => {
    if (initialType === "business") return "business";
    const pending = typeof window !== "undefined" ? StorageManager.getPendingCheckoutPlan()?.plan : null;
    const plan = normalizePlanId(planParam || pending);
    if (["cyber15", "enterprise30", "enterprise75", "enterprise200"].includes(plan)) {
      return "business";
    }
    return initialType;
  });
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(() => {
    const pending = typeof window !== "undefined" ? StorageManager.getPendingCheckoutPlan()?.plan : null;
    const planToSet = (planParam && planParam !== "free" ? planParam : null) || pending || planParam || (initialType === "business" ? "enterprise75" : "free");
    return normalizePlanId(planToSet);
  });

  const activePlans = accountType === "business" ? BUSINESS_PLANS : CANDIDATE_PLANS;
  const currentPlan =
    activePlans.find((p) => normalizePlanId(p.id) === normalizePlanId(selectedPlan)) ||
    activePlans[0];

  // Champs Candidat
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Champs Entreprise
  const [companyName, setCompanyName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [companyType, setCompanyType] = useState("PME / ETI");
  const [rccm, setRccm] = useState("");

  // Champs communs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // État de chargement et erreurs
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // État de validation OTP par email (6 chiffres)
  const [isOtpPending, setIsOtpPending] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Garde client : si déjà authentifié, redirection vers le dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (StorageManager.isLoggedIn()) {
        router.replace(redirectParam.startsWith("/") ? redirectParam : "/dashboard");
      }
    }
  }, [router, redirectParam]);

  // Compte à rebours de renvoi d'OTP
  useEffect(() => {
    if (!isOtpPending) return;
    if (otpCountdown <= 0) {
      setCanResendOtp(true);
      return;
    }
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOtpPending, otpCountdown]);

  // Calcul de la force du mot de passe
  const passwordStrength = React.useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  // Soumission du formulaire d'inscription
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Veuillez saisir une adresse email valide.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (accountType === "candidate") {
      if (!firstName.trim()) {
        setErrorMessage("Veuillez saisir votre prénom.");
        return;
      }
    } else {
      if (!companyName.trim()) {
        setErrorMessage("Veuillez indiquer la raison sociale de votre entreprise.");
        return;
      }
      if (!managerName.trim()) {
        setErrorMessage("Veuillez indiquer le nom du responsable ou recruteur.");
        return;
      }
    }

    if (!agreeTerms) {
      setErrorMessage("Veuillez accepter les conditions générales pour créer votre compte.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        accountType,
        email: cleanEmail,
        password,
        firstName: accountType === "candidate" ? firstName.trim() : managerName.trim(),
        lastName: accountType === "candidate" ? lastName.trim() : "",
        selectedPlan: selectedPlan,
        planTier: selectedPlan,
        companyName: accountType === "business" ? companyName.trim() : undefined,
        companyType: accountType === "business" ? companyType : undefined,
        managerRole: accountType === "business" ? "Responsable Recrutement" : undefined,
        rccm: accountType === "business" && rccm ? rccm.trim() : undefined,
      };

      const res = await SupabaseService.signUp(payload);

      if (!res.success) {
        setErrorMessage(
          res.message || "Impossible de finaliser l'inscription. L'email est peut-être déjà utilisé."
        );
        setIsLoading(false);
        return;
      }

      // Si Supabase requiert la validation OTP par email
      if (res.emailVerificationRequired) {
        setIsLoading(false);
        setIsOtpPending(true);
        setOtpCountdown(60);
        setCanResendOtp(false);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
        return;
      }

      // Inscription finalisée directement (sans confirmation email requise)
      finalizeRegistration();
    } catch (err: any) {
      console.error("Erreur inattendue inscription:", err);
      setErrorMessage("Une erreur réseau est survenue lors de la création de votre compte.");
      setIsLoading(false);
    }
  };

  // Validation du code OTP à 6 chiffres
  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otpDigits.join("").trim();
    if (code.length !== 6) {
      setErrorMessage("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage(null);

    try {
      const res = await SupabaseService.verifyEmailOtp(
        email.trim().toLowerCase(),
        code
      );

      if (!res.success) {
        setErrorMessage(
          res.message || "Le code saisi est incorrect ou a expiré. Veuillez vérifier et réessayer."
        );
        setIsVerifyingOtp(false);
        return;
      }

      finalizeRegistration();
    } catch (err: any) {
      setErrorMessage("Erreur lors de la vérification du code. Réessayez dans un instant.");
      setIsVerifyingOtp(false);
    }
  };

  // Renvoi d'un nouveau code OTP
  const handleResendOtp = async () => {
    if (!canResendOtp || isResendingOtp) return;
    setIsResendingOtp(true);
    setErrorMessage(null);

    try {
      const res = await SupabaseService.resendConfirmationEmail(email.trim().toLowerCase());
      if (res.success) {
        setSuccessMessage("Un nouveau code à 6 chiffres a été envoyé par email.");
        setCanResendOtp(false);
        setOtpCountdown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      } else {
        setErrorMessage(res.message || "Impossible de renvoyer le code pour le moment. Veuillez patienter.");
      }
    } catch {
      setErrorMessage("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Gestion des 6 cases de saisie OTP
  const handleOtpChange = (index: number, value: string) => {
    // Si l'utilisateur colle un code complet
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      if (cleaned.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = cleaned[i] || "";
        }
        setOtpDigits(newDigits);
        if (cleaned.length === 6) {
          handleVerifyOtp(cleaned);
        } else {
          otpInputRefs.current[Math.min(cleaned.length, 5)]?.focus();
        }
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Si tous les chiffres sont remplis, déclencher la validation automatique
    if (digit && index === 5 && newDigits.every((d) => d.length === 1)) {
      handleVerifyOtp(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Finalisation et redirection vers /dashboard
  const finalizeRegistration = () => {
    setSuccessMessage("Compte validé avec succès ! Bienvenue sur MonCV.ai.");

    if (selectedPlan && selectedPlan !== "free") {
      StorageManager.setPendingCheckoutPlan(selectedPlan, true);
      StorageManager.setPlanTier(selectedPlan);
    }

    const sessionUser = StorageManager.getUser();
    const tokenValue = encodeURIComponent(
      sessionUser?.token || `auth_${email.trim().toLowerCase()}`
    );
    document.cookie = `moncv_auth_token=${tokenValue}; path=/; max-age=2592000; SameSite=Lax`;

    window.dispatchEvent(new Event("storage"));

    setTimeout(() => {
      if (selectedPlan && selectedPlan !== "free") {
        router.replace(`/tarifs?checkout=${selectedPlan}`);
      } else if (accountType === "business") {
        router.replace("/dashboard?tab=business");
      } else {
        router.replace("/dashboard");
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Halos décoratifs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* En-tête */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center z-10 space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all shadow-lg shadow-black/20"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md">
            CV
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            MonCV<span className="text-blue-400">.ai</span>
          </span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Créer votre compte
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Rejoignez la plateforme n°1 en Afrique francophone pour vos candidatures certifiées ATS et recrutements d'élite.
        </p>
      </div>

      {/* Carte principale */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Si étape de validation OTP */}
          {isOtpPending ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-md">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Validation de votre compte
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Nous venons d'envoyer un code de vérification à 6 chiffres à l'adresse :
                  <br />
                  <strong className="text-white font-bold">{email}</strong>
                </p>
              </div>

              {/* Bannières de notification */}
              {errorMessage && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{successMessage}</span>
                </div>
              )}

              {/* 6 Cases de saisie de l'OTP */}
              <div className="space-y-3">
                <label className="block text-center text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Entrez votre code à 6 chiffres
                </label>
                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black text-white bg-slate-950 border-2 border-slate-700 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              {/* Bouton de confirmation du code */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isVerifyingOtp || otpDigits.some((d) => !d)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vérification du code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmer et accéder à mon espace</span>
                  </>
                )}
              </button>

              {/* Renvoi du code OTP */}
              <div className="text-center pt-2">
                {canResendOtp ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResendingOtp}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isResendingOtp ? "animate-spin" : ""}`} />
                    <span>Renvoyer un nouveau code</span>
                  </button>
                ) : (
                  <p className="text-xs text-slate-400">
                    Renvoyer un nouveau code dans{" "}
                    <strong className="text-white font-bold">{otpCountdown}s</strong>
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Formulaire standard d'inscription
            <>
              {/* Sélecteur Candidat / Entreprise */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAccountType("candidate");
                    if (selectedPlan.startsWith("enterprise") || selectedPlan === "cyber15") {
                      setSelectedPlan("free");
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    accountType === "candidate"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Particulier (Candidat)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountType("business");
                    if (!selectedPlan.startsWith("enterprise") && selectedPlan !== "cyber15") {
                      setSelectedPlan("enterprise75");
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    accountType === "business"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Entreprise (Recruteur)</span>
                </button>
              </div>

              {/* En-tête : Rappel si une formule payante est sélectionnée */}
              {selectedPlan !== "free" && (
                <div className="p-3 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-200 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">
                        Pack {getCreditPack(selectedPlan)?.label || selectedPlan} sélectionné
                      </span>
                      <span className="text-[11px] text-slate-300">
                        {getCreditPack(selectedPlan)?.credits || 250} crédits IA ({accountType === "business" ? "12 mois" : "30 jours"}) • Règlement sécurisé KKiaPay
                      </span>
                    </div>
                  </div>
                  <span className="font-black text-blue-300 bg-blue-900/60 px-2.5 py-1 rounded-xl text-xs border border-blue-700/50 shrink-0">
                    {(getCreditPack(selectedPlan)?.prixFcfa || 0).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              )}

              {/* Sélecteur des formules */}
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>{accountType === "business" ? "Choisissez votre formule Entreprise" : "Choisissez votre formule Candidat"}</span>
                  </label>
                  <span className="text-[10px] text-blue-400 font-extrabold bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/60">
                    {accountType === "business" ? "Tarif B2B • Vivier RH" : "Tarifs clairs en FCFA"}
                  </span>
                </div>

                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                  {activePlans.map((p) => {
                    const isSelected = normalizePlanId(selectedPlan) === normalizePlanId(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlan(p.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                          isSelected
                            ? accountType === "business"
                              ? "bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/30 shadow-md shadow-amber-500/10"
                              : "bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 shadow-md shadow-blue-500/10"
                            : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? accountType === "business"
                                      ? "border-amber-500 bg-amber-500 text-slate-950"
                                      : "border-blue-500 bg-blue-500 text-white"
                                    : "border-slate-600 bg-slate-800"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="text-xs font-black text-white leading-tight">
                                {p.name}
                              </span>
                            </div>
                            <span
                              className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                                p.highlight
                                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                                  : isSelected
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {p.badge}
                            </span>
                          </div>

                          <div className="mt-2 flex items-baseline justify-between gap-1">
                            <span
                              className={`text-sm font-black ${
                                accountType === "business" ? "text-amber-400" : "text-blue-400"
                              }`}
                            >
                              {p.price}
                            </span>
                            {p.perProfile && (
                              <span className="text-[9px] font-bold text-teal-300 bg-teal-950/60 px-1.5 py-0.2 rounded border border-teal-800/60 whitespace-nowrap">
                                {p.perProfile}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 leading-snug mt-1.5">
                            {p.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bannières d'erreur et succès */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Champs spécifiques selon le type de compte */}
                {accountType === "candidate" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ex: Jean"
                        className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ex: Kouassi"
                        className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Nom de l'Entreprise / Organisation *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: INNOVA GROUP SARL"
                        className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Responsable / Recruteur *
                        </label>
                        <input
                          type="text"
                          required
                          value={managerName}
                          onChange={(e) => setManagerName(e.target.value)}
                          placeholder="Ex: Directeur RH"
                          className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Type d'Entreprise
                        </label>
                        <select
                          value={companyType}
                          onChange={(e) => setCompanyType(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        >
                          <option value="PME / ETI">PME / ETI</option>
                          <option value="Grand Compte / Multinationale">Grand Compte / Multinationale</option>
                          <option value="Cabinet RH & Recrutement">Cabinet RH & Recrutement</option>
                          <option value="Startup / Tech">Startup / Tech</option>
                          <option value="ONG & Institution">ONG & Institution</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {accountType === "business" ? "Email Professionnel *" : "Adresse Email *"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={accountType === "business" ? "recrutement@entreprise.ci" : "votre.email@exemple.com"}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label={showPassword ? "Masquer" : "Afficher"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Barre de force du mot de passe */}
                  {password && (
                    <div className="pt-1 space-y-1">
                      <div className="flex gap-1 h-1.5">
                        <div
                          className={`flex-1 rounded-full ${
                            passwordStrength >= 1 ? "bg-rose-500" : "bg-slate-800"
                          }`}
                        />
                        <div
                          className={`flex-1 rounded-full ${
                            passwordStrength >= 2 ? "bg-amber-500" : "bg-slate-800"
                          }`}
                        />
                        <div
                          className={`flex-1 rounded-full ${
                            passwordStrength >= 3 ? "bg-blue-500" : "bg-slate-800"
                          }`}
                        />
                        <div
                          className={`flex-1 rounded-full ${
                            passwordStrength >= 4 ? "bg-emerald-500" : "bg-slate-800"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Acceptation des conditions */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-xs text-slate-400 leading-relaxed">
                      J'accepte les{" "}
                      <Link href="/terms" target="_blank" className="text-blue-400 hover:underline">
                        Conditions Générales
                      </Link>{" "}
                      et la politique de confidentialité OHADA.
                    </span>
                  </label>
                </div>

                {/* Bouton de création */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 px-4 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] mt-2 ${
                    accountType === "business"
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/25"
                      : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-600/30"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Création de votre compte...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {selectedPlan === "free"
                          ? "Créer mon compte et accéder au tableau de bord"
                          : `Créer mon compte (${currentPlan?.price || ""})`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Séparateur */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-900 text-slate-500 uppercase tracking-wider font-semibold">
                    Vous avez déjà un compte ?
                  </span>
                </div>
              </div>

              {/* Bouton de redirection vers /login */}
              <Link
                href={redirectParam ? `/login?redirect=${redirectParam}` : "/login"}
                className="block w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs sm:text-sm transition-all text-center"
              >
                Se connecter à un compte existant
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
