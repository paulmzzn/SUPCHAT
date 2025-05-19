import React from "react";
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

} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

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
  handleStrawpollSubmit,
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

}) {
  const canWriteInChannel = activeChannel?.isPrivate ? currentUserAccessRight === "lecture_ecriture" : true;

  return (
    <div className="workspace-content-area">
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
                <div className="read-only-indicator" title="Canal en lecture seule">
                  <FaEye /> Lecture seule
                </div>
              )}
            </div>
          </div>
          <div className="chat-messages" ref={chatContainerRef}>
            {loadingMessages ? (
              <div className="chat-loading">Chargement des messages...</div>
            ) : messages.length > 0 ? (
              messages.map((message) => {
                const systemMsg =
                  message.is_system_message ||
                  message.fk_utilisateur ===
                    "00000000-0000-0000-0000-000000000003";
                return (
                  <div
                    key={message.id_message}
                    id={`msg-${message.id_message}`}
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
                                <strong
                                  className="username-clickable"
                                  onClick={() =>
                                    handleSelectMention({
                                      id: "00000000-0000-0000-0000-000000000001",
                                      name: message.nom,
                                      avatar:
                                        "https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp",
                                    })
                                  }
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
                                onClick={() =>
                                  handleSelectMention({
                                    id: message.fk_utilisateur,
                                    name: message.nom,
                                  })
                                }
                                title="Cliquer pour mentionner cet utilisateur"
                              >
                                {message.nom}
                              </strong>
                            )}
                          </span>
                          <span className="message-time">
                            {formatMessageDate(message.date_creation)}
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
                            <div className="message-file">
                              <div className="file-info-container">
                                <div className="file-details">
                                  <span className="file-name">
                                    {fileData.fileName}
                                  </span>
                                  <span className="file-size">
                                    {fileData.fileSize}
                                  </span>
                                </div>
                                <div className="file-actions">
                                  <button
                                    className="file-view-button"
                                    onClick={() =>
                                      handleOpenFileViewer({
                                        ...fileData,
                                        fullFileUrl,
                                      })
                                    }
                                  >
                                    Ouvrir
                                  </button>
                                  <button
                                    className="file-download-button"
                                    onClick={() =>
                                      handleDownloadFile(
                                        fileData.fileUrl,
                                        fileData.fileName
                                      )
                                    }
                                  >
                                    Télécharger
                                  </button>
                                </div>
                              </div>
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
                    <span className="message-author">
                      <strong
                        className="username-clickable"
                        onClick={() =>
                          handleSelectMention({
                            id: "00000000-0000-0000-0000-000000000001",
                            name: "Mistral AI",
                            avatar:
                              "https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp",
                          })
                        }
                        title="Cliquer pour envoyer un message à Mistral AI"
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
                onSubmit={handleSendMessageWithMistralCheck}
              >
                {replyingTo && (
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
                      } else {
                        handleChatInputKeyDown && handleChatInputKeyDown(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={`chat-toolbox-btn ${showToolbox ? "active" : ""}`}
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
                    aria-label="Envoyer le message"
                  >
                    <FaPaperPlane />
                    <span className="send-btn-pulse"></span>
                  </button>
                </div>
                
                {showToolbox && (
                  <div className="chat-toolbox-menu">
                    <button
                      className="chat-toolbox-item"
                      onClick={handleOpenStrawpoll}
                    >
                      <FaPoll className="toolbox-item-icon" />
                      <span className="toolbox-item-text">Créer un sondage</span>
                    </button>
                    <button className="chat-toolbox-item">
                      <FaImage className="toolbox-item-icon" />
                      <span className="toolbox-item-text">
                        Rechercher une image
                      </span>
                    </button>
                    <button className="chat-toolbox-item">
                      <FaCode className="toolbox-item-icon" />
                      <span className="toolbox-item-text">Formater du code</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="read-only-message" style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 20px',
              margin: '10px 20px',
              background: 'linear-gradient(145deg, rgba(40, 40, 45, 0.4), rgba(50, 50, 55, 0.3))',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center'
            }}>
              <FaCommentSlash style={{
                fontSize: '1.5rem',
                color: '#ff4757',
                marginRight: '10px',
                filter: 'drop-shadow(0 1px 3px rgba(255, 71, 87, 0.4))'
              }} />
              <p style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                letterSpacing: '0.02em',
                margin: '0'
              }}>Vous êtes en lecture seule dans ce canal</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatContainer;
