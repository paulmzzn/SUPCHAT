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
export const renderTextWithLinks = (text, onChannelClick, onUserClick) => {
  // Suppression des logs de débogage pour la version de production
  // console.log("renderTextWithLinks appelé avec:", {
  //   text,
  //   hasCallback: !!onChannelClick,
  //   matchesFound: text && text.includes("#"),
  // });

  if (!text) return "";

  // Regex pour les URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  // Regex pour les mentions de canaux - cherche les motifs comme #canal-name
  const channelRegex = /#([a-zA-Z0-9_-]+)(\s|$)/g;
  // Regex pour les mentions d'utilisateurs - cherche les motifs comme @[username](userId)
  const userMentionRegex = /@\[([^\]]+)\]\(([0-9a-f-]+)\)(\s|$)/g;
  // Format simple pour les sondages
  const strawpollSimpleRegex =
    /Sondage créé\s*:\s*([^\[]*)\[([^\]]+)\]\((https?:\/\/strawpoll\.com\/[^\)]+)\)\s*\[strawpoll:([a-zA-Z0-9]+)\]/g;

  // Diviser le texte en segments selon les URLs et les mentions de canaux
  const parts = [];
  let lastIndex = 0;
  let match; // Rechercher toutes les correspondances (URLs, mentions de canaux et sondages)
  const matches = [];

  // Traiter en priorité les liens de sondage pour éviter les conflits avec les URLs normales
  // Trouver tous les liens Strawpoll en format simple
  while ((match = strawpollSimpleRegex.exec(text)) !== null) {
    const pollTitle = match[2].trim();
    const pollUrl = match[3] || `https://strawpoll.com/${match[4]}`;
    const pollId = match[4];

    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
      type: "strawpoll",
      pollTitle,
      pollUrl,
      pollId,
      fullMatch: match[0],
    });
  }
  // Trouver toutes les URLs (mais pas celles déjà capturées dans des sondages)
  let tempText = text;
  for (const match of matches) {
    // Remplacer temporairement les correspondances trouvées pour ne pas les retraiter
    tempText = tempText.replace(
      match.fullMatch,
      " ".repeat(match.fullMatch.length)
    );
  }

  while ((match = urlRegex.exec(tempText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
      type: "url",
    });
  }
  // Trouver toutes les mentions de canaux (également dans le texte temporaire)
  while ((match = channelRegex.exec(tempText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length - (match[2] === " " ? 1 : 0), // Ne pas inclure l'espace dans la correspondance
      content: "#" + match[1], // Juste #nom sans l'espace
      type: "channel",
      channelName: match[1], // Nom du canal sans le #
    });
  }

  // Trouver toutes les mentions d'utilisateurs
  while ((match = userMentionRegex.exec(tempText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length - (match[3] === " " ? 1 : 0), // Ne pas inclure l'espace dans la correspondance
      content: `@[${match[1]}](${match[2]})`, // La mention complète @[username](userId)
      type: "user",
      userName: match[1], // Nom de l'utilisateur sans le @[]
      userId: match[2], // ID de l'utilisateur
    });
  }

  // Trier les correspondances par position de début
  matches.sort((a, b) => a.start - b.start);
  // Créer les segments finaux
  let currentIndex = 0;
  let key = 0;
  let skipToIndex = -1; // Variable pour indiquer jusqu'où ignorer le texte

  for (const match of matches) {
    // Si on doit ignorer cette région, passer à la suivante
    if (match.start < skipToIndex) {
      continue;
    }

    // Ajouter le texte avant la correspondance
    if (match.start > currentIndex) {
      parts.push(text.substring(currentIndex, match.start));
    }

    // Ajouter la correspondance formatée
    if (match.type === "url") {
      parts.push(
        <a
          key={`link-${key++}`}
          href={match.content}
          target="_blank"
          rel="noopener noreferrer"
        >
          {match.content}
        </a>
      );
    } else if (match.type === "channel") {
      // console.log("Rendu d'une mention de canal:", {
      //   channelName: match.channelName,
      //   hasCallback: !!onChannelClick,
      // });

      parts.push(
        <span
          key={`channel-${key++}`}
          className="channel-mention clickable"
          onClick={() => onChannelClick && onChannelClick(match.channelName)}
          title={`Cliquer pour aller au canal #${match.channelName}`}
        >
          {match.content}
        </span>
      );
    } else if (match.type === "user") {
      parts.push(
        <span
          key={`user-${key++}`}
          className="user-mention clickable username-clickable"
          onClick={() =>
            onUserClick && onUserClick(match.userId, match.userName)
          }
          title={`${match.userName}`}
        >
          <strong>@{match.userName}</strong>
        </span>
      );
    } else if (match.type === "strawpoll") {
      // Pour un sondage, on affiche uniquement "Sondage créé : " suivi du titre cliquable
      parts.push("Sondage créé : ");
      parts.push(
        <a
          key={`strawpoll-${key++}`}
          href={match.pollUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="strawpoll-link"
        >
          {match.pollTitle}
        </a>
      );

      // Ajouter un marqueur caché pour que le code de détection de strawpoll fonctionne
      parts.push(
        <span key={`strawpoll-marker-${key++}`} style={{ display: "none" }}>
          [strawpoll:{match.pollId}]
        </span>
      );

      // Pour un sondage, on doit ignorer tout le texte original, y compris le lien et l'identifiant
      skipToIndex = match.end;
    }

    currentIndex = match.end;
  }

  // Ajouter le reste du texte après la dernière correspondance
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  // Si aucune correspondance n'a été trouvée, retourner simplement le texte
  if (parts.length === 0) {
    return text;
  }

  return <>{parts}</>;
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
