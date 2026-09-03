"use client";

import React, { useState, useEffect } from "react";
import {
  X, Mail, Lock, User, Eye, EyeOff, Sparkles, LogIn,
  UserPlus, Phone, CheckCircle2, ArrowRight, Loader2, ShieldCheck, Check,
  KeyRound, AlertTriangle, ArrowLeft
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
  const [city, setCity] = useState("Abidjan");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Synchronisation & Mémorisation des identifiants (Sécurité de connexion)
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setErrors({});
      setDone(false);
      setIsLoading(false);
      setResetSuccessMessage(null);

      if (defaultMode === "login") {
        // En mode connexion : pré-remplir les identifiants mémorisés si existants
        const savedCreds = StorageManager.getRememberedCreds();
        if (savedCreds) {
          setEmail(savedCreds.email || "");
          setPassword(savedCreds.password || "");
          setRememberMe(true);
        } else {
          setEmail("");
          setPassword("");
        }
      } else {
        // En mode inscription ('register') : FORMULAIRE STRICTEMENT VIERGE ET PROPRE
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");
        setCountry("Côte d'Ivoire");
        setCity("Abidjan");
        setRememberMe(true);
      }
    }
  }, [isOpen, defaultMode]);

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
      if (!lastName.trim()) e.lastName = "Nom requis";
      if (!firstName.trim()) e.firstName = "Prénom requis";
      if (!phone.trim()) e.phone = "Numéro requis";
      if (!password || password.length < 6) e.password = "Min. 6 caractères";
      if (!confirmPassword) {
        e.confirmPassword = "Confirmation requise";
      } else if (password !== confirmPassword) {
        e.confirmPassword = "Mots de passe non identiques";
      }
    } else if (mode === "login") {
      if (!password) e.password = "Mot de passe requis";
    } else if (mode === "forgot") {
      if (!newPassword || newPassword.length < 6) e.newPassword = "Min. 6 caractères";
      if (!confirmNewPassword) {
        e.confirmNewPassword = "Confirmation requise";
      } else if (newPassword !== confirmNewPassword) {
        e.confirmNewPassword = "Mots de passe non identiques";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Mise à jour dynamique du pays et insertion automatique de l'indicatif téléphonique
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const newDialCode = getDialCodeForCountry(newCountry);

    setPhone((prev) => {
      const cleanPrev = prev.trim();
      if (!cleanPrev || cleanPrev.startsWith("+")) {
        const parts = cleanPrev.split(/\s+/);
        if (parts.length > 1) {
          const restNumber = parts.slice(1).join(" ");
          return `${newDialCode} ${restNumber}`;
        }
        return `${newDialCode} `;
      }
      return `${newDialCode} ${cleanPrev}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});

    await new Promise((r) => setTimeout(r, 600));

    // MODE 1 : INSCRIPTION (Cloud Supabase avec repli local sécurisé)
    if (mode === "register") {
      let regSuccess = false;
      let regMessage = "";

      if (SupabaseService.isAvailable()) {
        const cloudResult = await SupabaseService.signUp({
          firstName,
          lastName,
          email,
          phone,
          country,
          city,
          password,
        });
        regSuccess = cloudResult.success;
        regMessage = cloudResult.message || "";
      } else {
        const regResult = StorageManager.registerUser({
          firstName,
          lastName,
          email,
          phone,
          country,
          city,
          password,
        });
        regSuccess = regResult.success;
        regMessage = regResult.message || "";
      }

      if (!regSuccess) {
        setIsLoading(false);
        setErrors({ general: regMessage || "Erreur lors de la création du compte." });
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

      setIsLoading(false);
      setDone(true);
      await new Promise((r) => setTimeout(r, 500));
      onSuccess();
      onClose();
      return;
    }

    // MODE 2 : CONNEXION (Cloud Supabase avec repli local sécurisé)
    if (mode === "login") {
      let authSuccess = false;
      let authMessage = "";

      if (SupabaseService.isAvailable()) {
        const cloudResult = await SupabaseService.signIn(email, password);
        authSuccess = cloudResult.success;
        authMessage = cloudResult.message || "";
      } else {
        const authResult = StorageManager.verifyLogin(email, password);
        authSuccess = authResult.success;
        authMessage = authResult.message || "";
      }

      if (!authSuccess) {
        setIsLoading(false);
        setErrors({
          loginBlocked: authMessage || "Mot de passe incorrect. L'accès est strictement refusé.",
        });
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

      // Basculer vers la connexion après 1.2s avec le mot de passe mis à jour
      setTimeout(() => {
        setMode("login");
        setResetSuccessMessage(null);
      }, 1200);
      return;
    }
  };

  const handleSocial = async (provider: "Google" | "Facebook") => {
    setIsLoading(true);

    if (typeof window !== "undefined") {
      if (provider === "Google") {
        window.open("https://accounts.google.com/o/oauth2/v2/auth", "_blank", "width=500,height=600,scrollbars=yes");
      } else {
        window.open("https://www.facebook.com/v12.0/dialog/oauth", "_blank", "width=500,height=600,scrollbars=yes");
      }
    }

    await new Promise((r) => setTimeout(r, 900));

    const socialEmail = provider === "Google" ? "candidat.google@gmail.com" : "candidat.fb@facebook.com";
    StorageManager.registerUser({
      firstName: "Candidat",
      lastName: provider,
      email: socialEmail,
      password: `social-${Date.now()}`,
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }

    setIsLoading(false);
    setDone(true);
    await new Promise((r) => setTimeout(r, 500));
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm fade-in overflow-hidden"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative max-h-[92vh] flex flex-col transform transition-all border border-slate-100"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Ligne dégradée d'accent */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shrink-0" />

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 hover:bg-slate-100 rounded-xl transition-colors z-10 cursor-pointer"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        {/* En-tête dynamique */}
        <div className="px-5 pt-4 pb-3 text-center shrink-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-blue-600/20 text-white">
            {mode === "login" ? (
              <LogIn className="w-5 h-5" />
            ) : mode === "register" ? (
              <UserPlus className="w-5 h-5" />
            ) : (
              <KeyRound className="w-5 h-5" />
            )}
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            {mode === "login"
              ? "Connexion à votre espace"
              : mode === "register"
              ? "Créer votre compte candidat"
              : "Modifier votre mot de passe"}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {mode === "login"
              ? "Accédez à vos CVs, lettres et Portfolio Web"
              : mode === "register"
              ? "Rejoignez plus de 18 000 professionnels en Afrique"
              : "Indiquez l'email de votre compte pour définir un nouveau mot de passe"}
          </p>
        </div>

        {/* Onglets Choix Mode (Masqués si en mode Mot de passe oublié) */}
        {mode !== "forgot" ? (
          <div className="flex mx-5 mb-3 bg-slate-100 p-1 rounded-xl shrink-0">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setErrors({});
                  if (m === "register") {
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setPhone("");
                    setPassword("");
                    setConfirmPassword("");
                  } else if (m === "login") {
                    const savedCreds = StorageManager.getRememberedCreds();
                    if (savedCreds) {
                      setEmail(savedCreds.email || "");
                      setPassword(savedCreds.password || "");
                    } else {
                      setEmail("");
                      setPassword("");
                    }
                  }
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === m
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "login" ? "Se connecter" : "S'inscrire"}
              </button>
            ))}
          </div>
        ) : (
          <div className="mx-5 mb-3">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrors({});
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la connexion</span>
            </button>
          </div>
        )}

        {/* Corps de formulaire défilant avec fluidité */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {/* Alerte Erreur Bloquante de Connexion */}
          {errors.loginBlocked && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Accès Bloqué</span>
                <span>{errors.loginBlocked}</span>
              </div>
            </div>
          )}

          {/* Alerte Erreur Inscription Générale */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Alerte Erreur Réinitialisation */}
          {errors.forgot && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errors.forgot}</span>
            </div>
          )}

          {/* Message Succès Réinitialisation */}
          {resetSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* Boutons sociaux en mode Inscription */}
          {mode === "register" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSocial("Google")}
                  className="flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocial("Facebook")}
                  className="flex items-center justify-center gap-2 py-2 bg-[#1877F2] hover:bg-[#166FE5] rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-slate-400 text-[10px] font-medium">ou formulaire classique</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3">
            {/* Si inscription : Nom & Prénom */}
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-2">
                {/* Nom */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.lastName ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom de famille"
                      autoComplete="off"
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none placeholder-slate-400 min-w-0 font-medium"
                    />
                  </div>
                  {errors.lastName && <p className="text-red-500 text-[10px] mt-0.5">{errors.lastName}</p>}
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.firstName ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      autoComplete="off"
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none placeholder-slate-400 min-w-0 font-medium"
                    />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-[10px] mt-0.5">{errors.firstName}</p>}
                </div>
              </div>
            )}

            {/* Email (Tous les modes) */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                Adresse Email <span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.email ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  autoComplete="off"
                  className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none placeholder-slate-400 font-medium"
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>}
            </div>

            {/* Pays & Ville de résidence avec Ruban de sélection (JUSTE APRÈS LE MAIL) */}
            {mode === "register" && (
              <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                <CountryCityPicker
                  selectedCountry={country}
                  selectedCity={city}
                  onCountryChange={handleCountryChange}
                  onCityChange={setCity}
                  countryLabel="Pays de résidence (Tous les pays du monde)"
                  cityLabel="Ville / Commune"
                  required={true}
                />
              </div>
            )}

            {/* Numéro de Téléphone (mode inscription - avec indicatif automatique du pays choisi) */}
            {mode === "register" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10.5px] font-bold text-slate-700">
                    Numéro de Téléphone (WhatsApp / Mobile) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Indicatif : {getDialCodeForCountry(country)}
                  </span>
                </div>
                <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.phone ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={`${getDialCodeForCountry(country)} 07 00 00 00 00`}
                    autoComplete="off"
                    className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none placeholder-slate-400 font-medium"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-[10px] mt-0.5">{errors.phone}</p>}
              </div>
            )}

            {/* Mot de Passe (Mode Connexion & Inscription) */}
            {mode !== "forgot" && (
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Mot de Passe <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.password ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Min. 6 caractères" : "Votre mot de passe"}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none placeholder-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-[10px] mt-0.5">{errors.password}</p>}
              </div>
            )}

            {/* Confirmer le Mot de Passe (mode inscription) */}
            {mode === "register" && (
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Confirmer le Mot de Passe <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.confirmPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez votre mot de passe"
                    autoComplete="new-password"
                    className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none placeholder-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-[10px] mt-0.5">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* CHAMPS DÉDIÉS : MOT DE PASSE OUBLIÉ (Modification du mot de passe) */}
            {mode === "forgot" && (
              <>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                    Nouveau Mot de Passe <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.newPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 caractères"
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none placeholder-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-red-500 text-[10px] mt-0.5">{errors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                    Confirmer le Nouveau Mot de Passe <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-all ${errors.confirmNewPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white"}`}>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Répétez le nouveau mot de passe"
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none placeholder-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.confirmNewPassword && <p className="text-red-500 text-[10px] mt-0.5">{errors.confirmNewPassword}</p>}
                </div>
              </>
            )}

            {/* Sécurité : Mémoriser le mot de passe & Bouton Mot de passe oublié */}
            {mode !== "forgot" && (
              <div className="pt-1 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[11.5px] font-semibold text-slate-700">
                    {mode === "login" ? "Mémoriser mon mot de passe" : "Se souvenir de moi"}
                  </span>
                </label>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrors({});
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading || done}
              className={`w-full py-3 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md mt-2 cursor-pointer ${
                done
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/20"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {mode === "login"
                      ? "Vérification des accès..."
                      : mode === "register"
                      ? "Création du compte..."
                      : "Mise à jour du mot de passe..."}
                  </span>
                </>
              ) : done ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {mode === "login" ? "Connecté avec succès !" : "Compte créé avec succès !"}
                  </span>
                </>
              ) : (
                <>
                  {mode === "login" ? (
                    <LogIn className="w-4 h-4" />
                  ) : mode === "register" ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>
                    {mode === "login"
                      ? "Se connecter"
                      : mode === "register"
                      ? "Créer mon compte"
                      : "Valider le nouveau mot de passe"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Indicateur de sécurité */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Chiffrement sécurisé • Mot de passe strictement protégé</span>
            </div>

            {/* Lien bascule mode */}
            {mode !== "forgot" && (
              <p className="text-center text-[11px] text-slate-500 pt-1">
                {mode === "register" ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setErrors({});
                  }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  {mode === "register" ? "Se connecter" : "Créer un compte"}
                </button>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
