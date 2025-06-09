import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getS3Config } from "./secrets.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Configuration sécurisée du client S3
const s3Config = getS3Config();

console.log(
  `🔧 Configuration S3: ${s3Config.endpoint} - Région: ${s3Config.region}`
);

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

// Fonction pour uploader un fichier vers S3
export const uploadToS3 = async (file, directory = "") => {
  console.log("🚀 Début de uploadToS3");
  try {
    if (!file) {
      console.log("❌ Aucun fichier fourni à uploadToS3");
      throw new Error("Aucun fichier fourni");
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

    // Récupérer la configuration complète pour les logs
    console.log(
      `🔧 Paramètres S3: région=${s3Config.region}, endpoint=${s3Config.endpoint}`
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

    // Construire l'URL complète S3 en utilisant la configuration des secrets
    const s3BaseUrl = s3Config.endpoint.replace(/\/$/, "");
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
