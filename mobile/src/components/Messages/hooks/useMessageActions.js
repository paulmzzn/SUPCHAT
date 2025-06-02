import { useState, useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.98:3000';

export const useMessageActions = ({
  socket,
  currentUserId,
  userId,
  setMessages,
  addAnimatingMessage,
  scrollToBottom,
  saveConversationTimestamp,
}) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState(null);

  const handleReply = useCallback((message) => {
    if (!message) return;
    setReplyingTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleSendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || !userId || !currentUserId) return;

    try {
      const tempId = Date.now().toString();

      const replyData = replyingTo
        ? {
            reply_to: replyingTo.id_message_prive,
            reply_content: replyingTo.contenu,
            reply_user_id: replyingTo.fk_expediteur,
          }
        : null;

      const optimisticMessage = {
        id_message_prive: `temp-${tempId}`,
        contenu: messageText,
        fk_expediteur: currentUserId,
        fk_destinataire: userId,
        date_envoi: new Date().toISOString(),
        isOptimistic: true,
        reply_data: replyData,
      };

      if (replyingTo) {
        setReplyingTo(null);
      }

      addAnimatingMessage(`temp-${tempId}`);
      setMessages((prev) => [...prev, optimisticMessage]);

      setTimeout(() => {
        scrollToBottom(true);
      }, 50);

      if (socket) {
        socket.emit("privateMessage", {
          destinataireId: userId,
          contenu: messageText,
          tempId,
          replyTo: replyData ? replyData.reply_to : undefined,
        });
      } else {
        await sendMessageViaAPI(messageText, replyData);
      }

      await saveConversationTimestamp(userId);
    } catch (e) {
      console.error("Error sending message:", e);
    }
  }, [userId, currentUserId, replyingTo, socket, addAnimatingMessage, setMessages, scrollToBottom, saveConversationTimestamp]);

  const sendMessageViaAPI = async (messageContent, replyData) => {
    if (!messageContent || !userId) return;

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/private-messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinataireId: userId,
          contenu: messageContent,
          replyTo: replyData ? replyData.reply_to : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      console.log("Message sent via API:", data);

      setMessages((prev) =>
        prev.map((m) =>
          m.isOptimistic && m.contenu === messageContent ? data : m
        )
      );
    } catch (e) {
      console.error("Error sending message via API:", e);
    }
  };

  const handleEditMessage = useCallback((message) => {
    if (!message || message.fk_expediteur !== currentUserId) return;
    setEditingMessage(message);
    setEditMessageContent(message.contenu);
  }, [currentUserId]);

  const handleSaveEdit = useCallback(() => {
    if (!editingMessage || !socket) return;

    socket.emit("editPrivateMessage", {
      id: editingMessage.id_message_prive,
      contenu: editMessageContent,
    });

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id_message_prive === editingMessage.id_message_prive
          ? { ...msg, contenu: editMessageContent }
          : msg
      )
    );

    setEditingMessage(null);
    setEditMessageContent("");
  }, [editingMessage, editMessageContent, socket, setMessages]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditMessageContent("");
  }, []);

  const handleDeleteMessage = useCallback((message) => {
    if (!message || message.fk_expediteur !== currentUserId || !socket) return;

    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            socket.emit("deletePrivateMessage", {
              id: message.id_message_prive,
            });

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id_message_prive === message.id_message_prive
                  ? { ...msg, is_deleted: true, contenu: "[Message deleted]" }
                  : msg
              )
            );
          },
        },
      ]
    );
  }, [currentUserId, socket, setMessages]);

  const handleAddReaction = useCallback((message, emoji) => {
    if (!message || !socket) return;

    socket.emit("addPrivateMessageReaction", {
      id: message.id_message_prive,
      reaction: emoji,
    });

    const messageId = message.id_message_prive;
    const existingReactions = message.reactions || [];
    const hasReaction = existingReactions.find((r) => r.reaction_type === emoji);

    if (!hasReaction) {
      const updatedReactions = [
        ...existingReactions,
        {
          reaction_type: emoji,
          count: 1,
          user_reacted: true,
        },
      ];

      setMessages((prev) =>
        prev.map((m) =>
          m.id_message_prive === messageId
            ? { ...m, reactions: updatedReactions }
            : m
        )
      );
    }
  }, [socket, setMessages]);

  const handleRemoveReaction = useCallback((messageId, reactionType) => {
    if (!socket) return;

    socket.emit("removePrivateMessageReaction", {
      id: messageId,
      reaction: reactionType,
    });

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id_message_prive === messageId) {
          const updatedReactions =
            msg.reactions?.filter(
              (r) => r.reaction_type !== reactionType || !r.user_reacted
            ) || [];
          return { ...msg, reactions: updatedReactions };
        }
        return msg;
      })
    );
  }, [socket, setMessages]);

  return {
    replyingTo,
    editingMessage,
    editMessageContent,
    setEditMessageContent,
    selectedMessageForReaction,
    setSelectedMessageForReaction,
    handleReply,
    handleCancelReply,
    handleSendMessage,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    handleAddReaction,
    handleRemoveReaction,
  };
};
