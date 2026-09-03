"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileMoneyModal } from "@/components/tools/MobileMoneyModal";
import { AuthModal } from "@/components/tools/AuthModal";
import { LiveSocialProofToast } from "@/components/tools/LiveSocialProofToast";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Target,
  QrCode,
  Smartphone,
  ShieldCheck,
  FileCheck,
  Star,
  Layers,
  FileText,
  Check,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  Flame,
  Globe,
  Building,
  ChevronDown,
  Palette,
  Briefcase,
  Wand2,
  ScanLine,
  Clock,
  ThumbsUp,
  XCircle,
  HelpCircle,
  PhoneCall,
  Download,
  Lock,
  Crown,
  Eye,
  AlertTriangle,
  ExternalLink,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";

// Données des templates pour l'exposition & la démo interactive
const TEMPLATE_GALLERY = [
  {
    id: "modern",
    name: "Moderne",
    tag: "Le Plus Populaire",
    desc: "Sidebar latérale colorée, timeline fluide et compétences encadrées anti-débordement.",
    accent: "#2563eb",
    idealFor: "Tech, Gestion, Commerce & Startups",
    rating: "4.9/5",
  },
  {
    id: "elegant",
    name: "Élégant",
    tag: "Prestige & Cadres",
    desc: "En-tête centré avec police serif haut de gamme, séparateurs subtils et structure équilibrée.",
    accent: "#0f172a",
    idealFor: "Direction, Conseil, Juridique & Audit",
    rating: "4.9/5",
  },
  {
    id: "corporate",
    name: "Corporate",
    tag: "Grandes Entreprises",
    desc: "Grille rigoureuse 12 colonnes, cartouche de synthèse et badges épurés.",
    accent: "#1e3a8a",
    idealFor: "Banque, Finance, ONG & Télécoms",
    rating: "4.8/5",
  },
  {
    id: "minimal",
    name: "Minimaliste",
    tag: "Épuré & Impactant",
    desc: "Mise en page scandinave aérée sur grille dates/missions sans artifice visuel.",
    accent: "#18181b",
    idealFor: "Ingénieurs, Designers & Développeurs",
    rating: "4.8/5",
  },
  {
    id: "creative",
    name: "Créatif",
    tag: "Audacieux",
    desc: "Bannière dynamique colorée, pilules de compétences arrondies et blocs distincts.",
    accent: "#7c3aed",
    idealFor: "Marketing, Communication & Médias",
    rating: "4.9/5",
  },
  {
    id: "ats",
    name: "ATS Optimisé",
    tag: "100% Validé Robot",
    desc: "Format linéaire pur sans tableau ni colonne, garantissant 100% de passage des filtres ATS.",
    accent: "#059669",
    idealFor: "Multinationales (Workday, Taleo, BambooHR)",
    rating: "5.0/5",
  },
];

const COLOR_PALETTE = [
  "#2563eb", // Bleu Roi
  "#7c3aed", // Violet
  "#059669", // Émeraude
  "#dc2626", // Rouge Carmin
  "#0f172a", // Noir Ardoise
  "#b45309", // Ambre
];

const TESTIMONIALS = [
  {
    name: "Aïcha Traoré",
    role: "Responsable Marketing Digital",
    company: "Recrutée chez Wave Côte d'Ivoire",
    country: "Abidjan, Côte d'Ivoire",
    flag: "🇨🇮",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    quote: "J'envoyais des dizaines de CVs sans réponse à Abidjan. En 5 minutes sur MonCV.ai, l'IA a reformulé mes accomplissements avec la méthode STAR. J'ai décroché 3 entretiens en 2 semaines !",
    score: "Score ATS : 98%",
  },
  {
    name: "Mamadou Diop",
    role: "Ingénieur Télécoms & Infrastructure Cloud",
    company: "Recruté chez Orange Sénégal",
    country: "Dakar, Sénégal",
    flag: "🇸🇳",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    quote: "Le générateur de demande d'emploi adaptée au style officiel africain m'a fait gagner un temps précieux. Le paiement Wave à 2 500 FCFA est super pratique et accessible.",
    score: "Score ATS : 95%",
  },
  {
    name: "Salimata Ouédraogo",
    role: "Chargée des Ressources Humaines & Talents",
    company: "Recrutée dans une ONG Internationale",
    country: "Ouagadougou, Burkina Faso",
    flag: "🇧🇫",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    quote: "Le format de lettre officielle du Burkina Faso est parfait ! Les marges et les formules de politesse sont exactement ce que les directeurs et DRH recherchent.",
    score: "Score ATS : 99%",
  },
  {
    name: "Boris N'Koulou",
    role: "Analyste Financier & Contrôleur de Gestion",
    company: "Recruté chez Société Générale Cameroun",
    country: "Douala, Cameroun",
    flag: "🇨🇲",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    quote: "Le scanner ATS en direct vous dit exactement pourquoi votre CV est rejeté et comment corriger les mots-clés. C'est le meilleur investissement pour sa carrière.",
    score: "Score ATS : 97%",
  },
  {
    name: "Fatoumata Coulibaly",
    role: "Chef de Projet Supply Chain & Logistique",
    company: "Recrutée chez Bolloré Logistics Mali",
    country: "Bamako, Mali",
    flag: "🇲🇱",
    avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=300&auto=format&fit=crop&q=80",
    quote: "Le Portfolio Web généré automatiquement avec le QR Code HD a bluffé le jury de recrutement lors de mon entretien d'embauche !",
    score: "Score ATS : 96%",
  },
  {
    name: "Koffi Mensah",
    role: "Consultant Senior Data & Architecture IA",
    company: "Recruté chez Capgemini Paris",
    country: "Paris, France (Diaspora)",
    flag: "🇫🇷",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    quote: "Pour postuler en Europe et au Canada depuis l'Afrique, MonCV.ai réaménage le CV aux normes internationales sans aucun défaut.",
    score: "Score ATS : 100%",
  },
];

