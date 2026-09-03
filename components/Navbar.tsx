import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, FileText, LayoutDashboard, Crown, User, LogOut,
  Settings, ChevronDown, ShieldCheck, Menu, X, Compass, DollarSign, Globe
} from "lucide-react";
import { AuthModal } from "@/components/tools/AuthModal";
import { AccountSettingsModal } from "@/components/tools/AccountSettingsModal";
import { StorageManager, UserSession } from "@/lib/storage";

interface NavbarProps {
  onOpenPayment?: (plan?: "1500" | "2500" | "5000") => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPayment, onOpenAuth }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [targetRedirect, setTargetRedirect] = useState<string>("/dashboard");
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const update = () => {
      setCurrentUser(StorageManager.getUser());
    };
    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  const handleMesCvsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (StorageManager.isLoggedIn()) {
      router.push("/dashboard");
    } else {
      setAuthMode("login");
      setTargetRedirect("/dashboard");
      setIsAuthOpen(true);
    }
  };

  const handleNewCvClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (StorageManager.isLoggedIn()) {
      router.push("/dashboard?new=true");
    } else if (onOpenAuth) {
      onOpenAuth();
    } else {
      setAuthMode("register");
      setTargetRedirect("/dashboard?new=true");
      setIsAuthOpen(true);
    }
  };

  // Fermer le menu déroulant lors d'un clic extérieur
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isProfileMenuOpen && !(e.target as HTMLElement).closest("#user-profile-menu")) {
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [isProfileMenuOpen]);

  const handleLogout = () => {
    StorageManager.logout();
    setCurrentUser(null);
    setIsProfileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
    router.push("/");
  };

  return (
    <>
      <header className={`sticky top-0 z-40 w-full transition-all duration-300 no-print ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/90"
          : "bg-white/80 backdrop-blur-sm border-b border-slate-200/60"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 btn-press">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-slate-900 leading-none">
                MonCV<span className="text-blue-600">.ai</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Intelligence CV & ATS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden sm:flex items-center gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={handleMesCvsClick}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all cursor-pointer btn-press"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
              <span>Mes CVs</span>
            </button>

            <button
              type="button"
              onClick={handleNewCvClick}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer btn-press"
            >
              <FileText className="w-4 h-4" />
              <span>Nouveau CV</span>
            </button>

            <Link
              href="/portfolio"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 rounded-xl transition-all cursor-pointer btn-press border border-indigo-100"
            >
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Portfolio Web</span>
              <span className="px-1.5 py-0.2 rounded-md bg-purple-600 text-white text-[9px] font-black uppercase">
                VIP
              </span>
            </Link>

            {!currentUser ? (
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuth) {
                    onOpenAuth();
                  } else {
                    setAuthMode("login");
                    setIsAuthOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50/80 border border-slate-200/90 hover:border-blue-200 rounded-xl transition-all cursor-pointer btn-press shadow-xs"
                title="Se connecter ou créer un compte"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Se connecter ou Créer un compte</span>
              </button>
            ) : null}

            {currentUser ? (
              <div className="relative pl-1" id="user-profile-menu">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs btn-press"
                  title="Paramètres et options du compte"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    {(currentUser.firstName?.[0] || "C").toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-900">
                    {currentUser.firstName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Menu Déroulant Profil & Paramètres Desktop */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 fade-in space-y-1">
                    <div className="px-3 py-2.5 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {currentUser.firstName} {currentUser.lastName || ""}
                        </span>
                        <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {currentUser.planTier === "5000"
                            ? "VIP"
                            : currentUser.planTier === "2500"
                            ? "Pro"
                            : currentUser.planTier === "1500"
                            ? "Essentiel"
                            : "Gratuit"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate font-medium">
                        {currentUser.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsSettingsModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer btn-press"
                    >
                      <Settings className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Paramètres du compte</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        setIsProfileMenuOpen(false);
                        handleMesCvsClick(e);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer btn-press"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Mes CVs & Candidatures</span>
                    </button>

                    {onOpenPayment && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenPayment("2500");
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-amber-600 hover:bg-amber-50 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer btn-press"
                      >
                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Formule & Facturation</span>
                      </button>
                    )}

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer btn-press"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {onOpenPayment && (
              <button
                type="button"
                onClick={() => onOpenPayment()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer btn-press"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Passer Premium</span>
              </button>
            )}
          </div>

          {/* Mobile Action Controls (< 640px) */}
          <div className="flex sm:hidden items-center gap-2">
            {onOpenPayment && (
              <button
                type="button"
                onClick={() => onOpenPayment()}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white font-bold rounded-xl text-[11px] shadow-sm cursor-pointer btn-press"
              >
                <Crown className="w-3 h-3" />
                <span>Premium</span>
              </button>
            )}

            {currentUser && (
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center cursor-pointer btn-press shadow-xs"
                title="Mon Profil"
              >
                {(currentUser.firstName?.[0] || "C").toUpperCase()}
              </button>
            )}

            {/* Bouton Burger Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer btn-press"
              aria-label="Ouvrir le menu"
            >
              {isMobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* TIROIR LATÉRAL MOBILE (Mobile Drawer) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden fade-in flex">
          {/* Backdrop avec flou */}
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          />

          {/* Panneau Latéral */}
          <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 slide-up overflow-y-auto">
            {/* Header Drawer */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-black text-sm text-slate-900">MonCV<span className="text-blue-600">.ai</span></span>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profil Utilisateur Mobile */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {(currentUser.firstName?.[0] || "C").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate">
                        {currentUser.firstName} {currentUser.lastName || ""}
                      </p>
                      <p className="text-[10.5px] text-slate-500 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-slate-500">Formule actuelle :</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {currentUser.planTier === "5000"
                        ? "VIP Illimité"
                        : currentUser.planTier === "2500"
                        ? "Pro (Recommandé)"
                        : currentUser.planTier === "1500"
                        ? "Essentiel"
                        : "Gratuit"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 font-medium">Connectez-vous pour retrouver tous vos CVs :</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        setAuthMode("login");
                        setIsAuthOpen(true);
                      }}
                      className="py-2 px-3 text-center text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl cursor-pointer btn-press"
                    >
                      Connexion
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        setAuthMode("register");
                        setIsAuthOpen(true);
                      }}
                      className="py-2 px-3 text-center text-xs font-bold text-white bg-blue-600 rounded-xl cursor-pointer btn-press shadow-xs"
                    >
                      S'inscrire
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Liens de Navigation Mobile */}
            <div className="p-4 space-y-1.5 flex-1">
              <button
                onClick={(e) => {
                  setIsMobileDrawerOpen(false);
                  handleNewCvClick(e);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs cursor-pointer btn-press"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Créer un Nouveau CV</span>
              </button>

              <button
                onClick={(e) => {
                  setIsMobileDrawerOpen(false);
                  handleMesCvsClick(e);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer btn-press"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Mes CVs & Candidatures</span>
              </button>

              <Link
                href="/portfolio"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-purple-50/70 text-purple-900 font-bold text-xs cursor-pointer btn-press border border-purple-200/60"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span>Portfolio Web Interactif</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9.5px] font-black uppercase">
                  VIP
                </span>
              </Link>

              <Link
                href="/#modeles"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer btn-press"
              >
                <Compass className="w-4 h-4 text-slate-500" />
                <span>Galerie des Modèles</span>
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer btn-press"
              >
                <Compass className="w-4 h-4 text-slate-500" />
                <span>Nous Contacter</span>
              </Link>

              <Link
                href="/terms"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer btn-press"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Conditions d'Utilisation</span>
              </Link>

              {currentUser && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsSettingsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer btn-press"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Paramètres du Compte</span>
                </button>
              )}

              {onOpenPayment && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenPayment("2500");
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs cursor-pointer btn-press shadow-xs mt-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>Passer Premium (Pack Pro)</span>
                </button>
              )}
            </div>

            {/* Mentions Éditeur INNOVA GROUP dans le Drawer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/80 text-center">
              <span className="text-[10px] text-slate-500 block">
                MonCV.ai • Développé par <strong className="text-slate-700 font-bold">INNOVA GROUP</strong>
              </span>
            </div>

            {/* Footer Drawer */}
            {currentUser && (
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer btn-press"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal universel depuis la Navbar */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          setCurrentUser(StorageManager.getUser());
          router.push(targetRedirect);
        }}
        defaultMode={authMode}
      />

      {/* Modale Paramètres de Compte Client */}
      <AccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenPayment={onOpenPayment}
        onLogout={handleLogout}
      />
    </>
  );
};
