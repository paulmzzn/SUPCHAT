import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000003";

export const useMessageActions = (
  socket,
  channelId,
  workspaceId,
  currentUserId,
  setMessages
) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    message: null,
    position: { x: 0, y: 0 },
    isOwnMessage: false,
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState(null);

  const typingTimeoutRef = useRef(null);

  // Convertir les mentions au format visible vers le format interne
  const convertMentionsForSending = useCallback((text) => {
    // Rechercher toutes les mentions au format @[nom](id)
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    
    // Remplacer par le format interne @[id:nom]
    return text.replace(mentionRegex, (match, nom, id) => {
      return `@[${id}:${nom}]`;
    });
  }, []);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket) return;

    // Convertir les mentions au format attendu par le backend
    const processedMessage = convertMentionsForSending(newMessage.trim());
    
    console.log("📤 Envoi du message:", processedMessage);

    const messageData = {
      canal_id: channelId,
      content: processedMessage,
      workspace_id: workspaceId,
      parent_id: replyingTo ? replyingTo.id_message : null,
    };

    socket.emit('message', messageData);
    socket.emit('stopTyping', { canalId: channelId, userId: currentUserId });
    setNewMessage('');
    setIsTyping(false);
    setReplyingTo(null);
  }, [newMessage, socket, currentUserId, channelId, workspaceId, replyingTo, convertMentionsForSending]);

  const handleInputChange = useCallback((text) => {
    setNewMessage(text);

    if (socket && text.trim() && !isTyping) {
      setIsTyping(true);
      socket.emit('typing', { canalId: channelId, userId: currentUserId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && isTyping) {
        socket.emit('stopTyping', { canalId: channelId, userId: currentUserId });
        setIsTyping(false);
      }
    }, 2000);
  }, [socket, isTyping, channelId, currentUserId]);

  const handleLongPressMessage = useCallback((message, event) => {
    if (!message || message.fk_utilisateur === SYSTEM_USER_ID) return;

    const isOwnMessage = message.fk_utilisateur === currentUserId;
    const { pageX, pageY } = event.nativeEvent || event;

    setContextMenu({
      visible: true,
      message: message,
      position: { x: pageX || 0, y: pageY || 0 },
      isOwnMessage,
    });

    setSelectedMessageForReaction(message);
  }, [currentUserId]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      message: null,
      position: { x: 0, y: 0 },
      isOwnMessage: false,
    });
  }, []);

  const handleReplyMessage = useCallback(() => {
    if (!contextMenu.message) return;

    setReplyingTo(contextMenu.message);
    handleCloseContextMenu();
  }, [contextMenu.message, handleCloseContextMenu]);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleEditMessage = useCallback(() => {
    if (!contextMenu.message || !contextMenu.isOwnMessage) return;

    setEditingMessage(contextMenu.message);
    setEditMessageContent(contextMenu.message.contenu);
    handleCloseContextMenu();
  }, [contextMenu.message, contextMenu.isOwnMessage, handleCloseContextMenu]);

  const handleSaveEdit = useCallback(() => {
    if (!editingMessage || !editMessageContent.trim() || !socket) return;

    socket.emit("editChannelMessage", {
      messageId: editingMessage.id_message,
      contenu: editMessageContent.trim(),
      canalId: channelId,
      workspaceId: workspaceId
    });

    setMessages(prev =>
      prev.map(msg =>
        msg.id_message === editingMessage.id_message
          ? { ...msg, contenu: editMessageContent.trim() }
          : msg
      )
    );

    setEditingMessage(null);
    setEditMessageContent("");
  }, [editingMessage, editMessageContent, socket, channelId, workspaceId, setMessages]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditMessageContent("");
  }, []);

  const handleDeleteMessage = useCallback(() => {
    if (!contextMenu.message || !contextMenu.isOwnMessage || !socket) return;

    Alert.alert(
      "Supprimer le message",
      "Êtes-vous sûr de vouloir supprimer ce message ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            socket.emit("deleteMessage", {
              messageId: contextMenu.message.id_message,
            });

            setMessages(prev =>
              prev.filter(msg => msg.id_message !== contextMenu.message.id_message)
            );

            handleCloseContextMenu();
          },
        },
      ]
    );
  }, [contextMenu.message, contextMenu.isOwnMessage, socket, handleCloseContextMenu, setMessages]);

  const handleAddReaction = useCallback(() => {
    setSelectedMessageForReaction(contextMenu.message);
    setShowEmojiPicker(true);
    handleCloseContextMenu();
  }, [contextMenu.message, handleCloseContextMenu]);

  const handleEmojiSelect = useCallback((emoji) => {
    if (!selectedMessageForReaction || !socket) {
      return;
    }

    socket.emit("addReaction", {
      messageId: selectedMessageForReaction.id_message,
      reaction_type: emoji,
      canalId: channelId
    });

    const messageId = selectedMessageForReaction.id_message;
    const existingReactions = selectedMessageForReaction.reactions || [];
    const hasReaction = existingReactions.find(r => r.reaction_type === emoji);

    if (!hasReaction) {
      const updatedReactions = [
        ...existingReactions,
        {
          reaction_type: emoji,
          count: 1,
          user_reacted: true,
        }
      ];

      setMessages(prev =>
        prev.map(msg =>
          msg.id_message === messageId
            ? { ...msg, reactions: updatedReactions }
            : msg
        )
      );
    }

    setShowEmojiPicker(false);
    setSelectedMessageForReaction(null);
  }, [selectedMessageForReaction, socket, channelId, setMessages]);

  const handleRemoveReaction = useCallback((message, emoji) => {
    if (!socket) return;

    socket.emit("removeReaction", {
      messageId: message.id_message,
      reaction_type: emoji,
      canalId: channelId
    });

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id_message === message.id_message) {
          const updatedReactions = (msg.reactions || []).filter(r => r.reaction_type !== emoji);
          return { ...msg, reactions: updatedReactions };
        }
        return msg;
      })
    );
  }, [socket, channelId, setMessages]);

  return {
    newMessage,
    isTyping,
    typingUsers,
    setTypingUsers,
    replyingTo,
    editingMessage,
    editMessageContent,
    setEditMessageContent,
    contextMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    selectedMessageForReaction,
    sendMessage,
    handleInputChange,
    handleLongPressMessage,
    handleCloseContextMenu,
    handleReplyMessage,
    handleCancelReply,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    handleAddReaction,
    handleEmojiSelect,
    handleRemoveReaction,
  };
};
