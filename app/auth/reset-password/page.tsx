"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type ResetStatus = "loading" | "ready" | "success" | "error" | "invalid";

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

  // Supabase détecte automatiquement la session depuis le token dans l'URL (hash fragment)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkSession = async () => {
      if (!supabase) {
        setStatus("invalid");
        return;
      }

      try {
        // Attendre que Supabase parse le token dans l'URL
        await new Promise((r) => setTimeout(r, 800));

        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          // Essayer aussi de récupérer depuis l'URL (PKCE flow)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const type = hashParams.get("type");

          if (accessToken && type === "recovery") {
            // Token valide présent dans l'URL
            setStatus("ready");
          } else {
            setStatus("invalid");
          }
        } else {
          setStatus("ready");
        }
      } catch {
        setStatus("invalid");
      }
    };

    checkSession();
  }, []);

  // Countdown après succès
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) {
      router.push("/");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabase) {
        throw new Error("Service non disponible. Veuillez réessayer.");
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw new Error(error.message);
      }

      setStatus("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirmPassword]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">MonCV.ai • INNOVA GROUP</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

          <div className="p-6 sm:p-8">

            {/* ÉTAT : CHARGEMENT */}
            {status === "loading" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto">
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Vérification du lien...</h2>
                  <p className="text-sm text-slate-500 mt-1">Veuillez patienter quelques secondes.</p>
                </div>
              </div>
            )}

            {/* ÉTAT : LIEN INVALIDE */}
            {status === "invalid" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Lien expiré ou invalide</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Ce lien de réinitialisation n&apos;est plus valide. Les liens expirent après 1 heure.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition"
                >
                  Retour à l&apos;accueil
                </button>
                <p className="text-xs text-slate-500">
                  Demandez un nouveau lien en cliquant sur &quot;Mot de passe oublié ?&quot; depuis la page de connexion.
                </p>
              </div>
            )}

            {/* ÉTAT : FORMULAIRE PRÊT */}
            {status === "ready" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Header */}
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                    <KeyRound className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Créer un nouveau mot de passe</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Choisissez un mot de passe sécurisé d&apos;au moins 6 caractères.
                  </p>
                </div>

                {/* Erreur */}
                {errorMessage && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Champ : Nouveau mot de passe */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nouveau mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      autoComplete="new-password"
                      autoFocus
                      required
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Force indicator */}
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= n * 3
                              ? password.length < 6 ? "bg-red-400" : password.length < 9 ? "bg-amber-400" : "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Champ : Confirmer */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 bg-slate-50 focus-within:bg-white transition ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-400"
                      : confirmPassword && confirmPassword === password
                      ? "border-emerald-400"
                      : "border-slate-200 focus-within:border-blue-500"
                  }`}>
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      autoComplete="new-password"
                      required
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-red-500 text-[10px] mt-0.5">Les mots de passe ne correspondent pas.</p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-emerald-600 text-[10px] mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Les mots de passe correspondent.
                    </p>
                  )}
                </div>

                {/* Bouton Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || password.length < 6}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mise à jour en cours...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Enregistrer le nouveau mot de passe</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Chiffrement SSL 256 bits • Données protégées</span>
                </div>
              </form>
            )}

            {/* ÉTAT : SUCCÈS */}
            {status === "success" && (
              <div className="text-center py-8 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Mot de passe mis à jour !</h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Votre mot de passe a été modifié avec succès. Vous allez être redirigé dans{" "}
                    <strong className="text-blue-600">{countdown}s</strong>.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition"
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
