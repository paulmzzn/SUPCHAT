import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStyles } from "./ConversationsListScreen.styles";
import { useTheme } from "../../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { useSocket } from "../../context/SocketContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://REDACTED:3000";

const ConversationsListScreen = ({ navigation }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const {
    unreadMessages,
    refreshUnreadCounts,
    subscribeToNotifications,
    updateConversationTimestamp,
    markMessagesAsRead,
  } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState({});
  const [conversationTimestamps, setConversationTimestamps] = useState({});
  const [lastMessages, setLastMessages] = useState({});

  const isInitialMount = useRef(true);
  const lastFetchTime = useRef(0);
  const pendingConversationUpdate = useRef(false);
  const pendingConversationUpdates = useRef({});
  const isProcessingNotification = useRef(false);
  const updateTimeoutRef = useRef(null);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    userId: null,
    position: { x: 0, y: 0 },
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const windowDimensions = Dimensions.get("window");

  const markAsRead = useCallback(
    (userId) => {
      if (markMessagesAsRead) {
        markMessagesAsRead(userId);
      } else {
        console.log(
          "markMessagesAsRead not available in context, using fallback"
        );
        if (unreadMessages && unreadMessages[userId]) {
          setUnreadMessages &&
            setUnreadMessages((prev) => {
              const newState = { ...prev };
              delete newState[userId];
              return newState;
            });
        }
      }
    },
    [markMessagesAsRead, unreadMessages]
  );

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      if (notification.type === "newPrivateMessage") {
        console.log(
          "New message notification received from:",
          notification.senderId
        );

        isProcessingNotification.current = true;

        const senderId = notification.senderId;
        const messageContent = notification.message?.contenu || "";

        if (messageContent) {
          setLastMessages((prev) => ({
            ...prev,
            [senderId]: {
              contenu: messageContent,
              date_envoi: new Date().toISOString(),
              isNew: true,
            },
          }));
        }

        setConversations((prev) => {
          const filteredConvs = prev.filter((id) => id !== senderId);
          return [senderId, ...filteredConvs];
        });

        if (!usersInfo[senderId]) {
          fetchUserInfo(senderId).catch(console.error);
        }

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
          isProcessingNotification.current = false;
        }, 2000);
      } else if (notification.type === "timestampUpdated") {
        const { userId } = notification;

        setConversations((prev) => {
          const filteredConvs = prev.filter((id) => id !== userId);
          return [userId, ...filteredConvs];
        });
      }
    });

    return () => {
      unsubscribe();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [usersInfo]);

  useEffect(() => {
    const sortConversationsByTimestamp = async () => {
      try {
        const timestampsString = await AsyncStorage.getItem(
          "conversationTimestamps"
        );
        if (!timestampsString) return;

        const timestamps = JSON.parse(timestampsString);

        setConversations((prev) => {
          return [...prev].sort((a, b) => {
            return (timestamps[b] || 0) - (timestamps[a] || 0);
          });
        });
      } catch (e) {
        console.error("Error sorting conversations by timestamp:", e);
      }
    };

    if (conversations.length > 0) {
      sortConversationsByTimestamp();
    }
  }, [conversationTimestamps]);

  useEffect(() => {
    if (isInitialMount.current) {
      console.log("Initial fetch of conversations");
      fetchConversations();
      isInitialMount.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();

      if (isProcessingNotification.current) {
        console.log("Skipping refresh - notification processing in progress");
        return;
      }

      if (
        now - lastFetchTime.current > 5000 ||
        pendingConversationUpdate.current
      ) {
        console.log("Refreshing conversations on screen focus");
        fetchConversations();
        refreshUnreadCounts();
        pendingConversationUpdate.current = false;
      } else {
        console.log("Skipping refresh - too soon since last fetch");
      }

      return () => {};
    }, [refreshUnreadCounts])
  );

  useEffect(() => {
    const loadTimestamps = async () => {
      try {
        const timestampsString = await AsyncStorage.getItem(
          "conversationTimestamps"
        );
        if (timestampsString) {
          const timestamps = JSON.parse(timestampsString);
          setConversationTimestamps(timestamps);
        }
      } catch (e) {
        console.error("Error loading conversation timestamps:", e);
      }
    };

    loadTimestamps();
  }, []);

  const fetchConversations = async (skipLoadingState = false) => {
    try {
      const now = Date.now();
      lastFetchTime.current = now;

      if (!skipLoadingState && !loading) {
        setLoading(true);
      }

      // Récupérer les timestamps depuis le stockage local une seule fois
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

      // Récupérer le token une seule fois
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Utiliser une requête API optimisée qui retourne les conversations avec les derniers messages et infos utilisateur
      const res = await fetch(
        `${API_URL}/api/private-messages/conversations-extended`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        // Si l'API optimisée n'existe pas, retomber sur la méthode originale
        return await fetchConversationsLegacy(
          token,
          timestamps,
          skipLoadingState
        );
      }

      // Récupérer les données étendues qui incluent les IDs des utilisateurs, leurs infos et derniers messages
      const extendedData = await res.json();
      console.log("Extended conversations data received:", extendedData.length);

      // Mettre à jour les timestamps pour chaque conversation
      extendedData.forEach((convo) => {
        if (!timestamps[convo.userId]) {
          timestamps[convo.userId] = convo.lastActivity || 0;
        }
      });

      // Trier les conversations par timestamp
      const sortedData = [...extendedData].sort((a, b) => {
        return (timestamps[b.userId] || 0) - (timestamps[a.userId] || 0);
      });

      // Extraire les IDs des utilisateurs pour maintenir la compatibilité
      const userIds = sortedData.map((convo) => convo.userId);

      // Mettre à jour l'état avec toutes les données en une seule fois
      setConversations(userIds);

      // Mettre à jour les infos utilisateur et derniers messages en une seule opération
      const newUsersInfo = {};
      const newLastMessages = {};

      sortedData.forEach((convo) => {
        // Mettre à jour les infos utilisateur
        if (convo.userInfo) {
          newUsersInfo[convo.userId] = {
            id: convo.userId,
            name: convo.userInfo.nom || convo.userInfo.name || "User",
            avatar:
              convo.userInfo.photo_de_profil || convo.userInfo.avatar || null,
            ...convo.userInfo,
          };
        }

        // Mettre à jour les derniers messages
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

      // Mettre à jour les états avec les nouvelles données
      if (Object.keys(newUsersInfo).length > 0) {
        setUsersInfo((prev) => ({ ...prev, ...newUsersInfo }));
      }

      if (Object.keys(newLastMessages).length > 0) {
        setLastMessages((prev) => ({ ...prev, ...newLastMessages }));
      }

      // Sauvegarder les timestamps mis à jour
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

  // Méthode legacy pour la compatibilité, à utiliser si l'API optimisée n'est pas disponible
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

      // Mettre à jour les timestamps manquants
      data.forEach((userId) => {
        if (!timestamps[userId]) {
          timestamps[userId] = 0;
        }
      });

      const sortedData = [...data].sort((a, b) => {
        return (timestamps[b] || 0) - (timestamps[a] || 0);
      });

      // Mettre à jour les conversations
      if (conversations.length > 0 && !skipLoadingState) {
        const existingIds = new Set(conversations);
        const newIds = data.filter((id) => !existingIds.has(id));

        if (newIds.length > 0) {
          setConversations((prev) => [...prev, ...newIds]);
        }
      } else {
        setConversations(sortedData);
      }

      setConversationTimestamps(timestamps);
      await AsyncStorage.setItem(
        "conversationTimestamps",
        JSON.stringify(timestamps)
      );

      // Charger les derniers messages et infos utilisateur en parallèle pour les 10 premières conversations
      const conversationsToProcess = sortedData.slice(0, 10);

      const [lastMessagesResult, usersInfoResult] = await Promise.all([
        // Récupérer les derniers messages en parallèle
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

        // Récupérer les infos utilisateur en parallèle
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

      // Traiter les résultats des derniers messages
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
        setLastMessages((prev) => ({
          ...prev,
          ...newLastMessages,
        }));
      }

      // Traiter les résultats des infos utilisateur
      const newUsersInfo = {};
      usersInfoResult.forEach((item) => {
        if (item.userInfo) {
          newUsersInfo[item.userId] = item.userInfo;
        }
      });

      if (Object.keys(newUsersInfo).length > 0) {
        setUsersInfo((prev) => ({
          ...prev,
          ...newUsersInfo,
        }));
      }

      // Charger les infos des autres utilisateurs en arrière-plan
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

  // Version optimisée qui évite les setState répétés
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

      console.log(`Fetching last message for conversation with ${userId}`);

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
        console.log(`Got last message for ${userId}:`, latestMessage.contenu);

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

  const fetchLastMessagesAlternative = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const url = `${API_URL}/api/private-messages/${userId}?limit=10`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return null;

      const messages = await response.json();

      if (messages && messages.length > 0) {
        const sortedMessages = [...messages].sort((a, b) => {
          const dateA = new Date(a.date_envoi || a.date_creation);
          const dateB = new Date(b.date_envoi || b.date_creation);
          return dateB - dateA;
        });

        const latestMessage = sortedMessages[0];
        console.log(
          `Alternative method found last message for ${userId}:`,
          latestMessage.contenu
        );

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
      console.error(`Error in alternative fetch for ${userId}:`, err);
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

  const handleSelectConversation = async (userId) => {
    try {
      const newTimestamp = Date.now();

      const newTimestamps = {
        ...conversationTimestamps,
        [userId]: newTimestamp,
      };

      setConversationTimestamps(newTimestamps);

      await AsyncStorage.setItem(
        "conversationTimestamps",
        JSON.stringify(newTimestamps)
      );

      setConversations((prev) => {
        const filteredList = prev.filter((id) => id !== userId);
        return [userId, ...filteredList];
      });

      if (!lastMessages[userId]) {
        await fetchLastMessageForConversation(userId);
      }
    } catch (e) {
      console.error("Error updating conversation timestamp:", e);
    }

    pendingConversationUpdate.current = true;
    navigation.navigate("Conversation", { userId });

    if (updateConversationTimestamp) {
      updateConversationTimestamp(userId);
    }
  };

  const handleLongPressConversation = (userId, event) => {
    const { pageX, pageY } = event.nativeEvent;

    let xPos = Math.min(pageX, windowDimensions.width - 220);
    let yPos = Math.min(pageY, windowDimensions.height - 180);

    setContextMenu({
      visible: true,
      userId,
      position: { x: xPos, y: yPos },
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeContextMenu = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setContextMenu({
        visible: false,
        userId: null,
        position: { x: 0, y: 0 },
      });
    });
  };

  const handleDeleteConversation = async (userId) => {
    closeContextMenu();

    setTimeout(() => {
      Alert.alert(
        "Supprimer la conversation",
        "Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.",
        [
          {
            text: "Annuler",
            style: "cancel",
          },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
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
                Alert.alert(
                  "Erreur",
                  `Impossible de supprimer la conversation: ${e.message}. Veuillez réessayer.`
                );
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    }, 150);
  };

  const renderAvatar = (user) => {
    if (!user) return <View style={styles.avatar} />;

    if (user.avatar) {
      return (
        <Image
          source={{ uri: user.avatar }}
          style={styles.avatar}
          onError={(e) => {
            console.log("Avatar image failed to load, using placeholder");
          }}
        />
      );
    } else {
      return (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user.name ? user.name[0].toUpperCase() : "U"}
          </Text>
        </View>
      );
    }
  };

  const formatLastMessage = (userId) => {
    if (!lastMessages[userId]) return "Aucun message récent";

    const message = lastMessages[userId].contenu || "";

    if (!message.trim()) {
      return "Message vide";
    }

    if (message.length > 30) {
      return message.substring(0, 27) + "...";
    }

    return message;
  };

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((userId) => {
        const user = usersInfo[userId] || {};
        return user.name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity
            style={styles.newConversationHeaderButton}
            onPress={() => navigation.navigate("NewConversation")}
          >
            <Ionicons name="add" size={24} color={themeColors.textOnAccent} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={themeColors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={themeColors.textPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={fetchConversations}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accentPrimary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="chatbubble-ellipses"
            size={80}
            color={themeColors.accentPrimary}
            style={styles.icon}
          />
          <Text style={styles.title}>No conversations yet</Text>
          <Text style={styles.description}>
            Start chatting with friends and colleagues
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.toString()}
          removeClippedSubviews={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          renderItem={({ item: userId }) => {
            const user = usersInfo[userId] || {};
            const unreadCount = unreadMessages[userId] || 0;
            const isPending = pendingConversationUpdates.current[userId];

            if (isPending) {
              setTimeout(() => {
                pendingConversationUpdates.current[userId] = false;
              }, 300);
            }

            return (
              <TouchableOpacity
                style={[
                  styles.conversationItem,
                  isPending && styles.newConversation,
                ]}
                onPress={() => handleSelectConversation(userId)}
                onLongPress={(event) =>
                  handleLongPressConversation(userId, event)
                }
                delayLongPress={500}
                data-user-id={userId}
              >
                {renderAvatar(user)}
                <View style={styles.conversationInfo}>
                  <Text style={styles.userName}>
                    {user?.name || "Loading..."}
                  </Text>
                  <Text
                    style={[
                      styles.lastMessage,
                      unreadCount > 0 && styles.unreadLastMessage,
                      lastMessages[userId]?.isNew && styles.newLastMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {formatLastMessage(userId)}
                  </Text>
                </View>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {contextMenu.visible && (
        <TouchableOpacity
          style={styles.contextMenuOverlay}
          activeOpacity={1}
          onPress={closeContextMenu}
        >
          <Animated.View
            style={[
              styles.modernContextMenu,
              {
                top: contextMenu.position.y,
                left: contextMenu.position.x,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => {
                closeContextMenu();
                handleSelectConversation(contextMenu.userId);
              }}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={themeColors.textPrimary}
              />
              <Text style={styles.contextMenuItemText}>Ouvrir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contextMenuItem, styles.deleteMenuItem]}
              onPress={() => handleDeleteConversation(contextMenu.userId)}
            >
              <Ionicons name="trash-outline" size={20} color="red" />
              <Text style={[styles.contextMenuItemText, { color: "red" }]}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ConversationsListScreen;
