// Fonctions utilitaires pour la gestion des fichiers
import {
  FaFile,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileVideo,
  FaFileAudio,
  FaFileAlt,
} from "react-icons/fa";
import React from "react";

// Configuration de l'API URL
const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.69:3000";

/**
 * Détermine l'icône à afficher pour un type de fichier
 * @param {string} fileType - Le type MIME du fichier
 * @returns {JSX.Element} - L'icône correspondante
 */
export const getFileIcon = (fileType) => {
  if (!fileType) return <FaFile />;

  if (fileType.startsWith("image/")) return <FaFileImage />;
  if (fileType.includes("pdf")) return <FaFilePdf />;
  if (fileType.includes("word") || fileType.includes("document"))
    return <FaFileWord />;
  if (fileType.includes("excel") || fileType.includes("spreadsheet"))
    return <FaFileExcel />;
  if (fileType.startsWith("video/")) return <FaFileVideo />;
  if (fileType.startsWith("audio/")) return <FaFileAudio />;

  return <FaFileAlt />;
};

/**
 * Formate la taille d'un fichier pour l'affichage
 * @param {number} bytes - Taille en octets
 * @returns {string} - Taille formatée avec unité
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

/**
 * Construit l'URL complète d'un fichier
 * @param {string} fileUrl - URL relative ou partielle du fichier
 * @returns {string} - URL complète
 */
export const getCompleteFileUrl = (fileUrl) => {
  if (!fileUrl) return "";

  // Si l'URL est déjà complète (commence par http ou https), la renvoyer telle quelle
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  // Pour les fichiers S3 (messages privés), construire l'URL S3 complète (virtual-hosted style)
  if (
    fileUrl.startsWith("private-messages/") ||
    fileUrl.startsWith("private-messages/files/")
  ) {
    // L'URL est déjà présignée ou complète
    return fileUrl;
  }

  // Pour les URLs relatives classiques, garder le fallback API
  if (!fileUrl.startsWith("/api/files/")) {
    return `${API_URL}/api/files/${fileUrl}`;
  }

  // Si l'URL commence déjà par /api/files/, juste ajouter l'URL de base
  return `${API_URL}${fileUrl}`;
};
