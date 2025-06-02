import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSocket } from '../../context/SocketContext';
import env from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './WorkspaceDetailScreen.styles';
import MessageInput from '../../components/MessageInput';
import AttachmentViewer from '../../components/AttachmentViewer/AttachmentViewer';
import StrawpollCreationModal from '../../components/Strawpoll/StrawpollCreationModal';
import StrawpollMessageCard from '../../components/Strawpoll/StrawpollMessageCard';
import StrawpollResultsModal from '../../components/Strawpoll/StrawpollResultsModal';
import ContextMenu from '../../components/Messages/ContextMenu';
import EmojiPicker from '../../components/Messages/EmojiPicker';
import EditMessageModal from '../../components/Messages/EditMessageModal';
import { parseStrawpollsInMessage } from '../../utils/strawpollUtils';

// Constantes pour l'utilisateur système
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000003";
const SYSTEM_USERNAME = "Système";

const WorkspaceDetailScreen = ({ route, navigation }) => {
  const { workspaceId, channelId, channelName, workspaceName } = route.params;
  
  // Debug log pour voir les paramètres reçus
  console.log("WorkspaceDetailScreen params:", {
    workspaceId,
    channelId, 
    channelName,
    workspaceName
  });
  
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
  
  // États pour l'AttachmentViewer
  const [attachmentViewerVisible, setAttachmentViewerVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  
  // État pour la boîte à outils
  const [toolboxVisible, setToolboxVisible] = useState(false);
  
  // État pour le modal de création de strawpoll
  const [strawpollModalVisible, setStrawpollModalVisible] = useState(false);

  // États pour les sondages Strawpoll
  const [strawpollResultsModalVisible, setStrawpollResultsModalVisible] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState(null);

  // États pour les fonctionnalités de messages avancées
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    message: null,
    position: { x: 0, y: 0 },
    isOwnMessage: false,
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editMessageContent, setEditMessageContent] = useState("");

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
      content: newMessage.trim(),
      reply_to: replyingTo ? replyingTo.id_message : null,
    };
    
    socket.emit('message', messageData);
    socket.emit('stopTyping', { canalId: channelId, userId: currentUserId });
    setNewMessage('');
    setIsTyping(false);
    setReplyingTo(null);
  }, [newMessage, socket, currentUserId, channelId, workspaceId, replyingTo]);

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
      // Vérifier si c'est un message système
      const isSystemMessage = message.fk_utilisateur === SYSTEM_USER_ID || 
                              message.nom === SYSTEM_USERNAME ||
                              message.is_system_message === true;
      
      if (isSystemMessage) {
        // Les messages système ne sont pas groupés, chacun est affiché séparément
        grouped.push({
          id: message.id_message,
          userId: SYSTEM_USER_ID,
          userName: SYSTEM_USERNAME,
          userAvatar: null,
          messages: [message],
          lastMessageTime: new Date(message.date_creation),
          isOwn: false,
          isSystem: true
        });
        currentGroup = null; // Reset le groupe actuel pour éviter de grouper avec le message suivant
      } else {
        const messageDate = new Date(message.date_creation);
        const shouldGroup = currentGroup && 
          currentGroup.userId === message.fk_utilisateur &&
          !currentGroup.isSystem && // Ne pas grouper avec un message système
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
            isOwn: message.fk_utilisateur === currentUserId,
            isSystem: false
          };
          grouped.push(currentGroup);
        }
      }
    });
    
    return grouped;
  }, [messages, currentUserId]);

  const renderMessageGroup = useCallback(({ item: group }) => {
    const chronologicalMessages = [...group.messages].reverse();
    
    // Si c'est un message système, utiliser un rendu spécial
    if (group.isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          {chronologicalMessages.map((message) => (
            <View key={message.id_message} style={styles.systemMessageBubble}>
              <Text style={styles.systemMessageText}>
                {message.contenu}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    
    // Rendu normal pour les messages utilisateur
    return (
      <View style={[
        styles.messageGroupContainer,
        group.isOwn ? styles.ownMessageGroup : styles.otherMessageGroup
      ]}>
        {chronologicalMessages.map((message, index) => {
          const isFirstMessage = index === 0;
          const isLastMessage = index === chronologicalMessages.length - 1;
          
          // Parser le contenu pour détecter les fichiers ou sondages
          const fileData = parseFileContent(message.contenu);
          const isStrawpoll = message.contenu && message.contenu.includes('[strawpoll:');
          
          return (
            <TouchableOpacity
              key={message.id_message}
              onLongPress={(event) => handleLongPressMessage(message, event)}
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
              
              {/* Affichage de la réponse si c'est une réponse à un autre message */}
              {message.reply_to && (
                <View style={styles.messageReplyContainer}>
                  <Text style={styles.messageReplyText}>
                    Réponse à {message.reply_to_user_name || "Utilisateur"}
                  </Text>
                  <Text style={styles.messageReplyContent} numberOfLines={2}>
                    {message.reply_to_content || "Message"}
                  </Text>
                </View>
              )}
              
              {/* Affichage du contenu selon le type */}
              {isStrawpoll ? (
                // C'est un sondage
                <StrawpollMessageCard
                  messageContent={message.contenu}
                  theme={themeColors}
                  onVote={handleStrawpollVote}
                  onViewResults={handleStrawpollViewResults}
                  isOwn={group.isOwn}
                />
              ) : fileData ? (
                // C'est un fichier
                fileData.isImage ? (
                  // Prévisualisation d'image
                  <TouchableOpacity 
                    style={[
                      styles.imageAttachment,
                      { backgroundColor: group.isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                    ]}
                    onPress={() => handleOpenAttachment(fileData)}
                  >
                    <Image
                      source={{ 
                        uri: fileData.fileUrl.startsWith('http') 
                          ? fileData.fileUrl 
                          : `https://s3-supchat.s3.fr-par.scw.cloud/${fileData.fileUrl}`
                      }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                      onError={(e) => {
                        console.log('Erreur chargement image:', e.nativeEvent.error);
                      }}
                    />
                    <View style={styles.imageOverlay}>
                      <Ionicons
                        name="eye-outline"
                        size={20}
                        color="rgba(255,255,255,0.9)"
                      />
                    </View>
                    {fileData.fileName && (
                      <View style={[
                        styles.imageCaptionContainer,
                        { backgroundColor: group.isOwn ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)' }
                      ]}>
                        <Text 
                          style={[
                            styles.imageCaption,
                            { color: group.isOwn ? '#FFFFFF' : '#000000' }
                          ]}
                          numberOfLines={1}
                        >
                          {fileData.fileName}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  // Fichier non-image (affichage normal)
                  <TouchableOpacity 
                    style={[
                      styles.fileAttachment,
                      { backgroundColor: group.isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                    ]}
                    onPress={() => handleOpenAttachment(fileData)}
                  >
                    <View style={styles.fileIconContainer}>
                      <Ionicons
                        name={getFileIcon(fileData.fileType)}
                        size={24}
                        color={group.isOwn ? '#FFFFFF' : themeColors.textPrimary}
                      />
                    </View>
                    <View style={styles.fileDetails}>
                      <Text
                        style={[
                          styles.fileName,
                          { color: group.isOwn ? '#FFFFFF' : themeColors.textPrimary }
                        ]}
                        numberOfLines={1}
                      >
                        {fileData.fileName}
                      </Text>
                      {fileData.fileSize && (
                        <Text 
                          style={[
                            styles.fileSize,
                            { color: group.isOwn ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary }
                          ]}
                        >
                          {formatFileSize(fileData.fileSize)}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name="eye-outline"
                      size={20}
                      color={group.isOwn ? 'rgba(255,255,255,0.8)' : themeColors.accentPrimary}
                    />
                  </TouchableOpacity>
                )
              ) : (
                // C'est un message texte normal
                <Text style={[
                  styles.messageText,
                  group.isOwn ? styles.ownMessageText : styles.otherMessageText
                ]}>
                  {message.contenu}
                </Text>
              )}
              
              {group.isOwn && isLastMessage && (
                <Text style={styles.ownMessageTime}>
                  {new Date(message.date_creation).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              )}
              
              {/* Affichage des réactions */}
              {message.reactions && message.reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                  {message.reactions.map((reaction, index) => (
                    <TouchableOpacity
                      key={`${reaction.reaction_type}-${index}`}
                      style={[
                        styles.reactionBubble,
                        reaction.user_reacted && styles.userReactedBubble
                      ]}
                      onPress={() => {
                        if (reaction.user_reacted) {
                          handleRemoveReaction(message, reaction.reaction_type);
                        } else {
                          handleEmojiSelect(reaction.reaction_type);
                        }
                      }}
                    >
                      <Text style={styles.reactionEmoji}>{reaction.reaction_type}</Text>
                      <Text style={styles.reactionCount}>{reaction.count}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [styles, renderAvatarInBubble, parseFileContent, handleOpenAttachment, getFileIcon, formatFileSize, themeColors, handleStrawpollVote, handleStrawpollViewResults, handleLongPressMessage, handleRemoveReaction, handleEmojiSelect]);

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

  // Fonction pour parser le contenu des fichiers
  const parseFileContent = useCallback((content) => {
    if (!content) return null;
    
    // Vérifier si le contenu ressemble à du JSON avant de tenter le parsing
    if (typeof content === 'string') {
      // Si le contenu ne commence pas par '{' ou '[', ce n'est probablement pas du JSON
      const trimmedContent = content.trim();
      if (!trimmedContent.startsWith('{') && !trimmedContent.startsWith('[')) {
        return null; // Ce n'est pas un fichier, c'est du texte normal
      }
    }
    
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      if (parsed && parsed.type === 'file') {
        return {
          fileName: parsed.fileName,
          fileUrl: parsed.fileUrl,
          fileSize: parsed.fileSize,
          fileType: parsed.fileType,
          isImage: parsed.isImage || false
        };
      }
    } catch (error) {
      // Supprimer le log d'erreur pour éviter le spam dans la console
      // Les messages texte normaux vont générer des erreurs ici, c'est normal
      return null;
    }
    
    return null;
  }, []);

  // Fonction pour ouvrir l'AttachmentViewer
  const handleOpenAttachment = useCallback((fileData) => {
    if (!fileData) return;
    
    // Construire l'URL complète pour S3
    const baseUrl = 'https://s3-supchat.s3.fr-par.scw.cloud';
    const fullUrl = fileData.fileUrl.startsWith('http') 
      ? fileData.fileUrl 
      : `${baseUrl}/${fileData.fileUrl}`;
    
    setSelectedAttachment({
      fileName: fileData.fileName,
      fileUrl: fullUrl,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize
    });
    setAttachmentViewerVisible(true);
  }, []);

  // Fonction pour fermer l'AttachmentViewer
  const handleCloseAttachmentViewer = useCallback(() => {
    setAttachmentViewerVisible(false);
    setSelectedAttachment(null);
  }, []);

  // Fonction pour obtenir l'icône du fichier
  const getFileIcon = useCallback((fileType) => {
    if (!fileType) return 'document-outline';
    
    if (fileType.startsWith('image/')) return 'image-outline';
    if (fileType === 'application/pdf') return 'document-text-outline';
    if (fileType.startsWith('video/')) return 'videocam-outline';
    if (fileType.startsWith('audio/')) return 'musical-notes-outline';
    if (fileType.includes('word')) return 'document-outline';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'grid-outline';
    
    return 'document-outline';
  }, []);

  // Fonction pour formater la taille du fichier
  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return '';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Fonctions pour la boîte à outils
  const handleCreateStrawpoll = useCallback(() => {
    setToolboxVisible(false);
    setStrawpollModalVisible(true);
  }, []);

  const handleCreateReminder = useCallback(() => {
    setToolboxVisible(false);
    // TODO: Naviguer vers la création de rappel
    Alert.alert('Rappel', 'Fonctionnalité de création de rappel à venir !');
  }, []);

  // Fonctions pour Google Drive
  const handleOpenGoogleDrive = useCallback(async () => {
    setToolboxVisible(false);
    try {
      const googleDriveUrl = 'https://drive.google.com';
      const supported = await Linking.canOpenURL(googleDriveUrl);
      if (supported) {
        await Linking.openURL(googleDriveUrl);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible d\'ouvrir Google Drive'
        });
      }
    } catch (error) {
      console.error('Erreur ouverture Google Drive:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ouvrir Google Drive'
      });
    }
  }, []);

  const handleImportFromGoogleDrive = useCallback(() => {
    setToolboxVisible(false);
    Alert.alert(
      'Importer depuis Google Drive',
      'Cette fonctionnalité permet d\'importer des fichiers directement depuis votre Google Drive vers le canal.',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Ouvrir Google Drive',
          onPress: handleOpenGoogleDrive
        }
      ]
    );
  }, [handleOpenGoogleDrive]);

  // Fonctions pour la gestion des sondages Strawpoll
  const handleStrawpollVote = useCallback(async (pollId, pollUrl) => {
    try {
      if (pollUrl) {
        const supported = await Linking.canOpenURL(pollUrl);
        if (supported) {
          await Linking.openURL(pollUrl);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: 'Impossible d\'ouvrir le lien du sondage'
          });
        }
      }
    } catch (error) {
      console.error('Erreur ouverture sondage:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ouvrir le sondage'
      });
    }
  }, []);

  const handleStrawpollViewResults = useCallback((pollId) => {
    setSelectedPollId(pollId);
    setStrawpollResultsModalVisible(true);
  }, []);

  const handleCloseStrawpollResults = useCallback(() => {
    setStrawpollResultsModalVisible(false);
    setSelectedPollId(null);
  }, []);

  // Fonctions pour la gestion des messages avancées (menu contextuel, réactions, réponse, édition, suppression)
  
  // Fonction pour gérer le long press sur un message
  const handleLongPressMessage = useCallback((message, event) => {
    if (!message || message.fk_utilisateur === SYSTEM_USER_ID) return; // Pas de menu contextuel pour les messages système
    
    console.log("Long press detected on message:", message.id_message);
    
    const isOwnMessage = message.fk_utilisateur === currentUserId;
    const { pageX, pageY } = event.nativeEvent || event;
    
    setContextMenu({
      visible: true,
      message: message,
      position: { x: pageX || 0, y: pageY || 0 },
      isOwnMessage,
    });
    
    setSelectedMessageForReaction(message);
  }, [currentUserId]);

  // Fonction pour fermer le menu contextuel
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      message: null,
      position: { x: 0, y: 0 },
      isOwnMessage: false,
    });
  }, []);

  // Fonction pour répondre à un message
  const handleReplyMessage = useCallback(() => {
    if (!contextMenu.message) return;
    
    setReplyingTo(contextMenu.message);
    handleCloseContextMenu();
    
    // Focus sur l'input de message
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 100);
  }, [contextMenu.message, handleCloseContextMenu]);

  // Fonction pour annuler une réponse
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Fonction pour éditer un message
  const handleEditMessage = useCallback(() => {
    if (!contextMenu.message || !contextMenu.isOwnMessage) return;
    
    setEditingMessage(contextMenu.message);
    setEditMessageContent(contextMenu.message.contenu);
    handleCloseContextMenu();
  }, [contextMenu.message, contextMenu.isOwnMessage, handleCloseContextMenu]);

  // Fonction pour sauvegarder l'édition d'un message
  const handleSaveEdit = useCallback(() => {
    if (!editingMessage || !editMessageContent.trim() || !socket) return;
    
    // Émettre l'événement de modification via socket
    socket.emit("editChannelMessage", {
      messageId: editingMessage.id_message,
      contenu: editMessageContent.trim(),
      canalId: channelId,
      workspaceId: workspaceId
    });
    
    // Mise à jour optimiste de l'UI
    setMessages(prev => 
      prev.map(msg => 
        msg.id_message === editingMessage.id_message
          ? { ...msg, contenu: editMessageContent.trim() }
          : msg
      )
    );
    
    // Réinitialiser l'état d'édition
    setEditingMessage(null);
    setEditMessageContent("");
  }, [editingMessage, editMessageContent, socket, channelId, workspaceId]);

  // Fonction pour annuler l'édition
  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditMessageContent("");
  }, []);

  // Fonction pour supprimer un message
  const handleDeleteMessage = useCallback(() => {
    if (!contextMenu.message || !contextMenu.isOwnMessage || !socket) return;
    
    Alert.alert(
      "Supprimer le message",
      "Êtes-vous sûr de vouloir supprimer ce message ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            // Émettre l'événement de suppression via socket
            socket.emit("deleteChannelMessage", {
              messageId: contextMenu.message.id_message,
              canalId: channelId,
              workspaceId: workspaceId
            });
            
            // Mise à jour optimiste de l'UI
            setMessages(prev => 
              prev.map(msg => 
                msg.id_message === contextMenu.message.id_message
                  ? { ...msg, is_deleted: true, contenu: "[Message supprimé]" }
                  : msg
              )
            );
            
            handleCloseContextMenu();
          },
        },
      ]
    );
  }, [contextMenu.message, contextMenu.isOwnMessage, socket, channelId, workspaceId, handleCloseContextMenu]);

  // Fonction pour ouvrir le sélecteur d'emoji
  const handleAddReaction = useCallback(() => {
    setSelectedMessageForReaction(contextMenu.message);
    setShowEmojiPicker(true);
    handleCloseContextMenu();
  }, [contextMenu.message, handleCloseContextMenu]);

  // Fonction pour sélectionner un emoji
  const handleEmojiSelect = useCallback((emoji) => {
    if (!selectedMessageForReaction || !socket) {
      console.error("No message selected for reaction or socket not available");
      return;
    }
    
    console.log("Adding reaction to message:", selectedMessageForReaction.id_message);
    
    // Émettre l'événement d'ajout de réaction via socket
    socket.emit("addChannelMessageReaction", {
      messageId: selectedMessageForReaction.id_message,
      reaction: emoji,
      canalId: channelId,
      workspaceId: workspaceId
    });
    
    // Mise à jour optimiste de l'UI (optionnel)
    const messageId = selectedMessageForReaction.id_message;
    const existingReactions = selectedMessageForReaction.reactions || [];
    const hasReaction = existingReactions.find(r => r.reaction_type === emoji);
    
    if (!hasReaction) {
      const updatedReactions = [
        ...existingReactions,
        {
          reaction_type: emoji,
          count: 1,
          user_reacted: true,
        }
      ];
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id_message === messageId
            ? { ...msg, reactions: updatedReactions }
            : msg
        )
      );
    }
    
    setShowEmojiPicker(false);
    setSelectedMessageForReaction(null);
  }, [selectedMessageForReaction, socket, channelId, workspaceId]);

  // Fonction pour supprimer une réaction
  const handleRemoveReaction = useCallback((message, emoji) => {
    if (!socket) return;
    
    console.log("Removing reaction from message:", message.id_message);
    
    // Émettre l'événement de suppression de réaction via socket
    socket.emit("removeChannelMessageReaction", {
      messageId: message.id_message,
      reaction: emoji,
      canalId: channelId,
      workspaceId: workspaceId
    });
    
    // Mise à jour optimiste de l'UI
    setMessages(prev => 
      prev.map(msg => {
        if (msg.id_message === message.id_message) {
          const updatedReactions = (msg.reactions || []).filter(r => r.reaction_type !== emoji);
          return { ...msg, reactions: updatedReactions };
        }
        return msg;
      })
    );
  }, [socket, channelId, workspaceId]);

  // Rendu du modal de la boîte à outils
  const renderToolboxModal = useCallback(() => {
    return (
      <Modal
        visible={toolboxVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setToolboxVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setToolboxVisible(false)}
        >
          <View style={styles.toolboxModal}>
            <View style={styles.toolboxHeader}>
              <Text style={styles.toolboxTitle}>Boîte à outils</Text>
              <TouchableOpacity 
                onPress={() => setToolboxVisible(false)}
                style={styles.toolboxCloseButton}
              >
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.toolboxContent}>
              {/* Section Sondages */}
              <Text style={styles.toolboxSectionTitle}>Sondages</Text>
              <TouchableOpacity 
                style={styles.toolboxOption}
                onPress={handleCreateStrawpoll}
              >
                <View style={styles.toolboxOptionIcon}>
                  <Ionicons name="bar-chart-outline" size={24} color={themeColors.accentPrimary} />
                </View>
                <View style={styles.toolboxOptionContent}>
                  <Text style={styles.toolboxOptionTitle}>Créer un Strawpoll</Text>
                  <Text style={styles.toolboxOptionDescription}>
                    Créer un sondage pour recueillir l'avis des membres
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>

              {/* Section Rappels */}
              <Text style={styles.toolboxSectionTitle}>Rappels</Text>
              <TouchableOpacity 
                style={styles.toolboxOption}
                onPress={handleCreateReminder}
              >
                <View style={styles.toolboxOptionIcon}>
                  <Ionicons name="alarm-outline" size={24} color={themeColors.accentPrimary} />
                </View>
                <View style={styles.toolboxOptionContent}>
                  <Text style={styles.toolboxOptionTitle}>Créer un rappel</Text>
                  <Text style={styles.toolboxOptionDescription}>
                    Programmer un rappel pour l'équipe ou pour vous-même
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>

              {/* Section Google Drive */}
              <Text style={styles.toolboxSectionTitle}>Google Drive</Text>
              <TouchableOpacity 
                style={styles.toolboxOption}
                onPress={handleOpenGoogleDrive}
              >
                <View style={styles.toolboxOptionIcon}>
                  <Ionicons name="cloud-outline" size={24} color={themeColors.accentPrimary} />
                </View>
                <View style={styles.toolboxOptionContent}>
                  <Text style={styles.toolboxOptionTitle}>Ouvrir Google Drive</Text>
                  <Text style={styles.toolboxOptionDescription}>
                    Accéder à vos fichiers sur Google Drive
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolboxOption}
                onPress={handleImportFromGoogleDrive}
              >
                <View style={styles.toolboxOptionIcon}>
                  <Ionicons name="cloud-download-outline" size={24} color={themeColors.accentPrimary} />
                </View>
                <View style={styles.toolboxOptionContent}>
                  <Text style={styles.toolboxOptionTitle}>Importer depuis Google Drive</Text>
                  <Text style={styles.toolboxOptionDescription}>
                    Importer des fichiers directement depuis Google Drive
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }, [toolboxVisible, themeColors, handleCreateStrawpoll, handleCreateReminder, handleOpenGoogleDrive, handleImportFromGoogleDrive, styles]);

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
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => setToolboxVisible(true)}
          >
            <Ionicons name="construct-outline" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => navigation.navigate('WorkspaceSettings', { workspaceId, workspaceName })}
          >
            <Ionicons name="settings-outline" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
        </View>
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
      
      <MessageInput 
        value={newMessage}
        onChangeText={handleInputChange}
        onSend={sendMessage}
        placeholder={`Message dans #${channelName}`}
        inputRef={messageInputRef}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        // Propriétés pour l'upload de fichiers dans un workspace
        uploadType="workspace-message"
        workspaceId={workspaceId}
        channelId={channelId}
        onFileSelected={(file) => console.log('Fichier sélectionné:', file)}
        onUploadProgress={(isUploading) => console.log('Upload en cours:', isUploading)}
        onUploadComplete={(result) => {
          console.log('Upload terminé:', result);
          // Traiter le résultat de l'upload si nécessaire
        }}
        onUploadError={(error) => {
          console.error('Erreur upload:', error);
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: 'Impossible d\'envoyer le fichier'
          });
        }}
      />

      {/* AttachmentViewer pour visualiser les fichiers */}
      <AttachmentViewer
        visible={attachmentViewerVisible}
        attachment={selectedAttachment}
        onClose={handleCloseAttachmentViewer}
        theme={themeColors}
      />

      {/* Modal de la boîte à outils */}
      {renderToolboxModal()}

      {/* Modal de création de strawpoll */}
      <StrawpollCreationModal
        visible={strawpollModalVisible}
        onClose={() => setStrawpollModalVisible(false)}
        channelId={channelId}
        workspaceId={workspaceId}
        theme={themeColors}
      />

      {/* Modal pour afficher les résultats des sondages */}
      <StrawpollResultsModal
        visible={strawpollResultsModalVisible}
        pollId={selectedPollId}
        onClose={handleCloseStrawpollResults}
        theme={themeColors}
      />

      {/* Menu contextuel pour les messages */}
      <ContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        isOwnMessage={contextMenu.isOwnMessage}
        onClose={handleCloseContextMenu}
        onReply={handleReplyMessage}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onAddReaction={handleAddReaction}
      />

      {/* Sélecteur d'emoji */}
      <EmojiPicker
        visible={showEmojiPicker}
        onSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />

      {/* Modal d'édition de message */}
      <EditMessageModal
        visible={!!editingMessage}
        messageContent={editMessageContent}
        onChangeText={setEditMessageContent}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />
    </KeyboardAvoidingView>
  );
};

export default WorkspaceDetailScreen;
