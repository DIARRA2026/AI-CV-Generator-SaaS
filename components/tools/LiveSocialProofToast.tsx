"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export const LiveSocialProofToast: React.FC = () => {
  const { dict, isRTL } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const activities = useMemo(() => {
    return dict.socialProof?.activities && dict.socialProof.activities.length > 0
      ? dict.socialProof.activities
      : [];
  }, [dict]);

  useEffect(() => {
    if (isDismissed || activities.length === 0) return;

    // Premier affichage après 4 secondes
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Rotation toutes les 12 secondes
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
        setIsVisible(true);
      }, 700);
    }, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isDismissed, activities.length]);

  if (isDismissed || !isVisible || activities.length === 0) return null;

  const current = activities[currentIndex % activities.length];
  if (!current) return null;

  return (
    <aside
      aria-label="Recent activity"
      dir={isRTL ? "rtl" : "ltr"}
      className={`fixed bottom-5 ${
        isRTL ? "right-5" : "left-5"
      } z-40 max-w-[340px] w-[calc(100%-2.5rem)] sm:w-auto bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200/90 slide-up flex items-start gap-3 no-print transition-all duration-300 pointer-events-auto`}
    >
      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg shrink-0 shadow-xs">
        {current.countryFlag}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11.5px] font-bold text-slate-900 truncate">
            {current.name}{" "}
            <span className="text-[10px] font-medium text-slate-400">
              ({current.city?.split(",")[0] || current.city})
            </span>
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
        type="button"
        onClick={() => setIsDismissed(true)}
        className="text-slate-300 hover:text-slate-500 p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer"
        title={dict.common.close}
        aria-label={dict.common.close}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};

