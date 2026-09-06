"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { SupportedLanguage } from "@/lib/i18n";
import { Globe, Check, ChevronDown } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "navbar" | "compact" | "footer" | "mobile";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "navbar",
  className = "",
}) => {
  const { language, setLanguage, availableLanguages, currentLanguageOption, isRTL } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === "mobile") {
    return (
      <div className={`w-full py-2 ${className}`}>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentLanguageOption.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {availableLanguages.map((lang) => {
            const isCurrent = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isCurrent
                    ? "bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer"
        >
          <span className="text-sm leading-none">{currentLanguageOption.flag}</span>
          <span>{currentLanguageOption.nativeName}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
            {availableLanguages.map((lang) => {
              const isCurrent = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    isCurrent
                      ? "text-blue-400 bg-slate-800/60 font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm leading-none">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </div>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Navbar default variant
  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all cursor-pointer btn-press shadow-2xs"
        title="Changer de langue / Switch language / Cambiar idioma / تغيير اللغة"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{currentLanguageOption.flag}</span>
        <span className="uppercase text-[11px] font-black tracking-wide text-slate-800 hidden md:inline">
          {currentLanguageOption.code}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            isRTL ? "left-0" : "right-0"
          } mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100`}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Langue / Language / اللغة
          </div>
          <div className="py-1">
            {availableLanguages.map((lang) => {
              const isCurrent = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                    isCurrent
                      ? "text-blue-600 bg-blue-50/70 font-black"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="text-xs">{lang.nativeName}</span>
                  </div>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
