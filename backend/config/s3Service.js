import AWS from "aws-sdk";
import dotenv from "dotenv";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getS3Config } from "./secrets.js";

// Load environment variables
dotenv.config();

// Récupérer la configuration S3 depuis les secrets Docker
const s3ConfigSecrets = getS3Config();

// Configure AWS SDK with explicit credentials for Scaleway
const s3Config = {
  region: "https://s3.fr-par.scw.cloud/",
  endpoint: s3ConfigSecrets.endpoint,
  credentials: {
    accessKeyId: s3ConfigSecrets.accessKeyId,
    secretAccessKey: s3ConfigSecrets.secretAccessKey,
  },
  s3ForcePathStyle: true, // Required for Scaleway S3 compatibility
};

// Create S3 service object with explicit configuration
const s3 = new AWS.S3(s3Config);

// S3 bucket name
const BUCKET_NAME = s3ConfigSecrets.bucketName;

// Types de fichiers autorisés par catégorie
const ALLOWED_FILE_TYPES = {
  image: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"],
  document: [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "csv",
    "json",
    "md",
  ],
  video: ["mp4", "webm", "ogg", "mov", "avi", "mkv"],
  audio: ["mp3", "wav", "ogg", "aac"],
};

/**
 * Télécharger un fichier vers Scaleway S3
 * @param {Object} file - Fichier à télécharger (avec buffer et originalname)
 * @param {String} folder - Dossier de destination (ex: 'workspaces', 'messages', 'private-messages')
 * @param {String} subfolder - Sous-dossier optionnel (ex: workspaceId, messageId)
 * @returns {Promise<Object>} - Informations du fichier téléchargé
 */
export const uploadFileToS3 = async (
  file,
  folder = "attachments",
  subfolder = ""
) => {
  if (
    !s3Config.credentials.accessKeyId ||
    !s3Config.credentials.secretAccessKey ||
    !BUCKET_NAME
  ) {
    throw new Error("Scaleway S3 credentials or bucket name not configured");
  }

  try {
    // Vérifier si nous avons un fichier valide
    if (!file || !file.buffer) {
      throw new Error("Invalid file object - missing buffer");
    }

    const fileExtension = path
      .extname(file.originalname)
      .toLowerCase()
      .substring(1);
    const fileType = getFileType(fileExtension);

    // Générer un nom de fichier unique
    const uniqueId = uuidv4();
    const sanitizedName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-_]/g, "") // Enlever les caractères spéciaux
      .toLowerCase();

    // Construire le chemin complet du fichier
    const destinationPath = subfolder
      ? `${folder}/${subfolder}/${uniqueId}-${sanitizedName}`
      : `${folder}/${uniqueId}-${sanitizedName}`;

    // Configurer les paramètres S3
    const params = {
      Bucket: BUCKET_NAME,
      Key: destinationPath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        "original-name": file.originalname,
        "file-type": fileType || "other",
      },
    };

    console.log(
      `Uploading file to Scaleway S3 bucket: ${BUCKET_NAME}, path: ${destinationPath}`
    );

    // Téléverser vers S3
    const uploadResult = await s3.upload(params).promise();

    // Construire l'URL correcte pour Scaleway S3
    const fileUrl =
      uploadResult.Location ||
      `${s3Config.endpoint}${BUCKET_NAME}/${destinationPath}`.replace(
        /([^:])\/\/+/g,
        "$1/"
      );

    console.log(`File successfully uploaded to S3, URL: ${fileUrl}`);

    // Retourner les informations du fichier
    return {
      url: fileUrl,
      key: destinationPath,
      originalName: file.originalname,
      fileType,
      fileExtension,
      size: file.size,
      contentType: file.mimetype,
    };
  } catch (error) {
    console.error("Error uploading to Scaleway S3:", error);
    throw error;
  }
};

/**
 * Supprimer un fichier de Scaleway S3
 * @param {String} url - URL du fichier à supprimer
 * @returns {Promise<Boolean>} - true si supprimé avec succès
 */
export const deleteFileFromS3 = async (url) => {
  if (!url) {
    console.warn("No URL provided, skipping delete");
    return false;
  }

  try {
    // Extraire la clé de l'URL Scaleway S3
    const key = extractKeyFromUrl(url);

    if (!key) {
      throw new Error("Invalid Scaleway S3 URL - could not extract key");
    }

    console.log(`Deleting object with key: ${key} from bucket: ${BUCKET_NAME}`);

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    console.log(`File successfully deleted from S3: ${key}`);
    return true;
  } catch (error) {
    console.error("Error deleting from Scaleway S3:", error);
    return false;
  }
};

/**
 * Récupérer un fichier depuis Scaleway S3
 * @param {String} key - Clé du fichier à récupérer
 * @returns {Promise<Object>} - Données du fichier récupéré
 */
export const getObjectFromS3 = async (key) => {
  if (!key) {
    throw new Error("No file key provided");
  }

  try {
    console.log(
      `Retrieving object with key: ${key} from bucket: ${BUCKET_NAME}`
    );

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    const data = await s3.getObject(params).promise();
    return data;
  } catch (error) {
    console.error("Error retrieving file from Scaleway S3:", error);
    throw error;
  }
};

/**
 * Extraire la clé du fichier depuis une URL Scaleway S3
 * @param {String} url - URL complète du fichier
 * @returns {String|null} - Clé du fichier ou null si non trouvée
 */
const extractKeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extraire la partie après le nom du bucket
    const bucketPrefix = `/${BUCKET_NAME}/`;
    if (pathname.startsWith(bucketPrefix)) {
      return pathname.substring(bucketPrefix.length);
    } else {
      // Approche alternative: essayer de trouver la clé après la dernière occurrence du nom du bucket
      const pathParts = pathname.split("/").filter(Boolean);
      const bucketIndex = pathParts.findIndex((part) => part === BUCKET_NAME);
      if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join("/");
      }
    }

    console.warn(`Could not extract key from URL: ${url}`);
    return null;
  } catch (error) {
    console.error("Error extracting key from URL:", error);
    return null;
  }
};

/**
 * Déterminer le type de fichier basé sur l'extension
 * @param {String} extension - Extension du fichier sans le point
 * @returns {String} - Type de fichier (image, document, video, audio, other)
 */
const getFileType = (extension) => {
  if (!extension) return "other";

  const lowerExt = extension.toLowerCase();

  for (const [type, extensions] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (extensions.includes(lowerExt)) {
      return type;
    }
  }

  return "other";
};

export default {
  uploadFileToS3,
  deleteFileFromS3,
  getObjectFromS3,
  getFileType,
  ALLOWED_FILE_TYPES,
};
