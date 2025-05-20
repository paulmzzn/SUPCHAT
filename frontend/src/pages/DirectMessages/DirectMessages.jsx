import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { useNotificationSettings } from "../../context/NotificationSettingsContext";
import Sidebar from "../../components/Sidebar/Sidebar";
// Utiliser le ToastProvider séparé au lieu de ToastContainer direct
import ToastProvider from "../../components/Toast/ToastProvider";
import "react-toastify/dist/ReactToastify.css";

// Components
import ConversationList from "./components/ConversationList/ConversationList";
import NewConversationModal from "./components/ConversationList/NewConversationModal";
import ConversationContextMenu from "./components/ConversationList/ConversationContextMenu";
import MessageArea from "./components/MessageArea/MessageArea";

// Hooks
import { useConversations } from "./hooks/useConversations";
import { useMessages } from "./hooks/useMessages";
import { useAttachments } from "./hooks/useAttachments";
import useDirectMessageNotifications from "./hooks/useDirectMessageNotifications";

// Utilitaires
import {
  formatMessageDate,
  getFileIcon,
  formatFileSize,
  getCompleteFileUrl,
} from "./utils/messageUtils";

import "./DirectMessages.css";

function DirectMessages() {
  const location = useLocation();
  const navigate = useNavigate();
  // Utiliser les hooks avec des valeurs par défaut solides
  const notifContext = useNotificationSettings();
  const { notificationSettings } = notifContext;
  const conv = useConversations();
  const selectedUser = conv?.selectedUser;
  const currentUserId = conv?.currentUserId;
  const socketContext = useSocket();
  const { socket } = socketContext;
  const msg = useMessages(selectedUser, socket, currentUserId);

  // Ajout du hook useAttachments pour la gestion des fichiers (DM)
  const {
    attachments,
    setAttachments,
    uploadingFile,
    fileInputRef,
    handleFileSelect,
    handleAttachmentClick,
    removeAttachment,
    handleAddReaction,
    handleEmojiSelect,
    handleDeleteMessage,
    // On peut ajouter d'autres méthodes si besoin (handleDownloadFile, etc.)
  } = useAttachments({
    mode: "dm",
    recipientId: selectedUser,
    socket: socket,
    setMessages: msg.setMessages, // 👈
    setNewMessage: msg.setNewMessage, // 👈
  });

  // Utilisation du hook de notifications DM
  const { unreadMessageCounts, totalUnreadCount } =
    useDirectMessageNotifications({
      socket,
      currentUserId,
      selectedUser,
    });

  // Effet pour charger les conversations si la liste est vide
  React.useEffect(() => {
    if (
      conv &&
      typeof conv.fetchConversations === "function" &&
      Array.isArray(conv.conversations) &&
      conv.conversations.length === 0
    ) {
      conv.fetchConversations();
    }
  }, [conv]);
  // Valeurs par défaut si les hooks retournent null/undefined
  const convWithDefaults = conv || {};

  // Debug: Afficher l'état des messages
  console.log("[DirectMessages] État des messages:", {
    messages: (msg || {}).messages,
    loadingMessages: (msg || {}).loadingMessages,
    error: (msg || {}).error,
  });

  // Debug: Afficher l'état des conversations
  console.log("[DirectMessages] État des conversations:", {
    conversations:
      (conv &&
        conv.getFilteredConversations &&
        conv.getFilteredConversations()) ||
      [],
    selectedUser,
    currentUserId,
  });

  // Debug: Afficher les props du composant MessageArea
  console.log("[DirectMessages] Props de MessageArea:", {
    selectedUser,
    messages: (msg || {}).messages,
    currentUserId,
    usersInfo: convWithDefaults.usersInfo,
    newMessage: (msg || {}).newMessage,
    replyingTo: (msg || {}).replyingTo,
    editingMessage: (msg || {}).editingMessage,
    attachments,
    uploadingFile,
  });

  // Dans DirectMessages.jsx, juste avant le return
  console.log("[DirectMessages] État final avant render:", {
    replyingTo: msg?.replyingTo,
    handleReplyMessage: !!msg?.handleReplyMessage,
  });
  // Rendu UI : le composant principal ne fait qu'orchestrer
  return (
    <div className="app-layout">
      <Sidebar unreadMessageCount={totalUnreadCount} />
      <div className="dm-layout">
        <ConversationList
          conversations={
            convWithDefaults.getFilteredConversations
              ? convWithDefaults.getFilteredConversations()
              : []
          }
          usersInfo={convWithDefaults.usersInfo || {}}
          selectedUser={selectedUser}
          loading={convWithDefaults.loading || false}
          error={convWithDefaults.error || null}
          unreadMessageCounts={unreadMessageCounts}
          searchQuery={convWithDefaults.searchQuery || ""}
          setSearchQuery={convWithDefaults.setSearchQuery || (() => {})}
          onUserSelect={convWithDefaults.handleSelectUser || (() => {})}
          onOpenNewConversation={
            convWithDefaults.handleOpenNewConversation || (() => {})
          }
          onConversationContextMenu={
            convWithDefaults.handleConversationContextMenu || (() => {})
          }
        />{" "}
        <MessageArea
          selectedUser={selectedUser}
          selectedUserInfo={
            (convWithDefaults.usersInfo || {})[selectedUser] || null
          }
          messages={(msg || {}).messages || []}
          loadingMessages={(msg || {}).loadingMessages || false}
          currentUserId={currentUserId}
          usersInfo={convWithDefaults.usersInfo || {}}
          newMessage={(msg || {}).newMessage || ""}
          setNewMessage={(msg || {}).setNewMessage || (() => {})}
          replyingTo={(msg || {}).replyingTo || null}
          setReplyingTo={(msg || {}).setReplyingTo || (() => {})}
          editingMessage={(msg || {}).editingMessage || null}
          editMessageContent={(msg || {}).editMessageContent || ""}
          setEditMessageContent={
            (msg || {}).setEditMessageContent || (() => {})
          }
          // --- Utilisation des props du hook useAttachments ---
          attachments={attachments}
          uploadingFile={uploadingFile}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          handleAttachmentClick={handleAttachmentClick}
          removeAttachment={removeAttachment}
          // --- Fin props fichiers ---
          messageContextMenu={
            (msg || {}).messageContextMenu || { visible: false }
          }
          showEmojiPicker={(msg || {}).showEmojiPicker || false}
          emojiPickerPosition={
            (msg || {}).emojiPickerPosition || { top: 0, left: 0 }
          }
          messagesContainerRef={(msg || {}).messagesContainerRef}
          emojiPickerRef={(msg || {}).emojiPickerRef}
          handleSendMessage={(msg || {}).handleSendMessage || (() => {})}
          handleInputChange={(msg || {}).handleInputChange || (() => {})}
          handleCancelReply={(msg || {}).handleCancelReply || (() => {})}
          handleSaveEdit={(msg || {}).handleSaveEdit || (() => {})}
          handleCancelEdit={(msg || {}).handleCancelEdit || (() => {})}
          onMessageContextMenu={
            (msg || {}).handleMessageContextMenu || (() => {})
          }
          onCloseMessageContextMenu={
            (msg || {}).handleCloseMessageContextMenu || (() => {})
          }
          onReplyMessage={(msg || {}).handleReplyMessage || (() => {})}
          onEditMessage={(msg || {}).handleEditMessage || (() => {})}
          onDeleteMessage={(msg || {}).handleDeleteMessage || (() => {})}
          onAddReaction={(msg || {}).handleAddReaction || (() => {})}
          onEmojiSelect={(msg || {}).handleEmojiSelect || (() => {})}
          onDownloadFile={(msg || {}).downloadFile || (() => {})}
          showMentionSuggestions={(msg || {}).showMentionSuggestions || false}
          mentionSuggestions={(msg || {}).mentionSuggestions || []}
          activeMentionIndex={(msg || {}).activeMentionIndex || 0}
          onMentionSelect={(msg || {}).handleMentionSelect || (() => {})}
          renderTextWithMentions={
            (msg || {}).renderTextWithMentions || ((text) => text)
          }
          formatMessageDate={formatMessageDate}
          getFileIcon={getFileIcon}
          getCompleteFileUrl={getCompleteFileUrl}
          formatFileSize={formatFileSize}
        />
        {conv.conversationContextMenu?.visible && (
          <ConversationContextMenu
            visible={conv.conversationContextMenu?.visible || false}
            xPos={conv.conversationContextMenu?.xPos || 0}
            yPos={conv.conversationContextMenu?.yPos || 0}
            userId={conv.conversationContextMenu?.userId || ""}
            onOpenConversation={conv.handleOpenConversation || (() => {})}
            onDeleteConversation={conv.handleDeleteConversation || (() => {})}
            onClose={conv.handleCloseConversationContextMenu || (() => {})}
          />
        )}{" "}
        {conv.showNewConversationModal && (
          <NewConversationModal
            show={conv.showNewConversationModal || false}
            onClose={conv.handleCloseNewConversationModal || (() => {})}
            searchQuery={conv.searchUserQuery || ""}
            setSearchQuery={conv.setSearchUserQuery || (() => {})}
            filteredUsers={conv.filteredUsers || []}
            loadingUsers={conv.loadingUsers || false}
            onStartConversation={conv.handleStartConversation || (() => {})}
          />
        )}{" "}
      </div>
      {/* Utiliser le ToastProvider séparé */}
      <ToastProvider />
    </div>
  );
}

export default DirectMessages;
