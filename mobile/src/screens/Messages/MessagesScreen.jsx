import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, Image, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
  Keyboard, Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStyles } from './MessagesScreen.styles';
import { useTheme } from '../../theme/ThemeContext';
import { useSocket } from '../../context/SocketContext';
// Import the environment configuration
import env from '../../config/env';
// Import the new MediaViewer component
import MediaViewer from '../../components/MediaViewer/MediaViewer';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.119:3000';
const S3_BASE_URL = env.S3_BASE_URL || 'https://s3-supchat.s3.fr-par.scw.cloud/';

// Helper for formatting message dates
const formatMessageDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    case 'application/pdf':
      return "document-text";
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return "document";
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return "calculator";
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return "easel";
    case 'application/zip':
    case 'application/x-zip-compressed':
      return "archive";
    case 'audio/mpeg':
    case 'audio/mp3':
    case 'audio/wav':
      return "musical-notes";
    case 'video/mp4':
    case 'video/quicktime':
      return "videocam";
    default:
      if (fileType?.startsWith('image/')) return "image";
      if (fileType?.startsWith('audio/')) return "musical-notes";
      if (fileType?.startsWith('video/')) return "videocam";
      return "document";
  }
};

// Helper for constructing file URLs - Updated to properly handle S3 paths
const getFileURL = (url) => {
  if (!url) return null;
  
  // Si l'URL est déjà complète, la retourner telle quelle
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Si le chemin commence par 'private-messages/files/', construire une URL S3
  if (url.startsWith('private-messages/files/') || url.startsWith('private-messages/')) {
    console.log(`Using S3 base URL for file: ${url}`);
    return `${S3_BASE_URL}${url}`;
  }
  
  // Si l'URL est relative mais commence déjà avec /api/files, ajouter uniquement l'URL de base
  if (url.startsWith('/api/files/')) return `${API_URL}${url}`;
  
  // Pour toutes les autres URLs, considérer qu'elles sont relatives à /api/files/
  return `${API_URL}/api/files/${url}`;
};

