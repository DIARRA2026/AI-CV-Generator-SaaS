"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Home,
  CheckCircle2,
  Globe,
  ExternalLink,
  Mail,
  Phone,
  Linkedin,
  Github,
  MapPin,
  Send,
  Check,
  Moon,
  Sun,
  Menu,
  X,
  Code2,
  Palette,
  Layers,
  Zap,
  TrendingUp,
  Award,
  Users,
  ShieldCheck,
  Star,
  Download,
  Smartphone,
  Layout,
  Clock,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";

/**
 * CONFIGURATION UNIQUE & CENTRALISÉE DU PORTFOLIO
 * Facilite la personnalisation instantanée de tous les contenus
 */
const PORTFOLIO_CONFIG = {
  profile: {
    fullName: "Alexandre Koffi",
    title: "Lead Product Designer & Creative Front-End Engineer",
    shortBio:
      "Je transforme les idées en expériences digitales modernes, performantes et mémorables. Alliant design d'exception (Awwwards standard) et rigueur d'ingénierie Next.js.",
    status: "Disponible pour de nouveaux projets",
    availabilityDate: "Q3 / Q4 2026",
    location: "Paris, France • Abidjan, Côte d'Ivoire • International Remote",
    experienceYears: "5+",
    projectsCompleted: "35+",
    happyClients: "28+",
    satisfactionRate: "99.8%",
    onTimeDelivery: "100%",
    email: "alexandre.koffi@atelierdigital.io",
    phone: "+225 07 00 00 00 00",
    whatsapp: "https://wa.me/2250700000000?text=Bonjour%20Alexandre,%20je%20souhaite%20discuter%20d'un%20projet",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  },
  values: [
    {
      title: "Excellence du détail",
      desc: "Chaque micro-interaction, chaque typographie et espacement est calibré au pixel près pour susciter l'émotion.",
      icon: Palette,
    },
    {
      title: "Performance & Accessibilité",
      desc: "Des interfaces ultralégères garantissant des scores Google Lighthouse de 100/100 et le respect strict des normes WCAG.",
      icon: Zap,
    },
    {
      title: "Co-création fluide",
      desc: "Une méthodologie agile et transparente : livrables itératifs, écoute active et communication constante en direct.",
      icon: Users,
    },
  ],
  skills: [
    {
      domain: "Design UI/UX",
      tools: ["Figma", "Design Systems", "Prototypage Micro-interactions", "User Research", "Wireframing", "Tests A/B"],
    },
    {
      domain: "Développement Front-End",
      tools: ["React 19", "Next.js 14", "TypeScript", "Tailwind CSS", "Framer Motion", "Shadcn/UI"],
    },
    {
      domain: "Développement Back-End & API",
      tools: ["Node.js", "PostgreSQL", "Supabase", "REST & GraphQL", "NextAuth", "Prisma"],
    },
    {
      domain: "Branding & Direction Artistique",
      tools: ["Identité Visuelle", "Chartes Graphiques", "Typographie de Luxe", "Logotypes", "Motion Design"],
    },
    {
      domain: "Performance & Outils",
      tools: ["Core Web Vitals", "Git / GitHub", "Vercel / Cloudflare", "SEO Technique", "Docker", "CI/CD"],
    },
    {
      domain: "Stratégie & Produit",
      tools: ["Product Discovery", "MVP Launch", "Data Analytics", "Agile Scrum", "Conversion Rate Optimization"],
    },
  ],
  projects: [
    {
      id: "p1",
      title: "Atelier Digital — Showcase & Plateforme Créative",
      category: "Web",
      subtitle: "Plateforme web haute fidélité pour une agence de design international",
      tags: ["Next.js", "Tailwind CSS", "Framer Motion", "TypeScript"],
      metrics: "+140% de conversion • Mention Spéciale Awwwards",
      imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
      liveUrl: "#",
    },
    {
      id: "p2",
      title: "PayAfrique — Super-App Fintech Mobile Money",
      category: "Mobile",
      subtitle: "Application mobile de paiement instantané & portefeuille multi-devises",
      tags: ["React Native", "TypeScript", "Node.js", "Fintech Security"],
      metrics: "50k+ utilisateurs actifs • Note 4.9/5",
      imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80",
      liveUrl: "#",
    },
    {
      id: "p3",
      title: "Lumina SaaS — Analytics IA & Business Intelligence",
      category: "Web",
      subtitle: "Dashboard interactif avec visualisations temps réel et prédictions IA",
      tags: ["Next.js", "PostgreSQL", "Tailwind", "OpenAI API"],
      metrics: "3.2M requêtes/jour • 99.99% Uptime",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
      liveUrl: "#",
    },
    {
      id: "p4",
      title: "NéoBank — Design System Complet & Expérience Client",
      category: "UI/UX",
      subtitle: "Système de conception unifié multi-plateforme pour banque digitale",
      tags: ["Figma Tokens", "Design System", "Accessibilité WCAG", "Tokens API"],
      metrics: "120+ composants prêts pour la production",
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
      liveUrl: "#",
    },
    {
      id: "p5",
      title: "KolaStore — E-Commerce Headless Mode & Luxe Panafricain",
      category: "Branding",
      subtitle: "Identité de marque & boutique ultra-rapide pour collection haute couture",
      tags: ["Shopify Headless", "Next.js", "Branding", "Stripe Connect"],
      metrics: "+82% valeur moyenne du panier",
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
      liveUrl: "#",
    },
    {
      id: "p6",
      title: "Pulse Health — Télémédecine & Prise de Rendez-vous IA",
      category: "UI/UX",
      subtitle: "Interface intuitive de téléconsultation et dossier patient sécurisé",
      tags: ["UI/UX Design", "WebRTC", "HIPAA Compliant", "React"],
      metrics: "Temps d'attente divisé par 3",
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
      liveUrl: "#",
    },
  ],
  experiences: [
    {
      period: "2024 — Présent",
      role: "Senior Lead Product Designer & Creative Consultant",
      company: "Atelier Digital Studio (Freelance International)",
      location: "Paris • Abidjan • Remote",
      description:
        "Direction de la conception de plateformes SaaS et refontes d'envergure pour startups en phase de Scale-Up et grands comptes. Stratégie produit, design system et implémentation front-end.",
    },
    {
      period: "2022 — 2024",
      role: "Lead Front-End & UI/UX Designer",
      company: "FinTech Pulse Global",
      location: "Abidjan • Dakar",
      description:
        "Responsable de l'équipe d'interface client. Refonte complète de la super-app mobile et du portail marchand. Augmentation du taux d'adoption de 45% en 12 mois.",
    },
    {
      period: "2021 — 2022",
      role: "Product Designer & Frontend Engineer",
      company: "Creative Spark Agency",
      location: "Paris, France",
      description:
        "Conception de plus de 15 sites web immersifs primés sur Awwwards et FWA. Création de chartes graphiques complètes et intégration Next.js.",
    },
  ],
  services: [
    {
      title: "Création de Sites Web d'Élite",
      subtitle: "Sites vitrines & landing pages de conversion ultra-rapides",
      deliverables: ["Architecture Next.js 14", "SEO & Core Web Vitals 100%", "Animations interactives", "Responsive 100% mobile"],
      priceIndication: "À partir de 450 000 FCFA / 750 €",
    },
    {
      title: "Applications Web & SaaS Sur-Mesure",
      subtitle: "Plateformes logicielles complètes avec authentification & paiements",
      deliverables: ["Dashboard interactif", "Base de données PostgreSQL/Supabase", "Paiements Wave/Orange/Stripe", "Gestion des rôles"],
      priceIndication: "À partir de 1 200 000 FCFA / 1 850 €",
    },
    {
      title: "UI/UX Design & Prototypage Figma",
      subtitle: "Conception centrée utilisateur du wireframe au prototype cliquable",
      deliverables: ["Design System complet", "Prototypes cliquables haute fidélité", "Tests utilisateurs", "Fichiers de transmission dev"],
      priceIndication: "À partir de 350 000 FCFA / 550 €",
    },
    {
      title: "Branding Complet & Direction Artistique",
      subtitle: "Identité visuelle de marque haut de gamme et reconnaissable",
      deliverables: ["Logotype principal & variantes", "Palette chromatique & typographies", "Guidelines d'usage", "Templates réseaux sociaux"],
      priceIndication: "À partir de 300 000 FCFA / 450 €",
    },
    {
      title: "E-Commerce Headless & Mobile Money",
      subtitle: "Boutiques en ligne modernes intégrées aux paiements locaux & mondiaux",
      deliverables: ["Catalogue produits temps réel", "Paniers ultra-fluides", "Paiement Mobile Money + Carte", "Backoffice de gestion"],
      priceIndication: "À partir de 850 000 FCFA / 1 300 €",
    },
    {
      title: "Audit UX, Performance & Refonte",
      subtitle: "Diagnostic complet et optimisation drastique de votre produit existant",
      deliverables: ["Rapport d'audit UX & heuristiques", "Optimisation de la vitesse de chargement", "Amélioration de l'accessibilité", "Plan d'action prioritaire"],
      priceIndication: "À partir de 250 000 FCFA / 390 €",
    },
  ],
  testimonials: [
    {
      name: "Marc Dubois",
      role: "CEO & Co-fondateur",
      company: "FinTech Pulse",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      content:
        "Un sens du design hors du commun couplé à une rigueur d'ingénierie exemplaire. Notre plateforme a gagné en crédibilité instantanément auprès de nos investisseurs.",
      stars: 5,
    },
    {
      name: "Aminata Koné",
      role: "Directrice Produit",
      company: "InnovAfrique",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      content:
        "Notre taux de conversion a bondi de 34% après la mise en ligne du nouveau site. La collaboration a été fluide, professionnelle et ponctuée de précieux conseils stratégiques.",
      stars: 5,
    },
    {
      name: "David Laurent",
      role: "Directeur Technique",
      company: "SaaS Studio Paris",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      content:
        "Le code livré en Next.js et TypeScript est propre, modulaire et remarquablement bien documenté. Travailler avec Alexandre a été un réel plaisir d'ingénieur.",
      stars: 5,
    },
    {
      name: "Sarah Meyer",
      role: "Responsable Brand & Marketing",
      company: "Luxe & Tradition",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
      content:
        "Une vision artistique remarquable et une écoute irréprochable. Notre nouvelle identité visuelle suscite des compliments quotidiens de nos clients internationaux.",
      stars: 5,
    },
  ],
};

