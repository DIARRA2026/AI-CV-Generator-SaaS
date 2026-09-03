"use client";

import React, { forwardRef } from "react";
import { ResumeData } from "@/lib/types";
import { TemplateModern } from "./templates/TemplateModern";
import { TemplateElegant } from "./templates/TemplateElegant";
import { TemplateCorporate } from "./templates/TemplateCorporate";
import { TemplateMinimal } from "./templates/TemplateMinimal";
import { TemplateCreative } from "./templates/TemplateCreative";
import { TemplateATS } from "./templates/TemplateATS";

interface CVPreviewCanvasProps {
  data: ResumeData;
  scale?: number;
}

export const CVPreviewCanvas = forwardRef<HTMLDivElement, CVPreviewCanvasProps>(
  ({ data, scale = 1 }, ref) => {
    const renderTemplate = () => {
      switch (data.design.template) {
        case "elegant":
          return <TemplateElegant data={data} />;
        case "corporate":
          return <TemplateCorporate data={data} />;
        case "minimal":
          return <TemplateMinimal data={data} />;
        case "creative":
          return <TemplateCreative data={data} />;
        case "ats":
          return <TemplateATS data={data} />;
        case "modern":
        default:
          return <TemplateModern data={data} />;
      }
    };

    return (
      <div className="flex justify-center items-start w-full overflow-hidden p-2 sm:p-4">
        <div
          ref={ref}
          id="cv-printable-page"
          className="a4-page transition-all duration-200 transform-gpu overflow-hidden relative"
          style={{
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top center",
          }}
        >
          {renderTemplate()}

          {/* Filigrane Offre Gratuite Découverte (0 FCFA) */}
          {(!data.isPremium || data.planTier === "free") && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center select-none overflow-hidden z-30">
              <div className="transform -rotate-35 border-2 sm:border-4 border-slate-400/25 bg-white/50 backdrop-blur-[0.5px] text-slate-500/35 font-black text-xl sm:text-3xl uppercase tracking-widest px-6 py-2.5 sm:px-8 sm:py-3 rounded-2xl shadow-xs text-center">
                <span>MonCV.ai • Découverte</span>
                <span className="block text-[9px] sm:text-[11px] font-bold tracking-wider mt-0.5 text-slate-400/55">
                  Version Gratuite • Filigrane Découverte
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CVPreviewCanvas.displayName = "CVPreviewCanvas";
