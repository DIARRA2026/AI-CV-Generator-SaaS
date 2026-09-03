"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

interface Activity {
  countryFlag: string;
  name: string;
  city: string;
  action: string;
  timeAgo: string;
}

const ACTIVITIES: Activity[] = [
  { countryFlag: "🇨🇮", name: "Kouamé A.", city: "Abidjan, Côte d'Ivoire", action: "a téléchargé son CV Pro optimisé ATS", timeAgo: "Il y a 2 min" },
  { countryFlag: "🇸🇳", name: "Fatou D.", city: "Dakar, Sénégal", action: "a activé le Pack VIP & Portfolio Web", timeAgo: "Il y a 4 min" },
  { countryFlag: "🇨🇲", name: "Samuel E.", city: "Douala, Cameroun", action: "a généré sa lettre de motivation STAR", timeAgo: "Il y a 6 min" },
  { countryFlag: "🇧🇫", name: "Ibrahim O.", city: "Ouagadougou, Burkina Faso", action: "a converti son ancien CV en modèle Moderne", timeAgo: "Il y a 9 min" },
  { countryFlag: "🇲🇱", name: "Aminata T.", city: "Bamako, Mali", action: "a obtenu un score ATS de 98/100", timeAgo: "Il y a 11 min" },
  { countryFlag: "🇧🇯", name: "Rodrigue K.", city: "Cotonou, Bénin", action: "a créé une Demande d'Emploi Pro", timeAgo: "Il y a 13 min" },
  { countryFlag: "🇫🇷", name: "Sarah B.", city: "Paris, France", action: "a débloqué le téléchargement PDF Haute Définition", timeAgo: "Il y a 15 min" },
];

export const LiveSocialProofToast: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    // Premier affichage après 4 secondes
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Rotation toutes les 12 secondes
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setIsVisible(true);
      }, 700);
    }, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isDismissed]);

  if (isDismissed || !isVisible) return null;

  const current = ACTIVITIES[currentIndex];

  return (
    <aside
      aria-label="Activité récente des candidats"
      className="fixed bottom-5 left-5 z-40 max-w-[340px] w-[calc(100%-2.5rem)] sm:w-auto bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200/90 slide-up flex items-start gap-3 no-print transition-all duration-300 pointer-events-auto"
    >
      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg shrink-0 shadow-xs">
        {current.countryFlag}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11.5px] font-bold text-slate-900 truncate">
            {current.name} <span className="text-[10px] font-medium text-slate-400">({current.city.split(",")[0]})</span>
          </p>
          <span className="text-[9.5px] font-semibold text-emerald-600 shrink-0 flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {current.timeAgo}
          </span>
        </div>
        <p className="text-[10.5px] text-slate-600 font-medium leading-tight mt-0.5">
          {current.action}
        </p>
      </div>

      <button
        onClick={() => setIsDismissed(true)}
        className="text-slate-300 hover:text-slate-500 p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer"
        title="Masquer"
        aria-label="Fermer la notification d'activité"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
