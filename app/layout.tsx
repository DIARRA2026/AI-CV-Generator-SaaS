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
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
