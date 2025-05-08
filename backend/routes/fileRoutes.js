import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getObjectFromS3 } from "../config/s3Service.js"; // Import de la fonction pour récupérer des fichiers de S3
import { verifyToken } from "../middleware/authMiddleware.js"; // Import du middleware d'authentification

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Nouvelle route pour télécharger des fichiers depuis S3
router.get("/download/:filePath(*)", verifyToken, async (req, res) => {
  try {
    // Récupérer le chemin du fichier depuis les paramètres
    const filePath = req.params.filePath;
    console.log(`[FileRoutes] Téléchargement de fichier S3: ${filePath}`);

    // Obtenir le fichier depuis S3
    const fileData = await getObjectFromS3(filePath);

    // Extraire le nom du fichier depuis le chemin
    const fileName = path.basename(filePath);

    // Définir l'en-tête Content-Disposition pour forcer le téléchargement
    res.set({
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": fileData.ContentType || "application/octet-stream",
    });

    // Envoyer le fichier au client
    return res.send(fileData.Body);
  } catch (error) {
    console.error(
      `[FileRoutes] Erreur lors du téléchargement du fichier:`,
      error
    );
    return res.status(404).send("Fichier non trouvé ou inaccessible");
  }
});

// Route pour servir les fichiers sans authentification
router.get("/:folder/:subfolder/:filename", (req, res) => {
  const { folder, subfolder, filename } = req.params;
  const filePath = path.join(
    __dirname,
    "../uploads",
    folder,
    subfolder,
    filename
  );

  console.log(`[FileRoutes] Accès au fichier: ${filePath}`);

  // Vérifier si le fichier existe
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    console.error(`[FileRoutes] Fichier non trouvé: ${filePath}`);
    return res.status(404).send("Fichier non trouvé");
  }
});

// Route générique pour tous les autres types de fichiers
router.get("/*", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.path);

  console.log(`[FileRoutes] Accès au fichier générique: ${filePath}`);

  // Vérifier si le fichier existe
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    console.error(`[FileRoutes] Fichier non trouvé: ${filePath}`);
    return res.status(404).send("Fichier non trouvé");
  }
});

export default router;
