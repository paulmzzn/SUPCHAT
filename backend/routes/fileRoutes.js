import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getObjectFromS3 } from "../config/s3Service.js"; // Suppression de l'import s3
import AWS from "aws-sdk";
import dotenv from "dotenv";
import { verifyToken } from "../middleware/authMiddleware.js";

// Charger les variables d'environnement
dotenv.config();

// Configurer S3 directement dans ce fichier
const s3Config = {
  region: process.env.SCW_REGION || "fr-par",
  endpoint: process.env.SCW_ENDPOINT || "https://s3.fr-par.scw.cloud/",
  credentials: {
    accessKeyId: process.env.SCW_ACCESS_KEY_ID || "REDACTED",
    secretAccessKey:
      process.env.SCW_SECRET_ACCESS_KEY ||
      "REDACTED",
  },
  s3ForcePathStyle: true, // Requis pour la compatibilité avec Scaleway S3
};

// Créer l'instance S3
const s3 = new AWS.S3(s3Config);

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

// Route pour récupérer le contenu d'un fichier via le backend (proxy pour contourner CORS)
router.get("/content/:path(*)", verifyToken, async (req, res) => {
  try {
    const filePath = req.params.path;
    console.log(`[FileRoutes] Demande de contenu du fichier: ${filePath}`);

    // Vérifier que le fichier existe dans S3
    const params = {
      Bucket: process.env.S3_BUCKET_NAME || "supchat-bucket",
      Key: filePath,
    };

    try {
      // Vérification de l'existence du fichier
      await s3.headObject(params).promise();

      // Récupération du contenu
      const fileStream = s3.getObject(params).createReadStream();

      // Déterminer le type de contenu en fonction de l'extension
      const extension = filePath.split(".").pop().toLowerCase();
      let contentType = "application/octet-stream"; // par défaut

      if (extension === "csv") {
        contentType = "text/csv";
      } else if (extension === "json") {
        contentType = "application/json";
      } else if (extension === "txt") {
        contentType = "text/plain";
      } else if (extension === "tsv") {
        contentType = "text/tab-separated-values";
      }

      res.setHeader("Content-Type", contentType);
      fileStream.pipe(res);
    } catch (err) {
      if (err.code === "NotFound") {
        return res.status(404).json({ message: "Fichier non trouvé" });
      }
      throw err;
    }
  } catch (err) {
    console.error(
      "[FileRoutes] Erreur lors de la récupération du contenu du fichier:",
      err
    );
    res
      .status(500)
      .json({
        message: "Erreur lors de la récupération du contenu du fichier",
        error: err.message,
      });
  }
});

export default router;