const FAQS = [
  {
    q: "Pourquoi le téléchargement PDF est-il réservé aux offres payantes ?",
    a: "L'offre gratuite vous permet de tester l'assistant IA, d'entrer vos données et de visualiser le rendu en temps réel avec filigrane. Les offres à partir de 1 500 FCFA débloquent l'export PDF vectoriel A4 haute définition sans filigrane, prêt à être envoyé directement aux recruteurs.",
  },
  {
    q: "Comment fonctionne le paiement par Mobile Money (Wave, Orange, MTN) ?",
    a: "C'est instantané et 100% sécurisé ! Vous sélectionnez votre pays (Côte d'Ivoire, Sénégal, Burkina Faso, Cameroun, etc.) et votre opérateur (Wave, Orange Money, MTN MoMo, Moov). Vous validez avec votre numéro et votre compte est débloqué immédiatement sans carte bancaire.",
  },
  {
    q: "Qu'est-ce que le générateur officiel de Demande d'Emploi (inclus dès 2 500 FCFA) ?",
    a: "En Afrique francophone (Burkina Faso, Côte d'Ivoire, Sénégal, Mali, Cameroun...), les institutions exigent souvent une lettre de demande d'emploi rédigée selon un protocole administratif précis (destinataire avec titre exact, objet souligné, ville/date à droite). Notre IA génère ce document officiel sur 1 page en 1 clic.",
  },
  {
    q: "Qu'est-ce que le Portfolio Web Personnel (inclus dans l'offre 5 000 FCFA) ?",
    a: "L'offre VIP à 5 000 FCFA génère automatiquement une page web interactive hébergée à votre nom présentant votre parcours, vos projets et vos compétences, accessible via un lien unique et un QR Code HD à partager avec les recruteurs du monde entier.",
  },
];

