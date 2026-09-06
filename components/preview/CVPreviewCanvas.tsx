"use client";

import React, { forwardRef } from "react";
import { ResumeData } from "@/lib/types";
import { TemplateModern } from "./templates/TemplateModern";
import { TemplateElegant } from "./templates/TemplateElegant";
import { TemplateCorporate } from "./templates/TemplateCorporate";
import { TemplateMinimal } from "./templates/TemplateMinimal";
import { TemplateCreative } from "./templates/TemplateCreative";
import { TemplateATS } from "./templates/TemplateATS";
import { canDownloadWithoutWatermark } from "@/lib/license-manager";

interface CVPreviewCanvasProps {
  data: ResumeData;
  scale?: number;
}

// Dimensions physiques A4 standardisées à 96 DPI (résolution web standard) :
// 210 mm = 793.7007874... px (~794px)
// 297 mm = 1122.519685... px (~1123px)
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

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

    // Calcul de l'encombrement proportionnel exact pour centrage parfait sans débordement
    const scaledWidth = Math.round(A4_WIDTH_PX * scale);
    const scaledHeight = Math.round(A4_HEIGHT_PX * scale);

    return (
      <div className="flex justify-center items-start w-full p-1 select-none print:p-0 print:m-0 print:block">
        {/* Conteneur dimensionnel calibré à l'échelle pour empêcher tout écrasement ou déformation */}
        <div
          className="relative shrink-0 transition-all duration-150 print:w-[210mm] print:h-[297mm] print:static print:transform-none"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
          }}
        >
          {/* Page A4 réelle : dimensions invariables 210mm x 297mm (794px x 1123px), zoomée par GPU */}
          <div
            ref={ref}
            id="cv-printable-page"
            className="a4-page overflow-hidden print:shadow-none print:m-0"
            style={{
              width: "210mm",
              minWidth: "210mm",
              maxWidth: "210mm",
              height: "297mm",
              minHeight: "297mm",
              maxHeight: "297mm",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
              flexShrink: 0,
            }}
          >
            {renderTemplate()}

            {/* Filigrane Offre Gratuite Découverte (0 FCFA) */}
            {!canDownloadWithoutWatermark(data) && (
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
      </div>
    );
  }
);

CVPreviewCanvas.displayName = "CVPreviewCanvas";
