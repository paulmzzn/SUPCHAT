import React, { useState, useEffect, useCallback } from "react";
import {
  FaLock,
  FaHashtag,
  FaReply,
  FaRobot,
  FaSmile,
  FaPaperclip,
  FaWrench,
  FaPoll,
  FaVideo,
  FaPaperPlane,
  FaTools,
  FaImage,
  FaCode,
  FaVoteYea,
  FaUsers,
  FaEye,
  FaCommentSlash,
  FaTimes,
  FaRegSmile,
  FaPlus,
  FaAt,
  FaUser,
  FaEdit,
  FaGoogle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import GoogleDriveModal from "../../components/GoogleDrive/GoogleDriveModal";
import {
  getFileIcon,
  getDownloadIcon,
  formatFileSize,
  getFileType,
} from "../../utils/fileIcons";

function ChatContainer({
  activeChannel,
  loadingMessages,
  messages,
  currentUserId,
  chatContainerRef,
  handleMessageContextMenu,
  formatMessageDate,
  parseFileContent,
  handleOpenFileViewer,
  handleDownloadFile,
  isMistralTyping,
  getEmojiForType,
  handleReplyMessage,
  handleShowEmojiPicker,
  handleDeleteMessage,
  messageContextMenu,
  replyingTo,
  handleCancelReply,
  fileInputRef,
  handleFileUpload,
  displayMessage,
  handleNewMessageChange,
  handleChatInputKeyDown,
  setShowEmojiPicker,
  showMentionSuggestions,
  mentionSuggestions,
  activeMentionIndex,
  handleSelectMention,
  handleMentionNavigation,
  handleSelectActiveItem,
  handleSendMessageWithMistralCheck,
  showToolbox,
  handleToggleToolbox,
  handleOpenStrawpoll,
  showStrawpollModal,
  handleCloseStrawpollModal,
  handleStrawpollSubmit,  showGoogleDriveModal,
  handleOpenGoogleDrive,
  handleCloseGoogleDrive,
  onFilesSelected,
  workspaceId,
  socket,
  commonEmojis,
  showEmojiPicker,
  handleAddReaction,
  renderTextWithLinks,
  isUuid,
  setShowVideoCallModal,
  handleManageChannelMembers,
  isChannelPrivate,
  canManageMembers,
  currentUserAccessRight,
  handleOpenStrawpollVote,
  showChannelSuggestions,
  channelSuggestions,
  activeChannelSuggestionIndex,
  handleChannelSuggestionNavigation,
  handleSelectActiveChannelSuggestion,
  handleSelectChannelSuggestion,
  // Pagination props
  hasMoreMessages,
  loadingMoreMessages,
  loadMoreMessages,
  isPrependingMessages,
  setIsPrependingMessages,
  handleEditMessage,
  handleCancelEdit,
  handleUpdateMessage,
  editingMessage,
  pendingScrollToMessageId,
  setPendingScrollToMessageId,
}) {
  // Effet pour gérer le scroll vers un message précis après chargement segmenté
  useEffect(() => {
    if (!pendingScrollToMessageId || !chatContainerRef?.current) return;
    const el = document.getElementById(`msg-${pendingScrollToMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlighted-message");
      setTimeout(() => {
        el.classList.remove("highlighted-message");
      }, 5000);
      setPendingScrollToMessageId(null);
    } else if (hasMoreMessages && typeof loadMoreMessages === "function") {
      // Charger plus de messages si le message n'est pas encore là
      loadMoreMessages();
    }
  }, [pendingScrollToMessageId, messages, chatContainerRef, hasMoreMessages, loadMoreMessages, setPendingScrollToMessageId]);
  const navigate = useNavigate();
  const canWriteInChannel = activeChannel?.isPrivate
    ? currentUserAccessRight === "lecture_ecriture"
    : true;

  // --- Solution améliorée pour le chargement avec maintien de position ---
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

  // Détecter le scroll vers le haut de façon simple
  useEffect(() => {
    if (!chatContainerRef?.current || !hasMoreMessages) return;

    const container = chatContainerRef.current;
    let scrollThreshold = 150; // Augmenter légèrement le seuil pour une meilleure détection
    let debounceTimer = null;

    const handleScroll = () => {
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        // Détection du scroll vers le haut et proche du haut
        if (
          container.scrollTop < scrollThreshold &&
          !isLoadingOlderMessages &&
          !loadingMoreMessages &&
          hasMoreMessages
        ) {
          // Stocker les informations sur le deuxième message visible comme point de référence
          // (pas le premier qui pourrait disparaître)
          const messages = container.querySelectorAll(".chat-message");
          // Utiliser le second message si disponible, sinon le premier
          const targetMessageIndex = messages.length > 1 ? 1 : 0;
          const targetMessage = messages[targetMessageIndex];

          if (!targetMessage) return;

          // Stocker l'ID du message et sa position relative par rapport au viewport
          const targetId = targetMessage.dataset.messageId;
          const targetTop = targetMessage.getBoundingClientRect().top;
          const viewportTop = container.getBoundingClientRect().top;
          const targetOffset = targetTop - viewportTop; // Position relative dans le viewport

          console.log(
            `📜 Chargement déclenché, message de référence: ${targetId}`
          );
          console.log(`Position relative du message: ${targetOffset}px`);

          // Préparer pour le chargement
          setIsLoadingOlderMessages(true);
          if (typeof setIsPrependingMessages === "function") {
            setIsPrependingMessages(true);
          }

          // Charger les messages
          loadMoreMessages();

          // Après chargement, restaurer la position
          setTimeout(() => {
            if (!chatContainerRef.current) return;

            // Retrouver le même élément après chargement
            const sameMessageElement = document.querySelector(
              `[data-message-id="${targetId}"]`
            );
            if (sameMessageElement) {
              // Calculer la nouvelle position et réappliquer le même offset
              const newTop = sameMessageElement.getBoundingClientRect().top;
              const newViewportTop = container.getBoundingClientRect().top;
              const newOffset = newTop - newViewportTop;
              const adjustment = newOffset - targetOffset;

              console.log(`Ajustement de scroll: ${adjustment}px`);
              container.scrollTop += adjustment;

              console.log(`Position maintenue pour le message ${targetId}`);
            }

            // Réinitialiser les états après un court délai
            setTimeout(() => {
              setIsLoadingOlderMessages(false);
              if (typeof setIsPrependingMessages === "function") {
                setIsPrependingMessages(false);
              }
            }, 200);
          }, 300); // Délai plus long pour s'assurer que le DOM est mis à jour
        }
      }, 50); // Court debounce pour une réponse rapide
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(debounceTimer);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [
    chatContainerRef,
    hasMoreMessages,
    isLoadingOlderMessages,
    loadingMoreMessages,
    loadMoreMessages,
    setIsPrependingMessages,
  ]);

  // Styles CSS pour l'indicateur de chargement
  const cssStyles = `
    .infinite-scroll-loader {
      padding: 10px;
      text-align: center;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      background: rgba(30, 30, 35, 0.8);
      border-radius: 8px;
      margin: 10px auto;
      width: 90%;
      max-width: 400px;
      position: sticky;
      top: 5px;
      z-index: 20;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .loading-dots {
      display: inline-block;
      margin-left: 5px;
    }
    
    .loading-dots:after {
      content: '.';
      animation: dots 1.5s steps(5, end) infinite;
    }
    
    @keyframes dots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60% { content: '...'; }
      80%, 100% { content: ''; }
    }
    
    .chat-messages {
      position: relative;
      overflow-y: auto;
      height: calc(100% - 60px);
      padding: 10px;
      scroll-behavior: auto !important;
    }

    .editing-message {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: rgba(30, 144, 255, 0.1);
      border-left: 3px solid #1e90ff;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 10px;
    }
    
    .edit-info {
      display: flex;
      align-items: center;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }
    
    .edit-icon {
      margin-right: 8px;
      color: #1e90ff;
    }
    
    .cancel-edit {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0;
      transition: color 0.2s;
    }
    
    .cancel-edit:hover {
      color: rgba(255, 255, 255, 0.9);
    }

    .message-edited {
      font-size: 0.8rem;
      font-style: italic;
      color: rgba(255, 255, 255, 0.5);
      margin-left: 4px;
    }
  `;

  return (
    <div className="workspace-content-area">
      {/* Injecter les styles CSS */}
      <style>{cssStyles}</style>

      <div className="glow-circle-right top-right"></div>
      <div className="glow-circle-left bottom-left"></div>
      {!activeChannel ? (
        <div className="workspace-welcome">
          <h1>Bienvenue</h1>
          <p>Sélectionnez un canal pour commencer à discuter</p>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-header-info">
              {activeChannel.isPrivate ? (
                <FaLock className="chat-header-icon" />
              ) : (
                <FaHashtag className="chat-header-icon" />
              )}
              <h2>{activeChannel.name}</h2>
            </div>
            <div className="chat-header-actions">
              <button
                className="video-call-button"
                onClick={() => setShowVideoCallModal(true)}
                title="Démarrer un appel vidéo"
              >
                <FaVideo />
                <span>Appel vidéo</span>
              </button>
              {isChannelPrivate && currentUserAccessRight === "read" && (
                <div
                  className="read-only-indicator"
                  title="Canal en lecture seule"
                >
                  <FaEye /> Lecture seule
                </div>
              )}
            </div>
          </div>
          <div className="chat-messages" ref={chatContainerRef}>
            {/* Indicateur de chargement simple */}
            {(loadingMoreMessages || isLoadingOlderMessages) &&
              hasMoreMessages && (
                <div className="infinite-scroll-loader">
                  Chargement des messages anciens
                  <span className="loading-dots"></span>
                </div>
              )}

            {/* Le div invisible pour déclencher le chargement est ajouté dynamiquement */}

            {loadingMessages ? (
              <div className="chat-loading">Chargement des messages...</div>
            ) : messages.length > 0 ? (
              messages.map((message, index) => {
                // Générer une clé vraiment unique en combinant l'id du message avec son index
                const messageKey = `${message.id_message}-${index}`;

                const systemMsg =
                  message.is_system_message ||
                  message.fk_utilisateur ===
                    "00000000-0000-0000-0000-000000000003";

                return (
                  <div
                    key={messageKey} // Utiliser notre nouvelle clé unique
                    id={`msg-${message.id_message}`}
                    data-message-id={message.id_message}
                    data-message-index={message.index}
                    data-message-timestamp={message.date_creation}
                    className={`chat-message ${
                      systemMsg
                        ? "system-message"
                        : message.fk_utilisateur === currentUserId
                        ? "own-message"
                        : "other-message"
                    }`}
                    onContextMenu={(e) =>
                      !systemMsg && handleMessageContextMenu(e, message)
                    }
                  >
                    {!systemMsg && (
                      <div className="message-avatar">
                        {message.avatar || message.photo_de_profil ? (
                          <img
                            src={message.avatar || message.photo_de_profil}
                            alt={message.nom}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {message.nom ? message.nom[0].toUpperCase() : "?"}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`message-content ${
                        systemMsg ? "system-content" : ""
                      }`}
                    >
                      {!systemMsg &&
                        (message.parent_id || message.parent_message) &&
                        (() => {
                          let replyContent = null;
                          if (message.parent_message) {
                            replyContent = (
                              <>
                                <span className="reply-author">
                                  @{message.parent_message.nom}
                                </span>
                                <span className="reply-text">
                                  {message.parent_message.contenu}
                                </span>
                              </>
                            );
                          } else {
                            const parentMessage = messages.find(
                              (m) => m.id_message === message.parent_id
                            );
                            replyContent = parentMessage ? (
                              <>
                                <span className="reply-author">
                                  @{parentMessage.nom}
                                </span>
                                <span className="reply-text">
                                  {parentMessage.contenu}
                                </span>
                              </>
                            ) : (
                              <span className="reply-text">
                                Message original non disponible
                              </span>
                            );
                          }
                          return (
                            <div
                              className="message-reply-to"
                              onClick={() => {
                                const parentId =
                                  message.parent_id ||
                                  (message.parent_message &&
                                    message.parent_message.id_message);
                                if (parentId) {
                                  const element = document.getElementById(
                                    `msg-${parentId}`
                                  );
                                  if (element) {
                                    element.scrollIntoView({
                                      behavior: "smooth",
                                      block: "center",
                                    });
                                    element.classList.add("highlight-message");
                                    setTimeout(
                                      () =>
                                        element.classList.remove(
                                          "highlight-message"
                                        ),
                                      2000
                                    );
                                  }
                                }
                              }}
                            >
                              <FaReply className="reply-icon" />
                              <div className="reply-content">
                                {replyContent}
                              </div>
                            </div>
                          );
                        })()}{" "}
                      {!systemMsg && (
                        <div className="message-header">
                          <span className="message-author">
                            {message.fk_utilisateur ===
                            "00000000-0000-0000-0000-000000000001" ? (
                              <>
                                {" "}
                                <strong
                                  className="username-clickable"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(
                                      `/direct-messages?userId=00000000-0000-0000-0000-000000000001`
                                    );
                                  }}
                                  title="Cliquer pour envoyer un message privé"
                                >
                                  {message.nom}
                                </strong>
                                <span className="bot-icon-spacer"> </span>
                                <FaRobot className="bot-icon" />
                              </>
                            ) : (
                              <strong
                                className="username-clickable"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigate(
                                    `/direct-messages?userId=${message.fk_utilisateur}`
                                  );
                                }}
                                title="Cliquer pour envoyer un message privé"
                              >
                                {message.nom}
                              </strong>
                            )}{" "}
                          </span>
                          <span className="message-time">
                            {formatMessageDate(message.date_creation)}
                            {message.updated_at &&
                              message.created_at !== message.updated_at && (
                                <span
                                  className="message-edited"
                                  title={`Modifié le ${formatMessageDate(
                                    message.updated_at
                                  )}`}
                                >
                                  {" "}
                                  (modifié)
                                </span>
                              )}
                          </span>
                        </div>
                      )}
                      {(() => {
                        const fileData = parseFileContent(message.contenu);
                        if (fileData && !systemMsg) {
                          const fullFileUrl = `https://s3-supchat.s3.fr-par.scw.cloud/${fileData.fileUrl}`;
                          if (fileData.isImage) {
                            return (
                              <div className="message-image-container">
                                <img
                                  src={fullFileUrl}
                                  alt={fileData.fileName}
                                  className="message-image"
                                  onClick={() =>
                                    handleOpenFileViewer({
                                      ...fileData,
                                      fullFileUrl,
                                    })
                                  }
                                />
                              </div>
                            );
                          }
                          return (
                            <div className="message-file-compact">
                              <div className="file-icon-wrapper">
                                {getFileIcon(
                                  fileData.fileName,
                                  fileData.fileType
                                )}
                              </div>
                              <div className="file-details">
                                <div
                                  className="file-name"
                                  title={fileData.fileName}
                                >
                                  {fileData.fileName}
                                </div>
                                <div className="file-meta">
                                  <span className="file-type">
                                    {getFileType(fileData.fileName)}
                                  </span>
                                  <span className="file-size">
                                    {formatFileSize(
                                      parseInt(fileData.fileSize) || 0
                                    )}
                                  </span>
                                </div>
                              </div>
                              <button
                                className="file-download-btn"
                                onClick={() =>
                                  handleDownloadFile(
                                    fileData.fileUrl,
                                    fileData.fileName
                                  )
                                }
                                title="Télécharger le fichier"
                              >
                                {getDownloadIcon("16px")}
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="message-text">
                              <ReactMarkdown
                                components={{
                                  p: ({ node, ...props }) => (
                                    <p
                                      {...props}
                                      className="message-paragraph"
                                    />
                                  ),
                                  a: ({ node, href, children, ...props }) => {
                                    const mentionMatch =
                                      Array.isArray(children) &&
                                      children[0]?.props?.children &&
                                      typeof children[0].props.children ===
                                        "string" &&
                                      children[0].props.children.match(
                                        /^@(.+)$/
                                      );
                                    if (mentionMatch && isUuid(href)) {
                                      const mentionName = mentionMatch[1];
                                      const isCurrentUser =
                                        href === currentUserId;
                                      return (
                                        <span
                                          className={`mention-highlight ${
                                            isCurrentUser
                                              ? "current-user-mention"
                                              : ""
                                          }`}
                                          data-userid={href}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(
                                              `/direct-messages?userId=${href}`
                                            );
                                          }}
                                          style={{ cursor: "pointer" }}
                                          title="Cliquer pour envoyer un message privé"
                                        >
                                          @{mentionName}
                                        </span>
                                      );
                                    }
                                    if (
                                      systemMsg &&
                                      href &&
                                      href.includes("strawpoll.com")
                                    ) {
                                      return (
                                        <a
                                          href={href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="message-link"
                                        >
                                          {children}
                                        </a>
                                      );
                                    }
                                    return (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="message-link"
                                        onClick={(e) => {
                                          if (isUuid(href)) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(
                                              `/direct-messages?userId=${href}`
                                            );
                                            return;
                                          }
                                        }}
                                      >
                                        {children}
                                      </a>
                                    );
                                  },
                                  text: ({ node, ...props }) => (
                                    <>{renderTextWithLinks(node.value)}</>
                                  ),
                                }}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                              >
                                {message.contenu || ""}
                              </ReactMarkdown>

                              {message.file_url && (
                                // Affichage des fichiers
                                <div className="message-file">
                                  {/* Code pour afficher les fichiers */}
                                  <div className="file-preview">
                                    {/* Ajuster selon la structure de vos données */}
                                    <a
                                      href={message.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleOpenFileViewer(message);
                                      }}
                                    >
                                      {message.file_name || "Fichier joint"}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })()}
                      {!systemMsg &&
                        message.reactions &&
                        message.reactions.length > 0 && (
                          <div className="message-reactions">
                            {message.reactions.map((reaction) => (
                              <span
                                className="reaction-badge"
                                key={reaction.reaction_type}
                              >
                                <span className="reaction-emoji">
                                  {reaction.emoji}
                                </span>
                                <span className="reaction-count">
                                  {reaction.count}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      {!systemMsg &&
                        (() => {
                          const strawpollMatch =
                            message.contenu &&
                            message.contenu.match(
                              /\[strawpoll:([a-zA-Z0-9]+)\]/
                            );
                          if (strawpollMatch) {
                            const pollId = strawpollMatch[1];
                            return (
                              <div className="message-poll-buttons">
                                <button
                                  className="poll-button poll-results-button"
                                  onClick={() =>
                                    window.handleOpenStrawpollResults &&
                                    window.handleOpenStrawpollResults(pollId)
                                  }
                                >
                                  <FaPoll /> Voir les résultats
                                </button>
                                <button
                                  className="poll-button poll-vote-button"
                                  onClick={() =>
                                    window.handleOpenStrawpollVote &&
                                    window.handleOpenStrawpollVote(pollId)
                                  }
                                >
                                  <FaVoteYea /> Voter
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-messages">
                <p>Aucun message dans ce canal.</p>
                <p>Envoyez le premier message !</p>
              </div>
            )}
            {isMistralTyping && (
              <div className="chat-message other-message typing-indicator">
                <div className="message-avatar">
                  <img
                    src="https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp"
                    alt="Mistral AI"
                  />
                </div>
                <div className="message-content">
                  {" "}
                  <div className="message-header">
                    {" "}
                    <span className="message-author">
                      {" "}
                      <strong
                        className="username-clickable"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(
                            `/direct-messages?userId=00000000-0000-0000-0000-000000000001`
                          );
                        }}
                        title="Cliquer pour envoyer un message privé"
                      >
                        Mistral AI
                      </strong>
                      <span className="bot-icon-spacer"> </span>
                      <FaRobot className="bot-icon" />
                    </span>
                    <span className="message-time"></span>
                  </div>
                  <div className="message-text">
                    <p className="message-paragraph">
                      <i>est en train d'écrire...</i>
                      <span className="typing-animation"></span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {canWriteInChannel ? (
            <div className="chat-input-area">
              {showMentionSuggestions && (
                <div id="supchat-mentions-dropdown">
                  <div id="supchat-mentions-header">
                    <span>@</span>
                    <span>Mentionner un utilisateur</span>
                  </div>
                  <div id="supchat-mentions-list">
                    {mentionSuggestions.length > 0 ? (
                      mentionSuggestions.map((user, index) => (
                        <button
                          key={user.id}
                          className={`supchat-mention-item ${
                            index === activeMentionIndex ? "active" : ""
                          }`}
                          onClick={() => handleSelectMention(user)}
                        >
                          <div className="supchat-mention-avatar-wrapper">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="supchat-mention-avatar"
                              />
                            ) : (
                              <div className="supchat-mention-avatar">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {user.isBot && (
                              <div className="supchat-mention-bot-badge">
                                <FaRobot style={{ fontSize: "8px" }} />
                              </div>
                            )}
                          </div>
                          <div className="supchat-mention-details">
                            <div className="supchat-mention-name">
                              {user.name}
                            </div>
                            <div className="supchat-mention-info">
                              {user.isBot ? (
                                <>Assistant IA</>
                              ) : (
                                <>
                                  <span
                                    className={`supchat-mention-status ${
                                      user.status || "offline"
                                    }`}
                                  ></span>
                                  {user.status === "online"
                                    ? "En ligne"
                                    : "Hors ligne"}
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="supchat-mention-no-results">
                        Aucun utilisateur ne correspond à votre recherche
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form
                className="chat-input-container"
                onSubmit={
                  editingMessage
                    ? (e) => {
                        e.preventDefault();
                        handleUpdateMessage();
                      }
                    : handleSendMessageWithMistralCheck
                }
              >
                {editingMessage && (
                  <div className="editing-message">
                    <div className="edit-info">
                      <FaEdit className="edit-icon" />
                      <span>Modification d'un message</span>
                    </div>
                    <button
                      type="button"
                      className="cancel-edit"
                      onClick={handleCancelEdit}
                    >
                      ×
                    </button>
                  </div>
                )}
                {replyingTo && !editingMessage && (
                  <div className="replying-to">
                    <div className="reply-info">
                      <FaReply className="reply-icon" />
                      <span>
                        Réponse à <strong>{replyingTo.nom}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="cancel-reply"
                      onClick={handleCancelReply}
                    >
                      ×
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  id="file-upload-input"
                />
                <div className="chat-input-wrapper">
                  <button
                    type="button"
                    className="chat-attachment-btn"
                    onClick={() =>
                      fileInputRef.current && fileInputRef.current.click()
                    }
                    title="Ajouter un fichier"
                  >
                    <FaPaperclip />
                  </button>
                  <input
                    type="text"
                    placeholder={
                      activeChannel
                        ? `Message dans #${activeChannel.name}`
                        : "Message..."
                    }
                    value={displayMessage}
                    onChange={(e) => handleNewMessageChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (showChannelSuggestions) {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          handleChannelSuggestionNavigation("next");
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          handleChannelSuggestionNavigation("prev");
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          handleSelectActiveChannelSuggestion();
                        }
                      } else if (showMentionSuggestions) {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          handleMentionNavigation("next");
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          handleMentionNavigation("prev");
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          handleSelectActiveItem();
                        }
                      } else if (editingMessage) {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          handleCancelEdit();
                        } else if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateMessage();
                        }
                      } else {
                        handleChatInputKeyDown && handleChatInputKeyDown(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={`chat-toolbox-btn ${
                      showToolbox ? "active" : ""
                    }`}
                    title="Outils"
                    onClick={handleToggleToolbox}
                  >
                    <FaTools />
                    <span className="toolbox-tooltip">Outils</span>
                  </button>
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!displayMessage.trim()}
                    aria-label={
                      editingMessage
                        ? "Modifier le message"
                        : "Envoyer le message"
                    }
                  >
                    {editingMessage ? (
                      <>
                        <FaEdit />
                        <span className="send-btn-pulse"></span>
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        <span className="send-btn-pulse"></span>
                      </>
                    )}
                  </button>
                </div>{" "}
                {showToolbox && (
                  <div className="chat-toolbox-menu">
                    <button
                      className="chat-toolbox-item"
                      onClick={handleOpenStrawpoll}
                    >
                      <FaPoll className="toolbox-item-icon" />
                      <span className="toolbox-item-text">
                        Créer un sondage
                      </span>
                    </button>
                    <button
                      className="chat-toolbox-item"
                      onClick={handleOpenGoogleDrive}
                    >
                      <FaGoogle className="toolbox-item-icon" />
                      <span className="toolbox-item-text">Google Drive</span>
                    </button>
                    {/* Les boutons "Rechercher une image" et "Formater du code" ont été supprimés */}
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div
              className="read-only-message"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 20px",
                margin: "10px 20px",
                background:
                  "linear-gradient(145deg, rgba(40, 40, 45, 0.4), rgba(50, 50, 55, 0.3))",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                color: "rgba(255, 255, 255, 0.7)",
                textAlign: "center",
              }}
            >
              <FaCommentSlash
                style={{
                  fontSize: "1.5rem",
                  color: "#ff4757",
                  marginRight: "10px",
                  filter: "drop-shadow(0 1px 3px rgba(255, 71, 87, 0.4))",
                }}
              />
              <p
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  letterSpacing: "0.02em",
                  margin: "0",
                }}
              >
                Vous êtes en lecture seule dans ce canal
              </p>
            </div>
          )}        </div>
      )}
      
      {/* Google Drive Modal */}
      {showGoogleDriveModal && (
        <GoogleDriveModal
          isOpen={showGoogleDriveModal}
          onClose={handleCloseGoogleDrive}
          onFilesSelected={onFilesSelected}
          mode="workspace"
          workspaceId={workspaceId}
          canalId={activeChannel?.id}
          socket={socket}
        />
      )}
    </div>
  );
}

export default ChatContainer;
