"use client";

import React, { useState } from "react";
import { ResumeData, TemplateId } from "@/lib/types";
import { initialResumeData } from "@/lib/initialData";
import { CountryCityPicker } from "@/components/tools/CountryCityPicker";
import {
  X,
  Wand2,
  Sparkles,
  Loader2,
  User,
  GraduationCap,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  LayoutTemplate,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: ResumeData) => void;
}

const TEMPLATES_LABELS: Record<string, { label: string; color: string }> = {
  modern: { label: "Moderne", color: "bg-blue-600" },
  elegant: { label: "Élégant", color: "bg-slate-800" },
  corporate: { label: "Corporate", color: "bg-indigo-700" },
  minimal: { label: "Minimaliste", color: "bg-zinc-800" },
  creative: { label: "Créatif", color: "bg-violet-600" },
  ats: { label: "ATS Optimisé", color: "bg-emerald-700" },
};

const PROFESSIONS = [
  "Commercial / Vendeur",
  "Comptable / Financier",
  "Ingénieur Informatique",
  "Médecin / Infirmier",
  "Enseignant / Formateur",
  "Marketing / Communication",
  "Logisticien / Manager",
  "Juriste / Avocat",
  "Architecte / Ingénieur BTP",
  "Ressources Humaines",
  "Entrepreneur",
  "Autre",
];

