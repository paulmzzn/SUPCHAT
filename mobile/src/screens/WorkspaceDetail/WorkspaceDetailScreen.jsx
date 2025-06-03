import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSocket } from '../../context/SocketContext';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './WorkspaceDetailScreen.styles';

// Components
import MessageInput from '../../components/MessageInput';
import AttachmentViewer from '../../components/AttachmentViewer/AttachmentViewer';
import StrawpollCreationModal from '../../components/Strawpoll/StrawpollCreationModal';
import StrawpollResultsModal from '../../components/Strawpoll/StrawpollResultsModal';
import ContextMenu from '../../components/Messages/ContextMenu';
import EmojiPicker from '../../components/Messages/EmojiPicker';
import EditMessageModal from '../../components/Messages/EditMessageModal';
import MessageList from '../../components/Workspace/MessageList';
import ToolboxModal from '../../components/Workspace/ToolboxModal';
import TypingIndicator from '../../components/Workspace/TypingIndicator';

// Hooks
import { useWorkspaceChat } from '../../hooks/useWorkspaceChat';
import { useSocketHandlers } from '../../hooks/useSocketHandlers';
import { useMessageActions } from '../../hooks/useMessageActions';

const WorkspaceDetailScreen = ({ route, navigation }) => {
  const { workspaceId, channelId, channelName, workspaceName } = route.params;
  const { socket, markChannelAsRead } = useSocket();
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  // États pour les modals et attachments
  const [attachmentViewerVisible, setAttachmentViewerVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [toolboxVisible, setToolboxVisible] = useState(false);
  const [strawpollModalVisible, setStrawpollModalVisible] = useState(false);
  const [strawpollResultsModalVisible, setStrawpollResultsModalVisible] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState(null);

  const messageInputRef = useRef(null);

  // Hooks personnalisés
  const {
    messages,
    setMessages,
    currentUserId,
    loading,
    loadingMore,
    hasMoreMessages,
    connectionError,
    retryCount,
    MAX_RETRY_ATTEMPTS,
    handleNewMessage,
    handleReconnect,
    handleDisconnect,
    handleLoadMore,
    initializeChat,
  } = useWorkspaceChat(workspaceId, channelId, socket, markChannelAsRead);

  const {
    newMessage,
    typingUsers,
    setTypingUsers,
    replyingTo,
    editingMessage,
    editMessageContent,
    setEditMessageContent,
    contextMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    sendMessage,
    handleInputChange,
    handleLongPressMessage,
    handleCloseContextMenu,
    handleReplyMessage,
    handleCancelReply,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    handleAddReaction,
    handleEmojiSelect,
    handleRemoveReaction,
  } = useMessageActions(socket, channelId, workspaceId, currentUserId, setMessages);

  // Configuration des handlers socket
  useSocketHandlers(
    socket,
    workspaceId,
    channelId,
    currentUserId,
    handleNewMessage,
    handleReconnect,
    handleDisconnect,
    setMessages,
    setTypingUsers
  );

  // Handlers pour attachments et toolbox
  const handleOpenAttachment = useCallback((fileData) => {
    if (!fileData) return;

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

  const handleCloseAttachmentViewer = useCallback(() => {
    setAttachmentViewerVisible(false);
    setSelectedAttachment(null);
  }, []);

  const handleCreateStrawpoll = useCallback(() => {
    setToolboxVisible(false);
    setStrawpollModalVisible(true);
  }, []);

  const handleCreateReminder = useCallback(() => {
    setToolboxVisible(false);
    Alert.alert('Rappel', 'Fonctionnalité de création de rappel à venir !');
  }, []);

  const handleOpenGoogleDrive = useCallback(async () => {
    setToolboxVisible(false);
    try {
      const googleDriveUrl = 'https://drive.google.com';
      const supported = await Linking.canOpenURL(googleDriveUrl);
      if (supported) {
        await Linking.openURL(googleDriveUrl);
      } else {
        Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible d\'ouvrir Google Drive' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible d\'ouvrir Google Drive' });
    }
  }, []);

  const handleImportFromGoogleDrive = useCallback(() => {
    setToolboxVisible(false);
    Alert.alert('Importer depuis Google Drive', 'Cette fonctionnalité permet d\'importer des fichiers directement depuis votre Google Drive vers le canal.');
  }, []);

  const handleViewFiles = useCallback(() => {
    // Navigate to files screen or show files modal
    navigation.navigate('ChannelFiles', { 
      workspaceId, 
      channelId, 
      channelName,
      workspaceName 
    });
  }, [navigation, workspaceId, channelId, channelName, workspaceName]);

  const handleStrawpollVote = useCallback(async (pollId, pollUrl) => {
    try {
      if (pollUrl) {
        const supported = await Linking.canOpenURL(pollUrl);
        if (supported) {
          await Linking.openURL(pollUrl);
        }
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible d\'ouvrir le sondage' });
    }
  }, []);

  const handleStrawpollViewResults = useCallback((pollId) => {
    setSelectedPollId(pollId);
    setStrawpollResultsModalVisible(true);
  }, []);

  const renderConnectionError = useCallback(() => {
    if (!connectionError) return null;

    return (
      <View style={styles.connectionErrorContainer}>
        <Ionicons name="wifi-outline" size={20} color={themeColors.errorText} />
        <Text style={styles.connectionErrorText}>
          Connexion perdue {retryCount > 0 && `(Tentative ${retryCount}/${MAX_RETRY_ATTEMPTS})`}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeChat}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }, [connectionError, retryCount, styles, themeColors, MAX_RETRY_ATTEMPTS, initializeChat]);

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
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.workspaceName} numberOfLines={1}># {channelName}</Text>
          <Text style={styles.activeChannelName} numberOfLines={1}>{workspaceName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleViewFiles}>
            <Ionicons name="folder-outline" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton} onPress={() => setToolboxVisible(true)}>
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

      <MessageList
        messages={messages}
        styles={styles}
        themeColors={themeColors}
        currentUserId={currentUserId}
        hasMoreMessages={hasMoreMessages}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
        onLongPress={handleLongPressMessage}
        onRemoveReaction={handleRemoveReaction}
        onEmojiSelect={handleEmojiSelect}
        onOpenAttachment={handleOpenAttachment}
        onStrawpollVote={handleStrawpollVote}
        onStrawpollViewResults={handleStrawpollViewResults}
      />

      <TypingIndicator typingUsers={typingUsers} styles={styles} />

      <MessageInput
        value={newMessage}
        onChangeText={handleInputChange}
        onSend={sendMessage}
        placeholder={`Message dans #${channelName}`}
        inputRef={messageInputRef}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        uploadType="workspace-message"
        workspaceId={workspaceId}
        channelId={channelId}
        onUploadError={(error) => {
          Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible d\'envoyer le fichier' });
        }}
      />

      <AttachmentViewer
        visible={attachmentViewerVisible}
        attachment={selectedAttachment}
        onClose={handleCloseAttachmentViewer}
        theme={themeColors}
      />

      <ToolboxModal
        visible={toolboxVisible}
        onClose={() => setToolboxVisible(false)}
        styles={styles}
        themeColors={themeColors}
        onCreateStrawpoll={handleCreateStrawpoll}
        onCreateReminder={handleCreateReminder}
        onOpenGoogleDrive={handleOpenGoogleDrive}
        onImportFromGoogleDrive={handleImportFromGoogleDrive}
      />

      <StrawpollCreationModal
        visible={strawpollModalVisible}
        onClose={() => setStrawpollModalVisible(false)}
        channelId={channelId}
        workspaceId={workspaceId}
        theme={themeColors}
      />

      <StrawpollResultsModal
        visible={strawpollResultsModalVisible}
        pollId={selectedPollId}
        onClose={() => setStrawpollResultsModalVisible(false)}
        theme={themeColors}
      />

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

      <EmojiPicker
        visible={showEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />

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
