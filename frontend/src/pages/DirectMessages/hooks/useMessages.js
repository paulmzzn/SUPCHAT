// Hook principal pour gérer les messages entre utilisateurs

import { useMessageList } from "./useMessageList";
import { useMessageInput } from "./useMessageInput";
import { useMessageContextMenu } from "./useMessageContextMenu";
import { useMessageReactions } from "./useMessageReactions";
import { useRef, useState, useCallback } from "react";

export const useMessages = (
  selectedUser,
  socket,
  currentUserId,
  attachments = [],
  setAttachments = () => {}
) => {
  // Liste des messages et actions principales
  const messageList = useMessageList({
    selectedUser,
    socket,
    currentUserId,
  });

  const { setMessages, ...rest } = messageList;

  // State pour le champ de saisie du message
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

  // Fonction pour supprimer un message
  const handleDeleteMessage = useCallback(
    async (message) => {
      if (!message || !message.id_message_prive) return;
      // Appel API ou socket pour supprimer
      try {
        await fetch(`${API_URL}/messages/${message.id_message_prive}`, {
          method: "DELETE",
          credentials: "include",
        });
        setMessages((msgs) =>
          msgs.map((m) =>
            m.id_message_prive === message.id_message_prive
              ? { ...m, is_deleted: true }
              : m
          )
        );
      } catch (err) {
        console.error("Erreur suppression message:", err);
      }
    },
    [setMessages]
  );

  // Édition de message
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");

  const handleEditMessage = useCallback((message) => {
    setEditingMessage(message);
    setEditMessageContent(message.contenu);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMessage) return;
    try {
      await fetch(`${API_URL}/messages/${editingMessage.id_message_prive}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: editMessageContent }),
      });
      setMessages((msgs) =>
        msgs.map((m) =>
          m.id_message_prive === editingMessage.id_message_prive
            ? { ...m, contenu: editMessageContent }
            : m
        )
      );
      setEditingMessage(null);
      setEditMessageContent("");
    } catch (err) {
      console.error("Erreur modification message:", err);
    }
  }, [editingMessage, editMessageContent]);

  return {
    ...messageList,
    ...messageInput,
    ...contextMenu,
    ...reactions,
    ...rest,
    newMessage,
    setMessages,
    setNewMessage,
    messagesContainerRef,
    fileInputRef,
    emojiPickerRef,
    handleDeleteMessage, // Ajout de la fonction de suppression
    handleEditMessage, // Ajout de la fonction d'édition
    handleSaveEdit, // Ajout de la fonction pour sauvegarder l'édition
  };
};
