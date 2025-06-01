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
  const socketContext = useSocket();
  const { socket } = socketContext;
  const conv = useConversations({ socket });

  const selectedUser = conv?.selectedUser;
  const currentUserId = conv?.currentUserId;

  // État local pour les attachments, qui sera partagé entre les hooks
  const [attachments, setAttachments] = useState([]);

  // Initialiser d'abord le hook des messages
  const msg = useMessages(
    selectedUser,
    socket,
    currentUserId,
    attachments,
    setAttachments
  );
  // Ensuite le hook des attachments
  const {
    uploadingFile,
    fileInputRef,
    handleFileSelect,
    handleAttachmentClick,
    removeAttachment,
    handleAddReaction,
    handleEmojiSelect,
    handleDeleteMessage,
    handleDownloadFile, // S'assurer que cette fonction est récupérée du hook
  } = useAttachments({
    mode: "dm",
    recipientId: selectedUser,
    socket: socket,
    setMessages: msg.setMessages,
    setNewMessage: msg.setNewMessage,
    setReplyingTo: msg.setReplyingTo,
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

  // Debug logs déplacés dans useEffect pour éviter les rendus en boucle
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Log uniquement si les données ont changé significativement
      console.log("[DirectMessages] État des messages:", {
        messages: (msg || {}).messages?.length,
        loadingMessages: (msg || {}).loadingMessages,
        error: (msg || {}).error,
      });

      console.log("[DirectMessages] État des conversations:", {
        conversations: (conv?.getFilteredConversations?.() || []).length,
        selectedUser,
        currentUserId,
      });
    }
  }, [
    msg?.messages?.length,
    msg?.loadingMessages,
    msg?.error,
    selectedUser,
    currentUserId,
  ]);

  // Dans DirectMessages.jsx, juste avant le return
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[DirectMessages] État final avant render:", {
        replyingTo: msg?.replyingTo,
        handleReplyMessage: !!msg?.handleReplyMessage,
      });
    }
  }, [msg?.replyingTo, !!msg?.handleReplyMessage]); // Effet pour nettoyer les ressources et prévenir les fuites de mémoire
  useEffect(() => {
    return () => {
      // Nettoyer les ressources en fin de vie du composant
      if (typeof window !== "undefined") {
        // Une approche plus sûre pour purger les animations en attente
        try {
          // Utiliser l'API existante sans essayer de la redéfinir
          const cancelAnimationFrame =
            window.cancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            function (id) {
              clearTimeout(id);
            };

          // Annuler quelques frames récentes sans boucle while
          const id = window.requestAnimationFrame(() => {});
          // Annuler seulement quelques frames récentes (pas toutes)
          for (let i = id; i > id - 10; i--) {
            if (i > 0) cancelAnimationFrame(i);
          }
        } catch (e) {
          console.error("Erreur lors du nettoyage des animations:", e);
        }
      }
    };
  }, []);
  // Synchronise le compteur global dans le localStorage et notifie la Sidebar
  useEffect(() => {
    if (typeof conv?.totalUnreadCount === "number") {
      localStorage.setItem("unreadPrivateMessages", conv.totalUnreadCount);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("unreadMessagesUpdated", {
            detail: {
              count: conv.totalUnreadCount,
              counts: conv.unreadMessageCounts || {},
            },
          })
        );
      }, 0);
    }
  }, [conv?.totalUnreadCount, conv?.unreadMessageCounts]);
  // Effet pour synchroniser les compteurs lorsqu'ils sont mis à jour ailleurs dans l'application
  useEffect(() => {
    const syncUnreadCounts = async () => {
      setTimeout(() => {
        if (typeof conv?.refreshUnreadCounts === "function") {
          conv.refreshUnreadCounts();
        }
      }, 300);
    };
    window.addEventListener("unreadMessagesUpdated", syncUnreadCounts);
    return () => {
      window.removeEventListener("unreadMessagesUpdated", syncUnreadCounts);
    };
  }, [conv]);
  // Effet pour réinitialiser le compteur quand on sélectionne une conversation
  useEffect(() => {
    if (selectedUser && conv?.resetUnreadCountForUser) {
      // Réinitialiser le compteur pour cet utilisateur
      conv.resetUnreadCountForUser(selectedUser);
      console.log(
        "[DirectMessages] Réinitialisation compteur pour:",
        selectedUser
      );
    }
  }, [selectedUser, conv?.resetUnreadCountForUser]);

  // Rendu UI : le composant principal ne fait qu'orchestrer
  return (
    <div className="app-layout">
      <Sidebar />
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
          unreadMessageCounts={conv.unreadMessageCounts}
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
          onEditMessage={msg.handleEditMessage}
          onDeleteMessage={(msg || {}).handleDeleteMessage || (() => {})}
          onAddReaction={(msg || {}).handleAddReaction || (() => {})}
          onEmojiSelect={(msg || {}).handleEmojiSelect || (() => {})}
          onDownloadFile={handleDownloadFile || (() => {})}
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
