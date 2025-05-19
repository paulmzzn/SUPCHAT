import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { useNotificationSettings } from "../../context/NotificationSettingsContext";
import { playNotificationSound } from "../../assets/sounds/soundUtils";
import Sidebar from "../../components/Sidebar/Sidebar";
import Spinner from "../../components/Spinner/Spinner";

// Hooks personnalisés
import { useConversations } from "./hooks/useConversations";
import { useMessages } from "./hooks/useMessages";
import { useAttachments } from "./hooks/useAttachments";
import { useMentions } from "./hooks/useMentions";

// Composants
import ConversationList from "./components/ConversationList/ConversationList";
import ConversationContextMenu from "./components/ConversationList/ConversationContextMenu";
import NewConversationModal from "./components/ConversationList/NewConversationModal";
import MessageArea from "./components/MessageArea/MessageArea";
import MessageContextMenu from "./components/MessageArea/MessageContextMenu";
import MentionSuggestions from "./components/MessageArea/MentionSuggestions";

// Utils
import { safeJSONParse, safeJSONStringify } from "./utils/jsonUtils";
import { formatMessageDate } from "./utils/dateFormatter";
import {
  getFileIcon,
  getCompleteFileUrl,
  formatFileSize,
} from "./utils/fileUtils";

import "./DirectMessages.css";

