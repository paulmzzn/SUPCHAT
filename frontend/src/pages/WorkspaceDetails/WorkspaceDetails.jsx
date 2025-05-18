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
import VideoCallModal from "./VideoCallModal";
import StrawpollWebviewModal from "./StrawpollWebviewModal";
import ChannelMembersModal from "./ChannelMembersModal"; // Importer la nouvelle modal
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "./WorkspaceDetails.css";
import { useWorkspaceDetails } from "../../hooks/useWorkspaceDetails";
import { useNotifications } from "../../context/NotificationContext";
import { API_URL } from "../../config/config";
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
  FaUsers,
} from "react-icons/fa";

function WorkspaceDetails() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { markChannelAsRead } = useNotifications();

  const S3_BASE_URL = "https://s3-supchat.s3.fr-par.scw.cloud/";

  const fileInputRef = useRef(null);

  const [fullscreenFile, setFullscreenFile] = useState(null);
  const [showToolbox, setShowToolbox] = useState(false);
  const [showStrawpollModal, setShowStrawpollModal] = useState(false);
  const [showStrawpollResults, setShowStrawpollResults] = useState(false);
  const [strawpollResults, setStrawpollResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [showStrawpollVote, setShowStrawpollVote] = useState(false);
  const [currentPollId, setCurrentPollId] = useState(null);
  const [isMember, setIsMember] = useState(null);
  const [membershipChecking, setMembershipChecking] = useState(true);
  const [showChannelMembersModal, setShowChannelMembersModal] = useState(false);

  useEffect(() => {
    async function checkWorkspaceMembership() {
      try {
        setMembershipChecking(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate('/login');
          return;
        }
        
        const userResponse = await fetch(`${API_URL}/api/users/verify-token`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!userResponse.ok) {
          throw new Error("Erreur d'authentification");
        }
        
        const userData = await userResponse.json();
        const userId = userData.user_id;
        
        const membershipResponse = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!membershipResponse.ok) {
          throw new Error("Impossible de vérifier l'appartenance au workspace");
        }
        
        const membershipData = await membershipResponse.json();
        setIsMember(membershipData.isMember);
        
        if (!membershipData.isMember) {
          const workspaceResponse = await fetch(`${API_URL}/api/workspaces/${workspaceId}`);
          if (workspaceResponse.ok) {
            navigate(`/join-workspace?id=${workspaceId}`);
          } else {
            navigate('/workspaces', { 
              state: { 
                error: "Ce workspace n'existe pas ou vous n'y avez pas accès." 
              } 
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification d'appartenance au workspace:", error);
        setIsMember(false);
        navigate('/workspaces', { 
          state: { 
            error: "Impossible de vérifier l'accès à ce workspace." 
          } 
        });
      } finally {
        setMembershipChecking(false);
      }
    }
    
    if (workspaceId) {
      checkWorkspaceMembership();
    }
  }, [workspaceId, navigate]);

  const handleToggleToolbox = () => setShowToolbox((v) => !v);
  const handleOpenStrawpoll = () => {
    setShowToolbox(false);
    setShowStrawpollModal(true);
  };
  const handleCloseStrawpollModal = () => setShowStrawpollModal(false);

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

  const handleOpenStrawpollVote = (pollId) => {
    setCurrentPollId(pollId);
    setShowStrawpollVote(true);
  };

  const handleCloseStrawpollVote = () => {
    setShowStrawpollVote(false);
    setCurrentPollId(null);
  };

  useEffect(() => {
    window.handleOpenStrawpollVote = handleOpenStrawpollVote;
    return () => {
      window.handleOpenStrawpollVote = undefined;
    };
  }, []);

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

  const sendVideoCallSystemMessage = () => {
    console.log("Envoi d'un message système pour l'appel vidéo");
    if (socket && activeChannel) {
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
    sendVideoCallSystemMessage();
    setShowVideoCallModal(true);
  };

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
    setMessages,
    newMessage,
    displayMessage,
    loadingMessages,
    chatContainerRef,
    socket,
    currentUserId,
    currentUserName,
    currentUserRole,
    messageContextMenu,
    showEmojiPicker,
    replyingTo,
    setReplyingTo,
    commonEmojis,
    isMistralTyping,
    showMentionSuggestions,
    mentionSuggestions,
    activeMentionIndex,
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
    handleDeleteMessage,
    handleMistralMention,
    fetchActiveChannel,
  } = useWorkspaceDetails(workspaceId);

  useEffect(() => {
    if (activeChannel && activeChannel.id) {
      const lastChannelId = sessionStorage.getItem("lastActiveChannel");
      if (lastChannelId !== activeChannel.id) {
        sessionStorage.setItem("lastActiveChannel", activeChannel.id);
        markChannelAsRead(activeChannel.id);
      }
    }
  }, [activeChannel?.id, markChannelAsRead]);

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

  const handleOpenFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleOpenFileViewer = (fileData) => {
    setFullscreenFile(fileData);
  };

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
        handleSelectActiveItem();
        e.preventDefault();
      }
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

  const [memberContextMenu, setMemberContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    member: null,
  });

  const handleMemberContextMenu = (e, member) => {
    e.preventDefault();
    if (currentUserRole !== "owner" && currentUserRole !== "admin") return;
    if (member.role === "owner") return;
    if (currentUserRole === "admin" && member.role !== "member") return;
    setMemberContextMenu({ visible: true, x: e.pageX, y: e.pageY, member });
  };

  const handleCloseMemberContextMenu = () =>
    setMemberContextMenu({ ...memberContextMenu, visible: false });

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
        if (typeof fetchWorkspaceMembers === "function")
          fetchWorkspaceMembers();
      }
    } catch (e) {
      alert("Erreur lors du changement de rôle");
    } finally {
      handleCloseMemberContextMenu();
    }
  };

  const handleDownloadFile = (fileUrl, fileName) => {
    const extractFilePath = (url) => {
      if (url.startsWith("http")) {
        try {
          if (url.includes("s3-supchat.s3.fr-par.scw.cloud")) {
            const parts = url.split("s3-supchat.s3.fr-par.scw.cloud/");
            if (parts.length > 1) {
              return parts[1];
            }
          }
          return url;
        } catch (error) {
          console.error(
            "Erreur lors de l'extraction du chemin de fichier:",
            error
          );
          return url;
        }
      }
      return fileUrl;
    };

    const filePath = extractFilePath(fileUrl);

    const token = localStorage.getItem("token");
    const downloadUrl = `${API_URL}/api/files/download/${encodeURIComponent(
      filePath
    )}`;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName || "download";
    if (token) {
      a.setAttribute("data-token", token);
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

  const handleManageChannelMembers = () => {
    setShowChannelMembersModal(true);
  };

  const handleCloseChannelMembersModal = () => {
    setShowChannelMembersModal(false);
  };

  const handleChannelMembersUpdated = () => {
    if (activeChannel) {
      if (typeof fetchActiveChannel === 'function') {
        fetchActiveChannel(activeChannel.id);
      }
    }
  };

  if (membershipChecking) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="workspace-details-container">
          <div className="loading-container">
            <Spinner size="medium" />
            <span className="loading-text">
              Vérification de l'accès au workspace...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return null;
  }

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
          members={members}
          messages={messages}
          searchResults={searchResults}
          handleSelectSearchResult={handleSelectSearchResult}
          isSearching={isSearching}
          currentUserId={currentUserId}
        />

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
          setShowVideoCallModal={handleStartVideoCall}
          handleManageChannelMembers={handleManageChannelMembers}
          isChannelPrivate={activeChannel?.isPrivate}
          canManageMembers={
            currentUserRole === "owner" ||
            currentUserRole === "admin" ||
            (activeChannel?.isPrivate && activeChannel?.isCreator)
          }
          currentUserAccessRight={activeChannel?.memberAccess}
        />

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
            {contextMenu.channel && contextMenu.channel.isPrivate && (
              <div className="context-menu-item" onClick={handleManageChannelMembers}>
                <FaUsers className="context-menu-icon" />
                <span>Gérer les membres</span>
              </div>
            )}
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
          <EditChannelModal
            updateChannelError={updateChannelError}
            editingChannel={editingChannel}
            isUpdatingChannel={isUpdatingChannel}
            setShowEditChannelModal={setShowEditChannelModal}
            handleSubmitEditChannel={handleSubmitEditChannel}
            setEditingChannel={setEditingChannel}
          />
        )}

        {showChannelMembersModal && contextMenu.channel && (
          <ChannelMembersModal
            show={showChannelMembersModal}
            onClose={handleCloseChannelMembersModal}
            channel={contextMenu.channel}
            workspaceId={workspaceId}
            workspaceMembers={members.online.concat(members.offline)}
            currentUserRole={currentUserRole}
            onMembersUpdated={handleChannelMembersUpdated}
          />
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
          <EmojiPickerModal
            commonEmojis={commonEmojis}
            handleAddReaction={handleAddReaction}
            setShowEmojiPicker={setShowEmojiPicker}
          />
        )}

        {fullscreenFile && (
          <FileViewerModal
            fullscreenFile={fullscreenFile}
            handleCloseFileViewer={handleCloseFileViewer}
            handleDownloadFile={handleDownloadFile}
          />
        )}

        <StrawpollResultsModal
          showStrawpollResults={showStrawpollResults}
          handleCloseStrawpollResults={handleCloseStrawpollResults}
          loadingResults={loadingResults}
          strawpollResults={strawpollResults}
        />

        <StrawpollModalWrapper
          show={showStrawpollModal}
          onClose={handleCloseStrawpollModal}
          onSubmit={handleStrawpollSubmit}
        />

        <VideoCallModal
          show={showVideoCallModal}
          onClose={() => setShowVideoCallModal(false)}
          workspace={workspace}
          activeChannel={activeChannel}
          currentUserName={currentUserName}
          socket={socket}
        />

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
