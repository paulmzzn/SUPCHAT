import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import {
  FaUserCircle,
  FaPaperPlane,
  FaPaperclip,
  FaSmile,
  FaSearch,
  FaPlus,
  FaTimes,
  FaReply,
  FaRegSmile,
  FaFile,
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileVideo,
  FaFileAudio,
  FaDownload,
} from "react-icons/fa";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useSocket } from "../../context/SocketContext";
import "./DirectMessages.css";


const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.148:3000";

// Helper pour formater la date
const formatMessageDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

// Add this utility function near the top of your component
const safeJSONParse = (jsonString, fallback = null) => {
  try {
    return typeof jsonString === "string" ? JSON.parse(jsonString) : fallback;
  } catch (error) {
    console.error("JSON parse error:", error);
    return fallback;
  }
};

const safeJSONStringify = (obj) => {
  try {
    return typeof obj === "object" ? JSON.stringify(obj) : obj;
  } catch (error) {
    console.error("JSON stringify error:", error);
    return "";
  }
};

// Fonction utilitaire pour déterminer l'icône d'un fichier selon son type
const getFileIcon = (fileType) => {
  if (!fileType) return <FaFile />;

  if (fileType.startsWith("image/")) return <FaFileImage />;
  if (fileType.includes("pdf")) return <FaFilePdf />;
  if (fileType.includes("word") || fileType.includes("document"))
    return <FaFileWord />;
  if (fileType.includes("excel") || fileType.includes("spreadsheet"))
    return <FaFileExcel />;
  if (fileType.startsWith("video/")) return <FaFileVideo />;
  if (fileType.startsWith("audio/")) return <FaFileAudio />;

  return <FaFileAlt />;
};

// Fonction utilitaire pour formater la taille des fichiers
const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

// Fonction pour construire l'URL complète d'un fichier
const getCompleteFileUrl = (fileUrl) => {
  if (!fileUrl) return "";

  // Si l'URL est déjà complète (commence par http ou https), la renvoyer telle quelle
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  // Pour les fichiers S3 (messages privés), construire l'URL S3 complète (virtual-hosted style)
  if (
    fileUrl.startsWith("private-messages/") ||
    fileUrl.startsWith("private-messages/files/")
  ) {
    return `https://s3-supchat.s3.fr-par.scw.cloud/${fileUrl}`;
  }

  // Pour les URLs relatives classiques, garder le fallback API
  if (!fileUrl.startsWith("/api/files/")) {
    return `${API_URL}/api/files/${fileUrl}`;
  }

  // Si l'URL commence déjà par /api/files/, juste ajouter l'URL de base
  return `${API_URL}${fileUrl}`;
};

