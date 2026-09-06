const fs = require('fs');
const path = require('path');

const pageContent = `"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileMoneyModal } from "@/components/tools/MobileMoneyModal";
import { AuthModal } from "@/components/tools/AuthModal";
import { LiveSocialProofToast } from "@/components/tools/LiveSocialProofToast";
import { PlanTier, AccountType } from "@/lib/types";
import { StorageManager } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  FileCheck,
  Star,
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
  Clock,
  XCircle,
  Phone,
  Download,
  Lock,
  Crown,
  Eye,
  AlertTriangle,
  ExternalLink,
  Mail,
  MessageCircle,
  Send,
  Scale,
  Smartphone,
} from "lucide-react";

const COLOR_PALETTE = [
  "#2563eb", // Bleu Roi
  "#7c3aed", // Violet
  "#059669", // Émeraude
  "#dc2626", // Rouge Carmin
  "#0f172a", // Noir Ardoise
  "#b45309", // Ambre
];

export default function HomePage() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<PlanTier>("2500");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authAccountType, setAuthAccountType] = useState<AccountType>("candidate");
  const [authDefaultPlan, setAuthDefaultPlan] = useState<PlanTier>("free");
  const [activeTemplate, setActiveTemplate] = useState("modern");
  const [activeColor, setActiveColor] = useState("#2563eb");
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLandingExplicit, setIsLandingExplicit] = useState(false);
  const router = useRouter();
  const { t, dict, isRTL, language } = useTranslation();

  const templateGallery = useMemo(() => [
    {
      id: "modern",
      name: dict.gallery.templates.modern.name,
      tag: dict.gallery.templates.modern.tag,
      desc: dict.gallery.templates.modern.desc,
      accent: "#2563eb",
      idealFor: dict.gallery.templates.modern.idealFor,
      rating: "4.9/5",
    },
    {
      id: "elegant",
      name: dict.gallery.templates.elegant.name,
      tag: dict.gallery.templates.elegant.tag,
      desc: dict.gallery.templates.elegant.desc,
      accent: "#0f172a",
      idealFor: dict.gallery.templates.elegant.idealFor,
      rating: "4.9/5",
    },
    {
      id: "corporate",
      name: dict.gallery.templates.corporate.name,
      tag: dict.gallery.templates.corporate.tag,
      desc: dict.gallery.templates.corporate.desc,
      accent: "#1e3a8a",
      idealFor: dict.gallery.templates.corporate.idealFor,
      rating: "4.8/5",
    },
    {
      id: "minimal",
      name: dict.gallery.templates.minimal.name,
      tag: dict.gallery.templates.minimal.tag,
      desc: dict.gallery.templates.minimal.desc,
      accent: "#18181b",
      idealFor: dict.gallery.templates.minimal.idealFor,
      rating: "4.8/5",
    },
    {
      id: "creative",
      name: dict.gallery.templates.creative.name,
      tag: dict.gallery.templates.creative.tag,
      desc: dict.gallery.templates.creative.desc,
      accent: "#7c3aed",
      idealFor: dict.gallery.templates.creative.idealFor,
      rating: "4.9/5",
    },
    {
      id: "ats",
      name: dict.gallery.templates.ats.name,
      tag: dict.gallery.templates.ats.tag,
      desc: dict.gallery.templates.ats.desc,
      accent: "#059669",
      idealFor: dict.gallery.templates.ats.idealFor,
      rating: "5.0/5",
    },
  ], [dict]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const landingExplicit = params.get("landing") === "true";
    setIsLandingExplicit(landingExplicit);

    const logged = StorageManager.isLoggedIn();
    const isBiz = StorageManager.isBusinessAccount();
    const user = StorageManager.getUser();

    setIsLoggedIn(logged);
    setIsBusinessAccount(isBiz);
    setCurrentUser(user);

    if (logged && !landingExplicit) {
      if (isBiz) {
        router.replace("/dashboard?tab=business");
        return;
      } else {
        router.replace("/dashboard");
        return;
      }
    }

    const viewMode = localStorage.getItem("moncv_view_mode");
    const active = StorageManager.getActiveResume();
    if (active && (active.slug || active.id)) {
      if (!landingExplicit && viewMode === "client") {
        router.replace(\`/c/\${active.slug || active.id}\`);
        return;
      }
    }
  }, [router]);

  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveTemplate((prev) => {
        const idx = templateGallery.findIndex((t) => t.id === prev);
        return templateGallery[(idx + 1) % templateGallery.length].id;
      });
      setActiveColor((prev) => {
        const currentIdx = COLOR_PALETTE.indexOf(prev);
        return COLOR_PALETTE[(currentIdx + 1) % COLOR_PALETTE.length];
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlay, templateGallery]);

  const handleStartCreation = () => {
    if (typeof window !== "undefined") {
      if (StorageManager.isLoggedIn()) {
        if (StorageManager.isBusinessAccount()) {
          router.push("/dashboard?tab=business");
        } else {
          router.push("/dashboard");
        }
        return;
      }
    }
    setAuthAccountType("candidate");
    setAuthDefaultPlan("free");
    setIsAuthOpen(true);
  };

  const handleOpenBusinessAuth = () => {
    if (typeof window !== "undefined") {
      if (StorageManager.isLoggedIn() && StorageManager.isBusinessAccount()) {
        router.push("/dashboard?tab=business");
        return;
      }
    }
    setAuthAccountType("business");
    setAuthDefaultPlan("enterprise75");
    setIsAuthOpen(true);
  };

  const handleOpenPlanPayment = (plan: PlanTier) => {
    if (typeof window !== "undefined" && !StorageManager.isLoggedIn()) {
      const isBiz = plan.startsWith("enterprise") || plan === "cyber15";
      setAuthAccountType(isBiz ? "business" : "candidate");
      setAuthDefaultPlan(plan);
      setIsAuthOpen(true);
      return;
    }
    setSelectedPlanPrice(plan);
    setIsPaymentOpen(true);
  };

  const selectedTpl = templateGallery.find((t) => t.id === activeTemplate) || templateGallery[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden">
      <Navbar
        onOpenPayment={() => handleOpenPlanPayment("2500")}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Bannière de session active */}
      {isLoggedIn && isLandingExplicit && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white px-4 py-3 border-b border-indigo-900/60 shadow-md sticky top-16 z-30 no-print">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {dict.dashboard.activeSession}{" "}
                <strong className="text-white font-bold">
                  {currentUser?.firstName || ""} {currentUser?.lastName || ""}
                </strong>{" "}
                {isBusinessAccount ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black uppercase text-[10px] ml-1 border border-amber-400/30">
                    {dict.dashboard.recruiterSpaceBadge}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-black uppercase text-[10px] ml-1 border border-blue-400/30">
                    {dict.dashboard.candidateSpaceBadge}
                  </span>
                )}{" "}
                <span className="text-slate-400 font-normal">({currentUser?.email})</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={isBusinessAccount ? "/dashboard?tab=business" : "/dashboard"}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm text-xs"
              >
                <span>{isBusinessAccount ? dict.dashboard.accessRecruiterBtn : dict.dashboard.accessCandidateBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION DYNAMIQUE & IMPACTANTE */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20 bg-radial-hero bg-grid-pattern">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[480px] bg-gradient-to-tr from-blue-500/15 via-indigo-400/15 to-purple-500/15 blur-3xl -z-10 pointer-events-none animate-pulse-glow" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute top-1/3 -right-24 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            {/* Badge flottant */}
            <div
              onClick={handleStartCreation}
              className="shimmer-badge inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-blue-200/80 shadow-xs text-slate-800 text-[11px] sm:text-xs font-semibold mb-4 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer select-none max-w-full"
            >
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-900 font-bold whitespace-nowrap">{dict.hero.statsCvs}</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-600 font-semibold whitespace-nowrap">{dict.hero.badge}</span>
              <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] rounded-full font-bold uppercase tracking-wider shadow-xs shrink-0">
                IA 2026
              </span>
            </div>

            {/* Titre Principal */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-black text-slate-900 tracking-tight leading-[1.15] max-w-3xl mx-auto text-center px-1">
              {dict.hero.titlePart1}{" "}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-flow">
                {dict.hero.titleHighlight}
              </span>{" "}
              {dict.hero.titlePart2}
            </h1>

            {/* Sous-titre */}
            <p className="mt-4 text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal text-center px-1">
              {dict.hero.subtitle}
            </p>

            {/* CTAs d'action */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto w-full px-2">
              <button
                type="button"
                onClick={handleStartCreation}
                className="group w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer animate-cta-loop shadow-xl shadow-blue-600/30 active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow shrink-0" />
                <span className="whitespace-nowrap font-black">
                  {isLoggedIn
                    ? isBusinessAccount
                      ? dict.nav.backToEnterprise
                      : dict.nav.myCvs
                    : dict.hero.ctaCreateCv}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <div className="w-full sm:w-auto grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3">
                <a
                  href="#exposition-modeles"
                  className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-4 bg-white/95 backdrop-blur-md hover:bg-blue-50/70 text-slate-800 font-bold rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all hover:border-blue-300 cursor-pointer card-hover-lift"
                >
                  <Eye className="w-4 h-4 text-blue-600 animate-bounce-soft shrink-0" />
                  <span className="whitespace-nowrap">{dict.hero.modelsButton}</span>
                </a>

                <Link
                  href="/portfolio"
                  target="_blank"
                  className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-4 bg-purple-50 hover:bg-purple-100/90 text-purple-900 font-bold rounded-2xl border border-purple-200 shadow-xs hover:shadow-md text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer btn-press card-hover-lift"
                >
                  <Globe className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="whitespace-nowrap">{dict.hero.portfolioButton}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-purple-600 text-white text-[9px] font-black uppercase shrink-0">
                    VIP
                  </span>
                </Link>
              </div>
            </div>

            {/* Social Proof & Avis */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center justify-center gap-2.5">
                <div className="flex -space-x-2.5 overflow-hidden">
                  {dict.testimonials.items.slice(0, 5).map((t, idx) => (
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
                <span className="text-xs font-bold text-slate-800 text-center">
                  4.9/5 <span className="font-medium text-slate-500">{dict.hero.verifiedReviews}</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-[11px] sm:text-xs font-semibold text-slate-600 text-center">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 icon-glow-emerald" />
                  <span>{dict.hero.checkNoSignup}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0 icon-glow-blue animate-pulse-soft" />
                  <span>{dict.hero.checkAtsScore}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
                  <span>{dict.hero.checkMobileMoney}</span>
                </span>
              </div>
            </div>

            {/* Mockup interactif avec badges */}
            <div className="mt-12 max-w-4xl mx-auto relative">
              <div className="hidden md:flex absolute -top-5 -left-6 z-30 items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-200/90 shadow-xl shadow-emerald-500/10 animate-float pointer-events-none">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 icon-glow-emerald" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>{dict.hero.cardScoreAts}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{dict.hero.cardScoreDesc}</p>
                </div>
              </div>

              <div className="hidden md:flex absolute -bottom-5 -right-6 z-30 items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/90 shadow-2xl shadow-blue-600/20 animate-float-reverse pointer-events-none">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4 icon-glow-blue animate-pulse-soft" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{dict.hero.cardReadyTime}</span>
                    <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">{dict.hero.cardReadyDesc}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden text-left relative transition-all hover:shadow-blue-500/15 card-shine group">
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,0.9)] animate-scanline pointer-events-none z-20" />

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
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
                    <span className="hidden sm:inline">Optimisé STAR & ATS</span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0 animate-pulse-soft">
                        JMK
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                          {dict.liveDemo.demoProfileName}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-blue-600">
                          {dict.liveDemo.demoProfileRole}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Abidjan, Côte d'Ivoire • Discutons de vos projets
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Score ATS : 98% Conforme
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
                    <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 card-hover-lift">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4 icon-glow-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">{dict.hero.badgePdfHd}</p>
                        <p className="text-[10px] text-slate-500">{dict.hero.badgePdfHdDesc}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 card-hover-lift">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 icon-glow-amber" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">{dict.hero.badgeJobApp}</p>
                        <p className="text-[10px] text-slate-500">{dict.hero.badgeJobAppDesc}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 card-hover-lift">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Wand2 className="w-4 h-4 icon-glow-purple" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">{dict.hero.badgeCoverLetter}</p>
                        <p className="text-[10px] text-slate-500">{dict.hero.badgeCoverLetterDesc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bandeau métriques de confiance */}
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift card-shine">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600">{dict.hero.metricDownloads}</span>
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 mt-1">{dict.hero.metricDownloadsLabel}</div>
                </div>
                <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift card-shine">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600">{dict.hero.metricAtsRate}</span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400 icon-glow-emerald" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 mt-1">{dict.hero.metricAtsLabel}</div>
                </div>
                <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift card-shine">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-black text-indigo-600">{dict.hero.metricCalls}</span>
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 mt-1">{dict.hero.metricCallsLabel}</div>
                </div>
                <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs card-hover-lift card-shine">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-black text-amber-500">{dict.hero.metricTime}</span>
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 mt-1">{dict.hero.metricTimeLabel}</div>
                </div>
              </div>
            </div>

            {/* Bandeau Entreprises */}
            <div className="mt-10 pt-6 border-t border-slate-200/70">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                {dict.hero.companiesTitle}
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
        {/* 2. EXPOSITION & GALERIE DES MODÈLES DE CV */}
        {/* ========================================================================= */}
        <section id="exposition-modeles" className="py-10 sm:py-14 bg-gradient-to-b from-white via-slate-50 to-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{dict.gallery.badge}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {dict.gallery.title}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-2">
                {dict.gallery.subtitle}
              </p>
            </div>

            {/* Grille d'exposition visuelle 6 Modèles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templateGallery.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group"
                >
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

                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 h-48 overflow-hidden relative group-hover:scale-[1.02] transition-transform">
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
                          <span>{dict.gallery.testThisModel}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {dict.liveDemo.templatePrefix} {tpl.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {tpl.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium text-slate-400">{dict.gallery.recommendedFor}</span>
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
                      <span>{dict.gallery.customizeThisModel}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. DÉMO INTERACTIVE : STUDIO DE PERSONNALISATION TEMPS RÉEL */}
        {/* ========================================================================= */}
        <section id="demo-interactive" className="py-10 sm:py-16 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-25 transition-all duration-700 pointer-events-none"
            style={{ backgroundColor: activeColor }}
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-center sm:text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-2 border border-blue-500/20">
                  <Palette className="w-3.5 h-3.5" />
                  <span>{dict.liveDemo.badge}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {dict.liveDemo.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={\`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer \${
                  isAutoPlay
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }\`}
              >
                <span className={\`w-2 h-2 rounded-full \${isAutoPlay ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}\`} />
                <span>{isAutoPlay ? dict.liveDemo.autoPlayOn : dict.liveDemo.autoPlayOff}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-8">
              {templateGallery.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setActiveTemplate(tpl.id);
                    setIsAutoPlay(false);
                  }}
                  className={\`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer \${
                    activeTemplate === tpl.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105 border border-blue-400"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/80"
                  }\`}
                >
                  <span className={\`w-2 h-2 rounded-full \${activeTemplate === tpl.id ? "bg-white animate-pulse" : "bg-slate-500"}\`} />
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl backdrop-blur-xl">
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    {dict.liveDemo.selectedModel}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {dict.liveDemo.templatePrefix} {selectedTpl.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    {selectedTpl.desc}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                    <span>{dict.liveDemo.accentColor}</span>
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
                        className={\`w-9 h-9 rounded-2xl transition-all shadow-md cursor-pointer \${
                          activeColor === c
                            ? "ring-4 ring-white/50 scale-110 shadow-lg"
                            : "hover:scale-105 opacity-75 hover:opacity-100"
                        }\`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{dict.liveDemo.featureA4}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{dict.liveDemo.featureSkills}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{dict.liveDemo.featureExport}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartCreation}
                  style={{ backgroundColor: activeColor }}
                  className="w-full py-4 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95 transform hover:-translate-y-0.5 active:translate-y-0 animate-cta-loop"
                >
                  <Wand2 className="w-4.5 h-4.5" />
                  <span>{dict.liveDemo.ctaUseModel} {selectedTpl.name}</span>
                </button>
              </div>

              <div className="lg:col-span-7 flex justify-center">
                <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden relative transform hover:-translate-y-1.5 transition-all duration-300 group">
                  <div
                    className="p-6 text-white transition-colors duration-500 relative"
                    style={{ backgroundColor: activeColor }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9.5px] font-bold uppercase tracking-widest opacity-90">
                          {dict.liveDemo.demoProfileTitle}
                        </span>
                        <h4 className="text-xl font-black">{dict.liveDemo.demoProfileName}</h4>
                        <p className="text-xs opacity-90 font-medium">{dict.liveDemo.demoProfileRole}</p>
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-sm font-black shadow-inner">
                        JMK
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 bg-slate-900/90 text-white backdrop-blur-md border border-slate-700 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black">ATS Match : 98%</span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 text-xs">
                    <div>
                      <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1" style={{ color: activeColor }}>
                        {dict.liveDemo.demoStarSection}
                      </h5>
                      <p className="text-slate-600 leading-relaxed text-[11.5px]">
                        {dict.liveDemo.demoStarDesc}
                      </p>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1.5" style={{ color: activeColor }}>
                        {dict.liveDemo.demoExperienceSection}
                      </h5>
                      <div className="border-l-2 pl-3 space-y-1" style={{ borderColor: activeColor }}>
                        <div className="flex justify-between font-bold text-slate-800 text-[11.5px]">
                          <span>{dict.liveDemo.demoExperienceRole}</span>
                          <span className="text-slate-400 font-normal">2022 – Présent</span>
                        </div>
                        <p className="text-slate-500 text-[10.5px]">
                          {dict.liveDemo.demoExperienceDesc}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1.5" style={{ color: activeColor }}>
                        {dict.liveDemo.demoSkillsSection}
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {["TypeScript", "Next.js", "Python", "Mobile Money API", "Docker", "Gestion de Projet"].map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-colors"
                            style={{
                              backgroundColor: \`\${activeColor}12\`,
                              borderColor: \`\${activeColor}35\`,
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
        {/* 4. SECTION AVANT / APRÈS */}
        {/* ========================================================================= */}
        <section className="py-10 sm:py-16 bg-slate-100/80 overflow-hidden relative border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                <Sparkles className="w-3.5 h-3.5" />
                {dict.avantApres.badge}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                {dict.avantApres.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
              <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-red-200/90 shadow-sm hover:border-red-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
                      <XCircle className="w-3.5 h-3.5" />
                      {dict.avantApres.classicBadge}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {dict.avantApres.classicTitle}
                    </h3>
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                      <li className="flex items-start gap-2.5">
                        <span className="text-red-500 font-black text-sm shrink-0 mt-0.5">✕</span>
                        <span>{dict.avantApres.classicPoint1}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-red-500 font-black text-sm shrink-0 mt-0.5">✕</span>
                        <span>{dict.avantApres.classicPoint2}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-red-500 font-black text-sm shrink-0 mt-0.5">✕</span>
                        <span>{dict.avantApres.classicPoint3}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-slate-400 text-xs text-center font-medium italic">
                  {dict.avantApres.classicResult}
                </div>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950 text-white shadow-2xl relative flex flex-col justify-between animate-glow-card border-2 border-blue-400/80">
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl animate-float-subtle" />
                </div>
                
                <div className="relative z-10">
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      {dict.avantApres.moncvBadge}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-black text-blue-100 flex items-center gap-2">
                      <span>{dict.avantApres.moncvTitle}</span>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </h3>
                    <ul className="space-y-3 text-xs sm:text-sm text-blue-100/90">
                      <li className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-black text-sm shrink-0 mt-0.5">✓</span>
                        <span>{dict.avantApres.moncvPoint1}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-black text-sm shrink-0 mt-0.5">✓</span>
                        <span>{dict.avantApres.moncvPoint2}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-black text-sm shrink-0 mt-0.5">✓</span>
                        <span>{dict.avantApres.moncvPoint3}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-blue-800/80 space-y-3 relative z-10">
                  <div className="text-emerald-400 text-xs sm:text-sm text-center font-black flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{dict.avantApres.moncvResult}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartCreation}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-600 hover:from-emerald-400 hover:to-blue-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer animate-cta-loop"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>{dict.avantApres.moncvCta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4-BIS. LE COMPARATIF SANS CONCESSION */}
        {/* ========================================================================= */}
        <section className="py-14 sm:py-20 bg-white border-y border-slate-200 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-50/70 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3 border border-blue-100 shadow-2xs">
                <Scale className="w-4 h-4 text-blue-600 animate-bounce-soft" />
                <span>{dict.comparison.badge}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {dict.comparison.title}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed">
                {dict.comparison.subtitle}
              </p>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="min-w-[760px] bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-900 text-white text-xs font-black p-4 items-center">
                  <div className="col-span-4 uppercase tracking-wider text-slate-400 pl-2">
                    {dict.comparison.colCriteria}
                  </div>
                  <div className="col-span-3 text-center py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md flex items-center justify-center gap-1.5 text-white">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                    <span>{dict.comparison.colMoncv}</span>
                  </div>
                  <div className="col-span-2 text-center text-slate-300 font-bold">
                    {dict.comparison.colWord}
                  </div>
                  <div className="col-span-2 text-center text-slate-300 font-bold">
                    {dict.comparison.colCanva}
                  </div>
                  <div className="col-span-1 text-center text-slate-300 font-bold text-[10.5px]">
                    {dict.comparison.colFreelance}
                  </div>
                </div>

                {dict.comparison.rows.map((row, idx) => (
                  <div
                    key={idx}
                    className={\`grid grid-cols-12 p-3.5 sm:p-4 items-center text-xs border-b border-slate-100 transition-colors hover:bg-blue-50/40 \${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }\`}
                  >
                    <div className="col-span-4 pl-2">
                      <p className="font-extrabold text-slate-900">{row.critere}</p>
                      <p className="text-[10px] text-slate-500">{row.sub}</p>
                    </div>

                    <div className="col-span-3 text-center py-1.5 px-2 rounded-xl bg-blue-50 text-blue-900 font-extrabold flex items-center justify-center gap-1.5 border border-blue-200/80 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 icon-glow-emerald" />
                      <span className="text-[11.5px] truncate">{row.moncv}</span>
                    </div>

                    <div className="col-span-2 text-center text-slate-500 font-medium flex items-center justify-center gap-1">
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="truncate text-[11px]">{row.word}</span>
                    </div>

                    <div className="col-span-2 text-center text-slate-500 font-medium flex items-center justify-center gap-1">
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="truncate text-[11px]">{row.canva}</span>
                    </div>

                    <div className="col-span-1 text-center text-slate-500 font-medium flex items-center justify-center gap-1">
                      <span className="truncate text-[10.5px]">{row.free}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg card-shine">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-amber-300 animate-pulse-soft" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base">{dict.comparison.ctaTitle}</h4>
                  <p className="text-xs text-blue-100">{dict.comparison.ctaSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartCreation}
                className="px-6 py-3 bg-white hover:bg-blue-50 text-blue-700 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0 animate-cta-loop"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{dict.comparison.ctaButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. TÉMOIGNAGES RÉELS */}
        {/* ========================================================================= */}
        <section className="py-10 sm:py-14 bg-slate-50 overflow-hidden relative border-t border-slate-200">
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {dict.testimonials.badge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {dict.testimonials.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {dict.testimonials.subtitle}
            </p>
          </div>

          <div className="w-full overflow-hidden py-2">
            <div className="animate-marquee-rtl flex items-stretch gap-5">
              {[...dict.testimonials.items, ...dict.testimonials.items].map((t, idx) => (
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
        {/* 6. TARIFS : LES 04 OFFRES */}
        {/* ========================================================================= */}
        <section id="tarifs" className="py-10 sm:py-16 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1 block">
                {dict.pricing.badge}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {dict.pricing.title}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1.5">
                {dict.pricing.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              {/* OFFRE 1 : GRATUIT (0 FCFA) */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all relative card-hover-lift card-shine">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-700 mb-2">
                    {dict.pricing.candidateFreeBadge}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{dict.pricing.candidateFreeTitle}</h3>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    {dict.pricing.candidateFreePrice} <span className="text-sm font-semibold text-slate-500">{dict.pricing.candidateFreePeriod}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {dict.pricing.candidateFreeDesc}
                  </p>

                  <div className="mt-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[10.5px] text-amber-900 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse-soft" />
                    <span>{dict.pricing.candidateFreeWarning}</span>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{dict.pricing.candidateFreeF1}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{dict.pricing.candidateFreeF2}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{dict.pricing.candidateFreeF3}</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400">
                      <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>{dict.pricing.candidateFreeF4}</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400">
                      <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>{dict.pricing.candidateFreeF5}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleStartCreation}
                  className="mt-6 w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl border border-slate-200 text-center text-xs transition-all cursor-pointer shadow-xs"
                >
                  {dict.pricing.candidateFreeCta}
                </button>
              </div>

              {/* OFFRE 2 : PACK ESSENTIEL (1 500 FCFA) */}
              <div className="p-6 rounded-3xl bg-white border-2 border-blue-200 flex flex-col justify-between shadow-sm hover:border-blue-400 transition-all relative card-hover-lift card-shine">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 mb-2">
                    {dict.pricing.candidateEssentialBadge}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{dict.pricing.candidateEssentialTitle}</h3>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    {dict.pricing.candidateEssentialPrice} <span className="text-sm font-semibold text-slate-500">{dict.pricing.candidateEssentialPeriod}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {dict.pricing.candidateEssentialDesc}
                  </p>

                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 icon-glow-emerald" />
                      <span><strong>{dict.pricing.candidateEssentialF1}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{dict.pricing.candidateEssentialF2}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{dict.pricing.candidateEssentialF3}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{dict.pricing.candidateEssentialF4}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{dict.pricing.candidateEssentialF5}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanPayment("1500")}
                  className="mt-6 w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-2xl border border-blue-200 text-center text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 animate-cta-loop"
                >
                  <Smartphone className="w-3.5 h-3.5 animate-bounce-soft" />
                  <span>{dict.pricing.candidateEssentialCta}</span>
                </button>
              </div>

              {/* OFFRE 3 : PACK CANDIDATURE PRO (2 500 FCFA) - RECOMMANDÉ */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-900 to-indigo-950 text-white flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all relative overflow-hidden ring-4 ring-blue-500/80 animate-pulse-glow card-hover-lift card-shine">
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {dict.common.recommended}
                </div>

                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/30 text-blue-200 mb-2 border border-blue-400/30">
                    {dict.pricing.candidateProBadge}
                  </div>
                  <h3 className="text-lg font-bold text-blue-100">{dict.pricing.candidateProTitle}</h3>
                  <div className="text-3xl font-black text-white mt-1">
                    {dict.pricing.candidateProPrice} <span className="text-sm font-semibold text-blue-300">{dict.pricing.candidateProPeriod}</span>
                  </div>
                  <p className="text-[11px] text-blue-200/80 mt-1">
                    {dict.pricing.candidateProDesc}
                  </p>

                  <ul className="mt-5 space-y-2.5 text-xs text-blue-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 icon-glow-blue" />
                      <span><strong>{dict.pricing.candidateProF1}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 icon-glow-blue" />
                      <span><strong>{dict.pricing.candidateProF2}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 icon-glow-blue" />
                      <span><strong>{dict.pricing.candidateProF3}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 icon-glow-blue" />
                      <span>{dict.pricing.candidateProF4}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 icon-glow-blue" />
                      <span>{dict.pricing.candidateProF5}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanPayment("2500")}
                  className="mt-6 w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-2xl text-center text-xs shadow-lg shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer animate-cta-loop"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                  <span>{dict.pricing.candidateProCta}</span>
                </button>
              </div>

              {/* OFFRE 4 : PACK CARRIÈRE VIP & PORTFOLIO (5 000 FCFA) */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all relative overflow-hidden border-2 border-purple-400 card-hover-lift card-shine">
                <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-300 animate-bounce-soft" />
                  {dict.pricing.candidateVipBadge}
                </div>

                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/30 text-purple-200 mb-2 border border-purple-400/30">
                    {dict.pricing.candidateVipBadge}
                  </div>
                  <h3 className="text-lg font-bold text-purple-100">{dict.pricing.candidateVipTitle}</h3>
                  <div className="text-3xl font-black text-white mt-1">
                    {dict.pricing.candidateVipPrice} <span className="text-sm font-semibold text-purple-300">{dict.pricing.candidateVipPeriod}</span>
                  </div>
                  <p className="text-[11px] text-purple-200/80 mt-1">
                    {dict.pricing.candidateVipDesc}
                  </p>

                  <ul className="mt-5 space-y-2.5 text-xs text-purple-100">
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0 icon-glow-amber animate-bounce-soft" />
                      <span><strong>{dict.pricing.candidateVipF1}</strong></span>
                    </li>
                    <li className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-pink-400 shrink-0 icon-glow-purple" />
                        <span><strong>{dict.pricing.candidateVipF2}</strong></span>
                      </div>
                      <Link
                        href="/portfolio"
                        target="_blank"
                        className="text-[10.5px] font-bold text-pink-300 hover:text-white underline pl-6 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{dict.pricing.candidateVipF2Link}</span>
                      </Link>
                    </li>
                    <li className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{dict.pricing.candidateVipF3}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{dict.pricing.candidateVipF4}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{dict.pricing.candidateVipF5}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanPayment("5000")}
                  className="mt-6 w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl text-center text-xs shadow-xl shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer animate-cta-loop"
                >
                  <Crown className="w-4 h-4 text-amber-300 animate-bounce-soft" />
                  <span>{dict.pricing.candidateVipCta}</span>
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
                {dict.faq.badge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {dict.faq.title}
              </h2>
            </div>

            <div className="space-y-2.5">
              {dict.faq.items.map((faq, idx) => (
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
                      className={\`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 \${
                        activeFaq === idx ? "rotate-180 text-blue-600" : ""
                      }\`}
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
        {/* 8. CALL TO ACTION */}
        {/* ========================================================================= */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              {dict.ctaBanner.title}
            </h2>
            <p className="mt-2.5 text-blue-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              {dict.ctaBanner.subtitle}
            </p>
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={handleStartCreation}
                className="px-8 py-4 bg-white hover:bg-blue-50 text-blue-700 font-black rounded-2xl shadow-2xl text-sm sm:text-base flex items-center gap-2.5 transition-all cursor-pointer animate-cta-loop"
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>
                  {isLoggedIn
                    ? isBusinessAccount
                      ? dict.ctaBanner.ctaRecruiter
                      : dict.dashboard.myResumesTitle
                    : dict.ctaBanner.ctaCandidate}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8-BIS. SECTION OFFRES BUSINESS & ENTREPRISES */}
        {/* ========================================================================= */}
        <section id="business" className="py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden border-t border-slate-800">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/15 to-purple-600/15 blur-3xl -z-10 pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>{dict.businessSection.badge}</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>

            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black tracking-tight leading-tight">
                {dict.businessSection.title} <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">
                  {dict.businessSection.titleHighlight}
                </span>
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed font-normal">
                {dict.businessSection.subtitle}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:border-blue-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-white">{dict.businessSection.pillar1Title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dict.businessSection.pillar1Desc}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:border-indigo-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-white">{dict.businessSection.pillar2Title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dict.businessSection.pillar2Desc}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-white">{dict.businessSection.pillar3Title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dict.businessSection.pillar3Desc}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:border-amber-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-white">{dict.businessSection.pillar4Title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dict.businessSection.pillar4Desc}
                </p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-8 sm:pt-10 overflow-visible">
              {/* PACK 1 : STARTER PME */}
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl relative backdrop-blur-md card-hover-lift card-shine">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <Building className="w-3.5 h-3.5 icon-glow-emerald" />
                      {dict.pricing.enterpriseStarterBadge}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mt-3">{dict.pricing.enterpriseStarterTitle}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {dict.pricing.enterpriseStarterDesc}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">{dict.pricing.enterpriseStarterPrice}</span>
                    <span className="text-sm font-bold text-slate-400">{dict.pricing.enterpriseStarterPeriod}</span>
                    <span className="text-xs font-semibold text-teal-400 ml-auto bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-800/40">
                      {dict.pricing.enterpriseStarterRate}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2.5 font-bold text-white">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 icon-glow-emerald" />
                      <span>{dict.pricing.enterpriseStarterF1}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{dict.pricing.enterpriseStarterF2}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{dict.pricing.enterpriseStarterF3}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{dict.pricing.enterpriseStarterF4}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{dict.pricing.enterpriseStarterF5}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanPayment("enterprise30")}
                  className="mt-8 w-full py-3.5 bg-slate-800 hover:bg-teal-600 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-teal-600/30 card-hover-lift"
                >
                  <Building className="w-4 h-4 animate-bounce-soft" />
                  <span>{dict.pricing.enterpriseStarterCta}</span>
                </button>
              </div>

              {/* PACK 2 : BUSINESS PRO */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-2 border-indigo-400 hover:border-indigo-300 transition-all flex flex-col justify-between shadow-2xl relative backdrop-blur-md ring-4 ring-indigo-500/20 scale-[1.02] z-10 card-hover-lift group">
                <div className="card-shine-inner" />

                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-[10px] sm:text-[11px] px-4 py-1 rounded-full uppercase tracking-wider shadow-xl flex items-center gap-1.5 whitespace-nowrap z-20 ring-2 ring-slate-950/30">
                  <Flame className="w-3.5 h-3.5 text-slate-950 fill-slate-950 animate-bounce-soft" />
                  <span>{dict.pricing.recommendedBadge}</span>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Users className="w-3.5 h-3.5 icon-glow-blue" />
                      {dict.pricing.enterpriseProBadge}
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white mt-3">{dict.pricing.enterpriseProTitle}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {dict.pricing.enterpriseProDesc}
                  </p>

                  <div className="mt-4 pt-4 border-t border-indigo-800/60 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">{dict.pricing.enterpriseProPrice}</span>
                    <span className="text-sm font-bold text-slate-300">{dict.pricing.enterpriseProPeriod}</span>
                    <span className="text-xs font-black text-amber-300 ml-auto bg-amber-950/70 px-2.5 py-0.5 rounded-md border border-amber-500/40">
                      {dict.pricing.enterpriseProRate}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-200">
                    <li className="flex items-center gap-2.5 font-bold text-white">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 icon-glow-amber" />
                      <span>{dict.pricing.enterpriseProF1}</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-semibold text-indigo-200">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-spin-slow" />
                      <span>{dict.pricing.enterpriseProF2}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{dict.pricing.enterpriseProF3}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{dict.pricing.enterpriseProF4}</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-semibold text-emerald-300">
                      <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{dict.pricing.enterpriseProF5}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{dict.pricing.enterpriseProF6}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanPayment("enterprise75")}
                  className="mt-8 w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-indigo-600/40 animate-cta-loop relative z-10"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                  <span>{dict.pricing.enterpriseProCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* PACK 3 : ENTREPRISE PREMIUM */}
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl relative backdrop-blur-md card-hover-lift card-shine">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Crown className="w-3.5 h-3.5 icon-glow-amber animate-bounce-soft" />
                      {dict.pricing.enterprisePremiumBadge}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mt-3">{dict.pricing.enterprisePremiumTitle}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {dict.pricing.enterprisePremiumDesc}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">{dict.pricing.enterprisePremiumPrice}</span>
                    <span className="text-sm font-bold text-slate-400">{dict.pricing.enterprisePremiumPeriod}</span>
                    <span className="text-xs font-black text-emerald-400 ml-auto bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                      {dict.pricing.enterprisePremiumRate}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2.5 font-bold text-white">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 icon-glow-amber" />
                      <span>{dict.pricing.enterprisePremiumF1}</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-emerald-300">
                      <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{dict.pricing.enterprisePremiumF2}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{dict.pricing.enterprisePremiumF3}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{dict.pricing.enterprisePremiumF4}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{dict.pricing.enterprisePremiumF5}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{dict.pricing.enterprisePremiumF6}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPlanPayment("enterprise200")}
                  className="mt-8 w-full py-3.5 bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-white font-black rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-amber-600/30 card-hover-lift"
                >
                  <Crown className="w-4 h-4 animate-bounce-soft" />
                  <span>{dict.pricing.enterprisePremiumCta}</span>
                </button>
              </div>
            </div>

            {/* Accord-Cadre & Grandes Écoles */}
            <div className="mt-10 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-950/70 via-indigo-950/70 to-purple-950/70 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left backdrop-blur-md">
              <div className="space-y-1 max-w-xl">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-300 block">
                  {dict.businessSection.customVolumeBadge}
                </span>
                <h4 className="text-base sm:text-lg font-black text-white">
                  {dict.businessSection.customVolumeTitle}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {dict.businessSection.customVolumeDesc}
                </p>
              </div>
              <a
                href="https://wa.me/2250700510524?text=Bonjour%20INNOVA%20GROUP,%20notre%20organisation%20souhaite%20un%20devis%20B2B%20sur-mesure%20pour%20plus%20de%20200%20profils%20sur%20MonCV.ai."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer group"
              >
                <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>{dict.businessSection.customVolumeCta}</span>
                <ChevronRight className="w-4 h-4 text-emerald-200" />
              </a>
            </div>

            {/* Accès Recruteur Box */}
            <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-white">{dict.businessSection.recruiterBoxTitle}</h5>
                  <p className="text-xs text-slate-300">{dict.businessSection.recruiterBoxDesc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenBusinessAuth}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
              >
                <span>{dict.businessSection.recruiterBoxCta}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-400">
              <div className="flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{dict.businessSection.securityNote}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{dict.businessSection.invoiceNote}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. CONTACT & SUPPORT INNOVA GROUP */}
        {/* ========================================================================= */}
        <section id="contact" className="py-14 sm:py-18 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>{dict.contact.badge}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {dict.contact.title}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {dict.contact.subtitle}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs shadow-md">
                      IG
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                        {dict.contact.devBadge}
                      </span>
                      <h4 className="font-extrabold text-sm">{dict.contact.devTitle}</h4>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed">
                    {dict.contact.devDesc}
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{dict.contact.devSupport247}</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/2250700510524?text=Bonjour%20l'%C3%A9quipe%20INNOVA%20GROUP%20%2F%20MonCV.ai,%20j'ai%20besoin%20d'assistance."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md shadow-emerald-500/20 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                      {dict.contact.whatsappBadge}
                    </span>
                    <span className="text-xs sm:text-sm font-black">{dict.contact.whatsappNumber}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-200" />
                </a>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{dict.contact.emailSupportLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{dict.contact.emailGeneralLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{dict.contact.phoneLabel}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-slate-50 p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
                {contactSubmitted ? (
                  <div className="py-12 text-center space-y-3 fade-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{dict.contact.successTitle}</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      {dict.contact.successMessage}
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
                        {dict.contact.formTitle}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {dict.contact.formSubtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {dict.contact.nameLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder={dict.contact.namePlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {dict.contact.emailLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder={dict.contact.emailPlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {dict.contact.messageLabel} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder={dict.contact.messagePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{dict.contact.sendButton}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Officiel */}
      <footer className="py-8 sm:py-10 bg-white border-t border-slate-200 text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                  MonCV<span className="text-blue-600">.ai</span>
                </span>
              </div>
              <span className="text-slate-400 text-xs font-medium">
                <span className="hidden sm:inline">•</span> {dict.footer.developedBy} <strong className="text-slate-700 font-semibold">{dict.footer.companyName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-center">
              <Link href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors py-1">
                {dict.footer.terms}
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition-colors py-1">
                {dict.footer.contact}
              </Link>
              <Link href="/portfolio" className="text-slate-600 hover:text-blue-600 transition-colors py-1">
                {dict.nav.portfolioWeb}
              </Link>
              <Link href="/#business" className="text-amber-600 font-bold hover:text-amber-700 transition-colors py-1">
                {dict.nav.enterprise} (B2B)
              </Link>
              <Link href="/create" className="text-blue-600 font-bold hover:underline py-1">
                {dict.nav.newCv} →
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-400">
            <p className="leading-relaxed text-center sm:text-left">
              © 2026 MonCV.ai — Une solution logicielle conçue et éditée par <strong className="text-slate-600 font-semibold">{dict.footer.companyName}</strong>. {dict.footer.rights}
            </p>

            <div className="flex items-center gap-3">
              <LanguageSelector variant="footer" />
              <div className="hidden md:flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-medium text-slate-500 text-center">
                <span>Abidjan 🇨🇮</span>
                <span>•</span>
                <span>Dakar 🇸🇳</span>
                <span>•</span>
                <span>Douala 🇨🇲</span>
                <span>•</span>
                <span>Paris 🇫🇷</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <MobileMoneyModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => alert("Votre formule a été activée avec succès !")}
        defaultPlan={selectedPlanPrice}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(chosenPlan) => {
          setIsAuthOpen(false);
          const u = StorageManager.getUser();
          const isBiz = u?.accountType === "business" || StorageManager.isBusinessAccount();

          if (chosenPlan && chosenPlan !== "free") {
            setSelectedPlanPrice(chosenPlan);
            setIsPaymentOpen(true);
          } else {
            if (isBiz) {
              router.push("/dashboard?tab=business");
            } else {
              router.push("/dashboard");
            }
          }
        }}
        defaultMode="register"
        defaultAccountType={authAccountType}
        defaultPlan={authDefaultPlan}
      />

      <LiveSocialProofToast />
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, '../app/page.tsx'), pageContent, 'utf-8');
console.log('Successfully generated localized app/page.tsx');
