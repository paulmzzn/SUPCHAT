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
import { parseStrawpollsInMessage } from '../../utils/strawpollUtils';

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
          
          // Parser le contenu pour détecter les fichiers ou sondages
          const fileData = parseFileContent(message.contenu);
          const isStrawpoll = message.contenu && message.contenu.includes('[strawpoll:');
          
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
            </View>
          );
        })}
      </View>
    );
  }, [styles, renderAvatarInBubble, parseFileContent, handleOpenAttachment, getFileIcon, formatFileSize, themeColors, handleStrawpollVote, handleStrawpollViewResults]);

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
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }, [toolboxVisible, themeColors, handleCreateStrawpoll, handleCreateReminder, styles]);

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
    </KeyboardAvoidingView>
  );
};

export default WorkspaceDetailScreen;