const DirectMessagesRefactored = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, refreshUnreadDM } = useSocket();
  const { notificationSettings } = useNotificationSettings();

  // État du token et de l'utilisateur courant
  const [currentUserId, setCurrentUserId] = useState(null);

  // Référence pour le container de messages
  const messagesContainerRef = useRef(null);

  // Hooks personnalisés
  const {
    conversations,
    usersInfo,
    loading,
    error,
    unreadMessageCounts,
    totalUnreadCount,
    searchQuery,
    setSearchQuery,
    showNewConversationModal,
    setShowNewConversationModal,
    searchUserQuery,
    setSearchUserQuery,
    availableUsers,
    filteredUsers,
    loadingUsers,
    conversationContextMenu,
    setConversationContextMenu,
    fetchConversations,
    fetchUserInfo,
    fetchAvailableUsers,
    calculateTotalUnreadCount,
    updateUnreadCounts,
    getFilteredConversations,
    handleOpenNewConversation,
    startConversationWith,
    deleteConversation,
  } = useConversations();

  // État local pour l'utilisateur sélectionné
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  // Hook de messages (avec selectedUser comme dépendance)
  const {
    messages,
    loadingMessages,
    newMessage,
    setNewMessage,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editMessageContent,
    setEditMessageContent,
    messageContextMenu,
    setMessageContextMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    emojiPickerPosition,
    setEmojiPickerPosition,
    fetchMessages,
    sendMessage, // Fonction d'envoi sous-jacente
    handleInputChange,
    markMessagesAsRead,
    onReplyMessage,
    onEditMessage,
    onDeleteMessage,
    onAddReaction,
    onEmojiSelect,
    handleCancelReply,
    handleSaveEdit,
    handleCancelEdit,
    setMessages, // Pour mettre à jour les messages
  } = useMessages(selectedUser, socket, currentUserId);

  // Hook attachments
  const {
    attachments,
    uploadingFile,
    fileInputRef,
    handleFileSelect,
    handleAttachmentClick,
    handleDownloadFile,
    removeAttachment,
  } = useAttachments();

  // Hook mentions
  const {
    mentionSearch,
    showMentionSuggestions,
    mentionSuggestions,
    activeMentionIndex,
    mentionStartIndex,
    mentionMap,
    searchUserMentions,
    insertMention,
    renderTextWithMentions,
    onMentionSelect,
  } = useMentions();

  // État de référence pour l'emoji picker
  const emojiPickerRef = useRef(null);

  // Récupère l'ID de l'utilisateur courant à partir du token
  useEffect(() => {
    const checkTokenAndSetUser = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log(
            "Token non trouvé, redirection vers la page de connexion"
          );
          navigate("/login");
          return;
        }

        // Décoder le payload du token JWT
        const parts = token.split(".");
        if (parts.length !== 3) {
          console.log("Format de token invalide");
          navigate("/login");
          return;
        }

        const payload = JSON.parse(atob(parts[1]));
        setCurrentUserId(payload.id);
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        navigate("/login");
      }
    };

    checkTokenAndSetUser();
  }, [navigate]);

  // Charger les conversations au démarrage
  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // Charger les messages lorsqu'un utilisateur est sélectionné
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);

      // Mettre à jour les informations de l'utilisateur sélectionné
      const updateSelectedUserInfo = async () => {
        let userInfo = usersInfo[selectedUser];
        if (!userInfo) {
          userInfo = await fetchUserInfo(selectedUser);
        }
        setSelectedUserInfo(userInfo);
      };

      updateSelectedUserInfo();
    }
  }, [selectedUser, fetchMessages, usersInfo, fetchUserInfo]);

  // Gestion de la sélection d'un utilisateur
  const handleUserSelect = (userId) => {
    // Toujours sélectionner l'utilisateur et charger les messages, même si déjà sélectionné
    setSelectedUser(userId);
    setReplyingTo(null);
    setEditingMessage(null);
    setEditMessageContent("");
    setNewMessage("");
    setShowEmojiPicker(false);
    setMessageContextMenu({
      visible: false,
      xPos: 0,
      yPos: 0,
      messageId: null,
      isOwnMessage: false,
      message: null,
    });
    // Effacer le compteur de messages non lus pour cet utilisateur
    if (unreadMessageCounts[userId]) {
      const newCounts = { ...unreadMessageCounts, [userId]: 0 };
      updateUnreadCounts(newCounts);
      if (refreshUnreadDM) refreshUnreadDM();
    }
    // Charger explicitement les messages (toujours)
    fetchMessages(userId);
  };

  // Envoi d'un message avec gestion des pièces jointes et mentions
  const handleSendMessageWithAttachments = async (e) => {
    e?.preventDefault();

    if ((!newMessage.trim() && attachments.length === 0) || !selectedUser) {
      return;
    }

    try {
      console.log("[DirectMessages] Préparation de l'envoi du message");

      // Conversion des mentions pour le backend
      let processedMessage = newMessage;
      mentionMap.forEach((internalFormat, visibleMention) => {
        const mentionRegex = new RegExp(`${visibleMention}(\\s|$)`, "g");
        processedMessage = processedMessage.replace(
          mentionRegex,
          `${internalFormat} `
        );
      });

      // Message optimiste pour affichage immédiat
      const tempId = Date.now().toString();
      const optimisticMessage = {
        id_message_prive: `temp-${tempId}`,
        contenu: processedMessage,
        fk_expediteur: currentUserId,
        fk_destinataire: selectedUser,
        date_envoi: new Date().toISOString(),
        date_creation: new Date().toISOString(),
        isOptimistic: true,
        tempId,
        attachments: attachments.map((att) => ({
          id_fichier: att.id_fichier,
          nom_fichier: att.nom_fichier,
          type: att.type,
          taille_fichier: att.taille_fichier,
          url: att.url,
        })),
      };

      // Ajouter les infos de réponse si nécessaire
      if (replyingTo) {
        optimisticMessage.fk_message_original = replyingTo.id_message_prive;
        optimisticMessage.message_original = replyingTo;
      }

      // Ajouter à l'UI immédiatement
      setMessages((prev) => [...prev, optimisticMessage]);

      console.log("[DirectMessages] Envoi au serveur");

      // Utiliser l'API du hook useMessages pour envoyer le message
      const result = await sendMessage(
        processedMessage,
        selectedUser,
        replyingTo,
        attachments.map((att) => att.id_fichier)
      );

      console.log("[DirectMessages] Message envoyé avec succès:", result);

      // Réinitialiser les états
      setNewMessage("");
      setReplyingTo(null);
      setAttachments([]);

      return result;
    } catch (error) {
      console.error("[DirectMessages] Erreur lors de l'envoi:", error);

      // Marquer le message optimiste comme en erreur
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.tempId === tempId) {
            return { ...msg, sendError: true, errorMessage: error.message };
          }
          return msg;
        })
      );

      return null;
    }
  };

  // Gérer le menu contextuel des conversations
  const handleConversationContextMenu = (e, userId) => {
    e.preventDefault();
    setConversationContextMenu({
      visible: true,
      xPos: e.pageX,
      yPos: e.pageY,
      userId: userId,
    });
  };

  // Fermer les menus contextuels
  const handleCloseContextMenus = () => {
    setConversationContextMenu({
      visible: false,
      xPos: 0,
      yPos: 0,
      userId: null,
    });
    setMessageContextMenu({
      visible: false,
      xPos: 0,
      yPos: 0,
      messageId: null,
      isOwnMessage: false,
      message: null,
    });
  };

  // Scroll vers le bas quand les messages changent
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Réception des nouveaux messages privés en temps réel
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handlePrivateMessage = async (msg) => {
      console.log("Message privé reçu:", msg);

      // Traiter uniquement si l'expéditeur ou le destinataire est l'utilisateur courant
      if (
        msg.fk_expediteur !== currentUserId &&
        msg.fk_destinataire !== currentUserId
      ) {
        return;
      }

      // Jouer un son de notification si message entrant d'un autre utilisateur
      if (msg.fk_expediteur !== currentUserId) {
        playNotificationSound(notificationSettings);

        // Mettre à jour le compteur de messages non lus si ce n'est pas la conversation active
        if (!selectedUser || msg.fk_expediteur !== selectedUser) {
          const senderId = msg.fk_expediteur;
          const newCounts = {
            ...unreadMessageCounts,
            [senderId]: (unreadMessageCounts[senderId] || 0) + 1,
          };
          updateUnreadCounts(newCounts);
        }
      }

      // Si c'est pour la conversation actuellement affichée, ajouter à la liste des messages
      if (
        selectedUser &&
        (msg.fk_expediteur === selectedUser ||
          msg.fk_destinataire === selectedUser)
      ) {
        // Mettre à jour la liste des messages
        setMessages((prev) => {
          // Vérifier si ce message existe déjà (pour éviter les doublons)
          const messageExists = prev.some(
            (m) =>
              m.id_message_prive === msg.id_message_prive ||
              (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`) ||
              (m.isOptimistic &&
                m.contenu === msg.contenu &&
                m.fk_expediteur === msg.fk_expediteur)
          );

          if (messageExists) {
            // Remplacer le message existant
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
            // Ajouter le nouveau message
            return [...prev, msg];
          }
        });

        // Marquer comme lu si c'est un message entrant
        if (msg.fk_expediteur !== currentUserId) {
          markMessagesAsRead([msg]);
        }
      }

      // Mettre à jour la liste des conversations si nécessaire
      if (
        !conversations.includes(msg.fk_expediteur) &&
        msg.fk_expediteur !== currentUserId
      ) {
        fetchConversations();
      }
    };

    // Autres handlers d'événements socket
    const handlePrivateMessageUpdated = (msg) => {
      if (
        selectedUser &&
        (msg.fk_expediteur === selectedUser ||
          msg.fk_destinataire === selectedUser)
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === msg.id_message_prive ? msg : m
          )
        );
      }
    };

    const handlePrivateMessageDeleted = (data) => {
      if (selectedUser) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === data.id
              ? {
                  ...m,
                  is_deleted: true,
                  contenu: "[message supprimé]",
                  attachments: [],
                }
              : m
          )
        );
      }
    };

    const handlePrivateMessageRead = (data) => {
      if (selectedUser) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id_message_prive === data.id) {
              return { ...m, date_lecture: data.date_lecture };
            }
            return m;
          })
        );
      }
    };

    const handlePrivateMessageReaction = (data) => {
      if (selectedUser) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id_message_prive === data.messageId) {
              return { ...m, reactions: data.reactions };
            }
            return m;
          })
        );
      }
    };

    // Ajouter les écouteurs d'événements
    socket.on("privateMessage", handlePrivateMessage);
    socket.on("privateMessageUpdated", handlePrivateMessageUpdated);
    socket.on("privateMessageDeleted", handlePrivateMessageDeleted);
    socket.on("privateMessageRead", handlePrivateMessageRead);
    socket.on("privateMessageReaction", handlePrivateMessageReaction);

    // Nettoyage
    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("privateMessageUpdated", handlePrivateMessageUpdated);
      socket.off("privateMessageDeleted", handlePrivateMessageDeleted);
      socket.off("privateMessageRead", handlePrivateMessageRead);
      socket.off("privateMessageReaction", handlePrivateMessageReaction);
    };
  }, [
    socket,
    currentUserId,
    selectedUser,
    conversations,
    unreadMessageCounts,
    notificationSettings,
    updateUnreadCounts,
    markMessagesAsRead,
    fetchConversations,
  ]);

  // Gérer le clic en dehors des menus contextuels
  useEffect(() => {
    const handleClickOutside = () => {
      handleCloseContextMenus();
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Handler pour la saisie du champ message (mentions + texte)
  const handleInputChangeDM = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    // Gestion des mentions (affichage suggestions)
    if (value.lastIndexOf("@") !== -1) {
      const lastAtIndex = value.lastIndexOf("@");
      const textAfterAt = value.substring(lastAtIndex + 1);
      const spaceAfterAt = textAfterAt.indexOf(" ");
      const searchText =
        spaceAfterAt === -1
          ? textAfterAt
          : textAfterAt.substring(0, spaceAfterAt);
      if (
        searchText.length === 0 ||
        (searchText.length > 0 && spaceAfterAt === -1)
      ) {
        setMentionStartIndex(lastAtIndex);
        setMentionSearch(searchText.toLowerCase());
        searchUserMentions(searchText);
        setShowMentionSuggestions(true);
        return;
      }
    }
    setShowMentionSuggestions(false);
  };

  return (
    <div className="dm-container" onClick={() => setShowEmojiPicker(false)}>
      <Sidebar />

      <div className="dm-content">
        {/* Liste des conversations */}
        <ConversationList
          conversations={getFilteredConversations()}
          usersInfo={usersInfo}
          selectedUser={selectedUser}
          loading={loading}
          error={error}
          unreadMessageCounts={unreadMessageCounts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onUserSelect={handleUserSelect}
          onOpenNewConversation={handleOpenNewConversation}
          onConversationContextMenu={handleConversationContextMenu}
        />

        {/* Zone principale des messages */}
        <MessageArea
          selectedUser={selectedUser}
          selectedUserInfo={selectedUserInfo}
          messages={messages}
          loadingMessages={loadingMessages}
          currentUserId={currentUserId}
          usersInfo={usersInfo}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          editingMessage={editingMessage}
          setEditingMessage={setEditingMessage}
          editMessageContent={editMessageContent}
          setEditMessageContent={setEditMessageContent}
          attachments={attachments}
          uploadingFile={uploadingFile}
          messageContextMenu={messageContextMenu}
          showEmojiPicker={showEmojiPicker}
          emojiPickerPosition={emojiPickerPosition}
          messagesContainerRef={messagesContainerRef}
          fileInputRef={fileInputRef}
          emojiPickerRef={emojiPickerRef}
          handleFileSelect={handleFileSelect}
          handleAttachmentClick={handleAttachmentClick}
          handleSendMessage={handleSendMessageWithAttachments}
          handleInputChange={handleInputChangeDM}
          handleCancelReply={handleCancelReply}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          removeAttachment={removeAttachment}
          onMessageContextMenu={setMessageContextMenu}
          onCloseMessageContextMenu={handleCloseContextMenus}
          onReplyMessage={onReplyMessage}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onAddReaction={onAddReaction}
          onEmojiSelect={onEmojiSelect}
          onDownloadFile={handleDownloadFile}
          showMentionSuggestions={showMentionSuggestions}
          mentionSuggestions={mentionSuggestions}
          activeMentionIndex={activeMentionIndex}
          onMentionSelect={onMentionSelect}
          renderTextWithMentions={renderTextWithMentions}
          formatMessageDate={formatMessageDate}
          getFileIcon={getFileIcon}
          getCompleteFileUrl={getCompleteFileUrl}
          formatFileSize={formatFileSize}
        />
      </div>

      {/* Menu contextuel pour les conversations */}
      {conversationContextMenu.visible && (
        <ConversationContextMenu
          x={conversationContextMenu.xPos}
          y={conversationContextMenu.yPos}
          userId={conversationContextMenu.userId}
          onOpenConversation={handleUserSelect}
          onDeleteConversation={deleteConversation}
          onClose={() =>
            setConversationContextMenu({
              visible: false,
              xPos: 0,
              yPos: 0,
              userId: null,
            })
          }
        />
      )}

      {/* Modal pour démarrer une nouvelle conversation */}
      {showNewConversationModal && (
        <NewConversationModal
          searchQuery={searchUserQuery}
          setSearchQuery={setSearchUserQuery}
          users={filteredUsers}
          loading={loadingUsers}
          onUserSelect={startConversationWith}
          onClose={() => setShowNewConversationModal(false)}
        />
      )}
    </div>
  );
};

export default DirectMessagesRefactored;
