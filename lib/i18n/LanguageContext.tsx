"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  SupportedLanguage,
  TranslationDictionary,
  LanguageOption,
  LANGUAGES,
  defaultLanguage,
  translations,
  getLanguageOption,
  isRTL,
} from "./index";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  dict: TranslationDictionary;
  t: (path: string, fallback?: string) => string;
  isRTL: boolean;
  dir: "ltr" | "rtl";
  currentLanguageOption: LanguageOption;
  availableLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "moncv_language";
const COOKIE_KEY = "moncv_lang";

function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === "undefined" || !navigator) return defaultLanguage;
  const navLang = (navigator.language || (navigator as any).userLanguage || "").toLowerCase();

  if (navLang.startsWith("ar")) return "ar";
  if (navLang.startsWith("es")) return "es";
  if (navLang.startsWith("en")) return "en";
  if (navLang.startsWith("fr")) return "fr";

  return defaultLanguage;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(defaultLanguage);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser la langue à partir de localStorage, cookie ou détection navigateur
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (savedLang && ["fr", "en", "es", "ar"].includes(savedLang)) {
        setLanguageState(savedLang);
      } else {
        const detected = detectBrowserLanguage();
        setLanguageState(detected);
        localStorage.setItem(STORAGE_KEY, detected);
        document.cookie = `${COOKIE_KEY}=${detected}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch (e) {
      // Fallback
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Synchroniser les attributs de document (lang et dir)
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
      if (language === "ar") {
        document.body.classList.add("rtl-mode");
      } else {
        document.body.classList.remove("rtl-mode");
      }
    }
  }, [language]);

  const setLanguage = (newLang: SupportedLanguage) => {
    if (!["fr", "en", "es", "ar"].includes(newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `${COOKIE_KEY}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      console.warn("Storage write error", e);
    }
  };

  const dict = useMemo(() => {
    return translations[language] || translations[defaultLanguage];
  }, [language]);

  // Helper de traduction avec notation pointée : t('nav.myCvs')
  const t = (path: string, fallback?: string): string => {
    const parts = path.split(".");
    let current: any = dict;

    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== "object") {
        return fallback || path;
      }
      current = current[part];
    }

    if (typeof current === "string") {
      return current;
    }

    return fallback || path;
  };

  const currentOption = useMemo(() => getLanguageOption(language), [language]);
  const rtlFlag = useMemo(() => isRTL(language), [language]);

  const value = {
    language,
    setLanguage,
    dict,
    t,
    isRTL: rtlFlag,
    dir: (rtlFlag ? "rtl" : "ltr") as "ltr" | "rtl",
    currentLanguageOption: currentOption,
    availableLanguages: LANGUAGES,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fournir un fallback sécurisé si appelé en dehors du provider
    const fallbackDict = translations[defaultLanguage];
    return {
      language: defaultLanguage,
      setLanguage: () => {},
      dict: fallbackDict,
      t: (path: string, fallback?: string) => {
        const parts = path.split(".");
        let current: any = fallbackDict;
        for (const part of parts) {
          if (!current || typeof current !== "object") return fallback || path;
          current = current[part];
        }
        return typeof current === "string" ? current : fallback || path;
      },
      isRTL: false,
      dir: "ltr" as "ltr" | "rtl",
      currentLanguageOption: LANGUAGES[0],
      availableLanguages: LANGUAGES,
    };
  }
  return context;
};
