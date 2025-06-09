import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSocket } from "../../../context/SocketContext";
import env from "../../../config/env";

const API_URL = env.API_URL;

export const useMessagesData = (userId) => {
  const [messages, setMessages] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [animatingMessages, setAnimatingMessages] = useState({});

  const messagesPerPage = 20;
  const isLoadingMore = useRef(false);
  const scrollPositionRef = useRef(null);
  const lastFetchedUserId = useRef(null);
  const messageAnimationTimers = useRef({});

  const { socket, currentUserId, markMessagesAsRead: markMessagesAsReadContext } = useSocket();

  const markMessagesAsRead = useCallback(
    (msgs) => {
      if (!socket || !msgs?.length || !userId || !currentUserId) return;

      const unreadMessages = msgs.filter(
        (m) =>
          m.fk_expediteur === userId &&
          m.fk_expediteur !== currentUserId &&
          !m.date_lecture
      );

      if (unreadMessages.length > 0) {
        console.log(`Marking ${unreadMessages.length} messages as read for user ${userId}`);
        unreadMessages.forEach((msg) => {
          socket.emit("readPrivateMessage", {
            id: msg.id_message_prive,
            senderId: msg.fk_expediteur,
            recipientId: currentUserId,
          });
        });

        if (markMessagesAsReadContext) {
          markMessagesAsReadContext(userId);
        }
      }
    },
    [socket, userId, currentUserId, markMessagesAsReadContext]
  );

  const fetchUserInfo = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      const userInfo = {
        id: userId,
        name: data.nom || data.name || "User",
        avatar: data.photo_de_profil || data.avatar || null,
        ...data,
      };

      setUserInfo(userInfo);
      return userInfo;
    } catch (e) {
      console.error(`Error fetching user info for ${userId}:`, e);
      setUserInfo({ id: userId, name: "User", avatar: null });
      return null;
    }
  };

  const fetchMessagesBatch = async (userId, page = 1, limit = messagesPerPage) => {
    try {
      const offset = (page - 1) * limit;
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/private-messages/${userId}?limit=${limit}&offset=${offset}&sort=desc`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      const processedMessages = await Promise.all(
        data.map(async (msg) => {
          return msg;
        })
      );

      return {
        messages: processedMessages,
        hasMore: data.length === limit,
      };
    } catch (error) {
      console.error("Error fetching message batch:", error);
      throw error;
    }
  };

  const fetchMessages = async (userId, initialPage = 1) => {
    try {
      setLoading(true);
      const result = await fetchMessagesBatch(userId, initialPage);
      setMessages(result.messages);
      setPage(initialPage);
      setHasMoreMessages(result.hasMore);
      setIsInitialLoad(false);
    } catch (e) {
      console.error("Error fetching messages:", e);
      setError("Failed to load messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMoreMessages || !hasMoreMessages) return;

    setLoadingMoreMessages(true);

    try {
      const nextPage = page + 1;
      const result = await fetchMessagesBatch(userId, nextPage);

      if (result.messages.length > 0) {
        setPage(nextPage);
        setMessages((prevMessages) => [...result.messages, ...prevMessages]);
        setHasMoreMessages(result.hasMore);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMoreMessages(false);
      isLoadingMore.current = false;
    }
  };

  const addAnimatingMessage = (messageId) => {
    setAnimatingMessages((prev) => ({
      ...prev,
      [messageId]: true,
    }));

    if (messageAnimationTimers.current[messageId]) {
      clearTimeout(messageAnimationTimers.current[messageId]);
    }

    messageAnimationTimers.current[messageId] = setTimeout(() => {
      setAnimatingMessages((prev) => {
        const updated = { ...prev };
        delete updated[messageId];
        return updated;
      });
    }, 500);
  };

  return {
    messages,
    setMessages,
    userInfo,
    setUserInfo,
    loading,
    setLoading,
    error,
    setError,
    page,
    setPage,
    hasMoreMessages,
    setHasMoreMessages,
    loadingMoreMessages,
    setLoadingMoreMessages,
    isInitialLoad,
    setIsInitialLoad,
    animatingMessages,
    setAnimatingMessages,
    messagesPerPage,
    isLoadingMore,
    scrollPositionRef,
    lastFetchedUserId,
    markMessagesAsRead,
    fetchUserInfo,
    fetchMessages,
    loadMoreMessages,
    addAnimatingMessage,
    socket,
    currentUserId,
  };
};
