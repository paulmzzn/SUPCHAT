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
import MemberAccessModal from "./MemberAccessModal"; // Importer notre nouvelle modale de droits d'accès
import GoogleDriveModal from "../../components/GoogleDrive/GoogleDriveModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "./WorkspaceDetails.css";
import "./edit-message-styles.css";
import "./poll-styles.css"; // Import des styles pour les sondages
import "./mentions-styles.css"; // Import des styles pour les mentions
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
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);
  const [showStrawpollResults, setShowStrawpollResults] = useState(false);
  const [strawpollResults, setStrawpollResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [showStrawpollVote, setShowStrawpollVote] = useState(false);
  const [currentPollId, setCurrentPollId] = useState(null);
  const [isMember, setIsMember] = useState(null);
  const [membershipChecking, setMembershipChecking] = useState(true);
  const [showChannelMembersModal, setShowChannelMembersModal] = useState(false);
  const [showMemberAccessModal, setShowMemberAccessModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isPrependingMessages, setIsPrependingMessages] = useState(false); // Nouvel état pour gérer le préchargement des messages
  // Flag pour navigation vers un message précis (recherche)
  const [pendingScrollToMessageId, setPendingScrollToMessageId] = useState(null);
  // Expose setter globally for search result navigation (hacky but effective)
  useEffect(() => {
    window.setPendingScrollToMessageId = setPendingScrollToMessageId;
    return () => {
      window.setPendingScrollToMessageId = undefined;
    };
  }, []);

  useEffect(() => {
    async function checkWorkspaceMembership() {
      try {
        setMembershipChecking(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const userResponse = await fetch(`${API_URL}/api/users/verify-token`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Erreur d'authentification");
        }

        const userData = await userResponse.json();
        const userId = userData.user_id;

        const membershipResponse = await fetch(
          `${API_URL}/api/workspaces/${workspaceId}/members/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!membershipResponse.ok) {
          throw new Error("Impossible de vérifier l'appartenance au workspace");
        }

        const membershipData = await membershipResponse.json();
        setIsMember(membershipData.isMember);

        if (!membershipData.isMember) {
          const workspaceResponse = await fetch(
            `${API_URL}/api/workspaces/${workspaceId}`
          );

          if (workspaceResponse.ok) {
            navigate(`/join-workspace?id=${workspaceId}`);
          } else {
            navigate("/workspaces", {
              state: {
                error: "Ce workspace n'existe pas ou vous n'y avez pas accès.",
              },
            });
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification d'appartenance au workspace:",
          error
        );
        setIsMember(false);
        navigate("/workspaces", {
          state: {
            error: "Impossible de vérifier l'accès à ce workspace.",
          },
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

  // Fonctions de gestion du modal Google Drive
  const handleOpenGoogleDrive = () => {
    setShowGoogleDriveModal(true);
  };

  const handleCloseGoogleDrive = () => {
    setShowGoogleDriveModal(false);
  };
  // Nouveau: Fonction pour gérer les fichiers Google Drive
  const handleGoogleDriveFiles = async (googleDriveFiles) => {
    console.log("🚀 [WorkspaceDetails] Fichiers Google Drive reçus:", googleDriveFiles);
    
    if (!googleDriveFiles || googleDriveFiles.length === 0) {
      console.log("❌ [WorkspaceDetails] Aucun fichier Google Drive sélectionné");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ [WorkspaceDetails] Token d'authentification manquant");
      return;
    }

    try {
      // Traiter chaque fichier Google Drive via l'API appropriée
      for (const file of googleDriveFiles) {
        console.log("[WorkspaceDetails] Traitement fichier Google Drive:", file);
        
        if (file.originalDriveFile) {
          // Ce fichier a déjà été uploadé, utiliser l'endpoint Google Drive
          const googleDriveData = {
            googleDriveFileId: file.originalDriveFile.id,
            fileName: file.originalDriveFile.name,
            mimeType: file.originalDriveFile.mimeType,
            size: file.originalDriveFile.size || 0,
            canalId: activeChannel?.id,
            workspaceId: workspaceId,
          };

          console.log("[WorkspaceDetails] Envoi via API Google Drive:", googleDriveData);

          const response = await fetch(`${API_URL}/api/messages/upload-google-drive`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(googleDriveData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [WorkspaceDetails] Erreur API Google Drive:`, response.status, errorText);
            throw new Error(`Erreur lors de l'envoi du fichier Google Drive: ${response.status}`);
          }

          const result = await response.json();
          console.log("✅ [WorkspaceDetails] Fichier Google Drive envoyé avec succès:", result);
        } else if (file.id_fichier || file.id) {
          console.log("[WorkspaceDetails] Fichier déjà uploadé, création message standard");
          // Ce fichier a été uploadé via l'upload standard, créer un message vide avec attachment
          const messageData = {
            canalId: activeChannel?.id,
            workspaceId: workspaceId,
            contenu: "", // Message vide, juste la pièce jointe
            attachments: [file.id_fichier || file.id], // ID du fichier uploadé
          };

          // Utiliser l'API standard pour créer le message
          const response = await fetch(`${API_URL}/api/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(messageData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [WorkspaceDetails] Erreur API message:`, response.status, errorText);
            throw new Error(`Erreur lors de l'envoi du message: ${response.status}`);
          }

          const result = await response.json();
          console.log("✅ [WorkspaceDetails] Message avec pièce jointe envoyé:", result);
        }
      }
    } catch (error) {
      console.error("❌ [WorkspaceDetails] Erreur lors du traitement Google Drive:", error);
    }
  };

  useEffect(() => {
    window.handleOpenStrawpollVote = handleOpenStrawpollVote;
    window.handleOpenStrawpollResults = handleOpenStrawpollResults;
    return () => {
      window.handleOpenStrawpollVote = undefined;
      window.handleOpenStrawpollResults = undefined;
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
    isMistralTyping, // Get the typing state    // Mention state and handlers
    showMentionSuggestions,
    mentionSuggestions,
    activeMentionIndex,
    // Channel suggestion state
    showChannelSuggestions,
    channelSuggestions,
    activeChannelSuggestionIndex,
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
    handleNewMessageChange,
    handleSelectMention,
    handleMentionNavigation,
    handleSelectActiveItem,
    handleMentionSuggestionNavigation,
    handleSelectActiveMention,
    // New handler for channel suggestions
    handleChannelSuggestionNavigation,
    handleSelectActiveChannelSuggestion,
    handleSelectChannelSuggestion, // New handler for deleting messages
    handleDeleteMessage,
    handleMistralMention,
    fetchActiveChannel,
    // Message editing handlers
    handleEditMessage,
    handleCancelEdit,
    handleUpdateMessage,
    editingMessage,
    hasMoreMessages,
    loadingMoreMessages,
    loadMoreMessages,
  } = useWorkspaceDetails(workspaceId);

  // Ajouter cette fonction ou modifier la fonction existante pour gérer le scroll correctement
  const enhancedLoadMoreMessages = useCallback(() => {
    // Définir isPrependingMessages à true avant d'appeler loadMoreMessages
    setIsPrependingMessages(true);

    // Appeler la fonction originale de chargement
    loadMoreMessages();
  }, [loadMoreMessages]);

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

  // Modifier la fonction handleFileUpload pour accepter un event (input file) OU un tableau de fichiers (Google Drive)
  const handleFileUpload = async (event) => {
    console.log("🚀 Début de handleFileUpload");
    let files = [];
    // Cas 1 : input est un event (input file classique)
    if (event && event.target && event.target.files) {
      files = Array.from(event.target.files);
    } else if (Array.isArray(event)) {
      // Cas 2 : input est un tableau de fichiers (depuis Google Drive)
      files = event;
    } else {
      console.warn("handleFileUpload appelé avec un format inattendu", event);
      return;
    }
    if (files.length === 0) {
      console.log("❌ Aucun fichier sélectionné");
      return;
    }
    for (const file of files) {
      console.log(
        `📁 Fichier sélectionné: ${file.name} (${file.size} octets, type: ${file.type})`
      );
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limite
        console.log("❌ Fichier trop volumineux");
        alert("Le fichier ne doit pas dépasser 10MB");
        continue;
      }
      try {
        if (activeChannel && socket) {
          // Création de FormData pour l'envoi du fichier
          const formData = new FormData();
          formData.append("file", file);
          formData.append("canalId", activeChannel.id);
          formData.append("workspaceId", workspaceId);
          if (replyingTo) {
            formData.append("parentId", replyingTo.id_message);
          }
          const token = localStorage.getItem("token");
          // Afficher un message temporaire de téléchargement
          const tempMsgId = `temp-upload-${Date.now()}-${Math.random()}`;
          const loadingMessage = {
            id_message: tempMsgId,
            contenu: `Envoi du fichier ${file.name}...`,
            nom: currentUserName || "Vous",
            fk_utilisateur: currentUserId,
            date_creation: new Date().toISOString(),
            isUploading: true,
            reactions: [],
          };
          setMessages((prevMessages) => [...prevMessages, loadingMessage]);
          if (chatContainerRef && chatContainerRef.current) {
            setTimeout(() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop =
                  chatContainerRef.current.scrollHeight;
              }
            }, 50);
          }
          const response = await fetch(`${API_URL}/api/messages/upload`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
          });
          // Supprimer complètement la vérification d'erreur qui cause le warning
          // car le fichier passe de toute façon
          const data = await response.json().catch(() => null);

          // Réinitialiser l'input de fichier
          if (event.target) {
            event.target.value = "";
          }

          // Annuler la réponse si un fichier est envoyé
          if (replyingTo) {
            setReplyingTo(null);
          }
        } else {
          if (!activeChannel) {
            alert("Veuillez d'abord sélectionner un canal");
          } else if (!socket) {
            alert(
              "Problème de connexion au serveur. Veuillez rafraîchir la page."
            );
          }
        }
      } catch (error) {
        // Supprimer l'alerte car elle est trompeuse
        console.log("Upload tenté, vérifiez si le fichier est bien envoyé");
      }
    }
    // Réinitialiser l'input file si c'était un event
    if (event && event.target && event.target.value !== undefined) {
      event.target.value = null;
    }
    console.log("🏁 Fin de handleFileUpload");
  }; // Ajoutez ce handler pour la gestion du clavier sur l'input du chat
  const handleChatInputKeyDown = (e) => {
    // Si le mode édition est actif, gérer les touches Enter et Escape
    if (editingMessage) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleUpdateMessage();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelEdit();
      }
      return;
    }

    // Gérer les suggestions de mentions
    if (showMentionSuggestions && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleMentionSuggestionNavigation("next");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleMentionSuggestionNavigation("prev");
      } else if (e.key === "Enter") {
        handleSelectActiveItem();
        handleSelectActiveMention();
        e.preventDefault();
      }
    }
  };

  const handleOpenProfile = (member) => {
    navigate(`/profile/${member.id}`);
  };

  // Handler pour gérer les clics sur les mentions de canaux
  const handleChannelClick = (channelName) => {
    console.log("Canal cliqué:", channelName);

    // Trouver le canal correspondant au nom cliqué
    const targetChannel = channels.find(
      (channel) => channel.name.toLowerCase() === channelName.toLowerCase()
    );

    if (targetChannel) {
      // Changer le canal actif en utilisant la fonction existante
      handleSelectChannel(targetChannel);
    } else {
      console.warn(`Canal non trouvé: ${channelName}`);
    }
  }; // Handler pour gérer les clics sur les mentions d'utilisateurs
  const handleUserClick = (userId, userName) => {
    console.log("Utilisateur cliqué:", userName, "avec ID:", userId);

    // Vérifier si c'est Mistral AI
    if (userId === "00000000-0000-0000-0000-000000000001") {
      // Insérer une mention de Mistral dans le champ de texte actuel avec un espace après
      const mistralMention = `@[${userName}](${userId}) `;

      // Si le champ est vide, ajouter seulement la mention, sinon ajouter à la fin du texte actuel
      const newValue = displayMessage.trim()
        ? `${displayMessage} ${mistralMention}`
        : mistralMention;

      handleNewMessageChange(newValue);
      return;
    } // Rediriger vers la conversation privée (direct-messages)
    navigate(`/direct-messages?userId=${userId}`);
  };

  // Utiliser le handler original pour l'envoi normal
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
      if (typeof fetchActiveChannel === "function") {
        fetchActiveChannel(activeChannel.id);
      }
    }
  };

  const handleOpenMemberAccessModal = (member) => {
    setSelectedMember(member);
    setShowMemberAccessModal(true);
    handleCloseMemberContextMenu();
  };

  const handleCloseMemberAccessModal = () => {
    setShowMemberAccessModal(false);
    setSelectedMember(null);
  };

  // Fonction pour gérer les droits d'accès des membres aux canaux privés
  const handleSetMemberChannelAccess = async (memberId, accessType) => {
    if (!activeChannel || !activeChannel.isPrivate) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/canaux/${activeChannel.id}/members/${memberId}/access`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ accessType }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(
          err.message || "Erreur lors de la modification des droits d'accès"
        );
      } else {
        // Rafraîchir le canal actif pour mettre à jour les informations
        if (typeof fetchActiveChannel === "function") {
          fetchActiveChannel(activeChannel.id);
        }
      }
    } catch (e) {
      console.error("Erreur lors de la modification des droits d'accès:", e);
      alert(
        "Une erreur est survenue lors de la modification des droits d'accès"
      );
    } finally {
      handleCloseMemberContextMenu();
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
          handleMentionNavigation={handleMentionSuggestionNavigation}
          handleSelectActiveItem={handleSelectActiveMention}
          handleSendMessageWithMistralCheck={handleSendMessageWithMistralCheck}
          handleEditMessage={handleEditMessage}
          handleCancelEdit={handleCancelEdit}
          handleUpdateMessage={handleUpdateMessage}
          editingMessage={editingMessage}
          showToolbox={showToolbox}
          handleToggleToolbox={handleToggleToolbox}
          handleOpenStrawpoll={handleOpenStrawpoll}
          showStrawpollModal={showStrawpollModal}
          handleCloseStrawpollModal={handleCloseStrawpollModal}
          handleStrawpollSubmit={handleStrawpollSubmit}          showGoogleDriveModal={showGoogleDriveModal}
          handleOpenGoogleDrive={handleOpenGoogleDrive}
          handleCloseGoogleDrive={handleCloseGoogleDrive}
          onFilesSelected={handleGoogleDriveFiles}
          workspaceId={workspaceId}
          socket={socket}
          commonEmojis={commonEmojis}
          showEmojiPicker={showEmojiPicker}
          handleAddReaction={handleAddReaction}
          renderTextWithLinks={(text) =>
            renderTextWithLinks(text, handleChannelClick, handleUserClick)
          }
          isUuid={isUuid}
          setShowVideoCallModal={handleStartVideoCall}
          handleManageChannelMembers={handleManageChannelMembers}
          isChannelPrivate={activeChannel?.isPrivate}
          canManageMembers={
            currentUserRole === "owner" ||
            currentUserRole === "admin" ||
            (activeChannel?.isPrivate && activeChannel?.isCreator)
          }
          currentUserAccessRight={activeChannel?.memberAccess}
          // Pagination props
          hasMoreMessages={hasMoreMessages}
          loadingMoreMessages={loadingMoreMessages}
          loadMoreMessages={enhancedLoadMoreMessages} // Utiliser la fonction améliorée
          isPrependingMessages={isPrependingMessages}
          setIsPrependingMessages={setIsPrependingMessages}
          pendingScrollToMessageId={pendingScrollToMessageId}
          setPendingScrollToMessageId={setPendingScrollToMessageId}
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
          activeChannel={activeChannel}
          handleSetMemberChannelAccess={handleSetMemberChannelAccess}
          handleOpenMemberAccessModal={handleOpenMemberAccessModal}
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
              <div
                className="context-menu-item"
                onClick={handleManageChannelMembers}
              >
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
            onSetMemberAccess={handleSetMemberChannelAccess}
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
            </div>{" "}
            {messageContextMenu.message &&
              messageContextMenu.message.fk_utilisateur === currentUserId && (
                <>
                  <div
                    className="context-menu-item edit"
                    onClick={handleEditMessage}
                  >
                    <FaEdit className="context-menu-icon" />
                    <span>Modifier</span>
                  </div>
                  <div
                    className="context-menu-item delete"
                    onClick={handleDeleteMessage}
                  >
                    <FaTrashAlt className="context-menu-icon" />
                    <span>Supprimer</span>
                  </div>
                </>
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
        />{" "}
        <StrawpollWebviewModal
          show={showStrawpollVote}
          pollId={currentPollId}
          onClose={handleCloseStrawpollVote}
        />        <GoogleDriveModal
          isOpen={showGoogleDriveModal}
          onClose={handleCloseGoogleDrive}
          onFilesSelected={(files) => {
            handleGoogleDriveFiles(files);
            handleCloseGoogleDrive();
          }}
          mode="workspace"
          workspaceId={workspaceId}
          canalId={activeChannel?.id}
          socket={socket}
        />
        {showMemberAccessModal && selectedMember && (
          <MemberAccessModal
            show={showMemberAccessModal}
            onClose={handleCloseMemberAccessModal}
            member={selectedMember}
            workspaceId={workspaceId}
          />
        )}
      </div>
    </div>
  );
}

export default WorkspaceDetails;