export default function HomePage() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<"1500" | "2500" | "5000">("2500");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("modern");
  const [activeColor, setActiveColor] = useState("#2563eb");
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveTemplate((prev) => {
        const idx = TEMPLATE_GALLERY.findIndex((t) => t.id === prev);
        return TEMPLATE_GALLERY[(idx + 1) % TEMPLATE_GALLERY.length].id;
      });
      setActiveColor((prev) => {
        const idx = COLOR_PALETTE.indexOf(prev);
        return COLOR_PALETTE[(idx + 1) % COLOR_PALETTE.length];
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const handleStartCreation = () => {
    setIsAuthOpen(true);
  };

  const handleOpenPlanPayment = (plan: "1500" | "2500" | "5000") => {
    setSelectedPlanPrice(plan);
    setIsPaymentOpen(true);
  };

  const selectedTpl = TEMPLATE_GALLERY.find((t) => t.id === activeTemplate) || TEMPLATE_GALLERY[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden">
      <Navbar
        onOpenPayment={() => handleOpenPlanPayment("2500")}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION DYNAMIQUE & IMPACTANTE */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20 bg-radial-hero bg-grid-pattern">
          {/* Halos de lumière ambiants */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[480px] bg-gradient-to-tr from-blue-500/15 via-indigo-400/15 to-purple-500/15 blur-3xl -z-10 pointer-events-none animate-pulse-glow" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute top-1/3 -right-24 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            {/* Badge flottant avec effet shimmer */}
            <div
              onClick={handleStartCreation}
              className="shimmer-badge inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-blue-200/80 shadow-xs text-slate-800 text-xs font-semibold mb-4 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-900 font-bold">+18 450 CVs créés</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600 font-semibold">Afrique & International</span>
              <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] rounded-full font-bold uppercase tracking-wider shadow-xs">
                IA 2026
              </span>
            </div>

            {/* Titre Principal Moderne, Équilibré & Stylé (Taille optimisée & bien alignée) */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-snug sm:leading-tight max-w-2xl mx-auto px-4">
              Répondez à quelques questions. <br className="hidden sm:inline" />
              Votre{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                CV d'Excellence
              </span>{" "}
              est prêt en 5 minutes.
            </h1>

            {/* Sous-titre Épuré & Lisible */}
            <p className="mt-3.5 text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal px-4">
              Fini les rejets silencieux et les heures perdues sur Word. Notre IA transforme vos réponses en un CV percutant selon la <strong className="text-slate-900 font-semibold">méthode STAR</strong>, optimisé pour les <strong className="text-slate-900 font-semibold">robots ATS</strong> et conforme aux exigences des recruteurs.
            </p>

            {/* CTAs d'action Compacts & Animés */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 max-w-2xl mx-auto px-4">
              <button
                type="button"
                onClick={handleStartCreation}
                className="whitespace-nowrap px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer animate-cta-loop shadow-xl shadow-blue-600/30 active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-blue-200 shrink-0" />
                <span className="whitespace-nowrap font-black">Créer mon CV Gratuitement</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <a
                href="#exposition-modeles"
                className="whitespace-nowrap px-6 py-3.5 sm:px-7 sm:py-4 bg-white/95 backdrop-blur-md hover:bg-blue-50/70 text-slate-800 font-bold rounded-2xl border border-slate-200/90 shadow-md hover:shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:border-blue-300 animate-btn-secondary-loop cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
                <span className="whitespace-nowrap">Galerie des Modèles</span>
              </a>

              <Link
                href="/portfolio"
                target="_blank"
                className="whitespace-nowrap px-6 py-3.5 sm:px-7 sm:py-4 bg-purple-50 hover:bg-purple-100/90 text-purple-900 font-bold rounded-2xl border border-purple-200 shadow-md hover:shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer btn-press"
              >
                <Globe className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Portfolio Web Démo</span>
                <span className="px-1.5 py-0.2 rounded-md bg-purple-600 text-white text-[9px] font-black uppercase">
                  VIP
                </span>
              </Link>
            </div>

            {/* Social Proof & Avis */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2.5 overflow-hidden">
                  {TESTIMONIALS.map((t, idx) => (
                    <img
                      key={idx}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-xs"
                      src={t.avatar}
                      alt={t.name}
                    />
                  ))}
                </div>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current drop-shadow-xs" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  4.9/5 <span className="font-medium text-slate-500">(1 240+ avis vérifiés)</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Sans inscription obligatoire
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Score ATS 0-100% en direct
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Wave & Mobile Money acceptés
                </span>
              </div>
            </div>

            {/* APERÇU LIVE INTERACTIF DU CV & PRESTIGE MOCKUP */}
            <div className="mt-12 max-w-4xl mx-auto relative">
              {/* Cadre de simulation avec barre de titre */}
              <div className="rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden text-left relative transition-all hover:shadow-blue-500/10">
                {/* Barre de navigation simulée */}
                <div className="bg-slate-100/90 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                  </div>
                  <div className="px-4 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-500 font-medium flex items-center gap-2 max-w-xs truncate shadow-2xs">
                    <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">moncv.ai/c/jean-marc-kouassi</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Optimisé STAR & ATS</span>
                  </div>
                </div>

                {/* Contenu visuel simulé du CV */}
                <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
                        JMK
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                          Jean-Marc Kouassi
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-blue-600">
                          Lead Architecte Cloud & Chef de Projet Digital
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Abidjan, Côte d'Ivoire • Discutons de vos projets
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Score ATS : 98% Conforme
                      </span>
                    </div>
                  </div>

                  {/* Badges flottants d'avantages majeurs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">PDF Haute Définition</p>
                        <p className="text-[10px] text-slate-500">Format A4 Vectoriel sans filigrane</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">Demande d'Emploi</p>
                        <p className="text-[10px] text-slate-500">Protocole officiel Word & PDF</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">Lettre de Motivation IA</p>
                        <p className="text-[10px] text-slate-500">Ciblée selon l'offre de recrutement</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BANDEAU METRIQUES DE CONFIANCE */}
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-2xl sm:text-3xl font-black text-blue-600">+18 450</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">CVs Téléchargés</div>
                </div>
                <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600">98.4%</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">Validation Robots ATS</div>
                </div>
                <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-2xl sm:text-3xl font-black text-indigo-600">3.2x Plus</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">D'appels Recruteurs</div>
                </div>
                <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-2xl sm:text-3xl font-black text-amber-500">5 Minutes</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">Chrono avec l'IA</div>
                </div>
              </div>
            </div>

            {/* Bandeau Entreprises */}
            <div className="mt-10 pt-6 border-t border-slate-200/70">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Nos candidats ont été embauchés chez les leaders en Afrique et en Europe
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-75 grayscale hover:grayscale-0 transition-all">
                {["Orange", "Wave", "MTN", "TotalEnergies", "Ecobank", "Société Générale", "Canal+", "Moov"].map((name) => (
                  <span key={name} className="text-xs sm:text-sm font-black text-slate-700 tracking-tight">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. NOUVELLE SECTION : EXPOSITION & GALERIE DES MODÈLES DE CV */}
        {/* ========================================================================= */}
        <section id="exposition-modeles" className="py-10 sm:py-14 bg-gradient-to-b from-white via-slate-50 to-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Collection Officielle 2026</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Exposition de nos Modèles de CV Professionnels
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-2">
                Conçus selon les critères de recrutement les plus stricts. Choisissez le modèle adapté à votre secteur d'activité.
              </p>
            </div>

            {/* Grille d'exposition visuelle 6 Modèles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATE_GALLERY.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Aperçu Visuel Card */}
                  <div className="p-5 bg-slate-50/80 border-b border-slate-100 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                        {tpl.tag}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{tpl.rating}</span>
                      </div>
                    </div>

                    {/* Miniature de CV stylisée */}
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 h-48 overflow-hidden relative group-hover:scale-[1.02] transition-transform">
                      {/* Entête miniature */}
                      <div
                        className="h-10 rounded-xl p-2 flex items-center justify-between text-white mb-2.5"
                        style={{ backgroundColor: tpl.accent }}
                      >
                        <div className="space-y-0.5">
                          <div className="w-16 h-2 bg-white/90 rounded" />
                          <div className="w-24 h-1.5 bg-white/70 rounded" />
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-[9px] font-black">
                          CV
                        </div>
                      </div>

                      {/* Lignes simulées */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="w-1/3 space-y-1.5 border-r border-slate-100 pr-1.5">
                            <div className="w-10 h-1.5 bg-slate-400 rounded" />
                            <div className="w-full h-1 bg-slate-200 rounded" />
                            <div className="w-4/5 h-1 bg-slate-200 rounded" />
                            <div className="w-12 h-1.5 bg-slate-400 rounded mt-2" />
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="w-6 h-2 rounded bg-blue-50 border border-blue-200" />
                              <span className="w-8 h-2 rounded bg-blue-50 border border-blue-200" />
                            </div>
                          </div>
                          <div className="w-2/3 space-y-1.5">
                            <div className="w-16 h-1.5 bg-slate-700 rounded" />
                            <div className="w-full h-1 bg-slate-200 rounded" />
                            <div className="w-5/6 h-1 bg-slate-200 rounded" />
                            <div className="w-14 h-1.5 bg-slate-700 rounded mt-2" />
                            <div className="w-full h-1 bg-slate-200 rounded" />
                            <div className="w-3/4 h-1 bg-slate-200 rounded" />
                          </div>
                        </div>
                      </div>

                      {/* Badge flottant hover */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTemplate(tpl.id);
                            const el = document.getElementById("demo-interactive");
                            el?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="px-4 py-2 bg-white text-slate-900 font-bold rounded-xl text-xs shadow-lg hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tester ce modèle</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Infos Card */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Modèle {tpl.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {tpl.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium text-slate-400">Recommandé pour :</span>
                      <span className="text-[11px] font-bold text-blue-700 text-right truncate max-w-[160px]">
                        {tpl.idealFor}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartCreation}
                      className="w-full py-2.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Personnaliser ce modèle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. DÉMO INTERACTIVE : STUDIO DE PERSONNALISATION TEMPS RÉEL (ANIMÉ & RESPONSIVE) */}
        {/* ========================================================================= */}
        <section id="demo-interactive" className="py-10 sm:py-16 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
          {/* Aura lumineuse de fond réactive à la couleur active */}
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-25 transition-all duration-700 pointer-events-none"
            style={{ backgroundColor: activeColor }}
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-center sm:text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-2 border border-blue-500/20">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Studio de Personnalisation en Direct</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Changez le modèle et la couleur instantanément
                </h2>
              </div>

              {/* Bouton Toggle Auto-Play */}
              <button
                type="button"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                  isAutoPlay
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAutoPlay ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                <span>{isAutoPlay ? "▶ Démonstration Automatique" : "⏸ Pause Démo"}</span>
              </button>
            </div>

            {/* Sélecteur de templates (Pills Responsive) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-8">
              {TEMPLATE_GALLERY.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setActiveTemplate(tpl.id);
                    setIsAutoPlay(false);
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTemplate === tpl.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105 border border-blue-400"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/80"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${activeTemplate === tpl.id ? "bg-white animate-pulse" : "bg-slate-500"}`} />
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>

            {/* Studio Container (Grille Responsive Controls + Live Demo CV) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl backdrop-blur-xl">
              
              {/* Contrôles de Gauche */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Modèle sélectionné
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    Template {selectedTpl.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    {selectedTpl.desc}
                  </p>
                </div>

                {/* Sélecteur de palette de couleurs */}
                <div>
                  <p className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                    <span>Couleur d'accentuation en direct :</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setActiveColor(c);
                          setIsAutoPlay(false);
                        }}
                        style={{ backgroundColor: c }}
                        className={`w-9 h-9 rounded-2xl transition-all shadow-md cursor-pointer ${
                          activeColor === c
                            ? "ring-4 ring-white/50 scale-110 shadow-lg"
                            : "hover:scale-105 opacity-75 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Format officiel A4 avec proportions d'or</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Compétences avec encadrement anti-coupure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Export PDF Vectoriel Haute Résolution</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartCreation}
                  style={{ backgroundColor: activeColor }}
                  className="w-full py-4 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95 transform hover:-translate-y-0.5 active:translate-y-0 animate-cta-loop"
                >
                  <Wand2 className="w-4.5 h-4.5" />
                  <span>Utiliser ce modèle {selectedTpl.name}</span>
                </button>
              </div>

              {/* Carte Démo Interactive à Droite (Levitation & Rendu Réactif) */}
              <div className="lg:col-span-7 flex justify-center">
                <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden relative transform hover:-translate-y-1.5 transition-all duration-300 group">
                  <div
                    className="p-6 text-white transition-colors duration-500 relative"
                    style={{ backgroundColor: activeColor }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9.5px] font-bold uppercase tracking-widest opacity-90">
                          Profil Démonstration
                        </span>
                        <h4 className="text-xl font-black">Jean-Marc Kouassi</h4>
                        <p className="text-xs opacity-90 font-medium">Ingénieur Logiciel & Chef de Projet</p>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-sm font-black shadow-inner">
                        JMK
                      </div>
                    </div>

                    {/* Badge Match ATS */}
                    <div className="absolute top-4 right-4 bg-slate-900/90 text-white backdrop-blur-md border border-slate-700 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black">ATS Match : 98%</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 text-xs">
                    <div>
                      <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1" style={{ color: activeColor }}>
                        Profil Professionnel (Méthode STAR)
                      </h5>
                      <p className="text-slate-600 leading-relaxed text-[11.5px]">
                        Ingénieur avec 5+ ans d'expérience. A piloté la refonte du système de paiement de 3 banques ouest-africaines, augmentant le volume de transactions de 42%.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1.5" style={{ color: activeColor }}>
                        Expérience Récente
                      </h5>
                      <div className="border-l-2 pl-3 space-y-1" style={{ borderColor: activeColor }}>
                        <div className="flex justify-between font-bold text-slate-800 text-[11.5px]">
                          <span>Lead Architecte Backend • Fintech CI</span>
                          <span className="text-slate-400 font-normal">2022 – Présent</span>
                        </div>
                        <p className="text-slate-500 text-[10.5px]">
                          • Optimisation des flux API Mobile Money (Wave, Orange Money) pour 250k+ utilisateurs.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1.5" style={{ color: activeColor }}>
                        Compétences Clés
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {["TypeScript", "Next.js", "Python", "Mobile Money API", "Docker", "Gestion de Projet"].map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-colors"
                            style={{
                              backgroundColor: `${activeColor}12`,
                              borderColor: `${activeColor}35`,
                              color: activeColor,
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. SECTION AVANT / APRÈS : RESPONSIVE & ANIMÉE */}
        {/* ========================================================================= */}
        <section className="py-10 sm:py-16 bg-slate-100/80 overflow-hidden relative border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                <Sparkles className="w-3.5 h-3.5" />
                La différence qui fait décrocher les entretiens
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                Pourquoi 85% des CVs classiques finissent à la corbeille ?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
              
              {/* CARTE 1 : CV CLASSIQUE (WORD / CANVA) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-red-200/90 shadow-sm hover:border-red-300 transition-all flex flex-col justify-between group">
                <div>
                  {/* Badge non coupé et parfaitement aligné */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
                      <XCircle className="w-3.5 h-3.5" />
                      CV Classique (Word / Canva)
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Ce que les recruteurs rejettent
                    </h3>
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                      <li className="flex items-start gap-2.5">
                        <span className="text-red-500 font-black text-sm shrink-0 mt-0.5">✕</span>
                        <span><strong>Rejeté par 80% des robots ATS</strong> car les textes dans les tableaux et graphiques Canva ne sont pas lus.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-red-500 font-black text-sm shrink-0 mt-0.5">✕</span>
                        <span><strong>Phrases creuses et passives :</strong> « Responsable de la saisie des factures » sans aucun chiffre d'impact.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-red-500 font-black text-sm shrink-0 mt-0.5">✕</span>
                        <span><strong>3 à 5 heures perdues</strong> à réaligner les marges qui sautent à l'exportation.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-slate-400 text-xs text-center font-medium italic">
                  Résultat : Candidatures sans réponse, découragement.
                </div>
              </div>

              {/* CARTE 2 : CV PROPULSÉ PAR MONCV.AI (GAGNANT & ANIMÉ SANS COUPURE DE BADGE) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950 text-white shadow-2xl relative flex flex-col justify-between animate-glow-card border-2 border-blue-400/80">
                {/* Glow de fond encapsulé pour ne pas couper les badges */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl animate-float-subtle" />
                </div>
                
                <div className="relative z-10">
                  {/* Badge non coupé et parfaitement aligné */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      CV Propulsé par MonCV.ai
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-black text-blue-100 flex items-center gap-2">
                      <span>La formule gagnante des candidats</span>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </h3>
                    <ul className="space-y-3 text-xs sm:text-sm text-blue-100/90">
                      <li className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-black text-sm shrink-0 mt-0.5">✓</span>
                        <span><strong>98% de passage ATS garanti</strong> avec un balisage HTML sémantique parfaitement indexé.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-black text-sm shrink-0 mt-0.5">✓</span>
                        <span><strong>Méthode STAR intégrée :</strong> Transforme automatiquement vos tâches en résultats chiffrés.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-black text-sm shrink-0 mt-0.5">✓</span>
                        <span><strong>Demande d'emploi officielle & QR Code inclus</strong> pour postuler auprès des DRH en Afrique.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-blue-800/80 space-y-3 relative z-10">
                  <div className="text-emerald-400 text-xs sm:text-sm text-center font-black flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Résultat : 3x plus d'invitations en entretien d'embauche.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartCreation}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-600 hover:from-emerald-400 hover:to-blue-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer animate-cta-loop"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Créer mon CV Gagnant Maintenant</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. TÉMOIGNAGES RÉELS — DÉFILEMENT CONTINU DE LA DROITE VERS LA GAUCHE */}
        {/* ========================================================================= */}
        <section className="py-10 sm:py-14 bg-slate-50 overflow-hidden relative border-t border-slate-200">
          {/* Estompage dégradé sur les bords gauche et droit */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Témoignages Candidats Vérifiés
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Ils ont décroché leur poste de rêve avec MonCV.ai
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Survolez un avis pour suspendre le défilement et lire en détail l'expérience du candidat.
            </p>
          </div>

          {/* Défilement Continu de la Droite vers la Gauche (Marquee) */}
          <div className="w-full overflow-hidden py-2">
            <div className="animate-marquee-rtl flex items-stretch gap-5">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, idx) => (
                <div
                  key={idx}
                  className="w-[300px] sm:w-[360px] shrink-0 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">
                        {t.score}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      « {t.quote} »
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 mt-4 border-t border-slate-100">
                    <div className="relative shrink-0">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-100 shadow-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 shadow-md border border-slate-200 leading-none">
                        {t.flag}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{t.name}</h4>
                      <p className="text-[10.5px] font-bold text-blue-600 truncate">{t.role}</p>
                      <p className="text-[9.5px] text-slate-400 truncate font-medium">
                        {t.country}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. TARIFS : LES 04 OFFRES DE MONCV.AI (GRATUIT, 1500F, 2500F, 5000F) */}
        {/* ========================================================================= */}
        <section id="tarifs" className="py-10 sm:py-16 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1 block">
                Tarifs Clairs & Accessibles
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Choisissez l'offre adaptée à votre ambition
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1.5">
                Paiement unique instantané par Wave, Orange Money, MTN MoMo ou Moov sans carte bancaire.
              </p>
            </div>

            {/* Grille des 04 Offres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              
              {/* OFFRE 1 : GRATUIT (0 FCFA) */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all relative">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-700 mb-2">
                    Découverte
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Gratuit</h3>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    0 <span className="text-sm font-semibold text-slate-500">FCFA</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pour tester l'assistant et visualiser le rendu
                  </p>

                  <div className="mt-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[10.5px] text-amber-900 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Filigrane MonCV.ai visible • Téléchargement PDF impossible</span>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Questionnaire IA pas à pas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Accès aux 6 modèles de CV</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Aperçu en direct temps réel</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400">
                      <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>Téléchargement PDF désactivé</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400">
                      <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>Demande d'emploi & Lettre IA</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleStartCreation}
                  className="mt-6 w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl border border-slate-200 text-center text-xs transition-all cursor-pointer shadow-xs"
                >
                  Tester Gratuitement
                </button>
              </div>

              {/* OFFRE 2 : PACK ESSENTIEL (1 500 FCFA) */}
              <div className="p-6 rounded-3xl bg-white border-2 border-blue-200 flex flex-col justify-between shadow-sm hover:border-blue-400 transition-all relative">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 mb-2">
                    Standard
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Pack Essentiel</h3>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    1 500 <span className="text-sm font-semibold text-slate-500">FCFA</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Paiement unique Wave / Orange / MTN
                  </p>

                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Export PDF HD SANS FILIGRANE</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Format A4 Vectoriel Haute Définition</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Accès aux 6 modèles professionnels</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Sauvegarde & modifications illimitées</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Score de compatibilité ATS en direct</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanPayment("1500")}
                  className="mt-6 w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-2xl border border-blue-200 text-center text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 animate-cta-loop"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Choisir l'Essentiel (1 500 F)</span>
                </button>
              </div>

              {/* OFFRE 3 : PACK CANDIDATURE PRO (2 500 FCFA) - RECOMMANDÉ */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-900 to-indigo-950 text-white flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all relative overflow-hidden ring-4 ring-blue-500/80 animate-pulse-glow">
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Recommandé
                </div>

                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/30 text-blue-200 mb-2 border border-blue-400/30">
                    Candidature Complète
                  </div>
                  <h3 className="text-lg font-bold text-blue-100">Pack Pro</h3>
                  <div className="text-3xl font-black text-white mt-1">
                    2 500 <span className="text-sm font-semibold text-blue-300">FCFA</span>
                  </div>
                  <p className="text-[11px] text-blue-200/80 mt-1">
                    Paiement unique Wave / Orange / MTN
                  </p>

                  <ul className="mt-5 space-y-2.5 text-xs text-blue-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span><strong>CV PDF HD sans filigrane</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span><strong>+ DEMANDE D'EMPLOI OFFICIELLE</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span><strong>+ LETTRE DE MOTIVATION IA</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Scanner ATS face aux offres d'emploi</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Lien de partage public + QR Code HD</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanPayment("2500")}
                  className="mt-6 w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-2xl text-center text-xs shadow-lg shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer animate-cta-loop"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Activer le Pack Pro (2 500 F)</span>
                </button>
              </div>

              {/* OFFRE 4 : PACK CARRIÈRE VIP & PORTFOLIO (5 000 FCFA) */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all relative overflow-hidden border-2 border-purple-400">
                <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-300" />
                  VIP & Portfolio
                </div>

                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/30 text-purple-200 mb-2 border border-purple-400/30">
                    VIP & Portfolio
                  </div>
                  <h3 className="text-lg font-bold text-purple-100">Pack VIP & Portfolio</h3>
                  <div className="text-3xl font-black text-white mt-1">
                    5 000 <span className="text-sm font-semibold text-purple-300">FCFA</span>
                  </div>
                  <p className="text-[11px] text-purple-200/80 mt-1">
                    Accès complet à vie + Portfolio Web
                  </p>

                  <ul className="mt-5 space-y-2.5 text-xs text-purple-100">
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>Toutes les fonctionnalités incluses</strong></span>
                    </li>
                    <li className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-pink-400 shrink-0" />
                        <span><strong>+ PORTFOLIO WEB PERSONNEL INTERACTIF</strong></span>
                      </div>
                      <Link
                        href="/portfolio"
                        target="_blank"
                        className="text-[10.5px] font-bold text-pink-300 hover:text-white underline pl-6 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Voir la démo du Portfolio en direct</span>
                      </Link>
                    </li>
                    <li className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Exports illimités : PDF, Word & Excel</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Réécriture STAR prioritaire par IA</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Support VIP WhatsApp dédié 7j/7</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanPayment("5000")}
                  className="mt-6 w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl text-center text-xs shadow-xl shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer animate-cta-loop"
                >
                  <Crown className="w-4 h-4" />
                  <span>Débloquer le VIP (5 000 F)</span>
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FAQ INTERACTIVE */}
        {/* ========================================================================= */}
        <section className="py-8 sm:py-12 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1 block">
                Questions Fréquentes
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Tout ce que vous devez savoir
              </h2>
            </div>

            <div className="space-y-2.5">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-4 py-3.5 text-left font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        activeFaq === idx ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>
                  {activeFaq === idx && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. CALL TO ACTION FLOTTANT & PERCUTANT                                    */}
        {/* ========================================================================= */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Prêt à décrocher votre prochain entretien d'embauche ?
            </h2>
            <p className="mt-2.5 text-blue-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Rejoignez plus de 18 000 professionnels en Afrique et en Europe ayant transformé leur carrière avec MonCV.ai.
            </p>
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={handleStartCreation}
                className="px-8 py-4 bg-white hover:bg-blue-50 text-blue-700 font-black rounded-2xl shadow-2xl text-sm sm:text-base flex items-center gap-2.5 transition-all cursor-pointer animate-cta-loop"
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Créer mon CV Gratuitement Maintenant</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. SECTION NOUS CONTACTER & SUPPORT INNOVA GROUP                          */}
        {/* ========================================================================= */}
        <section id="contact" className="py-14 sm:py-18 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Informations Support & Éditeur */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Développé & Propulsé par INNOVA GROUP</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Nous Contacter
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Une question sur la plateforme, un besoin d'assistance sur votre CV ou une demande de partenariat ? L'équipe <strong>INNOVA GROUP</strong> vous accompagne 7j/7.
                  </p>
                </div>

                {/* Carte Développeur INNOVA GROUP */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs shadow-md">
                      IG
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                        Concepteur & Éditeur Logiciel
                      </span>
                      <h4 className="font-extrabold text-sm">INNOVA GROUP</h4>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed">
                    Plateforme SaaS haute performance certifiée conforme aux normes internationales ATS et aux formats administratifs africains.
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Support en ligne disponible 7j/7</span>
                  </div>
                </div>

                {/* Bouton WhatsApp Direct */}
                <a
                  href="https://wa.me/2250700000000?text=Bonjour%20l'%C3%A9quipe%20INNOVA%20GROUP%20%2F%20MonCV.ai,%20j'ai%20besoin%20d'assistance."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md shadow-emerald-500/20 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                      WhatsApp Officiel Direct
                    </span>
                    <span className="text-xs sm:text-sm font-black">Discuter avec l'équipe INNOVA GROUP</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-200" />
                </a>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Email Support : <strong>support@moncv.ai</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Direction Générale : <strong>contact@innovagroup.io</strong></span>
                  </div>
                </div>
              </div>

              {/* Formulaire de Contact */}
              <div className="lg:col-span-7 bg-slate-50 p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
                {contactSubmitted ? (
                  <div className="py-12 text-center space-y-3 fade-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Message envoyé à INNOVA GROUP !</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      Nous avons bien reçu votre demande. Un conseiller vous répondra dans les plus brefs délais.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
                      setContactSubmitted(true);
                      setTimeout(() => {
                        setContactName("");
                        setContactEmail("");
                        setContactMessage("");
                        setContactSubmitted(false);
                      }, 4000);
                    }}
                    className="space-y-3.5"
                  >
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        Envoyez-nous un message direct
                      </h3>
                      <p className="text-xs text-slate-500">
                        Notre équipe vous répond sous 15 minutes en moyenne.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Votre Nom Complet <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Ex: Kouamé Koffi"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Votre Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="nom@email.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Votre Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Précisez votre demande, vos questions ou votre besoin d'accompagnement..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Envoyer mon message</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Officiel INNOVA GROUP */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                M
              </div>
              <span className="font-extrabold text-slate-800">MonCV.ai</span>
              <span className="text-slate-400">• Développé par <strong>INNOVA GROUP</strong></span>
            </div>

            {/* Liens Légaux & Navigation Footer */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-semibold">
              <Link href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors">
                Conditions d'Utilisation
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors">
                Nous Contacter
              </Link>
              <Link href="/portfolio" className="text-slate-600 hover:text-blue-600 transition-colors">
                Portfolio Web Démo
              </Link>
              <Link href="/create" className="text-blue-600 hover:underline">
                Créer un CV →
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] text-slate-400">
            <span>© 2026 MonCV.ai — Une solution logicielle conçue et éditée par INNOVA GROUP. Tous droits réservés.</span>
            <span>Abidjan 🇨🇮 • Dakar 🇸🇳 • Douala 🇨🇲 • Ouagadougou 🇧🇫 • Bamako 🇲🇱 • Paris 🇫🇷</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MobileMoneyModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => alert("Votre formule a été activée avec succès !")}
        defaultPlan={selectedPlanPrice}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          router.push("/create");
        }}
        defaultMode="register"
      />

      {/* Preuve Sociale & Réassurance Live */}
      <LiveSocialProofToast />
    </div>
  );
}
