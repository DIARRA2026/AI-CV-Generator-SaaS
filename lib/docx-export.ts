import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
} from "docx";
import { ResumeData } from "./types";
import { canDownloadWithoutWatermark } from "./license-manager";
import { translations, SupportedLanguage } from "./i18n";

/**
 * Nettoie une chaîne de couleur hexadécimale (supprime le #)
 */
function cleanHexColor(hex?: string, fallback: string = "2563EB"): string {
  if (!hex) return fallback;
  const cleaned = hex.replace("#", "").trim();
  return cleaned.length === 6 ? cleaned : fallback;
}

type DocxImageType = "jpg" | "png" | "gif" | "bmp";

interface PhotoImageData {
  data: Uint8Array;
  type: DocxImageType;
}

/**
 * Récupère les octets binaires et le type d'une image (Data URL base64 ou URL HTTP)
 */
async function getPhotoImageData(url?: string): Promise<PhotoImageData | null> {
  try {
    if (!url || typeof url !== "string") return null;

    let imgType: DocxImageType = "png";

    // 1. Data URL Base64
    if (url.startsWith("data:")) {
      if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg")) {
        imgType = "jpg";
      } else if (url.startsWith("data:image/gif")) {
        imgType = "gif";
      } else if (url.startsWith("data:image/bmp")) {
        imgType = "bmp";
      } else {
        imgType = "png";
      }

      const commaIdx = url.indexOf(",");
      if (commaIdx !== -1) {
        const base64Data = url.substring(commaIdx + 1);
        if (typeof window !== "undefined" && typeof atob === "function") {
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return { data: bytes, type: imgType };
        } else if (typeof Buffer !== "undefined") {
          return { data: new Uint8Array(Buffer.from(base64Data, "base64")), type: imgType };
        }
      }
    }

    // 2. URL HTTP / Relative
    if (url.toLowerCase().includes(".jpg") || url.toLowerCase().includes(".jpeg")) {
      imgType = "jpg";
    }

    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return { data: new Uint8Array(arrayBuffer), type: imgType };
  } catch (err) {
    console.warn("Impossible de charger la photo pour l'export Word :", err);
    return null;
  }
}

/**
 * Crée un titre de section avec une barre de soulignement colorée élégante
 */
