import React, { useRef, useState, useEffect } from "react"; // Ajout useEffect
import { useParams } from "react-router-dom";
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
  FaTimes, // Ajouter icône pour fermer
} from "react-icons/fa";
import ReactMarkdown from "react-markdown"; // Import ReactMarkdown
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "./WorkspaceDetails.css";
import { useWorkspaceDetails } from "../../hooks/useWorkspaceDetails";
import { useNavigate } from "react-router-dom"; // Ajout import

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

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

// Simplified function that no longer adds highlighting
const processMessageContent = (text) => {
  if (!text) return "";
  return text; // Simply return the original text without any modifications
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
    const date = new Date(dateString);
    const now = new Date();
    if (isNaN(date.getTime())) {
      console.warn("formatMessageDate: date invalide", dateString);
      return "";
    }
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch (error) {
    console.error("Erreur de formatage de date:", error);
    return "";
  }
};

function WorkspaceDetails() {
  const { workspaceId } = useParams();
  const navigate = useNavigate(); // Ajout hook navigation

  // Use the custom hook to get state and handlers
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
    loadingMessages,
    chatContainerRef,
    socket,
    currentUserId,
    currentUserName, // Assurez-vous que currentUserName est exposé par votre hook
    messageContextMenu,
    showEmojiPicker,
    replyingTo,
    commonEmojis,
    isMistralTyping, // Get the typing state
    // Mention state and handlers
    showMentionSuggestions,
    mentionSuggestions,
    activeMentionIndex,
    // Handlers
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
    // New handlers for mentions
    handleNewMessageChange,
    handleSelectMention,
    handleMentionNavigation,
    handleSelectActiveItem,
    // New handler for deleting messages
    handleDeleteMessage,
  } = useWorkspaceDetails(workspaceId);

  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Nouveaux états pour la prévisualisation de fichier
  const [fileToSend, setFileToSend] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [messageWithFile, setMessageWithFile] = useState("");
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Effet pour nettoyer l'URL d'aperçu lorsque le composant est démonté ou que filePreviewUrl change
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // Ajoutez ce handler pour la gestion du clavier sur l'input du chat
  const handleChatInputKeyDown = (e) => {
    if (showMentionSuggestions && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleMentionNavigation("next");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleMentionNavigation("prev");
      } else if (e.key === "Enter") {
        // Si la fenêtre de suggestions est ouverte, sélectionne l'élément actif
        handleSelectActiveItem();
        e.preventDefault();
      }
    }
  };

  // Handler pour ouvrir le sélecteur de fichier
  const handleAttachmentClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Modifié: Stocke le fichier et affiche la prévisualisation
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileToSend(file);
    setMessageWithFile(""); // Réinitialiser le message associé

    // Générer un aperçu si c'est une image
    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      // Nettoyer l'ancienne URL si elle existe
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
      setFilePreviewUrl(previewUrl);
    } else {
      // Nettoyer l'URL si le nouveau fichier n'est pas une image
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
      setFilePreviewUrl(null);
    }

    setShowFilePreview(true);

    // Réinitialiser l'input pour pouvoir sélectionner le même fichier à nouveau
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Nouveau: Annule la prévisualisation
  const handleCancelPreview = () => {
    setShowFilePreview(false);
    setFileToSend(null);
    setMessageWithFile("");
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  // Nouveau: Envoie le fichier et le message depuis la prévisualisation
  const handleSendFileWithMessage = async () => {
    if (!fileToSend || !activeChannel) return;

    setUploadingFile(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", fileToSend);
      formData.append("contenu", messageWithFile); // Ajouter le message texte

      // Ajouter parent_id si on répond à un message
      if (replyingTo) {
        formData.append("parent_id", replyingTo.id_message);
      }

      const res = await fetch(
        `${API_URL}/api/messages/${activeChannel.id}/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          message: "Erreur inconnue lors de l'envoi du fichier",
        }));
        console.error("Erreur d'upload:", res.status, errorData);
        throw new Error(
          errorData.message || `Erreur ${res.status} lors de l'envoi du fichier`
        );
      }

      const message = await res.json();
      console.log("Fichier et message envoyés:", message);

      // Réinitialiser après succès
      handleCancelPreview(); // Ferme la prévisualisation
      if (replyingTo) {
        handleCancelReply(); // Annule l'état de réponse
      }
    } catch (err) {
      console.error("Erreur détaillée lors de l'envoi fichier/message:", err);
      alert(err.message || "Erreur lors de l'envoi du fichier");
      // Garder la prévisualisation ouverte en cas d'erreur pour que l'utilisateur puisse réessayer ? Ou fermer ? À décider.
      // handleCancelPreview(); // Optionnel: fermer même en cas d'erreur
    } finally {
      setUploadingFile(false);
    }
  };

  // Handler pour ouvrir la page de profil
  const handleOpenProfile = (member) => {
    navigate(`/profile/${member.id}`);
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
        {/* Workspace Sidebar */}
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
                  onChange={handleSearchChange} // Use handler from hook
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
                {" "}
                {/* Use handler from hook */}
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
                  {" "}
                  {/* Use handler from hook */}
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
                  ) : channels.length > 0 ? ( // Use channels from hook
                    channels.map((channel) => (
                      <li
                        key={channel.id}
                        className={`channel-item ${
                          activeChannel && activeChannel.id === channel.id
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleSelectChannel(channel)} // Use handler from hook
                        onContextMenu={(e) =>
                          handleChannelContextMenu(e, channel)
                        } // Use handler from hook
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

        {/* Main Content Area - Modified for chat */}
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
                {" "}
                {/* Use ref from hook */}
                {loadingMessages ? (
                  <div className="chat-loading">Chargement des messages...</div>
                ) : messages.length > 0 ? ( // Use messages from hook
                  messages.map((message) => (
                    <div
                      key={message.id_message}
                      id={`msg-${message.id_message}`} // Add ID for scrolling to parent
                      // Ajout d'une classe pour le bot si le flag isBot est présent
                      className={`chat-message ${
                        message.fk_utilisateur === currentUserId
                          ? "own-message"
                          : message.isBot
                          ? "bot-message"
                          : "other-message"
                      }`} // Use currentUserId from hook
                      onContextMenu={(e) =>
                        handleMessageContextMenu(e, message)
                      } // Use handler from hook
                    >
                      <div className="message-avatar">
                        {/* Cette logique devrait fonctionner pour le bot aussi */}
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
                        {/* Affichage amélioré du message parent s'il s'agit d'une réponse */}
                        {(message.parent_id || message.parent_message) && (
                          <div
                            className="message-reply-to"
                            onClick={() => {
                              // Find parent message and scroll to it
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
                                // Si nous n'avons pas le message parent mais nous avons l'ID, chercher dans les messages existants
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
                            {message.isBot ||
                            message.fk_utilisateur ===
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

                        {/* Affichage du texte ou du fichier */}
                        <div className="message-text">
                          {/* Si le message contient un fichier, afficher un lien ou une preview */}
                          {message.file_url ? (
                            <>
                              {message.file_type &&
                              message.file_type.startsWith("image/") ? (
                                <a
                                  href={message.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={message.file_url}
                                    alt="Fichier partagé"
                                    style={{
                                      maxWidth: 220,
                                      maxHeight: 220,
                                      borderRadius: 8,
                                    }}
                                  />
                                </a>
                              ) : (
                                <a
                                  href={message.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="message-link"
                                >
                                  <FaFileAlt style={{ marginRight: 6 }} />
                                  {message.file_url.split("/").pop()}
                                </a>
                              )}
                            </>
                          ) : (
                            <ReactMarkdown
                              components={{
                                p: ({ node, ...props }) => (
                                  <p {...props} className="message-paragraph" />
                                ),
                                span: ({ node, ...props }) => (
                                  <span {...props} />
                                ),
                              }}
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                            >
                              {processMessageContent(
                                message.contenu,
                                currentUserName
                              )}
                            </ReactMarkdown>
                          )}
                        </div>

                        {/* Afficher les réactions avec meilleur style */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="message-reactions">
                            {message.reactions.map((reaction, index) => (
                              <div
                                key={index}
                                className={`reaction-badge ${
                                  reaction.user_reacted ? "user-reacted" : ""
                                }`} // Add class if user reacted
                                onClick={() => {
                                  // Toggle reaction using socket from hook
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
                                    getEmojiForType(
                                      reaction.reaction_type
                                    )}{" "}
                                  {/* Use helper from hook */}
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
                {/* *** Display Typing Indicator *** */}
                {isMistralTyping && (
                  <div
                    className="chat-message bot-message typing-indicator"
                    // Utilise la même structure que les autres messages pour la bulle
                  >
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
                        <i>est en train d'écrire...</i>
                      </div>
                    </div>
                  </div>
                )}
                {/* *** End Typing Indicator *** */}
              </div>

              {/* Zone de saisie du chat */}
              <div className="chat-input-area">
                {/* Nouvelle implémentation de l'autocomplétion des mentions avec des IDs uniques */}
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

                {/* NOUVEAU: Zone de prévisualisation de fichier */}
                {showFilePreview && fileToSend && (
                  <div className="file-preview-container">
                    <div className="file-preview-header">
                      <span>Aperçu du fichier</span>
                      <button
                        onClick={handleCancelPreview}
                        className="cancel-preview-btn"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className="file-preview-content">
                      <div className="file-preview-details">
                        {filePreviewUrl ? (
                          <img
                            src={filePreviewUrl}
                            alt="Aperçu"
                            className="file-preview-image"
                          />
                        ) : (
                          <div className="file-preview-icon">
                            {getFileIcon(fileToSend.type)}
                          </div>
                        )}
                        <span className="file-preview-name">
                          {fileToSend.name}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Ajouter un message (optionnel)"
                        value={messageWithFile}
                        onChange={(e) => setMessageWithFile(e.target.value)}
                        className="file-preview-message-input"
                        disabled={uploadingFile}
                      />
                    </div>
                    <div className="file-preview-actions">
                      {/* Afficher l'indicateur de réponse si on répond à un message */}
                      {replyingTo && (
                        <div className="replying-to-preview">
                          <FaReply className="reply-icon" />
                          <span>
                            Réponse à <strong>{replyingTo.nom}</strong>
                          </span>
                        </div>
                      )}
                      <button
                        onClick={handleSendFileWithMessage}
                        className="send-preview-btn"
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? "Envoi..." : <FaPaperPlane />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulaire de message normal (masqué si prévisualisation active ?) */}
                {!showFilePreview && (
                  <form
                    className="chat-input-container"
                    onSubmit={handleSendMessage}
                  >
                    {/* Afficher l'indicateur de réponse si on répond à un message */}
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
                      {/* Bouton pièce jointe */}
                      <button
                        type="button"
                        className="chat-attachment-btn"
                        onClick={handleAttachmentClick}
                        disabled={uploadingFile || showFilePreview} // Désactiver si prévisualisation active
                      >
                        <FaPaperclip />
                      </button>
                      {/* Input file caché */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                        disabled={uploadingFile || showFilePreview} // Désactiver si prévisualisation active
                      />
                      <input
                        type="text"
                        placeholder={`Message dans #${activeChannel.name}`}
                        value={newMessage}
                        onChange={(e) => handleNewMessageChange(e.target.value)}
                        onKeyDown={handleChatInputKeyDown}
                        disabled={showFilePreview} // Désactiver si prévisualisation active
                      />
                      <button
                        type="button"
                        className="chat-emoji-btn"
                        onClick={() => setShowEmojiPicker(true)}
                        disabled={showFilePreview} // Désactiver si prévisualisation active
                      >
                        <FaSmile />
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="chat-send-btn"
                      disabled={!newMessage.trim() || showFilePreview} // Désactiver si prévisualisation active
                    >
                      <FaPaperPlane />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="details-sidebar">
          {/* Members Section */}
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
                {/* Online Members Subsection */}
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

                {/* Offline Members Subsection */}
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

          {/* Files Section */}
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

          {/* Images Section */}
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

        {/* Modal de création de canal */}
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

        {/* Menu contextuel pour les canaux */}
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

        {/* Modal d'édition de canal */}
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

        {/* Menu contextuel pour les messages */}
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

        {/* Modal pour la sélection d'emoji */}
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
