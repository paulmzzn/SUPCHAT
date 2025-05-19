import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GestureHandlerRootView,
  Swipeable,
  RectButton,
} from "react-native-gesture-handler";
import { getStyles } from "./MessagesScreen.styles";
import { useTheme } from "../../theme/ThemeContext";
import { useSocket } from "../../context/SocketContext";
// Import the environment configuration
import env from "../../config/env";
// Import the new MediaViewer component
import MediaViewer from "../../components/MediaViewer/MediaViewer";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.143:3000";
const S3_BASE_URL =
  env.S3_BASE_URL || "https://s3-supchat.s3.fr-par.scw.cloud/";

// Helper for formatting message dates
const formatMessageDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

// Helper for formatting file sizes
const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "Unknown size";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

// Helper for determining file icons
const getFileIcon = (fileType) => {
  switch (fileType) {
    case "application/pdf":
      return "document-text";
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "document";
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "calculator";
    case "application/vnd.ms-powerpoint":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "easel";
    case "application/zip":
    case "application/x-zip-compressed":
      return "archive";
    case "audio/mpeg":
    case "audio/mp3":
    case "audio/wav":
      return "musical-notes";
    case "video/mp4":
    case "video/quicktime":
      return "videocam";
    default:
      if (fileType?.startsWith("image/")) return "image";
      if (fileType?.startsWith("audio/")) return "musical-notes";
      if (fileType?.startsWith("video/")) return "videocam";
      return "document";
  }
};

// Helper for constructing file URLs - Updated to properly handle S3 paths
const getFileURL = (url) => {
  if (!url) return null;

  // Si l'URL est déjà complète, la retourner telle quelle
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // Si le chemin commence par 'private-messages/files/', construire une URL S3
  if (
    url.startsWith("private-messages/files/") ||
    url.startsWith("private-messages/")
  ) {
    console.log(`Using S3 base URL for file: ${url}`);
    return `${S3_BASE_URL}${url}`;
  }

  // Si l'URL est relative mais commence déjà avec /api/files, ajouter uniquement l'URL de base
  if (url.startsWith("/api/files/")) return `${API_URL}${url}`;

  // Pour toutes les autres URLs, considérer qu'elles sont relatives à /api/files/
  return `${API_URL}/api/files/${url}`;
};

