// Hook personnalisé pour gérer les messages
import { useState, useEffect, useCallback, useRef } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.57:3000";

/**
 * Hook pour gérer les messages entre utilisateurs
 * @param {string} selectedUser - ID de l'utilisateur sélectionné
 * @param {Object} socket - Instance socket.io
 * @param {string} currentUserId - ID de l'utilisateur courant
 * @returns {Object} - États et fonctions liés aux messages
 */
export const useMessages = (selectedUser, socket, currentUserId) => {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [messageContextMenu, setMessageContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    messageId: null,
    isOwnMessage: false,
    message: null,
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  /**
   * Récupère les messages d'une conversation
   * @param {string} userId - ID de l'utilisateur
   */
  const fetchMessages = useCallback(async (userId) => {
    if (!userId) return;

    try {
      setLoadingMessages(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/private-messages/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des messages");
      }

      const data = await response.json();

      // Enrichir les messages avec les pièces jointes
      const messagesWithAttachments = await Promise.all(
        data.map(async (msg) => {
          if (!msg.id_message_prive) return msg;

          try {
            const attachments = await fetchMessageAttachments(
              msg.id_message_prive
            );
            return { ...msg, attachments };
          } catch (error) {
            console.error(
              "Erreur lors de la récupération des pièces jointes:",
              error
            );
            return { ...msg, attachments: [] };
          }
        })
      );

      setMessages(messagesWithAttachments);

      // Marquer les messages comme lus
      markMessagesAsRead(messagesWithAttachments);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  /**
   * Récupère les pièces jointes d'un message
   * @param {string} messageId - ID du message
   * @returns {Array} - Liste des pièces jointes
   */
  const fetchMessageAttachments = useCallback(async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/private-messages/${messageId}/attachments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des pièces jointes");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur:", error);
      return [];
    }
  }, []);

  /**
   * Envoie un message à un utilisateur
   * @param {string} messageContent - Contenu du message
   * @param {string} recipientId - ID du destinataire
   * @param {Object} replyToMessage - Message auquel on répond
   * @param {Array} attachmentIds - IDs des pièces jointes
   * @returns {Object} - Le message envoyé
   */
  const sendMessage = useCallback(
    async (messageContent, recipientId, replyToMessage, attachmentIds = []) => {
      if (!socket?.connected) {
        return sendMessageViaAPI(
          messageContent,
          recipientId,
          replyToMessage,
          attachmentIds
        );
      }

      return new Promise((resolve, reject) => {
        socket.emit(
          "privateMessage",
          {
            contenu: messageContent,
            recipient: recipientId,
            parent_id: replyToMessage?.id_message_prive || null,
            attachments: attachmentIds,
          },
          (response) => {
            if (response.success) {
              console.log("Message privé envoyé avec succès via socket");
              resolve(response.message);
            } else {
              console.error(
                "Erreur d'envoi via socket, tentative via API REST"
              );
              sendMessageViaAPI(
                messageContent,
                recipientId,
                replyToMessage,
                attachmentIds
              )
                .then(resolve)
                .catch(reject);
            }
          }
        );

        // Timeout de secours en cas de non-réponse du serveur
        setTimeout(() => {
          console.warn("Timeout socket, fallback API REST");
          sendMessageViaAPI(
            messageContent,
            recipientId,
            replyToMessage,
            attachmentIds
          )
            .then(resolve)
            .catch(reject);
        }, 5000);
      });
    },
    [socket]
  );

  /**
   * Envoie un message via l'API REST (fallback)
   * @param {string} messageContent - Contenu du message
   * @param {string} recipientId - ID du destinataire
   * @param {Object} replyToMessage - Message auquel on répond
   * @param {Array} attachmentIds - IDs des pièces jointes
   * @returns {Object} - Le message envoyé
   */
  const sendMessageViaAPI = useCallback(
    async (messageContent, recipientId, replyToMessage, attachmentIds = []) => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/api/private-messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contenu: messageContent,
            fk_destinataire: recipientId,
            parent_id: replyToMessage?.id_message_prive || null,
            attachments: attachmentIds,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de l'envoi du message");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Erreur d'envoi via API:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Marque les messages comme lus
   * @param {Array} msgs - Liste des messages
   */
  const markMessagesAsRead = useCallback(
    (msgs) => {
      if (
        !socket?.connected ||
        !selectedUser ||
        !msgs?.length ||
        !currentUserId
      )
        return;

      // Trouver les messages non lus envoyés par l'autre utilisateur
      const unreadMessages = msgs.filter(
        (msg) =>
          msg.fk_expediteur === selectedUser &&
          msg.fk_destinataire === currentUserId &&
          !msg.date_lecture
      );

      if (unreadMessages.length === 0) return;

      // Marquer comme lus via socket
      socket.emit(
        "markPrivateMessagesAsRead",
        {
          messages: unreadMessages.map((msg) => msg.id_message_prive),
          sender: selectedUser,
        },
        (response) => {
          if (!response.success) {
            console.error("Erreur lors du marquage des messages comme lus");
          }
        }
      );

      // Mettre à jour localement
      setMessages((currentMessages) =>
        currentMessages.map((msg) => {
          if (msg.fk_expediteur === selectedUser && !msg.date_lecture) {
            return { ...msg, date_lecture: new Date().toISOString() };
          }
          return msg;
        })
      );
    },
    [socket, selectedUser, currentUserId]
  );

  /**
   * Supprime un message
   * @param {string} messageId - ID du message
   * @returns {boolean} - Succès de la suppression
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/private-messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du message");
      }

      // Mettre à jour localement
      setMessages((prev) =>
        prev.filter((msg) => msg.id_message_prive !== messageId)
      );

      return true;
    } catch (error) {
      console.error("Erreur:", error);
      return false;
    }
  }, []);

  /**
   * Modifie un message
   * @param {string} messageId - ID du message
   * @param {string} newContent - Nouveau contenu
   * @returns {boolean} - Succès de la modification
   */
  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/private-messages/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contenu: newContent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du message");
      }

      const updatedMessage = await response.json();

      // Mettre à jour localement
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id_message_prive === messageId
            ? {
                ...msg,
                contenu: newContent,
                date_modification: updatedMessage.date_modification,
              }
            : msg
        )
      );

      return true;
    } catch (error) {
      console.error("Erreur:", error);
      return false;
    }
  }, []);

  /**
   * Ajoute une réaction à un message
   * @param {string} messageId - ID du message
   * @param {string} reaction - Emoji de réaction
   */
  const addReaction = useCallback(
    (messageId, reaction) => {
      if (!socket?.connected) {
        console.error("Socket non connecté, impossible d'ajouter une réaction");
        return;
      }

      socket.emit("addPrivateMessageReaction", {
        id: messageId,
        reaction: reaction,
      });
    },
    [socket]
  );

  /**
   * Télécharge un fichier
   * @param {string} fileUrl - URL du fichier
   * @param {string} fileName - Nom du fichier
   */
  const downloadFile = useCallback((fileUrl, fileName) => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  /**
   * Gère la sélection de fichier
   * @param {Event} e - Événement de changement de fichier
   */
  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);

    try {
      const token = localStorage.getItem("token");
      const uploads = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${API_URL}/api/files/private-message-attachment`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur lors de l'upload du fichier ${file.name}`);
        }

        const data = await response.json();
        uploads.push({
          id_fichier: data.id_fichier,
          nom_fichier: data.nom_fichier || file.name,
          type: file.type,
          taille_fichier: file.size,
          url: data.url,
        });
      }

      setAttachments((prev) => [...prev, ...uploads]);
      // Réinitialiser le champ file input
      e.target.value = "";
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Une erreur est survenue lors de l'upload du fichier");
    } finally {
      setUploadingFile(false);
    }
  }, []);

  /**
   * Déclenche le sélecteur de fichier
   */
  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [fileInputRef]);

  /**
   * Fait défiler jusqu'au bas des messages
   */
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messagesContainerRef]);

  // Effet pour faire défiler jusqu'au bas quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Effet pour marquer les messages comme lus quand la visibilité change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && selectedUser) {
        markMessagesAsRead(messages);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedUser, messages, markMessagesAsRead]);

  // Effet pour fermer le sélecteur d'emoji au clic en dehors
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
  return {
    messages,
    loadingMessages,
    newMessage,
    setNewMessage,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editMessageContent,
    setEditMessageContent,
    attachments,
    setAttachments,
    uploadingFile,
    setUploadingFile,
    messageContextMenu,
    setMessageContextMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    emojiPickerPosition,
    setEmojiPickerPosition,
    messagesContainerRef,
    fileInputRef,
    emojiPickerRef,
    fetchMessages,
    fetchMessageAttachments,
    sendMessage,
    markMessagesAsRead,
    deleteMessage,
    editMessage,
    addReaction,
    downloadFile,
    handleFileSelect,
    triggerFileInput,
    scrollToBottom,
    setMessages,
  };
};
