import AsyncStorage from "@react-native-async-storage/async-storage";
import env from "../../../config/env";

const API_URL = env.API_URL;

export const useConversationsAPI = (conversationsData) => {
  const {
    setConversations,
    setUsersInfo,
    setLastMessages,
    setConversationTimestamps,
    setLoading,
    setError,
    lastFetchTime,
    lastMessages,
    usersInfo,
    fetchUserInfoOnce,
    fetchLastMessageForConversation,
    fetchUserInfo,
  } = conversationsData;

  const fetchConversations = async (skipLoadingState = false) => {
    try {
      const now = Date.now();
      lastFetchTime.current = now;

      if (!skipLoadingState) {
        setLoading(true);
      }

      let timestamps = {};
      try {
        const timestampsString = await AsyncStorage.getItem(
          "conversationTimestamps"
        );
        if (timestampsString) {
          timestamps = JSON.parse(timestampsString);
        }
      } catch (e) {
        console.error("Error loading conversation timestamps:", e);
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const res = await fetch(
        `${API_URL}/api/private-messages/conversations-extended`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        return await fetchConversationsLegacy(
          token,
          timestamps,
          skipLoadingState
        );
      }

      const extendedData = await res.json();
      console.log("Extended conversations data received:", extendedData.length);

      extendedData.forEach((convo) => {
        if (!timestamps[convo.userId]) {
          timestamps[convo.userId] = convo.lastActivity || 0;
        }
      });

      const sortedData = [...extendedData].sort((a, b) => {
        return (timestamps[b.userId] || 0) - (timestamps[a.userId] || 0);
      });

      const userIds = sortedData.map((convo) => convo.userId);
      setConversations(userIds);

      const newUsersInfo = {};
      const newLastMessages = {};

      sortedData.forEach((convo) => {
        if (convo.userInfo) {
          newUsersInfo[convo.userId] = {
            id: convo.userId,
            name: convo.userInfo.nom || convo.userInfo.name || "User",
            avatar:
              convo.userInfo.photo_de_profil || convo.userInfo.avatar || null,
            ...convo.userInfo,
          };
        }

        if (convo.lastMessage) {
          newLastMessages[convo.userId] = {
            contenu: convo.lastMessage.contenu || "",
            date_envoi:
              convo.lastMessage.date_envoi ||
              convo.lastMessage.date_creation ||
              new Date().toISOString(),
          };
        }
      });

      if (Object.keys(newUsersInfo).length > 0) {
        setUsersInfo((prev) => ({ ...prev, ...newUsersInfo }));
      }

      if (Object.keys(newLastMessages).length > 0) {
        setLastMessages((prev) => ({ ...prev, ...newLastMessages }));
      }

      setConversationTimestamps(timestamps);
      await AsyncStorage.setItem(
        "conversationTimestamps",
        JSON.stringify(timestamps)
      );
    } catch (e) {
      console.error("Error fetching conversations:", e);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationsLegacy = async (
    token,
    timestamps,
    skipLoadingState
  ) => {
    try {
      const res = await fetch(`${API_URL}/api/private-messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();

      data.forEach((userId) => {
        if (!timestamps[userId]) {
          timestamps[userId] = 0;
        }
      });

      const sortedData = [...data].sort((a, b) => {
        return (timestamps[b] || 0) - (timestamps[a] || 0);
      });

      setConversations(sortedData);
      setConversationTimestamps(timestamps);
      await AsyncStorage.setItem(
        "conversationTimestamps",
        JSON.stringify(timestamps)
      );

      const conversationsToProcess = sortedData.slice(0, 10);

      const [lastMessagesResult, usersInfoResult] = await Promise.all([
        Promise.all(
          conversationsToProcess.map(async (userId) => {
            if (!lastMessages[userId]) {
              try {
                const lastMessage = await fetchLastMessageForConversation(
                  userId
                );
                return { userId, lastMessage };
              } catch (err) {
                return { userId, lastMessage: null };
              }
            }
            return { userId, lastMessage: null };
          })
        ),

        Promise.all(
          conversationsToProcess.map(async (userId) => {
            if (!usersInfo[userId]) {
              try {
                const userInfo = await fetchUserInfoOnce(userId, token);
                return { userId, userInfo };
              } catch (err) {
                return { userId, userInfo: null };
              }
            }
            return { userId, userInfo: null };
          })
        ),
      ]);

      // Process results
      const newLastMessages = {};
      lastMessagesResult.forEach((item) => {
        if (item.lastMessage) {
          newLastMessages[item.userId] = {
            contenu: item.lastMessage.contenu,
            date_envoi:
              item.lastMessage.date_envoi || item.lastMessage.date_creation,
          };
        }
      });

      if (Object.keys(newLastMessages).length > 0) {
        setLastMessages((prev) => ({ ...prev, ...newLastMessages }));
      }

      const newUsersInfo = {};
      usersInfoResult.forEach((item) => {
        if (item.userInfo) {
          newUsersInfo[item.userId] = item.userInfo;
        }
      });

      if (Object.keys(newUsersInfo).length > 0) {
        setUsersInfo((prev) => ({ ...prev, ...newUsersInfo }));
      }

      if (sortedData.length > 10) {
        setTimeout(() => {
          sortedData.slice(10).forEach((userId) => {
            if (!usersInfo[userId]) {
              fetchUserInfo(userId).catch(console.error);
            }
          });
        }, 1000);
      }
    } catch (e) {
      console.error("Error in legacy fetch conversations:", e);
      throw e;
    }
  };

  const deleteConversation = async (userId) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/private-messages/conversations/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Error deleting conversation: ${res.status} - ${errorText}`
        );
        throw new Error(`${res.status}: ${errorText}`);
      }

      setConversations((prev) => prev.filter((id) => id !== userId));

      const timestampsString = await AsyncStorage.getItem(
        "conversationTimestamps"
      );
      if (timestampsString) {
        const timestamps = JSON.parse(timestampsString);
        if (timestamps[userId]) {
          delete timestamps[userId];
          await AsyncStorage.setItem(
            "conversationTimestamps",
            JSON.stringify(timestamps)
          );
          setConversationTimestamps(timestamps);
        }
      }
    } catch (e) {
      console.error("Error deleting conversation:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchConversations,
    fetchConversationsLegacy,
    deleteConversation,
  };
};
