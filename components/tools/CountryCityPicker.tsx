"use client";

import React, { useMemo } from "react";
import { ALL_WORLD_COUNTRIES, POPULAR_COUNTRIES, getCitiesForCountry } from "@/lib/geoData";
import { MapPin, Globe, ChevronDown, Check } from "lucide-react";

interface Props {
  selectedCountry: string;
  selectedCity: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  cityLabel?: string;
  countryLabel?: string;
  required?: boolean;
  compact?: boolean;
}

export const CountryCityPicker: React.FC<Props> = ({
  selectedCountry,
  selectedCity,
  onCountryChange,
  onCityChange,
  cityLabel = "Ville / Commune",
  countryLabel = "Pays de résidence",
  required = true,
  compact = false,
}) => {
  const currentCountry = selectedCountry || "Côte d'Ivoire";
  const cities = useMemo(() => getCitiesForCountry(currentCountry), [currentCountry]);

  const handleSelectCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    onCountryChange(newCountry);
    const newCities = getCitiesForCountry(newCountry);
    if (newCities.length > 0 && !newCities.includes(selectedCity)) {
      onCityChange(newCities[0]);
    }
  };

  const handleSelectCityChip = (city: string) => {
    onCityChange(city);
  };

  return (
    <div className={compact ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-3"}>
      {/* 1. SÉLECTEUR DE PAYS DU MONDE */}
      <div>
        <label className="block text-[10.5px] font-bold text-slate-700 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{countryLabel}</span>
            {required && <span className="text-red-500">*</span>}
          </span>
          {!compact && <span className="text-[10px] text-slate-400 font-medium">Tous les pays</span>}
        </label>
        <div className="relative">
          <select
            value={currentCountry}
            onChange={handleSelectCountry}
            className={`w-full pl-2.5 pr-7 ${compact ? "py-1.5 text-xs rounded-lg" : "py-2 text-xs sm:text-sm rounded-xl"} bg-white border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all appearance-none cursor-pointer`}
          >
            <optgroup label="🌍 Pays Fréquents (Afrique & Diaspora)">
              {POPULAR_COUNTRIES.map((c) => (
                <option key={`pop-${c.code}`} value={c.name}>
                  {c.flag} {c.name} ({c.dialCode})
                </option>
              ))}
            </optgroup>
            <optgroup label="🌐 Tous les Pays du Monde">
              {ALL_WORLD_COUNTRIES.map((c) => (
                <option key={`all-${c.code}-${c.name}`} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </optgroup>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 2. CHAMP VILLE */}
      <div>
        <label className="block text-[10.5px] font-bold text-slate-700 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{cityLabel}</span>
            {required && <span className="text-red-500">*</span>}
          </span>
          {!compact && (
            <span className="text-[10px] text-slate-400 font-medium">
              {cities.length > 0 ? `${cities.length} suggérées` : "Libre"}
            </span>
          )}
        </label>

        <div className="relative">
          <input
            type="text"
            list={`cities-datalist-${currentCountry.replace(/[^a-zA-Z]/g, "")}`}
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder={cities.length > 0 ? `Ex: ${cities[0]}...` : "Ex: Ville ou commune..."}
            className={`w-full px-2.5 ${compact ? "py-1.5 text-xs rounded-lg" : "py-2 text-xs sm:text-sm rounded-xl"} bg-white border border-slate-200 font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all`}
          />
          <datalist id={`cities-datalist-${currentCountry.replace(/[^a-zA-Z]/g, "")}`}>
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>

        {/* Si non-compact, afficher le ruban de villes */}
        {!compact && cities.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-bold text-slate-500 flex items-center gap-1">
                <span>Villes ({currentCountry}) :</span>
              </span>
              <span className="text-[9.5px] text-blue-600 font-medium">1 clic</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
              {cities.map((city) => {
                const isSelected = selectedCity.trim().toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSelectCityChip(city)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-600"
                        : "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    <span>{city}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
