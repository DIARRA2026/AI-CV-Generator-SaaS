import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertMillimetersToTwip,
} from "docx";

interface LetterExportOptions {
  letterContent: string;
  filename: string;
  font?: string;
  title?: string;
}

/**
 * Nettoie et sécurise un nom de fichier pour le téléchargement
 */
function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents pour compatibilité Word
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Construit et télécharge un document Word (.docx) natif et professionnel
 * entièrement conforme aux spécifications Microsoft OpenXML.
 */
export async function downloadLetterAsDocx({
  letterContent,
  filename,
  font = "Calibri",
  title = "Lettre de Candidature",
}: LetterExportOptions): Promise<boolean> {
  try {
    if (!letterContent || !letterContent.trim()) {
      console.warn("Contenu de lettre vide pour l'export Word.");
      return false;
    }

    const rawLines = letterContent.split(/\r?\n/);
    const children: Paragraph[] = [];

    // Détection des différentes sections de la lettre
    const totalLines = rawLines.length;

    for (let idx = 0; idx < totalLines; idx++) {
      const rawLine = rawLines[idx];
      const trimmed = rawLine.trim();

      // Ligne vide -> Espacement vertical modéré
      if (!trimmed) {
        // N'ajoute pas trop de lignes vides consécutives
        if (children.length > 0 && children[children.length - 1]) {
          children.push(
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [new TextRun({ text: "", font, size: 22 })],
            })
          );
        }
        continue;
      }

      // 1. Détection de la Date et Lieu (ex: "Fait à Abidjan, le 6 septembre 2026" ou ligne indentée)
      const isDate =
        /^(fait\s+à|à\s+.*,\s*le\s+|le\s+\d{1,2}\s+[a-zéû]+\s+\d{4})/i.test(trimmed) ||
        (rawLine.startsWith("        ") && trimmed.toLowerCase().includes("le "));

      // 2. Détection de l'Objet (ex: "Objet : Candidature au poste...")
      const isObjet = /^objet\s*:/i.test(trimmed);

      // 3. Détection de la Civilité d'en-tête (ex: "Madame, Monsieur," ou "Monsieur le Directeur Général,")
      const isSalutation =
        /^(madame|monsieur|madame,\s*monsieur|chers|chère|à\s+l'attention)/i.test(trimmed) &&
        !trimmed.toLowerCase().includes("salutations") &&
        !trimmed.toLowerCase().includes("agréer");

      // 4. Détection du bloc Destinataire ("À l'attention de...")
      const isRecipientIntro = /^à\s+l'attention/i.test(trimmed);

      // 5. Détection de la Signature (Nom de fin de lettre)
      const isSignature =
        idx >= totalLines - 3 &&
        trimmed.length < 55 &&
        !trimmed.endsWith(".") &&
        !trimmed.endsWith(":") &&
        !isObjet &&
        !isSalutation;

      if (isObjet) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 240, after: 200 },
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 23, // ~11.5pt
                font,
                color: "0F172A",
              }),
            ],
          })
        );
      } else if (isDate) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 160, after: 180 },
            children: [
              new TextRun({
                text: trimmed,
                italics: true,
                size: 21, // ~10.5pt
                font,
                color: "475569",
              }),
            ],
          })
        );
      } else if (isRecipientIntro) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 180, after: 60 },
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 22,
                font,
                color: "1E293B",
              }),
            ],
          })
        );
      } else if (isSalutation) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 180, after: 140 },
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 22,
                font,
                color: "0F172A",
              }),
            ],
          })
        );
      } else if (isSignature) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 320, after: 120 },
            children: [
              new TextRun({
                text: trimmed,
                bold: true,
                size: 23,
                font,
                color: "0F172A",
              }),
            ],
          })
        );
      } else {
        // Paragraphe standard du corps de la lettre
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              line: 276, // 1.15 line height
              after: 140, // 7pt après
            },
            children: [
              new TextRun({
                text: trimmed,
                size: 22, // 11pt
                font,
                color: "1E293B",
              }),
            ],
          })
        );
      }
    }

    const doc = new Document({
      title,
      description: "Document généré par MonCV.ai",
      sections: [
        {
          properties: {
            page: {
              size: {
                width: convertMillimetersToTwip(210), // A4 Largeur 210mm
                height: convertMillimetersToTwip(297), // A4 Hauteur 297mm
              },
              margin: {
                top: convertMillimetersToTwip(25), // 2.5cm
                bottom: convertMillimetersToTwip(25), // 2.5cm
                left: convertMillimetersToTwip(25), // 2.5cm
                right: convertMillimetersToTwip(25), // 2.5cm
              },
            },
          },
          children,
        },
      ],
    });

    // Génération du blob binaire OpenXML standard
    const blob = await Packer.toBlob(doc);

    // Déclenchement du téléchargement côté client
    const safeName = sanitizeFilename(filename) || "Document_Word";
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${safeName}.docx`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);

    return true;
  } catch (err) {
    console.error("Erreur lors de la génération du document Word (.docx) :", err);
    return false;
  }
}

/**
 * Télécharge une Lettre de Motivation IA en vrai Word (.docx)
 */
export async function downloadCoverLetterDocx(
  letterContent: string,
  candidateLastName: string = "Candidat"
): Promise<boolean> {
  const filename = `Lettre_Motivation_${candidateLastName}`;
  return downloadLetterAsDocx({
    letterContent,
    filename,
    font: "Calibri",
    title: "Lettre de Motivation",
  });
}

/**
 * Télécharge une Demande d'Emploi Manuscrite / Officielle en vrai Word (.docx)
 */
export async function downloadJobApplicationDocx(
  letterContent: string,
  company: string = "Entreprise",
  jobTitle: string = "Poste"
): Promise<boolean> {
  const filename = `Demande_Emploi_${company}_${jobTitle}`;
  return downloadLetterAsDocx({
    letterContent,
    filename,
    font: "Times New Roman",
    title: "Demande d'Emploi Officielle",
  });
}
