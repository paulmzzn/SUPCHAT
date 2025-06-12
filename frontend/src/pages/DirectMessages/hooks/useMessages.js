// Hook principal pour gérer les messages entre utilisateurs

import { useMessageList } from "./useMessageList";
import { useMessageInput } from "./useMessageInput";
import { useMessageContextMenu } from "./useMessageContextMenu";
import { useMessageReactions } from "./useMessageReactions";
import { useRef, useState, useCallback, useEffect } from "react";

import { API_URL } from "../../../config/config";
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
  setAttachments = () => {},
  isSocketConnected = false,
  hasJoinedPrivateRoom = false,
  ensurePrivateRoomJoined = () => false
) => {
  // Toujours appeler le hook, même si les paramètres sont nuls (règle des hooks)
  const messageList = useMessageList({ selectedUser, socket, currentUserId });

  // Ne pas dupliquer l'état des messages, utiliser celui de messageList
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
    isSocketConnected, // <-- ajouté
    hasJoinedPrivateRoom, // <-- ajouté
    ensurePrivateRoomJoined, // <-- ajouté
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
        messageList.setMessages(data);
      } else {
        console.error("Erreur lors du rechargement des messages:", res.status);
      }
    } catch (err) {
      console.error("Erreur réseau lors du rechargement des messages:", err);
    }
  }, [selectedUser, messageList.setMessages]);

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
    };    const handleMessageDeleted = ({ id }) => {
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
    };    // Handler pour les statuts de lecture en temps réel
    const handleMessageRead = ({ id, date_lecture }) => {
      console.log("[DM] Message marqué comme lu:", { id, date_lecture });
      messageList.setMessages((msgs) =>
        msgs.map((m) =>
          m.id_message_prive === id ? { ...m, date_lecture } : m
        )
      );
    };

    // Handler pour tous les messages marqués comme lus d'un coup
    const handleAllMessagesRead = ({ readBy, count, timestamp }) => {
      console.log("[DM] Tous les messages marqués comme lus:", { readBy, count, timestamp });
      messageList.setMessages((msgs) =>
        msgs.map((m) => {
          // Marquer comme lu tous les messages envoyés par l'utilisateur actuel au destinataire
          if (m.fk_expediteur === currentUserId && m.fk_destinataire === readBy && !m.date_lecture) {
            return { ...m, date_lecture: timestamp };
          }
          return m;
        })
      );
    };

    socket.on("privateMessageUpdated", handleMessageUpdated);
    socket.on("privateMessageDeleted", handleMessageDeleted);
    socket.on("privateMessageRead", handleMessageRead);
    socket.on("allMessagesRead", handleAllMessagesRead);

    return () => {
      socket.off("privateMessageUpdated", handleMessageUpdated);
      socket.off("privateMessageDeleted", handleMessageDeleted);
      socket.off("privateMessageRead", handleMessageRead);
      socket.off("allMessagesRead", handleAllMessagesRead);
    };
  }, [socket, messageList, editingMessage, currentUserId]); // Ajout de currentUserId dans les dépendances
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
    setMessages: messageList.setMessages, // Correction: utiliser messageList.setMessages
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
