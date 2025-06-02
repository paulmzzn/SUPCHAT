import { useState, useCallback, useRef } from "react";
import { API_URL } from "../../config/config";

const MESSAGE_LIMIT = 20;

export const useWorkspaceMessages = (activeChannel, socket) => {
  const [messages, setMessages] = useState([]);
  const [messageOffset, setMessageOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [isPrependingMessages, setIsPrependingMessages] = useState(false);
  const [lastChannelId, setLastChannelId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fonction pour charger les messages d'un canal
  const fetchMessages = useCallback(async (canalId, offset = 0, append = false) => {
    if (!canalId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token manquant");

      if (!append) setLoadingMessages(true);
      else setLoadingMoreMessages(true);

      const response = await fetch(
        `${API_URL}/api/messages/canal/${canalId}?limit=${MESSAGE_LIMIT}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors du chargement des messages");
      }

      const data = await response.json();
      
      // Mapping des emojis sur les réactions
      const messagesWithEmojis = data.messages.map((msg) => ({
        ...msg,
        reactions: msg.reactions
          ? msg.reactions.map((reaction) => ({
              ...reaction,
              emoji: getEmojiForType(reaction.reaction_type),
            }))
          : [],
      }));

      if (append) {
        setMessages((prev) => [...messagesWithEmojis, ...prev]);
        setIsPrependingMessages(false);
      } else {
        setMessages(messagesWithEmojis);
      }

      setHasMoreMessages(data.messages.length === MESSAGE_LIMIT);
      setMessageOffset(append ? offset + MESSAGE_LIMIT : MESSAGE_LIMIT);

    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
      setHasMoreMessages(false);
    } finally {
      setLoadingMessages(false);
      setLoadingMoreMessages(false);
    }
  }, []);

  // Charger plus de messages (scroll infini)
  const loadMoreMessages = useCallback(() => {
    if (!activeChannel || loadingMoreMessages || !hasMoreMessages) return;
    
    setIsPrependingMessages(true);
    fetchMessages(activeChannel.id, messageOffset, true);
  }, [activeChannel, loadingMoreMessages, hasMoreMessages, messageOffset, fetchMessages]);

  // Helper pour formater les emojis de réaction
  const getEmojiForType = (reactionType) => {
    const emojiMap = {
      thumbsUp: "👍",
      heart: "❤️",
      laugh: "😂",
      surprise: "😮",
      sad: "😢",
      angry: "😠",
    };
    if (Object.values(emojiMap).includes(reactionType)) return reactionType;
    return emojiMap[reactionType] || reactionType;
  };

  // Réinitialiser les messages quand on change de canal
  const resetMessages = useCallback(() => {
    setMessages([]);
    setMessageOffset(0);
    setHasMoreMessages(true);
    setLoadingMoreMessages(false);
    setIsPrependingMessages(false);
  }, []);

  // Ajouter un nouveau message
  const addMessage = useCallback((newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  // Supprimer un message
  const removeMessage = useCallback((messageId) => {
    setMessages((prev) => prev.filter(msg => msg.id_message !== messageId));
  }, []);

  // Mettre à jour un message
  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) => 
      prev.map(msg => 
        msg.id_message === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  return {
    messages,
    setMessages,
    loadingMessages,
    messageOffset,
    hasMoreMessages,
    loadingMoreMessages,
    isPrependingMessages,
    setIsPrependingMessages,
    lastChannelId,
    setLastChannelId,
    fetchMessages,
    loadMoreMessages,
    resetMessages,
    addMessage,
    removeMessage,
    updateMessage,
  };
};
