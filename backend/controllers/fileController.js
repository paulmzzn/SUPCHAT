import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import dotenv from "dotenv";
import path from "path";
import pool from "../config/dbConnection.js";

// Charger les variables d'environnement
dotenv.config();

// Configuration du client S3
const s3Client = new S3Client({
  region: process.env.SCW_REGION || "fr-par",
  endpoint: process.env.SCW_ENDPOINT || "https://s3.fr-par.scw.cloud/",
  credentials: {
    accessKeyId: process.env.SCW_ACCESS_KEY_ID,
    secretAccessKey: process.env.SCW_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

// Nom du bucket depuis les variables d'environnement ou valeur par défaut
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "supchat-files";

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
