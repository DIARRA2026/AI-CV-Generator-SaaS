import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#121318",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "MonCV.ai — Portfolio Professionnel & CV d'Excellence avec l'IA",
  description:
    "Générez un Portfolio Professionnel haute fidélité, un CV certifié ATS et des demandes d'emploi officielles propulsés par l'Intelligence Artificielle.",
  applicationName: "MonCV.ai",
  appleWebApp: {
    capable: true,
    title: "MonCV.ai",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "MonCV.ai",
    title: "MonCV.ai — Portfolio Professionnel & CV d'Excellence",
    description: "Portfolio web interactif, CV certifié ATS et lettre de motivation propulsés par l'IA.",
  },
};

import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-blue-600 selection:text-white" suppressHydrationWarning>
        <LanguageProvider>
          {children}
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 space-y-2 print:hidden">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              MonCV.ai — Une solution développée et éditée par <span className="font-bold text-slate-900 dark:text-white">INNOVA GROUP SARL</span>
            </p>
            <p className="text-[11px] text-slate-400">
              RCCM : CI-BKE-2019-A-228 · IFU : 2400000X · Abidjan, Côte d Ivoire · Tél / WhatsApp : +225 07 00 51 05 24
            </p>
            <div className="flex justify-center items-center gap-4 text-[11px] pt-1">
              <a href="/terms" className="hover:underline">Conditions Générales d Utilisation</a>
              <span>·</span>
              <a href="/terms" className="hover:underline">Mentions Légales & OHADA</a>
              <span>·</span>
              <a href="/contact" className="hover:underline">Support & Facturation</a>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              © {new Date().getFullYear()} INNOVA GROUP. Tous droits réservés. Règlements sécurisés en Mobile Money.
            </p>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
