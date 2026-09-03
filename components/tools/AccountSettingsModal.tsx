"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Crown,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { StorageManager, UserSession } from "@/lib/storage";
import { PlanTier } from "@/lib/types";
import { CountryCityPicker } from "@/components/tools/CountryCityPicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenPayment?: (plan?: "1500" | "2500" | "5000") => void;
  onLogout?: () => void;
}

export const AccountSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenPayment,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "plan" | "data">("profile");

  // User Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Côte d'Ivoire");
  const [profession, setProfession] = useState("");
  const [planTier, setPlanTier] = useState<PlanTier>("free");

  // Profile Save Feedback
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security / Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Load user data on open
  useEffect(() => {
    if (isOpen) {
      const user = StorageManager.getUser();
      if (user) {
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setCity(user.city || "");
        setCountry(user.country || "Côte d'Ivoire");
        setProfession(user.profession || "");
        setPlanTier(user.planTier || StorageManager.getPlanTier());
      }
      setProfileSuccess(false);
      setProfileError(null);
      setPasswordSuccess(null);
      setPasswordError(null);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    await new Promise((r) => setTimeout(r, 600));

    const result = StorageManager.updateUserProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      country: country.trim(),
      profession: profession.trim(),
    });

    setIsSavingProfile(false);
    if (result.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileError(result.message || "Erreur lors de la sauvegarde.");
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword) {
      setPasswordError("Veuillez saisir votre mot de passe actuel.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setIsUpdatingPassword(true);
    await new Promise((r) => setTimeout(r, 600));

    const res = StorageManager.changePassword(oldPassword, newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordSuccess(res.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError(res.message);
    }
  };

  // Handle Export Data
  const handleExportData = () => {
    const dataStr = StorageManager.exportUserData();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `moncv_export_${firstName.toLowerCase() || "candidat"}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Account Deletion
  const handleDeleteAccount = () => {
    if (confirm("ATTENTION : Cette action supprimera définitivement votre compte et l'ensemble de vos CVs enregistrés. Continuer ?")) {
      StorageManager.deleteAccount();
      onClose();
      if (onLogout) onLogout();
    }
  };

  const initials = `${firstName ? firstName[0] : "U"}${lastName ? lastName[0] : ""}`.toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm fade-in overflow-hidden"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative max-h-[92vh] flex flex-col transform transition-all border border-slate-100"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Ligne dégradée d'accent */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shrink-0" />

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête profil du compte */}
        <div className="p-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
            {initials}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-black text-slate-900">
                {firstName || "Candidat"} {lastName}
              </h2>

              {/* Badge Formule */}
              {planTier === "5000" ? (
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-200 text-xs font-black rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  Pack VIP & Portfolio
                </span>
              ) : planTier === "2500" ? (
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 text-xs font-black rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Pack Pro
                </span>
              ) : planTier === "1500" ? (
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Pack Essentiel
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold rounded-full">
                  Formule Découverte
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium">{email}</p>
            {profession && (
              <p className="text-xs text-blue-600 font-semibold">{profession}</p>
            )}
          </div>
        </div>

        {/* Barre d'onglets de navigation */}
        <div className="flex px-4 pt-2 bg-slate-50/70 border-b border-slate-100 overflow-x-auto no-scrollbar gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "profile"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil Personnel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "security"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sécurité & Mot de passe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("plan")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "plan"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Mon Offre & Formule</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "data"
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sauvegarde & Données</span>
          </button>
        </div>

        {/* Contenu de l'onglet actif défilant */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ========================================================================= */}
          {/* 1. ONGLET PROFIL */}
          {/* ========================================================================= */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Vos informations personnelles ont été mises à jour avec succès !</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prénom */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom de famille
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom de famille"
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Email (Principal - non modifiable ici pour sécurité) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adresse Email (Identifiant de connexion)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none font-medium text-slate-600"
                    />
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                      Vérifié
                    </span>
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Numéro de Téléphone (WhatsApp / Mobile)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Sélecteur de Pays & Ville avec Ruban */}
                <div className="sm:col-span-2 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                  <CountryCityPicker
                    selectedCountry={country}
                    selectedCity={city}
                    onCountryChange={setCountry}
                    onCityChange={setCity}
                    countryLabel="Pays de résidence"
                    cityLabel="Ville / Commune"
                    required={false}
                  />
                </div>

                {/* Titre / Profession */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Poste visé ou Titre professionnel
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="Ex: Responsable Marketing Digital & Communication"
                      className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Enregistrer les modifications</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 2. ONGLET SÉCURITÉ & MOT DE PASSE */}
          {/* ========================================================================= */}
          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-blue-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Pour votre sécurité, la modification de votre mot de passe requiert la saisie de votre ancien mot de passe.
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Ancien Mot de Passe */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de passe actuel <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showOldPass ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Votre mot de passe actuel"
                    className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nouveau Mot de Passe */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caractères"
                    className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmer Nouveau Mot de Passe */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Répétez le nouveau mot de passe"
                    className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Vérification et mise à jour...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Mettre à jour mon mot de passe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 3. ONGLET MON OFFRE & ABONNEMENT */}
          {/* ========================================================================= */}
          {activeTab === "plan" && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl border bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10 space-y-3">
                  <span className="px-3 py-1 bg-white/20 text-white text-[11px] font-bold rounded-full uppercase tracking-wider backdrop-blur-sm">
                    Formule Actuellement Active
                  </span>

                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black">
                      {planTier === "5000"
                        ? "Pack VIP & Portfolio Web"
                        : planTier === "2500"
                        ? "Pack Candidature Pro"
                        : planTier === "1500"
                        ? "Pack Essentiel"
                        : "Formule Découverte (Gratuit)"}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 max-w-md">
                    {planTier === "5000"
                      ? "Accès illimité à toutes les fonctionnalités + Portfolio Web interactif à vie + Support WhatsApp VIP 7j/7."
                      : planTier === "2500"
                      ? "CV PDF HD sans filigrane + Demande d'emploi officielle + Lettre de motivation IA Word/PDF."
                      : planTier === "1500"
                      ? "Téléchargement PDF Haute Définition sans aucun filigrane."
                      : "Aperçu de votre CV en temps réel avec filigrane MonCV.ai."}
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenPayment) onOpenPayment("2500");
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Changer de formule / Mettre à niveau</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Récapitulatif des fonctionnalités de chaque offre */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Fonctionnalités débloquées avec votre compte :</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Création et modifications de CVs illimitées</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Espace privé « Mes CVs » sauvegardé</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                    planTier !== "free" ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 ${planTier !== "free" ? "text-emerald-600" : "text-slate-300"}`} />
                    <span>Export PDF Haute Définition sans filigrane</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                    planTier === "2500" || planTier === "5000" ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 ${planTier === "2500" || planTier === "5000" ? "text-emerald-600" : "text-slate-300"}`} />
                    <span>Demande d'Emploi & Lettre de Motivation IA (Word/PDF)</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center gap-2 sm:col-span-2 ${
                    planTier === "5000" ? "bg-purple-50/50 border-purple-200" : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    <Crown className={`w-4 h-4 ${planTier === "5000" ? "text-amber-500" : "text-slate-300"}`} />
                    <span>Site Web Portfolio Personnel Interactif en ligne à vie</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. ONGLET DONNÉES & SAUVEGARDE */}
          {/* ========================================================================= */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Exporter mes données et CVs</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Téléchargez une copie complète au format JSON contenant votre profil candidat ainsi que tous vos CVs enregistrés.
                </p>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Télécharger ma sauvegarde (.json)</span>
                </button>
              </div>

              {/* Zone de Déconnexion & Danger */}
              <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-red-900 text-xs sm:text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Zone de Confidentialité & Danger</span>
                </h4>
                <p className="text-xs text-red-700 leading-relaxed">
                  Vous pouvez vous déconnecter ou demander la suppression définitive de votre compte et de vos CVs sur ce navigateur.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onLogout) onLogout();
                    }}
                    className="px-4 py-2 bg-white border border-red-300 hover:bg-red-50 text-red-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600" />
                    <span>Se déconnecter de ce compte</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer mon compte définitivement</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
