"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ShieldCheck, KeyRound, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from "lucide-react";

function PreviewAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage("Veuillez saisir le code d'accès de prévisualisation.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/preview-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = redirectUrl;
      } else {
        setErrorMessage(data.error || "Code d'accès incorrect.");
      }
    } catch {
      setErrorMessage("Erreur réseau. Veuillez vérifier votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col justify-between selection:bg-emerald-500/30">
      {/* Top Bar Brand */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            MonCV<span className="text-emerald-400">.ai</span>
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Environnement Privé Sécurisé</span>
        </div>
      </header>

      {/* Main Lock Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Glowing Aura */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-20 transition duration-1000"></div>

            <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
              {/* Header Icon */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-3 tracking-wide uppercase">
                  Version de Prévisualisation
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Accès Confidentiel
                </h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Cette version de test n'est pas encore ouverte au public. Veuillez renseigner votre code d'accès pour explorer la plateforme.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Code d'accès secret
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe d'accès"
                      autoFocus
                      required
                      className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] text-slate-950 font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Déverrouiller l'accès</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Safety notice */}
              <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Protection anti-indexation • Non répertorié sur Google
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-500">
        MonCV.ai • Tous droits réservés • Accès strictement confidentiel
      </footer>
    </div>
  );
}

export default function PreviewAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PreviewAccessContent />
    </Suspense>
  );
}