const ImageComponent = ({ uri, style, resizeMode, fileName }) => {
  const [hasError, setHasError] = useState(false);

  return hasError ? (
    <View style={[style, { 
      backgroundColor: '#f0f0f0', 
      alignItems: 'center', 
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderStyle: 'dashed'
    }]}>
      <Ionicons name="image-outline" size={32} color="#999" />
      <Text style={{ color: '#999', marginTop: 8, textAlign: 'center' }}>
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
  const isDarkMode = mode === 'dark' || 
    themeColors.primaryBackground.toString().toLowerCase() === '#121212' || 
    themeColors.primaryBackground.toString().toLowerCase() === '#000000' ||
    themeColors.textPrimary?.toString().toLowerCase() === '#ffffff';

  const [messages, setMessages] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
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
    media: null
  });

  // Use socket context
  const { socket, currentUserId, markMessagesAsRead: markMessagesAsReadContext } = useSocket();

  // Memoize internal message reading function to prevent recreating on every render
  const markMessagesAsRead = useCallback((msgs) => {
    if (!socket || !msgs?.length || !userId || !currentUserId) return;
    
    const unreadMessages = msgs.filter(m => 
      m.fk_expediteur !== currentUserId && !m.date_lecture
    );
    
    if (unreadMessages.length > 0) {
      console.log(`Marking ${unreadMessages.length} messages as read for user ${userId}`);
      unreadMessages.forEach(msg => {
        socket.emit('readPrivateMessage', {
          id: msg.id_message_prive,
          senderId: msg.fk_expediteur,
          recipientId: currentUserId
        });
      });
      
      // Also notify context that messages have been read
      if (markMessagesAsReadContext) {
        markMessagesAsReadContext(userId);
      }
    }
  }, [socket, userId, currentUserId, markMessagesAsReadContext]);

  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
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
      const timestampsStr = await AsyncStorage.getItem('conversationTimestamps');
      let timestamps = {};
      
      if (timestampsStr) {
        try {
          timestamps = JSON.parse(timestampsStr);
        } catch (e) {
          console.error('Error parsing timestamps:', e);
        }
      }
      
      // Update with new timestamp
      const newTimestamps = {
        ...timestamps,
        [userId]: timestamp
      };
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem('conversationTimestamps', JSON.stringify(newTimestamps));
      console.log('Timestamps updated in storage:', newTimestamps);
      
      // Update local state
      setConversationTimestamps(newTimestamps);
      
    } catch (e) {
      console.error('Error saving conversation timestamp:', e);
    }
  };

  // Handle incoming messages with optimized animations
  useEffect(() => {
    if (!socket || !currentUserId || !userId) return;
    
    const handlePrivateMessage = async (msg) => {
      console.log('Received message:', msg);
      
      // Update messages if relevant to current conversation
      if (msg.fk_expediteur === userId || msg.fk_destinataire === userId) {
        const isNewMessage = !messages.some(m => 
          m.id_message_prive === msg.id_message_prive ||
          (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`) ||
          (m.isOptimistic && m.contenu === msg.contenu && m.fk_expediteur === msg.fk_expediteur)
        );
        
        if (isNewMessage) {
          // Mark this message as animating
          const messageId = msg.id_message_prive || `temp-${Date.now()}`;
          setAnimatingMessages(prev => ({
            ...prev,
            [messageId]: true
          }));
          
          // Remove animation state after a delay
          if (messageAnimationTimers.current[messageId]) {
            clearTimeout(messageAnimationTimers.current[messageId]);
          }
          
          messageAnimationTimers.current[messageId] = setTimeout(() => {
            setAnimatingMessages(prev => {
              const updated = {...prev};
              delete updated[messageId];
              return updated;
            });
          }, 500); // Animation duration
        }
        
        setMessages(prev => {
          const messageExists = prev.some(m => 
            m.id_message_prive === msg.id_message_prive ||
            (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`) ||
            (m.isOptimistic && m.contenu === msg.contenu && m.fk_expediteur === msg.fk_expediteur)
          );
          
          if (messageExists) {
            return prev.map(m => {
              if (m.id_message_prive === msg.id_message_prive) return msg;
              if (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`) return msg;
              if (m.isOptimistic && m.contenu === msg.contenu && m.fk_expediteur === msg.fk_expediteur) return msg;
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

        // Mark the message as read immediately
        if (msg.fk_expediteur !== currentUserId) {
          socket.emit('readPrivateMessage', {
            id: msg.id_message_prive,
            senderId: msg.fk_expediteur,
            recipientId: currentUserId
          });
        }

        // Update timestamp for this conversation in AsyncStorage
        await saveConversationTimestamp(userId);
      }
    };
    
    socket.on('privateMessage', handlePrivateMessage);
    
    return () => {
      socket.off('privateMessage', handlePrivateMessage);
    };
  }, [socket, userId, currentUserId]);

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
      
      // Mark messages as read only after fetching them
      if (markMessagesAsReadContext) {
        markMessagesAsReadContext(userId);
      }
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

  // Get user info
  const fetchUserInfo = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      const data = await res.json();
      const userInfo = {
        id: userId,
        name: data.nom || data.name || 'User',
        avatar: data.photo_de_profil || data.avatar || null,
        ...data
      };
      
      setUserInfo(userInfo);
      return userInfo;
    } catch (e) {
      console.error(`Error fetching user info for ${userId}:`, e);
      setUserInfo({ id: userId, name: 'User', avatar: null });
      return null;
    }
  };

  // Scroll event handler to detect when user has scrolled near the top
  const handleScroll = (event) => {
    if (loadingMoreMessages || !hasMoreMessages || isLoadingMore.current) return;

    const scrollOffset = event.nativeEvent.contentOffset.y;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;
    
    // Calculate the scroll position from the top
    // We trigger loading more when the user is within 200 pixels of the top
    if (scrollOffset < 200) {
      // Store current position to restore after loading
      scrollPositionRef.current = {
        contentHeight,
        scrollOffset
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
        setMessages(prevMessages => [...result.messages, ...prevMessages]);
        setHasMoreMessages(result.hasMore);
        
        // Restore scroll position after messages are loaded
        if (scrollPositionRef.current && messagesScrollRef.current) {
          setTimeout(() => {
            const newContentHeight = messagesScrollRef.current._contentHeight;
            const heightDifference = newContentHeight - scrollPositionRef.current.contentHeight;
            
            if (heightDifference > 0) {
              messagesScrollRef.current.scrollTo({
                y: scrollPositionRef.current.scrollOffset + heightDifference,
                animated: false
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
  const fetchMessagesBatch = async (userId, page = 1, limit = messagesPerPage) => {
    try {
      const offset = (page - 1) * limit;
      
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/private-messages/${userId}?limit=${limit}&offset=${offset}&sort=desc`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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
        hasMore: data.length === limit
      };
    } catch (error) {
      console.error('Error fetching message batch:', error);
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
      
      // Mark messages as read, but don't depend on this function in useEffect
      setTimeout(() => markMessagesAsRead(result.messages), 500);
      
    } catch (e) {
      console.error('Error fetching messages:', e);
      setError('Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message with timestamp update
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId || !currentUserId) return;
    
    try {
      const tempId = Date.now().toString();
      const messageText = newMessage;
      
      // Clear input immediately for perceived responsiveness
      setNewMessage('');
      
      // Optimistic message
      const optimisticMessage = {
        id_message_prive: `temp-${tempId}`,
        contenu: messageText,
        fk_expediteur: currentUserId,
        fk_destinataire: userId,
        date_envoi: new Date().toISOString(),
        isOptimistic: true,
      };
      
      // Mark as animating
      setAnimatingMessages(prev => ({
        ...prev,
        [`temp-${tempId}`]: true
      }));
      
      // Remove animation state after a delay
      setTimeout(() => {
        setAnimatingMessages(prev => {
          const updated = {...prev};
          delete updated[`temp-${tempId}`];
          return updated;
        });
      }, 500);
      
      // Add to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Scroll with animation
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      
      // Send via socket
      if (socket) {
        socket.emit('privateMessage', {
          destinataireId: userId,
          contenu: messageText,
          tempId
        });
      } else {
        // Fallback to REST API
        sendMessageViaAPI(messageText);
      }
      
      // Update conversation timestamp
      await saveConversationTimestamp(userId);
      
    } catch (e) {
      console.error('Error sending message:', e);
      setError('Failed to send message');
    }
  };

  // REST API fallback for sending messages
  const sendMessageViaAPI = async (messageContent) => {
    if (!messageContent || !userId) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/private-messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          destinataireId: userId,
          contenu: messageContent
        })
      });
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Message sent via API:', data);
      
      // Update message in UI
      setMessages(prev => prev.map(m => 
        (m.isOptimistic && m.contenu === messageContent) ? data : m
      ));
      
    } catch (e) {
      console.error('Error sending message via API:', e);
    }
  };

  // Fetch conversation timestamps when component mounts
  useEffect(() => {
    const loadConversationTimestamps = async () => {
      try {
        const timestampsStr = await AsyncStorage.getItem('conversationTimestamps');
        if (timestampsStr) {
          const timestamps = JSON.parse(timestampsStr);
          setConversationTimestamps(timestamps);
        }
      } catch (e) {
        console.error('Error loading conversation timestamps:', e);
      }
    };
    
    loadConversationTimestamps();
  }, []);

  // Initialize timestamps when userId changes
  useEffect(() => {
    if (!userId) return;
    
    const initializeTimestamp = async () => {
      try {
        // Get current timestamps
        const timestampsStr = await AsyncStorage.getItem('conversationTimestamps');
        if (timestampsStr) {
          const timestamps = JSON.parse(timestampsStr);
          setConversationTimestamps(timestamps);
          
          // Initialize timestamp for this conversation if it doesn't exist
          if (!timestamps[userId]) {
            await saveConversationTimestamp(userId);
          }
        } else {
          // No existing timestamps, initialize this conversation
          await saveConversationTimestamp(userId);
        }
      } catch (e) {
        console.error('Error initializing conversation timestamp:', e);
      }
    };
    
    initializeTimestamp();
  }, [userId]);

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
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </Text>
        </View>
      );
    }
  };

  // Modified scroll to bottom to work with dynamic content
  const scrollToBottom = (animated = false) => {
    setTimeout(() => {
      if (messagesScrollRef.current) {
        messagesScrollRef.current.scrollToEnd({ animated });
      }
    }, animated ? 100 : 50);
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
      
      console.log('Opening attachment with URL:', fullFileUrl);
      console.log('Attachment details:', {
        fileUrl: fullFileUrl,
        filename: attachment.nom_fichier,
        type: attachment.type
      });
      
      // Open the modal with the MediaViewer component
      setMediaPreview({
        visible: true,
        media: {
          fileUrl: fullFileUrl,
          fileName: attachment.nom_fichier || 'Fichier',
          fileType: attachment.type || 'application/octet-stream'
        }
      });
    } catch (error) {
      console.error('Error opening attachment:', error);
      Alert.alert("Erreur", "Impossible d'ouvrir cette pièce jointe.");
    }
  };

  // Close MediaViewer modal
  const handleCloseMediaPreview = () => {
    setMediaPreview({
      visible: false,
      media: null
    });
  };

  if (!userId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No conversation selected</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGoBack}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      enabled
    >
      <View style={{ flex: 1 }}>
        {/* Header with user info */}
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            {renderAvatar(userInfo)}
            <Text style={styles.chatHeaderName}>
              {userInfo?.name || 'User'}
            </Text>
          </View>
        </View>
        
        {loadingMessages && isInitialLoad ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.accentPrimary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView 
              style={[
                styles.messagesContainer,
                keyboardVisible && Platform.OS === "android" && { marginBottom: 5 }
              ]}
              ref={messagesScrollRef}
              onContentSizeChange={() => !loadingMoreMessages && scrollToBottom(false)}
              keyboardShouldPersistTaps="handled"
              onScroll={handleScroll}
              scrollEventThrottle={16} // For smooth scroll detection
            >
              {/* Loading indicator for more messages */}
              {loadingMoreMessages && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={themeColors.accentPrimary} />
                  <Text style={styles.loadingMoreText}>Loading older messages...</Text>
                </View>
              )}
              
              {/* No more messages indicator */}
              {!hasMoreMessages && messages.length > 0 && (
                <View style={styles.noMoreMessagesContainer}>
                  <Text style={styles.noMoreMessagesText}>Beginning of conversation</Text>
                </View>
              )}
              
              {messages.length === 0 ? (
                <View style={styles.emptyMessages}>
                  <Text style={styles.emptyMessagesText}>No messages yet</Text>
                  <Text style={styles.emptyMessagesSubtext}>Start the conversation!</Text>
                </View>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.fk_expediteur === currentUserId;
                  const isAnimating = animatingMessages[msg.id_message_prive];
                  
                  // Determine if this message is the last message sent by the current user
                  const isLastOwnMessage = isOwn && 
                    messages.slice(index + 1).findIndex(m => m.fk_expediteur === currentUserId) === -1;
                  
                  return (
                    <View 
                      key={msg.id_message_prive || `temp-${Date.now()}-${Math.random()}`}
                      style={[
                        styles.messageWrapper,
                        isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper,
                        isAnimating && styles.animatingMessage
                      ]}
                    >
                      <View style={[
                        styles.messageBubble,
                        isOwn ? styles.ownMessage : styles.otherMessage
                      ]}>
                        <Text style={isOwn ? styles.ownMessageText : styles.otherMessageText}>
                          {msg.contenu}
                        </Text>

                        {/* Attachment handling */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <View style={styles.attachmentsContainer}>
                            {msg.attachments.map((attachment, i) => {
                              // Vérification si l'attachment existe et a bien une URL
                              if (!attachment || (!attachment.url && !attachment.presignedUrl)) {
                                console.warn(`Invalid attachment at index ${i}:`, attachment);
                                return null;
                              }

                              // Logging pour déboggage
                              console.log(`Rendering attachment ${i}:`, {
                                type: attachment.type,
                                url: attachment.url,
                                presignedUrl: attachment.presignedUrl,
                              });

                              // Construire l'URL complète de l'image
                              const fileUrl = attachment.url || attachment.presignedUrl;
                              const fullFileUrl = getFileURL(fileUrl);
                              console.log(`Full file URL: ${fullFileUrl}`);

                              // Handle image attachments
                              if (attachment.type?.startsWith('image/')) {
                                return (
                                  <TouchableOpacity 
                                    key={`${msg.id_message_prive}-attachment-${i}`} 
                                    style={styles.imageAttachment}
                                    onPress={() => handleOpenAttachment(attachment)}
                                  >
                                    <ImageComponent 
                                      uri={fullFileUrl} 
                                      style={styles.attachmentImage} 
                                      resizeMode="cover"
                                      fileName={attachment.nom_fichier || 'Image'}
                                    />
                                    <Text style={styles.imageCaption} numberOfLines={1}>
                                      {attachment.nom_fichier || 'Image'}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              } 
                              // Handle other file types
                              else {
                                return (
                                  <TouchableOpacity 
                                    key={`${msg.id_message_prive}-attachment-${i}`} 
                                    style={styles.fileAttachment}
                                    onPress={() => handleOpenAttachment(attachment)}
                                  >
                                    <View style={styles.fileIconContainer}>
                                      <Ionicons 
                                        name={getFileIcon(attachment.type)} 
                                        size={24} 
                                        color={themeColors.textPrimary} 
                                      />
                                    </View>
                                    <View style={styles.fileDetails}>
                                      <Text style={styles.fileName} numberOfLines={1}>
                                        {attachment.nom_fichier || 'Fichier'}
                                      </Text>
                                      <Text style={styles.fileSize}>
                                        {formatFileSize(attachment.taille_fichier)}
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

                        <View style={styles.messageInfoContainer}>
                          <Text style={isOwn ? styles.ownMessageTime : styles.otherMessageTime}>
                            {formatMessageDate(msg.date_creation || msg.date_envoi)}
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
                                  <Text style={styles.readStatusText}>Lu</Text>
                                </>
                              ) : (
                                <>
                                  <MaterialIcons 
                                    name="done" 
                                    size={14} 
                                    color={isOwn ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)"} 
                                  />
                                  <Text style={styles.sentStatusText}>Envoyé</Text>
                                </>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        <View style={[
          styles.inputContainer,
          keyboardVisible && Platform.OS === "android" && { paddingBottom: 5 }
        ]}>
          <TextInput 
            style={styles.messageInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            keyboardAppearance={isDarkMode ? 'dark' : 'light'}
            placeholderTextColor={isDarkMode ? '#777' : '#999'}
            selectionColor={isDarkMode ? themeColors.accentPrimary : undefined}
            cursorColor={isDarkMode ? themeColors.accentPrimary : undefined}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled
            ]}
            disabled={!newMessage.trim()}
            onPress={handleSendMessage}
          >
            <Ionicons name="send" size={24} color={themeColors.textOnAccent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Replace the old preview modal with the MediaViewer component */}
      <MediaViewer
        visible={mediaPreview.visible}
        media={mediaPreview.media}
        onClose={handleCloseMediaPreview}
        theme={themeColors}
      />
    </KeyboardAvoidingView>
  );
};

export default MessagesScreen;