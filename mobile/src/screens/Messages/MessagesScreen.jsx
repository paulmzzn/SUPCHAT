import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { getStyles } from "./MessagesScreen.styles";
import { useTheme } from "../../theme/ThemeContext";
import MediaViewer from "../../components/MediaViewer/MediaViewer";
import MessageInput from "../../components/MessageInput";
import MessagesList from "../../components/Messages/MessagesList";
import ChatHeader from "../../components/Messages/ChatHeader";
import ContextMenu from "../../components/Messages/ContextMenu";
import EmojiPicker from "../../components/Messages/EmojiPicker";
import EditMessageModal from "../../components/Messages/EditMessageModal";
import { useMessagesData } from "../../components/Messages/hooks/useMessagesData";
import { useSocketMessages } from "../../components/Messages/hooks/useSocketMessages";
import { useMessageActions } from "../../components/Messages/hooks/useMessageActions";
import { useConversationTimestamps } from "../../components/Messages/hooks/useConversationTimestamps";
import { useKeyboardHandler } from "../../components/Messages/hooks/useKeyboardHandler";
import { useMediaPreview } from "../../components/Messages/hooks/useMediaPreview";
import { useContextMenu } from "../../components/Messages/hooks/useContextMenu";
import { useFileUpload } from "../../components/Messages/hooks/useFileUpload";

