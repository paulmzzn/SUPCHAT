import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import path from "path";

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

// Fonction pour uploader un fichier vers S3
export const uploadToS3 = async (file, directory = "") => {
  console.log("🚀 Début de uploadToS3");
  try {
    if (!file) {
      console.log("❌ Aucun fichier fourni à uploadToS3");
      throw new Error("Aucun fichier fourni");
    }

    // Vérification des variables d'environnement critiques
    console.log("🔑 Vérification des identifiants S3");
    if (!process.env.SCW_ACCESS_KEY_ID || !process.env.SCW_SECRET_ACCESS_KEY) {
      console.error("❌ Variables d'environnement S3 manquantes");
      console.log(
        "SCW_ACCESS_KEY_ID présent:",
        !!process.env.SCW_ACCESS_KEY_ID
      );
      console.log(
        "SCW_SECRET_ACCESS_KEY présent:",
        !!process.env.SCW_SECRET_ACCESS_KEY
      );

      // Utiliser les valeurs par défaut du code si les variables d'env sont manquantes
      process.env.SCW_ACCESS_KEY_ID =
        process.env.SCW_ACCESS_KEY_ID || "SCW2E3VS5F51RVG9WQJA";
      process.env.SCW_SECRET_ACCESS_KEY =
        process.env.SCW_SECRET_ACCESS_KEY ||
        "9dee615d-2a3e-4f47-aabd-728a5eec1438";

      console.log("🔄 Utilisation des identifiants par défaut");
    }

    console.log(
      `📂 Upload vers S3: ${file.originalname} (${file.size} octets, type: ${file.mimetype})`
    );

    // Vérifier que file.buffer existe
    if (!file.buffer) {
      console.error("❌ file.buffer est absent ou vide!");
      throw new Error(
        "Buffer de fichier manquant - vérifiez la configuration de multer"
      );
    } else {
      console.log(
        `📄 Buffer de fichier présent (taille: ${file.buffer.length} octets)`
      );
    }

    // Générer un nom de fichier unique
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    // Créer le chemin complet avec le répertoire
    const fileKey = directory ? `${directory}/${fileName}` : fileName;

    console.log(`📍 Destination S3: ${BUCKET_NAME}/${fileKey}`);
    console.log(
      `🔧 Paramètres S3: région=${process.env.SCW_REGION}, endpoint=${process.env.SCW_ENDPOINT}`
    );

    // Créer la commande pour uploader le fichier
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    // Uploader le fichier
    console.log("⏳ Envoi de la commande vers S3...");
    try {
      const result = await s3Client.send(command);
      console.log("✅ Upload S3 réussi:", result.$metadata.httpStatusCode);
    } catch (s3SendError) {
      console.error("❌ Erreur lors de l'envoi à S3:", s3SendError);
      console.log("🔍 Détails de l'erreur S3:", {
        name: s3SendError.name,
        message: s3SendError.message,
        code: s3SendError.code,
        $metadata: s3SendError.$metadata,
        requestId: s3SendError.$metadata?.requestId,
      });
      throw s3SendError;
    }
    console.log("🏁 Fin de uploadToS3 avec succès");

    // Construire l'URL complète S3
    const s3BaseUrl =
      process.env.SCW_ENDPOINT?.replace(/\/$/, "") ||
      "https://s3.fr-par.scw.cloud";
    const fullUrl = `${s3BaseUrl}/${BUCKET_NAME}/${fileKey}`;

    console.log(`🔗 URL S3 complète générée: ${fullUrl}`);

    // Retourner l'URL complète au lieu de seulement la clé
    return {
      fileKey: fileKey,
      url: fullUrl,
    };
  } catch (error) {
    console.error("❌ Erreur dans uploadToS3:", error);
    console.error("❌ Stack trace:", error.stack);

    // Vérifier si l'erreur est liée aux informations d'identification
    if (
      error.message.includes("credentials") ||
      error.message.includes("authentication")
    ) {
      throw new Error(
        "Problème d'authentification avec S3 - vérifiez vos clés d'accès"
      );
    }

    // Vérifier si l'erreur est liée à la connexion
    if (
      error.message.includes("connect") ||
      error.message.includes("network")
    ) {
      throw new Error(
        "Problème de connexion au serveur S3 - vérifiez votre connectivité et l'endpoint"
      );
    }

    throw new Error(`Erreur lors de l'upload vers S3: ${error.message}`);
  }
};

// Fonction pour supprimer un fichier de S3
export const deleteFromS3 = async (fileKey) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
    };

    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Export s3Client as default only, individual functions are already exported with 'export const'
export default s3Client;
