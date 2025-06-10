// Hook principal pour gérer les messages entre utilisateurs

import { useMessageList } from "./useMessageList";
import { useMessageInput } from "./useMessageInput";
import { useMessageContextMenu } from "./useMessageContextMenu";
import { useMessageReactions } from "./useMessageReactions";
import { useRef, useState, useCallback, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.73:3000";

/**
 * Hook pour gérer les messages entre utilisateurs
 * @param {string} selectedUser - ID de l'utilisateur sélectionné
 * @param {Object} socket - Instance socket.io
 * @param {string} currentUserId - ID de l'utilisateur courant
 * @returns {Object} - États et fonctions liés aux messages
 */
export const useMessages = (
  selectedUser,
  socket,
  currentUserId,
  attachments = [],
  setAttachments = () => {}
) => {
  // Toujours appeler le hook, même si les paramètres sont nuls (règle des hooks)
  const messageList = useMessageList({ selectedUser, socket, currentUserId });

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Saisie et envoi de message
  const messageInput = useMessageInput({
    selectedUser,
    socket,
    currentUserId,
    attachments,
    setAttachments,
    replyingTo: messageList.replyingTo,
    setReplyingTo: messageList.setReplyingTo,
    setMessages: messageList.setMessages,
    newMessage, // <-- ajouté
    setNewMessage, // <-- ajouté
  });

  // Menu contextuel
  const contextMenu = useMessageContextMenu(currentUserId);

  // Réactions (emoji)
  const reactions = useMessageReactions({
    socket,
    messageContextMenu: contextMenu.messageContextMenu,
    setMessages: messageList.setMessages,
  });

  // Réfs UI
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = reactions.emojiPickerRef;

  // Fonction utilitaire pour recharger la conversation depuis l'API
  const refetchConversation = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/private-messages/${selectedUser}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        console.error("Erreur lors du rechargement des messages:", res.status);
      }
    } catch (err) {
      console.error("Erreur réseau lors du rechargement des messages:", err);
    }
  }, [selectedUser, setMessages]);

  // Fonction pour supprimer un message via WebSocket
  const handleDeleteMessage = useCallback(
    (message) => {
      if (!message || !message.id_message_prive) return;
      socket.emit(
        "deletePrivateMessage",
        { id: message.id_message_prive }
        // On ne refait PAS refetchConversation ici, le live update WebSocket suffit
      );
    },
    [socket]
  );

  // Édition de message
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");

  const handleEditMessage = useCallback((message) => {
    setEditingMessage(message);
    setEditMessageContent(message.contenu);
  }, []);

  // Fonction pour éditer un message via WebSocket
  const handleSaveEdit = useCallback(() => {
    if (!editingMessage) return;
    socket.emit(
      "editPrivateMessage",
      {
        id: editingMessage.id_message_prive,
        contenu: editMessageContent,
      }
      // On ne refait PAS refetchConversation ici, le live update WebSocket suffit
    );
    setEditingMessage(null);
    setEditMessageContent("");
  }, [socket, editingMessage, editMessageContent]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditMessageContent("");
  }, []);

  // --- Live update via WebSocket events ---
  useEffect(() => {
    if (!socket) return;

    const handleMessageUpdated = (updatedMsg) => {
      messageList.setMessages((msgs) =>
        msgs.map((m) =>
          m.id_message_prive === updatedMsg.id_message_prive
            ? { ...m, ...updatedMsg }
            : m
        )
      );
      // Fermer l'éditeur si on est en train d'éditer ce message
      if (
        editingMessage &&
        editingMessage.id_message_prive === updatedMsg.id_message_prive
      ) {
        setEditingMessage(null);
        setEditMessageContent("");
      }
    };

    const handleMessageDeleted = ({ id }) => {
      messageList.setMessages((msgs) =>
        msgs.map((m) =>
          m.id_message_prive === id ? { ...m, is_deleted: true } : m
        )
      );
      // Fermer l'éditeur si on est en train d'éditer ce message supprimé
      if (editingMessage && editingMessage.id_message_prive === id) {
        setEditingMessage(null);
        setEditMessageContent("");
      }
    };

    socket.on("privateMessageUpdated", handleMessageUpdated);
    socket.on("privateMessageDeleted", handleMessageDeleted);

    return () => {
      socket.off("privateMessageUpdated", handleMessageUpdated);
      socket.off("privateMessageDeleted", handleMessageDeleted);
    };
  }, [socket, messageList, editingMessage]);

  return {
    ...messageList,
    ...messageInput,
    ...contextMenu,
    ...reactions,
    messages: messageList.messages,
    loadingMessages: messageList.loadingMessages,
    newMessage,
    editingMessage,
    editMessageContent,
    setEditMessageContent,
    setMessages,
    setNewMessage,
    messagesContainerRef,
    fileInputRef,
    emojiPickerRef,
    handleDeleteMessage, // Ajout de la fonction de suppression
    handleEditMessage, // Ajout de la fonction d'édition
    handleSaveEdit,
    handleCancelEdit,
  };
};
