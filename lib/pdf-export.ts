import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ResumeData } from "./types";

/**
 * Convertit n'importe quelle URL d'image en Data URL Base64 pour garantir
 * un rendu 100% fidèle dans le PDF sans blocage CORS ni perte de qualité.
 */
async function convertImgToBase64(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Échec conversion Base64, utilisation URL directe :", err);
    return url;
  }
}

/**
 * Téléchargement direct et haute fidélité du CV en PDF
 * Utilise un conteneur A4 isolé hors-écran (794px x 1123px) à 300 DPI équivalent
 */
export async function downloadResumePDF(
  elementId: string = "cv-printable-page",
  resumeData?: ResumeData
): Promise<boolean> {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.error("Élément introuvable pour l'export PDF :", elementId);
    window.print();
    return false;
  }

  // Créer un conteneur temporaire hors-écran avec les dimensions A4 exactes
  const offscreenContainer = document.createElement("div");
  offscreenContainer.style.position = "fixed";
  offscreenContainer.style.left = "-10000px";
  offscreenContainer.style.top = "0";
  offscreenContainer.style.width = "794px"; // 210mm à 96 DPI
  offscreenContainer.style.minHeight = "1123px"; // 297mm à 96 DPI
  offscreenContainer.style.backgroundColor = "#ffffff";
  offscreenContainer.style.zIndex = "-9999";
  offscreenContainer.style.overflow = "visible";

  // Cloner le CV source
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.id = "cv-clone-for-pdf";
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.boxShadow = "none";
  clone.style.width = "794px";
  clone.style.minHeight = "1123px";
  clone.style.margin = "0";
  clone.style.padding = "0";
  clone.style.borderRadius = "0";
  (clone.style as any).webkitPrintColorAdjust = "exact";
  (clone.style as any).printColorAdjust = "exact";

  // Convertir toutes les images du clone en Base64 pour garantir leur rendu
  const images = clone.getElementsByTagName("img");
  const imgPromises: Promise<void>[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = img.src;
    if (src) {
      const p = convertImgToBase64(src).then((base64Src) => {
        img.crossOrigin = "anonymous";
        img.src = base64Src;
      });
      imgPromises.push(p);
    }
  }

  await Promise.all(imgPromises);

  offscreenContainer.appendChild(clone);
  document.body.appendChild(offscreenContainer);

  // Laisser le temps au navigateur de peindre le clone et décoder les images
  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    const canvas = await html2canvas(clone, {
      scale: 2.5, // Très haute résolution (HD / Retina)
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794,
      height: Math.max(clone.scrollHeight, 1123),
      windowWidth: 794,
      windowHeight: Math.max(clone.scrollHeight, 1123),
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById("cv-clone-for-pdf");
        if (el) {
          el.style.transform = "none";
          (el.style as any).webkitPrintColorAdjust = "exact";
          (el.style as any).printColorAdjust = "exact";
        }
      },
    });

    // Supprimer le conteneur temporaire
    document.body.removeChild(offscreenContainer);

    // Initialisation jsPDF A4
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    // Si 1 seule page (95% des CVs)
    if (imgHeight <= pageHeight + 5) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
    } else {
      // Si dépassement sur plusieurs pages
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }
    }

    // Nom du fichier soigné
    const firstName = resumeData?.personal?.firstName?.trim() || "Candidat";
    const lastName = resumeData?.personal?.lastName?.trim() || "CV";
    const filename = `CV_${lastName}_${firstName}`
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_");

    pdf.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error("Erreur capture canvas PDF :", error);
    if (document.body.contains(offscreenContainer)) {
      document.body.removeChild(offscreenContainer);
    }
    // Fallback natif
    window.print();
    return false;
  }
}
