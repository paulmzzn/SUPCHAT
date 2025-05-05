import React from "react";
import { FaLock, FaHashtag, FaReply, FaRobot, FaSmile, FaPaperclip, FaWrench, FaPoll, FaVideo } from "react-icons/fa";
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
  setShowVideoCallModal, // Nouveau prop pour gérer l'ouverture du modal d'appel vidéo
}) {
  // Helper function to determine if a message is a system message
  const isSystemMessage = (message) => {
    return message.is_system_message || message.fk_utilisateur === '00000000-0000-0000-0000-000000000003';
  };

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
                const systemMsg = isSystemMessage(message);
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
                    onContextMenu={(e) => !systemMsg && handleMessageContextMenu(e, message)}
                  >
                    {!systemMsg && (
                      <div className="message-avatar">
                        {message.photo_de_profil ? (
                          <img src={message.photo_de_profil} alt={message.nom} />
                        ) : (
                          <div className="avatar-placeholder">
                            {message.nom ? message.nom[0].toUpperCase() : "?"}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`message-content ${systemMsg ? "system-content" : ""}`}>
                      {/* Render reply info only for non-system messages */}
                      {!systemMsg && (message.parent_id || message.parent_message) && (() => {
                        let replyContent = null;
                        if (message.parent_message) {
                          replyContent = (
                            <>
                              <span className="reply-author">@{message.parent_message.nom}</span>
                              <span className="reply-text">{message.parent_message.contenu}</span>
                            </>
                          );
                        } else {
                          const parentMessage = messages.find((m) => m.id_message === message.parent_id);
                          replyContent = parentMessage ? (
                            <>
                              <span className="reply-author">@{parentMessage.nom}</span>
                              <span className="reply-text">{parentMessage.contenu}</span>
                            </>
                          ) : (
                            <span className="reply-text">Message original non disponible</span>
                          );
                        }
                        return (
                          <div className="message-reply-to" onClick={() => {
                            const parentId = message.parent_id || (message.parent_message && message.parent_message.id_message);
                            if (parentId) {
                              const element = document.getElementById(`msg-${parentId}`);
                              if (element) {
                                element.scrollIntoView({ behavior: "smooth", block: "center" });
                                element.classList.add("highlight-message");
                                setTimeout(() => element.classList.remove("highlight-message"), 2000);
                              }
                            }
                          }}>
                            <FaReply className="reply-icon" />
                            <div className="reply-content">{replyContent}</div>
                          </div>
                        );
                      })()}

                      {/* Render header only for non-system messages */}
                      {!systemMsg && (
                        <div className="message-header">
                          <span className="message-author">
                            {message.fk_utilisateur === "00000000-0000-0000-0000-000000000001" ? (
                              <>
                                <span>{message.nom}</span>
                                <span className="bot-icon-spacer"> </span>
                                <FaRobot className="bot-icon" />
                              </>
                            ) : (
                              message.nom
                            )}
                          </span>
                          <span className="message-time">{formatMessageDate(message.date_creation)}</span>
                        </div>
                      )}

                      {/* Affichage du contenu du message (texte, fichier, image, markdown, etc.) */}
                      {(() => {
                        const fileData = parseFileContent(message.contenu);
                        if (fileData && !systemMsg) { // Don't render files for system messages
                          const fullFileUrl = `https://s3-supchat.s3.fr-par.scw.cloud/${fileData.fileUrl}`;
                          if (fileData.isImage) {
                            return (
                              <div className="message-image-container">
                                <img
                                  src={fullFileUrl}
                                  alt={fileData.fileName}
                                  className="message-image"
                                  onClick={() => handleOpenFileViewer({ ...fileData, fullFileUrl })}
                                />
                              </div>
                            );
                          }
                          return (
                            <div className="message-file">
                              <div className="file-info-container">
                                <div className="file-details">
                                  <span className="file-name">{fileData.fileName}</span>
                                  <span className="file-size">{fileData.fileSize}</span>
                                </div>
                                <div className="file-actions">
                                  <button className="file-view-button" onClick={() => handleOpenFileViewer({ ...fileData, fullFileUrl })}>Ouvrir</button>
                                  <button className="file-download-button" onClick={() => handleDownloadFile(fileData.fileUrl, fileData.fileName)}>Télécharger</button>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="message-text">
                              <ReactMarkdown
                                components={{
                                  p: ({ node, ...props }) => <p {...props} className="message-paragraph" />,
                                  a: ({ node, href, children, ...props }) => {
                                    if (isUuid && isUuid(href)) {
                                      return <span className="mention-highlight" data-userid={href}>@{children}</span>;
                                    }
                                    if (systemMsg && href && href.includes('strawpoll.com')) {
                                      return <a href={href} target="_blank" rel="noopener noreferrer" className="message-link">{children}</a>;
                                    }
                                    return <a href={href} target="_blank" rel="noopener noreferrer" className="message-link">{children}</a>;
                                  },
                                  text: ({ node, ...props }) => <>{renderTextWithLinks(node.value)}</>,
                                }}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                              >
                                {message.contenu || ''}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                      })()}

                      {/* Affichage des réactions (only for non-system messages) */}
                      {!systemMsg && message.reactions && message.reactions.length > 0 && (
                        <div className="message-reactions">
                          {message.reactions.map((reaction) => (
                            <span className="reaction-badge" key={reaction.reaction_type}>
                              <span className="reaction-emoji">{reaction.emoji}</span>
                              <span className="reaction-count">{reaction.count}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* BOUTON STRAWPOLL RESULTATS (only for non-system messages) */}
                      {!systemMsg && (() => {
                        const strawpollMatch = message.contenu && message.contenu.match(/\[strawpoll:([a-zA-Z0-9]+)\]/);
                        if (strawpollMatch) {
                          const pollId = strawpollMatch[1];
                          return (
                            <div style={{display:'flex',gap:8,marginTop:8}}>
                              <button
                                className="strawpoll-results-btn"
                                style={{background:"linear-gradient(90deg,#9348b7,#b05fdf)",color:"#fff",border:"none",borderRadius:6,padding:"6px 16px",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}
                                onClick={() => window.handleOpenStrawpollResults && window.handleOpenStrawpollResults(pollId)}
                              >
                                <FaPoll style={{fontSize:18}} /> Voir les résultats du sondage
                              </button>
                              <a
                                href={`https://strawpoll.com/${pollId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="strawpoll-vote-btn"
                                style={{background:"linear-gradient(90deg,#7abbff,#9348b7)",color:"#fff",border:"none",borderRadius:6,padding:"6px 16px",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:8,textDecoration:'none'}}
                              >
                                Voter
                              </a>
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
                        className={`supchat-mention-item ${index === activeMentionIndex ? "active" : ""}`}
                        onClick={() => handleSelectMention(user)}
                        type="button"
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
                          <div className="supchat-mention-name">{user.name}</div>
                          <div className="supchat-mention-info">
                            {user.isBot ? (
                              <>Assistant IA</>
                            ) : (
                              <>
                                <span className={`supchat-mention-status ${user.status || "offline"}`}></span>
                                {user.status === "online" ? "En ligne" : "Hors ligne"}
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

            <form className="chat-input-container" onSubmit={handleSendMessageWithMistralCheck}>
              {replyingTo && (
                <div className="replying-to">
                  <div className="reply-info">
                    <FaReply className="reply-icon" />
                    <span>
                      Réponse à <strong>{replyingTo.nom}</strong>
                    </span>
                  </div>
                  <button type="button" className="cancel-reply" onClick={handleCancelReply}>
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
                <button type="button" className="chat-attachment-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                  <FaPaperclip />
                </button>
                <input
                  type="text"
                  placeholder={activeChannel ? `Message dans #${activeChannel.name}` : "Message..."}
                  value={displayMessage}
                  onChange={(e) => handleNewMessageChange(e.target.value)}
                  onKeyDown={handleChatInputKeyDown}
                />
                <button type="button" className="chat-toolbox-btn" title="Outils" onClick={handleToggleToolbox} style={{ marginLeft: 4, marginRight: 4 }}>
                  <FaWrench />
                </button>
                <button type="button" className="chat-emoji-btn" onClick={() => setShowEmojiPicker(true)}>
                  <FaSmile />
                </button>
              </div>
              <button type="submit" className="chat-send-btn" disabled={!displayMessage.trim()}>
                Envoyer
              </button>
            </form>
            {showToolbox && (
              <div className="chat-toolbox-menu" style={{ position: "absolute", bottom: 60, right: 30, zIndex: 2000, background: "#232323", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", minWidth: 220 }}>
                <button className="chat-toolbox-item" style={{ width: "100%", padding: "12px 18px", background: "none", border: "none", color: "white", textAlign: "left", cursor: "pointer", fontSize: "1rem" }} onClick={handleOpenStrawpoll}>
                  📊 Créer un sondage Strawpoll
                </button>
              </div>
            )}
            {showStrawpollModal && (
              <div className="modal-overlay" onClick={handleCloseStrawpollModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatContainer;
