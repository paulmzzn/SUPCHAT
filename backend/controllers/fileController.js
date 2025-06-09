import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getS3Config } from "../config/secrets.js";
import path from "path";
import { Readable } from "stream";
import dotenv from "dotenv";
dotenv.config();

const s3Config = getS3Config();
const s3Client = new S3Client({
  region: s3Config.region,
  endpoint: s3Config.endpoint,
  credentials: {
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
  },
  forcePathStyle: true,
});
const BUCKET_NAME = s3Config.bucketName;

// Fonction pour récupérer un fichier depuis S3 et le servir au client
export const getFileFromS3 = async (req, res) => {
  try {
    const fileKey = req.params.fileKey;

    if (!fileKey) {
      return res.status(400).send("Clé de fichier non fournie");
    }

    console.log(
      `Récupération du fichier: ${fileKey} depuis le bucket ${BUCKET_NAME}`
    );

    // Créer la commande pour récupérer l'objet depuis S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    // Récupérer l'objet depuis S3
    const { Body, ContentType } = await s3Client.send(command);

    if (!Body) {
      return res.status(404).send("Fichier non trouvé");
    }

    // Extraire le nom du fichier de la clé
    const fileName = path.basename(fileKey);

    // Définir les en-têtes pour le téléchargement
    res.setHeader("Content-Type", ContentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    // Convertir le corps de la réponse en stream lisible et l'envoyer au client
    const readableStream =
      Body instanceof Readable ? Body : Readable.from(Body);
    readableStream.pipe(res);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du fichier depuis S3:",
      error
    );
    res.status(500).send("Erreur lors de la récupération du fichier");
  }
};

// Fonction pour servir les images S3 via un proxy (résout les problèmes de CORS)
export const proxyS3Image = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL non fournie" });
    }

    console.log(`[fileController] Proxy pour l'image S3: ${url}`);

    // Vérifier que l'URL est bien une URL S3 autorisée
    if (!url.includes("s3.fr-par.scw.cloud") && !url.includes("s3-supchat")) {
      return res.status(403).json({ error: "URL non autorisée" });
    }

    // Extraire la clé du fichier depuis l'URL S3
    let fileKey;
    if (url.includes("s3-supchat.s3.fr-par.scw.cloud/")) {
      fileKey = url.split("s3-supchat.s3.fr-par.scw.cloud/")[1];
    } else if (url.includes("s3.fr-par.scw.cloud/s3-supchat/")) {
      fileKey = url.split("s3.fr-par.scw.cloud/s3-supchat/")[1];
    } else {
      return res.status(400).json({ error: "Format d'URL S3 non reconnu" });
    }

    console.log(`[fileController] Clé extraite: ${fileKey}`);

    // Créer la commande pour récupérer l'objet depuis S3
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || "s3-supchat",
      Key: fileKey,
    });

    // Récupérer l'objet depuis S3
    const { Body, ContentType, ContentLength } = await s3Client.send(command);

    if (!Body) {
      return res.status(404).json({ error: "Fichier non trouvé" });
    }

    // Définir les en-têtes pour l'affichage d'image
    res.setHeader("Content-Type", ContentType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache 1 heure
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (ContentLength) {
      res.setHeader("Content-Length", ContentLength);
    }

    // Convertir le corps de la réponse en stream lisible et l'envoyer au client
    const readableStream =
      Body instanceof Readable ? Body : Readable.from(Body);
    readableStream.pipe(res);

    console.log(
      `[fileController] ✅ Image proxy servie avec succès: ${fileKey}`
    );
  } catch (error) {
    console.error(
      "[fileController] ❌ Erreur lors du proxy de l'image S3:",
      error
    );
    res.status(500).json({
      error: "Erreur lors de la récupération de l'image",
      details: error.message,
    });
  }
};