export const SmartGenerateModal: React.FC<Props> = ({ isOpen, onClose, onGenerate }) => {
  const [step, setStep] = useState(1);
  const [profession, setProfession] = useState("");
  const [experience, setExperience] = useState<"junior" | "mid" | "senior">("mid");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [selectedColor, setSelectedColor] = useState("#2563eb");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Côte d'Ivoire");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const COLORS = [
    "#2563eb", "#7c3aed", "#0f172a", "#1e3a8a",
    "#059669", "#dc2626", "#b45309", "#0e7490",
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((res) => setTimeout(res, 1500));

    const expMap = {
      junior: { years: "2021", endYear: "2024", role: "Assistant" },
      mid: { years: "2018", endYear: "2024", role: "Responsable" },
      senior: { years: "2015", endYear: "2024", role: "Directeur" },
    };
    const expData = expMap[experience];

    const generated: ResumeData = {
      ...initialResumeData,
      title: `CV de ${firstName || "Prénom"} ${lastName || "Nom"}`,
      personal: {
        ...initialResumeData.personal,
        firstName: firstName || "Prénom",
        lastName: lastName || "Nom",
        email: email || "email@exemple.com",
        phone: phone || "+225 00 00 00 00",
        city: city || "Abidjan",
        country: country || "Côte d'Ivoire",
        title: profession || "Professionnel qualifié",
        photoUrl: "",
      },
      summary: `${expData.role} ${profession || "professionnel"} doté(e) d'une solide expérience dans le domaine. Reconnu(e) pour ${
        experience === "senior"
          ? "mon leadership stratégique et ma capacité à piloter des équipes performantes"
          : experience === "mid"
          ? "mon sens des responsabilités, ma rigueur et mon efficacité opérationnelle"
          : "ma motivation, ma curiosité et ma capacité d'apprentissage rapide"
      }. Orienté(e) résultats et passionné(e) par l'excellence professionnelle.`,
      experiences: [
        {
          id: "exp-gen-1",
          role: `${expData.role} ${profession || ""}`,
          company: "Entreprise Exemple SARL",
          city: city || "Abidjan",
          startDate: expData.years,
          endDate: "2024",
          current: false,
          highlights: [
            "Gestion et coordination des activités quotidiennes avec rigueur et efficacité",
            "Développement de stratégies innovantes ayant amélioré les performances de 25%",
            "Collaboration avec les équipes internes et les partenaires externes",
          ],
        },
        {
          id: "exp-gen-2",
          role: `Chargé(e) de ${profession || "Projets"}`,
          company: "Groupe International XYZ",
          city: "Abidjan",
          startDate: String(parseInt(expData.years) - 3),
          endDate: expData.years,
          current: false,
          highlights: [
            "Participation active au développement et suivi des projets stratégiques",
            "Coordination entre les différents départements pour atteindre les objectifs fixés",
          ],
        },
      ],
      educations: [
        {
          id: "edu-gen-1",
          degree: experience === "senior" ? "Master" : experience === "mid" ? "Licence" : "BTS",
          field: profession || "Gestion et Management",
          school: "Université Félix Houphouët-Boigny",
          city: city || "Abidjan",
          year: String(parseInt(expData.years) - 2),
        },
      ],
      design: {
        ...initialResumeData.design,
        template: selectedTemplate as TemplateId,
        primaryColor: selectedColor,
        showPhoto: false,
      },
    };

    setIsGenerating(false);
    onGenerate(generated);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setProfession("");
    setExperience("mid");
    setSelectedTemplate("modern");
    setSelectedColor("#2563eb");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCity("");
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Générer un CV Intelligemment</h2>
              <p className="text-slate-500 text-xs">Un CV professionnel en quelques secondes</p>
            </div>
          </div>
          <button onClick={() => { onClose(); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center px-6 py-3 bg-slate-50 border-b border-slate-100 gap-1">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  step >= s ? "text-orange-600" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step > s
                      ? "bg-emerald-500 text-white"
                      : step === s
                      ? "bg-orange-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step > s ? "✓" : s}
                </div>
                <span className="hidden sm:inline">
                  {s === 1 ? "Profil" : s === 2 ? "Modèle" : "Informations"}
                </span>
              </div>
              {s < 3 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Étape 1 — Profession & Expérience */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                  Quel est votre métier / domaine ?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PROFESSIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setProfession(p)}
                      className={`p-2.5 rounded-xl border-2 text-left text-xs font-semibold transition-all ${
                        profession === p
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-orange-500" />
                  Niveau d'expérience
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["junior", "mid", "senior"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setExperience(lvl)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        experience === lvl
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <p className={`font-bold text-sm capitalize ${experience === lvl ? "text-orange-700" : "text-slate-700"}`}>
                        {lvl === "junior" ? "Débutant" : lvl === "mid" ? "Intermédiaire" : "Senior"}
                      </p>
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        {lvl === "junior" ? "0 – 2 ans" : lvl === "mid" ? "3 – 7 ans" : "8 ans +"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!profession}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                Continuer
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Étape 2 — Modèle & Couleur */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-orange-500" />
                  Choisissez un modèle de CV
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(TEMPLATES_LABELS).map(([id, meta]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedTemplate(id)}
                      className={`p-3 rounded-2xl border-2 transition-all ${
                        selectedTemplate === id
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-full h-10 rounded-lg ${meta.color} mb-2 flex items-center justify-center`}>
                        <span className="text-white text-[10px] font-bold opacity-80">CV</span>
                      </div>
                      <p className={`font-bold text-xs ${selectedTemplate === id ? "text-orange-700" : "text-slate-700"}`}>
                        {meta.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Couleur principale
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-9 h-9 rounded-xl transition-all shadow-sm ${
                        selectedColor === c ? "ring-2 ring-offset-2 ring-orange-500 scale-110" : "hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-50 transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 — Informations de base */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Ces informations seront préremplies dans votre CV. Vous pourrez tout modifier après.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Prénom</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Kouassi"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.kouassi@email.com"
                    type="email"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Téléphone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 07 00 00 00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                <CountryCityPicker
                  selectedCountry={country}
                  selectedCity={city}
                  onCountryChange={setCountry}
                  onCityChange={setCity}
                  countryLabel="Pays"
                  cityLabel="Ville de résidence"
                  required={false}
                />
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-orange-800 text-xs leading-relaxed">
                  L'IA va générer automatiquement : résumé professionnel, expériences types, formations adaptées et compétences sectorielles — tout en respectant votre profil.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl text-sm hover:bg-slate-50 transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 disabled:opacity-50 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Générer mon CV !
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
