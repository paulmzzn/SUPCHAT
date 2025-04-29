import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import { API_URL } from "../config/config";
import {
  FaThumbsUp,
  FaHeart,
  FaLaugh,
  FaSurprise,
  FaSadTear,
  FaAngry,
  FaRobot,
} from "react-icons/fa"; // Added FaRobot for consistency

// Helper pour formater la taille du fichier
function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// Helper pour trier par date décroissante
function sortByDateDesc(a, b) {
  const dateA = new Date(a.uploadedAt);
  const dateB = new Date(b.uploadedAt);
  return dateB - dateA;
}

// Helper function to get emoji for reaction type
const getEmojiForType = (reactionType) => {
  const emojiMap = {
    thumbsUp: "👍",
    heart: "❤️",
    laugh: "😂",
    surprise: "😮",
    sad: "😢",
    angry: "😠",
  };
  return emojiMap[reactionType] || reactionType;
};

const MISTRAL_USER_ID = "00000000-0000-0000-0000-000000000001";
const MISTRAL_USERNAME = "Mistral AI";
const MISTRAL_AVATAR =
  "https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp";

export const useWorkspaceDetails = (workspaceId) => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [showChannels, setShowChannels] = useState(true);
  const [canalsLoading, setCanalsLoading] = useState(false);
  const [canalsError, setCanalsError] = useState(null);

  // States for right sidebar sections
  const [showMembers, setShowMembers] = useState(true);
  const [showOnlineMembers, setShowOnlineMembers] = useState(true);
  const [showOfflineMembers, setShowOfflineMembers] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showImages, setShowImages] = useState(true);

  // Member loading state
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);

  // Members state
  const [members, setMembers] = useState({
    online: [],
    offline: [],
  });

  const [activeChannel, setActiveChannel] = useState(null); // doit être AVANT tout useEffect qui utilise activeChannel
  const [messages, setMessages] = useState([]); // doit être AVANT tout useEffect qui utilise messages

  // Files and Images (sidebar) : extraire les fichiers à partir des messages du canal actif
  const [files, setFiles] = useState([]);
  const [images, setImages] = useState([]);

  // Met à jour la liste des fichiers à chaque changement de messages ou de canal actif
  useEffect(() => {
    if (!activeChannel || !messages || messages.length === 0) {
      setFiles([]);
      setImages([]);
      return;
    }
    // Extraction robuste des fichiers à partir des messages du canal actif
    const fileMessages = messages
      .filter((msg) => msg.fk_canal === activeChannel.id)
      .map((msg) => {
        let parsed = null;
        try {
          parsed =
            typeof msg.contenu === "string"
              ? JSON.parse(msg.contenu)
              : msg.contenu;
        } catch (e) {
          return null;
        }
        if (parsed && parsed.type === "file") {
          return {
            id: msg.id_message,
            name: parsed.fileName || "Fichier",
            type: parsed.fileType || "file",
            size: parsed.fileSize ? formatFileSize(parsed.fileSize) : "",
            uploadedBy: msg.fk_utilisateur,
            uploadedAt:
              msg.date_envoi || msg.created_at || msg.date_creation || "",
            url: parsed.fileUrl,
            isImage: parsed.isImage || false,
            fileSize: parsed.fileSize || 0,
            fileType: parsed.fileType || "",
            fileUrl: parsed.fileUrl || "",
          };
        }
        return null;
      })
      .filter(Boolean);

    // Séparer images et autres fichiers
    const images = fileMessages
      .filter((f) => f.isImage || (f.type && f.type.startsWith("image/")))
      .sort(sortByDateDesc);
    const files = fileMessages
      .filter((f) => !f.isImage && !(f.type && f.type.startsWith("image/")))
      .sort(sortByDateDesc);

    setImages(images);
    setFiles(files);
  }, [messages, activeChannel]);

  // Create Channel Modal state
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: "", isPrivate: false });
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState("");

  // Channel Context Menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    channelId: null,
    channelName: "",
    isPrivate: false,
  });

  // Edit Channel Modal state
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState({
    id: null,
    name: "",
    isPrivate: false,
  });
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
  const [updateChannelError, setUpdateChannelError] = useState("");

  // Chat state
  const [newMessage, setNewMessage] = useState("");
  const [displayMessage, setDisplayMessage] = useState(""); // Added state for displayed message
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatContainerRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Current User ID state
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");

  // Ajout : calcul du rôle courant dans le workspace
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // Message Context Menu state
  const [messageContextMenu, setMessageContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    messageId: null,
    message: null,
  });

  // Emoji Picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Replying state
  const [replyingTo, setReplyingTo] = useState(null);

  // Common Emojis for reactions
  const commonEmojis = [
    { icon: <FaThumbsUp />, name: "thumbsUp", label: "👍" },
    { icon: <FaHeart />, name: "heart", label: "❤️" },
    { icon: <FaLaugh />, name: "laugh", label: "😂" },
    { icon: <FaSurprise />, name: "surprise", label: "😮" },
    { icon: <FaSadTear />, name: "sad", label: "😢" },
    { icon: <FaAngry />, name: "angry", label: "😠" },
  ];

  const [isMistralTyping, setIsMistralTyping] = useState(false); // State for typing indicator

  // Mention state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionableUsers, setMentionableUsers] = useState([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  // Fetch canals function using useCallback
  const fetchCanals = useCallback(async () => {
    try {
      setCanalsLoading(true);
      setCanalsError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }

      const data = await response.json();

      const formattedChannels = data.map((canal) => ({
        id: canal.id_canal,
        name: canal.nom,
        isPrivate: canal.is_private || false,
        description: canal.description || "",
      }));

      setChannels(formattedChannels);
      console.log("Canaux récupérés:", formattedChannels);
    } catch (err) {
      console.error("Error fetching channels:", err);
      setCanalsError(err.message);
      setChannels([]);
    } finally {
      setCanalsLoading(false);
    }
  }, [workspaceId]);

  // Fetch workspace members function using useCallback
  const fetchWorkspaceMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      setMembersError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch workspace members");
      }

      const data = await response.json();
      console.log("Workspace members:", data);

      const onlineMembers = data
        .filter((member) => member.status === 1)
        .map((member) => ({
          id: member.id_utilisateur,
          name: member.nom,
          avatar: member.photo_de_profil || null,
          status: "online",
          role: member.role.toLowerCase(),
        }));

      const offlineMembers = data
        .filter((member) => member.status !== 1)
        .map((member) => ({
          id: member.id_utilisateur,
          name: member.nom,
          avatar: member.photo_de_profil || null,
          status: "offline",
          role: member.role.toLowerCase(),
        }));

      setMembers({
        online: onlineMembers,
        offline: offlineMembers,
      });
    } catch (err) {
      console.error("Error fetching workspace members:", err);
      setMembersError(err.message);
      setMembers({ online: [], offline: [] });
    } finally {
      setLoadingMembers(false);
    }
  }, [workspaceId]);

  // Fetch workspace details effect
  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/workspaces/${workspaceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch workspace details");
        }

        const data = await response.json();
        setWorkspace({
          id: data.id_workspace,
          name: data.nom,
          description: data.description,
          banner: data.banner_url,
          icon: data.icon_url,
          isPrivate: data.is_private,
        });

        fetchCanals();
        fetchWorkspaceMembers();
      } catch (err) {
        console.error("Error fetching workspace details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId, fetchCanals, fetchWorkspaceMembers]);

  // Fetch current user details effect
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch user info");

        const userData = await response.json();
        setCurrentUserName(userData.nom || userData.name);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Ajout : calculer le rôle de l'utilisateur dans le workspace
  useEffect(() => {
    async function fetchRole() {
      try {
        const token = localStorage.getItem("token");
        if (!token || !workspace) return;
        const userId = currentUserId;
        if (!userId) return;
        const res = await fetch(
          `${API_URL}/api/workspaces/${workspace.id}/members`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) return;
        const members = await res.json();
        const me = members.find((m) => m.id_utilisateur === userId);
        setCurrentUserRole(me?.role?.toLowerCase() || null);
      } catch (e) {
        setCurrentUserRole(null);
      }
    }
    fetchRole();
  }, [workspace, currentUserId]);

  // Filter channels effect
  useEffect(() => {
    if (!searchQuery) {
      setFilteredChannels(channels);
      return;
    }

    const filtered = channels.filter((channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChannels(filtered);
  }, [searchQuery, channels]);

  // Socket connection effect
  useEffect(() => {
    const token = localStorage.getItem("token");

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket.IO connecté avec succès");
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Erreur de connexion Socket.IO:", err);
    });

    return () => {
      if (newSocket) {
        console.log("Déconnexion de Socket.IO");
        newSocket.disconnect();
      }
    };
  }, []);

  // Socket message listener effect
  useEffect(() => {
    if (!socket) return;

    // Gestionnaire de messages
    const handleNewMessage = (message) => {
      console.log("🎉 Nouveau message reçu via socket:", message);

      // S'assurer que le format de date est cohérent
      if (message.created_at && !message.date_creation) {
        message.date_creation = message.created_at;
      }

      setMessages((prev) => {
        // Si un message temporaire existe (même contenu, même parent_id, même auteur, et marqué isTemp), on le remplace
        const tempIndex = prev.findIndex(
          (m) =>
            m.isTemp &&
            m.fk_utilisateur === message.fk_utilisateur &&
            m.contenu === message.contenu &&
            (m.parent_id || null) === (message.parent_id || null)
        );
        if (tempIndex !== -1) {
          // Remplacer le message temporaire par le message réel
          const newArr = [...prev];
          newArr[tempIndex] = message;
          return newArr;
        }
        // Sinon, vérifier si ce message existe déjà (par id_message)
        const exists = prev.some((m) => m.id_message === message.id_message);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });

      // Scrolle vers le bas pour voir le nouveau message
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }, 100);
      }
    };

    // Abonnement à l'événement "message"
    socket.on("message", handleNewMessage);

    // Abonnement aux réactions
    socket.on("messageReaction", ({ messageId, reactions }) => {
      console.log(`Réaction reçue pour le message ${messageId}:`, reactions);
      console.log("Détail des réactions reçues:", JSON.stringify(reactions));

      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id_message === messageId) {
            const formattedReactions = reactions.map((r) => {
              if (!r.emoji) {
                r.emoji = getEmojiForType(r.reaction_type);

                console.warn(
                  `Emoji manquant pour ${r.reaction_type}: ${r.emoji}`
                );
              }
              if (
                typeof r.emoji === "string" &&
                r.emoji.startsWith("{") &&
                r.emoji.endsWith("}")
              ) {
                try {
                  r.emoji = JSON.parse(
                    r.emoji.substring(1, r.emoji.length - 1)
                  );
                  console.log(`Emoji extrait du format array: ${r.emoji}`);
                } catch (e) {
                  console.warn(`Impossible de parser l'emoji: ${r.emoji}`);
                }
              }
              return r;
            });
            console.log("Réactions formatées pour UI:", formattedReactions);
            return { ...msg, reactions: formattedReactions };
          }
          return msg;
        })
      );
    });

    // Add listener for deleted messages
    socket.on("messageDeleted", ({ messageId }) => {
      console.log(
        `Socket event 'messageDeleted' received for message ${messageId}`
      );
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id_message !== messageId)
      );
    });

    // Add another listener for 'deleteMessage' event (in case server uses this instead)
    socket.on("deleteMessage", ({ messageId }) => {
      console.log(
        `Socket event 'deleteMessage' received for message ${messageId}`
      );
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id_message !== messageId)
      );
    });

    // *** Listen for typing events ***
    socket.on("typing", (data) => {
      console.log("Événement typing reçu:", data);
      if (data.userId === MISTRAL_USER_ID) {
        console.log("Mistral commence à écrire");
        setIsMistralTyping(true);
      }
    });

    socket.on("stopTyping", (data) => {
      console.log("Événement stopTyping reçu:", data);
      if (data.userId === MISTRAL_USER_ID) {
        console.log("Mistral arrête d'écrire");
        setIsMistralTyping(false);
      }
    });

    // Ajouter aussi un écouteur pour botTyping (au cas où l'ancien nom d'événement est utilisé)
    socket.on("botTyping", (data) => {
      console.log("Événement botTyping reçu:", data);
      setIsMistralTyping(data.isTyping);
    });
    // *** End typing event listeners ***

    // Nettoyage lors du démontage du composant
    return () => {
      socket.off("message", handleNewMessage);
      socket.off("messageReaction");
      socket.off("messageDeleted"); // Remove the listener
      socket.off("deleteMessage"); // Make sure to remove both listeners
      socket.off("typing"); // Clean up listeners
      socket.off("stopTyping"); // Clean up listeners
      socket.off("botTyping"); // N'oubliez pas de supprimer aussi cet écouteur
      setIsMistralTyping(false); // Reset typing state when changing channels
    };
  }, [socket, activeChannel, chatContainerRef]);

  useEffect(() => {
    if (!socket || !workspaceId) return;
    // Écoute le changement de rôle en temps réel
    const handleRoleChange = (data) => {
      if (data.workspaceId === workspaceId) {
        fetchWorkspaceMembers();
      }
    };
    socket.on("memberRoleChanged", handleRoleChange);
    return () => {
      socket.off("memberRoleChanged", handleRoleChange);
    };
  }, [socket, workspaceId, fetchWorkspaceMembers]);

  useEffect(() => {
    if (socket && workspaceId) {
      socket.emit("joinWorkspace", { workspaceId });
      console.log(
        "[WS DEBUG] Demande de joinWorkspace envoyée pour",
        workspaceId
      );
    }
  }, [socket, workspaceId]);

  // Socket: join canal à chaque changement de canal actif
  useEffect(() => {
    if (!socket || !activeChannel || !workspaceId) return;
    // Rejoindre la room du canal à chaque sélection
    socket.emit("joinCanal", { canalId: activeChannel.id, workspaceId });
    console.log("[WS DEBUG] joinCanal envoyé", {
      canalId: activeChannel.id,
      workspaceId,
    });
  }, [socket, activeChannel, workspaceId]);

  // Scroll to bottom effect
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Scroll to bottom when channel changes (chargement des messages)
  useEffect(() => {
    if (chatContainerRef.current && activeChannel && !loadingMessages) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [activeChannel, loadingMessages, messages.length]);

  // Get current user ID effect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id);
      } catch (e) {
        console.error("Erreur lors du décodage du token:", e);
      }
    }
  }, []);

  // Close context menus effect
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
      if (messageContextMenu.visible) {
        setMessageContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu.visible, messageContextMenu.visible]);

  // Update mentionable users when members change
  useEffect(() => {
    const mistralUser = {
      id: MISTRAL_USER_ID,
      name: MISTRAL_USERNAME,
      avatar: MISTRAL_AVATAR,
      role: "bot",
      isBot: true,
      status: "online",
    };

    // Format online members
    const onlineUsers = members.online.map((member) => ({
      ...member,
      status: "online",
    }));

    // Format offline members
    const offlineUsers = members.offline.map((member) => ({
      ...member,
      status: "offline",
    }));

    const allUsers = [mistralUser, ...onlineUsers, ...offlineUsers];

    // Remove duplicates
    const uniqueUsers = Array.from(
      new Map(allUsers.map((user) => [user.id, user])).values()
    );
    setMentionableUsers(uniqueUsers);
  }, [members]);

  // Handlers
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const toggleChannelsVisibility = () => setShowChannels(!showChannels);
  const toggleMembers = () => setShowMembers(!showMembers);
  const toggleOnlineMembers = () => setShowOnlineMembers(!showOnlineMembers);
  const toggleOfflineMembers = () => setShowOfflineMembers(!showOfflineMembers);
  const toggleFiles = () => setShowFiles(!showFiles);
  const toggleImages = () => setShowImages(!showImages);

  const handleChannelInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewChannel({
      ...newChannel,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCreateChannel = (e) => {
    e.stopPropagation();
    setShowCreateChannelModal(true);
    setNewChannel({ name: "", isPrivate: false });
    setChannelError("");
  };

  const handleCloseModal = () => setShowCreateChannelModal(false);

  const handleSubmitChannel = async (e) => {
    e.preventDefault();
    if (!newChannel.name.trim()) {
      setChannelError("Le nom du canal est requis");
      return;
    }
    try {
      setIsCreatingChannel(true);
      setChannelError("");
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nom: newChannel.name,
            is_private: newChannel.isPrivate,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la création du canal"
        );
      }
      fetchCanals();
      setShowCreateChannelModal(false);
    } catch (err) {
      console.error("Erreur lors de la création du canal:", err);
      setChannelError(err.message || "Une erreur est survenue");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleChannelContextMenu = (e, channel) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      xPos: e.pageX,
      yPos: e.pageY,
      channelId: channel.id,
      channelName: channel.name,
      isPrivate: channel.isPrivate,
    });
  };

  const handleCloseContextMenu = () =>
    setContextMenu({ ...contextMenu, visible: false });

  const handleEditChannel = () => {
    setEditingChannel({
      id: contextMenu.channelId,
      name: contextMenu.channelName,
      isPrivate: contextMenu.isPrivate,
    });
    setShowEditChannelModal(true);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleSubmitEditChannel = async (e) => {
    e.preventDefault();
    if (!editingChannel.name.trim()) {
      setUpdateChannelError("Le nom du canal est requis");
      return;
    }
    try {
      setIsUpdatingChannel(true);
      setUpdateChannelError("");
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals/${editingChannel.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nom: editingChannel.name,
            is_private: editingChannel.isPrivate,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la modification du canal"
        );
      }
      fetchCanals();
      setShowEditChannelModal(false);
    } catch (err) {
      console.error("Erreur lors de la modification du canal:", err);
      setUpdateChannelError(err.message || "Une erreur est survenue");
    } finally {
      setIsUpdatingChannel(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer le canal "${contextMenu.channelName}" ?`
      )
    ) {
      setContextMenu({ ...contextMenu, visible: false });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals/${contextMenu.channelId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la suppression du canal"
        );
      }
      fetchCanals();
      if (activeChannel && activeChannel.id === contextMenu.channelId) {
        setActiveChannel(null); // Désélectionner le canal s'il est supprimé
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du canal:", err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const handleSelectChannel = useCallback(async (channel) => {
    try {
      setActiveChannel(channel);
      setLoadingMessages(true);
      const token = localStorage.getItem("token");
      console.log(`Chargement des messages pour le canal ${channel.id}...`);
      const response = await fetch(
        `${API_URL}/api/messages/canal/${channel.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur API:", errorData);
        throw new Error(
          errorData.message || "Erreur lors du chargement des messages"
        );
      }
      const data = await response.json();
      console.log("Messages récupérés:", data);

      // Vérifier et logger les messages avec parent_id mais sans parent_message
      const messagesWithParentId = data.filter(
        (msg) => msg.parent_id && !msg.parent_message
      );
      if (messagesWithParentId.length > 0) {
        console.log(
          `${messagesWithParentId.length} messages ont un parent_id sans parent_message dans ce canal`
        );
      }

      setMessages(data);
    } catch (error) {
      console.error("Erreur:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const convertMentionsForSending = (text) => {
    let result = text;
    mentionableUsers.forEach((user) => {
      const regex = new RegExp(`@${user.name}\\b`, "g");
      result = result.replace(regex, `@[${user.name}](${user.id})`);
    });
    return result;
  };

  const handleSendMessage = (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!displayMessage.trim() || !socket || !activeChannel) return;

    console.log(
      `Envoi du message: "${displayMessage}" dans le canal ${activeChannel.id}`
    );

    // Envoyer via socket.io
    socket.emit("message", {
      canal_id: activeChannel.id,
      content: displayMessage,
      workspace_id: workspaceId,
      parent_id: replyingTo ? replyingTo.id_message : null,
    });

    // Réinitialiser le message et la réponse
    setNewMessage("");
    setDisplayMessage("");
    setReplyingTo(null);
  };

  const handleMessageContextMenu = (e, message) => {
    e.preventDefault();
    setMessageContextMenu({
      visible: true,
      xPos: e.pageX,
      yPos: e.pageY,
      messageId: message.id_message,
      message,
    });
  };

  const handleCloseMessageContextMenu = () =>
    setMessageContextMenu({ ...messageContextMenu, visible: false });

  const handleReplyMessage = () => {
    setReplyingTo(messageContextMenu.message);
    // Ne plus ajouter automatiquement le pseudo dans le champ de saisie
    handleCloseMessageContextMenu();
    const messageInput = document.querySelector(".chat-input-wrapper input");
    if (messageInput) messageInput.focus();
  };

  const handleShowEmojiPicker = () => {
    setShowEmojiPicker(true);
    handleCloseMessageContextMenu();
  };

  const handleAddReaction = async (emojiName) => {
    try {
      if (!messageContextMenu.messageId || !socket || !socket.connected) return;

      socket.emit("addReaction", {
        messageId: messageContextMenu.messageId,
        reaction_type: emojiName,
        canalId: activeChannel.id,
      });

      // Optimistic UI update
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id_message === messageContextMenu.messageId) {
            const existingReactionIndex = (msg.reactions || []).findIndex(
              (r) => r.reaction_type === emojiName
            );
            let updatedReactions = [...(msg.reactions || [])];
            if (existingReactionIndex >= 0) {
              updatedReactions[existingReactionIndex] = {
                ...updatedReactions[existingReactionIndex],
                count:
                  (parseInt(updatedReactions[existingReactionIndex].count) ||
                    0) + 1,
                user_reacted: true,
              };
            } else {
              updatedReactions.push({
                reaction_type: emojiName,
                count: 1,
                user_reacted: true,
                emoji: getEmojiForType(emojiName),
              });
            }
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        })
      );
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la réaction via socket:", error);
    }
  };

  const handleCancelReply = () => setReplyingTo(null);

  const handleDeleteMessage = async () => {
    try {
      if (!messageContextMenu.messageId || !socket || !socket.connected) return;

      // Verify the message belongs to the current user
      const message = messages.find(
        (m) => m.id_message === messageContextMenu.messageId
      );
      if (!message || message.fk_utilisateur !== currentUserId) {
        console.error(
          "Vous ne pouvez pas supprimer les messages d'autres utilisateurs"
        );
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token d'authentification manquant");
        return;
      }

      // Store message ID before closing context menu
      const messageIdToDelete = messageContextMenu.messageId;
      const channelId = activeChannel.id;

      // Close context menu first for better UX
      handleCloseMessageContextMenu();

      // Update UI immediately (optimistic update)
      setMessages((prevMessages) =>
        prevMessages.filter((m) => m.id_message !== messageIdToDelete)
      );

      // Delete on server via REST API first
      console.log(`Suppression du message ${messageIdToDelete} via API REST`);
      const response = await fetch(
        `${API_URL}/api/messages/${messageIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error deleting message: ${response.status}`);
      }

      // If API call succeeds, broadcast deletion via socket
      console.log(`Message ${messageIdToDelete} supprimé avec succès`);

      // Use consistent event name - ONLY use deleteMessage (not messageDeleted)
      console.log(
        `Émission de l'événement deleteMessage pour le message ${messageIdToDelete}`
      );
      socket.emit("deleteMessage", {
        messageId: messageIdToDelete,
        canalId: channelId,
        workspaceId: workspaceId, // Add workspace ID to help with routing
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du message:", error);

      // If error occurs, notify user
      alert("Erreur lors de la suppression: " + error.message);

      // Refresh the channel to ensure UI is in sync with the server

      if (activeChannel) {
        handleSelectChannel(activeChannel);
      }
    }
  };

  const handleNewMessageChange = (value) => {
    setDisplayMessage(value);
    const inputElement = document.querySelector(".chat-input-wrapper input");
    if (!inputElement) return;
    const cursorPos = inputElement.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const lastSpaceIndex = textBeforeCursor.lastIndexOf(" ");
    const lastNewlineIndex = textBeforeCursor.lastIndexOf("\n");
    const lastBreakIndex = Math.max(lastSpaceIndex, lastNewlineIndex);
    if (
      lastAtIndex !== -1 &&
      (lastAtIndex > lastBreakIndex || lastBreakIndex === -1)
    ) {
      const query = textBeforeCursor.substring(lastAtIndex + 1).toLowerCase();
      setMentionQuery(query);
      if (mentionableUsers.length > 0) {
        const filtered = mentionableUsers.filter((user) =>
          user.name.toLowerCase().includes(query)
        );
        const sorted = [...filtered].sort((a, b) => {
          if (a.isBot && !b.isBot) return -1;
          if (!a.isBot && b.isBot) return 1;
          if (a.status === "online" && b.status !== "online") return -1;
          if (a.status !== "online" && b.status === "online") return 1;
          return a.name.localeCompare(b.name);
        });
        setMentionSuggestions(sorted.slice(0, 5));
        setShowMentionSuggestions(sorted.length > 0);
        setActiveMentionIndex(0);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery("");
    }
  };

  const handleMentionNavigation = (direction) => {
    if (mentionSuggestions.length === 0) return;

    setActiveMentionIndex((currentIndex) => {
      if (direction === "next") {
        return (currentIndex + 1) % mentionSuggestions.length;
      } else {
        return (
          (currentIndex - 1 + mentionSuggestions.length) %
          mentionSuggestions.length
        );
      }
    });
  };

  const handleSelectActiveItem = () => {
    if (mentionSuggestions.length === 0) return;
    handleSelectMention(mentionSuggestions[activeMentionIndex]);
  };

  const handleSelectMention = (user) => {
    const inputElement = document.querySelector(".chat-input-wrapper input");
    if (!inputElement) return;
    const cursorPos = inputElement.selectionStart;
    const currentDisplay = displayMessage;
    const textBeforeCursor = currentDisplay.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterCursor = currentDisplay.substring(cursorPos);
      const mentionText = `@${user.name} `;
      const newDisplayValue =
        currentDisplay.substring(0, lastAtIndex) +
        mentionText +
        textAfterCursor;
      setDisplayMessage(newDisplayValue);
      setShowMentionSuggestions(false);
      setMentionQuery("");
      setTimeout(() => {
        const newCursorPos = lastAtIndex + mentionText.length;
        inputElement.focus();
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleMistralMention = useCallback(
    (message) => {
      // Vérifier si le message contient une mention de Mistral
      const mistralMentionPattern = /@Mistral/i;
      if (mistralMentionPattern.test(message)) {
        console.log("Mention de Mistral détectée");

        if (socket && socket.connected && activeChannel) {
          console.log(
            "Socket connecté, tentative d'envoi directement à Mistral"
          );

          // Activer manuellement l'indicateur de frappe avant l'envoi
          setIsMistralTyping(true);

          socket.emit("mistralRequest", {
            content: message,
            channelId: activeChannel.id,
          });

          // Réinitialiser newMessage et displayMessage
          setNewMessage("");
          setDisplayMessage("");

          return true;
        }
      }
      return false;
    },
    [
      socket,
      activeChannel,
      setNewMessage,
      setDisplayMessage,
      setIsMistralTyping,
    ]
  );

  // Return all state and handlers needed by the component
  return {
    workspace,
    loading,
    error,
    searchQuery,
    channels: filteredChannels, // Use filteredChannels for display
    showChannels,
    canalsLoading,
    canalsError,
    showMembers,
    showOnlineMembers,
    showOfflineMembers,
    showFiles,
    showImages,
    loadingMembers,
    membersError,
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
    messageContextMenu,
    showEmojiPicker,
    replyingTo,
    commonEmojis,
    isMistralTyping, // Return the typing state
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
    handleCloseContextMenu,
    handleEditChannel,
    handleSubmitEditChannel,
    handleDeleteChannel,
    handleSelectChannel,
    handleSendMessage,
    formatMessageDate,
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
    getEmojiForType, // Export helper if needed in component
    handleDeleteMessage, // Add the new handler
    // New handlers for mentions
    handleNewMessageChange,
    handleSelectMention,
    handleMentionNavigation,
    handleSelectActiveItem,
    handleMistralMention, // Exposer cette fonction
    currentUserRole, // Expose le rôle courant
    setReplyingTo, // Ensure setReplyingTo is returned
  };
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
 