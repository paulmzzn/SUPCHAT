import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useSocket } from "../../../context/SocketContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.98:3000";

export const useConversationsData = () => {
  const {
    unreadMessages,
    refreshUnreadCounts,
    subscribeToNotifications,
    updateConversationTimestamp,
  } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversationTimestamps, setConversationTimestamps] = useState({});
  const [lastMessages, setLastMessages] = useState({});

  const isInitialMount = useRef(true);
  const lastFetchTime = useRef(0);
  const pendingConversationUpdate = useRef(false);
  const pendingConversationUpdates = useRef({});
  const isProcessingNotification = useRef(false);
  const updateTimeoutRef = useRef(null);

  const fetchUserInfoOnce = async (userId, token) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();
      return {
        id: userId,
        name: data.nom || data.name || "User",
        avatar: data.photo_de_profil || data.avatar || null,
        ...data,
      };
    } catch (e) {
      console.error(`Error fetching user info for ${userId}:`, e);
      return {
        id: userId,
        name: "User",
        avatar: null,
      };
    }
  };

  const fetchLastMessageForConversation = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const url = `${API_URL}/api/private-messages/${userId}?limit=5&sort=desc`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.warn(
          `Could not fetch last message for ${userId}: ${response.status}`
        );
        return null;
      }

      const messages = await response.json();

      if (messages && messages.length > 0) {
        const sortedMessages = [...messages].sort((a, b) => {
          const dateA = new Date(a.date_envoi || a.date_creation);
          const dateB = new Date(b.date_envoi || b.date_creation);
          return dateB - dateA;
        });

        const latestMessage = sortedMessages[0];

        setLastMessages((prev) => ({
          ...prev,
          [userId]: {
            contenu: latestMessage.contenu,
            date_envoi: latestMessage.date_envoi || latestMessage.date_creation,
          },
        }));

        return latestMessage;
      }

      return null;
    } catch (err) {
      console.error(
        `Error fetching last message for conversation ${userId}:`,
        err
      );
      return null;
    }
  };

  const fetchUserInfo = async (userId) => {
    if (usersInfo[userId]) return;

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

      setUsersInfo((prev) => ({ ...prev, [userId]: userInfo }));
    } catch (e) {
      console.error(`Error fetching user info for ${userId}:`, e);
      setUsersInfo((prev) => ({
        ...prev,
        [userId]: { id: userId, name: "User", avatar: null },
      }));
    }
  };

  return {
    conversations,
    setConversations,
    usersInfo,
    setUsersInfo,
    loading,
    setLoading,
    error,
    setError,
    conversationTimestamps,
    setConversationTimestamps,
    lastMessages,
    setLastMessages,
    unreadMessages,
    refreshUnreadCounts,
    subscribeToNotifications,
    updateConversationTimestamp,
    isInitialMount,
    lastFetchTime,
    pendingConversationUpdate,
    pendingConversationUpdates,
    isProcessingNotification,
    updateTimeoutRef,
    fetchUserInfoOnce,
    fetchLastMessageForConversation,
    fetchUserInfo,
  };
};
