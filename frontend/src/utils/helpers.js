import { FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt, FaCrown, FaUserShield, FaUser } from "react-icons/fa";

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
      return <FaUserShield className="role-icon admin" title="Administrateur" />;
    case "member":
      return <FaUser className="role-icon member" title="Membre" />;
    default:
      return <FaUser className="role-icon member" title="Membre" />;
  }
};

// Helper pour vérifier si une chaîne est un UUID
export const isUuid = (str) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// Helper pour logger les interactions avec Mistral
export const debugMistralInteraction = (message) => {
  console.log(`[Mistral Debug] ${message}`);
};

// Helper pour rendre les liens cliquables dans un texte
export const renderTextWithLinks = (text) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];
  return parts.map((part, i) => {
    if (matches.includes(part)) {
      return (
        <a
          key={i}
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
};
