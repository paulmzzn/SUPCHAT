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
  handleSelectActiveItem,
  setShowVideoCallModal,
  handleOpenStrawpollVote,
  showChannelSuggestions,
  channelSuggestions,
  activeChannelSuggestionIndex,
  handleChannelSuggestionNavigation,
  handleSelectActiveChannelSuggestion,
  handleSelectChannelSuggestion,
}) {
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
                        })()}

                      {!systemMsg && (
                        <div className="message-header">
                          <span className="message-author">
                            {message.fk_utilisateur ===
                            "00000000-0000-0000-0000-000000000001" ? (
                              <>
                                <span>{message.nom}</span>
                                <span className="bot-icon-spacer"> </span>
                                <FaRobot className="bot-icon" />
                              </>
                            ) : (
                              message.nom
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
                                    // Enhanced mention handling - detect mentions formatted as @[username](userId)
                                    const mentionMatch =
                                      Array.isArray(children) &&
                                      children[0]?.props?.children &&
                                      typeof children[0].props.children ===
                                        "string" &&
                                      children[0].props.children.match(
                                        /^@(.+)$/
                                      );

                                    if (mentionMatch && isUuid(href)) {
                                      // This is a mention - create a styled badge
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

                                    // For regular links or system messages with strawpoll links
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
                  <div className="message-header">
                    <span className="message-author">
                      Mistral AI
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

          <div className="chat-input-area">
            {(() => {
              console.log("showChannelSuggestions:", showChannelSuggestions);
              console.log("channelSuggestions:", channelSuggestions);
              console.log("displayMessage:", displayMessage);
              return (
                showChannelSuggestions &&
                channelSuggestions.length > 0 && (
                  <div id="supchat-channels-dropdown">
                    <div id="supchat-channels-header">
                      <span>#</span>
                      <span>Mentionner un canal</span>
                    </div>
                    <div id="supchat-channels-list">
                      {channelSuggestions.map((canal, index) => (
                        <button
                          key={canal.id}
                          className={`supchat-channel-item ${
                            index === activeChannelSuggestionIndex
                              ? "active"
                              : ""
                          }`}
                          onClick={() => handleSelectChannelSuggestion(canal)}
                          type="button"
                        >
                          <FaHashtag style={{ marginRight: 6 }} />
                          <span className="supchat-channel-name">
                            {canal.name}
                          </span>
                          {canal.isPrivate && (
                            <FaLock style={{ marginLeft: 6, fontSize: 10 }} />
                          )}
                          <span className="supchat-channel-desc">
                            {canal.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              );
            })()}
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
                        handleMentionSuggestionNavigation("next");
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        handleMentionSuggestionNavigation("prev");
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        handleSelectActiveMention();
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
        </div>
      )}
    </div>
  );
}

export default ChatContainer;
