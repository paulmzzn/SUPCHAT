import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSocket } from '../../context/SocketContext';
import env from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './WorkspaceDetailScreen.styles';

const WorkspaceDetailScreen = ({ route, navigation }) => {
  const { workspaceId, channelId, channelName, workspaceName } = route.params;
  const { socket, markChannelAsRead } = useSocket();
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const LIMIT = 30;
  const MAX_RETRY_ATTEMPTS = 3;
  
  const flatListRef = useRef(null);
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(true);
  const loadingTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    initializeChat();
    getCurrentUser();
  }, [workspaceId, channelId]);

  // Marquer le canal comme lu quand l'utilisateur consulte les messages - COMPATIBLE REACT NATIVE
  useEffect(() => {
    if (workspaceId && channelId && currentUserId) {
      console.log(`🔔 Marquage du canal ${channelId} comme lu dans le workspace ${workspaceId}`);
      
      // Variable pour suivre si on a déjà émis un événement
      let hasEmittedEvent = false;
      
      // Marquer immédiatement lors de l'ouverture
      markChannelAsRead(workspaceId, channelId);
      
      // Marquer aussi après un délai pour s'assurer que les messages sont chargés
      const timer = setTimeout(() => {
        markChannelAsRead(workspaceId, channelId);
        
        // Émettre un événement global UNE SEULE FOIS
        if (!hasEmittedEvent) {
          hasEmittedEvent = true;
          
          // Utiliser notre émetteur d'événements personnalisé au lieu de window.dispatchEvent
          if (global.AppEvents) {
            global.AppEvents.emit('forceUnreadCountsUpdate', { 
              timestamp: Date.now(),
              source: 'WorkspaceDetailScreen',
              channelId,
              workspaceId
            });
            
            console.log("🔔 Événement global émis pour mise à jour TabBar");
          }
        }
      }, 1500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [workspaceId, channelId, currentUserId]);

  // Rejoindre le canal et workspace pour les notifications temps réel
  useEffect(() => {
    if (socket && workspaceId && channelId && currentUserId) {
      console.log("🏢 WorkspaceDetail: Joining workspace and channel", { 
        workspaceId, 
        channelId, 
        currentUserId,
        socketId: socket.id 
      });
      
      // Rejoindre le workspace et le canal avec debug
      socket.emit('joinWorkspace', { workspaceId, userId: currentUserId });
      console.log("📡 WorkspaceDetail: Emitted joinWorkspace", { workspaceId, userId: currentUserId });
      
      socket.emit('joinCanal', { canalId: channelId, workspaceId });
      console.log("📡 WorkspaceDetail: Emitted joinCanal", { canalId: channelId, workspaceId });
      
      // Test de connectivité spécifique au canal
      socket.emit('testChannelConnection', { 
        channelId, 
        workspaceId, 
        userId: currentUserId,
        message: 'Testing from WorkspaceDetail mobile' 
      });
      
      // Écouter les événements de ce canal spécifiquement
      const handleMessage = (data) => {
        console.log("📨 WorkspaceDetail: Message received in channel", channelId, data);
        handleNewMessage(data);
      };

      const handleTyping = (data) => {
        console.log("⌨️ WorkspaceDetail: Typing event", data);
        if (data.canalId === channelId && data.userId !== currentUserId) {
          setTypingUsers(prev => {
            if (!prev.includes(data.userName)) {
              return [...prev, data.userName];
            }
            return prev;
          });
        }
      };

      const handleStopTyping = (data) => {
        console.log("⌨️ WorkspaceDetail: Stop typing event", data);
        if (data.canalId === channelId) {
          setTypingUsers(prev => prev.filter(user => user !== data.userName));
        }
      };

      socket.on('message', handleMessage);
      socket.on('typing', handleTyping);
      socket.on('stopTyping', handleStopTyping);
      socket.on('connect', handleReconnect);
      socket.on('disconnect', handleDisconnect);
      
      return () => {
        console.log("🚪 WorkspaceDetail: Leaving channel", channelId);
        socket.emit('leaveCanal', { canalId: channelId, workspaceId });
        socket.off('message', handleMessage);
        socket.off('typing', handleTyping);
        socket.off('stopTyping', handleStopTyping);
        socket.off('connect', handleReconnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [socket, workspaceId, channelId, currentUserId]);

  const getCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/users/verify-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUserId(userData.user_id);
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
    }
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      setMessages([]);
      setOffset(0);
      setHasMoreMessages(true);
      await fetchChannelMessages(true);
    } catch (error) {
      console.error('Erreur initialisation chat:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les messages'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = useCallback(() => {
    setConnectionError(false);
    setRetryCount(0);
    if (!loading) {
      initializeChat();
    }
  }, [loading]);

  const handleDisconnect = useCallback(() => {
    setConnectionError(true);
  }, []);

  const fetchChannelMessages = useCallback(async (isInitial = false, retryAttempt = 0) => {
    if (!isInitial && (loadingMore || !hasMoreMessages)) return;
    
    try {
      if (!isInitial) {
        setLoadingMore(true);
      }

      const token = await AsyncStorage.getItem('token');
      const currentOffset = isInitial ? 0 : offset;
      
      const response = await fetch(`${env.API_URL}/api/messages/canal/${channelId}?limit=${LIMIT}&offset=${currentOffset}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.length === 0) {
          setHasMoreMessages(false);
          return;
        }

        const sortedData = data.sort((a, b) => 
          new Date(b.date_creation) - new Date(a.date_creation)
        );
        
        if (isInitial) {
          setMessages(sortedData);
          setShouldScrollToEnd(true);
        } else {
          setMessages(prev => [...prev, ...sortedData]);
        }
        
        setOffset(currentOffset + data.length);
        setHasMoreMessages(data.length >= LIMIT);
        setConnectionError(false);
        setRetryCount(0);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur messages:', error);
      
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          fetchChannelMessages(isInitial, retryAttempt + 1);
        }, Math.pow(2, retryAttempt) * 1000);
        setRetryCount(retryAttempt + 1);
      } else {
        setConnectionError(true);
        Toast.show({
          type: 'error',
          text1: 'Erreur de connexion',
          text2: 'Impossible de charger les messages. Vérifiez votre connexion.'
        });
      }
    } finally {
      if (!isInitial) {
        loadingTimeoutRef.current = setTimeout(() => {
          setLoadingMore(false);
        }, 300);
      }
    }
  }, [channelId, offset, loadingMore, hasMoreMessages]);

  const handleNewMessage = useCallback((message) => {
    if (message.fk_canal === channelId) {
      setMessages(prev => [message, ...prev]);
      setShouldScrollToEnd(true);
    }
  }, [channelId]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket) return;
    
    const messageData = {
      user_id: currentUserId,
      canal_id: channelId,
      workspace_id: workspaceId,
      content: newMessage.trim()
    };
    
    socket.emit('message', messageData);
    socket.emit('stopTyping', { canalId: channelId, userId: currentUserId });
    setNewMessage('');
    setIsTyping(false);
  }, [newMessage, socket, currentUserId, channelId, workspaceId]);

  const handleInputChange = useCallback((text) => {
    setNewMessage(text);
    
    if (socket && text.trim() && !isTyping) {
      setIsTyping(true);
      socket.emit('typing', { canalId: channelId, userId: currentUserId });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && isTyping) {
        socket.emit('stopTyping', { canalId: channelId, userId: currentUserId });
        setIsTyping(false);
      }
    }, 2000);
  }, [socket, isTyping, channelId, currentUserId]);

  const renderAvatar = useCallback((user) => {
    if (!user) return <View style={styles.avatar} />;

    if (user.photo_de_profil || user.avatar) {
      return (
        <Image
          source={{ uri: user.photo_de_profil || user.avatar }}
          style={styles.avatar}
          onError={(e) => console.log("Avatar image failed to load")}
        />
      );
    } else {
      return (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {(user.nom || user.name || "U")[0].toUpperCase()}
          </Text>
        </View>
      );
    }
  }, [styles]);

  const renderAvatarInBubble = useCallback((user) => {
    if (!user) return <View style={styles.avatarInBubble} />;

    if (user.photo_de_profil || user.avatar) {
      return (
        <Image
          source={{ uri: user.photo_de_profil || user.avatar }}
          style={styles.avatarInBubble}
          onError={(e) => console.log("Avatar image failed to load")}
        />
      );
    } else {
      return (
        <View style={styles.avatarPlaceholderInBubble}>
          <Text style={styles.avatarTextInBubble}>
            {(user.nom || user.name || "U")[0].toUpperCase()}
          </Text>
        </View>
      );
    }
  }, [styles]);

  const groupedMessages = useMemo(() => {
    const grouped = [];
    let currentGroup = null;
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.date_creation);
      const shouldGroup = currentGroup && 
        currentGroup.userId === message.fk_utilisateur &&
        (messageDate - currentGroup.lastMessageTime) < 5 * 60 * 1000;
      
      if (shouldGroup) {
        currentGroup.messages.push(message);
        currentGroup.lastMessageTime = messageDate;
      } else {
        currentGroup = {
          id: message.id_message,
          userId: message.fk_utilisateur,
          userName: message.nom,
          userAvatar: message.photo_de_profil,
          messages: [message],
          lastMessageTime: messageDate,
          isOwn: message.fk_utilisateur === currentUserId
        };
        grouped.push(currentGroup);
      }
    });
    
    return grouped;
  }, [messages, currentUserId]);

  const renderMessageGroup = useCallback(({ item: group }) => {
    const chronologicalMessages = [...group.messages].reverse();
    
    return (
      <View style={[
        styles.messageGroupContainer,
        group.isOwn ? styles.ownMessageGroup : styles.otherMessageGroup
      ]}>
        {chronologicalMessages.map((message, index) => {
          const isFirstMessage = index === 0;
          const isLastMessage = index === chronologicalMessages.length - 1;
          
          return (
            <View
              key={message.id_message}
              style={[
                styles.messageContainer,
                group.isOwn ? styles.ownMessage : styles.otherMessage,
                isFirstMessage && styles.firstMessage,
                isLastMessage && styles.lastMessage,
                { marginVertical: 2 }
              ]}
            >
              {!group.isOwn && isFirstMessage && (
                <View style={styles.messageHeaderInBubble}>
                  {renderAvatarInBubble({ 
                    nom: group.userName, 
                    photo_de_profil: group.userAvatar 
                  })}
                  <View style={styles.messageHeaderInfo}>
                    <Text style={styles.messageAuthor} numberOfLines={1}>
                      {group.userName}
                    </Text>
                    <Text style={styles.messageTime}>
                      {new Date(message.date_creation).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              )}
              
              <Text style={[
                styles.messageText,
                group.isOwn ? styles.ownMessageText : styles.otherMessageText
              ]}>
                {message.contenu}
              </Text>
              
              {group.isOwn && isLastMessage && (
                <Text style={styles.ownMessageTime}>
                  {new Date(message.date_creation).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  }, [styles, renderAvatarInBubble]);

  const renderTypingIndicator = useCallback(() => {
    if (typingUsers.length === 0) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, styles.typingDot1]} />
          <View style={[styles.typingDot, styles.typingDot2]} />
          <View style={[styles.typingDot, styles.typingDot3]} />
        </View>
        <Text style={styles.typingText}>
          {typingUsers.length === 1 
            ? `${typingUsers[0]} est en train d'écrire...`
            : `${typingUsers.length} personnes écrivent...`
          }
        </Text>
      </View>
    );
  }, [typingUsers, styles]);

  const renderConnectionError = useCallback(() => {
    if (!connectionError) return null;
    
    return (
      <View style={styles.connectionErrorContainer}>
        <Ionicons name="wifi-outline" size={20} color={themeColors.errorText} />
        <Text style={styles.connectionErrorText}>
          Connexion perdue {retryCount > 0 && `(Tentative ${retryCount}/${MAX_RETRY_ATTEMPTS})`}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => initializeChat()}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }, [connectionError, retryCount, styles, themeColors]);

  const keyExtractorGroup = useCallback((item) => item.id.toString(), []);

  const renderListFooter = useCallback(() => {
    if (!hasMoreMessages && messages.length > 0) {
      return (
        <View style={styles.endOfMessagesContainer}>
          <Text style={styles.endOfMessagesText}>Début de la conversation</Text>
        </View>
      );
    }
    
    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={themeColors.accentPrimary} />
          <Text style={styles.loadingMoreText}>Chargement...</Text>
        </View>
      );
    }
    
    return null;
  }, [hasMoreMessages, loadingMore, messages.length, styles, themeColors]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMoreMessages && messages.length > 0) {
      fetchChannelMessages(false);
    }
  }, [loadingMore, hasMoreMessages, messages.length, fetchChannelMessages]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={styles.loadingText}>Chargement des messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.workspaceName} numberOfLines={1}>
            # {channelName}
          </Text>
          <Text style={styles.activeChannelName} numberOfLines={1}>
            {workspaceName}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => navigation.navigate('WorkspaceSettings', { workspaceId, workspaceName })}
        >
          <Ionicons name="settings-outline" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
      </View>

      {renderConnectionError()}

      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        renderItem={renderMessageGroup}
        keyExtractor={keyExtractorGroup}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={true}
        inverted={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={8}
        initialNumToRender={12}
        ListFooterComponent={renderListFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 5,
        }}
      />
      
      {renderTypingIndicator()}
      
      <View style={styles.messageInputContainer}>
        <TextInput
          ref={messageInputRef}
          style={styles.messageInput}
          value={newMessage}
          onChangeText={handleInputChange}
          placeholder={`Message dans #${channelName}`}
          placeholderTextColor={themeColors.textPlaceholder}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
          enablesReturnKeyAutomatically={true}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={20} color={themeColors.textOnAccent} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default WorkspaceDetailScreen;
