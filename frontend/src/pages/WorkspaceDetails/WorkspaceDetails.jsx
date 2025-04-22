import React, { useRef } from "react"; // Ajout de useRef
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  FaSearch,
  FaPlus,
  FaHashtag,
  FaLock,
  FaChevronDown,
  FaChevronRight,
  FaUserCircle,
  FaFile,
  FaImage,
  FaFileAlt,
  FaFileWord,
  FaFilePdf,
  FaFileExcel,
  FaGlobe,
  FaCrown,
  FaUserShield,
  FaUser,
  FaEdit,
  FaTrashAlt,
  FaPaperPlane,
  FaSmile,
  FaPaperclip,
  FaReply,
  FaRegSmile,
  FaRobot,
  FaAt,
  FaTimes, // Pour annuler le fichier
  FaSpinner, // Pour l'indicateur de chargement
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "./WorkspaceDetails.css";
import { useWorkspaceDetails } from "../../hooks/useWorkspaceDetails";

// Nouvelle fonction pour rendre les liens cliquables
const renderTextWithLinks = (text) => {
  if (!text) return "";

  // Regex pour identifier les URLs dans le texte
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Diviser le texte en parties (texte normal et liens)
  const parts = text.split(urlRegex);

  // Trouver tous les liens dans le texte
  const matches = text.match(urlRegex) || [];

  // Reconstruire le texte avec les liens cliquables
  return parts.map((part, i) => {
    // Si la partie correspond à un lien
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
    // Sinon, c'est du texte normal
    return part;
  });
};

