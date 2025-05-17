import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAlt,
  FaCrown,
  FaUserShield,
  FaUser,
} from "react-icons/fa";
import React from "react";

// Fonctions utilitaires extraites de WorkspaceDetails.jsx

// Formate la date d'un message
export const formatMessageDate = (dateString) => {
  if (!dateString) {
    console.warn("formatMessageDate: date invalide", dateString);
    return "";
  }
  try {
    const date = new Date(dateString);
    const correctedDate = new Date(date.getTime() + 2 * 60 * 60 * 1000); // +2h
    const now = new Date();
    const nowParis = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const hours = correctedDate.getHours().toString().padStart(2, "0");
    const minutes = correctedDate.getMinutes().toString().padStart(2, "0");
    const isSameDay =
      correctedDate.getDate() === nowParis.getDate() &&
      correctedDate.getMonth() === nowParis.getMonth() &&
      correctedDate.getFullYear() === nowParis.getFullYear();
    if (isSameDay) {
      return `${hours}:${minutes}`;
    } else {
      const day = correctedDate.getDate().toString().padStart(2, "0");
      const month = (correctedDate.getMonth() + 1).toString().padStart(2, "0");
      const year = correctedDate.getFullYear();
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
  } catch (error) {
    console.error("Erreur de formatage de date:", error, dateString);
    return "";
  }
};

// Parse le contenu d'un message pour détecter un fichier
export const parseFileContent = (content) => {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === "file") {
      return {
        isFile: true,
        isImage: parsed.isImage,
        fileUrl: parsed.fileUrl,
        fileName: parsed.fileName,
        fileSize: parsed.fileSize,
        fileType: parsed.fileType,
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

// Formate la taille d'un fichier en B, KB ou MB
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
};

// Helper pour afficher le bon icône de fichier
export const getFileIcon = (type) => {
  switch (type) {
    case "pdf":
      return <FaFilePdf />;
    case "word":
      return <FaFileWord />;
    case "excel":
      return <FaFileExcel />;
    default:
      return <FaFileAlt />;
  }
};

// Helper pour obtenir l'icône du rôle
export const getRoleIcon = (role) => {
  switch (role) {
    case "owner":
      return <FaCrown className="role-icon owner" title="Propriétaire" />;
    case "admin":
      return (
        <FaUserShield className="role-icon admin" title="Administrateur" />
      );
    case "member":
      return <FaUser className="role-icon member" title="Membre" />;
    default:
      return <FaUser className="role-icon member" title="Membre" />;
  }
};

// Helper pour vérifier si une chaîne est un UUID
export const isUuid = (str) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    str
  );

// Helper pour logger les interactions avec Mistral
export const debugMistralInteraction = (message) => {
  console.log(`[Mistral Debug] ${message}`);
};

// Helper pour rendre les liens cliquables dans un texte
export const renderTextWithLinks = (text) => {
  if (!text) return "";

  // Regex pour les URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Regex pour les mentions de canaux - cherche les motifs comme #canal-name
  const channelMentionRegex = /#([a-zA-Z0-9_-]+)/g;

  // Étape 1: Traitement des URLs
  let parts = text.split(urlRegex);
  const urlMatches = text.match(urlRegex) || [];

  let result = parts.map((part, i) => {
    if (urlMatches.includes(part)) {
      return (
        <a
          key={`url-${i}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="message-link"
        >
          {part}
        </a>
      );
    }
    return part;
  });

  // Étape 2: Traitement des mentions de canaux dans chaque partie qui n'est pas un URL
  result = result.map((part, index) => {
    // Ne traiter que les parties textuelles, pas les éléments React
    if (typeof part !== "string") {
      return part;
    }

    const channelParts = part.split(channelMentionRegex);
    const channelMatches = part.match(channelMentionRegex) || [];

    // Si aucune mention de canal, retourner le texte tel quel
    if (channelMatches.length === 0) {
      return part;
    }

    // Combiner avec les mentions de canaux mises en évidence
    return channelParts.map((channelPart, i) => {
      const channelMatch = channelMatches[i - 1];
      if (i > 0 && channelMatch) {
        return (
          <React.Fragment key={`channel-${index}-${i}`}>
            <span className="channel-mention">{channelMatch}</span>
            {channelPart}
          </React.Fragment>
        );
      }
      return channelPart;
    });
  });

  // Aplatir le tableau de résultats pour éviter les tableaux imbriqués
  return result.flat();
};

/**
 * Formats a mention with user ID in markdown format
 * @param {string} username - The username to mention
 * @param {string} userId - The user ID
 * @returns {string} Formatted mention string
 */
export const formatMention = (username, userId) => {
  return `@[${username}](${userId})`;
};

/**
 * Checks if a string is a proper mention format
 * @param {string} text - The text to check
 * @returns {boolean} True if it's a valid mention format
 */
export const isMention = (text) => {
  return /^@\[.+\]\([0-9a-f-]+\)$/.test(text);
};