const ImageComponent = ({ uri, style, resizeMode, fileName }) => {
  const [hasError, setHasError] = useState(false);

  return hasError ? (
    <View
      style={[
        style,
        {
          backgroundColor: "#f0f0f0",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#ddd",
          borderStyle: "dashed",
        },
      ]}
    >
      <Ionicons name="image-outline" size={32} color="#999" />
      <Text style={{ color: "#999", marginTop: 8, textAlign: "center" }}>
        Image non disponible
      </Text>
    </View>
  ) : (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
};

const MessagesScreen = ({ navigation, route }) => {
  const { colors: themeColors, mode } = useTheme();
  const styles = getStyles(themeColors);

  // Get userId from route params
  const { userId } = route.params || {};

  // Determine if dark mode is active
  const isDarkMode =
    mode === "dark" ||
    themeColors.primaryBackground.toString().toLowerCase() === "#121212" ||
    themeColors.primaryBackground.toString().toLowerCase() === "#000000" ||
    themeColors.textPrimary?.toString().toLowerCase() === "#ffffff";

  const [messages, setMessages] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState(null);
  const messagesScrollRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const lastFetchedUserId = useRef(null);
  const [conversationTimestamps, setConversationTimestamps] = useState({});
  const messageAnimationTimers = useRef({});
  const [animatingMessages, setAnimatingMessages] = useState({});

  // New state variables for pagination
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const messagesPerPage = 20;
  const isLoadingMore = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollPositionRef = useRef(null);

  // Refactor the attachment preview state to be simpler
  const [mediaPreview, setMediaPreview] = useState({
    visible: false,
    media: null,
  });

  // Context menu and message interaction states
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    message: null,
    position: { x: 0, y: 0 },
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedMessageForReaction, setSelectedMessageForReaction] =
    useState(null);
  const emojiPickerRef = useRef(null);

  // Reference for the text input (for focusing)
  const textInputRef = useRef(null);

  // Use socket context
  const {
    socket,
    currentUserId,
    markMessagesAsRead: markMessagesAsReadContext,
  } = useSocket();

  // Memoize internal message reading function to prevent recreating on every render
  const markMessagesAsRead = useCallback(
    (msgs) => {
      if (!socket || !msgs?.length || !userId || !currentUserId) return;

      // Ne marquer comme lus que les messages envoyés par l'autre utilisateur et qui ne sont pas déjà lus
      const unreadMessages = msgs.filter(
        (m) =>
          m.fk_expediteur === userId && // uniquement les messages de l'autre utilisateur
          m.fk_expediteur !== currentUserId && // pas les messages envoyés par soi-même
          !m.date_lecture // messages non lus
      );

      if (unreadMessages.length > 0) {
        console.log(
          `Marking ${unreadMessages.length} messages as read for user ${userId}`
        );
        unreadMessages.forEach((msg) => {
          socket.emit("readPrivateMessage", {
            id: msg.id_message_prive,
            senderId: msg.fk_expediteur,
            recipientId: currentUserId,
          });
        });

        // Also notify context that messages have been read
        if (markMessagesAsReadContext) {
          markMessagesAsReadContext(userId);
        }
      }
    },
    [socket, userId, currentUserId, markMessagesAsReadContext]
  );

  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    // Cleanup
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Function to save conversation timestamps safely
  const saveConversationTimestamp = async (userId) => {
    try {
      // Update timestamp with a random delay to avoid conflicts
      const timestamp = Date.now() + Math.floor(Math.random() * 10);
      console.log(`Updating timestamp for ${userId} to ${timestamp}`);

      // Get current timestamps
      const timestampsStr = await AsyncStorage.getItem(
        "conversationTimestamps"
      );
      let timestamps = {};

      if (timestampsStr) {
        try {
          timestamps = JSON.parse(timestampsStr);
        } catch (e) {
          console.error("Error parsing timestamps:", e);
        }
      }

      // Update with new timestamp
      const newTimestamps = {
        ...timestamps,
        [userId]: timestamp,
      };

      // Save back to AsyncStorage
      await AsyncStorage.setItem(
        "conversationTimestamps",
        JSON.stringify(newTimestamps)
      );
      console.log("Timestamps updated in storage:", newTimestamps);

      // Update local state
      setConversationTimestamps(newTimestamps);
    } catch (e) {
      console.error("Error saving conversation timestamp:", e);
    }
  };

  // Handle incoming messages with optimized animations
  useEffect(() => {
    if (!socket || !currentUserId || !userId) return;

    const handlePrivateMessage = async (msg) => {
      console.log("Received message:", msg);

      // Update messages if relevant to current conversation
      if (msg.fk_expediteur === userId || msg.fk_destinataire === userId) {
        const isNewMessage = !messages.some(
          (m) =>
            m.id_message_prive === msg.id_message_prive ||
            (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`) ||
            (m.isOptimistic &&
              m.contenu === msg.contenu &&
              m.fk_expediteur === msg.fk_expediteur)
        );

        if (isNewMessage) {
          // Mark this message as animating
          const messageId = msg.id_message_prive || `temp-${Date.now()}`;
          setAnimatingMessages((prev) => ({
            ...prev,
            [messageId]: true,
          }));

          // Remove animation state after a delay
          if (messageAnimationTimers.current[messageId]) {
            clearTimeout(messageAnimationTimers.current[messageId]);
          }

          messageAnimationTimers.current[messageId] = setTimeout(() => {
            setAnimatingMessages((prev) => {
              const updated = { ...prev };
              delete updated[messageId];
              return updated;
            });
          }, 500); // Animation duration
        }

        setMessages((prev) => {
          const messageExists = prev.some(
            (m) =>
              m.id_message_prive === msg.id_message_prive ||
              (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`) ||
              (m.isOptimistic &&
                m.contenu === msg.contenu &&
                m.fk_expediteur === msg.fk_expediteur)
          );

          if (messageExists) {
            return prev.map((m) => {
              if (m.id_message_prive === msg.id_message_prive) return msg;
              if (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`)
                return msg;
              if (
                m.isOptimistic &&
                m.contenu === msg.contenu &&
                m.fk_expediteur === msg.fk_expediteur
              )
                return msg;
              return m;
            });
          } else {
            return [...prev, msg];
          }
        });

        // Scroll to bottom with animation
        setTimeout(() => {
          scrollToBottom(true);
        }, 50);

        // Ne pas marquer automatiquement les messages comme lus lors de la réception
        // Les messages seront marqués comme lus uniquement par l'effet d'interaction utilisateur

        // Update timestamp for this conversation in AsyncStorage
        await saveConversationTimestamp(userId);
      }
    };

    const handlePrivateMessageUpdated = (msg) => {
      console.log("Message updated:", msg);
      if (msg.fk_expediteur === userId || msg.fk_destinataire === userId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === msg.id_message_prive ? msg : m
          )
        );
      }
    };

    const handlePrivateMessageDeleted = (data) => {
      console.log("Message deleted:", data);
      if (data?.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === data.id
              ? {
                  ...m,
                  is_deleted: true,
                  contenu: "[Message deleted]",
                  attachments: [],
                }
              : m
          )
        );
      }
    };

    const handlePrivateMessageReaction = (data) => {
      console.log("Message reaction received:", data);
      if (data?.messageId && data?.reactions) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === data.messageId
              ? { ...m, reactions: data.reactions }
              : m
          )
        );
      }
    };

    socket.on("privateMessage", handlePrivateMessage);
    socket.on("privateMessageUpdated", handlePrivateMessageUpdated);
    socket.on("privateMessageDeleted", handlePrivateMessageDeleted);
    socket.on("privateMessageReaction", handlePrivateMessageReaction);

    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("privateMessageUpdated", handlePrivateMessageUpdated);
      socket.off("privateMessageDeleted", handlePrivateMessageDeleted);
      socket.off("privateMessageReaction", handlePrivateMessageReaction);
    };
  }, [socket, userId, currentUserId, messages]);

  // Modified: Fetch user info and messages when userId changes
  useEffect(() => {
    if (!userId || userId === lastFetchedUserId.current) return;

    // Set a ref to avoid duplicate fetches
    lastFetchedUserId.current = userId;

    const loadUserAndMessages = async () => {
      await fetchUserInfo(userId);
      // Reset pagination state when changing conversations
      setPage(1);
      setHasMoreMessages(true);
      setIsInitialLoad(true);
      await fetchMessages(userId, 1);

      // Ne pas marquer les messages comme lus automatiquement
      // Les messages seront marqués comme lus uniquement lorsque l'utilisateur interagit avec la conversation
    };

    loadUserAndMessages();

    // Cleanup when leaving the conversation
    return () => {
      setMessages([]);
      setUserInfo(null);
      setPage(1);
      setHasMoreMessages(true);
    };
  }, [userId]);

  // Modifier l'effet pour le marquage comme lu uniquement quand l'utilisateur ouvre la conversation
  useEffect(() => {
    if (messages.length === 0 || isInitialLoad || !userId || !currentUserId)
      return;

    // Marquer les messages comme lus dès que l'utilisateur ouvre la conversation et que les messages sont chargés
    console.log("User opened conversation, marking messages as read");
    markMessagesAsRead(messages);
  }, [messages, isInitialLoad, userId, currentUserId, markMessagesAsRead]);

  // Get user info
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

  // Scroll event handler to detect when user has scrolled near the top
  const handleScroll = (event) => {
    if (loadingMoreMessages || !hasMoreMessages || isLoadingMore.current)
      return;

    const scrollOffset = event.nativeEvent.contentOffset.y;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;

    // Calculate the scroll position from the top
    // We trigger loading more when the user is within 200 pixels of the top
    if (scrollOffset < 200) {
      // Store current position to restore after loading
      scrollPositionRef.current = {
        contentHeight,
        scrollOffset,
      };

      // Prevent multiple triggers
      isLoadingMore.current = true;

      // Load more messages
      loadMoreMessages();
    }
  };

  // Load more messages (previous page)
  const loadMoreMessages = async () => {
    if (loadingMoreMessages || !hasMoreMessages) return;

    setLoadingMoreMessages(true);

    try {
      const nextPage = page + 1;
      const result = await fetchMessagesBatch(userId, nextPage);

      if (result.messages.length > 0) {
        // Update state
        setPage(nextPage);
        setMessages((prevMessages) => [...result.messages, ...prevMessages]);
        setHasMoreMessages(result.hasMore);

        // Restore scroll position after messages are loaded
        if (scrollPositionRef.current && messagesScrollRef.current) {
          setTimeout(() => {
            const newContentHeight = messagesScrollRef.current._contentHeight;
            const heightDifference =
              newContentHeight - scrollPositionRef.current.contentHeight;

            if (heightDifference > 0) {
              messagesScrollRef.current.scrollTo({
                y: scrollPositionRef.current.scrollOffset + heightDifference,
                animated: false,
              });
            }
          }, 50);
        }
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

  // Fetch a batch of messages by page
  const fetchMessagesBatch = async (
    userId,
    page = 1,
    limit = messagesPerPage
  ) => {
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

      // Process messages (add attachments, etc.)
      const processedMessages = await Promise.all(
        data.map(async (msg) => {
          // Process attachments here if needed
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

  // Modified: Fetch messages for a conversation with pagination
  const fetchMessages = async (userId, initialPage = 1) => {
    try {
      setLoadingMessages(true);

      const result = await fetchMessagesBatch(userId, initialPage);

      setMessages(result.messages);
      setPage(initialPage);
      setHasMoreMessages(result.hasMore);
      setIsInitialLoad(false);

      // Supprimé le marquage automatique des messages comme lus
      // Les messages ne seront marqués comme lus que lorsque l'utilisateur les voit réellement
    } catch (e) {
      console.error("Error fetching messages:", e);
      setError("Failed to load messages");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // New function to handle reply
  const handleReply = (message) => {
    if (!message) return;

    setReplyingTo(message);
    // Focus the text input when replying
    setTimeout(() => {
      if (textInputRef && textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 100);
  };

  // Function to cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Modified sendMessage function to include reply information
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId || !currentUserId) return;

    try {
      const tempId = Date.now().toString();
      const messageText = newMessage;

      // Clear input immediately for perceived responsiveness
      setNewMessage("");

      // Prepare reply metadata if replying to a message
      const replyData = replyingTo
        ? {
            reply_to: replyingTo.id_message_prive,
            reply_content: replyingTo.contenu,
            reply_user_id: replyingTo.fk_expediteur,
          }
        : null;

      // Optimistic message with reply data
      const optimisticMessage = {
        id_message_prive: `temp-${tempId}`,
        contenu: messageText,
        fk_expediteur: currentUserId,
        fk_destinataire: userId,
        date_envoi: new Date().toISOString(),
        isOptimistic: true,
        reply_data: replyData,
      };

      // Clear reply state after sending
      if (replyingTo) {
        setReplyingTo(null);
      }

      // Mark as animating
      setAnimatingMessages((prev) => ({
        ...prev,
        [`temp-${tempId}`]: true,
      }));

      // Remove animation state after a delay
      setTimeout(() => {
        setAnimatingMessages((prev) => {
          const updated = { ...prev };
          delete updated[`temp-${tempId}`];
          return updated;
        });
      }, 500);

      // Add to UI immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      // Scroll with animation
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);

      // Send via socket with reply data
      if (socket) {
        socket.emit("privateMessage", {
          destinataireId: userId,
          contenu: messageText,
          tempId,
          replyTo: replyData ? replyData.reply_to : undefined,
        });
      } else {
        // Fallback to REST API
        sendMessageViaAPI(messageText, replyData);
      }

      // Update conversation timestamp
      await saveConversationTimestamp(userId);
    } catch (e) {
      console.error("Error sending message:", e);
      setError("Failed to send message");
    }
  };

  // Updated API message sending to include reply data
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

      // Update message in UI
      setMessages((prev) =>
        prev.map((m) =>
          m.isOptimistic && m.contenu === messageContent ? data : m
        )
      );
    } catch (e) {
      console.error("Error sending message via API:", e);
    }
  };

  // Add this to the right click menu options
  const handleReplyFromMenu = () => {
    if (contextMenu.message) {
      handleReply(contextMenu.message);
      handleCloseContextMenu();
    }
  };

  // Render avatar component
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

  // Stocker les références aux composants Swipeable
  const swipeableRefs = useRef({});

  // Fonction qui sera appelée lorsque le swipe est terminé et a dépassé un certain seuil
  const onSwipeableWillOpen = (message) => {
    // Déclenche directement la réponse au message si le swipe est suffisant
    handleReply(message);

    // Ferme immédiatement le swipeable pour ramener le message à sa position d'origine
    setTimeout(() => {
      if (swipeableRefs.current[message.id_message_prive]) {
        swipeableRefs.current[message.id_message_prive].close();
      }
    }, 100);
  };

  // Render the reply action for swipe gestures
  const renderRightActions = (message) => {
    return (
      <RectButton
        style={styles.replyAction}
        onPress={() => handleReply(message)}
      >
        <Ionicons
          name="arrow-undo-outline"
          size={22}
          style={styles.replyActionIcon}
        />
        <Text style={styles.replyActionText}>Répondre</Text>
      </RectButton>
    );
  };

  // Render the reply action for swipe gestures on left side (for received messages)
  const renderLeftActions = (message) => {
    return (
      <RectButton
        style={styles.replyAction}
        onPress={() => handleReply(message)}
      >
        <Ionicons
          name="arrow-undo-outline"
          size={22}
          style={styles.replyActionIcon}
        />
        <Text style={styles.replyActionText}>Répondre</Text>
      </RectButton>
    );
  };

  // Render the reply preview in a message
  const renderMessageReply = (message, isOwn) => {
    if (!message.reply_data && !message.replyTo) return null;

    // Get the reply data either from direct reply_data or from referenced message
    const replyData = message.reply_data || {
      reply_content: message.replyContent || "Message d'origine non disponible",
      reply_user_id: message.replyTo,
    };

    const isReplyFromSender = replyData.reply_user_id === currentUserId;
    const replyText = isReplyFromSender
      ? "vous"
      : userInfo?.name || "Utilisateur";

    return (
      <View
        style={[
          styles.messageReplyContainer,
          // Appliquer une bordure grise pour les messages envoyés et violette pour les messages reçus
          { borderLeftColor: isOwn ? "#8E8E8E" : themeColors.accentPrimary },
        ]}
      >
        <Text style={[styles.messageReplyText, isOwn && { color: "#FFFFFF" }]}>
          Réponse à {replyText}
        </Text>
        <Text
          style={[
            styles.messageReplyContent,
            { color: isOwn ? "#FFFFFF" : "rgba(0, 0, 0, 0.7)" },
          ]}
          numberOfLines={2}
        >
          {replyData.reply_content}
        </Text>
      </View>
    );
  };

  // Modified scroll to bottom to work with dynamic content
  const scrollToBottom = (animated = false) => {
    setTimeout(
      () => {
        if (messagesScrollRef.current) {
          messagesScrollRef.current.scrollToEnd({ animated });
        }
      },
      animated ? 100 : 50
    );
  };

  // Modified: Only scroll to bottom for new messages, not when loading older ones
  useEffect(() => {
    if (!isInitialLoad && !loadingMoreMessages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isInitialLoad, loadingMoreMessages]);

  // Handle going back to conversation list
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Simplify the attachment opening function
  const handleOpenAttachment = (attachment) => {
    try {
      // Get the file URL
      const fileUrl = attachment.url || attachment.presignedUrl;
      const fullFileUrl = getFileURL(fileUrl);

      console.log("Opening attachment with URL:", fullFileUrl);
      console.log("Attachment details:", {
        fileUrl: fullFileUrl,
        filename: attachment.nom_fichier,
        type: attachment.type,
      });

      // Open the modal with the MediaViewer component
      setMediaPreview({
        visible: true,
        media: {
          fileUrl: fullFileUrl,
          fileName: attachment.nom_fichier || "Fichier",
          fileType: attachment.type || "application/octet-stream",
        },
      });
    } catch (error) {
      console.error("Error opening attachment:", error);
      Alert.alert("Erreur", "Impossible d'ouvrir cette pièce jointe.");
    }
  };

  // Close MediaViewer modal
  const handleCloseMediaPreview = () => {
    setMediaPreview({
      visible: false,
      media: null,
    });
  };

  // Handle long press on message to show context menu
  const handleLongPressMessage = (message, event) => {
    console.log("Long press detected on message:", message.id_message_prive);

    // Only allow editing of own messages
    const isOwnMessage = message.fk_expediteur === currentUserId;

    // Dans React Native, les coordonnées sont directement dans l'événement, pas dans nativeEvent
    const pageX = event.pageX || 0;
    const pageY = event.pageY || 0;

    // Update context menu state
    setContextMenu({
      visible: true,
      message: message,
      position: { x: pageX, y: pageY },
      isOwnMessage,
    });

    // Store the selected message for reaction
    setSelectedMessageForReaction(message);
  };

  // Close the context menu
  const handleCloseContextMenu = () => {
    setContextMenu({
      visible: false,
      message: null,
      position: { x: 0, y: 0 },
      isOwnMessage: false,
    });
  };

  // Handle message edit
  const handleEditMessage = () => {
    if (!contextMenu.message || !contextMenu.isOwnMessage) return;

    setEditingMessage(contextMenu.message);
    setEditMessageContent(contextMenu.message.contenu);
    handleCloseContextMenu();
  };

  // Save edited message
  const handleSaveEdit = () => {
    if (!editingMessage || !socket) return;

    // Emit socket event to update the message
    socket.emit("editPrivateMessage", {
      id: editingMessage.id_message_prive,
      contenu: editMessageContent,
    });

    // Update UI optimistically
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id_message_prive === editingMessage.id_message_prive
          ? { ...msg, contenu: editMessageContent }
          : msg
      )
    );

    // Clear editing state
    setEditingMessage(null);
    setEditMessageContent("");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditMessageContent("");
  };

  // Handle message deletion
  const handleDeleteMessage = () => {
    if (!contextMenu.message || !contextMenu.isOwnMessage || !socket) return;

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
            // Emit socket event to delete the message
            socket.emit("deletePrivateMessage", {
              id: contextMenu.message.id_message_prive,
            });

            // Update UI optimistically
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id_message_prive === contextMenu.message.id_message_prive
                  ? { ...msg, is_deleted: true, contenu: "[Message deleted]" }
                  : msg
              )
            );

            // Close the context menu
            handleCloseContextMenu();
          },
        },
      ]
    );
  };

  // Handle adding a reaction
  const handleAddReaction = () => {
    // On garde le message du menu contextuel avant de le fermer
    setSelectedMessageForReaction(contextMenu.message);
    setShowEmojiPicker(true);
    handleCloseContextMenu();
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    console.log("Emoji selected:", emoji);

    if (!selectedMessageForReaction || !socket) {
      console.error("No message selected for reaction or socket not available");
      return;
    }

    console.log(
      "Adding reaction to message:",
      selectedMessageForReaction.id_message_prive
    );

    // Emit socket event to add reaction with the correct parameter name
    socket.emit("addPrivateMessageReaction", {
      id: selectedMessageForReaction.id_message_prive,
      reaction: emoji, // ✅ Changed from reaction_type to reaction
    });

    // Mise à jour optimiste de l'UI
    const messageId = selectedMessageForReaction.id_message_prive;
    const existingReactions = selectedMessageForReaction.reactions || [];
    const hasReaction = existingReactions.find(
      (r) => r.reaction_type === emoji
    );

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

    setShowEmojiPicker(false);
  };

  // Handle removing a reaction
  const handleRemoveReaction = (messageId, reactionType) => {
    if (!socket) return;

    console.log("Removing reaction:", reactionType, "from message:", messageId);

    // Emit socket event to remove reaction with the correct parameter name
    socket.emit("removePrivateMessageReaction", {
      id: messageId,
      reaction: reactionType, // Cohérent avec le nom de paramètre utilisé dans handleEmojiSelect
    });

    // Mise à jour optimiste de l'UI
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
  };

  if (!userId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No conversation selected</Text>
        <TouchableOpacity style={styles.button} onPress={handleGoBack}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        enabled
      >
        <View style={{ flex: 1 }}>
          {/* Header with user info */}
          <View style={styles.chatHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={themeColors.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.chatHeaderInfo}>
              {renderAvatar(userInfo)}
              <Text style={styles.chatHeaderName}>
                {userInfo?.name || "User"}
              </Text>
            </View>
          </View>

          {loadingMessages && isInitialLoad ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={themeColors.accentPrimary}
              />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView
                style={[
                  styles.messagesContainer,
                  keyboardVisible &&
                    Platform.OS === "android" && { marginBottom: 5 },
                ]}
                ref={messagesScrollRef}
                onContentSizeChange={() =>
                  !loadingMoreMessages && scrollToBottom(false)
                }
                keyboardShouldPersistTaps="handled"
                onScroll={handleScroll}
                scrollEventThrottle={16} // For smooth scroll detection
              >
                {/* Loading indicator for more messages */}
                {loadingMoreMessages && (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator
                      size="small"
                      color={themeColors.accentPrimary}
                    />
                    <Text style={styles.loadingMoreText}>
                      Loading older messages...
                    </Text>
                  </View>
                )}

                {/* No more messages indicator */}
                {!hasMoreMessages && messages.length > 0 && (
                  <View style={styles.noMoreMessagesContainer}>
                    <Text style={styles.noMoreMessagesText}>
                      Beginning of conversation
                    </Text>
                  </View>
                )}

                {messages.length === 0 ? (
                  <View style={styles.emptyMessages}>
                    <Text style={styles.emptyMessagesText}>
                      No messages yet
                    </Text>
                    <Text style={styles.emptyMessagesSubtext}>
                      Start the conversation!
                    </Text>
                  </View>
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = msg.fk_expediteur === currentUserId;
                    const isAnimating = animatingMessages[msg.id_message_prive];

                    // Determine if this message is the last message sent by the current user
                    const isLastOwnMessage =
                      isOwn &&
                      messages
                        .slice(index + 1)
                        .findIndex((m) => m.fk_expediteur === currentUserId) ===
                        -1;

                    return (
                      <Swipeable
                        key={
                          msg.id_message_prive ||
                          `temp-${Date.now()}-${Math.random()}`
                        }
                        renderRightActions={() =>
                          isOwn ? renderRightActions(msg) : null
                        }
                        renderLeftActions={() =>
                          !isOwn ? renderLeftActions(msg) : null
                        }
                        friction={2}
                        overshootRight={false}
                        overshootLeft={false}
                        rightThreshold={40}
                        leftThreshold={40}
                        ref={(ref) => {
                          if (ref) {
                            swipeableRefs.current[msg.id_message_prive] = ref;
                          }
                        }}
                        onSwipeableWillOpen={() => onSwipeableWillOpen(msg)}
                      >
                        <TouchableOpacity
                          style={[
                            styles.messageWrapper,
                            isOwn
                              ? styles.ownMessageWrapper
                              : styles.otherMessageWrapper,
                            isAnimating && styles.animatingMessage,
                          ]}
                          onLongPress={(event) => {
                            console.log(
                              "Long press detected on message:",
                              msg.id_message_prive
                            );
                            handleLongPressMessage(msg, event.nativeEvent);
                          }}
                          delayLongPress={500}
                          activeOpacity={0.9}
                        >
                          <View
                            style={[
                              styles.messageBubble,
                              isOwn ? styles.ownMessage : styles.otherMessage,
                            ]}
                          >
                            {/* Render reply preview if this is a reply */}
                            {renderMessageReply(msg, isOwn)}

                            <Text
                              style={
                                isOwn
                                  ? styles.ownMessageText
                                  : styles.otherMessageText
                              }
                            >
                              {msg.contenu}
                            </Text>

                            {/* Attachment handling */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <View style={styles.attachmentsContainer}>
                                {/* Vérification si l'attachment existe et a bien une URL */}
                                {msg.attachments.map((attachment, i) => {
                                  if (
                                    !attachment ||
                                    (!attachment.url &&
                                      !attachment.presignedUrl)
                                  ) {
                                    console.warn(
                                      `Invalid attachment at index ${i}:`,
                                      attachment
                                    );
                                    return null;
                                  }

                                  console.log(`Rendering attachment ${i}:`, {
                                    type: attachment.type,
                                    url: attachment.url,
                                    presignedUrl: attachment.presignedUrl,
                                  });

                                  const fileUrl =
                                    attachment.url || attachment.presignedUrl;
                                  const fullFileUrl = getFileURL(fileUrl);
                                  console.log(`Full file URL: ${fullFileUrl}`);

                                  if (attachment.type?.startsWith("image/")) {
                                    return (
                                      <TouchableOpacity
                                        key={`${msg.id_message_prive}-attachment-${i}`}
                                        style={styles.imageAttachment}
                                        onPress={() =>
                                          handleOpenAttachment(attachment)
                                        }
                                      >
                                        <ImageComponent
                                          uri={fullFileUrl}
                                          style={styles.attachmentImage}
                                          resizeMode="cover"
                                          fileName={
                                            attachment.nom_fichier || "Image"
                                          }
                                        />
                                        <Text
                                          style={styles.imageCaption}
                                          numberOfLines={1}
                                        >
                                          {attachment.nom_fichier || "Image"}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  } else {
                                    return (
                                      <TouchableOpacity
                                        key={`${msg.id_message_prive}-attachment-${i}`}
                                        style={styles.fileAttachment}
                                        onPress={() =>
                                          handleOpenAttachment(attachment)
                                        }
                                      >
                                        <View style={styles.fileIconContainer}>
                                          <Ionicons
                                            name={getFileIcon(attachment.type)}
                                            size={24}
                                            color={themeColors.textPrimary}
                                          />
                                        </View>
                                        <View style={styles.fileDetails}>
                                          <Text
                                            style={styles.fileName}
                                            numberOfLines={1}
                                          >
                                            {attachment.nom_fichier ||
                                              "Fichier"}
                                          </Text>
                                          <Text style={styles.fileSize}>
                                            {formatFileSize(
                                              attachment.taille_fichier
                                            )}
                                          </Text>
                                        </View>
                                        <Ionicons
                                          name="eye-outline"
                                          size={20}
                                          color={themeColors.accentPrimary}
                                        />
                                      </TouchableOpacity>
                                    );
                                  }
                                })}
                              </View>
                            )}

                            {/* Reactions */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <View style={styles.reactionsContainer}>
                                {msg.reactions.map((reaction, index) => (
                                  <TouchableOpacity
                                    key={`${msg.id_message_prive}-reaction-${index}`}
                                    style={[
                                      styles.reactionBubble,
                                      reaction.user_reacted &&
                                        styles.userReactedBubble,
                                    ]}
                                    onPress={() => {
                                      // Si l'utilisateur a déjà réagi, supprimer la réaction
                                      if (reaction.user_reacted) {
                                        handleRemoveReaction(
                                          msg.id_message_prive,
                                          reaction.reaction_type
                                        );
                                      }
                                      // Sinon, ajouter la réaction
                                      else {
                                        // Utiliser le même émoji pour ajouter la réaction
                                        socket.emit(
                                          "addPrivateMessageReaction",
                                          {
                                            id: msg.id_message_prive,
                                            reaction: reaction.reaction_type,
                                          }
                                        );

                                        // Mise à jour optimiste de l'UI
                                        setMessages((prev) =>
                                          prev.map((m) => {
                                            if (
                                              m.id_message_prive ===
                                              msg.id_message_prive
                                            ) {
                                              // Trouver et mettre à jour cette réaction spécifique
                                              const updatedReactions =
                                                m.reactions.map((r) =>
                                                  r.reaction_type ===
                                                  reaction.reaction_type
                                                    ? {
                                                        ...r,
                                                        count: r.count + 1,
                                                        user_reacted: true,
                                                      }
                                                    : r
                                                );
                                              return {
                                                ...m,
                                                reactions: updatedReactions,
                                              };
                                            }
                                            return m;
                                          })
                                        );
                                      }
                                    }}
                                  >
                                    <Text style={styles.reactionEmoji}>
                                      {reaction.reaction_type}
                                    </Text>
                                    <Text style={styles.reactionCount}>
                                      {reaction.count}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}

                            <View style={styles.messageInfoContainer}>
                              <Text
                                style={
                                  isOwn
                                    ? styles.ownMessageTime
                                    : styles.otherMessageTime
                                }
                              >
                                {formatMessageDate(
                                  msg.date_creation || msg.date_envoi
                                )}
                              </Text>
                              {isOwn && isLastOwnMessage && (
                                <View style={styles.readStatusInBubble}>
                                  {msg.date_lecture ? (
                                    <>
                                      <MaterialIcons
                                        name="done-all"
                                        size={14}
                                        color={themeColors.accentPrimary}
                                      />
                                      <Text style={styles.readStatusText}>
                                        Lu
                                      </Text>
                                    </>
                                  ) : (
                                    <>
                                      <MaterialIcons
                                        name="done"
                                        size={14}
                                        color={
                                          isOwn
                                            ? "rgba(255, 255, 255, 0.7)"
                                            : "rgba(0, 0, 0, 0.6)"
                                        }
                                      />
                                      <Text style={styles.sentStatusText}>
                                        Envoyé
                                      </Text>
                                    </>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Swipeable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          <View
            style={[
              styles.inputContainer,
              keyboardVisible &&
                Platform.OS === "android" && { paddingBottom: 5 },
            ]}
          >
            {/* Replying UI */}
            {replyingTo && (
              <View style={styles.replyContainer}>
                <View style={styles.replyContent}>
                  <Text style={styles.replyText}>
                    Réponse à{" "}
                    {replyingTo.fk_expediteur === currentUserId
                      ? "vous-même"
                      : userInfo?.name || "Utilisateur"}
                  </Text>
                  <Text style={styles.replyMessage} numberOfLines={1}>
                    {replyingTo.contenu}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.replyCloseButton}
                  onPress={handleCancelReply}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputRow}>
              <TextInput
                ref={textInputRef}
                style={styles.messageInput}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                keyboardAppearance={isDarkMode ? "dark" : "light"}
                placeholderTextColor={isDarkMode ? "#777" : "#999"}
                selectionColor={
                  isDarkMode ? themeColors.accentPrimary : undefined
                }
                cursorColor={isDarkMode ? themeColors.accentPrimary : undefined}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newMessage.trim() && styles.sendButtonDisabled,
                ]}
                disabled={!newMessage.trim()}
                onPress={handleSendMessage}
              >
                <Ionicons
                  name="send"
                  size={24}
                  color={themeColors.textOnAccent}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Replace the old preview modal with the MediaViewer component */}
        <MediaViewer
          visible={mediaPreview.visible}
          media={mediaPreview.media}
          onClose={handleCloseMediaPreview}
          theme={themeColors}
        />

        {/* Message context menu */}
        {contextMenu.visible && (
          <TouchableOpacity
            style={styles.contextMenuOverlay}
            activeOpacity={1}
            onPress={handleCloseContextMenu}
          >
            <View
              style={[
                styles.contextMenu,
                {
                  top:
                    contextMenu.position.y -
                    (contextMenu.isOwnMessage ? 200 : 150),
                  left: Math.min(
                    contextMenu.position.x - 100,
                    Dimensions.get("window").width - 230
                  ),
                },
              ]}
            >
              {contextMenu.isOwnMessage ? (
                <>
                  <TouchableOpacity
                    style={styles.contextMenuItem}
                    onPress={handleReplyFromMenu}
                  >
                    <Ionicons
                      name="arrow-undo-outline"
                      size={20}
                      color={themeColors.textPrimary}
                    />
                    <Text style={styles.contextMenuItemText}>Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.contextMenuItem}
                    onPress={handleEditMessage}
                  >
                    <Ionicons
                      name="pencil"
                      size={20}
                      color={themeColors.textPrimary}
                    />
                    <Text style={styles.contextMenuItemText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.contextMenuItem}
                    onPress={handleAddReaction}
                  >
                    <Ionicons
                      name="happy-outline"
                      size={20}
                      color={themeColors.textPrimary}
                    />
                    <Text style={styles.contextMenuItemText}>React</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.contextMenuItem, styles.deleteMenuItem]}
                    onPress={handleDeleteMessage}
                  >
                    <Ionicons name="trash-outline" size={20} color="red" />
                    <Text
                      style={[styles.contextMenuItemText, { color: "red" }]}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.contextMenuItem}
                    onPress={handleReplyFromMenu}
                  >
                    <Ionicons
                      name="arrow-undo-outline"
                      size={20}
                      color={themeColors.textPrimary}
                    />
                    <Text style={styles.contextMenuItemText}>Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.contextMenuItem}
                    onPress={handleAddReaction}
                  >
                    <Ionicons
                      name="happy-outline"
                      size={20}
                      color={themeColors.textPrimary}
                    />
                    <Text style={styles.contextMenuItemText}>React</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Emoji picker for reactions */}
        {showEmojiPicker && (
          <TouchableOpacity
            style={styles.emojiPickerOverlay}
            activeOpacity={1}
            onPress={() => setShowEmojiPicker(false)}
          >
            <View style={styles.emojiPicker} ref={emojiPickerRef}>
              <ScrollView horizontal style={styles.emojiScrollView}>
                {[
                  "👍",
                  "👎",
                  "❤️",
                  "😂",
                  "😮",
                  "😢",
                  "😡",
                  "🎉",
                  "👏",
                  "🤔",
                ].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiButton}
                    onPress={() => handleEmojiSelect(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        )}

        {/* Message editing interface */}
        {editingMessage && (
          <View style={styles.editOverlay}>
            <View style={styles.editContainer}>
              <Text style={styles.editTitle}>Edit Message</Text>
              <TextInput
                style={styles.editInput}
                value={editMessageContent}
                onChangeText={setEditMessageContent}
                multiline
                autoFocus
                keyboardAppearance={isDarkMode ? "dark" : "light"}
              />
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

export default MessagesScreen;
