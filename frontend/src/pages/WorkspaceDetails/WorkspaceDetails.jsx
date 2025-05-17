import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Spinner from "../../components/Spinner/Spinner";
import ChatContainer from "./ChatContainer";
import EmojiPickerModal from "./EmojiPickerModal";
import WorkspaceSidebar from "./WorkspaceSidebar";
import WorkspaceDetailsSidebar from "./WorkspaceDetailsSidebar";
import CreateChannelModal from "./CreateChannelModal";
import EditChannelModal from "./EditChannelModal";
import FileViewerModal from "./FileViewerModal";
import StrawpollResultsModal from "./StrawpollResultsModal";
import StrawpollModalWrapper from "./StrawpollModalWrapper";
import VideoCallModal from "./VideoCallModal"; // Import du composant d'appel vidéo
import StrawpollWebviewModal from "./StrawpollWebviewModal"; // Import du composant de webview pour voter
import ReactMarkdown from "react-markdown"; // Import ReactMarkdown
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "./WorkspaceDetails.css";
import { useWorkspaceDetails } from "../../hooks/useWorkspaceDetails";
import { useNotifications } from "../../context/NotificationContext"; // Added NotificationContext
import { API_URL } from "../../config/config"; // Ajout import pour API_URL
import {
  formatMessageDate,
  parseFileContent,
  formatFileSize,
  getFileIcon,
  getRoleIcon,
  isUuid,
  debugMistralInteraction,
  renderTextWithLinks,
} from "../../utils/helpers";
import {
  FaEdit,
  FaTrashAlt,
  FaReply,
  FaRegSmile,
  FaPoll,
  FaVoteYea,
} from "react-icons/fa";

