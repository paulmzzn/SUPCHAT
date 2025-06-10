// Utilitaires pour les messages
import React from "react";
import {
  FaFile,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAlt,
} from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.68:3000";

/**
 * Formate une date de message
 * @param {string|Date} dateStr - Date à formater
 * @returns {string} - Date formatée
 */
export const formatMessageDate = (dateStr) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const oneDay = 24 * 60 * 60 * 1000;

  // Si c'est aujourd'hui, afficher seulement l'heure
  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Si c'est hier
  if (diff < 2 * oneDay && now.getDate() - date.getDate() === 1) {
    return `Hier, ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // Sinon, afficher la date complète
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Retourne l'icône appropriée pour un type de fichier
 * @param {string} fileType - Type MIME du fichier
 * @returns {JSX.Element} - Icône du fichier
 */
export const getFileIcon = (fileType) => {
  if (!fileType) return <FaFile />;

  if (fileType.startsWith("image/")) return <FaFileImage />;
  if (fileType.startsWith("video/")) return <FaFileVideo />;
  if (fileType.startsWith("audio/")) return <FaFileAudio />;
  if (fileType.includes("pdf")) return <FaFilePdf />;
  if (fileType.includes("word") || fileType.includes("document"))
    return <FaFileWord />;
  if (fileType.includes("excel") || fileType.includes("spreadsheet"))
    return <FaFileExcel />;

  return <FaFileAlt />;
};

/**
 * Formate la taille d'un fichier en unités lisibles
 * @param {number} bytes - Taille en octets
 * @returns {string} - Taille formatée
 */
export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "Taille inconnue";

  const sizes = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = parseInt(bytes, 10);

  while (size >= 1024 && i < sizes.length - 1) {
    size /= 1024;
    i++;
  }

  return `${Math.round(size * 100) / 100} ${sizes[i]}`;
};

/**
 * Retourne une URL complète pour un fichier
 * @param {string} url - URL partielle ou complète
 * @returns {string} - URL complète
 */
export const getCompleteFileUrl = (url) => {
  if (!url) {
    return "";
  }

  // Nettoyer les URLs dupliquées (cas où l'URL contient déjà le domaine S3 en double)
  let cleanUrl = url;
  if (url.includes("https://s3.fr-par.scw.cloud/s3-supchat/https://")) {
    // Extraire la partie après la deuxième occurrence du protocole
    cleanUrl = url.substring(url.lastIndexOf("https://"));
  } else if (url.includes("https://s3-supchat.s3.fr-par.scw.cloud/https://")) {
    // Extraire la partie après la deuxième occurrence du protocole
    cleanUrl = url.substring(url.lastIndexOf("https://"));
  }
  // Si l'URL est déjà complète (HTTP/HTTPS), la retourner telle quelle
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  // Pour les chemins S3 stockés comme clés (ex: "private-messages/files/123-image.jpg")
  if (
    cleanUrl.includes("private-messages/") ||
    cleanUrl.includes("s3-supchat")
  ) {
    // Construire l'URL S3 complète
    const s3BaseUrl = "https://s3-supchat.s3.fr-par.scw.cloud";
    const fullS3Url = cleanUrl.startsWith("/")
      ? `${s3BaseUrl}${cleanUrl}`
      : `${s3BaseUrl}/${cleanUrl}`;
    return fullS3Url;
  }

  // Pour les autres URLs relatives, utiliser l'API backend
  const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.68:3000";
  const apiUrl = `${API_URL}${
    cleanUrl.startsWith("/") ? "" : "/api/files/"
  }${cleanUrl}`;
  return apiUrl;
};

/**
 * Parse JSON en toute sécurité
 * @param {string} jsonString - Chaîne JSON à parser
 * @param {*} fallback - Valeur par défaut en cas d'erreur
 * @returns {Object} - Objet JSON ou valeur par défaut
 */
export const safeJSONParse = (jsonString, fallback = null) => {
  try {
    return typeof jsonString === "string" ? JSON.parse(jsonString) : fallback;
  } catch (error) {
    console.error("JSON parse error:", error);
    return fallback;
  }
};

/**
 * Transforme un objet en chaîne JSON en toute sécurité
 * @param {Object} obj - Objet à transformer
 * @returns {string} - Chaîne JSON
 */
export const safeJSONStringify = (obj) => {
  try {
    return typeof obj === "object" ? JSON.stringify(obj) : obj;
  } catch (error) {
    console.error("JSON stringify error:", error);
    return "";
  }
};

export default {
  formatMessageDate,
  getFileIcon,
  formatFileSize,
  getCompleteFileUrl,
  safeJSONParse,
  safeJSONStringify,
};
