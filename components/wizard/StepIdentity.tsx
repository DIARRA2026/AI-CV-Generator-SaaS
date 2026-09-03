"use client";

import React, { useRef } from "react";
import { ResumeData } from "@/lib/types";
import { User, Mail, Phone, MapPin, Linkedin, Globe, Camera, Eye, EyeOff, Upload, Check } from "lucide-react";
import { CountryCityPicker } from "@/components/tools/CountryCityPicker";

interface StepIdentityProps {
  personal: ResumeData["personal"];
  design: ResumeData["design"];
  onChangePersonal: (field: keyof ResumeData["personal"], value: string) => void;
  onChangeDesign: (field: keyof ResumeData["design"], value: any) => void;
  onUpdatePhoto: (photoUrl: string, showPhoto: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepIdentity: React.FC<StepIdentityProps> = ({
  personal,
  design,
  onChangePersonal,
  onChangeDesign,
  onUpdatePhoto,
  onNext,
  onPrev,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          // Mise à jour atomique de l'URL et de la visibilité de la photo
          onUpdatePhoto(result, true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const sampleAvatars = [
    {
      label: "Homme 1",
      url: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=400",
    },
    {
      label: "Femme 1",
      url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400",
    },
    {
      label: "Homme 2",
      url: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=400",
    },
    {
      label: "Femme 2",
      url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
    },
  ];

  return (
    <div className="space-y-6 slide-up max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
          Étape 2 sur 8 — Vos Coordonnées
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Comment les recruteurs peuvent-ils vous joindre ?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Renseignez vos coordonnées exactes et ajoutez votre photo de profil.
        </p>
      </div>

      {/* Gestionnaire de Photo Amélioré */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {personal.photoUrl ? (
                <img
                  src={personal.photoUrl}
                  alt="Photo de profil"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-200 border-2 border-white flex flex-col items-center justify-center text-slate-400">
                  <Camera className="w-7 h-7" />
                  <span className="text-[9px] mt-1 font-semibold">Sans photo</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer shadow-md transition-transform transform hover:scale-105"
                title="Télécharger une photo"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Photo Professionnelle</h4>
                {personal.photoUrl && design.showPhoto && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    Active sur le CV
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                PNG, JPG ou JPEG (Format carré ou portrait recommandé).
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Charger ma photo
                </button>
                {personal.photoUrl && (
                  <button
                    type="button"
                    onClick={() => onUpdatePhoto("", false)}
                    className="text-xs text-rose-600 hover:underline px-2 py-1 font-medium"
                  >
                    Supprimer la photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeDesign("showPhoto", !design.showPhoto)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                design.showPhoto
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {design.showPhoto ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {design.showPhoto ? "Afficher sur le CV" : "Masquer du CV"}
            </button>
          </div>
        </div>

        {/* Avatars d'exemples rapides */}
        <div className="pt-3 border-t border-slate-200/80">
          <p className="text-[11px] font-semibold text-slate-600 mb-2">
            Ou choisir un avatar de démonstration :
          </p>
          <div className="flex flex-wrap gap-2.5 items-center">
            {sampleAvatars.map((avatar, idx) => {
              const isSelected = personal.photoUrl === avatar.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onUpdatePhoto(avatar.url, true)}
                  className={`flex items-center gap-2 p-1.5 pr-3 bg-white rounded-xl border transition-all ${
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-600/30 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                  <span className="text-xs font-medium text-slate-700">{avatar.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Prénom <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Ex: Jean"
              value={personal.firstName}
              onChange={(e) => onChangePersonal("firstName", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nom de famille <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Ex: Kouassi"
              value={personal.lastName}
              onChange={(e) => onChangePersonal("lastName", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Titre Professionnel / Métier recherché <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Commercial & Responsable Développement des Ventes"
            value={personal.title}
            onChange={(e) => onChangePersonal("title", e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Ce titre apparaîtra en haut de votre CV et guidera l'IA dans la formulation de vos compétences.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Adresse Email <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              placeholder="jean.kouassi@email.com"
              value={personal.email}
              onChange={(e) => onChangePersonal("email", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Numéro de téléphone <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="tel"
              placeholder="+225 07 00 11 22 33"
              value={personal.phone}
              onChange={(e) => onChangePersonal("phone", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <CountryCityPicker
            selectedCountry={personal.country || "Côte d'Ivoire"}
            selectedCity={personal.city || ""}
            onCountryChange={(newCountry) => onChangePersonal("country", newCountry)}
            onCityChange={(newCity) => onChangePersonal("city", newCity)}
            countryLabel="Pays de résidence (Tous les pays du monde)"
            cityLabel="Ville / Commune"
            required={true}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lien LinkedIn (Optionnel)
          </label>
          <div className="relative">
            <Linkedin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="linkedin.com/in/jean-kouassi"
              value={personal.linkedin}
              onChange={(e) => onChangePersonal("linkedin", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Portfolio / Site web (Optionnel)
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="monportfolio.pro"
              value={personal.website}
              onChange={(e) => onChangePersonal("website", e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all text-sm"
        >
          ← Précédent
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-600/20 transition-all text-sm flex items-center gap-2"
        >
          Continuer vers votre profil
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
