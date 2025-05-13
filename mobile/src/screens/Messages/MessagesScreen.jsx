import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, Image, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
  Keyboard
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStyles } from './MessagesScreen.styles';
import { useTheme } from '../../theme/ThemeContext';
import io from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.119:3000';

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
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesScrollRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Socket connection setup
  useEffect(() => {
    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          return;
        }
        
        console.log('Connecting to socket at:', API_URL);
        
        const newSocket = io(API_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
        });
        
        newSocket.on('connect', () => {
          console.log('Socket connected:', newSocket.id);
          newSocket.emit('joinPrivate');
        });
        
        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setError('Failed to connect to messaging server');
        });
        
        setSocket(newSocket);
        
        // Check user identity from token
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.id) {
              setCurrentUserId(payload.id);
            }
          }
        } catch (e) {
          console.error('Error parsing token:', e);
        }
        
        return () => {
          if (newSocket) {
            newSocket.disconnect();
          }
        };
      } catch (error) {
        console.error('Error connecting socket:', error);
        setError('Failed to initialize messaging');
      }
    };
    
    connectSocket();
  }, []);

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

  // Handle incoming messages
  useEffect(() => {
    if (!socket || !currentUserId || !userId) return;
    
    const handlePrivateMessage = async (msg) => {
      console.log('Received message:', msg);
      
      // Update messages if relevant to current conversation
      if (msg.fk_expediteur === userId || msg.fk_destinataire === userId) {
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
        
        scrollToBottom();
      }
    };
    
    socket.on('privateMessage', handlePrivateMessage);
    
    return () => {
      socket.off('privateMessage', handlePrivateMessage);
    };
  }, [socket, userId, currentUserId]);

  // Fetch user info and messages when userId changes
  useEffect(() => {
    if (userId) {
      fetchUserInfo(userId);
      fetchMessages(userId);
    }
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

  // Fetch messages for a conversation
  const fetchMessages = async (userId) => {
    try {
      setLoadingMessages(true);
      
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/private-messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Messages:', data);
      setMessages(data);
      
      // Mark messages as read
      markMessagesAsRead(data);
      
    } catch (e) {
      console.error('Error fetching messages:', e);
      setError('Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = (msgs) => {
    if (!socket || !msgs?.length || !userId || !currentUserId) return;
    
    const unreadMessages = msgs.filter(m => 
      m.fk_expediteur !== currentUserId && !m.date_lecture
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        socket.emit('readPrivateMessage', {
          id: msg.id_message_prive,
          senderId: msg.fk_expediteur,
          recipientId: currentUserId
        });
      });
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !userId || !currentUserId) return;
    
    try {
      const tempId = Date.now().toString();
      
      // Optimistic message
      const optimisticMessage = {
        id_message_prive: `temp-${tempId}`,
        contenu: newMessage,
        fk_expediteur: currentUserId,
        fk_destinataire: userId,
        date_envoi: new Date().toISOString(),
        isOptimistic: true
      };
      
      // Add to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Send via socket
      if (socket) {
        socket.emit('privateMessage', {
          destinataireId: userId,
          contenu: newMessage,
          tempId
        });
      } else {
        // Fallback to REST API
        sendMessageViaAPI(newMessage);
      }
      
      setNewMessage('');
      scrollToBottom();
      
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

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesScrollRef.current) {
        messagesScrollRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  // Ensure scrolling to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle going back to conversation list
  const handleGoBack = () => {
    navigation.goBack();
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
        
        {loadingMessages ? (
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
              onContentSizeChange={() => scrollToBottom()}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 ? (
                <View style={styles.emptyMessages}>
                  <Text style={styles.emptyMessagesText}>No messages yet</Text>
                  <Text style={styles.emptyMessagesSubtext}>Start the conversation!</Text>
                </View>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.fk_expediteur === currentUserId;
                  
                  // Determine if this message is the last message sent by the current user
                  const isLastOwnMessage = isOwn && 
                    messages.slice(index + 1).findIndex(m => m.fk_expediteur === currentUserId) === -1;
                  
                  return (
                    <View 
                      key={msg.id_message_prive || `temp-${Date.now()}-${Math.random()}`}
                      style={[
                        styles.messageWrapper,
                        isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper
                      ]}
                    >
                      <View style={[
                        styles.messageBubble,
                        isOwn ? styles.ownMessage : styles.otherMessage
                      ]}>
                        <Text style={isOwn ? styles.ownMessageText : styles.otherMessageText}>
                          {msg.contenu}
                        </Text>
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
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={24} color={themeColors.textOnAccent} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default MessagesScreen;