function DirectMessages() {
  const { refreshUnreadDM } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesContainerRef = useRef(null);
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [messageContextMenu, setMessageContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    messageId: null,
    isOwnMessage: false,
    message: null,
  });
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const emojiPickerRef = useRef(null);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Add this state for current user ID
  const [currentUserId, setCurrentUserId] = useState(null);

  // Ajout des états pour gérer les pièces jointes
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Récupère l'ID utilisateur courant et vérifie la validité du token
  const checkTokenValidity = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("[DM] Token non trouvé dans localStorage");
        return { valid: false, error: "Token non trouvé" };
      }

      // Découper et décoder le token JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log("[DM] Format de token JWT invalide");
        return { valid: false, error: "Format de token invalide" };
      }

      // Décoder le payload (partie centrale du token)
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      console.log("[DM] Informations token:", {
        userId: payload.id,
        email: payload.email,
        issued: new Date(payload.iat * 1000).toLocaleString(),
        expires: new Date(payload.exp * 1000).toLocaleString(),
        currentTime: new Date(currentTime * 1000).toLocaleString(),
        isExpired: currentTime > payload.exp,
        timeRemaining: payload.exp - currentTime > 0 ? `${Math.floor((payload.exp - currentTime) / 3600)} heures` : "Expiré"
      });
      
      return {
        valid: currentTime < payload.exp,
        error: currentTime > payload.exp ? "Token expiré" : null,
        details: payload
      };
    } catch (error) {
      console.error("[DM] Erreur lors de la vérification du token:", error);
      return { valid: false, error: error.message };
    }
  };

  // Ajouter cet état pour suivre l'état de connexion du socket
  const [socketStatus, setSocketStatus] = useState({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
  });

  // Connexion socket et joinPrivate - amélioration de la robustesse
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("[DM] Initializing socket connection with token:", token);
    console.log("[DM] API_URL utilisé pour le socket:", API_URL);

    // Définir l'état comme "en cours de connexion"
    setSocketStatus((prev) => ({ ...prev, connecting: true }));

    // Vérifier d'abord si l'API est accessible
    fetch(`${API_URL}/api/users/verify-token`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (response.ok) {
          console.log("[DM] Backend API token verification OK");
          return response.json();
        } else {
          console.error("[DM] Backend API token verification ERROR:", response.status);
          setSocketStatus((prev) => ({
            ...prev,
            connecting: false,
            error: `API inaccessible: ${response.status}`,
          }));
          throw new Error(`API inaccessible: ${response.status}`);
        }
      })
      .then((text) => {
        console.log("[DM] Ping response:", text);

        // Configuration complète pour Socket.IO
        const socketOptions = {
          auth: { token },
          transports: ["polling", "websocket"], // Try polling first then websocket
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000, // Start with 2 seconds
          reconnectionDelayMax: 10000, // Max 10 seconds
          timeout: 20000,
          autoConnect: true,
          forceNew: true,
        };

        console.log("[DM] Creating socket with options:", socketOptions);

        // Créer l'instance du socket
        const newSocket = io(API_URL, socketOptions);

        // Événements de connexion et de diagnostic
        newSocket.on("connect_error", (err) => {
          console.error("[DM] Socket.io connection error:", err);
          setSocketStatus((prev) => ({
            ...prev,
            connected: false,
            connecting: false,
            error: err.message,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }));
        });

        newSocket.on("connect", () => {
          console.log(
            "[DM] Socket.io connecté avec succès avec ID:",
            newSocket.id
          );
          setSocketStatus({
            connected: true,
            connecting: false,
            error: null,
            reconnectAttempts: 0,
          });

          // Rejoindre la room privée seulement après connexion réussie
          console.log("[DM] Tentative de rejoindre la room privée");
          newSocket.emit("joinPrivate");
        });

        newSocket.on("disconnect", (reason) => {
          console.log("[DM] Socket.io disconnected, reason:", reason);
          setSocketStatus((prev) => ({
            ...prev,
            connected: false,
            connecting: reason === "io server disconnect" ? false : true,
          }));
        });

        // Autres événements de debug
        newSocket.on("error", (error) => {
          console.error("[DM] Socket.io error event:", error);
        });

        newSocket.on("reconnect_attempt", (attempt) => {
          console.log("[DM] Socket.io reconnect attempt #", attempt);
          setSocketStatus((prev) => ({
            ...prev,
            connecting: true,
            reconnectAttempts: attempt,
          }));
        });

        newSocket.on("reconnect", (attempt) => {
          console.log("[DM] Socket.io reconnecté après", attempt, "tentatives");
          setSocketStatus({
            connected: true,
            connecting: false,
            error: null,
            reconnectAttempts: 0,
          });

          // Rejoindre la room privée après reconnexion
          newSocket.emit("joinPrivate");
        });

        setSocket(newSocket);

        return () => {
          console.log("[DM] Cleanup: Déconnexion du socket");
          newSocket.off();
          newSocket.disconnect();
        };
      })
      .catch((err) => {
        console.error("[DM] Backend API setup failed:", err);
        setSocketStatus((prev) => ({
          ...prev,
          connecting: false,
          error: err.message,
        }));
      });
  }, []);

  // Réception des nouveaux messages privés en temps réel
  useEffect(() => {
    if (!socket) return;

    // Fix the storage event listener to prevent parsing errors
    const storageEventHandler = (event) => {
      if (event.key && event.key.startsWith("lastMessage_")) {
        try {
          // Only try to parse if it's a valid string
          if (event.newValue && typeof event.newValue === "string") {
            // Just validate but don't use the result - this prevents parsing errors
            JSON.parse(event.newValue);
          }
        } catch (e) {
          console.warn("[DM] Storage event error:", e);
        }
      }
    };

    window.addEventListener("storage", storageEventHandler);

    // Update the handlePrivateMessage function to safely handle message storage
    const handlePrivateMessage = async (msg) => {
      console.log("[DM] Received private message:", msg);

      // Protection: skip if currentUserId is not yet defined
      if (!currentUserId) {
        console.log("[DM] Skipping message processing, currentUserId not defined yet");
        return;
      }

      // Only count as unread if it's not from current user and not in current conversation
      if (
        msg.fk_expediteur !== currentUserId &&
        (!selectedUser || msg.fk_expediteur !== selectedUser)
      ) {
        // Update the unread count for this sender
        setUnreadMessageCounts((prev) => {
          const senderId = msg.fk_expediteur;
          const newCounts = {
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          };

          // Update total count
          setTotalUnreadCount(calculateTotalUnreadCount(newCounts));
          return newCounts;
        });
      }

      // Ne rien faire si le message n'est pas pertinent pour la conversation active
      if (
        !selectedUser ||
        (msg.fk_expediteur !== selectedUser &&
          msg.fk_destinataire !== selectedUser)
      ) {
        console.log(
          "[DM] Message not relevant for current conversation, ignoring"
        );
        return;
      }

      // Récupérer les pièces jointes du message
      let attachments = [];
      try {
        if (msg.id_message_prive) {
          console.log(
            "[DM] Fetching attachments for new message:",
            msg.id_message_prive
          );
          attachments = await fetchMessageAttachments(msg.id_message_prive);
          console.log("[DM] Attachments retrieved:", attachments);
        }
      } catch (error) {
        console.error(
          "[DM] Error fetching attachments for new message:",
          error
        );
      }

      // Ajouter les pièces jointes au message
      const msgWithAttachments = { ...msg, attachments };

      setMessages((prev) => {
        // Vérifier si le message existe déjà (par id ou contenu+expéditeur pour les messages optimistes)
        const messageExists = prev.some((existingMsg) => {
          // Vérifier par ID réel
          if (existingMsg.id_message_prive === msg.id_message_prive)
            return true;

          // Vérifier par ID temporaire si présent
          if (
            msg.tempId &&
            existingMsg.id_message_prive === `temp-${msg.tempId}`
          )
            return true;

          // Vérifier par contenu et expéditeur (pour messages optimistes)
          if (
            existingMsg.isOptimistic &&
            existingMsg.contenu === msg.contenu &&
            existingMsg.fk_expediteur === msg.fk_expediteur
          )
            return true;

          return false;
        });

        if (messageExists) {
          // Remplacer les messages optimistes par la version réelle avec pièces jointes
          return prev.map((m) => {
            if (m.id_message_prive === msg.id_message_prive)
              return msgWithAttachments;

            if (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`)
              return msgWithAttachments;

            if (
              m.isOptimistic &&
              m.contenu === msg.contenu &&
              m.fk_expediteur === msg.fk_expediteur
            )
              return msgWithAttachments;

            return m;
          });
        } else {
          // Ajouter uniquement si le message n'existe pas
          return [...prev, msgWithAttachments];
        }
      });

      scrollToBottom();

      // Si c'est un nouveau message, rafraîchir la liste des conversations
      if (
        !conversations.includes(msg.fk_expediteur) &&
        msg.fk_expediteur !== currentUserId
      ) {
        fetchConversations();
      }
      // Ajout : toujours rafraîchir la liste des conversations pour affichage temps réel
      fetchConversations();
    };

    const handlePrivateMessageUpdated = (msg) => {
      console.log("Message updated:", msg);
      if (
        selectedUser &&
        (msg.fk_expediteur === selectedUser ||
          msg.fk_destinataire === selectedUser)
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === msg.id_message_prive ? msg : m
          )
        );
      }
    };

    const handlePrivateMessageDeleted = (data) => {
      console.log("Message deleted:", data);
      if (selectedUser) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === data.id
              ? { ...m, is_deleted: true, contenu: "[message supprimé]" }
              : m
          )
        );
      }
    };

    const handlePrivateMessageRead = (data) => {
      console.log("[DM] Message read event:", data);
      if (selectedUser) {
        setMessages((prev) =>
          prev.map((m) => {
            // Check if this is the message that was read
            if (m.id_message_prive === data.id) {
              console.log(
                `[DM] Marking message ${m.id_message_prive} as read at ${data.date_lecture}`
              );
              return { ...m, date_lecture: data.date_lecture };
            }
            return m;
          })
        );
      }
    };

    // Gérer les réactions aux messages privés
    const handlePrivateMessageReaction = (data) => {
      console.log("[DM] Message reaction event:", data);
      if (selectedUser) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id_message_prive === data.messageId) {
              console.log(`[DM] Updating reactions for message ${m.id_message_prive}`);
              return { ...m, reactions: data.reactions };
            }
            return m;
          })
        );
      }
    };

    socket.on("privateMessage", handlePrivateMessage);
    socket.on("privateMessageUpdated", handlePrivateMessageUpdated);
    socket.on("privateMessageDeleted", handlePrivateMessageDeleted);
    socket.on("privateMessageRead", handlePrivateMessageRead);
    socket.on("privateMessageReaction", handlePrivateMessageReaction);

    return () => {
      // Clean up event listener on unmount
      window.removeEventListener("storage", storageEventHandler);
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("privateMessageUpdated", handlePrivateMessageUpdated);
      socket.off("privateMessageDeleted", handlePrivateMessageDeleted);
      socket.off("privateMessageRead", handlePrivateMessageRead);
      socket.off("privateMessageReaction", handlePrivateMessageReaction);
    };
  }, [socket, selectedUser, conversations, currentUserId]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Récupère la liste des utilisateurs avec qui j'ai une conversation
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/private-messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.text();
        setError(`Erreur lors de la récupération des conversations: ${err}`);
        console.error("API Error:", err);
        setConversations([]);
        return;
      }

      const data = await res.json();
      console.log("Conversations reçues:", data);
      setConversations(data);

      // Précharge les infos utilisateurs
      for (const userId of data) {
        fetchUserInfo(userId);
      }
    } catch (e) {
      setError(`Erreur réseau: ${e.message}`);
      console.error("Network Error:", e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Récupère les infos d'un utilisateur
  const fetchUserInfo = async (userId) => {
    if (usersInfo[userId]) return usersInfo[userId];

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error(
          `Erreur lors de la récupération des infos utilisateur ${userId}`
        );
        return null;
      }

      const data = await res.json();

      // Log to debug the user data structure
      console.log(`[DM] Fetched user data for ${userId}:`, data);

      // Create a normalized user object with all possible fields
      const userInfo = {
        id: userId,
        name: data.nom || data.name || "Utilisateur",
        avatar: data.photo_de_profil || data.avatar || null,
        // Preserve all original fields for reference
        ...data,
      };

      console.log(`[DM] Normalized user info:`, userInfo);

      // Update the usersInfo state with this user
      setUsersInfo((prev) => ({ ...prev, [userId]: userInfo }));
      return userInfo;
    } catch (e) {
      console.error(
        `Erreur lors de la récupération des infos utilisateur ${userId}:`,
        e
      );
      // Return a fallback user object if fetch fails
      const fallbackUser = {
        id: userId,
        name: "Utilisateur",
        avatar: null,
      };
      setUsersInfo((prev) => ({ ...prev, [userId]: fallbackUser }));
      return fallbackUser;
    }
  };

  // Ajout d'une fonction pour récupérer les pièces jointes d'un message privé
  const fetchMessageAttachments = async (messageId) => {
    try {
      console.log(
        `[DM] Récupération des pièces jointes pour le message ${messageId}`
      );
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/attachments/private-messages/${messageId}/attachments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `[DM] Pièces jointes récupérées pour le message ${messageId}:`,
        data
      );
      return data;
    } catch (error) {
      console.error(
        "[DM] Erreur lors de la récupération des pièces jointes:",
        error
      );
      return [];
    }
  };

  // Récupère les messages d'une conversation
  const fetchMessages = async (userId) => {
    try {
      setLoadingMessages(true);
      setSelectedUser(userId);

      // Récupérer les informations de l'utilisateur sélectionné
      let userInfo = usersInfo[userId];
      if (!userInfo) {
        userInfo = await fetchUserInfo(userId);
      }
      setSelectedUserInfo(userInfo);

      // Clear unread messages for this user
      setUnreadMessageCounts((prev) => {
        const newCounts = { ...prev, [userId]: 0 };
        setTotalUnreadCount(calculateTotalUnreadCount(newCounts));
        return newCounts;
      });
      // Rafraîchir le compteur global (Sidebar) immédiatement
      if (refreshUnreadDM) refreshUnreadDM();

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/private-messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError(
          `Erreur lors de la récupération des messages: ${await res.text()}`
        );
        setMessages([]);
        return;
      }

      const data = await res.json();
      console.log("Messages récupérés:", data);

      // Pour chaque message, récupérer ses pièces jointes UNIQUEMENT si non présentes
      const messagesWithAttachments = await Promise.all(
        data.map(async (message) => {
          if (message.attachments && message.attachments.length > 0) {
            return message; // Pas de doublon
          }
          try {
            const attachments = await fetchMessageAttachments(
              message.id_message_prive
            );
            return { ...message, attachments };
          } catch (error) {
            return { ...message, attachments: [] };
          }
        })
      );
      setMessages(messagesWithAttachments);

      // Marquer les messages non lus comme lus
      markMessagesAsRead(data);
    } catch (e) {
      setError(`Erreur lors de la récupération des messages: ${e.message}`);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Improve the markMessagesAsRead function to be more robust
  const markMessagesAsRead = (msgs) => {
    if (!socket || !msgs || !msgs.length || !selectedUser || !currentUserId) return;

    const unreadMessages = msgs.filter(
      (m) => m.fk_expediteur !== currentUserId && !m.date_lecture
    );

    if (unreadMessages.length > 0) {
      console.log(`[DM] Marking ${unreadMessages.length} messages as read`);
      unreadMessages.forEach((msg) => {
        socket.emit("readPrivateMessage", {
          id: msg.id_message_prive,
          senderId: msg.fk_expediteur,
          recipientId: currentUserId,
        });
      });
      
      // Appel à refreshUnreadDM pour mettre à jour le compteur global sur toutes les pages
      if (refreshUnreadDM) {
        console.log("[DM] Rafraîchissement du compteur global de messages non lus");
        refreshUnreadDM();
      }
    }
  };

  // Add useEffect to handle visibility changes and mark messages as read
  // when the user is looking at them
  useEffect(() => {
    if (!selectedUser || !messages.length || !socket) return;

    // Mark messages as read when they are displayed
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markMessagesAsRead(messages);
      }
    };

    // Mark messages as read when focus returns to the window
    window.addEventListener("focus", () => markMessagesAsRead(messages));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial marking when messages are loaded
    markMessagesAsRead(messages);

    return () => {
      window.removeEventListener("focus", () => markMessagesAsRead(messages));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedUser, messages, socket]);

  // Fonction pour gérer la sélection de fichier
  const handleFileSelect = async (e) => {
    console.log("[DM] handleFileSelect déclenché");
    const file = e.target.files[0];
    if (!file) {
      console.log("[DM] Aucun fichier sélectionné");
      return;
    }
    console.log("[DM] Fichier sélectionné :", file);

    if (file.size > 10 * 1024 * 1024) {
      alert("Le fichier ne doit pas dépasser 10MB");
      console.log("[DM] Fichier trop volumineux :", file.size);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vous devez être connecté");
        console.log("[DM] Token manquant");
        return;
      }

      // Correction de l'URL d'upload pour les messages privés
      const uploadUrl = `${API_URL}/api/private-messages/upload`;
      console.log("[DM] URL d'upload utilisée :", uploadUrl);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("recipientId", selectedUser); // ou autre champ selon votre backend

      // Affichage du contenu du FormData pour debug
      for (let pair of formData.entries()) {
        console.log("[DM] FormData:", pair[0], pair[1]);
      }

      setUploadingFile(true);
      console.log("[DM] Envoi du fichier en cours...");

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("[DM] Réponse upload status :", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[DM] Erreur lors de l'upload:", errorData);
        alert(errorData.message || "Erreur lors de l'upload du fichier");
        return;
      }

      const data = await response.json();
      console.log("[DM] Réponse upload OK :", data);

      // Correction : si le backend retourne un message_prive, l'ajouter directement à l'UI
      if (data.message_prive) {
        // Récupérer les pièces jointes du message créé (pour cohérence UI)
        let attachments = [];
        try {
          attachments = await fetchMessageAttachments(
            data.message_prive.id_message_prive
          );
        } catch (err) {
          attachments = [];
        }
        setMessages((prev) => [
          ...prev,
          { ...data.message_prive, attachments },
        ]);
        setNewMessage("");
        setReplyingTo(null);
        setAttachments([]);
        // On ne fait PAS de sendMessage après un upload de fichier
        return;
      }

      // Ajouter le fichier à la liste des pièces jointes
      setAttachments([...attachments, data.fichier]);
      console.log("[DM] Pièce jointe ajoutée à l'état local :", data.fichier);
    } catch (err) {
      console.error("[DM] Erreur lors de l'upload:", err);
      alert("Erreur lors de l'upload du fichier");
    } finally {
      setUploadingFile(false);
      // Réinitialiser l'input file pour permettre de sélectionner à nouveau le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      console.log("[DM] Fin de handleFileSelect");
    }
  };

  // Fonction pour déclencher le sélecteur de fichier
  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Modifiez la fonction d'envoi pour gérer différents états de connexion
  const handleSendMessage = async (e) => {
    e.preventDefault();
    // Empêcher l'envoi si un fichier vient d'être uploadé et a déjà créé un message
    if ((!newMessage.trim() && attachments.length === 0) || !selectedUser)
      return;

    try {
      console.log(
        "[DM] Sending message to:",
        selectedUser,
        "content:",
        newMessage,
        "attachments:",
        attachments
      );

      // Générer un ID temporaire pour déduplication
      const tempId = Date.now().toString();

      // Créer un objet message local pour l'affichage immédiat
      const optimisticMessage = {
        id_message_prive: `temp-${tempId}`,
        contenu: newMessage,
        fk_expediteur: currentUserId,
        fk_destinataire: selectedUser,
        date_envoi: new Date().toISOString(),
        date_creation: new Date().toISOString(),
        isOptimistic: true,
        attachments: attachments.map((att) => ({
          id_fichier: att.id_fichier,
          nom_fichier: att.nom_fichier,
          // Utiliser directement l'URL sans transformation
          url: att.url || att.presignedUrl,
          presignedUrl: att.presignedUrl || att.url,
          type: att.type,
          taille_fichier: att.taille_fichier,
        })),
      };

      // Debug pour voir ce qui est affiché
      console.log(
        "[DM] Optimistic message with attachments:",
        optimisticMessage
      );

      // Ajouter le message optimiste à l'UI
      setMessages((prev) => [...prev, optimisticMessage]);

      const messageData = {
        destinataireId: selectedUser,
        contenu: newMessage,
        tempId,
        replyToId: replyingTo ? replyingTo.id_message_prive : null,
        attachments: attachments.map((att) => att.id_fichier),
      };

      // Envoi via socket ou API REST
      if (socket && socketStatus.connected) {
        socket.emit("privateMessage", messageData, (response) => {
          if (response && !response.ok) {
            console.error("Erreur socket:", response.message);
            sendMessageViaAPI(
              newMessage,
              selectedUser,
              replyingTo,
              attachments.map((att) => att.id_fichier)
            );
          }
        });
      } else {
        await sendMessageViaAPI(
          newMessage,
          selectedUser,
          replyingTo,
          attachments.map((att) => att.id_fichier)
        );
      }

      // Réinitialiser l'état après envoi
      setNewMessage("");
      setReplyingTo(null);
      setAttachments([]);
    } catch (e) {
      console.error("Erreur lors de l'envoi du message:", e);
      setError(`Erreur lors de l'envoi du message: ${e.message}`);
    }
  };

  // Fonction de fallback pour l'API REST avec paramètres explicites
  const sendMessageViaAPI = async (
    messageContent,
    recipientId,
    replyToMessage,
    attachmentIds = []
  ) => {
    if (!messageContent && attachmentIds.length === 0) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/private-messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinataireId: recipientId,
          contenu: messageContent || "",
          replyToId: replyToMessage ? replyToMessage.id_message_prive : null,
          attachments: attachmentIds,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();

      // Mise à jour des messages pour remplacer le message optimiste
      setMessages((prev) => {
        const exists = prev.some(
          (m) => !m.isOptimistic && m.id_message_prive === data.id_message_prive
        );

        if (exists) return prev;

        return prev.map((m) =>
          m.isOptimistic && m.contenu === messageContent ? data : m
        );
      });
    } catch (apiError) {
      console.error("API fallback failed:", apiError);
      setError(`Échec de l'envoi du message. Veuillez réessayer.`);
    }
  };

  // Filtre les conversations basées sur la recherche
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((userId) => {
        const user = usersInfo[userId] || {};
        return user.name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  // Récupérer la liste de tous les utilisateurs disponibles
  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Erreur lors de la récupération des utilisateurs");
        setAvailableUsers([]);
        setFilteredUsers([]);
        return;
      }

      const data = await res.json();
      // Correction : les utilisateurs ont l'id sous 'id_utilisateur'
      // Exclure l'utilisateur courant et ceux déjà en conversation
      const filteredData = data.filter(
        (user) =>
          user.id_utilisateur !== currentUserId &&
          !conversations.includes(user.id_utilisateur)
      );
      setAvailableUsers(filteredData);
      setFilteredUsers(filteredData);
    } catch (e) {
      console.error("Erreur lors de la récupération des utilisateurs:", e);
      setAvailableUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtrer les utilisateurs selon la recherche
  useEffect(() => {
    if (searchUserQuery.trim() === "") {
      setFilteredUsers(availableUsers);
    } else {
      const filtered = availableUsers.filter((user) =>
        (user.nom || "").toLowerCase().includes(searchUserQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchUserQuery, availableUsers]);

  // Ouvrir le modal de nouvelle conversation
  const handleOpenNewConversation = () => {
    setShowNewConversationModal(true);
    fetchAvailableUsers();
  };

  // Démarrer une conversation avec un utilisateur
  const startConversationWith = (userId) => {
    setShowNewConversationModal(false);
    fetchMessages(userId);

    // Si cet utilisateur n'est pas déjà dans la liste des conversations, ajoutez-le
    if (!conversations.includes(userId)) {
      setConversations((prev) => [...prev, userId]);
    }
  };

  // Gestionnaire pour le menu contextuel
  const handleMessageContextMenu = (e, msg) => {
    e.preventDefault();
    const isOwnMsg = msg.fk_expediteur === currentUserId;
    setMessageContextMenu({
      visible: true,
      xPos: e.pageX,
      yPos: e.pageY,
      messageId: msg.id_message_prive,
      isOwnMessage: isOwnMsg,
      message: msg,
    });
  };

  const handleCloseMessageContextMenu = () => {
    setMessageContextMenu({ ...messageContextMenu, visible: false });
  };

  // Répondre à un message
  const handleReplyMessage = () => {
    setReplyingTo(messageContextMenu.message);
    // Ne plus ajouter automatiquement le pseudo dans le champ de saisie
    handleCloseMessageContextMenu();
    const inputElement = document.querySelector(".dm-input");
    if (inputElement) inputElement.focus();
  };

  // Supprimer un message
  const handleDeleteMessage = async () => {
    try {
      if (!socket || !messageContextMenu.messageId) return;

      socket.emit("deletePrivateMessage", { id: messageContextMenu.messageId });
      handleCloseMessageContextMenu();
    } catch (error) {
      console.error("Erreur lors de la suppression du message:", error);
      setError("Erreur lors de la suppression du message");
    }
  };

  // Commencer à éditer un message
  const handleEditMessage = () => {
    setEditingMessage(messageContextMenu.message);
    setEditMessageContent(messageContextMenu.message.contenu);
    handleCloseMessageContextMenu();
  };

  // Sauvegarder les modifications d'un message
  const handleSaveEdit = async () => {
    try {
      if (!socket || !editingMessage) return;

      socket.emit("editPrivateMessage", {
        id: editingMessage.id_message_prive,
        contenu: editMessageContent,
      });

      setEditingMessage(null);
      setEditMessageContent("");
    } catch (error) {
      console.error("Erreur lors de la modification du message:", error);
      setError("Erreur lors de la modification du message");
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditMessageContent("");
  };

  // Annuler la réponse
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Gérer l'ajout d'une réaction à un message
  const handleAddReaction = () => {
    setShowEmojiPicker(true);
    setEmojiPickerPosition({
      top: messageContextMenu.yPos,
      left: messageContextMenu.xPos,
    });
    handleCloseMessageContextMenu();
  };

  // Gérer la sélection d'un emoji
  const handleEmojiSelect = (emoji) => {
    if (!socket || !messageContextMenu.messageId) return;

    socket.emit("addPrivateMessageReaction", {
      id: messageContextMenu.messageId,
      reaction: emoji,
    });

    setShowEmojiPicker(false);
  };

  // Fermer le sélecteur d'emoji lorsqu'on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Correction pour l'affichage des conversations/messages après reload
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
    }
    // eslint-disable-next-line
  }, [selectedUser]);

  // Add this function to calculate total unread messages
  const calculateTotalUnreadCount = (countsObj) => {
    return Object.values(countsObj).reduce((total, count) => total + count, 0);
  };

  // Add this effect to update the unread count in localStorage for the Sidebar
  useEffect(() => {
    localStorage.setItem("unreadPrivateMessages", totalUnreadCount.toString());
    const event = new CustomEvent("unreadMessagesUpdated", {
      detail: { count: totalUnreadCount },
    });
    window.dispatchEvent(event);
  }, [totalUnreadCount]);

  // Add an effect to load initial unread counts when component mounts
  useEffect(() => {
    // Check for any stored unread messages in localStorage or fetch from API
    const fetchUnreadCounts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_URL}/api/private-messages/unread-counts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setUnreadMessageCounts(data);
          setTotalUnreadCount(calculateTotalUnreadCount(data));
        }
      } catch (e) {
        console.error("Error fetching unread counts:", e);
      }
    };

    fetchUnreadCounts();
  }, []);

  // Vérifier le token au chargement du composant
  useEffect(() => {
    // Vérifier si le token est valide
    const tokenStatus = checkTokenValidity();
    console.log("[DM] Statut du token:", tokenStatus);
    
    if (tokenStatus.valid && tokenStatus.details && tokenStatus.details.id) {
      // Définir l'ID utilisateur à partir du token JWT
      setCurrentUserId(tokenStatus.details.id);
      console.log("[DM] ID utilisateur défini:", tokenStatus.details.id);
    } else {
      setError(`Erreur d'authentification: ${tokenStatus.error || "Token invalide"}. Veuillez vous reconnecter.`);
    }
  }, []);

  return (
    <div className="app-layout">
      <Sidebar unreadMessageCount={totalUnreadCount} />
      <div className="dm-layout">
        {/* Sidebar des conversations */}
        <div className="dm-sidebar">
          <div className="dm-sidebar-header">
            <h3 className="dm-title">Messages privés</h3>

            <div className="dm-search">
              <div className="dm-search-input-wrapper">
                <FaSearch className="dm-search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher des conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dm-search-input"
                />
              </div>
            </div>

            {/* Bouton nouvelle conversation */}
            <button
              className="dm-new-conversation-button"
              onClick={handleOpenNewConversation}
            >
              Démarrer une conversation
            </button>
          </div>

          {error && <div className="dm-error">{error}</div>}

          <ul className="dm-conv-list">
            {loading ? (
              <li className="dm-empty">Chargement des conversations...</li>
            ) : filteredConversations.length === 0 ? (
              <li className="dm-empty">
                {searchQuery ? "Aucun résultat" : "Aucune conversation"}
              </li>
            ) : (
              filteredConversations.map((userId) => {
                const user = usersInfo[userId] || {};
                const unreadCount = unreadMessageCounts[userId] || 0;
                return (
                  <li
                    key={userId}
                    className={`dm-conv-item ${selectedUser === userId ? "active" : ""}`}
                    onClick={() => fetchMessages(userId)}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || "User"}
                        className="dm-avatar"
                      />
                    ) : (
                      <div className="dm-avatar">
                        <div className="dm-avatar-placeholder">
                          {user.name ? user.name[0].toUpperCase() : "U"}
                        </div>
                      </div>
                    )}
                    <span className="dm-username">
                      {user.name || "Utilisateur"}
                    </span>
                    {unreadCount > 0 && (
                      <span className="dm-unread-badge">{unreadCount}</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Zone principale des messages */}
        <div className="dm-main">
          {/* Éléments SVG pour l'arrière-plan */}
          <div className="glow-circle-right top-right"></div>
          <div className="glow-circle-left bottom-left"></div>

          {!selectedUser ? (
            <div className="dm-empty-msg">
              <h2>Sélectionnez une conversation</h2>
              <p>Choisissez un contact pour afficher vos messages</p>
            </div>
          ) : (
            <>
              {/* Header avec infos du contact */}
              <div className="dm-header">
                <div className="dm-header-info">
                  {selectedUserInfo?.avatar ? (
                    <img
                      src={selectedUserInfo.avatar}
                      alt={selectedUserInfo.name || "User"}
                      className="dm-header-avatar"
                    />
                  ) : (
                    <FaUserCircle className="dm-header-avatar" />
                  )}
                  <h2 className="dm-header-username">
                    {selectedUserInfo?.name || "Utilisateur"}
                  </h2>
                  <div className="dm-header-status">
                    <span
                      className={`status-dot ${
                        selectedUserInfo?.status === "online"
                          ? "online"
                          : "offline"
                      }`}
                    ></span>
                    <span>
                      {selectedUserInfo?.status === "online"
                        ? "En ligne"
                        : "Hors ligne"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="dm-messages" ref={messagesContainerRef}>
                {loadingMessages ? (
                  <div className="dm-loading">Chargement des messages...</div>
                ) : messages.length === 0 ? (
                  <div className="dm-empty-msg">
                    <p>Aucun message</p>
                    <p>Envoyez le premier message !</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.fk_expediteur === currentUserId;

                    // Get the sender info, with strong fallbacks if missing
                    const senderId = msg.fk_expediteur;
                    const senderInfo = usersInfo[senderId] || {};

                    // Determine display name with fallbacks
                    const displayName =
                      senderInfo.name ||
                      senderInfo.nom ||
                      (isOwn ? "Vous" : "Utilisateur");

                    // Determine the avatar source with fallbacks
                    const avatarSrc =
                      senderInfo.avatar || senderInfo.photo_de_profil;

                    // Si c'est un message qu'on est en train d'éditer
                    if (
                      editingMessage &&
                      editingMessage.id_message_prive === msg.id_message_prive
                    ) {
                      return (
                        <div
                          key={msg.id_message_prive}
                          className={`dm-message ${
                            isOwn ? "own" : "other"
                          } editing`}
                        >
                          <div className="dm-msg-avatar">
                            {senderInfo.avatar ? (
                              <img
                                src={senderInfo.avatar}
                                alt={
                                  senderInfo.nom || senderInfo.name || "User"
                                }
                              />
                            ) : (
                              <div className="dm-avatar-placeholder">
                                {senderInfo.nom
                                  ? senderInfo.nom[0].toUpperCase()
                                  : senderInfo.name
                                  ? senderInfo.name[0].toUpperCase()
                                  : "U"}
                              </div>
                            )}
                          </div>

                          <div className="dm-msg-content">
                            <div className="dm-edit-container">
                              <textarea
                                value={editMessageContent}
                                onChange={(e) =>
                                  setEditMessageContent(e.target.value)
                                }
                                className="dm-edit-textarea"
                                autoFocus
                              />
                              <div className="dm-edit-actions">
                                <button
                                  onClick={handleSaveEdit}
                                  className="dm-edit-save"
                                >
                                  Enregistrer
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="dm-edit-cancel"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id_message_prive}
                        className={`dm-message ${isOwn ? "own" : "other"}`}
                        onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                      >
                        {/* Afficher le message parent (réponse) dans les messages privés, même style que workspaces */}
                        {msg.parent_id || msg.parent_message ? (
                          <div
                            className="message-reply-to"
                            onClick={() => {
                              const parentId = msg.parent_id || msg.parent_message?.id_message_prive;
                              if (parentId) {
                                const element = document.getElementById(`msg-${parentId}`);
                                if (element) {
                                  element.scrollIntoView({ behavior: "smooth", block: "center" });
                                  element.classList.add("highlight-message");
                                  setTimeout(() => element.classList.remove("highlight-message"), 2000);
                                }
                              }
                            }}
                          >
                            <span className="reply-icon">
                              <FaReply />
                            </span>
                            <div className="reply-content">
                              <span className="reply-author">
                                {msg.parent_message
                                  ? usersInfo[msg.parent_message.fk_expediteur]?.name || "Utilisateur"
                                  : msg.parent_id
                                    ? usersInfo[messages.find(m => m.id_message_prive === msg.parent_id)?.fk_expediteur]?.name || "Utilisateur"
                                    : "Utilisateur"}
                              </span>
                              <span className="reply-text">
                                {msg.parent_message
                                  ? msg.parent_message.contenu
                                  : msg.parent_id
                                    ? messages.find(m => m.id_message_prive === msg.parent_id)?.contenu || "Message original non disponible"
                                    : "Message original non disponible"}
                              </span>
                            </div>
                          </div>
                        ) : null}

                        <div className="dm-msg-avatar">
                          {avatarSrc ? (
                            <img src={avatarSrc} alt={displayName} />
                          ) : (
                            <div className="dm-avatar-placeholder">
                              {displayName[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="dm-msg-content">
                          <div className="dm-msg-header">
                            <span className="dm-msg-author">{displayName}</span>
                            <span className="dm-msg-date">
                              {formatMessageDate(
                                msg.date_creation || msg.date_envoi
                              )}
                            </span>
                          </div>

                          <div className="dm-msg-bubble">{msg.contenu}</div>

                          {/* Afficher les réactions aux messages privés */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="dm-msg-reactions">
                              {msg.reactions.map((reaction, index) => (
                                <div 
                                  key={`${reaction.reaction_type}-${index}`} 
                                  className="dm-msg-reaction"
                                  onClick={() => {
                                    // Si l'utilisateur a déjà réagi avec cet emoji, supprimer sa réaction
                                    if (reaction.has_reacted) {
                                      socket.emit("removePrivateMessageReaction", {
                                        id: msg.id_message_prive,
                                        reaction: reaction.reaction_type
                                      });
                                    }
                                  }}
                                >
                                  <span className="dm-reaction-emoji">{reaction.reaction_type}</span>
                                  <span className="dm-reaction-count">{reaction.count}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Afficher les pièces jointes du message */}
                          {msg.attachments &&
                            Array.isArray(msg.attachments) &&
                            msg.attachments.length > 0 && (
                              <div className="dm-msg-attachments">
                                {msg.attachments.map((attachment) => {
                                  // Toujours utiliser getCompleteFileUrl pour garantir une URL complète
                                  const fileUrl = getCompleteFileUrl(
                                    attachment.presignedUrl || attachment.url
                                  );

                                  console.log(
                                    "[DM] Affichage fichier avec URL:",
                                    fileUrl
                                  );

                                  if (
                                    attachment.type &&
                                    attachment.type.startsWith("image/")
                                  ) {
                                    // Affichage des images
                                    return (
                                      <div
                                        key={
                                          attachment.id_fichier ||
                                          `temp-${Date.now()}`
                                        }
                                        className="dm-msg-image-attachment"
                                      >
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <img
                                            src={fileUrl}
                                            alt={attachment.nom_fichier}
                                            className="dm-msg-image"
                                            onError={(e) => {
                                              console.error(
                                                `[DM] Failed to load image: ${fileUrl}`
                                              );
                                              e.target.src =
                                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="%23999" d="M21 5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5zm-2 14H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/></svg>';
                                              e.target.style.padding = "20px";
                                              e.target.style.width = "80px";
                                              e.target.style.height = "80px";
                                              e.target.style.background =
                                                "rgba(0,0,0,0.1)";
                                            }}
                                          />
                                        </a>
                                        <div className="dm-msg-image-filename">
                                          {attachment.nom_fichier}
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    // Autres types de fichiers
                                    return (
                                      <div
                                        key={
                                          attachment.id_fichier ||
                                          `temp-${Date.now()}`
                                        }
                                        className="dm-msg-file-attachment"
                                      >
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          download={attachment.nom_fichier}
                                          className="dm-msg-file-download-link"
                                        >
                                          <div className="dm-msg-file-icon">
                                            {getFileIcon(attachment.type)}
                                          </div>
                                          <div className="dm-msg-file-info">
                                            <div className="dm-msg-file-name">
                                              {attachment.nom_fichier}
                                            </div>
                                            <div className="dm-msg-file-size">
                                              {formatFileSize(
                                                attachment.taille_fichier
                                              )}
                                            </div>
                                          </div>
                                          <div className="dm-msg-file-download">
                                            <FaDownload />
                                          </div>
                                        </a>
                                      </div>
                                    );
                                  }
                                })}
                              </div>
                            )}

                          {isOwn && (
                            <div className="dm-msg-read">
                              {msg.date_lecture
                                ? `✓ Lu ${formatMessageDate(msg.date_lecture)}`
                                : "✓ Envoyé"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Formulaire d'envoi de message avec zone de réponse et upload de fichiers */}
              <form className="dm-input-form" onSubmit={handleSendMessage}>
                {replyingTo && (
                  <div className="dm-replying-to">
                    <div className="dm-replying-info">
                      <span>Réponse à </span>
                      <strong>
                        {usersInfo[replyingTo.fk_expediteur]?.name ||
                          "Utilisateur"}
                      </strong>
                      <span className="dm-replying-content">
                        : {replyingTo.contenu}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="dm-cancel-reply"
                      onClick={handleCancelReply}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}

                {/* Afficher les pièces jointes en attente */}
                {attachments.length > 0 && (
                  <div className="dm-attachments-preview">
                    {attachments.map((att, index) => (
                      <div
                        key={att.id_fichier || index}
                        className="dm-attachment-preview"
                      >
                        <span className="attachment-name">
                          {att.nom_fichier}
                        </span>
                        <button
                          type="button"
                          className="attachment-remove"
                          onClick={() =>
                            setAttachments(
                              attachments.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="dm-input-wrapper">
                  {/* Input file caché déclenché par le bouton d'attachement */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className={`dm-attachment-btn ${
                      uploadingFile ? "uploading" : ""
                    }`}
                    onClick={handleAttachmentClick}
                    disabled={uploadingFile}
                  >
                    <FaPaperclip />
                    {uploadingFile && <span className="upload-spinner"></span>}
                  </button>
                  <input
                    type="text"
                    placeholder={`Message à ${
                      selectedUserInfo?.name || "l'utilisateur"
                    }`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="dm-input"
                    disabled={uploadingFile}
                  />
                  <button type="button" className="dm-emoji-btn">
                    <FaSmile />
                  </button>
                </div>
                <button
                  type="submit"
                  className="dm-send-btn"
                  disabled={
                    (!newMessage.trim() && attachments.length === 0) ||
                    uploadingFile
                  }
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Modal pour nouvelle conversation */}
        {showNewConversationModal && (
          <div className="dm-modal-overlay">
            <div className="dm-modal">
              <div className="dm-modal-header">
                <h3>Nouvelle conversation</h3>
                <button
                  className="dm-modal-close"
                  onClick={() => setShowNewConversationModal(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="dm-modal-body">
                <div className="dm-search-input-wrapper modal">
                  <FaSearch className="dm-search-icon" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="dm-search-input"
                    autoFocus
                  />
                </div>

                <div className="dm-users-list">
                  {loadingUsers ? (
                    <div className="dm-loading-users">
                      Chargement des utilisateurs...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="dm-no-users">Aucun utilisateur trouvé</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id_utilisateur}
                        className="dm-user-item"
                        onClick={() =>
                          startConversationWith(user.id_utilisateur)
                        }
                      >
                        {user.photo_de_profil ? (
                          <img
                            src={user.photo_de_profil}
                            alt={user.nom}
                            className="dm-avatar"
                          />
                        ) : (
                          <div className="dm-avatar">
                            <FaUserCircle className="dm-avatar-placeholder" />
                          </div>
                        )}
                        <span className="dm-username">
                          {user.nom ||
                            `Utilisateur ${user.id_utilisateur.substring(
                              0,
                              6
                            )}`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu contextuel pour les messages */}
        {messageContextMenu.visible && (
          <div
            className="dm-context-menu"
            style={{
              top: messageContextMenu.yPos,
              left: messageContextMenu.xPos,
            }}
          >
            {messageContextMenu.isOwnMessage ? (
              <>
                <div
                  className="dm-context-menu-item"
                  onClick={handleEditMessage}
                >
                  Modifier
                </div>
                <div
                  className="dm-context-menu-item"
                  onClick={handleDeleteMessage}
                >
                  Supprimer
                </div>
                <div
                  className="dm-context-menu-item"
                  onClick={handleReplyMessage}
                >
                  <FaReply className="dm-context-menu-icon" /> Répondre
                </div>
                <div
                  className="dm-context-menu-item"
                  onClick={handleAddReaction}
                >
                  <FaRegSmile className="dm-context-menu-icon" /> Ajouter une
                  réaction
                </div>
              </>
            ) : (
              <>
                <div
                  className="dm-context-menu-item"
                  onClick={handleReplyMessage}
                >
                  <FaReply className="dm-context-menu-icon" /> Répondre
                </div>
                <div
                  className="dm-context-menu-item"
                  onClick={handleAddReaction}
                >
                  <FaRegSmile className="dm-context-menu-icon" /> Ajouter une
                  réaction
                </div>
              </>
            )}
          </div>
        )}

        {/* Sélecteur d'emoji */}
        {showEmojiPicker && (
          <div
            className="dm-emoji-picker"
            style={{
              top: emojiPickerPosition.top,
              left: emojiPickerPosition.left,
            }}
            ref={emojiPickerRef}
          >
            <div className="dm-emoji-grid">
              {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => (
                <div
                  key={emoji}
                  className="dm-emoji-item"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Couche transparente pour fermer le menu */}
        {messageContextMenu.visible && (
          <div
            className="dm-context-menu-overlay"
            onClick={handleCloseMessageContextMenu}
          />
        )}
      </div>
    </div>
  );
}

export default DirectMessages;
