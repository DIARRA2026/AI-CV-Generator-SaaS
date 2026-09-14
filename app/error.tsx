"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur globale capturée par Root Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#14161f] border border-slate-800 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            MonCV.ai Plateforme
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Une mise à jour est disponible
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            L'affichage a rencontré une légère interruption de session. Cliquez sur le bouton ci-dessous pour recharger l'interface en toute sécurité.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recharger l'application</span>
          </button>

          <Link
            href="/?landing=true"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4 text-blue-500" />
            <span>Retour à l'accueil MonCV.ai</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
