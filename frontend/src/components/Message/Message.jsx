import React from "react";
import "./Message.css";
import {
  FaFile,
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileVideo,
  FaFileAudio,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const Message = ({ message, isOwn, showAvatar = true }) => {
  const { contenu, date_creation, attachments = [], nom } = message;

  // Fonction pour déterminer l'icône du fichier en fonction du type MIME
  const getFileIcon = (fileType) => {
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

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
    } catch (e) {
      return "date inconnue";
    }
  };

  // Fonction pour formater le contenu avec des liens cliquables
  const renderContent = (text) => {
    if (!text) return null;

    // Regex pour détecter les URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Diviser le texte en parties
    const parts = text.split(urlRegex);

    // Trouver toutes les correspondances d'URL
    const matches = text.match(urlRegex) || [];

    return parts.map((part, i) => {
      // Si la partie correspond à une URL, la rendre cliquable
      if (matches.includes(part)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      // Sinon, retourner le texte normal
      return <span key={i}>{part}</span>;
    });
  };

  // Fonction pour afficher les pièces jointes
  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="message-attachments">
        {attachments.map((attachment, index) => {
          const { id_fichier, nom_fichier, type, url, presignedUrl } =
            attachment;
          const fileUrl = presignedUrl || url;

          // Si c'est une image, afficher une prévisualisation
          if (type && type.startsWith("image/")) {
            return (
              <div key={id_fichier || index} className="attachment-image">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <img src={fileUrl} alt={nom_fichier} />
                </a>
              </div>
            );
          }

          // Sinon, afficher un lien avec une icône
          return (
            <div key={id_fichier || index} className="attachment-file">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <div className="attachment-icon">{getFileIcon(type)}</div>
                <div className="attachment-name">{nom_fichier}</div>
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`message ${isOwn ? "own" : "other"}`}>
      {showAvatar && (
        <div className="message-avatar">
          {/* Ajouter avatar si disponible */}
        </div>
      )}
      <div className="message-content">
        <div className="message-header">
          <span className="message-author">{nom}</span>
          <span className="message-time">{formatDate(date_creation)}</span>
        </div>
        <div className="message-text">{renderContent(contenu)}</div>
        {renderAttachments(attachments)}
      </div>
    </div>
  );
};

export default Message;
