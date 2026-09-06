import { SupportedLanguage, LanguageOption, TranslationDictionary } from "./types";
import { fr } from "./locales/fr";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { ar } from "./locales/ar";

export * from "./types";
export * from "./LanguageContext";

export const LANGUAGES: LanguageOption[] = [
  {
    code: "fr",
    name: "Français",
    nativeName: "Français",
    flag: "🇫🇷",
    dir: "ltr",
  },
  {
    code: "en",
    name: "Anglais",
    nativeName: "English",
    flag: "🇬🇧",
    dir: "ltr",
  },
  {
    code: "es",
    name: "Espagnol",
    nativeName: "Español",
    flag: "🇪🇸",
    dir: "ltr",
  },
  {
    code: "ar",
    name: "Arabe",
    nativeName: "العربية",
    flag: "🇸🇦",
    dir: "rtl",
  },
];

export const defaultLanguage: SupportedLanguage = "fr";

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  fr,
  en,
  es,
  ar,
};

export function getLanguageOption(lang: SupportedLanguage): LanguageOption {
  return LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
}

export function isRTL(lang: SupportedLanguage): boolean {
  return lang === "ar";
}
