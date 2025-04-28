import React, { useRef, useState } from "react"; // Ajout de useState
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
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown"; // Import ReactMarkdown
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "./WorkspaceDetails.css";
import { useWorkspaceDetails } from "../../hooks/useWorkspaceDetails";
import { useNavigate } from "react-router-dom"; // Ajout import
import { API_URL } from "../../config/config"; // Ajout import pour API_URL

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

// Helper pour vérifier si le contenu est un fichier et l'analyser
const parseFileContent = (content) => {
  if (!content) return null;

  try {
    // Essayer de parser le contenu JSON
    const parsed = JSON.parse(content);

    // Vérifier si c'est un message de type fichier
    if (parsed && parsed.type === "file") {
      return {
        isFile: true,
        isImage: parsed.isImage,
        fileUrl: parsed.fileUrl,
        fileName: parsed.fileName,
        fileSize: parsed.fileSize,
        fileType: parsed.fileType,
      };
    }
  } catch (e) {
    // Si ce n'est pas du JSON valide, ce n'est pas un message de fichier
    return null;
  }

  return null;
};

// Helper pour formater la taille du fichier
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
};

function WorkspaceDetails() {
  const { workspaceId } = useParams();
  const navigate = useNavigate(); // Ajout hook navigation

  const S3_BASE_URL = "https://s3-supchat.s3.fr-par.scw.cloud/";

  // Référence vers l'input de fichier caché
  const fileInputRef = useRef(null);

  // État pour l'affichage du fichier en plein écran
  const [fullscreenFile, setFullscreenFile] = useState(null);

  // Use the custom hook to get state and handlers
  const {
    workspace: rawWorkspace,
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
    setMessages, // Ajout de setMessages ici
    newMessage,
    displayMessage, // <-- Ajouté

    loadingMessages,
    chatContainerRef,
    socket,
    currentUserId,
    currentUserName,
    currentUserRole, // Assurez-vous que currentUserName est exposé par votre hook
    messageContextMenu,
    showEmojiPicker,
    replyingTo,
    setReplyingTo, // Ajouter setReplyingTo ici
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
    handleMistralMention, // Utilisez la version du hook plutôt que celle définie localement
  } = useWorkspaceDetails(workspaceId);

  // Correction: préfixer les URLs S3 si besoin
  const workspace = rawWorkspace
    ? {
        ...rawWorkspace,
        icon:
          rawWorkspace.icon && !rawWorkspace.icon.startsWith("http")
            ? S3_BASE_URL + rawWorkspace.icon
            : rawWorkspace.icon,
        banner:
          rawWorkspace.banner && !rawWorkspace.banner.startsWith("http")
            ? S3_BASE_URL + rawWorkspace.banner
            : rawWorkspace.banner,
      }
    : null;

  // Handler pour ouvrir la sélection de fichier
  const handleOpenFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Fonction pour ouvrir un fichier en plein écran
  const handleOpenFileViewer = (fileData) => {
    setFullscreenFile(fileData);
  };

  // Fonction pour fermer la popup de fichier
  const handleCloseFileViewer = () => {
    setFullscreenFile(null);
  };

  // Modifier la fonction handleFileUpload pour éviter l'erreur avec setMessages
  const handleFileUpload = async (e) => {
    console.log("🚀 Début de handleFileUpload");
    const file = e.target.files[0];
    if (!file) {
      console.log("❌ Aucun fichier sélectionné");
      return;
    }

    console.log(
      `📁 Fichier sélectionné: ${file.name} (${file.size} octets, type: ${file.type})`
    );

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limite
      console.log("❌ Fichier trop volumineux");
      alert("Le fichier ne doit pas dépasser 10MB");
      return;
    }

    try {
      if (activeChannel && socket && socket.connected) {
        console.log(
          `📡 Canal actif: ${activeChannel.id}, Socket connecté: ${socket.connected}`
        );

        // Création de FormData pour l'envoi du fichier
        const formData = new FormData();
        formData.append("file", file);
        formData.append("canalId", activeChannel.id);
        formData.append("workspaceId", workspaceId);

        console.log(
          `🔍 Formulaire préparé - canalId: ${activeChannel.id}, workspaceId: ${workspaceId}`
        );

        if (replyingTo) {
          console.log(`↩️ Réponse à un message: ${replyingTo.id_message}`);
          formData.append("parentId", replyingTo.id_message);
        }

        const token = localStorage.getItem("token");
        console.log(`🔑 Token disponible: ${token ? "Oui" : "Non"}`);

        // Afficher un message temporaire de téléchargement
        const tempMsgId = `temp-upload-${Date.now()}`;
        console.log(`📝 Création du message temporaire: ${tempMsgId}`);
        const loadingMessage = {
          id_message: tempMsgId,
          contenu: `Envoi du fichier ${file.name}...`,
          nom: currentUserName || "Vous",
          fk_utilisateur: currentUserId,
          date_creation: new Date().toISOString(),
          isUploading: true,
          reactions: [],
        };

        console.log(`⏳ Ajout du message temporaire au chat`);
        setMessages((prevMessages) => [...prevMessages, loadingMessage]);

        // Forcer une mise à jour du DOM
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }

        console.log(
          `🌐 Début de l'appel API vers ${API_URL}/api/messages/upload`
        );

        // Affichage du contenu FormData pour debug
        console.log("📦 Vérification du FormData:");
        for (let pair of formData.entries()) {
          console.log(`${pair[0]}: ${pair[1]}`);
        }

        // Upload du fichier vers l'API
        const response = await fetch(`${API_URL}/api/messages/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        console.log(`📡 Réponse reçue - Status: ${response.status}`);

        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error("❌ Détails de l'erreur API:", errorData);
            throw new Error(
              errorData.message ||
                `Erreur ${response.status}: ${response.statusText}`
            );
          } catch (jsonError) {
            console.error(
              "❌ Erreur lors de la lecture de la réponse:",
              jsonError
            );
            throw new Error(
              `Erreur ${response.status}: ${response.statusText}`
            );
          }
        }

        const data = await response.json();
        console.log("✅ Réponse API réussie:", data);

        // Supprimer le message temporaire
        console.log(`🗑️ Suppression du message temporaire: ${tempMsgId}`);
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id_message !== tempMsgId)
        );

        // Réinitialiser l'input de fichier et le mode réponse
        e.target.value = null;
        setReplyingTo(null);
        console.log(`✅ Fin de l'upload avec succès`);
      } else {
        if (!activeChannel) {
          console.log("❌ Aucun canal actif");
          alert("Veuillez d'abord sélectionner un canal");
        } else if (!socket || !socket.connected) {
          console.log(
            `❌ Problème de socket - socket existe: ${!!socket}, connecté: ${
              socket?.connected
            }`
          );
          alert(
            "Problème de connexion au serveur. Veuillez rafraîchir la page."
          );
        }
      }
    } catch (error) {
      console.error("❌ ERREUR DÉTAILLÉE:", error);
      console.log(`❌ Message d'erreur: ${error.message}`);
      console.log(`❌ Stack trace: ${error.stack}`);
      alert(
        `Erreur lors de l'envoi du fichier: ${
          error.message || "Erreur inconnue"
        }`
      );

      // Supprimer le message de chargement en cas d'erreur
      console.log(
        "🗑️ Nettoyage des messages temporaires d'upload en cas d'erreur"
      );
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.isUploading)
      );
    }

    console.log("🏁 Fin de handleFileUpload");
  };

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

  // Helper pour vérifier si une chaîne est un UUID (pour identifier les user IDs dans les href)
  const isUuid = (str) =>
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      str
    );

  // Handler pour ouvrir la page de profil
  const handleOpenProfile = (member) => {
    navigate(`/profile/${member.id}`);
  };

  // Utiliser le handler original pour l'envoi normal
  const handleSendMessageWithMistralCheck = (e) => {
    if (e) e.preventDefault();

    // Ne pas procéder si le message est vide
    if (!displayMessage.trim()) return;

    // Vérifier si c'est une mention de Mistral et la traiter en priorité
    const isMistralMention = handleMistralMention(displayMessage);

    // Si ce n'est pas une mention de Mistral, utiliser le handler original
    if (!isMistralMention) {
      handleSendMessage(e);
    }
  };

  // Nouveau state pour le menu contextuel des membres
  const [memberContextMenu, setMemberContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    member: null,
  });

  // Handler pour ouvrir le menu contextuel sur un membre (clic droit)
  const handleMemberContextMenu = (e, member) => {
    e.preventDefault();
    // Owner : peut agir sur tout le monde sauf owner
    // Admin : peut promouvoir un membre en admin, mais ne peut pas rétrograder un admin
    if (currentUserRole !== "owner" && currentUserRole !== "admin") return;
    if (member.role === "owner") return;
    if (currentUserRole === "admin" && member.role !== "member") return;
    setMemberContextMenu({ visible: true, x: e.pageX, y: e.pageY, member });
  };

  // Handler pour fermer le menu contextuel
  const handleCloseMemberContextMenu = () =>
    setMemberContextMenu({ ...memberContextMenu, visible: false });

  // Handler pour promouvoir/déclasser
  const handleChangeMemberRole = async (newRole) => {
    if (!memberContextMenu.member) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/workspaces/${workspace.id}/members/${memberContextMenu.member.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newRole }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Erreur lors du changement de rôle");
      } else {
        // Rafraîchir la liste des membres
        if (typeof fetchWorkspaceMembers === "function")
          fetchWorkspaceMembers();
      }
    } catch (e) {
      alert("Erreur lors du changement de rôle");
    } finally {
      handleCloseMemberContextMenu();
    }
  };

  // Fonction pour télécharger un fichier
  const handleDownloadFile = (fileUrl, fileName) => {
    // Construire l'URL complète vers le fichier sur S3
    const fullUrl = `https://s3-supchat.s3.fr-par.scw.cloud/${fileUrl}`;

    // Créer un élément a temporaire pour déclencher le téléchargement
    const a = document.createElement("a");
    a.href = fullUrl;
    a.download = fileName || "download"; // Utiliser le nom du fichier ou un nom par défaut
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
                {/* Afficher le bouton d'ajout de canal seulement si owner ou admin */}
                {(currentUserRole === "owner" ||
                  currentUserRole === "admin") && (
                  <button
                    className="add-channel-btn"
                    onClick={handleCreateChannel}
                  >
                    {" "}
                    {/* Use handler from hook */}
                    <FaPlus />
                  </button>
                )}
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
                          (currentUserRole === "owner" ||
                            currentUserRole === "admin") &&
                          handleChannelContextMenu(e, channel)
                        } // Restrict context menu
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
                      className={`chat-message ${
                        message.fk_utilisateur === currentUserId
                          ? "own-message"
                          : "other-message"
                      }`}
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
                        {(message.parent_id || message.parent_message) &&
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
                                      element.classList.add(
                                        "highlight-message"
                                      );
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
                                  {replyContent}
                                </div>
                              </div>
                            );
                          })()}

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

                        {/* Vérifier si le message contient un fichier */}
                        {(() => {
                          const fileData = parseFileContent(message.contenu);

                          if (fileData) {
                            // C'est un message contenant un fichier
                            const fullFileUrl = `https://s3-supchat.s3.fr-par.scw.cloud/${fileData.fileUrl}`;

                            return (
                              <div className="message-file">
                                {/* Afficher l'image si c'est une image */}
                                {fileData.isImage && (
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
                                )}

                                {/* Information et boutons pour tous les fichiers */}
                                <div className="file-info-container">
                                  <div className="file-details">
                                    <span className="file-name">
                                      {fileData.fileName}
                                    </span>
                                    <span className="file-size">
                                      {formatFileSize(fileData.fileSize)}
                                    </span>
                                  </div>
                                  <div className="file-actions">
                                    {!fileData.isImage && (
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
                                    )}
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
                            // C'est un message texte normal, utiliser le rendu existant
                            return (
                              <div className="message-text">
                                {(() => {
                                  // Vérifier si message.contenu est null ou undefined
                                  if (!message.contenu) {
                                    return (
                                      <p className="message-paragraph"></p>
                                    );
                                  }

                                  // Prétraiter le contenu pour retirer les @ avant les mentions
                                  // Recherche les motifs de type @[nom](uuid)
                                  const mentionRegex =
                                    /@\[([^\]]+)\]\(([0-9a-fA-F-]+)\)/g;

                                  // Remplacer par [nom](uuid) sans le @ initial
                                  const processedContent =
                                    message.contenu.replace(
                                      mentionRegex,
                                      (match, name, uuid) => {
                                        if (isUuid(uuid)) {
                                          return `[${name}](${uuid})`;
                                        }
                                        return match; // Si ce n'est pas un UUID valide, laisser tel quel
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
                                        a: ({
                                          node,
                                          href,
                                          children,
                                          ...props
                                        }) => {
                                          const potentialUserId = href;

                                          // Extraire le texte complet du lien plus efficacement
                                          let fullText = "";
                                          if (children && children.length) {
                                            // Parcourir tous les éléments enfants et extraire leur texte
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
                                                  // Traiter les enfants qui sont des éléments React
                                                  if (
                                                    typeof child.props
                                                      .children === "string"
                                                  ) {
                                                    fullText +=
                                                      child.props.children;
                                                  } else if (
                                                    Array.isArray(
                                                      child.props.children
                                                    )
                                                  ) {
                                                    // Aplatir les tableaux d'enfants
                                                    fullText +=
                                                      child.props.children
                                                        .filter(
                                                          (c) =>
                                                            typeof c ===
                                                            "string"
                                                        )
                                                        .join("");
                                                  }
                                                }
                                              }
                                            );
                                          }

                                          // Si le href est un UUID, c'est une mention
                                          if (isUuid(potentialUserId)) {
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
                                                @{fullText}{" "}
                                                {/* Utilise le texte complet extrait */}
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
                                        // Version simplifiée du gestionnaire de texte
                                        text: ({ node, ...props }) => {
                                          return (
                                            <>
                                              {renderTextWithLinks(node.value)}
                                            </>
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
                            );
                          }
                        })()}
                        {/* *** End Markdown rendering *** */}

                        {/* Afficher les réactions avec l'emoji Unicode directement */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="message-reactions">
                            {message.reactions.map((reaction, index) => (
                              <div
                                key={index}
                                className={`reaction-badge ${
                                  reaction.user_reacted ? "user-reacted" : ""
                                }`} // Add class if user reacted
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
                                        reaction_type: reaction.reaction_type, // emoji unicode
                                        canalId: activeChannel.id,
                                      });
                                    }
                                  }
                                }}
                              >
                                <span className="reaction-emoji">
                                  {getEmojiForType(reaction.reaction_type)}
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
                {/* *** End Typing Indicator *** */}
              </div>

              {/* Nouvelle implémentation de l'autocomplétion des mentions avec des IDs uniques */}
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

                <form
                  className="chat-input-container"
                  onSubmit={handleSendMessageWithMistralCheck}
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

                  {/* Input de fichier caché */}
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
                      onClick={handleOpenFileUpload}
                    >
                      <FaPaperclip />
                    </button>
                    <input
                      type="text"
                      placeholder={`Message dans #${activeChannel.name}`}
                      value={displayMessage} // <-- Utilise displayMessage
                      onChange={(e) => handleNewMessageChange(e.target.value)} // <-- Utilise handleNewMessageChange
                      onKeyDown={handleChatInputKeyDown} // Apply the new handler
                    />
                    <button
                      type="button"
                      className="chat-emoji-btn"
                      onClick={() => setShowEmojiPicker(true)}
                    >
                      {" "}
                      {/* Use setter from hook */}
                      <FaSmile />
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!displayMessage.trim()} // <-- Utilise displayMessage
                  >
                    <FaPaperPlane />
                  </button>
                </form>
              </div>

              {/* *** End Typing Indicator *** */}
            </div>
          )}
        </div>

        {/* Details Sidebar - UPDATED with role icons */}
        <div className="details-sidebar">
          {/* Members Section - RESTRUCTURED */}
          <div className="details-section">
            <div className="section-header" onClick={toggleMembers}>
              {" "}
              {/* Use handler from hook */}
              {showMembers ? (
                <FaChevronDown className="toggle-icon" />
              ) : (
                <FaChevronRight className="toggle-icon" />
              )}
              <h3>
                Membres ({members.online.length + members.offline.length})
              </h3>{" "}
              {/* Use members from hook */}
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
                          onClick={() => handleOpenProfile(member)} // Ajout navigation profil
                          onContextMenu={(e) =>
                            handleMemberContextMenu(e, member)
                          }
                          style={{
                            cursor:
                              currentUserRole === "owner" &&
                              member.role !== "owner"
                                ? "context-menu"
                                : "pointer",
                          }}
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
                          onClick={() => handleOpenProfile(member)} // Ajout navigation profil
                          onContextMenu={(e) =>
                            handleMemberContextMenu(e, member)
                          }
                          style={{
                            cursor:
                              currentUserRole === "owner" &&
                              member.role !== "owner"
                                ? "context-menu"
                                : "pointer",
                          }}
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
          {/* Menu contextuel pour la gestion des rôles des membres */}
          {memberContextMenu.visible && memberContextMenu.member && (
            <div
              className="channel-context-menu"
              style={{
                top: memberContextMenu.y,
                left: memberContextMenu.x,
                zIndex: 2000,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Owner : peut promouvoir/déclasser. Admin : peut seulement promouvoir un membre */}
              {((currentUserRole === "owner" &&
                memberContextMenu.member.role === "member") ||
                (currentUserRole === "admin" &&
                  memberContextMenu.member.role === "member")) && (
                <div
                  className="context-menu-item"
                  onClick={() => handleChangeMemberRole("admin")}
                >
                  <FaArrowUp className="context-menu-icon" />
                  Promouvoir en admin
                </div>
              )}
              {currentUserRole === "owner" &&
                memberContextMenu.member.role === "admin" && (
                  <div
                    className="context-menu-item"
                    onClick={() => handleChangeMemberRole("member")}
                  >
                    <FaArrowDown className="context-menu-icon" />
                    Rétrograder en membre
                  </div>
                )}
            </div>
          )}
          {/* Files Section - Affichage réel des fichiers du canal actif */}
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
                {files.length === 0 ? (
                  <li className="file-item">
                    Aucun fichier partagé dans ce canal.
                  </li>
                ) : (
                  files.map((file) => (
                    <li key={file.id} className="file-item">
                      <div className="file-icon">{getFileIcon(file.type)}</div>
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-meta">
                          {file.size} •{" "}
                          {file.uploadedAt &&
                            formatMessageDate(file.uploadedAt)}
                        </span>
                      </div>
                      <div className="file-actions">
                        {file.isImage ? (
                          <button
                            className="file-view-button"
                            onClick={() =>
                              handleOpenFileViewer({
                                ...file,
                                fullFileUrl: S3_BASE_URL + file.url,
                              })
                            }
                          >
                            Voir
                          </button>
                        ) : null}
                        <button
                          className="file-download-button"
                          onClick={() =>
                            handleDownloadFile(file.url, file.name)
                          }
                        >
                          Télécharger
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Images Section - NO CHANGE */}
          <div className="details-section">
            <div className="section-header" onClick={toggleImages}>
              {" "}
              {/* Use handler from hook */}
              {showImages ? (
                <FaChevronDown className="toggle-icon" />
              ) : (
                <FaChevronRight className="toggle-icon" />
              )}
              <h3>Images ({images.length})</h3> {/* Use images from hook */}
            </div>

            {showImages && (
              <div className="images-grid">
                {images.map(
                  (
                    image // Use images from hook
                  ) => (
                    <div key={image.id} className="image-item">
                      <img
                        src={image.url}
                        alt="Shared"
                        className="shared-image"
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de création de canal - Structure améliorée */}
        {showCreateChannelModal && ( // Use state from hook
          <div className="modal-overlay" onClick={handleCloseModal}>
            {" "}
            {/* Use handler from hook */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Nouveau canal</h2>

              {channelError && ( // Use state from hook
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
                {" "}
                {/* Use handler from hook */}
                <div className="form-group">
                  <label htmlFor="name">Nom du canal</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newChannel.name} // Use state from hook
                    onChange={handleChannelInputChange} // Use handler from hook
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
                    {" "}
                    {/* Use handler from hook */}
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="create-btn"
                    disabled={isCreatingChannel} // Use state from hook
                  >
                    {isCreatingChannel ? "Création..." : "Créer le canal"}{" "}
                    {/* Use state from hook */}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu contextuel pour les canaux */}
        {contextMenu.visible && ( // Use state from hook
          <div
            className="channel-context-menu"
            style={{ top: contextMenu.yPos, left: contextMenu.xPos }} // Use state from hook
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-menu-item" onClick={handleEditChannel}>
              {" "}
              {/* Use handler from hook */}
              <FaEdit className="context-menu-icon" />
              <span>Modifier le canal</span>
            </div>
            <div
              className="context-menu-item delete"
              onClick={handleDeleteChannel}
            >
              {" "}
              {/* Use handler from hook */}
              <FaTrashAlt className="context-menu-icon" />
              <span>Supprimer le canal</span>
            </div>
          </div>
        )}

        {/* Modal d'édition de canal */}
        {showEditChannelModal && ( // Use state from hook
          <div
            className="modal-overlay"
            onClick={() => setShowEditChannelModal(false)}
          >
            {" "}
            {/* Use setter from hook */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Modifier le canal</h2>

              {updateChannelError && ( // Use state from hook
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
                {" "}
                {/* Use handler from hook */}
                <div className="form-group">
                  <label htmlFor="edit-name">Nom du canal</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editingChannel.name} // Use state from hook
                    onChange={(e) =>
                      setEditingChannel({
                        ...editingChannel,
                        name: e.target.value,
                      })
                    } // Use setter from hook
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
                      }`} // Use state from hook
                      onClick={() =>
                        setEditingChannel((prev) => ({
                          ...prev,
                          isPrivate: false,
                        }))
                      } // Use setter from hook
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
                      }`} // Use state from hook
                      onClick={() =>
                        setEditingChannel((prev) => ({
                          ...prev,
                          isPrivate: true,
                        }))
                      } // Use setter from hook
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
                    {" "}
                    {/* Use setter from hook */}
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="create-btn"
                    disabled={isUpdatingChannel} // Use state from hook
                  >
                    {isUpdatingChannel ? "Mise à jour..." : "Mettre à jour"}{" "}
                    {/* Use state from hook */}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu contextuel pour les messages */}
        {messageContextMenu.visible && ( // Use state from hook
          <div
            className="message-context-menu"
            style={{
              top: messageContextMenu.yPos,
              left: messageContextMenu.xPos,
            }} // Use state from hook
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-menu-item" onClick={handleReplyMessage}>
              {" "}
              {/* Use handler from hook */}
              <FaReply className="context-menu-icon" />
              <span>Répondre</span>
            </div>
            <div className="context-menu-item" onClick={handleShowEmojiPicker}>
              {" "}
              {/* Use handler from hook */}
              <FaRegSmile className="context-menu-icon" />
              <span>Ajouter une réaction</span>
            </div>
            {/* Ajouter l'option de suppression uniquement pour les messages de l'utilisateur actuel */}
            {messageContextMenu.message &&
              messageContextMenu.message.fk_utilisateur === currentUserId && (
                <div
                  className="context-menu-item delete"
                  onClick={handleDeleteMessage}
                >
                  {" "}
                  {/* Use new handler */}
                  <FaTrashAlt className="context-menu-icon" />
                  <span>Supprimer</span>
                </div>
              )}
          </div>
        )}

        {/* Modal pour la sélection d'emoji */}
        {showEmojiPicker && ( // Use state from hook
          <div
            className="modal-overlay"
            onClick={() => setShowEmojiPicker(false)}
          >
            {" "}
            {/* Use setter from hook */}
            <div
              className="emoji-picker-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Choisissez une réaction</h3>
              <div className="emoji-grid">
                {commonEmojis.map(
                  (
                    emoji // Use state from hook
                  ) => (
                    <button
                      key={emoji.name}
                      className="emoji-button"
                      onClick={() => handleAddReaction(emoji.name)} // Use handler from hook
                      title={emoji.name}
                    >
                      {emoji.label}
                    </button>
                  )
                )}
              </div>
              <div className="emoji-picker-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowEmojiPicker(false)} // Use setter from hook
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour afficher un fichier en plein écran */}
        {fullscreenFile && (
          <>
            <div
              className="fullscreen-modal-overlay"
              onClick={handleCloseFileViewer}
            ></div>
            <div
              className="fullscreen-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="fullscreen-modal-header">
                <h3 className="fullscreen-modal-title">
                  {fullscreenFile.fileName}
                </h3>
                <button
                  className="fullscreen-modal-close"
                  onClick={handleCloseFileViewer}
                >
                  ×
                </button>
              </div>
              <div className="fullscreen-modal-body">
                {fullscreenFile.isImage ? (
                  <img
                    src={fullscreenFile.fullFileUrl}
                    alt={fullscreenFile.fileName}
                    className="fullscreen-image"
                  />
                ) : (
                  <div className="fullscreen-file">
                    <iframe
                      src={fullscreenFile.fullFileUrl}
                      title={fullscreenFile.fileName}
                      className="file-preview-frame"
                    ></iframe>
                  </div>
                )}
              </div>
              <div className="fullscreen-modal-footer">
                <button
                  className="fullscreen-download-btn"
                  onClick={() =>
                    handleDownloadFile(
                      fullscreenFile.fileUrl,
                      fullscreenFile.fileName
                    )
                  }
                >
                  Télécharger
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WorkspaceDetails;
