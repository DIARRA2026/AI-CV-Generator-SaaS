"use client";

import React, { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";
import { SupabaseService } from "@/lib/supabaseService";
import { StorageManager } from "@/lib/storage";
import { PlanTier } from "@/lib/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get("redirect") || "/dashboard";
  const planParam = (searchParams.get("plan") as PlanTier) || null;
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam ? "Veuillez vous connecter pour accéder à cette page." : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Garde client : si déjà authentifié, redirection immédiate vers le dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (StorageManager.isLoggedIn()) {
        router.replace(redirectParam.startsWith("/") ? redirectParam : "/dashboard");
      }
    }
  }, [router, redirectParam]);

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

    setIsLoading(true);

    try {
      const res = await SupabaseService.signIn(cleanEmail, password);

      if (!res.success) {
        if (res.emailVerificationRequired) {
          setErrorMessage(
            "Votre adresse email n'a pas encore été confirmée. Veuillez vérifier votre boîte de réception ou saisir le code de validation reçu."
          );
        } else {
          setErrorMessage(
            res.message || "Adresse email ou mot de passe incorrect. Veuillez réessayer."
          );
        }
        setIsLoading(false);
        return;
      }

      // Connexion réussie
      setSuccessMessage("Connexion réussie ! Redirection vers votre espace...");

      // Mémoriser la formule sélectionnée si présente dans l'URL
      if (planParam && planParam !== "free") {
        StorageManager.setPendingCheckoutPlan(planParam, true);
      }

      // Synchroniser le cookie de session pour le middleware
      const sessionUser = StorageManager.getUser();
      const tokenValue = encodeURIComponent(sessionUser?.token || `auth_${cleanEmail}`);
      document.cookie = `moncv_auth_token=${tokenValue}; path=/; max-age=2592000; SameSite=Lax`;

      // Déclencher l'événement de mise à jour pour les composants
      window.dispatchEvent(new Event("storage"));

      // Redirection automatique vers /dashboard (ou vers la route demandée)
      setTimeout(() => {
        const destination = redirectParam.startsWith("/") ? redirectParam : "/dashboard";
        router.replace(destination);
      }, 400);
    } catch (err: any) {
      console.error("Erreur inattendue lors de la connexion:", err);
      setErrorMessage("Une erreur réseau est survenue. Veuillez vérifier votre connexion.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Halo décoratif d'arrière-plan */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* En-tête avec Logo MonCV.ai */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
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
          Connexion à votre espace
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          Accédez à votre tableau de bord, vos CVs professionnels ATS, votre portfolio et vos offres actives.
        </p>
      </div>

      {/* Carte du formulaire de connexion */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Badge de réassurance OHADA / Sécurité */}
          <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Espace Client Sécurisé • Conforme OHADA</span>
          </div>

          {/* Bannière de message d'erreur */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Bannière de message de succès */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champ Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider"
              >
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-300 uppercase tracking-wider"
                >
                  Mot de passe
                </label>
                <Link
                  href="/auth/reset-password"
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Case "Se souvenir de moi" */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-400 font-medium">
                  Se souvenir de cet appareil
                </span>
              </label>
            </div>

            {/* Bouton de Soumission */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter à mon espace</span>
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
                Nouveau sur MonCV.ai ?
              </span>
            </div>
          </div>

          {/* Lien vers Inscription */}
          <div className="space-y-2 text-center">
            <Link
              href={planParam ? `/signup?plan=${planParam}` : "/signup"}
              className="block w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs sm:text-sm transition-all text-center"
            >
              Créer un compte gratuitement
            </Link>
            <p className="text-[11px] text-slate-500">
              Créez votre CV certifié ATS et votre Portfolio Web en 2 minutes.
            </p>
          </div>
        </div>

        {/* Pied de page confidentiel */}
        <p className="mt-6 text-center text-xs text-slate-500">
          En vous connectant, vous acceptez nos{" "}
          <Link href="/terms" className="text-slate-400 hover:text-white underline">
            Conditions Générales
          </Link>{" "}
          et notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