export default function PortfolioLandingPage() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [activeFilter, setActiveFilter] = useState<string>("Tous");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Formulaire de contact
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactProjectType, setContactProjectType] = useState("Site Web d'Élite");
  const [contactBudget, setContactBudget] = useState("500k - 1M FCFA");
  const [contactMessage, setContactMessage] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const filteredProjects =
    activeFilter === "Tous"
      ? PORTFOLIO_CONFIG.projects
      : PORTFOLIO_CONFIG.projects.filter((p) => p.category === activeFilter);

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");
    }, 4000);
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300 ${
        isDark ? "bg-[#0c0d12] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. NAVBAR STICKY AVEC GLASSMORPHISM                                        */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 z-50 w-full backdrop-blur-xl transition-all duration-300 border-b ${
          isDark
            ? "bg-[#0c0d12]/80 border-slate-800/80 shadow-2xl shadow-black/40"
            : "bg-white/85 border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Monogramme */}
          <Link href="/portfolio" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <div
                className={`w-full h-full rounded-[10px] flex items-center justify-center font-black text-sm ${
                  isDark ? "bg-[#121318] text-white" : "bg-white text-slate-900"
                }`}
              >
                AK
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                {PORTFOLIO_CONFIG.profile.fullName}
              </span>
              <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">
                Atelier Digital
              </span>
            </div>
          </Link>

          {/* Badge Disponible Compact */}
          <div
            className={`hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap shrink-0 ${
              isDark
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Disponible</span>
          </div>

          {/* Navigation Liens Desktop avec Pills et Animations */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-bold p-1 rounded-2xl bg-slate-800/20 border border-slate-700/30 backdrop-blur-md shrink-0">
            {[
              { label: "Accueil", href: "#hero" },
              { label: "À propos", href: "#apropos" },
              { label: "Compétences", href: "#competences" },
              { label: "Projets", href: "#projets" },
              { label: "Expérience", href: "#experience" },
              { label: "Services", href: "#services" },
              { label: "Témoignages", href: "#temoignages" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap select-none hover:scale-105 active:scale-95 ${
                  isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/80" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions : Theme Toggle + CTA Me Contacter + Retour Accueil */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Bouton Retour à la page d'accueil MonCV.ai avec Animation Pro */}
            <Link
              href="/"
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black border transition-all duration-300 whitespace-nowrap cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0 ${
                isDark
                  ? "bg-[#141620] hover:bg-[#1a1d2c] border-slate-700/80 hover:border-blue-500/80 text-slate-100 shadow-black/50 hover:shadow-blue-500/20"
                  : "bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-800 shadow-slate-200/60"
              }`}
              title="Retour à la page d'accueil MonCV.ai"
            >
              <Home className="w-3.5 h-3.5 text-blue-500 group-hover:-translate-x-0.5 transition-transform duration-300 shrink-0" />
              <span className="whitespace-nowrap">Accueil MonCV.ai</span>
            </Link>

            {/* Toggle Dark / Light mode avec Animation Rotation */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`group p-2.5 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                isDark
                  ? "bg-[#141620] border-slate-700/80 text-amber-400 hover:bg-[#1a1d2c] hover:border-amber-400/40 shadow-xs"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs"
              }`}
              title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
              aria-label="Changer de thème"
            >
              {isDark ? (
                <Sun className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 group-hover:-rotate-45 transition-transform duration-500 shrink-0" />
              )}
            </button>

            {/* Bouton CTA Me Contacter avec Animation Shimmer & Scale */}
            <a
              href="#contact"
              className="group hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">Me contacter</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300 shrink-0" />
            </a>

            {/* Bouton Burger Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`xl:hidden p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-900"
              }`}
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu Déroulant Mobile */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border-b px-5 py-4 space-y-3 fade-in ${
              isDark ? "bg-[#0c0d12] border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {/* Bouton Retour Accueil MonCV.ai Mobile */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>← Retour à la page d'accueil MonCV.ai</span>
            </Link>
            <div className="flex items-center gap-2 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-500">
                {PORTFOLIO_CONFIG.profile.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2">
              {[
                { label: "Accueil", href: "#hero" },
                { label: "À propos", href: "#apropos" },
                { label: "Compétences", href: "#competences" },
                { label: "Projets", href: "#projets" },
                { label: "Expérience", href: "#experience" },
                { label: "Services", href: "#services" },
                { label: "Témoignages", href: "#temoignages" },
                { label: "Contact", href: "#contact" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2.5 rounded-lg transition-colors ${
                    isDark ? "hover:bg-slate-900 text-slate-300" : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 mt-2"
            >
              <span>Démarrer un projet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION HAUT DE GAMME & IMMERSIVE                                  */}
      {/* ========================================================================= */}
      <section
        id="hero"
        className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden"
      >
        {/* Lueur d'ambiance d'arrière-plan */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Colonne Texte & Accroche (7 col) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge animé disponibilité */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Disponible pour de nouveaux projets • {PORTFOLIO_CONFIG.profile.availabilityDate}</span>
              </div>

              {/* Titre percutant avec dégradé subtil */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
                Je transforme les idées en{" "}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                  expériences digitales modernes.
                </span>
              </h1>

              {/* Sous-titre valorisant */}
              <p
                className={`text-base sm:text-lg leading-relaxed max-w-2xl font-normal ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {PORTFOLIO_CONFIG.profile.shortBio}
              </p>

              {/* Double Appel à l'action Responsive */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <a
                  href="#projets"
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Voir mes projets</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#contact"
                  className={`px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
                    isDark
                      ? "bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-white"
                      : "bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm"
                  }`}
                >
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span>Me contacter</span>
                </a>
              </div>

              {/* Localisation */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{PORTFOLIO_CONFIG.profile.location}</span>
              </div>
            </div>

            {/* Colonne Portrait & Cartes Flottantes (5 col) */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-[250px] sm:max-w-[270px]">
                {/* Cadre Portrait avec lueur plus compacte */}
                <div className="relative rounded-3xl p-1.5 bg-gradient-to-b from-blue-500/30 via-indigo-500/20 to-transparent shadow-xl">
                  <div className="overflow-hidden rounded-2xl aspect-[4/5] bg-slate-900 relative">
                    <img
                      src={PORTFOLIO_CONFIG.profile.avatarUrl}
                      alt={PORTFOLIO_CONFIG.profile.fullName}
                      className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-transparent to-transparent opacity-50" />
                  </div>
                </div>

                {/* Carte Flottante 1 : Score de Satisfaction (99.8%) compacte */}
                <div
                  className={`absolute -bottom-3 -left-3 p-2.5 rounded-2xl shadow-xl border backdrop-blur-xl flex items-center gap-2.5 animate-float ${
                    isDark
                      ? "bg-[#121318]/95 border-slate-700/80 text-white"
                      : "bg-white/95 border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 font-black text-sm">
                      <span>{PORTFOLIO_CONFIG.profile.satisfactionRate}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </div>
                    <p className="text-[9.5px] font-semibold text-slate-400">
                      Satisfaction client
                    </p>
                  </div>
                </div>

                {/* Carte Flottante 2 : Badges Technologiques compacts */}
                <div
                  className={`absolute -top-2.5 -right-2.5 p-2.5 rounded-2xl shadow-xl border backdrop-blur-xl flex items-center gap-2 animate-float-reverse ${
                    isDark
                      ? "bg-[#121318]/95 border-slate-700/80 text-white"
                      : "bg-white/95 border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black block">Awwwards</span>
                    <span className="text-[9px] font-semibold text-slate-400">Performance 100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bandeau de Métriques de Réassurance */}
          <div
            className={`mt-16 p-6 sm:p-8 rounded-3xl border grid grid-cols-2 md:grid-cols-4 gap-6 text-center ${
              isDark
                ? "bg-[#121318]/70 border-slate-800/80 shadow-xl"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div>
              <span className="text-3xl sm:text-4xl font-black text-blue-500 block">
                {PORTFOLIO_CONFIG.profile.projectsCompleted}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                Projets Réalisés
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black text-indigo-400 block">
                {PORTFOLIO_CONFIG.profile.experienceYears}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                Années d'Expérience
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 block">
                {PORTFOLIO_CONFIG.profile.happyClients}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                Clients Satisfaits
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black text-amber-400 block">
                {PORTFOLIO_CONFIG.profile.onTimeDelivery}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                Délais Respectés
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION À PROPOS                                                        */}
      {/* ========================================================================= */}
      <section
        id="apropos"
        className={`py-20 border-t ${
          isDark ? "bg-[#0f1015] border-slate-800/80" : "bg-slate-100/70 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-blue-500">
              Vision & Méthodologie
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Allier la beauté artistique à l'ingénierie robuste.
            </h2>
            <p
              className={`text-sm sm:text-base leading-relaxed ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Je crois que les meilleurs produits numériques naissent à la croisée de l'empathie humaine et de la maîtrise technique. Mon objectif : concevoir des interfaces qui captivent immédiatement les utilisateurs tout en propulsant la croissance commerciale de mes clients.
            </p>
          </div>

          {/* 3 Piliers de Valeurs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PORTFOLIO_CONFIG.values.map((v, idx) => {
              const IconComp = v.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${
                    isDark
                      ? "bg-[#14161f] border-slate-800 hover:border-blue-500/50 shadow-lg"
                      : "bg-white border-slate-200 hover:border-blue-400 shadow-sm"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/25 flex items-center justify-center text-blue-500 mb-5">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg mb-2">{v.title}</h3>
                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. GRILLE DE COMPÉTENCES & STACK (6 PÔLES)                                */}
      {/* ========================================================================= */}
      <section id="competences" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Stack Technologique & Outils
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              6 Pôles d'Expertise Maîtrisés
            </h2>
            <p className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Des technologies modernes garantissant pérennité, évolutivité et fluidité absolue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PORTFOLIO_CONFIG.skills.map((cluster, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-3xl border transition-all ${
                  isDark
                    ? "bg-[#121318] border-slate-800/90 hover:border-indigo-500/40"
                    : "bg-white border-slate-200 hover:border-indigo-300 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <h3 className="font-bold text-sm sm:text-base">{cluster.domain}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cluster.tools.map((tool, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-default hover:scale-105 ${
                        isDark
                          ? "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-blue-500 hover:text-white"
                          : "bg-slate-100 border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600"
                      }`}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SHOWCASE PROJETS AVEC FILTRES DYNAMIQUES                                */}
      {/* ========================================================================= */}
      <section
        id="projets"
        className={`py-20 border-t ${
          isDark ? "bg-[#0e0f14] border-slate-800/80" : "bg-slate-100/70 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-blue-500">
                Portfolio Réalisations
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-1">
                Études de Cas & Projets Marquants
              </h2>
            </div>

            {/* Filtres dynamiques Swipeables sur mobile */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
              {["Tous", "Web", "Mobile", "UI/UX", "Branding"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeFilter === filter
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : isDark
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Grille des 6 Projets Bien Rangée & Compacte */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${
                  isDark
                    ? "bg-[#14151d] border-slate-800/90 hover:border-blue-500/50 shadow-lg"
                    : "bg-white border-slate-200 hover:border-blue-400 shadow-sm"
                }`}
              >
                <div>
                  {/* Barre d'En-tête Style Fenêtre macOS (Propre & Bien Rangée) */}
                  <div
                    className={`px-3.5 py-2 flex items-center justify-between border-b ${
                      isDark ? "bg-[#0f1015] border-slate-800" : "bg-slate-100/90 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500/70" />
                      <span className="w-2 h-2 rounded-full bg-amber-500/70" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500/70" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 tracking-tight">
                      {proj.category.toLowerCase()}.app
                    </span>
                    <span
                      className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isDark ? "bg-slate-800 text-blue-400" : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {proj.category}
                    </span>
                  </div>

                  {/* Mockup Image Réduite & Bien Calibrée */}
                  <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-950">
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-40" />
                  </div>

                  {/* Contenu Projet Net & Compact */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <h3 className="font-extrabold text-sm sm:text-base group-hover:text-blue-400 transition-colors line-clamp-1">
                      {proj.title}
                    </h3>
                    <p
                      className={`text-xs leading-relaxed line-clamp-2 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {proj.subtitle}
                    </p>

                    {/* Métrique / Impact */}
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10.5px] font-bold">
                      {proj.metrics}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {proj.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md ${
                            isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bouton Action Aligné en Bas */}
                <div className="px-4 sm:px-5 pb-4 pt-1">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    <span>Discuter d'un projet similaire</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TIMELINE D'EXPÉRIENCE PROFESSIONNELLE                                   */}
      {/* ========================================================================= */}
      <section id="experience" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-500">
              Parcours & Trajectoire
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Expérience Professionnelle
            </h2>
          </div>

          <div className="relative border-l-2 border-blue-600/30 ml-4 sm:ml-8 space-y-10 pl-6 sm:pl-8">
            {PORTFOLIO_CONFIG.experiences.map((exp, idx) => (
              <div key={idx} className="relative group">
                {/* Marqueur lumineux */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-[#0c0d12] shadow-md shadow-blue-500/50 group-hover:scale-125 transition-transform" />

                <div
                  className={`p-6 rounded-3xl border transition-all ${
                    isDark
                      ? "bg-[#121318] border-slate-800 hover:border-slate-700"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-extrabold text-blue-500">
                      {exp.period}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {exp.location}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    {exp.role}
                  </h3>
                  <p className="text-xs font-bold text-indigo-400 mt-0.5 mb-3">
                    {exp.company}
                  </p>
                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {exp.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CARTES D'OFFRES & SERVICES SUR-MESURE (6 SERVICES)                      */}
      {/* ========================================================================= */}
      <section
        id="services"
        className={`py-20 border-t ${
          isDark ? "bg-[#0e0f14] border-slate-800/80" : "bg-slate-100/70 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Solutions Clé-en-Main
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Offres & Services Sur-Mesure
            </h2>
            <p className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Des prestations haut de gamme avec engagements contractuels, rigueur et garantie de résultats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PORTFOLIO_CONFIG.services.map((srv, idx) => (
              <div
                key={idx}
                className={`p-7 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                  isDark
                    ? "bg-[#14151d] border-slate-800 hover:border-emerald-500/40 shadow-xl"
                    : "bg-white border-slate-200 hover:border-emerald-400 shadow-md"
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-lg sm:text-xl text-white">{srv.title}</h3>
                    <p
                      className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {srv.subtitle}
                    </p>
                  </div>

                  <div className="h-px bg-slate-800 my-2" />

                  {/* Livrables inclus */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Livrables inclus :
                    </span>
                    {srv.deliverables.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className={isDark ? "text-slate-300" : "text-slate-700"}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11.5px] font-black text-emerald-400">
                    {srv.priceIndication}
                  </span>
                  <a
                    href="#contact"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
                  >
                    <span>Commander</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TÉMOIGNAGES & PREUVE SOCIALE (4 AVIS)                                  */}
      {/* ========================================================================= */}
      <section id="temoignages" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Retours d'Expérience
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ce que disent les clients
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PORTFOLIO_CONFIG.testimonials.map((t, idx) => (
              <div
                key={idx}
                className={`p-7 rounded-3xl border space-y-4 ${
                  isDark
                    ? "bg-[#121318] border-slate-800/90 shadow-lg"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                {/* Étoiles */}
                <div className="flex items-center gap-1">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <p
                  className={`text-sm italic leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  « {t.content} »
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-blue-500/30"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">{t.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {t.role} • <span className="text-blue-400">{t.company}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BANNIÈRE CALL-TO-ACTION PERCUTANTE                                     */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-900/40">
          <div className="absolute inset-0 bg-radial-hero opacity-30 pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-5">
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-sky-200">
              Démarrage Immédiat
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Vous avez un projet en tête ? Construisons-le ensemble.
            </h2>
            <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
              Discutons de vos objectifs lors d'un échange direct ou recevez un devis détaillé sous 24 heures.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <a
                href="#contact"
                className="px-8 py-4 bg-white hover:bg-blue-50 text-blue-800 font-extrabold rounded-2xl text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <span>Demander un devis gratuit</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={PORTFOLIO_CONFIG.profile.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Discussion WhatsApp Directe</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FORMULAIRE DE CONTACT & COORDONNÉES DIRECTES                          */}
      {/* ========================================================================= */}
      <section id="contact" className="py-20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Colonne Coordonnées Directes (5 col) */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-blue-500">
                  Contact & Disponibilité
                </span>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-1">
                  Parlons de votre prochain succès.
                </h2>
                <p className={`text-xs sm:text-sm mt-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Disponible pour missions freelance, collaborations produit et mandats de direction artistique.
                </p>
              </div>

              {/* Coordonnées rapides cliquables */}
              <div className="space-y-3 pt-2">
                <a
                  href={`mailto:${PORTFOLIO_CONFIG.profile.email}`}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                    isDark
                      ? "bg-[#14151d] border-slate-800 hover:border-blue-500/50"
                      : "bg-white border-slate-200 hover:border-blue-400"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-500 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-400 block">Email direct</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{PORTFOLIO_CONFIG.profile.email}</span>
                  </div>
                </a>

                <a
                  href={PORTFOLIO_CONFIG.profile.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                    isDark
                      ? "bg-[#14151d] border-slate-800 hover:border-emerald-500/50"
                      : "bg-white border-slate-200 hover:border-emerald-400"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-400 block">WhatsApp & Appel direct</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{PORTFOLIO_CONFIG.profile.phone}</span>
                  </div>
                </a>

                <div
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border ${
                    isDark ? "bg-[#14151d] border-slate-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-semibold text-slate-400 block">Localisation & Déplacements</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{PORTFOLIO_CONFIG.profile.location}</span>
                  </div>
                </div>
              </div>

              {/* Réseaux Sociaux */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 block mb-2">Réseaux professionnels :</span>
                <div className="flex items-center gap-2">
                  <a
                    href={PORTFOLIO_CONFIG.profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white transition-all"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href={PORTFOLIO_CONFIG.profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white transition-all"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Colonne Formulaire Complet (7 col) */}
            <div
              className={`lg:col-span-7 p-6 sm:p-8 rounded-3xl border ${
                isDark ? "bg-[#121318] border-slate-800/90 shadow-2xl" : "bg-white border-slate-200 shadow-md"
              }`}
            >
              {formSubmitted ? (
                <div className="py-16 text-center space-y-3 fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Message envoyé avec succès !</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Merci pour votre intérêt. Alexandre Koffi vous répondra personnellement sous 24 heures.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <h3 className="font-extrabold text-lg text-white mb-2">
                    Envoyer une demande de projet
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Votre Nom complet <span className="text-red-400">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Jean-Marc Konan"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Adresse Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="jean.marc@entreprise.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Numéro WhatsApp / Mobile
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Type de Projet
                      </label>
                      <select
                        value={contactProjectType}
                        onChange={(e) => setContactProjectType(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      >
                        <option>Site Web d'Élite / Landing Page</option>
                        <option>Application SaaS & Dashboard</option>
                        <option>UI/UX Design & Prototypage Figma</option>
                        <option>Branding Complet & Logo</option>
                        <option>E-Commerce Headless</option>
                        <option>Audit & Optimisation UX</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Budget Prévisionnel
                    </label>
                    <select
                      value={contactBudget}
                      onChange={(e) => setContactBudget(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <option>Moins de 500 000 FCFA (&lt; 750 €)</option>
                      <option>500 000 — 1 500 000 FCFA (750 € — 2 300 €)</option>
                      <option>1 500 000 — 3 000 000 FCFA (2 300 € — 4 500 €)</option>
                      <option>Plus de 3 000 000 FCFA (&gt; 4 500 €)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Décrivez brièvement votre projet <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Parlez-moi de votre vision, vos délais et vos objectifs commerciaux..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Envoyer ma demande de devis</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER AVEC CONFIGURATION UNIFIÉE                                     */}
      {/* ========================================================================= */}
      <footer
        className={`py-10 border-t ${
          isDark ? "bg-[#090a0e] border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-600"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
              AK
            </div>
            <span className="font-bold text-white">{PORTFOLIO_CONFIG.profile.fullName}</span>
            <span>• Atelier Digital © 2026</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-semibold">
            <Link href="/" className="hover:text-white transition-colors">MonCV.ai</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Conditions d'Utilisation</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Nous Contacter</Link>
            <a href="#projets" className="hover:text-white transition-colors">Projets</a>
            <a href="#services" className="hover:text-white transition-colors">Tarifs</a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 mt-4 border-t border-slate-800/60 text-center text-[10.5px] text-slate-500">
          MonCV.ai est une plateforme SaaS conçue et développée par <strong>INNOVA GROUP</strong>. Tous droits réservés.
        </div>
      </footer>

      {/* Bouton Flottant de retour à l'accueil MonCV.ai */}
      <div className="fixed bottom-5 left-5 z-40">
        <Link
          href="/"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isDark
              ? "bg-[#121318]/95 border-slate-700/80 text-slate-200 hover:text-white hover:border-blue-500 shadow-black/70"
              : "bg-white/95 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-blue-300 shadow-slate-300/50"
          }`}
          title="Retourner à l'accueil du site MonCV.ai"
        >
          <Home className="w-4 h-4 text-blue-500" />
          <span>← Retour à l'accueil MonCV.ai</span>
        </Link>
      </div>
    </div>
  );
}
