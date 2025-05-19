import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import { API_URL } from "../config/config";
import { useSocket } from "../context/SocketContext";
import {
  FaThumbsUp,
  FaHeart,
  FaLaugh,
  FaSurprise,
  FaSadTear,
  FaAngry,
  FaRobot,
} from "react-icons/fa"; // Added FaRobot for consistency
import { formatMention, isMention } from "../utils/helpers"; // Import formatMention

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
  // Si c'est déjà un emoji unicode, retourne-le directement
  if (Object.values(emojiMap).includes(reactionType)) return reactionType;
  // Sinon, retourne l'emoji du mapping ou le texte brut
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
  const [searchResults, setSearchResults] = useState({
    channels: [],
    users: [],
    messages: [],
  });
  const [isSearching, setIsSearching] = useState(false);
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

  // Utiliser le contexte Socket pour accéder aux statuts utilisateur
  const { userStatuses } = useSocket();

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

  // Ajout pour suggestions de canaux
  const [showChannelSuggestions, setShowChannelSuggestions] = useState(false);
  const [channelSuggestions, setChannelSuggestions] = useState([]);
  const [channelQuery, setChannelQuery] = useState("");
  const [activeChannelSuggestionIndex, setActiveChannelSuggestionIndex] =
    useState(0);

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
      // console.log("Canaux récupérés:", formattedChannels);
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
      // console.log("[HOOK] Members data from API:", data);

      // CORRECTION: Modification de la logique de filtrage pour inclure les utilisateurs en ligne par défaut
      const onlineMembers = data
        .filter((member) => {
          // Vérifier le statut WebSocket en temps réel
          const wsStatus = userStatuses[member.id_utilisateur];
          // console.log(
          //   `[HOOK] Member ${member.nom}: WS status=${wsStatus}, DB status=${member.status}`
          // );

          // Si un statut WebSocket existe, l'utiliser
          if (wsStatus !== undefined) {
            return wsStatus === "online";
          }
          // Sinon utiliser le statut par défaut de la base de données (1 = online)
          return member.status === 1;
        })
        .map((member) => ({
          id: member.id_utilisateur,
          name: member.nom,
          avatar: member.photo_url || member.photo_de_profil || null,
          status: userStatuses[member.id_utilisateur] || "online",
          role: member.role.toLowerCase(),
        }));

      const offlineMembers = data
        .filter((member) => {
          const wsStatus = userStatuses[member.id_utilisateur];
          // Logique inversée par rapport aux membres en ligne
          if (wsStatus !== undefined) {
            return wsStatus !== "online";
          }
          return member.status !== 1;
        })
        .map((member) => ({
          id: member.id_utilisateur,
          name: member.nom,
          avatar: member.photo_url || member.photo_de_profil || null,
          status: userStatuses[member.id_utilisateur] || "offline",
          role: member.role.toLowerCase(),
        })); // console.log("[HOOK] Online members count:", onlineMembers.length);
      // console.log("[HOOK] Offline members count:", offlineMembers.length);

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
  }, [workspaceId, userStatuses]);

  // Fonction pour récupérer les détails d'un canal spécifique
  const fetchActiveChannel = useCallback(async (canalId) => {
    if (!canalId) {
      console.error("fetchActiveChannel: ID de canal non fourni");
      return;
    }

    try {
      setLoadingMessages(true);
      const token = localStorage.getItem("token");
      console.log(`Chargement des détails pour le canal ${canalId}...`);
      
      // 1. Récupérer les détails du canal actif (pour obtenir les droits d'accès)
      const canalDetailsResponse = await fetch(
        `${API_URL}/api/workspace/${workspaceId}/canals/${canalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!canalDetailsResponse.ok) {
        const errorData = await canalDetailsResponse.json();
        console.error("Erreur API lors de la récupération des détails du canal:", errorData);
        throw new Error(
          errorData.message || "Erreur lors du chargement des détails du canal"
        );
      }
      
      const canalDetails = await canalDetailsResponse.json();
      console.log("Détails du canal récupérés:", canalDetails);
      
      // Mettre à jour le canal actif avec les informations de droits d'accès
      setActiveChannel({
        id: canalDetails.id_canal,
        name: canalDetails.nom,
        isPrivate: canalDetails.is_private || false,
        description: canalDetails.description || "",
        droitAcces: canalDetails.droitAcces || "lecture_ecriture",
        isCreator: canalDetails.isCreator || false,
        memberAccess: canalDetails.droitAcces || null
      });

      // 2. Charger les messages du canal
      console.log(`Chargement des messages pour le canal ${canalId}...`);
      const response = await fetch(
        `${API_URL}/api/messages/canal/${canalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur API lors du chargement des messages:", errorData);
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

      // Ajout du mapping des emojis sur les réactions (pour affichage correct)
      const messagesWithEmojis = data.map((msg) => {
        if (msg.reactions && Array.isArray(msg.reactions)) {
          msg.reactions = msg.reactions.map((r) => ({
            ...r,
            emoji: r.emoji || getEmojiForType(r.reaction_type),
          }));
        }
        return msg;
      });

      setMessages(messagesWithEmojis);

      // Marquer le canal comme lu une fois que les messages sont chargés
      if (socket && socket.connected) {
        console.log(`Marquage du canal ${canalId} comme lu via socket.io`);
        socket.emit("markChannelAsRead", { channelId: canalId });
      } else {
        // Appel API de secours si le socket n'est pas connecté
        try {
          await markChannelAsReadViaAPI(canalId);
        } catch (markReadError) {
          console.error("Erreur pour marquer le canal comme lu:", markReadError);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      setMessages([]);
      // En cas d'erreur, ne pas mettre le canal à null pour éviter une boucle
      // mais informer l'utilisateur
      alert("Erreur lors du chargement des messages: " + error.message);
    } finally {
      setLoadingMessages(false);
    }
  }, [workspaceId, socket, setActiveChannel, setMessages, setLoadingMessages]);

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
      // console.log("Socket.IO connecté avec succès");
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Erreur de connexion Socket.IO:", err);
    });

    return () => {
      if (newSocket) {
        // console.log("Déconnexion de Socket.IO");
        newSocket.disconnect();
      }
    };
  }, []);

  // Socket message listener effect
  useEffect(() => {
    if (!socket) return;

    // Abonnement à l'événement "message"
    socket.on("message", (message) => {
      console.log("[DEBUG] Message reçu:", message);
      console.log("[DEBUG] Type de message:", typeof message);
      console.log("[DEBUG] Propriétés:", Object.keys(message));

      // Vérifie si c'est un message système pour l'appel vidéo
      const isVideoCallMessage =
        message.contenu &&
        (message.contenu.includes("appel vidéo") ||
          message.contenu.includes("video call"));

      if (isVideoCallMessage) {
        console.log("[DEBUG] Message d'appel vidéo détecté");
        message.is_system_message = true;
      }

      handleNewMessage(message);
    });

    const handleNewMessage = (message) => {
      console.log("[DEBUG] Traitement du message:", message);
      // Reste de la fonction handleNewMessage
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
      }); // Scrolle vers le bas pour voir le nouveau message
      if (chatContainerRef && chatContainerRef.current) {
        setTimeout(() => {
          // Vérifier à nouveau que la référence est toujours valide
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }, 150); // Légère augmentation du délai
      }
    };

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
      socket.emit("joinWorkspace", { workspaceId, userId: currentUserId });
      console.log(
        "[WS DEBUG] Demande de joinWorkspace envoyée pour",
        workspaceId,
        "avec userId:",
        currentUserId
      );
    }
  }, [socket, workspaceId, currentUserId]);

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

  // Écouter les changements de statut utilisateur et mettre à jour les membres en temps réel
  useEffect(() => {
    console.log("[HOOK] userStatuses changed, refetching members");
    if (workspaceId) {
      fetchWorkspaceMembers();
    }
  }, [userStatuses, fetchWorkspaceMembers, workspaceId]);
  // Scroll to bottom effect
  useEffect(() => {
    // Ajout d'une vérification supplémentaire pour s'assurer que la référence existe
    // et attendre que le DOM soit complètement rendu
    if (chatContainerRef && chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  // Scroll to bottom when channel changes (chargement des messages)
  useEffect(() => {
    if (activeChannel && !loadingMessages) {
      setTimeout(() => {
        if (chatContainerRef && chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 200); // augmentation du délai pour s'assurer que le DOM est bien rendu
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

  // Effet pour la recherche unifiée
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2 || !workspaceId) {
        setSearchResults({ channels: [], users: [], messages: [] });
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const token = localStorage.getItem("token");
        // Utiliser une requête GET avec query dans l'URL comme attendu par le backend
        const response = await fetch(
          `${API_URL}/api/search/workspace/${workspaceId}?query=${encodeURIComponent(
            searchQuery
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la recherche");
        }

        const data = await response.json();

        // Formater les données pour l'affichage
        const formattedResults = {
          channels:
            data.canaux?.map((channel) => ({
              id: channel.id_canal,
              name: channel.nom,
              description: channel.description || "",
              isPrivate: channel.is_private || false,
            })) || [],
          users:
            data.utilisateurs?.map((user) => ({
              id: user.id_utilisateur,
              name: user.nom,
              avatar: user.photo_url || user.photo_de_profil || null,
              status:
                userStatuses[user.id_utilisateur] || user.status || "offline",
            })) || [],
          messages:
            data.messages?.map((message) => ({
              id: message.id_message,
              contenu: message.contenu,
              date_creation: message.date_creation || message.created_at,
              userName: message.nom_utilisateur || message.nom,
              userId: message.id_utilisateur,
              channelId: message.id_canal,
              channelName: message.nom_canal,
            })) || [],
        };

        setSearchResults(formattedResults);
      } catch (err) {
        console.error("Erreur lors de la recherche:", err);
        setSearchResults({ channels: [], users: [], messages: [] });
      } finally {
        setIsSearching(false);
      }
    };

    // Ajout d'un délai pour éviter trop d'appels API pendant la frappe
    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, workspaceId, userStatuses]);

  // Fonction pour sélectionner un résultat de recherche
  const handleSelectSearchResult = (type, result) => {
    if (type === "channel") {
      handleSelectChannel(result);
    } else if (type === "message") {
      // D'abord sélectionner le canal
      const channel = channels.find((c) => c.id === result.channelId);
      if (channel) {
        handleSelectChannel(channel).then(() => {
          // Puis mettre en évidence le message
          setTimeout(() => {
            const messageElement = document.getElementById(
              `message-${result.id}`
            );
            if (messageElement) {
              messageElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              messageElement.classList.add("highlighted-message");
              setTimeout(() => {
                messageElement.classList.remove("highlighted-message");
              }, 5000);
            }
          }, 500);
        });
      }
    }
  };

  const handleSelectChannel = useCallback(
    async (channel) => {
      try {
        if (!channel || !channel.id) {
          console.error("handleSelectChannel: canal sans ID");
          return;
        }
        
        await fetchActiveChannel(channel.id);
      } catch (error) {
        console.error("Erreur lors de la sélection du canal:", error);
      }
    },
    [fetchActiveChannel]
  );

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

  // Fonction pour marquer un canal comme lu
  const markChannelAsRead = useCallback(
    async (channel) => {
      try {
        if (!channel || !channel.id) {
          console.warn("Tentative de marquer un canal sans ID comme lu");
          return;
        }

        console.log(`Marquage du canal ${channel.id} comme lu`);

        // Essayer d'abord via socket.io si disponible
        if (socket && socket.connected) {
          console.log(`Marquage du canal ${channel.id} comme lu via socket.io`);
          socket.emit("markChannelAsRead", { channelId: channel.id });

          // Créer un délai pour vérifier si nous recevons une confirmation
          setTimeout(async () => {
            // Si nous n'avons pas reçu de confirmation après 1 seconde, utiliser le fallback API REST
            const event = new CustomEvent("checkSocketConfirmation", {
              detail: { channelId: channel.id },
            });
            window.dispatchEvent(event);
          }, 1000);
        } else {
          // Appel API de secours si le socket n'est pas connecté
          await markChannelAsReadViaAPI(channel.id);
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    },
    [socket]
  );

  // Fonction de fallback pour marquer un canal comme lu via API REST
  const markChannelAsReadViaAPI = async (channelId) => {
    try {
      if (!channelId) {
        throw new Error("ID de canal non fourni.");
      }
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      console.log(`Canal ${channelId} marqué comme lu via API REST (fallback)`);
      const markReadResponse = await fetch(
        `${API_URL}/api/messages/channel/${channelId}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (markReadResponse.ok) {
        console.log(`Canal ${channelId} marqué comme lu via API REST`);

        // Après avoir marqué le canal comme lu via API, rafraîchir les compteurs de messages non lus
        await refreshUnreadChannelCounts(token);
      } else {
        console.error(
          "Erreur API lors du marquage du canal comme lu:",
          await markReadResponse.text()
        );
      }
    } catch (markReadError) {
      console.error(
        "Erreur pour marquer un canal comme lu via API:",
        markReadError
      );
    }
  };

  // Fonction pour rafraîchir les compteurs de messages non lus
  const refreshUnreadChannelCounts = async (token) => {
    try {
      if (!token) {
        token = localStorage.getItem("token");
      }
      
      if (!token) {
        console.error("Token d'authentification manquant pour rafraîchir les compteurs");
        return;
      }
      
      const unreadResponse = await fetch(`${API_URL}/api/messages/unread`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (unreadResponse.ok) {
        const unreadData = await unreadResponse.json();
        console.log("Compteurs de messages non lus mis à jour:", unreadData);

        // Émettre un événement pour mettre à jour les badges
        const event = new CustomEvent("unreadChannelMessagesUpdated", {
          detail: {
            total: unreadData.total || 0,
            channels: unreadData.channels || [],
          },
        });
        window.dispatchEvent(event);

        // Mettre à jour localStorage
        localStorage.setItem(
          "unreadChannelMessages",
          (unreadData.total || 0).toString()
        );
        localStorage.setItem(
          "unreadChannelMessagesDetails",
          JSON.stringify(unreadData.channels || [])
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des compteurs de messages non lus:",
        error
      );
    }
  };

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
    setNewMessage(value);
    setDisplayMessage(value);

    // Vérifier pour les mentions utilisateur (@)
    const lastAtIndex = value.lastIndexOf("@");
    const lastBreakIndex = Math.max(
      value.lastIndexOf(" "),
      value.lastIndexOf("\n")
    );

    if (
      lastAtIndex !== -1 &&
      (lastAtIndex > lastBreakIndex || lastBreakIndex === -1)
    ) {
      const query = value.slice(lastAtIndex + 1);
      setMentionQuery(query);
      setShowMentionSuggestions(true);

      // Filtrer les utilisateurs selon la requête
      const filteredUsers = mentionableUsers.filter((user) =>
        user.name.toLowerCase().includes(query.toLowerCase())
      );
      setMentionSuggestions(filteredUsers);
      setActiveMentionIndex(0);
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery("");
    }

    // Vérifier pour les mentions de canaux (#)
    const lastHashIndex = value.lastIndexOf("#");

    console.log("Détection de #:", {
      lastHashIndex,
      lastBreakIndex,
      condition:
        lastHashIndex !== -1 &&
        (lastHashIndex > lastBreakIndex || lastBreakIndex === -1),
      channels: channels.length,
    });

    if (
      lastHashIndex !== -1 &&
      (lastHashIndex > lastBreakIndex || lastBreakIndex === -1)
    ) {
      const query = value.slice(lastHashIndex + 1);
      setChannelQuery(query);

      // Limiter l'affichage des suggestions uniquement lorsque # vient d'être tapé ou s'il y a un texte après
      if (query === "" || query.length > 0) {
        setShowChannelSuggestions(true);

        // Filtrer les canaux selon la requête
        const filteredChannels = channels.filter((canal) =>
          canal.name.toLowerCase().includes(query.toLowerCase())
        );

        // Limiter le nombre de suggestions si nécessaire
        const maxSuggestions = 5;
        const limitedChannels = filteredChannels.slice(0, maxSuggestions);

        console.log("Filtrage des canaux pour #" + query, {
          query,
          canaux: channels.length,
          filteredChannels: limitedChannels,
        });

        setChannelSuggestions(limitedChannels);
        setActiveChannelSuggestionIndex(0);
      }
    } else {
      setShowChannelSuggestions(false);
      setChannelQuery("");
    }
  };

  const handleChannelSuggestionNavigation = (direction) => {
    if (channelSuggestions.length === 0) return;
    setActiveChannelSuggestionIndex((currentIndex) => {
      if (direction === "next") {
        return (currentIndex + 1) % channelSuggestions.length;
      } else {
        return (
          (currentIndex - 1 + channelSuggestions.length) %
          channelSuggestions.length
        );
      }
    });
  };

  const handleMentionSuggestionNavigation = (direction) => {
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

  const handleSelectActiveChannelSuggestion = () => {
    if (channelSuggestions.length === 0) return;
    handleSelectChannelSuggestion(
      channelSuggestions[activeChannelSuggestionIndex]
    );
  };

  const handleSelectActiveMention = () => {
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
      // Format the mention to include the user's ID in a markdown link format
      // Using the formatMention helper function to create the properly formatted mention
      const mentionText = `${formatMention(user.name, user.id)} `;
      const newDisplayValue =
        currentDisplay.substring(0, lastAtIndex) +
        mentionText +
        textAfterCursor;
      setDisplayMessage(newDisplayValue);
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectChannelSuggestion = (channel) => {
    const inputElement = document.querySelector(".chat-input-wrapper input");
    if (!inputElement) return;
    const cursorPos = inputElement.selectionStart;
    const currentDisplay = displayMessage;
    const textBeforeCursor = currentDisplay.substring(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf("#");
    if (lastHashIndex !== -1) {
      const textAfterCursor = currentDisplay.substring(cursorPos);
      // Format the mention to include the user's ID in a markdown link format
      // This will be parsed later to create the badge with the correct styling
      const mentionText = `#${channel.name} `;
      const newDisplayValue =
        currentDisplay.substring(0, lastHashIndex) +
        mentionText +
        textAfterCursor;
      setDisplayMessage(newDisplayValue);
      setShowChannelSuggestions(false);
      setChannelQuery("");
      setTimeout(() => {
        const newCursorPos = lastHashIndex + mentionText.length;
        inputElement.focus();
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };
  const handleMistralMention = (text) => {
    // Vérifier tous les formats possibles de mention à Mistral
    const isMistralMention =
      text.toLowerCase().includes("@mistral") ||
      text.toLowerCase().includes("mistral ai") ||
      text.includes("00000000-0000-0000-0000-000000000001");

    if (isMistralMention && socket && activeChannel) {
      // Marquer Mistral comme "est en train d'écrire"
      setIsMistralTyping(true);

      // Envoyer le message au serveur
      socket.emit("message", {
        canal_id: activeChannel.id,
        content: text,
        workspace_id: workspaceId,
      });

      // Réinitialiser le message après envoi
      setNewMessage("");
      setDisplayMessage("");

      return true;
    }

    return false;
  };

  // Return all state and handlers needed by the component
  return {
    workspace,
    loading,
    error,
    searchQuery,
    searchResults, // Ajout des résultats de recherche
    isSearching, // Ajout de l'état de chargement de la recherche
    handleSelectSearchResult, // Ajout de la fonction pour sélectionner un résultat
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
    // Channel suggestion state
    showChannelSuggestions,
    channelSuggestions,
    activeChannelSuggestionIndex,
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
    handleDeleteMessage, // Add the new handler    // New handlers for mentions
    handleNewMessageChange,
    handleSelectMention,
    handleMentionSuggestionNavigation,
    handleSelectActiveMention,
    handleChannelSuggestionNavigation,
    handleSelectActiveChannelSuggestion,
    handleSelectChannelSuggestion,
    handleMistralMention, // Exposer cette fonction
    currentUserRole, // Expose le rôle courant
    setReplyingTo, // Ensure setReplyingTo is returned
    userStatuses, // Expose userStatuses
    fetchActiveChannel, // Exposer la fonction fetchActiveChannel
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