function WorkspaceDetails() {
  const { workspaceId } = useParams();
  const navigate = useNavigate(); // Ajout hook navigation
  const { markChannelAsRead } = useNotifications(); // Récupérer markChannelAsRead depuis le contexte

  const S3_BASE_URL = "https://s3-supchat.s3.fr-par.scw.cloud/";

  // Référence vers l'input de fichier caché
  const fileInputRef = useRef(null);

  // État pour l'affichage du fichier en plein écran
  const [fullscreenFile, setFullscreenFile] = useState(null);

  // Ajout de l'état pour la boîte à outils
  const [showToolbox, setShowToolbox] = useState(false);
  const [showStrawpollModal, setShowStrawpollModal] = useState(false);

  // Ajout de l'état pour le modal de résultats Strawpoll
  const [showStrawpollResults, setShowStrawpollResults] = useState(false);
  const [strawpollResults, setStrawpollResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // Ajout de l'état pour le modal d'appel vidéo
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);

  // Nouvel état pour la webview de vote
  const [showStrawpollVote, setShowStrawpollVote] = useState(false);
  const [currentPollId, setCurrentPollId] = useState(null);

  // Handler pour ouvrir/fermer la boîte à outils
  const handleToggleToolbox = () => setShowToolbox((v) => !v);
  const handleOpenStrawpoll = () => {
    setShowToolbox(false);
    setShowStrawpollModal(true);
  };
  const handleCloseStrawpollModal = () => setShowStrawpollModal(false);

  // Fonction pour ouvrir le modal de résultats
  const handleOpenStrawpollResults = async (pollId) => {
    setLoadingResults(true);
    setShowStrawpollResults(true);
    try {
      const response = await fetch(`${API_URL}/api/strawpoll/${pollId}`);
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des résultats");
      const data = await response.json();
      setStrawpollResults(data);
    } catch (err) {
      setStrawpollResults({ error: err.message });
    } finally {
      setLoadingResults(false);
    }
  };
  const handleCloseStrawpollResults = () => {
    setShowStrawpollResults(false);
    setStrawpollResults(null);
  };

  // Handler pour ouvrir la webview de vote
  const handleOpenStrawpollVote = (pollId) => {
    setCurrentPollId(pollId);
    setShowStrawpollVote(true);
  };

  // Handler pour fermer la webview de vote
  const handleCloseStrawpollVote = () => {
    setShowStrawpollVote(false);
    setCurrentPollId(null);
  };

  // Ajouter la fonction au contexte global pour être accessible depuis ChatContainer
  useEffect(() => {
    window.handleOpenStrawpollVote = handleOpenStrawpollVote;
    return () => {
      window.handleOpenStrawpollVote = undefined;
    };
  }, []);

  // Ajout de la fonction pour créer un Strawpoll (appel backend sécurisé)
  const handleStrawpollSubmit = async ({ title, options }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/strawpoll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, options }),
      });
      if (!response.ok) throw new Error("Erreur Strawpoll: " + response.status);
      const data = await response.json();
      // Extraire l'ID du sondage depuis l'URL (https://strawpoll.com/polls/{id} ou https://strawpoll.com/{id})
      let pollId = null;
      if (data.url) {
        const match = data.url.match(
          /strawpoll.com\/(?:polls\/)?([a-zA-Z0-9]+)/
        );
        if (match) pollId = match[1];
      }
      if (socket && activeChannel) {
        socket.emit("message", {
          canal_id: activeChannel.id,
          // On encode l'ID du sondage dans le message pour l'affichage des résultats
          content: `Sondage créé : [${title}](${data.url})${
            pollId ? ` [strawpoll:${pollId}]` : ""
          }`,
          workspace_id: workspaceId,
        });
      }
    } catch (err) {
      alert(err.message || "Erreur lors de la création du sondage Strawpoll.");
    }
  };

  // Fonction pour envoyer un message système pour les appels vidéo
  const sendVideoCallSystemMessage = () => {
    console.log("Envoi d'un message système pour l'appel vidéo");
    if (socket && activeChannel) {
      // Créer un message système pour notifier l'appel vidéo
      socket.emit("message", {
        canal_id: activeChannel.id,
        content: `${currentUserName} a démarré un appel vidéo`,
        workspace_id: workspaceId,
        is_system_message: true,
        system_type: "video_call",
      });
    }
  };

  const handleStartVideoCall = () => {
    // Envoyer un message système avant d'afficher la fenêtre d'appel
    sendVideoCallSystemMessage();
    // Ouvrir la fenêtre d'appel vidéo
    setShowVideoCallModal(true);
  };

  // Use the custom hook to get state and handlers
  const {
    workspace: rawWorkspace,
    loading,
    error,
    searchQuery,
    handleSearchChange,
    searchResults,
    isSearching,
    handleSelectSearchResult,
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

  // Effect to mark channel as read when viewing it
  useEffect(() => {
    // Only mark channel as read when we have a valid channel ID that's different from the last one
    if (activeChannel && activeChannel.id) {
      const lastChannelId = sessionStorage.getItem("lastActiveChannel");

      // Only mark as read if this is a different channel from the last one
      if (lastChannelId !== activeChannel.id) {
        // Store the current channel ID
        sessionStorage.setItem("lastActiveChannel", activeChannel.id);

        // Mark the channel as read when it's selected (with less frequent updates)
        markChannelAsRead(activeChannel.id);
      }
    }
  }, [activeChannel?.id, markChannelAsRead]); // Use activeChannel.id instead of the whole object

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
      if (activeChannel && socket) {
        console.log(
          `📡 Canal actif: ${activeChannel.id}, Socket disponible: ${!!socket}`
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

        // Upload du fichier vers l'API - N'utilise pas le socket, mais une requête HTTP directe
        // Ce qui évite les problèmes de timeout avec Socket.IO
        const response = await fetch(`${API_URL}/api/messages/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
          // Augmenter le timeout pour les fichiers volumineux
          timeout: 60000, // 60 secondes de timeout
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
        } else if (!socket) {
          console.log(
            `❌ Problème de socket - socket n'est pas disponible`
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
    // Si l'URL est déjà complète, extraire le chemin du fichier
    const extractFilePath = (url) => {
      if (url.startsWith("http")) {
        try {
          // Si l'URL contient le bucket S3, extraire le chemin
          if (url.includes("s3-supchat.s3.fr-par.scw.cloud")) {
            const parts = url.split("s3-supchat.s3.fr-par.scw.cloud/");
            if (parts.length > 1) {
              return parts[1];
            }
          }
          // Sinon, retourner l'URL complète
          return url;
        } catch (error) {
          console.error(
            "Erreur lors de l'extraction du chemin de fichier:",
            error
          );
          return url;
        }
      }
      // Si ce n'est pas une URL complète, c'est déjà un chemin relatif
      return fileUrl;
    };

    // Extraire le chemin du fichier
    const filePath = extractFilePath(fileUrl);

    // Construire l'URL de téléchargement via le backend
    const token = localStorage.getItem("token");
    const downloadUrl = `${API_URL}/api/files/download/${encodeURIComponent(
      filePath
    )}`;

    // Créer un élément a temporaire pour déclencher le téléchargement
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName || "download";
    // Ajouter le token d'authentification
    if (token) {
      a.setAttribute("data-token", token);
      // Utiliser un hack pour envoyer le token dans l'en-tête
      fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Erreur de téléchargement");
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = window.URL.createObjectURL(blob);
          a.href = objectUrl;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(objectUrl);
          document.body.removeChild(a);
        })
        .catch((error) => {
          console.error("Erreur lors du téléchargement du fichier:", error);
          alert("Impossible de télécharger le fichier. Veuillez réessayer.");
        });
    } else {
      alert("Vous devez être connecté pour télécharger des fichiers.");
    }
  };

  // Permet d'ouvrir la modal Strawpoll depuis n'importe quel bouton du chat
  window.handleOpenStrawpollResults = handleOpenStrawpollResults;

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="workspace-details-container">
          <div className="loading-container">
            <Spinner size="medium" />
            <span className="loading-text">
              Chargement des détails du workspace...
            </span>
          </div>
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
        <WorkspaceSidebar
          workspace={workspace}
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          showChannels={showChannels}
          toggleChannelsVisibility={toggleChannelsVisibility}
          channels={channels}
          canalsLoading={canalsLoading}
          canalsError={canalsError}
          activeChannel={activeChannel}
          handleSelectChannel={handleSelectChannel}
          handleChannelContextMenu={handleChannelContextMenu}
          currentUserRole={currentUserRole}
          handleCreateChannel={handleCreateChannel}
          // Nouvelles props pour la recherche unifiée
          members={members}
          messages={messages}
          searchResults={searchResults}
          handleSelectSearchResult={handleSelectSearchResult}
          isSearching={isSearching}
        />

        {/* Main Content Area - Modified for chat */}
        <ChatContainer
          activeChannel={activeChannel}
          loadingMessages={loadingMessages}
          messages={messages}
          currentUserId={currentUserId}
          chatContainerRef={chatContainerRef}
          handleMessageContextMenu={handleMessageContextMenu}
          formatMessageDate={formatMessageDate}
          parseFileContent={parseFileContent}
          handleOpenFileViewer={handleOpenFileViewer}
          handleDownloadFile={handleDownloadFile}
          isMistralTyping={isMistralTyping}
          getEmojiForType={getEmojiForType}
          handleReplyMessage={handleReplyMessage}
          handleShowEmojiPicker={handleShowEmojiPicker}
          handleDeleteMessage={handleDeleteMessage}
          messageContextMenu={messageContextMenu}
          replyingTo={replyingTo}
          handleCancelReply={handleCancelReply}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          displayMessage={displayMessage}
          handleNewMessageChange={handleNewMessageChange}
          handleChatInputKeyDown={handleChatInputKeyDown}
          setShowEmojiPicker={setShowEmojiPicker}
          showMentionSuggestions={showMentionSuggestions}
          mentionSuggestions={mentionSuggestions}
          activeMentionIndex={activeMentionIndex}
          handleSelectMention={handleSelectMention}
          handleSendMessageWithMistralCheck={handleSendMessageWithMistralCheck}
          showToolbox={showToolbox}
          handleToggleToolbox={handleToggleToolbox}
          handleOpenStrawpoll={handleOpenStrawpoll}
          showStrawpollModal={showStrawpollModal}
          handleCloseStrawpollModal={handleCloseStrawpollModal}
          handleStrawpollSubmit={handleStrawpollSubmit}
          commonEmojis={commonEmojis}
          showEmojiPicker={showEmojiPicker}
          handleAddReaction={handleAddReaction}
          renderTextWithLinks={renderTextWithLinks}
          isUuid={isUuid}
          handleSelectActiveItem={handleSelectActiveItem}
          setShowVideoCallModal={handleStartVideoCall} // Ajout du handler pour démarrer l'appel vidéo
        />

        {/* Details Sidebar - Replaced with WorkspaceDetailsSidebar */}
        <WorkspaceDetailsSidebar
          showMembers={showMembers}
          showOnlineMembers={showOnlineMembers}
          showOfflineMembers={showOfflineMembers}
          showFiles={showFiles}
          showImages={showImages}
          members={members}
          files={files}
          images={images}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          handleOpenProfile={handleOpenProfile}
          handleMemberContextMenu={handleMemberContextMenu}
          memberContextMenu={memberContextMenu}
          handleChangeMemberRole={handleChangeMemberRole}
          toggleMembers={toggleMembers}
          toggleOnlineMembers={toggleOnlineMembers}
          toggleOfflineMembers={toggleOfflineMembers}
          toggleFiles={toggleFiles}
          toggleImages={toggleImages}
          getRoleIcon={getRoleIcon}
          formatMessageDate={formatMessageDate}
          handleDownloadFile={handleDownloadFile}
          S3_BASE_URL={S3_BASE_URL}
          handleOpenFileViewer={handleOpenFileViewer}
          workspace={workspace}
        />

        {/* Modal de création de canal - Structure améliorée */}
        {showCreateChannelModal && (
          <CreateChannelModal
            channelError={channelError}
            newChannel={newChannel}
            isCreatingChannel={isCreatingChannel}
            handleCloseModal={handleCloseModal}
            handleSubmitChannel={handleSubmitChannel}
            handleChannelInputChange={handleChannelInputChange}
            setNewChannel={setNewChannel}
          />
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
        {showEditChannelModal && (
          <EditChannelModal
            updateChannelError={updateChannelError}
            editingChannel={editingChannel}
            isUpdatingChannel={isUpdatingChannel}
            setShowEditChannelModal={setShowEditChannelModal}
            handleSubmitEditChannel={handleSubmitEditChannel}
            setEditingChannel={setEditingChannel}
          />
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
        {showEmojiPicker && (
          <EmojiPickerModal
            commonEmojis={commonEmojis}
            handleAddReaction={handleAddReaction}
            setShowEmojiPicker={setShowEmojiPicker}
          />
        )}

        {/* Modal pour afficher un fichier en plein écran */}
        {fullscreenFile && (
          <FileViewerModal
            fullscreenFile={fullscreenFile}
            handleCloseFileViewer={handleCloseFileViewer}
            handleDownloadFile={handleDownloadFile}
          />
        )}

        {/* Modal d'affichage des résultats Strawpoll */}
        <StrawpollResultsModal
          showStrawpollResults={showStrawpollResults}
          handleCloseStrawpollResults={handleCloseStrawpollResults}
          loadingResults={loadingResults}
          strawpollResults={strawpollResults}
        />

        {/* Modal Strawpoll */}
        <StrawpollModalWrapper
          show={showStrawpollModal}
          onClose={handleCloseStrawpollModal}
          onSubmit={handleStrawpollSubmit}
        />

        {/* Modal d'appel vidéo */}
        <VideoCallModal
          show={showVideoCallModal}
          onClose={() => setShowVideoCallModal(false)}
          workspace={workspace}
          activeChannel={activeChannel}
          currentUserName={currentUserName}
          socket={socket}
        />

        {/* Ajouter le modal de webview pour voter */}
        <StrawpollWebviewModal
          show={showStrawpollVote}
          pollId={currentPollId}
          onClose={handleCloseStrawpollVote}
        />
      </div>
    </div>
  );
}

export default WorkspaceDetails;
