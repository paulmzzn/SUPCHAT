import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

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
