// Hook pour la gestion de la liste des messages (chargement, suppression, édition, reply, etc.)
import { useState, useCallback, useRef, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.104:3000";

export function useMessageList({ selectedUser, socket, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const paramsRef = useRef({ selectedUser, socket, currentUserId });
  // Fonction pour répondre à un message
  const handleReplyMessage = useCallback((message) => {
    setReplyingTo(message);
  }, []);

  // Annuler la réponse
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Marquer comme lus
  const markMessagesAsRead = useCallback(
    (msgs) => {
      if (
        !selectedUser ||
        !socket?.connected ||
        !msgs?.length ||
        !currentUserId
      )
        return;
      const unreadMessages = msgs.filter(
        (msg) =>
          msg.fk_expediteur === selectedUser &&
          msg.fk_destinataire === currentUserId &&
          !msg.date_lecture
      );
      if (unreadMessages.length === 0) return;
      socket.emit(
        "readAllPrivateMessages",
        {
          senderId: selectedUser,
          recipientId: currentUserId,
        },
        (response) => {
          if (!response.success) {
            console.error("Erreur lors du marquage des messages comme lus");
          }
        }
      );
      setMessages((currentMessages) =>
        currentMessages.map((msg) => {
          if (msg.fk_expediteur === selectedUser && !msg.date_lecture) {
            return { ...msg, date_lecture: new Date().toISOString() };
          }
          return msg;
        })
      );
    },
    [selectedUser, socket, currentUserId]
  );

  // Fonction utilitaire pour récupérer les pièces jointes d'un message
  const fetchMessageAttachments = useCallback(async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/private-messages/${messageId}/attachments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }, []);

  // Fonction pour charger les messages d'une conversation (avec pièces jointes)
  const fetchMessages = useCallback(async () => {
    const { selectedUser, currentUserId } = paramsRef.current;
    if (!selectedUser || !socket || !currentUserId) return;
    if (loadingMessages) return;
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vous n'êtes pas connecté");
      const response = await fetch(
        `${API_URL}/api/private-messages/${selectedUser}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 404) {
        setMessages([]);
        return;
      }
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      const data = await response.json();
      // Ajout des pièces jointes à chaque message
      const messagesWithAttachments = await Promise.all(
        data.map(async (msg) => {
          if (!msg.id_message_prive) return msg;
          try {
            const attachments = await fetchMessageAttachments(
              msg.id_message_prive
            );
            return { ...msg, attachments };
          } catch {
            return { ...msg, attachments: [] };
          }
        })
      );
      setMessages(messagesWithAttachments);
      markMessagesAsRead(messagesWithAttachments);
    } catch (error) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [loadingMessages, markMessagesAsRead, fetchMessageAttachments]);

  // Effet pour charger les messages quand selectedUser change
  const previousSelectedUserRef = useRef(null);
  useEffect(() => {
    paramsRef.current = { selectedUser, socket, currentUserId };
    if (selectedUser && selectedUser !== previousSelectedUserRef.current) {
      previousSelectedUserRef.current = selectedUser;
      fetchMessages();
    }
  }, [selectedUser, socket, currentUserId, fetchMessages]);

  // Écoute des nouveaux messages privés en temps réel via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = async (msg) => {
      // Vérifier si le message concerne la conversation active
      if (!msg) return;
      const { selectedUser, currentUserId } = paramsRef.current;
      if (
        !selectedUser ||
        !currentUserId ||
        !(
          (msg.fk_expediteur === selectedUser &&
            msg.fk_destinataire === currentUserId) ||
          (msg.fk_expediteur === currentUserId &&
            msg.fk_destinataire === selectedUser)
        )
      ) {
        return;
      }
      // Utiliser les attachments du message WebSocket si présents, sinon fetch
      let attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
      if (!attachments.length && msg.id_message_prive) {
        attachments = await fetchMessageAttachments(msg.id_message_prive);
      }
      setMessages((prev) => {
        // Remplacer le message optimiste si tempId correspond
        if (msg.tempId) {
          const exists = prev.some((m) => m.tempId && m.tempId === msg.tempId);
          if (exists) {
            return prev.map((m) =>
              m.tempId === msg.tempId ? { ...msg, attachments } : m
            );
          }
        }
        // Sinon, ne pas ajouter de doublon par id
        if (prev.some((m) => m.id_message_prive === msg.id_message_prive))
          return prev;
        return [...prev, { ...msg, attachments }];
      });
      // Marquer comme lu si c'est un message reçu
      if (
        msg.fk_expediteur === selectedUser &&
        msg.fk_destinataire === currentUserId
      ) {
        markMessagesAsRead([{ ...msg }]);
      }
    };
    socket.on("privateMessage", handlePrivateMessage);
    return () => {
      socket.off("privateMessage", handlePrivateMessage);
    };
  }, [socket, fetchMessageAttachments, markMessagesAsRead]);

  // Suppression, édition, reply, etc. peuvent être ajoutés ici

  // Retourner les états et méthodes du hook
  return {
    messages,
    loadingMessages,
    setMessages,
    editingMessage,
    setEditingMessage,
    editMessageContent,
    setEditMessageContent,
    replyingTo,
    setReplyingTo,
    markMessagesAsRead,
    handleReplyMessage,
    handleCancelReply,
    // ...existing code...
  };
}
