import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { getStyles } from "../../screens/Messages/ConversationsListScreen.styles";
import ConversationItem from "./ConversationItem";
import ConversationContextMenu from "./ConversationContextMenu";
import { useConversationsData } from "./hooks/useConversationsData";
import { useConversationsAPI } from "./hooks/useConversationsAPI";
import { useConversationTimestamps } from "./hooks/useConversationTimestamps";

const ConversationsList = ({ navigation, searchQuery }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const conversationsData = useConversationsData();
  const { fetchConversations, deleteConversation } = useConversationsAPI(conversationsData);
  const { 
    conversationTimestamps, 
    setConversationTimestamps,
    loadTimestamps,
    saveTimestamp,
    removeTimestamp 
  } = useConversationTimestamps();

  const {
    conversations,
    setConversations,
    usersInfo,
    loading,
    error,
    lastMessages,
    setLastMessages,
    unreadMessages,
    refreshUnreadCounts,
    subscribeToNotifications,
    isInitialMount,
    lastFetchTime,
    pendingConversationUpdate,
    pendingConversationUpdates,
    isProcessingNotification,
    updateTimeoutRef,
    fetchUserInfo,
    fetchLastMessageForConversation,
    updateConversationTimestamp,
  } = conversationsData;

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    userId: null,
    position: { x: 0, y: 0 },
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const windowDimensions = Dimensions.get("window");

  // Notification subscription effect
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

  // Initial fetch effect
  useEffect(() => {
    if (isInitialMount.current) {
      console.log("Initial fetch of conversations");
      fetchConversations();
      isInitialMount.current = false;
    }
  }, []);

  // Focus effect for refreshing
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

  // Load timestamps effect
  useEffect(() => {
    loadTimestamps();
  }, [loadTimestamps]);

  // Sort conversations effect
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

  const handleSelectConversation = async (userId) => {
    try {
      const newTimestamps = await saveTimestamp(userId);
      setConversationTimestamps(newTimestamps);

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
                await deleteConversation(userId);
                await removeTimestamp(userId);
              } catch (e) {
                Alert.alert(
                  "Erreur",
                  `Impossible de supprimer la conversation: ${e.message}. Veuillez réessayer.`
                );
              }
            },
          },
        ]
      );
    }, 150);
  };

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((userId) => {
        const user = usersInfo[userId] || {};
        return user.name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchConversations}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (filteredConversations.length === 0) {
    return (
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
    );
  }

  return (
    <>
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
            <ConversationItem
              userId={userId}
              user={user}
              unreadCount={unreadCount}
              isPending={isPending}
              lastMessage={lastMessages[userId]}
              onPress={handleSelectConversation}
              onLongPress={handleLongPressConversation}
            />
          );
        }}
      />

      <ConversationContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        userId={contextMenu.userId}
        fadeAnim={fadeAnim}
        scaleAnim={scaleAnim}
        onClose={closeContextMenu}
        onOpenConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
    </>
  );
};

export default ConversationsList;
