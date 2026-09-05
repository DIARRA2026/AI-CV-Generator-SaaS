import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  convertMillimetersToTwip,
} from "docx";
import { ResumeData } from "./types";

/**
 * Nettoie une chaîne de couleur hexadécimale (supprime le #)
 */
function cleanHexColor(hex: string, fallback: string = "2563EB"): string {
  if (!hex) return fallback;
  const cleaned = hex.replace("#", "").trim();
  return cleaned.length === 6 ? cleaned : fallback;
}

/**
 * Génère et déclenche le téléchargement immédiat du CV au format Microsoft Word (.docx)
 */
export async function downloadResumeDocx(resumeData: ResumeData): Promise<boolean> {
  try {
    const { personal, summary, experiences, educations, skills, languages, sections, design } = resumeData;
    const primaryColor = cleanHexColor(design.primaryColor, "2563EB");
    const marginTwip = convertMillimetersToTwip(15); // Strictement 1,5 cm de marges

    const children: (Paragraph | Table)[] = [];

    // 1. En-tête : Nom et Prénom
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: `${personal.firstName || ""} `.toUpperCase(),
            bold: true,
            size: 44, // 22pt
            color: "111827",
            font: "Calibri",
          }),
          new TextRun({
            text: `${personal.lastName || ""}`.toUpperCase(),
            bold: true,
            size: 44, // 22pt
            color: primaryColor,
            font: "Calibri",
          }),
        ],
      })
    );

    // Titre du poste visé
    if (personal.title) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 180 },
          children: [
            new TextRun({
              text: personal.title.toUpperCase(),
              bold: true,
              size: 26, // 13pt
              color: primaryColor,
              font: "Calibri",
            }),
          ],
        })
      );
    }

    // 2. Coordonnées & Infos Personnelles (Tableau structuré 2 colonnes sans bordures)
    const contactItems: string[] = [];
    if (personal.email) contactItems.push(`Email : ${personal.email}`);
    if (personal.phone) contactItems.push(`Tél : ${personal.phone}`);
    if (personal.city || personal.country) {
      contactItems.push(`Ville : ${[personal.city, personal.country].filter(Boolean).join(", ")}`);
    }
    if (personal.birthDate || personal.birthPlace) {
      contactItems.push(
        `Naissance : ${[
          personal.birthDate ? `${personal.birthDate}` : "",
          personal.birthPlace ? `à ${personal.birthPlace}` : "",
        ]
          .filter(Boolean)
          .join(" ")}`
      );
    }
    if (personal.maritalStatus) contactItems.push(`État civil : ${personal.maritalStatus}`);
    if (personal.driverLicense) contactItems.push(`Permis : ${personal.driverLicense}`);
    if (personal.linkedin) contactItems.push(`LinkedIn : ${personal.linkedin}`);
    if (personal.website) contactItems.push(`Web : ${personal.website}`);

    if (contactItems.length > 0) {
      const rows: TableRow[] = [];
      for (let i = 0; i < contactItems.length; i += 2) {
        const item1 = contactItems[i];
        const item2 = contactItems[i + 1] || "";
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({
                        text: `• ${item1}`,
                        size: 20, // 10pt
                        color: "374151",
                        font: "Calibri",
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [
                      new TextRun({
                        text: item2 ? `• ${item2}` : "",
                        size: 20,
                        color: "374151",
                        font: "Calibri",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
      }

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        })
      );
    }

    // Fonction helper pour créer les titres de sections Word
    const createSectionHeader = (title: string): Paragraph => {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 100 },
        border: {
          bottom: {
            color: primaryColor,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 24, // 12pt
            color: primaryColor,
            font: "Calibri",
          }),
        ],
      });
    };

    // 3. Profil Professionnel / Résumé
    if (summary && summary.trim().length > 0) {
      children.push(createSectionHeader("Profil Professionnel"));
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 120 },
          children: [
            new TextRun({
              text: summary.trim(),
              size: 21, // 10.5pt
              color: "374151",
              font: "Calibri",
            }),
          ],
        })
      );
    }

    // 4. Expériences Professionnelles
    if (experiences && experiences.length > 0) {
      children.push(createSectionHeader("Expériences Professionnelles"));

      experiences.forEach((exp) => {
        // Ligne Titre de poste et dates
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 30 },
            children: [
              new TextRun({
                text: exp.role || "Poste",
                bold: true,
                size: 22, // 11pt
                color: "111827",
                font: "Calibri",
              }),
              new TextRun({
                text: `  |  ${exp.startDate || ""} – ${exp.current ? "Présent" : exp.endDate || ""}`,
                size: 20,
                color: "6B7280",
                font: "Calibri",
              }),
            ],
          })
        );

        // Ligne Entreprise et Ville
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: `${exp.company || ""}${exp.city ? ` — ${exp.city}` : ""}`,
                italics: true,
                bold: true,
                size: 20,
                color: primaryColor,
                font: "Calibri",
              }),
            ],
          })
        );

        // Missions / Réalisations
        if (exp.highlights && exp.highlights.length > 0) {
          exp.highlights.forEach((h) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: h,
                    size: 20,
                    color: "374151",
                    font: "Calibri",
                  }),
                ],
              })
            );
          });
        }
      });
    }

    // 5. Formation & Diplômes
    if (educations && educations.length > 0) {
      children.push(createSectionHeader("Formation & Diplômes"));

      educations.forEach((edu) => {
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 20 },
            children: [
              new TextRun({
                text: `${edu.degree || ""}${edu.field ? ` en ${edu.field}` : ""}`,
                bold: true,
                size: 22,
                color: "111827",
                font: "Calibri",
              }),
              new TextRun({
                text: edu.year ? `  |  ${edu.year}` : "",
                size: 20,
                color: "6B7280",
                font: "Calibri",
              }),
            ],
          })
        );

        children.push(
          new Paragraph({
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: `${edu.school || ""}${edu.city ? ` (${edu.city})` : ""}`,
                italics: true,
                size: 20,
                color: "4B5563",
                font: "Calibri",
              }),
            ],
          })
        );
      });
    }

    // 6. Compétences
    if (skills && skills.length > 0) {
      children.push(createSectionHeader("Compétences"));

      skills.forEach((cat) => {
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 40 },
            children: [
              new TextRun({
                text: `${cat.category} : `,
                bold: true,
                size: 20,
                color: "111827",
                font: "Calibri",
              }),
              new TextRun({
                text: (cat.items || []).join(", "),
                size: 20,
                color: "374151",
                font: "Calibri",
              }),
            ],
          })
        );
      });
    }

    // 7. Langues
    if (languages && languages.length > 0) {
      children.push(createSectionHeader("Langues"));

      languages.forEach((lang) => {
        children.push(
          new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [
              new TextRun({
                text: `• ${lang.name} : `,
                bold: true,
                size: 20,
                color: "111827",
                font: "Calibri",
              }),
              new TextRun({
                text: `${lang.level}`,
                size: 20,
                color: primaryColor,
                font: "Calibri",
              }),
            ],
          })
        );
      });
    }

    // 8. Certifications & Projets
    if (sections?.certifications && sections.certifications.length > 0) {
      children.push(createSectionHeader("Certifications"));
      sections.certifications.forEach((cert) => {
        children.push(
          new Paragraph({
            spacing: { before: 40, after: 20 },
            children: [
              new TextRun({
                text: `• ${cert.title}`,
                bold: true,
                size: 20,
                color: "111827",
                font: "Calibri",
              }),
              new TextRun({
                text: ` — ${cert.issuer || ""} (${cert.year || ""})`,
                size: 20,
                color: "6B7280",
                font: "Calibri",
              }),
            ],
          })
        );
      });
    }

    // 9. Centres d'intérêt
    if (sections?.interests && sections.interests.length > 0) {
      children.push(createSectionHeader("Centres d'intérêt"));
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 80 },
          children: [
            new TextRun({
              text: sections.interests.join("  •  "),
              size: 20,
              color: "374151",
              font: "Calibri",
            }),
          ],
        })
      );
    }

    // 10. Bas de document discret
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 0 },
        children: [
          new TextRun({
            text: "Document certifié conforme • Généré sur MonCV.ai",
            italics: true,
            size: 18,
            color: "9CA3AF",
            font: "Calibri",
          }),
        ],
      })
    );

    // Création du document Word conforme A4 avec marges de 1,5 cm
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: marginTwip,
                bottom: marginTwip,
                left: marginTwip,
                right: marginTwip,
              },
            },
          },
          children,
        },
      ],
    });

    // Génération du fichier binaire .docx
    const blob = await Packer.toBlob(doc);

    // Déclenchement du téléchargement navigateur
    const firstName = personal?.firstName?.trim() || "Candidat";
    const lastName = personal?.lastName?.trim() || "CV";
    const filename = `CV_${lastName}_${firstName}`
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error("Erreur lors de l'export Word (.docx) :", err);
    return false;
  }
}
