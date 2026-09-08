/**
 * Utilitaire de compression et redimensionnement d'images côté client
 * Idéal pour les logos d'entreprise et photos de profil sans saturer le localStorage.
 */
export async function compressImage(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.85
): Promise<string> {
  // Pour les fichiers SVG, préserver le format vectoriel
  if (file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Si le fichier source est un PNG avec transparence, conserver PNG
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(mimeType, quality));
      };

      img.onerror = () => reject(new Error("Format d'image non valide"));
    };

    reader.onerror = (e) => reject(e);
  });
}
