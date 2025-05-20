// Composant pour afficher un message individuel
import React from "react";
import { FaReply, FaDownload } from "react-icons/fa";

/**
 * Affiche un message individuel
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element}
 */
const MessageItem = ({
  message,
  isOwn,
  usersInfo,
  currentUserId,
  messages,
  renderTextWithMentions,
  formatMessageDate,
  getFileIcon,
  getCompleteFileUrl,
  formatFileSize,
  onMessageContextMenu,
  onDownloadFile,
  onImageClick,
  onReply, // <-- nouvelle prop
}) => {
  // Get the sender info, with strong fallbacks if missing
  const senderId = message.fk_expediteur;
  const senderInfo = usersInfo[senderId] || {};

  // Determine display name with fallbacks
  const displayName =
    senderInfo.name || senderInfo.nom || (isOwn ? "Vous" : "Utilisateur");

  return (
    <div
      key={message.id_message_prive}
      className={`dm-message ${isOwn ? "own" : "other"}`}
      id={`msg-${message.id_message_prive}`}
      onContextMenu={(e) => onMessageContextMenu(e, message)}
    >
      <div className="dm-msg-content">
        {/* Wrapper pour contenir la réponse et le contenu du message */}
        <div className="dm-message-wrapper">
          {/* Afficher le message parent (réponse) */}
          {message.parent_id || message.parent_message ? (
            <div
              className="message-reply-to"
              onClick={() => {
                const parentId =
                  message.parent_id || message.parent_message?.id_message_prive;
                if (parentId) {
                  const parentElement = document.getElementById(
                    `msg-${parentId}`
                  );
                  if (parentElement) {
                    parentElement.scrollIntoView({ behavior: "smooth" });
                    parentElement.classList.add("highlight");
                    setTimeout(() => {
                      parentElement.classList.remove("highlight");
                    }, 2000);
                  }
                }
              }}
            >
              <span className="reply-icon">
                <FaReply />
              </span>
              <div className="reply-content">
                <span className="reply-author">
                  {message.parent_message
                    ? usersInfo[message.parent_message.fk_expediteur]?.name ||
                      "Utilisateur"
                    : message.parent_id
                    ? usersInfo[
                        messages.find(
                          (m) => m.id_message_prive === message.parent_id
                        )?.fk_expediteur
                      ]?.name || "Utilisateur"
                    : "Utilisateur"}
                </span>
                <span className="reply-text">
                  {message.parent_message
                    ? message.parent_message.contenu
                    : message.parent_id
                    ? messages.find(
                        (m) => m.id_message_prive === message.parent_id
                      )?.contenu || "Message original non disponible"
                    : "Message original non disponible"}
                </span>
              </div>
            </div>
          ) : null}

          <div className="dm-msg-header">
            <span className="dm-msg-author">{displayName}</span>
            <span className="dm-msg-date">
              {formatMessageDate(message.date_creation || message.date_envoi)}
            </span>
            {/* Le bouton Répondre a été supprimé, la réponse se fait via le menu contextuel (clic droit) */}
          </div>

          <div className="dm-msg-bubble">
            {renderTextWithMentions(message.contenu)}
          </div>

          {/* Afficher les réactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="dm-msg-reactions">
              {message.reactions.map((reaction, index) => (
                <div
                  key={`${reaction.reaction_type}-${index}`}
                  className="dm-msg-reaction"
                >
                  <span className="dm-reaction-emoji">
                    {reaction.reaction_type}
                  </span>
                  <span className="dm-reaction-count">{reaction.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Afficher les pièces jointes */}
          {message &&
            message.is_deleted === false &&
            message.attachments &&
            Array.isArray(message.attachments) &&
            message.attachments.length > 0 && (
              <div className="dm-msg-attachments">
                {message.attachments
                  .filter(
                    (attachment) =>
                      attachment && (attachment.url || attachment.presignedUrl)
                  )
                  .map((attachment) => {
                    const fileUrl = getCompleteFileUrl(
                      attachment.presignedUrl || attachment.url
                    );

                    if (
                      attachment.type &&
                      attachment.type.startsWith("image/")
                    ) {
                      // Affichage des images
                      return (
                        <div
                          key={attachment.id_fichier || `temp-${Date.now()}`}
                          className="dm-msg-image-attachment"
                          onClick={() =>
                            onImageClick &&
                            onImageClick({
                              fileUrl,
                              fileName: attachment.nom_fichier,
                              fileType: attachment.type,
                              isImage: true,
                              fullFileUrl: fileUrl,
                            })
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={fileUrl}
                            alt={attachment.nom_fichier}
                            className="dm-msg-image"
                            onError={(e) => {
                              e.target.src = "/images/broken-image.png";
                            }}
                          />
                          <div className="dm-msg-image-filename">
                            {attachment.nom_fichier}
                          </div>
                        </div>
                      );
                    } else {
                      // Autres types de fichiers
                      return (
                        <div
                          key={attachment.id_fichier || `temp-${Date.now()}`}
                          className="dm-msg-file-attachment"
                        >
                          <div className="dm-msg-file-download-link">
                            <div className="dm-msg-file-icon">
                              {getFileIcon(attachment.type)}
                            </div>
                            <div className="dm-msg-file-info">
                              <div className="dm-msg-file-name">
                                {attachment.nom_fichier}
                              </div>
                              <div className="dm-msg-file-size">
                                {formatFileSize(attachment.taille_fichier)}
                              </div>
                            </div>
                            <div
                              className="dm-msg-file-download"
                              onClick={() =>
                                onDownloadFile(fileUrl, attachment.nom_fichier)
                              }
                            >
                              <FaDownload />
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
              </div>
            )}

          {/* Statut de lecture pour les messages envoyés */}
          {isOwn && (
            <div className="dm-msg-read">
              {message.date_lecture
                ? `✓ Lu ${formatMessageDate(message.date_lecture)}`
                : "✓ Envoyé"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
