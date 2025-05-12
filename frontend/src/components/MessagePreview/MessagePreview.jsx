import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaHashtag,
  FaCalendarAlt,
  FaTimes,
  FaReply,
  FaReplyAll,
  FaExternalLinkAlt,
} from "react-icons/fa";
import "./MessagePreview.css";

const MessagePreview = ({
  message,
  onClose,
  onNavigate,
  onReply,
  position = { top: 0, left: 0 },
  visible = false,
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [contentType, setContentType] = useState("text");
  const [parsedContent, setParsedContent] = useState(null);

  // Détection du type de contenu et parsing si nécessaire
  useEffect(() => {
    if (!message) return;

    try {
      // Essayer de parser le contenu si c'est un JSON
      const content = message.contenu;

      if (
        typeof content === "string" &&
        (content.startsWith("{") || content.startsWith("["))
      ) {
        const parsed = JSON.parse(content);
        setParsedContent(parsed);

        if (parsed.type === "file") {
          setContentType("file");
        } else if (parsed.type === "image") {
          setContentType("image");
        } else {
          setContentType("text");
        }
      } else {
        setParsedContent(null);
        setContentType("text");
      }
    } catch (e) {
      console.log("Erreur de parsing du contenu:", e);
      setParsedContent(null);
      setContentType("text");
    }
  }, [message]);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  if (!message) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";

    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fonction pour rendre le contenu du message selon son type
  const renderMessageContent = () => {
    if (!message) return <p>Contenu indisponible</p>;

    if (contentType === "file") {
      // Affichage pour les fichiers
      const fileInfo = parsedContent || {};
      return (
        <div className="message-preview-file">
          <div className="file-icon">📎</div>
          <div className="file-info">
            <div className="file-name">{fileInfo.fileName || "Fichier"}</div>
            {fileInfo.fileSize && (
              <div className="file-size">{fileInfo.fileSize}</div>
            )}
          </div>
        </div>
      );
    } else if (contentType === "image") {
      // Affichage pour les images
      const imageInfo = parsedContent || {};
      return (
        <div className="message-preview-image">
          {imageInfo.url && <img src={imageInfo.url} alt="Aperçu" />}
        </div>
      );
    } else {
      // Texte simple
      return (
        <div className="message-content-text">
          {parsedContent
            ? parsedContent.text ||
              parsedContent.content ||
              JSON.stringify(parsedContent)
            : message.contenu}
        </div>
      );
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleNavigate = (e) => {
    e.stopPropagation();
    if (onNavigate) onNavigate(message);
  };

  const handleReply = (e) => {
    e.stopPropagation();
    if (onReply) onReply(message);
  };

  if (!isVisible) return null;

  const popupStyles = {
    top: `${position.top}px`,
    left: `${position.left}px`,
  };

  return (
    <div className="message-preview-overlay" onClick={handleClose}>
      <div
        className="message-preview-container"
        style={popupStyles}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="message-preview-header">
          <div className="user-info">
            {message.photo_de_profil ? (
              <img
                src={message.photo_de_profil}
                alt={message.nom_utilisateur}
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar-placeholder">
                <FaUser />
              </div>
            )}
            <span className="user-name">{message.nom_utilisateur}</span>
          </div>

          <div className="message-info">
            <div className="channel-info">
              <FaHashtag />
              <span>{message.nom_canal}</span>
            </div>
            <div className="message-date">
              <FaCalendarAlt />
              <span>
                {formatDate(message.date_creation || message.created_at)}
              </span>
            </div>
          </div>

          <button className="close-button" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="message-preview-body">{renderMessageContent()}</div>

        <div className="message-preview-footer">
          <button
            className="preview-action-button reply-button"
            onClick={handleReply}
          >
            <FaReply /> Répondre
          </button>
          <button
            className="preview-action-button navigate-button"
            onClick={handleNavigate}
          >
            <FaExternalLinkAlt /> Aller au message
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagePreview;
