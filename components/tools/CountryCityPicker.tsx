"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ALL_WORLD_COUNTRIES, POPULAR_COUNTRIES, getCitiesForCountry } from "@/lib/geoData";
import { MapPin, Globe, ChevronDown, Check, Search, X } from "lucide-react";

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

// Fonction de normalisation pour la recherche insensible à la casse et aux accents
const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Changement de pays : réinitialiser ou proposer la première ville
  const handleSelectCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    onCountryChange(newCountry);
    const newCities = getCitiesForCountry(newCountry);
    if (newCities.length > 0) {
      onCityChange(newCities[0]);
    } else {
      onCityChange("");
    }
    setIsOpen(false);
  };

  // Fermer le dropdown lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrage intelligent des villes :
  // Priorité absolue aux villes dont le nom COMMENCE par les premières lettres tapées
  const filteredCities = useMemo(() => {
    if (!selectedCity || !selectedCity.trim()) {
      return cities;
    }
    const query = normalizeText(selectedCity);

    const startsWithMatches: string[] = [];
    const containsMatches: string[] = [];

    for (const city of cities) {
      const normCity = normalizeText(city);
      if (normCity.startsWith(query)) {
        startsWithMatches.push(city);
      } else if (normCity.includes(query)) {
        containsMatches.push(city);
      }
    }

    return [...startsWithMatches, ...containsMatches];
  }, [cities, selectedCity]);

  const handleSelectCity = (city: string) => {
    onCityChange(city);
    setIsOpen(false);
  };

  // Gestion de la navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredCities.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredCities.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCities.length > 0 && filteredCities[highlightedIndex]) {
        handleSelectCity(filteredCities[highlightedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Rendu visuel avec surbrillance des lettres tapées
  const renderCityHighlight = (cityName: string) => {
    if (!selectedCity || !selectedCity.trim()) {
      return <span>{cityName}</span>;
    }

    const query = normalizeText(selectedCity);
    const normCity = normalizeText(cityName);
    const matchIndex = normCity.indexOf(query);

    if (matchIndex === -1) {
      return <span>{cityName}</span>;
    }

    const before = cityName.slice(0, matchIndex);
    const match = cityName.slice(matchIndex, matchIndex + selectedCity.trim().length);
    const after = cityName.slice(matchIndex + selectedCity.trim().length);

    return (
      <span>
        {before}
        <span className="font-extrabold text-blue-600 underline decoration-blue-400 underline-offset-2">
          {match}
        </span>
        {after}
      </span>
    );
  };

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {/* Ligne des sélecteurs Pays et Ville */}
      <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        {/* SÉLECTEUR DE PAYS DU MONDE */}
        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{countryLabel}</span>
              {required && <span className="text-red-500">*</span>}
            </span>
          </label>
          <div className="relative">
            <select
              value={currentCountry}
              onChange={handleSelectCountry}
              className={`w-full pl-2 pr-6 ${
                compact ? "py-1.5 text-xs rounded-lg" : "py-2 text-xs sm:text-sm rounded-xl"
              } bg-white border border-slate-200 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all appearance-none cursor-pointer`}
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

        {/* CHAMP AUTOCOMPLÉTION INTELLIGENTE VILLES SELON LE PAYS */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{cityLabel}</span>
              {required && <span className="text-red-500">*</span>}
            </span>
            <span className="text-[9px] text-slate-400 font-medium">
              {cities.length > 0 ? `${cities.length} villes` : "Saisie libre"}
            </span>
          </label>

          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={selectedCity}
              onChange={(e) => {
                onCityChange(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onFocus={() => {
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onClick={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={cities.length > 0 ? `Ex: ${cities[0]}...` : "Ex: Ville..."}
              autoComplete="off"
              className={`w-full pl-2.5 pr-8 ${
                compact ? "py-1.5 text-xs rounded-lg" : "py-2 text-xs sm:text-sm rounded-xl"
              } bg-white border ${
                isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
              } font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all`}
            />

            {/* Bouton de bascule / ouverture de la liste */}
            <div className="absolute right-1.5 flex items-center gap-0.5">
              {selectedCity && (
                <button
                  type="button"
                  onClick={() => {
                    onCityChange("");
                    inputRef.current?.focus();
                    setIsOpen(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  title="Effacer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(!isOpen);
                  inputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                title="Afficher les villes suggérées"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* LISTE DÉROULANTE INTELLIGENTE DES VILLES (Filtrage en direct au fur et à mesure de la frappe) */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden fade-in max-h-52 flex flex-col">
              {/* En-tête du menu contextuel */}
              <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <Search className="w-3 h-3 text-blue-500" />
                  <span>Villes de {currentCountry}</span>
                </span>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  {filteredCities.length} résultat{filteredCities.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Liste défilable des villes */}
              <div className="overflow-y-auto max-h-40 divide-y divide-slate-100/70 custom-scrollbar">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city, idx) => {
                    const isSelected = selectedCity.trim().toLowerCase() === city.toLowerCase();
                    const isHighlighted = idx === highlightedIndex;

                    return (
                      <button
                        key={city}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Évite la perte de focus avant la sélection
                          handleSelectCity(city);
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isHighlighted || isSelected
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? "text-blue-600" : "text-slate-400"
                            }`}
                          />
                          <span className="truncate">{renderCityHighlight(city)}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-medium text-slate-700">
                      Aucune ville pré-enregistrée ne commence par &quot;{selectedCity}&quot;
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Vous pouvez conserver cette saisie personnalisée en appuyant sur Entrée.
                    </p>
                  </div>
                )}
              </div>

              {/* Pied de liste : saisie libre possible */}
              {selectedCity && !cities.includes(selectedCity) && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                  }}
                  className="px-2.5 py-1.5 bg-blue-50/60 border-t border-blue-100 text-[10px] text-blue-700 font-medium flex items-center justify-between cursor-pointer hover:bg-blue-100/60 transition-colors"
                >
                  <span className="truncate">
                    Utiliser la valeur personnalisée : <strong>{selectedCity}</strong>
                  </span>
                  <span className="text-[9px] font-bold uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded shrink-0 ml-1">
                    Valider
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