const MessagesScreen = ({ navigation, route }) => {
  const { colors: themeColors, mode } = useTheme();
  const styles = getStyles(themeColors);

  // Récupération des paramètres avec support pour les deux formats
  const { userId, recipientId, recipientName } = route.params || {};
  const actualUserId = userId || recipientId;

  // Debug: Afficher les paramètres reçus
  console.log("MessagesScreen - route.params:", route.params);
  console.log("MessagesScreen - userId:", userId);
  console.log("MessagesScreen - recipientId:", recipientId);
  console.log("MessagesScreen - actualUserId:", actualUserId);

  const isDarkMode =
    mode === "dark" ||
    themeColors.primaryBackground.toString().toLowerCase() === "#121212" ||
    themeColors.primaryBackground.toString().toLowerCase() === "#000000" ||
    themeColors.textPrimary?.toString().toLowerCase() === "#ffffff";

  const messagesData = useMessagesData(actualUserId);
  const {
    messages,
    setMessages,
    userInfo,
    loading: loadingMessages,
    error,
    hasMoreMessages,
    loadingMoreMessages,
    isInitialLoad,
    animatingMessages,
    isLoadingMore,
    scrollPositionRef,
    lastFetchedUserId,
    markMessagesAsRead,
    fetchUserInfo,
    fetchMessages,
    loadMoreMessages,
    addAnimatingMessage,
    socket,
    currentUserId,
  } = messagesData;

  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesScrollRef = useRef(null);
  const textInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { saveTimestamp } = useConversationTimestamps();
  const { keyboardHeight, keyboardVisible } = useKeyboardHandler();
  const { mediaPreview, openAttachment, closePreview } = useMediaPreview();
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();

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

  const messageActions = useMessageActions({
    socket,
    currentUserId,
    userId: actualUserId, // Corriger le nom du paramètre
    setMessages,
    addAnimatingMessage,
    scrollToBottom,
    saveConversationTimestamp: saveTimestamp,
  });

  const {
    replyingTo,
    editingMessage,
    editMessageContent,
    setEditMessageContent,
    selectedMessageForReaction,
    setSelectedMessageForReaction,
    handleReply,
    handleCancelReply,
    handleSendMessage,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    handleAddReaction,
    handleRemoveReaction,
  } = messageActions;

  const fileUploadHandlers = useFileUpload({
    currentUserId,
    actualUserId,
    setMessages,
    addAnimatingMessage,
    scrollToBottom,
    saveConversationTimestamp: saveTimestamp,
  });

  useSocketMessages({
    socket,
    currentUserId,
    actualUserId,
    messages,
    setMessages,
    addAnimatingMessage,
    scrollToBottom,
    saveConversationTimestamp: saveTimestamp,
  });

  useEffect(() => {
    if (!actualUserId || actualUserId === lastFetchedUserId.current) return;

    lastFetchedUserId.current = actualUserId;

    const loadUserAndMessages = async () => {
      await fetchUserInfo(actualUserId);
      await fetchMessages(actualUserId, 1);
    };

    loadUserAndMessages();

    return () => {
      setMessages([]);
    };
  }, [actualUserId]);

  useEffect(() => {
    if (
      messages.length === 0 ||
      isInitialLoad ||
      !actualUserId ||
      !currentUserId
    )
      return;
    console.log("User opened conversation, marking messages as read");
    markMessagesAsRead(messages);
  }, [
    messages,
    isInitialLoad,
    actualUserId,
    currentUserId,
    markMessagesAsRead,
  ]);

  const handleScroll = (event) => {
    if (loadingMoreMessages || !hasMoreMessages || isLoadingMore.current)
      return;

    const scrollOffset = event.nativeEvent.contentOffset.y;
    if (scrollOffset < 200) {
      scrollPositionRef.current = {
        contentHeight: event.nativeEvent.contentSize.height,
        scrollOffset,
      };
      isLoadingMore.current = true;
      loadMoreMessages();
    }
  };

  const handleSendMessageWrapper = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage("");
    await handleSendMessage(messageText);
  };

  useEffect(() => {
    if (!isInitialLoad && !loadingMoreMessages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isInitialLoad, loadingMoreMessages]);

  const handleGoBack = () => {
    // Toujours naviguer vers la liste des conversations
    navigation.navigate("Messages", { screen: "ConversationsList" });
  };

  const handleLongPressMessage = (message, event) => {
    console.log("Long press detected on message:", message.id_message_prive);
    openContextMenu(message, event, currentUserId);
    setSelectedMessageForReaction(message);
  };

  const handleContextMenuReply = () => {
    if (contextMenu.message) {
      handleReply(contextMenu.message);
      closeContextMenu();
      setTimeout(() => {
        if (textInputRef && textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleContextMenuEdit = () => {
    if (contextMenu.message) {
      handleEditMessage(contextMenu.message);
      closeContextMenu();
    }
  };

  const handleContextMenuDelete = () => {
    if (contextMenu.message) {
      handleDeleteMessage(contextMenu.message);
      closeContextMenu();
    }
  };

  const handleContextMenuAddReaction = () => {
    setSelectedMessageForReaction(contextMenu.message);
    setShowEmojiPicker(true);
    closeContextMenu();
  };

  const handleEmojiSelect = (reactionName) => {
    if (selectedMessageForReaction) {
      handleAddReaction(selectedMessageForReaction, reactionName);
    }
    setShowEmojiPicker(false);
    setSelectedMessageForReaction(null);
  };

  if (!actualUserId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Chargement de la conversation...</Text>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <TouchableOpacity style={styles.button} onPress={handleGoBack}>
          <Text style={styles.buttonText}>Retour</Text>
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
          <ChatHeader userInfo={userInfo} onGoBack={handleGoBack} />

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
              <MessagesList
                messages={messages}
                currentUserId={currentUserId}
                userInfo={userInfo}
                animatingMessages={animatingMessages}
                loadingMoreMessages={loadingMoreMessages}
                hasMoreMessages={hasMoreMessages}
                isInitialLoad={isInitialLoad}
                onScroll={handleScroll}
                onLongPress={handleLongPressMessage}
                onOpenAttachment={openAttachment}
                onRemoveReaction={handleRemoveReaction}
                onReply={handleReply}
                socket={socket}
                setMessages={setMessages}
                scrollRef={messagesScrollRef}
                onScrollToBottom={scrollToBottom}
              />
            </View>
          )}

          <MessageInput
            value={newMessage}
            onChangeText={setNewMessage}
            onSend={handleSendMessageWrapper}
            placeholder="Type a message..."
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            replyUserName={
              replyingTo?.fk_expediteur === currentUserId
                ? "vous-même"
                : userInfo?.name || "Utilisateur"
            }
            isDarkMode={isDarkMode}
            inputRef={textInputRef}
            keyboardVisible={keyboardVisible}
            uploadType="private-message"
            recipientId={actualUserId}
            onFileSelected={fileUploadHandlers.handleFileSelected}
            onUploadProgress={fileUploadHandlers.handleUploadProgress}
            onUploadComplete={fileUploadHandlers.handleUploadComplete}
            onUploadError={fileUploadHandlers.handleUploadError}
          />
        </View>

        <MediaViewer
          visible={mediaPreview.visible}
          media={mediaPreview.media}
          onClose={closePreview}
          theme={themeColors}
        />

        <ContextMenu
          visible={contextMenu.visible}
          message={contextMenu.message}
          position={contextMenu.position}
          isOwnMessage={contextMenu.isOwnMessage}
          onClose={closeContextMenu}
          onReply={handleContextMenuReply}
          onEdit={handleContextMenuEdit}
          onDelete={handleContextMenuDelete}
          onAddReaction={handleContextMenuAddReaction}
        />

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
                  { name: "thumbsUp", emoji: "👍" },
                  { name: "heart", emoji: "❤️" },
                  { name: "laugh", emoji: "😂" },
                  { name: "surprise", emoji: "😮" },
                  { name: "sad", emoji: "😢" },
                  { name: "angry", emoji: "😡" },
                ].map((reaction) => (
                  <TouchableOpacity
                    key={reaction.name}
                    style={styles.emojiButton}
                    onPress={() => handleEmojiSelect(reaction.name)}
                  >
                    <Text style={styles.emojiText}>{reaction.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        )}

        <EditMessageModal
          visible={!!editingMessage}
          message={editingMessage}
          editContent={editMessageContent}
          onEditContentChange={setEditMessageContent}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          isDarkMode={isDarkMode}
        />
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

export default MessagesScreen;