function createSectionTitle(title: string, primaryColor: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: {
      bottom: {
        color: primaryColor,
        size: 14,
        space: 6,
        style: BorderStyle.SINGLE,
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
}

/**
 * Génère et déclenche le téléchargement immédiat du CV au format Microsoft Word (.docx)
 * Design fidèle au CV PDF : En-tête exécutif, photo intégrée, coordonnées en texte fluide (sans tableau),
 * rubriques colorées, puces hiérarchiques et marges de 1,5 cm.
 */
export async function downloadResumeDocx(resumeData: ResumeData, lang?: SupportedLanguage): Promise<boolean> {
  try {
    let currentLang: SupportedLanguage = lang || "fr";
    if (!lang && typeof window !== "undefined") {
      const saved = localStorage.getItem("moncv_locale") as SupportedLanguage;
      if (saved && (saved === "fr" || saved === "en" || saved === "es" || saved === "ar")) {
        currentLang = saved;
      }
    }
    const dict = translations[currentLang] || translations.fr;

    const { personal, summary, experiences, educations, skills, languages, sections, design } = resumeData;
    const primaryColor = cleanHexColor(design.primaryColor, "2563EB");
    const marginTwip = convertMillimetersToTwip(15); // Strictement 1,5 cm de marges (A4)

    const children: Paragraph[] = [];

    // 1. Photo de profil (si activée et fournie)
    if (design.showPhoto && personal.photoUrl) {
      const photoInfo = await getPhotoImageData(personal.photoUrl);
      if (photoInfo && photoInfo.data && photoInfo.data.length > 0) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 140 },
            children: [
              new ImageRun({
                data: photoInfo.data,
                transformation: {
                  width: 105,
                  height: 105,
                },
                type: photoInfo.type,
              }),
            ],
          })
        );
      }
    }

    // 2. Nom et Prénom en Grand Format Majuscules
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({
            text: `${personal.firstName || ""} `.toUpperCase(),
            bold: true,
            size: 46, // 23pt
            color: "111827",
            font: "Calibri",
          }),
          new TextRun({
            text: `${personal.lastName || ""}`.toUpperCase(),
            bold: true,
            size: 46, // 23pt
            color: primaryColor,
            font: "Calibri",
          }),
        ],
      })
    );

    // Titre du poste visé / Profession
    if (personal.title) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 140 },
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

    // 3. Coordonnées & Infos Personnelles en Paragraphes Fluides (AUCUN TABLEAU !)
    const contactLine1: string[] = [];
    if (personal.email) contactLine1.push(`${dict.cv.email} : ${personal.email}`);
    if (personal.phone) contactLine1.push(`${dict.cv.phone} : ${personal.phone}`);
    if (personal.city || personal.country) {
      contactLine1.push(`${dict.cv.address} : ${[personal.city, personal.country].filter(Boolean).join(", ")}`);
    }

    if (contactLine1.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 40 },
          children: contactLine1.map((item, idx) => [
            ...(idx > 0
              ? [
                  new TextRun({
                    text: "   •   ",
                    color: primaryColor,
                    bold: true,
                    size: 20,
                    font: "Calibri",
                  }),
                ]
              : []),
            new TextRun({
              text: item,
              size: 20, // 10pt
              color: "374151",
              font: "Calibri",
            }),
          ]).flat(),
        })
      );
    }

    const contactLine2: string[] = [];
    if (personal.birthDate || personal.birthPlace) {
      contactLine2.push(
        `${dict.cv.bornOn} : ${[
          personal.birthDate ? `${personal.birthDate}` : "",
          personal.birthPlace ? `${dict.cv.bornAt} ${personal.birthPlace}` : "",
        ]
          .filter(Boolean)
          .join(" ")}`
      );
    }
    if (personal.maritalStatus) contactLine2.push(`${dict.cv.maritalStatus} : ${personal.maritalStatus}`);
    if (personal.driverLicense) contactLine2.push(`${dict.cv.driverLicense} : ${personal.driverLicense}`);

    if (contactLine2.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 40 },
          children: contactLine2.map((item, idx) => [
            ...(idx > 0
              ? [
                  new TextRun({
                    text: "   •   ",
                    color: primaryColor,
                    bold: true,
                    size: 20,
                    font: "Calibri",
                  }),
                ]
              : []),
            new TextRun({
              text: item,
              size: 20,
              color: "374151",
              font: "Calibri",
            }),
          ]).flat(),
        })
      );
    }

    const contactLine3: string[] = [];
    if (personal.linkedin) contactLine3.push(`LinkedIn : ${personal.linkedin}`);
    if (personal.website) contactLine3.push(`${dict.cv.website} : ${personal.website}`);

    if (contactLine3.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 40 },
          children: contactLine3.map((item, idx) => [
            ...(idx > 0
              ? [
                  new TextRun({
                    text: "   •   ",
                    color: primaryColor,
                    bold: true,
                    size: 20,
                    font: "Calibri",
                  }),
                ]
              : []),
            new TextRun({
              text: item,
              size: 20,
              color: "374151",
              font: "Calibri",
            }),
          ]).flat(),
        })
      );
    }

    // Trait fin de séparation de l'en-tête
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 160 },
        border: {
          bottom: {
            color: "E5E7EB",
            size: 8,
            space: 4,
            style: BorderStyle.SINGLE,
          },
        },
      })
    );

    // 4. Profil Professionnel
    if (summary && summary.trim().length > 0) {
      children.push(createSectionTitle(dict.cv.profile, primaryColor));
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 160 },
          alignment: AlignmentType.JUSTIFIED,
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

    // 5. Expériences Professionnelles
    if (experiences && experiences.length > 0) {
      children.push(createSectionTitle(dict.cv.experience, primaryColor));

      experiences.forEach((exp, idx) => {
        // Intitulé du poste et dates
        children.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 40 : 120, after: 30 },
            children: [
              new TextRun({
                text: exp.role.toUpperCase(),
                bold: true,
                size: 22, // 11pt
                color: "111827",
                font: "Calibri",
              }),
              new TextRun({
                text: `   [${exp.startDate} — ${exp.current ? dict.cv.present : exp.endDate}]`,
                bold: true,
                size: 20,
                color: "6B7280",
                font: "Calibri",
              }),
            ],
          })
        );

        // Entreprise et Lieu en couleur primaire
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: `${exp.company.toUpperCase()}${exp.city ? ` — ${exp.city.toUpperCase()}` : ""}`,
                bold: true,
                size: 20, // 10pt
                color: primaryColor,
                font: "Calibri",
              }),
            ],
          })
        );

        // Réalisations sous forme de puces natives Word
        if (exp.highlights && exp.highlights.length > 0) {
          exp.highlights.forEach((h) => {
            if (h && h.trim().length > 0) {
              children.push(
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 20, after: 30 },
                  children: [
                    new TextRun({
                      text: h.trim(),
                      size: 20,
                      color: "374151",
                      font: "Calibri",
                    }),
                  ],
                })
              );
            }
          });
        }
      });
    }

    // 6. Formation & Diplômes
    if (educations && educations.length > 0) {
      children.push(createSectionTitle(dict.cv.education, primaryColor));

      educations.forEach((edu, idx) => {
        children.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 40 : 100, after: 20 },
            children: [
              new TextRun({
                text: edu.degree.toUpperCase(),
                bold: true,
                size: 22, // 11pt
                color: "111827",
                font: "Calibri",
              }),
              new TextRun({
                text: edu.year ? `   [${edu.year}]` : "",
                bold: true,
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
                text: `${edu.school}${edu.field ? ` — ${edu.field}` : ""}`,
                bold: true,
                size: 20,
                color: primaryColor,
                font: "Calibri",
              }),
            ],
          })
        );
      });
    }

    // 7. Certifications & Réalisations
    if (sections?.certifications && sections.certifications.length > 0) {
      children.push(createSectionTitle(dict.cv.certifications, primaryColor));

      sections.certifications.forEach((cert, idx) => {
        children.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 40 : 80, after: 20 },
            children: [
              new TextRun({
                text: (cert.title || "").toUpperCase(),
                bold: true,
                size: 21,
                color: "111827",
                font: "Calibri",
              }),
              new TextRun({
                text: cert.year ? `   [${cert.year}]` : "",
                bold: true,
                size: 19,
                color: "6B7280",
                font: "Calibri",
              }),
            ],
          })
        );

        if (cert.issuer) {
          children.push(
            new Paragraph({
              spacing: { before: 0, after: 50 },
              children: [
                new TextRun({
                  text: cert.issuer,
                  size: 19,
                  color: primaryColor,
                  font: "Calibri",
                }),
              ],
            })
          );
        }
      });
    }

    // 8. Compétences
    if (skills && skills.length > 0) {
      children.push(createSectionTitle(dict.cv.skills, primaryColor));

      skills.forEach((cat) => {
        children.push(
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: `• ${cat.category.toUpperCase()} : `,
                bold: true,
                size: 20,
                color: primaryColor,
                font: "Calibri",
              }),
              new TextRun({
                text: cat.items.join("  •  "),
                size: 20,
                color: "374151",
                font: "Calibri",
              }),
            ],
          })
        );
      });
    }

    // 9. Langues
    if (languages && languages.length > 0) {
      children.push(createSectionTitle(dict.cv.languages, primaryColor));

      children.push(
        new Paragraph({
          spacing: { before: 40, after: 80 },
          children: languages.map((lang, idx) => [
            ...(idx > 0
              ? [
                  new TextRun({
                    text: "     |     ",
                    color: "9CA3AF",
                    bold: true,
                    size: 20,
                    font: "Calibri",
                  }),
                ]
              : []),
            new TextRun({
              text: `${lang.name} : `,
              bold: true,
              size: 20,
              color: "111827",
              font: "Calibri",
            }),
            new TextRun({
              text: lang.level,
              bold: true,
              size: 20,
              color: primaryColor,
              font: "Calibri",
            }),
          ]).flat(),
        })
      );
    }

    // 10. Centres d'intérêt
    if (sections?.interests && sections.interests.length > 0) {
      children.push(createSectionTitle(dict.cv.interests, primaryColor));

      children.push(
        new Paragraph({
          spacing: { before: 40, after: 80 },
          children: [
            new TextRun({
              text: sections.interests.map((i) => `• ${i}`).join("     "),
              bold: true,
              size: 20,
              color: "374151",
              font: "Calibri",
            }),
          ],
        })
      );
    }

    // Mention de découverte si le profil n'est pas encore débloqué
    if (!canDownloadWithoutWatermark(resumeData)) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 0 },
          children: [
            new TextRun({
              text: `${dict.cv.watermarkTitle} • ${dict.cv.watermarkDesc}`,
              italics: true,
              size: 16,
              color: "9CA3AF",
              font: "Calibri",
            }),
          ],
        })
      );
    }

    // Création du document Word A4 avec 1,5 cm de marges
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

    // Génération et téléchargement immédiat
    const blob = await Packer.toBlob(doc);
    const fileName = `CV_${(personal.firstName || "Candidat").trim()}_${(personal.lastName || "CV").trim()}.docx`
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error("Erreur génération document Word (.docx) :", error);
    return false;
  }
}

export const exportResumeToDocx = downloadResumeDocx;
