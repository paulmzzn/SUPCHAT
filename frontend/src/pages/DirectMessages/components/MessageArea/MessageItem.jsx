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
                          style={{
                            cursor: "pointer",
                            display: "block",
                            visibility: "visible",
                            opacity: "1",
                            margin: "10px 0",
                            borderRadius: "12px",
                            overflow: "hidden",
                            maxWidth: "500px",
                            backgroundColor: "#f8f9fa",
                            border: "1px solid #e9ecef",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {" "}
                          <img
                            src={fileUrl}
                            alt={attachment.nom_fichier}
                            className="dm-msg-image"
                            loading="eager"
                            referrerPolicy="no-referrer"
                            style={{
                              display: "block !important",
                              visibility: "visible !important",
                              opacity: "1 !important",
                              width:
                                "100%" /* Prend toute la largeur du conteneur */,
                              height: "auto" /* Maintient les proportions */,
                              maxWidth:
                                "400px" /* Largeur maximale pour s'adapter à la bulle */,
                              maxHeight:
                                "300px" /* Hauteur maximale raisonnable */,
                              objectFit:
                                "contain" /* Affiche l'image entière sans découpe */,
                              objectPosition: "center",
                              backgroundColor: "transparent",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                            }}
                            onLoad={(e) => {
                              // Calculer les dimensions optimales pour afficher l'image entière
                              const naturalWidth = e.target.naturalWidth;
                              const naturalHeight = e.target.naturalHeight;
                              const aspectRatio = naturalWidth / naturalHeight;

                              // Taille maximale de conteneur (correspond à la largeur max de la bulle)
                              const maxContainerWidth = 400;
                              const maxContainerHeight = 300;

                              let optimalWidth, optimalHeight;

                              // Calculer les dimensions pour que l'image s'affiche entièrement
                              if (
                                aspectRatio >
                                maxContainerWidth / maxContainerHeight
                              ) {
                                // Image plus large que haute, limiter par la largeur
                                optimalWidth = Math.min(
                                  naturalWidth,
                                  maxContainerWidth
                                );
                                optimalHeight = optimalWidth / aspectRatio;
                              } else {
                                // Image plus haute que large, limiter par la hauteur
                                optimalHeight = Math.min(
                                  naturalHeight,
                                  maxContainerHeight
                                );
                                optimalWidth = optimalHeight * aspectRatio;
                              }

                              // Appliquer les dimensions calculées
                              e.target.style.width = `${optimalWidth}px`;
                              e.target.style.height = `${optimalHeight}px`;
                              e.target.style.maxWidth = "none"; // Enlever la limite CSS
                              e.target.style.maxHeight = "none"; // Enlever la limite CSS
                              e.target.style.objectFit = "contain";

                              // Ajuster le conteneur parent pour s'adapter
                              e.target.parentElement.style.width = `${optimalWidth}px`;
                              e.target.parentElement.style.height = `${optimalHeight}px`;

                              // Styles finaux une fois l'image chargée
                              e.target.style.border = "none";
                              e.target.style.backgroundColor = "transparent";
                              e.target.style.boxShadow =
                                "0 2px 8px rgba(0, 0, 0, 0.1)";
                              e.target.parentElement.style.border =
                                "1px solid #e9ecef";
                              e.target.parentElement.style.backgroundColor =
                                "transparent";

                              // Marquer comme chargée
                              e.target.classList.add("loaded");
                              e.target.parentElement.classList.add("loaded");
                            }}
                            onError={(e) => {
                              // Essayer de charger l'image via proxy/backend au lieu de S3 direct
                              const backendUrl = `${
                                process.env.REACT_APP_API_URL ||
                                "http://192.168.1.68:3000"
                              }/api/files/proxy?url=${encodeURIComponent(
                                fileUrl
                              )}`;

                              // Créer une nouvelle image avec l'URL du backend
                              const fallbackImg = new Image();
                              fallbackImg.onload = () => {
                                e.target.src = backendUrl;
                                e.target.style.display = "block";
                              };
                              fallbackImg.onerror = () => {
                                // Afficher un message d'erreur à la place
                                e.target.style.display = "none";
                                if (
                                  !e.target.parentNode.querySelector(
                                    ".dm-msg-image-error"
                                  )
                                ) {
                                  const errorDiv =
                                    document.createElement("div");
                                  errorDiv.className = "dm-msg-image-error";
                                  errorDiv.style.cssText = `
                                    padding: 20px;
                                    background: #f8f9fa;
                                    border: 2px dashed #dee2e6;
                                    border-radius: 8px;
                                    text-align: center;
                                    color: #6c757d;
                                    margin: 10px 0;
                                  `;
                                  errorDiv.innerHTML = `
                                    <div style="font-size: 24px; margin-bottom: 10px;">🖼️</div>
                                    <div><strong>Image temporairement indisponible</strong></div>
                                    <div style="font-size: 12px; margin-top: 5px;">${attachment.nom_fichier}</div>
                                    <div style="font-size: 10px; color: #adb5bd; margin-top: 5px;">Cliquez pour télécharger</div>
                                  `;
                                  errorDiv.onclick = () => {
                                    window.open(fileUrl, "_blank");
                                  };
                                  errorDiv.style.cursor = "pointer";
                                  e.target.parentNode.appendChild(errorDiv);
                                }
                              };
                              fallbackImg.src = backendUrl;
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
