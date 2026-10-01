"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  KeyRound,
  ShieldCheck,
  Mail,
  ArrowRight,
  RefreshCw,
  Home,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { StorageManager } from "@/lib/storage";

type ResetStatus = "loading" | "ready" | "otp_mode" | "success" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ResetStatus>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Mode OTP direct (Email + Code 6 chiffres)
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Détection automatique de session ou de jeton dans l'URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    const initAuth = async () => {
      if (!supabase) {
        if (isMounted) setStatus("otp_mode");
        return;
      }

      // 1. Écouter les événements d'authentification (ex: PASSWORD_RECOVERY ou SIGNED_IN)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
          setStatus("ready");
        }
      });

      try {
        // 2. Vérifier les paramètres de recherche (Query Params)
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const authError = searchParams.get("auth_error") || searchParams.get("error_description");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && isMounted) {
            setStatus("ready");
            return;
          }
        }

        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (!error && isMounted) {
            setStatus("ready");
            return;
          }
        }

        // 3. Vérifier le hash d'URL (#access_token=...&type=recovery)
        const hash = window.location.hash.substring(1);
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const type = hashParams.get("type");
          const accessToken = hashParams.get("access_token");

          if (accessToken && (type === "recovery" || !type)) {
            if (isMounted) setStatus("ready");
            return;
          }
        }

        // 4. Vérifier s'il y a déjà une session active
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          if (isMounted) setStatus("ready");
          return;
        }

        // Si aucun jeton n'a été validé et qu'il y avait une erreur explicite
        if (authError && isMounted) {
          setErrorMessage("Le lien a expiré ou est invalide. Vous pouvez saisir votre code à 6 chiffres ci-dessous.");
          setStatus("otp_mode");
          return;
        }

        // Par défaut après un délai, proposer le formulaire ou le mode OTP
        setTimeout(() => {
          if (isMounted && status === "loading") {
            setStatus("ready");
          }
        }, 1200);
      } catch {
        if (isMounted) setStatus("otp_mode");
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Décompte automatique après succès
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) {
      router.push("/");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  // Validation et enregistrement du nouveau mot de passe (Session active)
  const handleSubmitSession = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);

      if (password.length < 6) {
        setErrorMessage("Le mot de passe doit comporter au moins 6 caractères.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Les mots de passe ne correspondent pas.");
        return;
      }

      setIsSubmitting(true);

      try {
        if (supabase) {
          const { data, error } = await supabase.auth.updateUser({ password });
          if (error) {
            throw new Error(error.message);
          }

          // Synchroniser également avec le registre local si l'email est connu
          const userEmail = data.user?.email;
          if (userEmail) {
            StorageManager.resetPasswordByEmail(userEmail, password);
          }
        } else {
          // Mode secours local
          if (otpEmail) {
            StorageManager.resetPasswordByEmail(otpEmail, password);
          }
        }

        setStatus("success");
      } catch (err: any) {
        const msg = err.message || "Une erreur est survenue.";
        if (msg.toLowerCase().includes("session") || msg.toLowerCase().includes("auth")) {
          setErrorMessage(
            "Votre session de réinitialisation a expiré. Veuillez utiliser votre code à 6 chiffres ou redemander un lien."
          );
          setStatus("otp_mode");
        } else {
          setErrorMessage(msg);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [password, confirmPassword, otpEmail]
  );

  // Validation et enregistrement avec Code OTP 6 chiffres + Email
  const handleSubmitOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);

      const cleanEmail = otpEmail.trim().toLowerCase();
      const cleanOtp = otpCode.trim().replace(/\D/g, "");

      if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
        setErrorMessage("Veuillez renseigner une adresse email valide.");
        return;
      }
      if (cleanOtp.length !== 6) {
        setErrorMessage("Veuillez renseigner l'intégralité du code à 6 chiffres.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Le nouveau mot de passe doit comporter au moins 6 caractères.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Les mots de passe ne correspondent pas.");
        return;
      }

      setIsSubmitting(true);

      try {
        if (supabase) {
          // 1. Valider le code OTP de récupération
          let verifyRes = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanOtp,
            type: "recovery",
          });

          // Deuxième essai avec type email si la configuration Supabase l'exige
          if (verifyRes.error) {
            verifyRes = await supabase.auth.verifyOtp({
              email: cleanEmail,
              token: cleanOtp,
              type: "email",
            });
          }

          if (verifyRes.error) {
            throw new Error(
              verifyRes.error.message.includes("expired")
                ? "Ce code à 6 chiffres a expiré. Veuillez redemander un nouveau lien."
                : "Code de vérification incorrect. Vérifiez vos emails."
            );
          }

          // 2. Mettre à jour le mot de passe
          const { error: updateError } = await supabase.auth.updateUser({ password });
          if (updateError) {
            throw new Error(updateError.message);
          }
        }

        // 3. Mise à jour dans le stockage local
        StorageManager.resetPasswordByEmail(cleanEmail, password);

        setStatus("success");
      } catch (err: any) {
        setErrorMessage(err.message || "Erreur lors de la réinitialisation.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [otpEmail, otpCode, password, confirmPassword]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* En-tête marque MonCV.ai */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
              MonCV.ai • INNOVA GROUP
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Barre supérieure en dégradé */}
          <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

          <div className="p-6 sm:p-8">
            {/* ÉTAT : CHARGEMENT INITIAL */}
            {status === "loading" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto">
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Vérification de sécurité...</h2>
                  <p className="text-xs text-slate-500 mt-1">Préparation de votre session sécurisée.</p>
                </div>
              </div>
            )}

            {/* ÉTAT : LIEN EXPIRÉ */}
            {status === "invalid" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Lien expiré ou introuvable</h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Les liens de sécurité expirent automatiquement après 1 heure. Vous pouvez réinitialiser avec votre code à 6 chiffres ou demander un nouveau lien.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setStatus("otp_mode");
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Utiliser mon code à 6 chiffres</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Retour à l&apos;accueil</span>
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAT : FORMULAIRE PRINCIPAL (Session active via lien) */}
            {status === "ready" && (
              <form onSubmit={handleSubmitSession} className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
                    <KeyRound className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Définir votre nouveau mot de passe
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choisissez un mot de passe sécurisé d&apos;au moins 6 caractères.
                  </p>
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Champ Nouveau mot de passe */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Nouveau mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      autoComplete="new-password"
                      autoFocus
                      required
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Champ Confirmer mot de passe */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white transition ${
                      confirmPassword && confirmPassword !== password
                        ? "border-red-400"
                        : confirmPassword && confirmPassword === password
                        ? "border-emerald-400"
                        : "border-slate-200 focus-within:border-blue-500"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      autoComplete="new-password"
                      required
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-emerald-600 text-[10px] flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Mots de passe identiques.
                    </p>
                  )}
                </div>

                {/* Bouton de soumission */}
                <button
                  type="submit"
                  disabled={isSubmitting || password.length < 6}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mise à jour en cours...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Enregistrer mon nouveau mot de passe</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {/* Bascule vers mode code à 6 chiffres */}
                <div className="pt-2 text-center border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setStatus("otp_mode");
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Vous préférez saisir votre code à 6 chiffres ? Cliquez ici
                  </button>
                </div>
              </form>
            )}

            {/* ÉTAT : MODE CODE OTP 6 CHIFFRES */}
            {status === "otp_mode" && (
              <form onSubmit={handleSubmitOtp} className="space-y-3.5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/25">
                    <KeyRound className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Réinitialisation par code à 6 chiffres
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Indiquez votre email, le code reçu et votre nouveau mot de passe.
                  </p>
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Adresse Email <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      required
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>

                {/* Code OTP 6 chiffres */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Code à 6 chiffres reçu par email <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 849201"
                      required
                      className="flex-1 bg-transparent text-xs tracking-widest font-black focus:outline-none placeholder-slate-400 text-blue-900"
                    />
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Nouveau mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      autoComplete="new-password"
                      required
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmer */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      autoComplete="new-password"
                      required
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || password.length < 6 || otpCode.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Vérification et mise à jour...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Valider le code & Changer le mot de passe</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setStatus("ready");
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    Retour au mode lien
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Retour à l&apos;accueil
                  </button>
                </div>
              </form>
            )}

            {/* ÉTAT : SUCCÈS */}
            {status === "success" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Mot de passe modifié avec succès !
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Vous pouvez désormais vous connecter avec vos nouveaux identifiants. Redirection automatique dans{" "}
                    <strong className="text-blue-600">{countdown}s</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  Se connecter maintenant
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
