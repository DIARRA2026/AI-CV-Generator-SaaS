"use client";

import React, { useEffect, useState } from "react";
import { ResumeData } from "@/lib/types";
import QRCode from "qrcode";
import { X, Share2, Copy, Check, Download, QrCode, ExternalLink } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  resumeData,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const url = `${origin}/c/${resumeData.slug || resumeData.id}`;
      setPublicUrl(url);

      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Erreur génération QR Code:", err));
    }
  }, [resumeData.slug, resumeData.id, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `QRCode_CV_${resumeData.personal.lastName || "MonCV"}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Partager votre CV & Portfolio
              </h3>
              <p className="text-xs text-slate-500">
                {resumeData.isPremium ? "Abonnement Pro • Portfolio Web Actif" : "Formule Gratuite • Aperçu CV A4"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Badge abonnement */}
          <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
            resumeData.isPremium
              ? "bg-purple-50 border-purple-200 text-purple-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {resumeData.isPremium
                ? "Abonné Pro : Le QR Code ouvre votre Portfolio Web"
                : "Scannez pour ouvrir votre CV A4 en ligne"}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code du CV"
                className="w-48 h-48 rounded-xl shadow-sm bg-white p-2 border border-slate-200"
              />
            ) : (
              <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-xl" />
            )}
            <p className="text-[11px] text-slate-500 mt-2.5 font-medium">
              Scannez avec un appareil photo pour ouvrir directement
            </p>
          </div>

          {/* Lien direct */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">
              Lien web permanent :
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shrink-0"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger QR Code
            </button>
            <a
              href={`/c/${resumeData.slug || resumeData.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir la page publique
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