// Helper pour afficher le bon icône de fichier
const getFileIcon = (type) => {
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

// Function pour obtenir l'icône du rôle
const getRoleIcon = (role) => {
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

// Helper function moved outside the hook for potential reuse or testing
const formatMessageDate = (dateString) => {
  if (!dateString) {
    console.warn("formatMessageDate: date invalide", dateString);
    return "";
  }
  try {
    // 1. Créer une date à partir du string
    const date = new Date(dateString);

    // 2. Correction MANUELLE du décalage total (4h de la DB + 2h d'affichage = 6h)
    // Nous créons une nouvelle date avec le décalage appliqué
    const correctedDate = new Date(date.getTime() + 2 * 60 * 60 * 1000); // +2h pour compenser le décalage d'affichage

    const now = new Date();
    const nowParis = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Appliquer le même décalage à "maintenant"

    // 3. Formater l'heure sans utiliser les options de fuseau horaire qui peuvent causer des problèmes
    const hours = correctedDate.getHours().toString().padStart(2, "0");
    const minutes = correctedDate.getMinutes().toString().padStart(2, "0");

    // 4. Comparer si c'est aujourd'hui (après correction)
    const isSameDay =
      correctedDate.getDate() === nowParis.getDate() &&
      correctedDate.getMonth() === nowParis.getMonth() &&
      correctedDate.getFullYear() === nowParis.getFullYear();

    if (isSameDay) {
      return `${hours}:${minutes}`;
    } else {
      // Si ce n'est pas aujourd'hui, inclure la date
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

// Ajouter une fonction d'aide pour logger les interactions avec Mistral
const debugMistralInteraction = (message) => {
  console.log(`[Mistral Debug] ${message}`);
};

function WorkspaceDetails() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const chatContainerRef = useRef(null); // Ref pour le conteneur de messages
  const inputRef = useRef(null); // Ref pour l'input texte
  const fileInputRef = useRef(null); // Ref pour l'input fichier caché

  const {
    workspace,
    loading,
    error,
    searchQuery,
    channels,
    showChannels,
    canalsLoading,
    canalsError,
    showMembers,
    showOnlineMembers,
    showOfflineMembers,
    showFiles,
    showImages,
    members,
    files,
    images,
    showCreateChannelModal,
    newChannel,
    isCreatingChannel,
    channelError,
    contextMenu,
    showEditChannelModal,
    editingChannel,
    isUpdatingChannel,
    updateChannelError,
    activeChannel,
    messages,
    newMessage,
    displayMessage,
    loadingMessages,
    socket,
    currentUserId,
    currentUserName,
    messageContextMenu,
    showEmojiPicker,
    replyingTo,
    commonEmojis,
    isMistralTyping,
    showMentionSuggestions,
    mentionSuggestions,
    activeMentionIndex,
    handleSearchChange,
    toggleChannelsVisibility,
    handleChannelInputChange,
    handleCreateChannel,
    handleCloseModal,
    handleSubmitChannel,
    handleChannelContextMenu,
    handleEditChannel,
    handleSubmitEditChannel,
    handleDeleteChannel,
    handleSelectChannel,
    handleSendMessage,
    handleMessageContextMenu,
    handleCloseMessageContextMenu,
    handleReplyMessage,
    handleShowEmojiPicker,
    handleAddReaction,
    handleCancelReply,
    toggleMembers,
    toggleOnlineMembers,
    toggleOfflineMembers,
    toggleFiles,
    toggleImages,
    setNewChannel,
    setEditingChannel,
    setShowEditChannelModal,
    setShowEmojiPicker,
    setNewMessage,
    getEmojiForType,
    handleNewMessageChange,
    handleSelectMention,
    handleMentionNavigation,
    handleSelectActiveItem,
    handleChatInputKeyDown, // <-- Assurez-vous que cette ligne est présente
    handleDeleteMessage,
    handleMistralMention,
    selectedFile,
    uploadingFile,
    uploadError,
    handleFileSelect,
    handleCancelFile,
  } = useWorkspaceDetails(workspaceId);

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
    if (e.target) {
      e.target.value = null;
    }
  };

  const handleOpenProfile = (member) => {
    navigate(`/profile/${member.id}`);
  };

  const handleSendMessageWithMistralCheck = (e) => {
    if (e) e.preventDefault();
    if (!displayMessage.trim()) return;
    const isMistralMention = handleMistralMention(displayMessage);
    if (!isMistralMention) {
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="workspace-details-container">
          <div className="loading">Chargement des détails du workspace...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="workspace-details-container">
          <div className="error">Erreur : {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="workspace-detail-layout">
        <div className="workspace-sidebar">
          <div className="workspace-sidebar-header">
            <div className="workspace-profile">
              {workspace && (
                <>
                  <div
                    className="workspace-avatar"
                    style={{ backgroundImage: `url(${workspace.icon})` }}
                  ></div>
                  <h2 className="workspace-name">{workspace.name}</h2>
                </>
              )}
            </div>

            <div className="workspace-search">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher des canaux..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <div className="workspace-sidebar-content">
            <div className="channels-section">
              <div
                className="section-header"
                onClick={toggleChannelsVisibility}
              >
                {showChannels ? (
                  <FaChevronDown className="toggle-icon" />
                ) : (
                  <FaChevronRight className="toggle-icon" />
                )}
                <h3>Canaux</h3>
                <button
                  className="add-channel-btn"
                  onClick={handleCreateChannel}
                >
                  <FaPlus />
                </button>
              </div>

              {showChannels && (
                <ul className="channels-list">
                  {canalsLoading ? (
                    <li className="channel-loading">
                      Chargement des canaux...
                    </li>
                  ) : canalsError ? (
                    <li className="channel-error">Erreur: {canalsError}</li>
                  ) : channels.length > 0 ? (
                    channels.map((channel) => (
                      <li
                        key={channel.id}
                        className={`channel-item ${
                          activeChannel && activeChannel.id === channel.id
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleSelectChannel(channel)}
                        onContextMenu={(e) =>
                          handleChannelContextMenu(e, channel)
                        }
                      >
                        {channel.isPrivate ? (
                          <FaLock className="channel-icon" />
                        ) : (
                          <FaHashtag className="channel-icon" />
                        )}
                        <span className="channel-name">{channel.name}</span>
                      </li>
                    ))
                  ) : (
                    <li className="no-channels">Aucun canal trouvé</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="workspace-content-area">
          <div className="glow-circle-right top-right"></div>
          <div className="glow-circle-left bottom-left"></div>

          {!activeChannel ? (
            <div className="workspace-welcome">
              <h1>Bienvenue sur {workspace?.name}</h1>
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
                  <button className="header-action-btn">
                    <FaUserCircle />
                    <span>Membres</span>
                  </button>
                </div>
              </div>

              <div className="chat-messages" ref={chatContainerRef}>
                {loadingMessages ? (
                  <div className="chat-loading">Chargement des messages...</div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id_message}
                      id={`msg-${message.id_message}`}
                      className={`chat-message ${
                        message.fk_utilisateur === currentUserId
                          ? "own-message"
                          : "other-message"
                      }`}
                      onContextMenu={(e) =>
                        handleMessageContextMenu(e, message)
                      }
                    >
                      <div className="message-avatar">
                        {message.photo_de_profil ? (
                          <img
                            src={message.photo_de_profil}
                            alt={message.nom}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {message.nom ? message.nom[0].toUpperCase() : "?"}
                          </div>
                        )}
                      </div>
                      <div className="message-content">
                        {(message.parent_id || message.parent_message) && (
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
                                } else {
                                  console.log(
                                    `Message parent avec ID ${parentId} non trouvé dans la vue actuelle`
                                  );
                                }
                              }
                            }}
                          >
                            <FaReply className="reply-icon" />
                            <div className="reply-content">
                              {message.parent_message ? (
                                <>
                                  <span className="reply-author">
                                    @{message.parent_message.nom}
                                  </span>
                                  <span className="reply-text">
                                    {message.parent_message.contenu}
                                  </span>
                                </>
                              ) : (
                                (() => {
                                  const parentMessage = messages.find(
                                    (m) => m.id_message === message.parent_id
                                  );
                                  return parentMessage ? (
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
                                })()
                              )}
                            </div>
                          </div>
                        )}

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

                        <div className="message-text">
                          {(() => {
                            if (!message.contenu) {
                              return <p className="message-paragraph"></p>;
                            }

                            const mentionRegex =
                              /@\[([^\]]+)\]\(([0-9a-fA-F-]+)\)/g;

                            const processedContent = message.contenu.replace(
                              mentionRegex,
                              (match, name, uuid) => {
                                if (
                                  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
                                    uuid
                                  )
                                ) {
                                  return `[${name}](${uuid})`;
                                }
                                return match;
                              }
                            );

                            return (
                              <ReactMarkdown
                                components={{
                                  p: ({ node, ...props }) => (
                                    <p
                                      {...props}
                                      className="message-paragraph"
                                    />
                                  ),
                                  a: ({ node, href, children, ...props }) => {
                                    const potentialUserId = href;

                                    let fullText = "";
                                    if (children && children.length) {
                                      React.Children.forEach(
                                        children,
                                        (child) => {
                                          if (typeof child === "string") {
                                            fullText += child;
                                          } else if (
                                            child &&
                                            child.props &&
                                            child.props.children
                                          ) {
                                            if (
                                              typeof child.props.children ===
                                              "string"
                                            ) {
                                              fullText += child.props.children;
                                            } else if (
                                              Array.isArray(
                                                child.props.children
                                              )
                                            ) {
                                              fullText += child.props.children
                                                .filter(
                                                  (c) => typeof c === "string"
                                                )
                                                .join("");
                                            }
                                          }
                                        }
                                      );
                                    }

                                    if (
                                      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
                                        potentialUserId
                                      )
                                    ) {
                                      const isCurrentUser =
                                        potentialUserId === currentUserId;
                                      return (
                                        <span
                                          className={`mention-highlight ${
                                            isCurrentUser
                                              ? "current-user-mention"
                                              : ""
                                          }`}
                                          data-userid={potentialUserId}
                                        >
                                          @{fullText}
                                        </span>
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
                                  text: ({ node, ...props }) => {
                                    return (
                                      <>{renderTextWithLinks(node.value)}</>
                                    );
                                  },
                                }}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                              >
                                {processedContent}
                              </ReactMarkdown>
                            );
                          })()}
                        </div>

                        {message.fichier && (
                          <div className="message-attachment">
                            {message.fichier.type.startsWith("image/") ? (
                              <img
                                src={message.fichier.url}
                                alt={message.fichier.nom_fichier}
                                className="attachment-image-preview"
                              />
                            ) : (
                              <a
                                href={message.fichier.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment-link"
                              >
                                <FaFileAlt className="attachment-icon" />
                                <span>{message.fichier.nom_fichier}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {message.reactions && message.reactions.length > 0 && (
                          <div className="message-reactions">
                            {message.reactions.map((reaction, index) => (
                              <div
                                key={index}
                                className={`reaction-badge ${
                                  reaction.user_reacted ? "user-reacted" : ""
                                }`}
                                onClick={() => {
                                  if (socket && socket.connected) {
                                    if (reaction.user_reacted) {
                                      socket.emit("removeReaction", {
                                        messageId: message.id_message,
                                        reaction_type: reaction.reaction_type,
                                        canalId: activeChannel.id,
                                      });
                                    } else {
                                      socket.emit("addReaction", {
                                        messageId: message.id_message,
                                        reaction_type: reaction.reaction_type,
                                        canalId: activeChannel.id,
                                      });
                                    }
                                  }
                                }}
                              >
                                <span className="reaction-emoji">
                                  {reaction.emoji ||
                                    getEmojiForType(reaction.reaction_type)}
                                </span>
                                <span className="reaction-count">
                                  {reaction.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
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
                      <FaAt id="supchat-mentions-header-icon" />
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

                {(selectedFile || uploadingFile || uploadError) && (
                  <div className="file-upload-status">
                    {uploadingFile ? (
                      <>
                        <FaSpinner className="spinner-icon" />
                        <span>Envoi de {selectedFile?.name}...</span>
                      </>
                    ) : uploadError ? (
                      <>
                        <span className="upload-error-text">
                          Erreur: {uploadError}
                        </span>
                        <button
                          onClick={handleCancelFile}
                          className="cancel-upload-btn"
                          title="Annuler"
                        >
                          <FaTimes />
                        </button>
                      </>
                    ) : selectedFile ? (
                      <>
                        <FaFileAlt className="selected-file-icon" />
                        <span className="selected-file-name">
                          {selectedFile.name}
                        </span>
                        <button
                          onClick={handleCancelFile}
                          className="cancel-upload-btn"
                          title="Retirer le fichier"
                        >
                          <FaTimes />
                        </button>
                      </>
                    ) : null}
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

                  <div className="chat-input-wrapper">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileInputChange}
                      accept=".pdf,.png,.jpg,.jpeg,.gif"
                    />
                    <button
                      type="button"
                      className="chat-attachment-btn"
                      onClick={handleAttachmentClick}
                      disabled={uploadingFile}
                      title="Joindre un fichier"
                    >
                      <FaPaperclip />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={`Message dans #${activeChannel.name}`}
                      value={displayMessage}
                      onChange={(e) => handleNewMessageChange(e.target.value)}
                      onKeyDown={handleChatInputKeyDown} // <-- Vérifier que c'est bien le handler du hook qui est utilisé ici
                      disabled={uploadingFile}
                    />
                    <button
                      type="button"
                      className="chat-emoji-btn"
                      onClick={() => setShowEmojiPicker(true)}
                      disabled={uploadingFile}
                    >
                      <FaSmile />
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={
                      (!displayMessage.trim() && !selectedFile) || uploadingFile
                    }
                  >
                    {uploadingFile ? (
                      <FaSpinner className="spinner-icon" />
                    ) : (
                      <FaPaperPlane />
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="details-sidebar">
          <div className="details-section">
            <div className="section-header" onClick={toggleMembers}>
              {showMembers ? (
                <FaChevronDown className="toggle-icon" />
              ) : (
                <FaChevronRight className="toggle-icon" />
              )}
              <h3>
                Membres ({members.online.length + members.offline.length})
              </h3>
            </div>

            {showMembers && (
              <div className="members-container">
                <div className="members-subsection">
                  <div
                    className="subsection-header"
                    onClick={toggleOnlineMembers}
                  >
                    {showOnlineMembers ? (
                      <FaChevronDown className="toggle-icon" />
                    ) : (
                      <FaChevronRight className="toggle-icon" />
                    )}
                    <h4>En ligne ({members.online.length})</h4>
                  </div>

                  {showOnlineMembers && (
                    <ul className="members-list">
                      {members.online.map((member) => (
                        <li
                          key={member.id}
                          className="member-item online"
                          onClick={() => handleOpenProfile(member)}
                          style={{ cursor: "pointer" }}
                        >
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="member-avatar"
                            />
                          ) : (
                            <FaUserCircle className="member-avatar-placeholder" />
                          )}
                          <div className="member-info">
                            {getRoleIcon(member.role)}
                            <span className="member-name">{member.name}</span>
                          </div>
                          <span className="status-indicator online"></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="members-subsection">
                  <div
                    className="subsection-header"
                    onClick={toggleOfflineMembers}
                  >
                    {showOfflineMembers ? (
                      <FaChevronDown className="toggle-icon" />
                    ) : (
                      <FaChevronRight className="toggle-icon" />
                    )}
                    <h4>Hors ligne ({members.offline.length})</h4>
                  </div>

                  {showOfflineMembers && (
                    <ul className="members-list">
                      {members.offline.map((member) => (
                        <li
                          key={member.id}
                          className="member-item offline"
                          onClick={() => handleOpenProfile(member)}
                          style={{ cursor: "pointer" }}
                        >
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="member-avatar"
                            />
                          ) : (
                            <FaUserCircle className="member-avatar-placeholder" />
                          )}
                          <div className="member-info">
                            {getRoleIcon(member.role)}
                            <span className="member-name">{member.name}</span>
                          </div>
                          <span className="status-indicator offline"></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="details-section">
            <div className="section-header" onClick={toggleFiles}>
              {showFiles ? (
                <FaChevronDown className="toggle-icon" />
              ) : (
                <FaChevronRight className="toggle-icon" />
              )}
              <h3>Fichiers ({files.length})</h3>
            </div>

            {showFiles && (
              <ul className="files-list">
                {files.map((file) => (
                  <li key={file.id} className="file-item">
                    <div className="file-icon">{getFileIcon(file.type)}</div>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-meta">
                        {file.size} • {file.uploadedAt}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="details-section">
            <div className="section-header" onClick={toggleImages}>
              {showImages ? (
                <FaChevronDown className="toggle-icon" />
              ) : (
                <FaChevronRight className="toggle-icon" />
              )}
              <h3>Images ({images.length})</h3>
            </div>

            {showImages && (
              <div className="images-grid">
                {images.map((image) => (
                  <div key={image.id} className="image-item">
                    <img
                      src={image.url}
                      alt="Shared"
                      className="shared-image"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showCreateChannelModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Nouveau canal</h2>

              {channelError && (
                <p className="error-message">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: "8px" }}
                  >
                    <path
                      d="M8 15A7 7 0 108 1a7 7 0 000 14z"
                      stroke="#ff6b6b"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 5v3"
                      stroke="#ff6b6b"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="8" cy="11" r="0.5" fill="#ff6b6b" />
                  </svg>
                  {channelError}
                </p>
              )}

              <form onSubmit={handleSubmitChannel}>
                <div className="form-group">
                  <label htmlFor="name">Nom du canal</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newChannel.name}
                    onChange={handleChannelInputChange}
                    placeholder="ex: general, marketing, dev..."
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Visibilité du canal</label>
                  <div className="channel-visibility-selector">
                    <button
                      type="button"
                      className={`visibility-option ${
                        !newChannel.isPrivate ? "selected" : ""
                      }`}
                      onClick={() =>
                        setNewChannel((prev) => ({ ...prev, isPrivate: false }))
                      }
                    >
                      <FaGlobe className="visibility-icon" />
                      <div className="visibility-info">
                        <span className="visibility-title">Public</span>
                        <span className="visibility-desc">
                          Accessible à tous les membres
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`visibility-option ${
                        newChannel.isPrivate ? "selected" : ""
                      }`}
                      onClick={() =>
                        setNewChannel((prev) => ({ ...prev, isPrivate: true }))
                      }
                    >
                      <FaLock className="visibility-icon" />
                      <div className="visibility-info">
                        <span className="visibility-title">Privé</span>
                        <span className="visibility-desc">
                          Accessible sur invitation
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="cancel-btn"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="create-btn"
                    disabled={isCreatingChannel}
                  >
                    {isCreatingChannel ? "Création..." : "Créer le canal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {contextMenu.visible && (
          <div
            className="channel-context-menu"
            style={{ top: contextMenu.yPos, left: contextMenu.xPos }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-menu-item" onClick={handleEditChannel}>
              <FaEdit className="context-menu-icon" />
              <span>Modifier le canal</span>
            </div>
            <div
              className="context-menu-item delete"
              onClick={handleDeleteChannel}
            >
              <FaTrashAlt className="context-menu-icon" />
              <span>Supprimer le canal</span>
            </div>
          </div>
        )}

        {showEditChannelModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowEditChannelModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Modifier le canal</h2>

              {updateChannelError && (
                <p className="error-message">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: "8px" }}
                  >
                    <path
                      d="M8 15A7 7 0 108 1a7 7 0 000 14z"
                      stroke="#ff6b6b"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 5v3"
                      stroke="#ff6b6b"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="8" cy="11" r="0.5" fill="#ff6b6b" />
                  </svg>
                  {updateChannelError}
                </p>
              )}

              <form onSubmit={handleSubmitEditChannel}>
                <div className="form-group">
                  <label htmlFor="edit-name">Nom du canal</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editingChannel.name}
                    onChange={(e) =>
                      setEditingChannel({
                        ...editingChannel,
                        name: e.target.value,
                      })
                    }
                    placeholder="ex: general, marketing, dev..."
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Visibilité du canal</label>
                  <div className="channel-visibility-selector">
                    <button
                      type="button"
                      className={`visibility-option ${
                        !editingChannel.isPrivate ? "selected" : ""
                      }`}
                      onClick={() =>
                        setEditingChannel((prev) => ({
                          ...prev,
                          isPrivate: false,
                        }))
                      }
                    >
                      <FaGlobe className="visibility-icon" />
                      <div className="visibility-info">
                        <span className="visibility-title">Public</span>
                        <span className="visibility-desc">
                          Accessible à tous les membres
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`visibility-option ${
                        editingChannel.isPrivate ? "selected" : ""
                      }`}
                      onClick={() =>
                        setEditingChannel((prev) => ({
                          ...prev,
                          isPrivate: true,
                        }))
                      }
                    >
                      <FaLock className="visibility-icon" />
                      <div className="visibility-info">
                        <span className="visibility-title">Privé</span>
                        <span className="visibility-desc">
                          Accessible sur invitation
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowEditChannelModal(false)}
                    className="cancel-btn"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="create-btn"
                    disabled={isUpdatingChannel}
                  >
                    {isUpdatingChannel ? "Mise à jour..." : "Mettre à jour"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {messageContextMenu.visible && (
          <div
            className="message-context-menu"
            style={{
              top: messageContextMenu.yPos,
              left: messageContextMenu.xPos,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-menu-item" onClick={handleReplyMessage}>
              <FaReply className="context-menu-icon" />
              <span>Répondre</span>
            </div>
            <div className="context-menu-item" onClick={handleShowEmojiPicker}>
              <FaRegSmile className="context-menu-icon" />
              <span>Ajouter une réaction</span>
            </div>
            {messageContextMenu.message &&
              messageContextMenu.message.fk_utilisateur === currentUserId && (
                <div
                  className="context-menu-item delete"
                  onClick={handleDeleteMessage}
                >
                  <FaTrashAlt className="context-menu-icon" />
                  <span>Supprimer</span>
                </div>
              )}
          </div>
        )}

        {showEmojiPicker && (
          <div
            className="modal-overlay"
            onClick={() => setShowEmojiPicker(false)}
          >
            <div
              className="emoji-picker-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Choisissez une réaction</h3>
              <div className="emoji-grid">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji.name}
                    className="emoji-button"
                    onClick={() => handleAddReaction(emoji.name)}
                    title={emoji.name}
                  >
                    {emoji.label}
                  </button>
                ))}
              </div>
              <div className="emoji-picker-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowEmojiPicker(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkspaceDetails;
