"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ResumeData } from "@/lib/types";
import { StorageManager } from "@/lib/storage";
import { initialResumeData } from "@/lib/initialData";
import { downloadResumePDF } from "@/lib/pdf-export";
import { CVPreviewCanvas } from "@/components/preview/CVPreviewCanvas";
import {
  Download,
  Mail,
  Phone,
  Linkedin,
  Globe,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Check,
  Briefcase,
  GraduationCap,
  Award,
  Share2,
  Calendar,
  MapPin,
  FileText,
  Star,
  ExternalLink,
  Send,
  QrCode,
  ChevronRight,
  ShieldCheck,
  User,
  Crown,
  Moon,
  Sun,
  Menu,
  X,
  Zap,
  Palette,
  Users,
  MessageCircle,
  ArrowRight,
  ArrowUpRight,
  Github,
  Home,
} from "lucide-react";
import { MobileMoneyModal } from "@/components/tools/MobileMoneyModal";

export default function PublicCandidateCVPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"portfolio" | "cv">("portfolio");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Tous");

  // Form contact state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactProjectType, setContactProjectType] = useState("Opportunité d'Emploi / Mission");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    const found = StorageManager.getResumeBySlug(slug);
    if (found) {
      setResumeData(found);
    }
  }, [slug]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const success = await downloadResumePDF("cv-printable-page", resumeData);
    setIsDownloading(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim() || !contactName.trim() || !contactEmail.trim()) return;
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");
    }, 3500);
  };

  const p = resumeData.personal;
  const primaryColor = resumeData.design.primaryColor || "#2563eb";
  const isDark = theme === "dark";

  // Compétences dynamiques
  const skillsList = resumeData.skills && resumeData.skills.length > 0
    ? resumeData.skills
    : [
        { category: "Expertise Technique", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Architecture Logicielle"] },
        { category: "Méthodologies & Outils", items: ["Méthode STAR", "Git / GitHub", "Scrum / Agile", "Design System", "Tests Unitaires"] },
        { category: "Gestion & Stratégie", items: ["Direction de Projet", "Relation Client", "Product Discovery", "Performance Web"] },
      ];

  // Expériences dynamiques
  const experiencesList = resumeData.experiences && resumeData.experiences.length > 0
    ? resumeData.experiences
    : [
        {
          id: "1",
          company: "TechStudio International",
          role: p.title || "Consultant & Spécialiste Produit",
          startDate: "2023",
          endDate: "Présent",
          current: true,
          city: p.city || "Abidjan",
          country: p.country || "Côte d'Ivoire",
          highlights: [
            "Pilotage des initiatives clés et coordination d'équipes pluridisciplinaires",
            "Optimisation des processus métier avec des résultats mesurables à fort impact",
          ],
        },
        {
          id: "2",
          company: "Solutions Digitales & Conseil",
          role: "Chargé de Projets & Ingénieur Solutions",
          startDate: "2021",
          endDate: "2023",
          current: false,
          city: "Paris / Remote",
          country: "France",
          highlights: [
            "Conception et déploiement de plateformes performantes de bout en bout",
            "Augmentation de 35% de la satisfaction client et livraison systématique dans les délais",
          ],
        },
      ];

  // Projets / Réalisations
  const candidateProjects = [
    {
      id: "cp1",
      title: "Plateforme Numérique & Optimisation de Conversion",
      category: "Web",
      subtitle: "Refonte architecturale avec amélioration de 40% des temps de réponse",
      metrics: "+35% de productivité • Normes Internationales",
      tags: ["Next.js", "Performance", "Cloud", "Méthode STAR"],
      imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=700&auto=format&fit=crop&q=80",
    },
    {
      id: "cp2",
      title: "Système de Gestion & Automatisation des Données",
      category: "Mobile",
      subtitle: "Déploiement d'une solution intuitive avec dashboard en temps réel",
      metrics: "Satisfaction Client 99.8% • Zéro Anomalie",
      tags: ["React Native", "API REST", "Sécurité", "UX Design"],
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&auto=format&fit=crop&q=80",
    },
    {
      id: "cp3",
      title: "Design System & Cohérence d'Expérience Client",
      category: "UI/UX",
      subtitle: "Bibliothèque de composants modulaires et charte graphique interactive",
      metrics: "Gain de 50% sur les cycles de livraison",
      tags: ["Figma Tokens", "Accessibilité WCAG", "Ergonomie"],
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=700&auto=format&fit=crop&q=80",
    },
  ];

  const filteredProjects =
    activeFilter === "Tous"
      ? candidateProjects
      : candidateProjects.filter((cp) => cp.category === activeFilter);

  const candidateFullName = `${p.firstName || "Candidat"} ${p.lastName || ""}`.trim();
  const cleanPhone = p.phone?.replace(/\s+/g, "") || "";
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.replace("+", "")}?text=Bonjour%20${encodeURIComponent(candidateFullName)},%20j'ai%20consulté%20votre%20portfolio%20sur%20MonCV.ai%20et%20souhaite%20échanger%20avec%20vous.`
    : `https://wa.me/2250700000000?text=Bonjour%20${encodeURIComponent(candidateFullName)},%20je%20souhaite%20échanger%20avec%20vous.`;

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300 ${
        isDark ? "bg-[#0b0c10] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <head>
        <title>{`${candidateFullName} — Portfolio Professionnel & CV en Ligne`}</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#121318" />
        <meta
          name="description"
          content={resumeData.summary || `${p.title || "Portfolio"} — CV professionnel de ${candidateFullName}`}
        />
      </head>

      {/* ========================================================================= */}
      {/* 1. NAVBAR STICKY AVEC GLASSMORPHISM                                        */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-all duration-300 no-print ${
          isDark
            ? "bg-[#0b0c10]/85 border-slate-800/80 shadow-2xl shadow-black/40"
            : "bg-white/85 border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2">
          {/* Logo Monogramme Candidat */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md transition-transform group-hover:scale-105"
                style={{ backgroundColor: primaryColor }}
              >
                {p.firstName?.[0] || "C"}{p.lastName?.[0] || "V"}
              </div>
              <div className="hidden xs:flex flex-col">
                <span className="font-black text-xs sm:text-sm tracking-tight truncate max-w-[140px] sm:max-w-[180px]">
                  {candidateFullName}
                </span>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                  Portfolio Certifié
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-bold">
              ● Disponible
            </span>
          </div>

          {/* Navigation Liens Desktop */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-bold p-1 rounded-2xl bg-slate-800/20 border border-slate-700/30 backdrop-blur-md shrink-0">
            {[
              { label: "Accueil", href: "#hero" },
              { label: "À propos", href: "#apropos" },
              { label: "Compétences", href: "#competences" },
              { label: "Projets", href: "#projets" },
              { label: "Expérience", href: "#experience" },
              { label: "Prestations", href: "#services" },
              { label: "Contact", href: "#contact" },
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

          {/* Actions : Mode Switcher + Télécharger PDF + Theme Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toggle Dark / Light mode */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
              title={isDark ? "Mode clair" : "Mode sombre"}
              aria-label="Changer de thème"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 hover:rotate-90 transition-transform duration-500" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 hover:-rotate-45 transition-transform duration-500" />}
            </button>

            {/* Switcher Onglet Portfolio / Format CV A4 */}
            <div
              className={`p-1 rounded-xl flex items-center gap-1 border shrink-0 ${
                isDark ? "bg-slate-900/90 border-slate-800" : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab("portfolio")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap hover:scale-105 active:scale-95 ${
                  activeTab === "portfolio"
                    ? "bg-blue-600 text-white shadow-xs"
                    : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Globe className="w-3 h-3" />
                <span className="hidden sm:inline">Portfolio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("cv")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap hover:scale-105 active:scale-95 ${
                  activeTab === "cv"
                    ? "bg-blue-600 text-white shadow-xs"
                    : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">CV A4</span>
              </button>
            </div>

            {/* Partager */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap shrink-0 ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="Copier le lien du portfolio"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                  <span className="hidden md:inline text-emerald-500 font-bold">Copié !</span>
                </>
              ) : (
                <>
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Partager</span>
                </>
              )}
            </button>

            {/* Télécharger CV PDF */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap shrink-0 ${
                downloadSuccess
                  ? "bg-emerald-600"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
              }`}
            >
              {isDownloading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline whitespace-nowrap">
                {isDownloading ? "Génération..." : downloadSuccess ? "Téléchargé" : "CV PDF"}
              </span>
            </button>

            {/* Bouton Retour Accueil MonCV.ai */}
            <Link
              href="/"
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap shrink-0 ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs"
              }`}
              title="Retourner à l'accueil MonCV.ai"
            >
              <Home className="w-3.5 h-3.5 text-blue-500 group-hover:-translate-x-0.5 transition-transform duration-300" />
              <span className="hidden sm:inline whitespace-nowrap">Accueil MonCV.ai</span>
            </Link>

            {/* Bouton Menu Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`xl:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-900"
              }`}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Menu Déroulant Mobile */}
        {mobileMenuOpen && (
          <div
            className={`xl:hidden border-b px-4 py-3 space-y-2 fade-in ${
              isDark ? "bg-[#0b0c10] border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {/* Retour Accueil Mobile */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-600/20"
            >
              <Home className="w-4 h-4" />
              <span>← Retour à l'accueil MonCV.ai</span>
            </Link>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {[
                { label: "Accueil", href: "#hero" },
                { label: "À propos", href: "#apropos" },
                { label: "Compétences", href: "#competences" },
                { label: "Projets", href: "#projets" },
                { label: "Expérience", href: "#experience" },
                { label: "Prestations", href: "#services" },
                { label: "Contact", href: "#contact" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2 rounded-lg transition-colors ${
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
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20"
            >
              <span>Contacter {p.firstName || "le Candidat"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* VUE 1 : PORTFOLIO WEB SITE INTERACTIF                                     */}
      {/* ========================================================================= */}
      {activeTab === "portfolio" ? (
        <div className="w-full space-y-16 sm:space-y-24 pb-20">
          {/* ======================================================================= */}
          {/* 2. HERO SECTION IMMERSIVE DU CANDIDAT                                   */}
          {/* ======================================================================= */}
          <section id="hero" className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 overflow-hidden">
            {/* Halo lumineux */}
            <div
              className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[300px] blur-[120px] rounded-full pointer-events-none -z-10 opacity-20"
              style={{ backgroundColor: primaryColor }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                {/* Colonne Accroche & Textes (7 col) */}
                <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                  {/* Badge Disponibilité & Certifié */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Profil Candidat Certifié • Disponible pour opportunités</span>
                  </div>

                  {/* Titre & Identité */}
                  <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
                    Bonjour, je suis{" "}
                    <span
                      className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400"
                    >
                      {candidateFullName}.
                    </span>
                  </h1>

                  {/* Titre Professionnel */}
                  <div className="text-lg sm:text-2xl font-extrabold text-blue-500 tracking-tight">
                    {p.title || "Professionnel d'Excellence"}
                  </div>

                  {/* Pitch / Bio courte */}
                  <p
                    className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {resumeData.summary ||
                      "Professionnel rigoureux et orienté résultats, alliant expertise technique et méthodologie agile pour créer une forte valeur ajoutée commerciale."}
                  </p>

                  {/* Double Appel à l'action Responsive (Plein écran mobile) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-2">
                    <a
                      href="#contact"
                      className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                    >
                      <Send className="w-4 h-4" />
                      <span>Me Contacter / Recruter</span>
                    </a>

                    <a
                      href="#projets"
                      className={`px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
                        isDark
                          ? "bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-white"
                          : "bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span>Voir mes Réalisations</span>
                    </a>
                  </div>

                  {/* Coordonnées Rapides */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-slate-400 font-semibold pt-1">
                    {[p.city, p.country].filter(Boolean).length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{[p.city, p.country].filter(Boolean).join(", ")}</span>
                      </span>
                    )}
                    {p.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{p.email}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Colonne Portrait & Cartes Flottantes Compactes (5 col) */}
                <div className="lg:col-span-5 relative flex justify-center">
                  <div className="relative w-full max-w-[240px] sm:max-w-[270px]">
                    {/* Cadre Portrait */}
                    <div className="relative rounded-3xl p-1.5 bg-gradient-to-b from-blue-500/30 via-indigo-500/20 to-transparent shadow-xl">
                      <div className="overflow-hidden rounded-2xl aspect-[4/5] bg-slate-900 relative">
                        {p.photoUrl && resumeData.design.showPhoto ? (
                          <img
                            src={p.photoUrl}
                            alt={candidateFullName}
                            className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white font-black text-5xl"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {p.firstName?.[0] || "C"}{p.lastName?.[0] || "V"}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50" />
                      </div>
                    </div>

                    {/* Carte Flottante : Score de Satisfaction Client */}
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
                          <span>99.8%</span>
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        </div>
                        <p className="text-[9px] font-semibold text-slate-400">
                          Satisfaction recruteurs
                        </p>
                      </div>
                    </div>

                    {/* Badge Flottant Supérieur */}
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
                        <span className="text-[11px] font-black block">Conforme ATS</span>
                        <span className="text-[9px] font-semibold text-slate-400">Score 98/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bandeau Métriques de Réassurance Responsive */}
              <div
                className={`mt-12 sm:mt-16 p-5 sm:p-7 rounded-3xl border grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center ${
                  isDark
                    ? "bg-[#121318]/80 border-slate-800/80 shadow-xl"
                    : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div>
                  <span className="text-2xl sm:text-4xl font-black text-blue-500 block">
                    {experiencesList.length}+
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                    Postes Clés
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-4xl font-black text-indigo-400 block">
                    {skillsList.reduce((acc, s) => acc + s.items.length, 0)}+
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                    Compétences
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-4xl font-black text-emerald-400 block">
                    100%
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                    Délais Respectés
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-4xl font-black text-amber-400 block">
                    5.0 ★
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                    Évaluation Pro
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 3. SECTION À PROPOS & VALEURS                                           */}
          {/* ======================================================================= */}
          <section
            id="apropos"
            className={`py-16 border-y ${
              isDark ? "bg-[#0e0f14] border-slate-800/80" : "bg-slate-100/70 border-slate-200"
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
              <div className="max-w-3xl space-y-2 text-center sm:text-left">
                <span className="text-xs font-black uppercase tracking-widest text-blue-500">
                  Philosophie de Travail
                </span>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                  Rigueur d'Exécution & Recherche de Valeur
                </h2>
                <p
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Chaque projet est conduit avec une méthodologie éprouvée axée sur la satisfaction des parties prenantes, le respect scrupuleux des engagements et l'impact opérationnel mesurable.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    title: "Excellence du détail",
                    desc: "Une attention constante portée à la qualité du livrable, au balisage sémantique et à l'ergonomie globale.",
                    icon: Palette,
                  },
                  {
                    title: "Orientation Résultats",
                    desc: "Des actions orientées vers le retour sur investissement, la conversion et l'efficacité quotidienne.",
                    icon: Zap,
                  },
                  {
                    title: "Communication Fluide",
                    desc: "Transparence, écoute active et réactivité constante pour bâtir une confiance pérenne avec les recruteurs.",
                    icon: Users,
                  },
                ].map((val, idx) => {
                  const IconComp = val.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-6 rounded-3xl border transition-all hover:scale-[1.02] ${
                        isDark
                          ? "bg-[#14161f] border-slate-800 hover:border-blue-500/40 shadow-lg"
                          : "bg-white border-slate-200 hover:border-blue-300 shadow-xs"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-500 mb-4">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-base mb-1.5">{val.title}</h3>
                      <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {val.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 4. GRILLE DE COMPÉTENCES & STACK (DYNAMIQUE)                           */}
          {/* ======================================================================= */}
          <section id="competences" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Pôles d'Expertise
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Compétences & Savoir-Faire
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {skillsList.map((sk, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-3xl border transition-all ${
                    isDark
                      ? "bg-[#121318] border-slate-800 hover:border-indigo-500/40"
                      : "bg-white border-slate-200 hover:border-indigo-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <h3 className="font-bold text-sm sm:text-base">{sk.category}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sk.items.map((item, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-default hover:scale-105 ${
                          isDark
                            ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-blue-500"
                            : "bg-slate-100 border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-400"
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 5. SHOWCASE PROJETS AVEC FILTRES RESTE COMPACT & BIEN RANGÉ            */}
          {/* ======================================================================= */}
          <section
            id="projets"
            className={`py-16 border-y ${
              isDark ? "bg-[#0e0f14] border-slate-800/80" : "bg-slate-100/70 border-slate-200"
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-blue-500">
                    Réalisations
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-1">
                    Études de Cas & Projets
                  </h2>
                </div>

                {/* Filtres Swipeables sur Mobile */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
                  {["Tous", "Web", "Mobile", "UI/UX"].map((filter) => (
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

              {/* Grille des Projets Compacte & Alignée */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${
                      isDark
                        ? "bg-[#14151d] border-slate-800/90 hover:border-blue-500/50 shadow-lg"
                        : "bg-white border-slate-200 hover:border-blue-400 shadow-xs"
                    }`}
                  >
                    <div>
                      {/* En-tête macOS Propre & Tidy */}
                      <div
                        className={`px-3 py-1.5 flex items-center justify-between border-b ${
                          isDark ? "bg-[#0f1015] border-slate-800" : "bg-slate-100/90 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500/70" />
                          <span className="w-2 h-2 rounded-full bg-amber-500/70" />
                          <span className="w-2 h-2 rounded-full bg-emerald-500/70" />
                        </div>
                        <span className="text-[9.5px] font-mono text-slate-400">
                          {proj.category.toLowerCase()}.preview
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isDark ? "bg-slate-800 text-blue-400" : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {proj.category}
                        </span>
                      </div>

                      {/* Mockup Compact */}
                      <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-950">
                        <img
                          src={proj.imageUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-40" />
                      </div>

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
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10.5px] font-bold">
                          {proj.metrics}
                        </div>
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

                    <div className="px-4 sm:px-5 pb-4 pt-1">
                      <a
                        href="#contact"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        <span>Échanger sur ce type de projet</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 6. TIMELINE D'EXPÉRIENCE DU CANDIDAT                                    */}
          {/* ======================================================================= */}
          <section id="experience" className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
            <div className="text-center space-y-1.5">
              <span className="text-xs font-black uppercase tracking-widest text-blue-500">
                Parcours Professionnel
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Expérience & Postes Occupés
              </h2>
            </div>

            <div className="relative border-l-2 border-blue-600/30 ml-2 sm:ml-6 space-y-8 pl-5 sm:pl-8">
              {experiencesList.map((exp, idx) => (
                <div key={exp.id || idx} className="relative group">
                  <div className="absolute -left-[27px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-4 border-[#0b0c10] shadow-md shadow-blue-500/50 group-hover:scale-125 transition-transform" />

                  <div
                    className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                      isDark
                        ? "bg-[#121318] border-slate-800 hover:border-slate-700"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-extrabold text-blue-500">
                        {exp.startDate} — {exp.current ? "Présent" : exp.endDate}
                      </span>
                      {[exp.city, exp.country].filter(Boolean).length > 0 && (
                        <span className="text-[11px] font-medium text-slate-400">
                          {[exp.city, exp.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg">{exp.role || (exp as any).position || "Poste Occupé"}</h3>
                    <p className="text-xs font-bold text-indigo-400 mt-0.5 mb-2.5">
                      {exp.company}
                    </p>
                    {exp.highlights && exp.highlights.length > 0 ? (
                      <ul className="space-y-1.5">
                        {exp.highlights.map((h, hIdx) => (
                          <li
                            key={hIdx}
                            className={`text-xs sm:text-sm leading-relaxed flex items-start gap-2 ${
                              isDark ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        className={`text-xs sm:text-sm leading-relaxed ${
                          isDark ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {(exp as any).rawInput || "Responsabilités et réalisations opérationnelles."}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 7. OFFRES & SOLUTIONS CLÉ-EN-MAIN                                       */}
          {/* ======================================================================= */}
          <section
            id="services"
            className={`py-16 border-y ${
              isDark ? "bg-[#0e0f14] border-slate-800/80" : "bg-slate-100/70 border-slate-200"
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                  Services Disponibles
                </span>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                  Prestations & Collaborations
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    title: "Recrutement CDI / CDD",
                    subtitle: "Intégration au sein d'une équipe produit ou technique",
                    deliverables: ["Disponibilité immédiate", "Autonomie opérationnelle", "Adhésion aux objectifs d'entreprise", "Rapport hebdomadaire"],
                  },
                  {
                    title: "Consulting & Mission Freelance",
                    subtitle: "Intervention ciblée sur vos chantiers prioritaires",
                    deliverables: ["Audit des besoins", "Livrables clés en main", "Transfert de compétences", "Support post-livraison"],
                  },
                  {
                    title: "Conception & Direction de Projet",
                    subtitle: "De la formalisation du besoin au déploiement en production",
                    deliverables: ["Spécifications détaillées", "Suivi des jalons agiles", "Validation de la qualité", "Documentation complète"],
                  },
                ].map((srv, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
                      isDark
                        ? "bg-[#14151d] border-slate-800 hover:border-emerald-500/40 shadow-lg"
                        : "bg-white border-slate-200 hover:border-emerald-400 shadow-xs"
                    }`}
                  >
                    <div className="space-y-3.5">
                      <h3 className="font-extrabold text-base sm:text-lg">{srv.title}</h3>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {srv.subtitle}
                      </p>
                      <div className="h-px bg-slate-800 my-1" />
                      <div className="space-y-2">
                        {srv.deliverables.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className={isDark ? "text-slate-300" : "text-slate-700"}>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400">Devis sous 24h</span>
                      <a
                        href="#contact"
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
                      >
                        <span>Discuter</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 8. BANNIÈRE CALL-TO-ACTION PERCUTANTE                                  */}
          {/* ======================================================================= */}
          <section className="px-4 sm:px-6">
            <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-bold uppercase tracking-wider text-sky-200">
                  Prise de Contact Immédiate
                </span>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  Vous avez un poste ou un projet à pourvoir ?
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto leading-relaxed">
                  Échangeons directement par WhatsApp ou via le formulaire ci-dessous pour planifier un premier entretien.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacter sur WhatsApp Direct</span>
                  </a>
                  <a
                    href="#contact"
                    className="w-full sm:w-auto px-6 py-3.5 bg-white text-blue-900 font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105"
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Envoyer un Message Formel</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 9. FORMULAIRE DE CONTACT & COORDONNÉES DIRECTES                       */}
          {/* ======================================================================= */}
          <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Coordonnées */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-blue-500">
                    Contact Direct
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-1">
                    Échanger avec {p.firstName || "le Candidat"}
                  </h2>
                  <p className={`text-xs sm:text-sm mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Réponse assurée dans les 24 heures pour toute proposition sérieuse.
                  </p>
                </div>

                <div className="space-y-3">
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                        isDark ? "bg-[#14151d] border-slate-800 hover:border-blue-500/50" : "bg-white border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-600/15 text-blue-500 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block">Email Professionnel</span>
                        <span className="text-xs sm:text-sm font-bold truncate block">{p.email}</span>
                      </div>
                    </a>
                  )}

                  {p.phone && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                        isDark ? "bg-[#14151d] border-slate-800 hover:border-emerald-500/50" : "bg-white border-slate-200 hover:border-emerald-400"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block">Téléphone / WhatsApp</span>
                        <span className="text-xs sm:text-sm font-bold truncate block">{p.phone}</span>
                      </div>
                    </a>
                  )}

                  {[p.city, p.country].filter(Boolean).length > 0 && (
                    <div
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                        isDark ? "bg-[#14151d] border-slate-800" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Localisation</span>
                        <span className="text-xs sm:text-sm font-bold block">
                          {[p.city, p.country].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    </div>
                  )}

                  {p.linkedin && (
                    <a
                      href={p.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                        isDark ? "bg-[#14151d] border-slate-800 hover:border-blue-500/50" : "bg-white border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-600/15 text-blue-500 flex items-center justify-center shrink-0">
                        <Linkedin className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block">Profil LinkedIn</span>
                        <span className="text-xs sm:text-sm font-bold truncate block">Consulter le profil</span>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Formulaire Responsive */}
              <div
                className={`lg:col-span-7 p-5 sm:p-7 rounded-3xl border ${
                  isDark ? "bg-[#121318] border-slate-800/90 shadow-xl" : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                {contactSent ? (
                  <div className="py-12 text-center space-y-3 fade-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold">Message transmis avec succès !</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Votre prise de contact a été enregistrée. {candidateFullName} vous répondra très rapidement.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-3.5">
                    <h3 className="font-extrabold text-base mb-1">
                      Envoyer une proposition ou un message
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Votre Nom / Entreprise <span className="text-red-400">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Cabinet / Recruteur"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Votre Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          required
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="contact@entreprise.com"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Téléphone / WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+225 07 00 00 00 00"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Objet de l'Échange
                        </label>
                        <select
                          value={contactProjectType}
                          onChange={(e) => setContactProjectType(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                        >
                          <option>Offre d'Emploi CDI / CDD</option>
                          <option>Mission Freelance / Consulting</option>
                          <option>Entretien de Présélection</option>
                          <option>Autre Demande Professionnelle</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Détails de l'opportunité <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Présentez brièvement le poste, les responsabilités ou vos attentes..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Transmettre la proposition</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* Bannière Déblocage VIP (Si le candidat n'a pas encore le pack 5000) */}
          {resumeData.planTier !== "5000" && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      Vous êtes propriétaire de ce CV ?
                    </h4>
                    <p className="text-[11px] text-purple-200">
                      Débloquez le domaine personnalisé, l'hébergement VIP et la réécriture prioritaire.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 text-white font-bold rounded-xl text-xs shadow-md shrink-0 cursor-pointer"
                >
                  Débloquer le Pack VIP (5 000 F)
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VUE 2 : FORMAT CV IMPRIMABLE A4                                           */
        /* ========================================================================= */
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Format CV A4 Conforme ATS</h3>
                <p className="text-[11px] text-slate-400">Prêt pour l'impression et les candidatures officielles</p>
              </div>
            </div>
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger ce CV en PDF</span>
            </button>
          </div>

          <div className="flex justify-center bg-slate-900/50 p-3 sm:p-8 rounded-3xl border border-slate-800 overflow-x-auto shadow-2xl">
            <CVPreviewCanvas data={resumeData} scale={0.88} />
          </div>
        </div>
      )}

      {/* Footer Global */}
      <footer
        className={`py-8 border-t text-center text-xs ${
          isDark ? "bg-[#090a0e] border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-500"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Portfolio de {candidateFullName}</span>
            <span>•</span>
            <span>Propulsé par MonCV.ai • Développé par <strong>INNOVA GROUP</strong></span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <Link href="/terms" className="hover:text-blue-400 transition-colors">
              Conditions d'Utilisation
            </Link>
            <Link href="/contact" className="hover:text-blue-400 transition-colors">
              Nous Contacter
            </Link>
            <Link href="/create" className="text-blue-500 font-bold hover:underline">
              Créer votre propre Portfolio Web & CV ATS →
            </Link>
          </div>
        </div>
      </footer>

      {/* Modale de Paiement Mobile Money */}
      <MobileMoneyModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        defaultPlan="5000"
        onSuccess={() => {
          const fresh = StorageManager.getActiveResume();
          if (fresh) {
            setResumeData(fresh);
          }
        }}
      />

      {/* Bouton Flottant de retour à l'accueil MonCV.ai */}
      <div className="fixed bottom-5 left-5 z-40 no-print">
        <Link
          href="/"
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            isDark
              ? "bg-[#121318]/95 border-slate-700/80 text-slate-200 hover:text-white hover:border-blue-500 shadow-black/70"
              : "bg-white/95 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-blue-300 shadow-slate-300/50"
          }`}
          title="Retourner à l'accueil du site MonCV.ai"
        >
          <Home className="w-4 h-4 text-blue-500" />
          <span>← Accueil MonCV.ai</span>
        </Link>
      </div>
    </div>
  );
}
