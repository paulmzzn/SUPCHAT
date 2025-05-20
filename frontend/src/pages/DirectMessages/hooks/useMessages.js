// Hook principal pour gérer les messages entre utilisateurs

import { useMessageList } from "./useMessageList";
import { useMessageInput } from "./useMessageInput";
import { useMessageContextMenu } from "./useMessageContextMenu";
import { useMessageReactions } from "./useMessageReactions";
import { useRef, useState } from "react";

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

  return {
    ...messageList,
    ...messageInput,
    ...contextMenu,
    ...reactions,
    newMessage,
    setNewMessage,
    messagesContainerRef,
    fileInputRef,
    emojiPickerRef,
  };
};
