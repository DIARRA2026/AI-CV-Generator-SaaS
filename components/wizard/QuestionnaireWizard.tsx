"use client";

import React, { useState } from "react";
import { ResumeData } from "@/lib/types";
import { StepProfileType } from "./StepProfileType";
import { StepIdentity } from "./StepIdentity";
import { StepSummary } from "./StepSummary";
import { StepExperience } from "./StepExperience";
import { StepEducation } from "./StepEducation";
import { StepSkills } from "./StepSkills";
import { StepLanguages } from "./StepLanguages";
import { StepAdditional } from "./StepAdditional";
import { StepDesignCustomizer } from "./StepDesignCustomizer";
import { Check, Sparkles } from "lucide-react";

interface QuestionnaireWizardProps {
  resumeData: ResumeData;
  onChangeData: (updated: ResumeData) => void;
  onOpenATS: () => void;
  onOpenCoverLetter: () => void;
  onDownloadPDF: () => void;
  onShare: () => void;
  onOpenPayment: () => void;
}

export const QuestionnaireWizard: React.FC<QuestionnaireWizardProps> = ({
  resumeData,
  onChangeData,
  onOpenATS,
  onOpenCoverLetter,
  onDownloadPDF,
  onShare,
  onOpenPayment,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    { title: "Profil", desc: "Type de CV" },
    { title: "Contact", desc: "Identité & Photo" },
    { title: "Présentation", desc: "Synthèse IA" },
    { title: "Expériences", desc: "Parcours & Puces" },
    { title: "Formations", desc: "Diplômes & Études" },
    { title: "Compétences", desc: "Outils & Savoir-faire" },
    { title: "Langues", desc: "Niveaux & Maîtrise" },
    { title: "Atouts", desc: "Certifications & Projets" },
    { title: "Design", desc: "Modèles & Export" },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full">
      {/* Barre de progression avec mini-étapes cliquables */}
      <div className="mb-8 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px] px-2">
          {steps.map((s, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className="flex items-center gap-2 text-left group transition-all"
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105"
                      : isDone
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>
                <div className="hidden lg:block">
                  <p
                    className={`text-[11px] font-bold leading-none ${
                      isCurrent ? "text-blue-600" : isDone ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">{s.desc}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-4 sm:w-6 h-[2px] mx-1 rounded-full ${
                      idx < currentStep ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rendu dynamique de l'étape courante */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {currentStep === 0 && (
          <StepProfileType
            value={resumeData.targetProfile}
            onChange={(val) => onChangeData({ ...resumeData, targetProfile: val })}
            onNext={handleNext}
          />
        )}

        {currentStep === 1 && (
          <StepIdentity
            personal={resumeData.personal}
            design={resumeData.design}
            onChangePersonal={(field, val) =>
              onChangeData({
                ...resumeData,
                personal: { ...resumeData.personal, [field]: val },
              })
            }
            onChangeDesign={(field, val) =>
              onChangeData({
                ...resumeData,
                design: { ...resumeData.design, [field]: val },
              })
            }
            onUpdatePhoto={(photoUrl, showPhoto) =>
              onChangeData({
                ...resumeData,
                personal: { ...resumeData.personal, photoUrl },
                design: { ...resumeData.design, showPhoto },
              })
            }
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 2 && (
          <StepSummary
            summary={resumeData.summary}
            roleTitle={resumeData.personal.title}
            profileType={resumeData.targetProfile}
            onChangeSummary={(summary) =>
              onChangeData({ ...resumeData, summary })
            }
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 3 && (
          <StepExperience
            experiences={resumeData.experiences}
            profileType={resumeData.targetProfile}
            onChangeExperiences={(experiences) =>
              onChangeData({ ...resumeData, experiences })
            }
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 4 && (
          <StepEducation
            educations={resumeData.educations}
            onChangeEducations={(educations) =>
              onChangeData({ ...resumeData, educations })
            }
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 5 && (
          <StepSkills
            skills={resumeData.skills}
            onChangeSkills={(skills) =>
              onChangeData({ ...resumeData, skills })
            }
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 6 && (
          <StepLanguages
            languages={resumeData.languages}
            onChangeLanguages={(languages) =>
              onChangeData({ ...resumeData, languages })
            }
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 7 && (
          <StepAdditional
            sections={resumeData.sections}
            onChangeSections={(sections) =>
              onChangeData({ ...resumeData, sections })
            }
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 8 && (
          <StepDesignCustomizer
            design={resumeData.design}
            onChangeDesign={(field, val) =>
              onChangeData({
                ...resumeData,
                design: { ...resumeData.design, [field]: val },
              })
            }
            onOpenATS={onOpenATS}
            onOpenCoverLetter={onOpenCoverLetter}
            onDownloadPDF={onDownloadPDF}
            onShare={onShare}
            onOpenPayment={onOpenPayment}
          />
        )}
      </div>
    </div>
  );
};
