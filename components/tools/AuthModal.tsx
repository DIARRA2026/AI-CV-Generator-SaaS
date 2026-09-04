"use client";

import React, { useState, useEffect } from "react";
import {
  X, Mail, Lock, User, Eye, EyeOff, Sparkles, LogIn,
  UserPlus, Phone, CheckCircle2, ArrowRight, Loader2, ShieldCheck,
  KeyRound, AlertTriangle, ArrowLeft, RefreshCw, Info
} from "lucide-react";
import { StorageManager } from "@/lib/storage";
import { SupabaseService } from "@/lib/supabaseService";
import { CountryCityPicker } from "@/components/tools/CountryCityPicker";
import { getDialCodeForCountry } from "@/lib/geoData";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMode?: "login" | "register";
}

export const AuthModal: React.FC<Props> = ({
  isOpen, onClose, onSuccess, defaultMode = "register",
}) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Form fields
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Côte d'Ivoire");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Sécurité Avancée & Rate Limiting (4 tentatives maximum)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [emailVerificationPending, setEmailVerificationPending] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendEmailMessage, setResendEmailMessage] = useState<string | null>(null);

  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Compte à rebours de déverrouillage de sécurité
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setSecondsRemaining(0);
        setFailedAttempts(0);
      } else {
        setSecondsRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Réinitialisation stricte : formulaires 100% vierges et vides sans aucune pré-remplissage
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setErrors({});
      setDone(false);
      setIsLoading(false);
      setResetSuccessMessage(null);
      setEmailVerificationPending(null);

      // TOUS LES CHAMPS SONT STRICTEMENT VIDES DÈS L'OUVERTURE
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setConfirmPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setCountry("Côte d'Ivoire");
      setCity("");
      setRememberMe(false);
      StorageManager.clearRememberedCreds();
    }
  }, [isOpen, defaultMode]);

  const switchMode = (m: "login" | "register" | "forgot", preserveEmail?: string) => {
    setMode(m);
    setErrors({});
    if (preserveEmail) {
      setEmail(preserveEmail);
    } else {
      setEmail("");
    }
    setPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setCity("");
    setConfirmPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetSuccessMessage(null);
    StorageManager.clearRememberedCreds();
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      e.email = "Email valide requis";
    }

    if (mode === "register") {
      if (!firstName.trim()) e.firstName = "Prénom requis";
      if (!lastName.trim()) e.lastName = "Nom requis";
      if (!phone.trim()) e.phone = "Téléphone requis";
      if (password.length < 6) e.password = "Minimum 6 caractères";
      if (password !== confirmPassword) {
        e.confirmPassword = "Les mots de passe ne correspondent pas";
      }
    }

    if (mode === "login") {
      if (!password) e.password = "Mot de passe requis";
    }

    if (mode === "forgot") {
      if (newPassword.length < 6) e.newPassword = "Minimum 6 caractères";
      if (newPassword !== confirmNewPassword) {
        e.confirmNewPassword = "Les mots de passe ne correspondent pas";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
  };

  const handleResendEmail = async () => {
    const targetEmail = emailVerificationPending || email;
    if (!targetEmail) return;
    setIsResendingEmail(true);
    setResendEmailMessage(null);
    const res = await SupabaseService.resendConfirmationEmail(targetEmail);
    setIsResendingEmail(false);
    setResendEmailMessage(res.message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Contrôle strict de verrouillage local (4 tentatives max)
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const min = Math.ceil(secondsRemaining / 60);
      setErrors({
        loginBlocked: `Verrouillage de sécurité actif (4 tentatives atteintes). Veuillez patienter ${min} minute(s).`,
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    // ÉTAPE 1 : VALIDATION CÔTÉ SERVEUR & RATE LIMITING SERVEUR
    try {
      const serverRes = await fetch("/api/auth/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          email,
          password,
          firstName,
          lastName,
          phone,
          country,
          city,
        }),
      });

      const serverData = await serverRes.json();
      if (!serverRes.ok) {
        setIsLoading(false);
        if (serverRes.status === 429) {
          const resetSec = serverData.resetInSeconds || 900;
          setLockoutUntil(Date.now() + resetSec * 1000);
          setSecondsRemaining(resetSec);
          setErrors({
            loginBlocked: serverData.error || "Trop de tentatives (maximum 4). Accès temporairement bloqué.",
          });
          return;
        }
        if (serverData.errors) {
          setErrors(serverData.errors);
          return;
        }
      }
    } catch {
      // Tolérance réseau en mode déconnecté
    }

    await new Promise((r) => setTimeout(r, 400));

    // MODE 1 : INSCRIPTION (Cloud Supabase avec repli local sécurisé)
    if (mode === "register") {
      const regResult = await SupabaseService.signUp({
        firstName,
        lastName,
        email,
        phone,
        country,
        city,
        password,
      });

      if (!regResult.success) {
        setIsLoading(false);
        setErrors({ general: regResult.message || "Erreur lors de la création du compte." });
        return;
      }

      if (rememberMe) {
        StorageManager.setRememberedCreds({ email: email.trim(), password });
      } else {
        StorageManager.clearRememberedCreds();
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      // Cas de vérification d'email requise par Supabase Cloud
      if (regResult.emailVerificationRequired) {
        setIsLoading(false);
        setEmailVerificationPending(email);
        return;
      }

      setIsLoading(false);
      setDone(true);
      await new Promise((r) => setTimeout(r, 500));
      onSuccess();
      onClose();
      return;
    }

    // MODE 2 : CONNEXION (Cloud Supabase avec repli local sécurisé & Rate Limiting 4 tentatives)
    if (mode === "login") {
      const authResult = await SupabaseService.signIn(email, password);

      if (!authResult.success) {
        setIsLoading(false);

        // Cas 1 : L'email n'a pas encore été confirmé
        if (authResult.emailVerificationRequired) {
          setEmailVerificationPending(email);
          return;
        }

        // Cas 2 : Aucun compte n'a été trouvé avec cet email (ne consomme pas de tentative)
        if (authResult.userNotFound) {
          setErrors({
            userNotFound: authResult.message || `Aucun compte n'a été trouvé avec l'adresse ${email}.`,
          });
          return;
        }

        // Cas 3 : Mot de passe incorrect
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        // Notifier le serveur d'une tentative infructueuse
        fetch("/api/auth/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fail", email }),
        }).catch(() => {});

        // Seuil strict de 4 tentatives maximum
        if (nextAttempts >= 4) {
          const lockTime = Date.now() + 15 * 60 * 1000;
          setLockoutUntil(lockTime);
          setSecondsRemaining(15 * 60);
          setErrors({
            loginBlocked: "Sécurité activée : Seuil de 4 tentatives consécutives atteint. Votre compte est verrouillé pendant 15 minutes.",
          });
        } else {
          setErrors({
            wrongPassword: `${authResult.message || "Mot de passe incorrect."} (Tentative ${nextAttempts}/4)`,
          });
        }
        return;
      }

      // Connexion réussie : réinitialisation du compteur de tentatives local et serveur
      setFailedAttempts(0);
      setLockoutUntil(null);
      setErrors({});

      fetch("/api/auth/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", email }),
      }).catch(() => {});

      if (rememberMe) {
        StorageManager.setRememberedCreds({ email: email.trim(), password });
      } else {
        StorageManager.clearRememberedCreds();
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      setIsLoading(false);
      setDone(true);
      await new Promise((r) => setTimeout(r, 500));
      onSuccess();
      onClose();
      return;
    }

    // MODE 3 : MOT DE PASSE OUBLIÉ (Modification fonctionnelle avec l'email du compte)
    if (mode === "forgot") {
      const resetResult = StorageManager.resetPasswordByEmail(email, newPassword);

      if (!resetResult.success) {
        setIsLoading(false);
        setErrors({ forgot: resetResult.message || "Erreur lors de la réinitialisation." });
        return;
      }

      setIsLoading(false);
      setResetSuccessMessage("Votre mot de passe a été modifié avec succès !");
      setPassword(newPassword);
      setNewPassword("");
      setConfirmNewPassword("");

      setTimeout(() => {
        switchMode("login", email);
      }, 1200);
      return;
    }
  };



  // ÉCRAN SPÉCIFIQUE : CONFIRMATION D'EMAIL REQUISE (Supabase Cloud Auth)
  if (emailVerificationPending) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md fade-in overflow-y-auto"
        onMouseDown={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] p-6 text-center border border-slate-100 relative my-auto"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-600 shadow-sm">
            <Mail className="w-7 h-7 animate-bounce" />
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Vérifiez votre boîte de réception
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Un email de confirmation d'activation vient d'être envoyé à :
          </p>
          <div className="my-2.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-blue-600 break-all inline-block border border-slate-200">
            {emailVerificationPending}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
            Veuillez cliquer sur le lien dans le message pour activer votre compte. Vérifiez également votre dossier <strong>Spam / Courriers indésirables</strong>.
          </p>

          {/* Bouton Renvoyer le mail de confirmation */}
          <div className="space-y-2 mb-4">
            <button
              type="button"
              disabled={isResendingEmail}
              onClick={handleResendEmail}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResendingEmail ? "animate-spin text-blue-600" : "text-slate-500"}`} />
              <span>{isResendingEmail ? "Envoi en cours..." : "Renvoyer l'email de confirmation"}</span>
            </button>
            {resendEmailMessage && (
              <p className="text-[10.5px] font-semibold text-blue-700 bg-blue-50 py-1.5 px-2.5 rounded-lg border border-blue-200">
                {resendEmailMessage}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setEmailVerificationPending(null);
              switchMode("login");
            }}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>J'ai vérifié mon email • Me connecter</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/75 backdrop-blur-md fade-in overflow-y-auto"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[430px] max-h-[92vh] overflow-hidden relative flex flex-col transform transition-all border border-slate-100 my-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Barre dégradée supérieure d'accentuation */}
        <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shrink-0" />

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1 hover:bg-slate-100 rounded-lg transition-colors z-10 cursor-pointer text-slate-400 hover:text-slate-600"
          aria-label="Fermer la fenêtre"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* En-tête élégant et ultra-compact */}
        <div className="px-4 pt-3 pb-1 text-center shrink-0">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100/80 mb-1">
            <Sparkles className="w-2.5 h-2.5 text-blue-600" />
            <span className="text-[9px] font-bold text-blue-800 tracking-wide uppercase">
              MonCV.ai • INNOVA GROUP
            </span>
          </div>

          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {mode === "login"
              ? "Connexion à votre espace candidat"
              : mode === "register"
              ? "Créer votre compte candidat"
              : "Modifier votre mot de passe"}
          </h2>
          <p className="text-slate-500 text-[10.5px] mt-0.5 max-w-xs mx-auto">
            {mode === "login"
              ? "Retrouvez vos CVs ATS et votre Portfolio Web VIP"
              : mode === "register"
              ? "Générez des CVs certifiés ATS et décrochez des entretiens"
              : "Indiquez l'email de votre compte pour redéfinir un mot de passe"}
          </p>
        </div>

        {/* Onglets Segmentés Choix Mode */}
        {mode !== "forgot" ? (
          <div className="flex mx-4 mb-2 bg-slate-100/90 p-0.5 rounded-lg shrink-0 border border-slate-200/50">
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "register"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UserPlus className="w-3 h-3" />
              <span>S'inscrire</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "login"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LogIn className="w-3 h-3" />
              <span>Se connecter</span>
            </button>
          </div>
        ) : (
          <div className="mx-4 mb-2">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Retour à la connexion</span>
            </button>
          </div>
        )}

        {/* Corps de formulaire défilant avec fluidité */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {/* Alerte Bloquante Anti-Brute-Force (4 tentatives max) */}
          {lockoutUntil && Date.now() < lockoutUntil ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-[11px] animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-black text-red-800 block text-xs">
                  Sécurité Déclenchée : 4 Tentatives Atteintes
                </span>
                <p className="text-red-700 leading-tight">
                  Pour protéger votre compte contre toute attaque, l'accès est temporairement suspendu.
                </p>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-100/80 rounded font-mono font-bold text-red-900 text-[10.5px]">
                  <span>Temps restant :</span>
                  <span>{Math.floor(secondsRemaining / 60)}m {String(secondsRemaining % 60).padStart(2, "0")}s</span>
                </div>
              </div>
            </div>
          ) : mode === "login" && failedAttempts > 0 && failedAttempts < 4 ? (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-800 text-[10.5px]">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Tentatives restantes avant blocage :</span>
              </div>
              <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded font-black text-[10px]">
                {4 - failedAttempts} sur 4
              </span>
            </div>
          ) : null}

          {/* Compte introuvable : Proposition d'inscription en 1 clic */}
          {errors.userNotFound && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col gap-2 text-blue-900 text-xs">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-blue-900">Compte introuvable</span>
                  <span className="text-[11px] text-blue-700 leading-snug">{errors.userNotFound}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchMode("register", email)}
                className="w-full mt-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Créer mon compte avec cet email</span>
              </button>
            </div>
          )}

          {/* Mot de passe incorrect : Message clair et lien vers réinitialisation */}
          {errors.wrongPassword && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2 text-amber-900 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-amber-900">Identifiants incorrects</span>
                  <span className="text-[11px] text-amber-700 leading-snug">{errors.wrongPassword}</span>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => switchMode("forgot", email)}
                  className="text-[11px] text-amber-800 hover:text-amber-950 underline font-semibold cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>
          )}

          {/* Alerte Sécurité Déclenchée */}
          {errors.loginBlocked && !lockoutUntil && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Sécurité temporaire</span>
                <span>{errors.loginBlocked}</span>
              </div>
            </div>
          )}

          {/* Alerte Erreur Inscription Générale */}
          {errors.general && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Alerte Erreur Réinitialisation */}
          {errors.forgot && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <span>{errors.forgot}</span>
            </div>
          )}

          {/* Message Succès Réinitialisation */}
          {resetSuccessMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}



          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-2">
            {/* === FORMULAIRE D'INSCRIPTION : GRILLE ULTRA-COMPACTE 2 COLONNES === */}
            {mode === "register" && (
              <div className="space-y-2">
                {/* Ligne 1 : Prénom et Nom */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Prénom */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2.5 py-1.5 transition-all ${errors.firstName ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ex: Jean-Marc"
                        autoComplete="off"
                        className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 min-w-0 font-medium"
                      />
                    </div>
                    {errors.firstName && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.firstName}</p>}
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Nom de famille <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2.5 py-1.5 transition-all ${errors.lastName ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ex: Kouassi"
                        autoComplete="off"
                        className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 min-w-0 font-medium"
                      />
                    </div>
                    {errors.lastName && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Ligne 2 : Email et Téléphone WhatsApp */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Adresse Email <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2.5 py-1.5 transition-all ${errors.email ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="email"
                        name="mc_auth_email"
                        id="mc_auth_email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nom@exemple.com"
                        autoComplete="off"
                        data-lpignore="true"
                        className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 min-w-0 font-medium"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.email}</p>}
                  </div>

                  {/* Numéro de Téléphone (WhatsApp / Mobile) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center justify-between">
                      <span>Mobile / WhatsApp <span className="text-red-500">*</span></span>
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded border border-blue-100">
                        {getDialCodeForCountry(country)}
                      </span>
                    </label>
                    <div className={`flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2.5 py-1.5 transition-all ${errors.phone ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="tel"
                        name="mc_auth_phone"
                        id="mc_auth_phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07 00 00 00 00"
                        autoComplete="off"
                        data-lpignore="true"
                        className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 min-w-0 font-medium"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.phone}</p>}
                  </div>
                </div>

                {/* Ligne 3 : Pays & Ville de résidence (Intégration compacte) */}
                <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-200/70">
                  <CountryCityPicker
                    selectedCountry={country}
                    selectedCity={city}
                    onCountryChange={handleCountryChange}
                    onCityChange={setCity}
                    countryLabel="Pays de résidence"
                    cityLabel="Ville / Commune"
                    required={true}
                    compact={true}
                  />
                </div>

                {/* Ligne 4 : Mot de Passe & Confirmation */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Mot de Passe */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Mot de Passe <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2.5 py-1.5 transition-all ${errors.password ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="mc_auth_password"
                        id="mc_auth_password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 car."
                        autoComplete="new-password"
                        data-lpignore="true"
                        className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 min-w-0 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.password}</p>}
                  </div>

                  {/* Confirmer le Mot de Passe */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Confirmer <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2.5 py-1.5 transition-all ${errors.confirmPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Répéter..."
                        autoComplete="new-password"
                        data-lpignore="true"
                        className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 min-w-0 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* === FORMULAIRE DE CONNEXION : COMPACT ET ÉLÉGANT === */}
            {mode === "login" && (
              <div className="space-y-2.5 max-w-sm mx-auto py-1">
                {/* Email */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                    Adresse Email <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.email ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      name="mc_auth_email"
                      id="mc_auth_email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre.email@exemple.com"
                      autoComplete="off"
                      data-lpignore="true"
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.email}</p>}
                </div>

                {/* Mot de Passe */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                    Mot de Passe <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.password ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="mc_auth_password"
                      id="mc_auth_password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      autoComplete="new-password"
                      data-lpignore="true"
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.password}</p>}
                </div>

                {/* Options additionnelles : Mémoriser & Mot de passe oublié */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-slate-600 font-medium">
                      Mémoriser
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
            )}

            {/* === FORMULAIRE MOT DE PASSE OUBLIÉ === */}
            {mode === "forgot" && (
              <div className="space-y-2.5 max-w-sm mx-auto py-1">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                    Adresse Email du compte <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.email ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      autoComplete="off"
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                    Nouveau Mot de Passe <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.newPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 caractères"
                      autoComplete="new-password"
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                    Confirmer le Nouveau Mot de Passe <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.confirmNewPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      autoComplete="new-password"
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.confirmNewPassword && <p className="text-red-500 text-[9.5px] mt-0.5">{errors.confirmNewPassword}</p>}
                </div>
              </div>
            )}

            {/* === SECTION D'ACTION ET VALIDATION === */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={isLoading || done || Boolean(lockoutUntil && Date.now() < lockoutUntil)}
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                  lockoutUntil && Date.now() < lockoutUntil
                    ? "bg-slate-400 cursor-not-allowed opacity-75"
                    : done
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/20 active:scale-[0.99]"
                }`}
              >
                {lockoutUntil && Date.now() < lockoutUntil ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Accès temporairement suspendu</span>
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {mode === "login"
                        ? "Vérification..."
                        : mode === "register"
                        ? "Création du compte..."
                        : "Mise à jour..."}
                    </span>
                  </>
                ) : done ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {mode === "login" ? "Connexion réussie !" : "Compte créé !"}
                    </span>
                  </>
                ) : (
                  <>
                    {mode === "login" ? (
                      <LogIn className="w-3.5 h-3.5" />
                    ) : mode === "register" ? (
                      <Sparkles className="w-3.5 h-3.5" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {mode === "login"
                        ? "Se connecter"
                        : mode === "register"
                        ? "Créer mon Compte Gratuit"
                        : "Valider le mot de passe"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Indicateur de sécurité */}
              <div className="flex items-center justify-center gap-1.5 text-[9.5px] text-slate-400 pt-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Chiffrement SSL 256 bits • Données protégées par Supabase Cloud</span>
              </div>

              {/* Lien bascule mode */}
              {mode !== "forgot" && (
                <p className="text-center text-[11px] text-slate-500 pt-1">
                  {mode === "register" ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === "login" ? "register" : "login")}
                    className="text-blue-600 font-bold hover:underline cursor-pointer ml-1"
                  >
                    {mode === "register" ? "Se connecter" : "Créer un compte"}
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
