import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { useNotificationSettings } from "../../context/NotificationSettingsContext";
import Sidebar from "../../components/Sidebar/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { playNotificationSound } from "../../assets/sounds/soundUtils";

// Components
import ConversationList from "./components/ConversationList/ConversationList";
import NewConversationModal from "./components/ConversationList/NewConversationModal";
import ConversationContextMenu from "./components/ConversationList/ConversationContextMenu";
import MessageArea from "./components/MessageArea/MessageArea";

// Hooks
import { useConversations } from "./hooks/useConversations";
import { useMessages } from "./hooks/useMessages";

// Utilitaires
import {
  formatMessageDate,
  getFileIcon,
  formatFileSize,
  getCompleteFileUrl,
} from "./utils/messageUtils";

import "./DirectMessages.css";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.167:3000";

/**
 * Composant principal de gestion des messages directs
 */
function DirectMessages() {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, refreshUnreadDM } = useSocket();
  const { notificationSettings } = useNotificationSettings();

  // États principaux
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);

  // Gestion conversations et utilisateurs
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
    updateUnreadCounts,
    getFilteredConversations,
    startConversationWith,
    deleteConversation,
  } = useConversations();

  // Gestion messages et interactions
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
    attachments,
    setAttachments,
    uploadingFile,
    messageContextMenu,
    setMessageContextMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    emojiPickerPosition,
    setEmojiPickerPosition,
    messagesContainerRef,
    fileInputRef,
    emojiPickerRef,
    fetchMessages,
    sendMessage,
    markMessagesAsRead,
    deleteMessage,
    editMessage,
    addReaction,
    downloadFile,
    handleFileSelect,
    triggerFileInput,
    scrollToBottom,
    setMessages,
  } = useMessages(selectedUser, socket, currentUserId);

  // État pour les mentions
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(null);
  const [mentionMap, setMentionMap] = useState(new Map());

  // Vérification du token et récupération de l'ID utilisateur
  useEffect(() => {
    const checkTokenValidity = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("Token non trouvé dans localStorage");
          return { valid: false, error: "Token non trouvé" };
        }

        // Découper et décoder le token JWT
        const parts = token.split(".");
        if (parts.length !== 3) {
          console.log("Format de token JWT invalide");
          return { valid: false, error: "Format de token invalide" };
        }

        // Décoder le payload (partie centrale du token)
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        return {
          valid: currentTime < payload.exp,
          error: currentTime > payload.exp ? "Token expiré" : null,
          details: payload,
        };
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        return { valid: false, error: error.message };
      }
    };

    const tokenStatus = checkTokenValidity();
    if (tokenStatus.valid && tokenStatus.details && tokenStatus.details.id) {
      setCurrentUserId(tokenStatus.details.id);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Charger les conversations au démarrage
  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // Effet pour lire les paramètres d'URL et charger la conversation appropriée
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userIdFromQuery = params.get("userId");

    if (userIdFromQuery && currentUserId) {
      setSelectedUser(userIdFromQuery);
      fetchMessages(userIdFromQuery);

      // Charger les informations de l'utilisateur si nécessaire
      if (!usersInfo[userIdFromQuery]) {
        fetchUserInfo(userIdFromQuery).then((userInfo) => {
          if (userInfo) {
            setSelectedUserInfo(userInfo);
          }
        });
      } else {
        setSelectedUserInfo(usersInfo[userIdFromQuery]);
      }
    }
  }, [location.search, currentUserId, fetchMessages, fetchUserInfo, usersInfo]);

  // Gestion des événements WebSocket
  useEffect(() => {
    if (!socket || !currentUserId) return;

    // Gestion des nouveaux messages privés
    const handlePrivateMessage = async (msg) => {
      console.log("[DM] Received private message:", msg);

      if (!currentUserId) return;

      // Mise à jour du compteur de messages non lus
      if (
        msg.fk_expediteur !== currentUserId &&
        (!selectedUser || msg.fk_expediteur !== selectedUser)
      ) {
        // Jouer une notification sonore selon les paramètres utilisateur
        playNotificationSound(notificationSettings);

        // Mise à jour du compteur
        updateUnreadCounts((prev) => {
          const senderId = msg.fk_expediteur;
          const newCounts = { ...prev, [senderId]: (prev[senderId] || 0) + 1 };
          return newCounts;
        });

        // Afficher une notification toast si la fenêtre n'est pas active
        if (document.visibilityState !== "visible") {
          // Récupérer les infos de l'expéditeur
          const senderInfo =
            usersInfo[msg.fk_expediteur] ||
            (await fetchUserInfo(msg.fk_expediteur));
          const senderName = senderInfo?.name || "Utilisateur";

          // Créer le contenu de la notification
          const messagePreview =
            msg.contenu.length > 50
              ? msg.contenu.substring(0, 50) + "..."
              : msg.contenu;

          // Afficher la notification
          toast.info(
            <div
              onClick={() => {
                navigate(`/direct-messages?userId=${msg.fk_expediteur}`);
                toast.dismiss();
              }}
            >
              <strong>{senderName}</strong>
              <p>{messagePreview}</p>
              {msg.attachments && msg.attachments.length > 0 && (
                <p>
                  <i>Contient {msg.attachments.length} pièce(s) jointe(s)</i>
                </p>
              )}
            </div>,
            {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              onClick: () => {
                navigate(`/direct-messages?userId=${msg.fk_expediteur}`);
              },
            }
          );

          // Utiliser l'API de notification du navigateur si autorisé
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const notifOptions = {
              body: messagePreview,
              icon: senderInfo?.avatar || "/logo192.png",
            };

            const notification = new Notification(
              `Message de ${senderName}`,
              notifOptions
            );

            notification.onclick = function () {
              window.focus();
              navigate(`/direct-messages?userId=${msg.fk_expediteur}`);
              this.close();
            };
          }
        }
      }

      // Ajouter à la conversation active si pertinent
      if (
        selectedUser &&
        (msg.fk_expediteur === selectedUser ||
          msg.fk_destinataire === selectedUser)
      ) {
        let attachments = [];
        try {
          if (msg.id_message_prive) {
            // Récupérer les pièces jointes du message
            const response = await fetch(
              `${API_URL}/api/private-messages/${msg.id_message_prive}/attachments`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );

            if (response.ok) {
              attachments = await response.json();
            }
          }
        } catch (error) {
          console.error("Error fetching attachments:", error);
        }

        // Ajouter message à l'UI
        setMessages((prev) => {
          // Vérifier si le message existe déjà
          const exists = prev.some(
            (m) =>
              m.id_message_prive === msg.id_message_prive ||
              (m.isOptimistic && m.tempId === msg.tempId)
          );

          if (exists) {
            return prev.map((m) => {
              if (
                m.id_message_prive === msg.id_message_prive ||
                (m.isOptimistic && m.tempId === msg.tempId)
              ) {
                return { ...msg, attachments };
              }
              return m;
            });
          } else {
            return [...prev, { ...msg, attachments }];
          }
        });

        // Scroll vers le bas pour voir le nouveau message
        scrollToBottom();
      }

      // Mettre à jour la liste des conversations si nouveau contact
      if (
        !conversations.includes(msg.fk_expediteur) &&
        msg.fk_expediteur !== currentUserId
      ) {
        fetchConversations();
      }
    };

    // Gestion de la mise à jour des messages
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

    // Gestion de la suppression des messages
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

    // Gestion des messages lus
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

    // Gestion des réactions aux messages
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

    // Abonnement aux événements
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
    updateUnreadCounts,
    notificationSettings,
    fetchConversations,
    scrollToBottom,
    setMessages,
  ]);

  // Sélection d'un utilisateur
  const handleSelectUser = useCallback(
    (userId) => {
      // Effacer le compteur de messages non lus
      if (unreadMessageCounts[userId]) {
        const newCounts = { ...unreadMessageCounts };
        newCounts[userId] = 0;
        updateUnreadCounts(newCounts);
        if (refreshUnreadDM) refreshUnreadDM();
      }

      // Mettre à jour l'utilisateur sélectionné et charger ses messages
      setSelectedUser(userId);
      setSelectedUserInfo(usersInfo[userId]);
      fetchMessages(userId);

      // Mettre à jour l'URL pour les partages directs
      navigate(`/direct-messages?userId=${userId}`);
    },
    [
      unreadMessageCounts,
      updateUnreadCounts,
      refreshUnreadDM,
      usersInfo,
      fetchMessages,
      navigate,
    ]
  );

  // Démarrer une nouvelle conversation
  const handleOpenNewConversation = useCallback(() => {
    setShowNewConversationModal(true);
    fetchAvailableUsers();
  }, [setShowNewConversationModal, fetchAvailableUsers]);

  // Sélectionner un utilisateur depuis la modale nouvelle conversation
  const handleStartConversation = useCallback(
    (userId) => {
      // Ajouter à la liste des conversations si nécessaire
      const addedUserId = startConversationWith(userId);

      // Charger les messages de cet utilisateur
      handleSelectUser(addedUserId);

      // Fermer la modale
      setShowNewConversationModal(false);
    },
    [startConversationWith, handleSelectUser, setShowNewConversationModal]
  );

  // Gestion du menu contextuel des messages
  const handleMessageContextMenu = useCallback(
    (e, msg) => {
      e.preventDefault();
      e.stopPropagation();
      const isOwnMsg = msg.fk_expediteur === currentUserId;
      setMessageContextMenu({
        visible: true,
        xPos: e.pageX,
        yPos: e.pageY,
        messageId: msg.id_message_prive,
        isOwnMessage: isOwnMsg,
        message: msg,
      });
    },
    [currentUserId, setMessageContextMenu]
  );

  // Fermer le menu contextuel des messages
  const handleCloseMessageContextMenu = useCallback(() => {
    setMessageContextMenu((prev) => ({ ...prev, visible: false }));
  }, [setMessageContextMenu]);

  // Gestion du menu contextuel des conversations
  const handleConversationContextMenu = useCallback(
    (e, userId) => {
      e.preventDefault();
      e.stopPropagation();
      setConversationContextMenu({
        visible: true,
        xPos: e.pageX,
        yPos: e.pageY,
        userId: userId,
      });
    },
    [setConversationContextMenu]
  );

  // Fermer le menu contextuel des conversations
  const handleCloseConversationContextMenu = useCallback(() => {
    setConversationContextMenu((prev) => ({ ...prev, visible: false }));
  }, [setConversationContextMenu]);

  // Répondre à un message
  const handleReplyMessage = useCallback(() => {
    setReplyingTo(messageContextMenu.message);
    handleCloseMessageContextMenu();
  }, [messageContextMenu, setReplyingTo, handleCloseMessageContextMenu]);

  // Modifier un message
  const handleEditMessage = useCallback(() => {
    setEditingMessage(messageContextMenu.message);
    setEditMessageContent(messageContextMenu.message.contenu);
    handleCloseMessageContextMenu();
  }, [
    messageContextMenu,
    setEditingMessage,
    setEditMessageContent,
    handleCloseMessageContextMenu,
  ]);

  // Supprimer un message
  const handleDeleteMessage = useCallback(() => {
    if (!socket || !messageContextMenu.messageId) return;

    socket.emit("deletePrivateMessage", { id: messageContextMenu.messageId });
    handleCloseMessageContextMenu();
  }, [socket, messageContextMenu, handleCloseMessageContextMenu]);

  // Ajouter une réaction
  const handleAddReaction = useCallback(() => {
    setShowEmojiPicker(true);
    setEmojiPickerPosition({
      top: messageContextMenu.yPos,
      left: messageContextMenu.xPos,
    });
    handleCloseMessageContextMenu();
  }, [
    messageContextMenu,
    setShowEmojiPicker,
    setEmojiPickerPosition,
    handleCloseMessageContextMenu,
  ]);

  // Sélectionner un emoji
  const handleEmojiSelect = useCallback(
    (emoji) => {
      if (!socket || !messageContextMenu.messageId) return;

      socket.emit("addPrivateMessageReaction", {
        id: messageContextMenu.messageId,
        reaction: emoji,
      });

      setShowEmojiPicker(false);
    },
    [socket, messageContextMenu, setShowEmojiPicker]
  );

  // Gestion des mentions
  const renderTextWithMentions = useCallback(
    (text) => {
      if (!text) return "";

      const mentionRegex = /@\[([0-9a-f-]+):([^\]]+)\]/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = mentionRegex.exec(text)) !== null) {
        // Ajouter le texte avant la mention
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }

        // Ajouter la mention comme élément cliquable
        const userId = match[1];
        const username = match[2];
        parts.push(
          <span
            key={`mention-${userId}-${match.index}`}
            className="mention-tag"
            onClick={() => {
              navigate(`/direct-messages?userId=${userId}`);
            }}
          >
            @{username}
          </span>
        );

        lastIndex = mentionRegex.lastIndex;
      }

      // Ajouter le texte restant
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts;
    },
    [navigate]
  );

  // Recherche des utilisateurs pour les mentions
  const searchUserMentions = useCallback(
    async (searchText) => {
      if (!searchText) {
        setMentionSuggestions([]);
        return;
      }

      try {
        // Utiliser les utilisateurs déjà en mémoire
        if (Object.keys(usersInfo).length > 0) {
          const users = Object.values(usersInfo).filter(
            (user) =>
              user.name &&
              user.name.toLowerCase().includes(searchText.toLowerCase())
          );

          if (users.length > 0) {
            setMentionSuggestions(users);
            setActiveMentionIndex(0);
            return;
          }
        }

        // Sinon, requête API
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/users?search=${searchText}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const apiUsers = await res.json();
          const normalizedUsers = apiUsers.map((user) => ({
            id: user.id_utilisateur,
            name: user.nom || "Utilisateur",
          }));

          setMentionSuggestions(normalizedUsers);
          setActiveMentionIndex(0);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche d'utilisateurs:", error);
      }
    },
    [usersInfo]
  );

  // Insérer une mention
  const handleMentionSelect = useCallback(
    (user) => {
      if (!mentionStartIndex && mentionStartIndex !== 0) return;

      // Extraire les parties du message
      const beforeMention = newMessage.substring(0, mentionStartIndex);
      const afterSearchText = newMessage.substring(
        mentionStartIndex +
          (newMessage.substring(mentionStartIndex).indexOf(" ") > -1
            ? newMessage.substring(mentionStartIndex).indexOf(" ") +
              mentionStartIndex
            : newMessage.length)
      );

      // Format visible pour l'utilisateur: @username
      const visibleText = `${beforeMention}@${user.name} ${afterSearchText}`;

      // Format interne pour le traitement: @[userId:username]
      const internalFormat = `@[${user.id}:${user.name}]`;

      // Mémoriser la position du curseur
      const cursorPosition = mentionStartIndex + user.name.length + 2; // +2 pour @ et espace

      // Mettre à jour l'affichage
      setNewMessage(visibleText);

      // Stocker la correspondance
      const newMentionMap = new Map(mentionMap);
      newMentionMap.set(`@${user.name}`, internalFormat);
      setMentionMap(newMentionMap);

      // Fermer la liste de suggestions
      setShowMentionSuggestions(false);
      setMentionStartIndex(null);

      // Remettre le focus
      setTimeout(() => {
        const inputElement = document.querySelector(".dm-input");
        if (inputElement) {
          inputElement.focus();
          if (typeof inputElement.setSelectionRange === "function") {
            inputElement.setSelectionRange(cursorPosition, cursorPosition);
          }
        }
      }, 0);
    },
    [mentionStartIndex, newMessage, mentionMap, setNewMessage]
  );

  // Gérer l'entrée utilisateur pour les mentions
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setNewMessage(value);

      // Détecter les @mentions
      const lastAtPos = value.lastIndexOf("@");
      if (lastAtPos !== -1) {
        const textAfterAt = value.substring(lastAtPos + 1);
        const spaceAfterAt = textAfterAt.indexOf(" ");
        const mentionSearch =
          spaceAfterAt === -1
            ? textAfterAt
            : textAfterAt.substring(0, spaceAfterAt);

        if (
          mentionSearch.length === 0 ||
          (mentionSearch.length > 0 && spaceAfterAt === -1)
        ) {
          setMentionStartIndex(lastAtPos);
          searchUserMentions(mentionSearch);
          setShowMentionSuggestions(true);
          return;
        }
      }

      setShowMentionSuggestions(false);
    },
    [setNewMessage, searchUserMentions]
  );

  // Envoyer un message
  const handleSendMessage = useCallback(
    (e) => {
      e?.preventDefault();

      if ((!newMessage.trim() && attachments.length === 0) || !selectedUser)
        return;

      try {
        // Convertir les mentions visibles en format interne
        let processedMessage = newMessage;
        mentionMap.forEach((internalFormat, visibleMention) => {
          const mentionRegex = new RegExp(`${visibleMention}(\\s|$)`, "g");
          processedMessage = processedMessage.replace(
            mentionRegex,
            `${internalFormat} `
          );
        });

        // Générer un ID temporaire unique pour identifier ce message
        const tempId = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Créer un message optimiste pour l'affichage immédiat
        const optimisticMsg = {
          id_message_prive: tempId,
          contenu: processedMessage,
          fk_expediteur: currentUserId,
          fk_destinataire: selectedUser,
          date_envoi: new Date().toISOString(),
          date_creation: new Date().toISOString(),
          isOptimistic: true,
          tempId: tempId, // Pour identification par le serveur
          attachments: attachments.map((att) => ({
            id_fichier: att.id_fichier,
            nom_fichier: att.nom_fichier,
            url: att.url || att.presignedUrl,
            presignedUrl: att.presignedUrl || att.url,
            type: att.type,
            taille_fichier: att.taille_fichier,
          })),
        };

        // Ajouter à l'UI immédiatement
        setMessages((prev) => [...prev, optimisticMsg]);

        // Préparer les données pour l'envoi
        const messageData = {
          destinataireId: selectedUser,
          contenu: processedMessage,
          tempId: tempId,
          replyToId: replyingTo ? replyingTo.id_message_prive : null,
          attachments: attachments.map((att) => att.id_fichier),
        };

        console.log("[DM] Envoi du message avec pièces jointes:", messageData);

        // Envoi via socket
        if (socket && socket.connected) {
          socket.emit("privateMessage", messageData, (response) => {
            if (response && !response.ok) {
              console.error("Erreur socket:", response.message);
              // Fallback vers API REST
              sendMessage(
                processedMessage,
                selectedUser,
                replyingTo,
                attachments.map((att) => att.id_fichier)
              );
            }
          });
        } else {
          // Envoi via API REST si socket non disponible
          sendMessage(
            processedMessage,
            selectedUser,
            replyingTo,
            attachments.map((att) => att.id_fichier)
          );
        }

        // Réinitialiser les états après envoi
        setNewMessage("");
        setReplyingTo(null);
        setAttachments([]);
        setMentionMap(new Map());

        // Scroll vers le bas
        scrollToBottom();
      } catch (e) {
        console.error("Erreur lors de l'envoi du message:", e);
      }
    },
    [
      newMessage,
      attachments,
      selectedUser,
      currentUserId,
      mentionMap,
      replyingTo,
      socket,
      setMessages,
      setNewMessage,
      setReplyingTo,
      setAttachments,
      scrollToBottom,
      sendMessage,
    ]
  );

  // Demander l'autorisation pour les notifications du navigateur
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if (
        "Notification" in window &&
        Notification.permission !== "granted" &&
        Notification.permission !== "denied"
      ) {
        try {
          const permission = await Notification.requestPermission();
          console.log(`[DM] Notification permission ${permission}`);
        } catch (error) {
          console.error(
            "[DM] Error requesting notification permission:",
            error
          );
        }
      }
    };

    requestNotificationPermission();

    // Vérification du token et récupération de l'ID utilisateur
    const checkTokenValidity = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("Token non trouvé dans localStorage");
          return { valid: false, error: "Token non trouvé" };
        }

        // Découper et décoder le token JWT
        const parts = token.split(".");
        if (parts.length !== 3) {
          console.log("Format de token JWT invalide");
          return { valid: false, error: "Format de token invalide" };
        }

        // Décoder le payload (partie centrale du token)
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        return {
          valid: currentTime < payload.exp,
          error: currentTime > payload.exp ? "Token expiré" : null,
          details: payload,
        };
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        return { valid: false, error: error.message };
      }
    };

    const tokenStatus = checkTokenValidity();
    if (tokenStatus.valid && tokenStatus.details && tokenStatus.details.id) {
      setCurrentUserId(tokenStatus.details.id);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Charger les conversations au démarrage
  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // Effet pour lire les paramètres d'URL et charger la conversation appropriée
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userIdFromQuery = params.get("userId");

    if (userIdFromQuery && currentUserId) {
      setSelectedUser(userIdFromQuery);
      fetchMessages(userIdFromQuery);

      // Charger les informations de l'utilisateur si nécessaire
      if (!usersInfo[userIdFromQuery]) {
        fetchUserInfo(userIdFromQuery).then((userInfo) => {
          if (userInfo) {
            setSelectedUserInfo(userInfo);
          }
        });
      } else {
        setSelectedUserInfo(usersInfo[userIdFromQuery]);
      }
    }
  }, [location.search, currentUserId, fetchMessages, fetchUserInfo, usersInfo]);

  // Gestion des événements WebSocket
  useEffect(() => {
    if (!socket || !currentUserId) return;

    // Gestion des nouveaux messages privés
    const handlePrivateMessage = async (msg) => {
      console.log("[DM] Received private message:", msg);

      if (!currentUserId) return;

      // Mise à jour du compteur de messages non lus
      if (
        msg.fk_expediteur !== currentUserId &&
        (!selectedUser || msg.fk_expediteur !== selectedUser)
      ) {
        // Jouer une notification sonore selon les paramètres utilisateur
        playNotificationSound(notificationSettings);

        // Mise à jour du compteur
        updateUnreadCounts((prev) => {
          const senderId = msg.fk_expediteur;
          const newCounts = { ...prev, [senderId]: (prev[senderId] || 0) + 1 };
          return newCounts;
        });

        // Afficher une notification toast si la fenêtre n'est pas active
        if (document.visibilityState !== "visible") {
          // Récupérer les infos de l'expéditeur
          const senderInfo =
            usersInfo[msg.fk_expediteur] ||
            (await fetchUserInfo(msg.fk_expediteur));
          const senderName = senderInfo?.name || "Utilisateur";

          // Créer le contenu de la notification
          const messagePreview =
            msg.contenu.length > 50
              ? msg.contenu.substring(0, 50) + "..."
              : msg.contenu;

          // Afficher la notification
          toast.info(
            <div
              onClick={() => {
                navigate(`/direct-messages?userId=${msg.fk_expediteur}`);
                toast.dismiss();
              }}
            >
              <strong>{senderName}</strong>
              <p>{messagePreview}</p>
              {msg.attachments && msg.attachments.length > 0 && (
                <p>
                  <i>Contient {msg.attachments.length} pièce(s) jointe(s)</i>
                </p>
              )}
            </div>,
            {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              onClick: () => {
                navigate(`/direct-messages?userId=${msg.fk_expediteur}`);
              },
            }
          );

          // Utiliser l'API de notification du navigateur si autorisé
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const notifOptions = {
              body: messagePreview,
              icon: senderInfo?.avatar || "/logo192.png",
            };

            const notification = new Notification(
              `Message de ${senderName}`,
              notifOptions
            );

            notification.onclick = function () {
              window.focus();
              navigate(`/direct-messages?userId=${msg.fk_expediteur}`);
              this.close();
            };
          }
        }
      }

      // Ajouter à la conversation active si pertinent
      if (
        selectedUser &&
        (msg.fk_expediteur === selectedUser ||
          msg.fk_destinataire === selectedUser)
      ) {
        let attachments = [];
        try {
          if (msg.id_message_prive) {
            // Récupérer les pièces jointes du message
            const response = await fetch(
              `${API_URL}/api/private-messages/${msg.id_message_prive}/attachments`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );

            if (response.ok) {
              attachments = await response.json();
            }
          }
        } catch (error) {
          console.error("Error fetching attachments:", error);
        }

        // Ajouter message à l'UI
        setMessages((prev) => {
          // Vérifier si le message existe déjà
          const exists = prev.some(
            (m) =>
              m.id_message_prive === msg.id_message_prive ||
              (m.isOptimistic && m.tempId === msg.tempId)
          );

          if (exists) {
            return prev.map((m) => {
              if (
                m.id_message_prive === msg.id_message_prive ||
                (m.isOptimistic && m.tempId === msg.tempId)
              ) {
                return { ...msg, attachments };
              }
              return m;
            });
          } else {
            return [...prev, { ...msg, attachments }];
          }
        });

        // Scroll vers le bas pour voir le nouveau message
        scrollToBottom();
      }

      // Mettre à jour la liste des conversations si nouveau contact
      if (
        !conversations.includes(msg.fk_expediteur) &&
        msg.fk_expediteur !== currentUserId
      ) {
        fetchConversations();
      }
    };

    // Gestion de la mise à jour des messages
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

    // Gestion de la suppression des messages
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

    // Gestion des messages lus
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

    // Gestion des réactions aux messages
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

    // Abonnement aux événements
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
    updateUnreadCounts,
    notificationSettings,
    fetchConversations,
    scrollToBottom,
    setMessages,
  ]);

  // Sélection d'un utilisateur
  const handleSelectUser = useCallback(
    (userId) => {
      // Effacer le compteur de messages non lus
      if (unreadMessageCounts[userId]) {
        const newCounts = { ...unreadMessageCounts };
        newCounts[userId] = 0;
        updateUnreadCounts(newCounts);
        if (refreshUnreadDM) refreshUnreadDM();
      }

      // Mettre à jour l'utilisateur sélectionné et charger ses messages
      setSelectedUser(userId);
      setSelectedUserInfo(usersInfo[userId]);
      fetchMessages(userId);

      // Mettre à jour l'URL pour les partages directs
      navigate(`/direct-messages?userId=${userId}`);
    },
    [
      unreadMessageCounts,
      updateUnreadCounts,
      refreshUnreadDM,
      usersInfo,
      fetchMessages,
      navigate,
    ]
  );

  // Démarrer une nouvelle conversation
  const handleOpenNewConversation = useCallback(() => {
    setShowNewConversationModal(true);
    fetchAvailableUsers();
  }, [setShowNewConversationModal, fetchAvailableUsers]);

  // Sélectionner un utilisateur depuis la modale nouvelle conversation
  const handleStartConversation = useCallback(
    (userId) => {
      // Ajouter à la liste des conversations si nécessaire
      const addedUserId = startConversationWith(userId);

      // Charger les messages de cet utilisateur
      handleSelectUser(addedUserId);

      // Fermer la modale
      setShowNewConversationModal(false);
    },
    [startConversationWith, handleSelectUser, setShowNewConversationModal]
  );

  // Gestion du menu contextuel des messages
  const handleMessageContextMenu = useCallback(
    (e, msg) => {
      e.preventDefault();
      e.stopPropagation();
      const isOwnMsg = msg.fk_expediteur === currentUserId;
      setMessageContextMenu({
        visible: true,
        xPos: e.pageX,
        yPos: e.pageY,
        messageId: msg.id_message_prive,
        isOwnMessage: isOwnMsg,
        message: msg,
      });
    },
    [currentUserId, setMessageContextMenu]
  );

  // Fermer le menu contextuel des messages
  const handleCloseMessageContextMenu = useCallback(() => {
    setMessageContextMenu((prev) => ({ ...prev, visible: false }));
  }, [setMessageContextMenu]);

  // Gestion du menu contextuel des conversations
  const handleConversationContextMenu = useCallback(
    (e, userId) => {
      e.preventDefault();
      e.stopPropagation();
      setConversationContextMenu({
        visible: true,
        xPos: e.pageX,
        yPos: e.pageY,
        userId: userId,
      });
    },
    [setConversationContextMenu]
  );

  // Fermer le menu contextuel des conversations
  const handleCloseConversationContextMenu = useCallback(() => {
    setConversationContextMenu((prev) => ({ ...prev, visible: false }));
  }, [setConversationContextMenu]);

  // Répondre à un message
  const handleReplyMessage = useCallback(() => {
    setReplyingTo(messageContextMenu.message);
    handleCloseMessageContextMenu();
  }, [messageContextMenu, setReplyingTo, handleCloseMessageContextMenu]);

  // Modifier un message
  const handleEditMessage = useCallback(() => {
    setEditingMessage(messageContextMenu.message);
    setEditMessageContent(messageContextMenu.message.contenu);
    handleCloseMessageContextMenu();
  }, [
    messageContextMenu,
    setEditingMessage,
    setEditMessageContent,
    handleCloseMessageContextMenu,
  ]);

  // Supprimer un message
  const handleDeleteMessage = useCallback(() => {
    if (!socket || !messageContextMenu.messageId) return;

    socket.emit("deletePrivateMessage", { id: messageContextMenu.messageId });
    handleCloseMessageContextMenu();
  }, [socket, messageContextMenu, handleCloseMessageContextMenu]);

  // Ajouter une réaction
  const handleAddReaction = useCallback(() => {
    setShowEmojiPicker(true);
    setEmojiPickerPosition({
      top: messageContextMenu.yPos,
      left: messageContextMenu.xPos,
    });
    handleCloseMessageContextMenu();
  }, [
    messageContextMenu,
    setShowEmojiPicker,
    setEmojiPickerPosition,
    handleCloseMessageContextMenu,
  ]);

  // Sélectionner un emoji
  const handleEmojiSelect = useCallback(
    (emoji) => {
      if (!socket || !messageContextMenu.messageId) return;

      socket.emit("addPrivateMessageReaction", {
        id: messageContextMenu.messageId,
        reaction: emoji,
      });

      setShowEmojiPicker(false);
    },
    [socket, messageContextMenu, setShowEmojiPicker]
  );

  // Gestion des mentions
  const renderTextWithMentions = useCallback(
    (text) => {
      if (!text) return "";

      const mentionRegex = /@\[([0-9a-f-]+):([^\]]+)\]/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = mentionRegex.exec(text)) !== null) {
        // Ajouter le texte avant la mention
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }

        // Ajouter la mention comme élément cliquable
        const userId = match[1];
        const username = match[2];
        parts.push(
          <span
            key={`mention-${userId}-${match.index}`}
            className="mention-tag"
            onClick={() => {
              navigate(`/direct-messages?userId=${userId}`);
            }}
          >
            @{username}
          </span>
        );

        lastIndex = mentionRegex.lastIndex;
      }

      // Ajouter le texte restant
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts;
    },
    [navigate]
  );

  // Recherche des utilisateurs pour les mentions
  const searchUserMentions = useCallback(
    async (searchText) => {
      if (!searchText) {
        setMentionSuggestions([]);
        return;
      }

      try {
        // Utiliser les utilisateurs déjà en mémoire
        if (Object.keys(usersInfo).length > 0) {
          const users = Object.values(usersInfo).filter(
            (user) =>
              user.name &&
              user.name.toLowerCase().includes(searchText.toLowerCase())
          );

          if (users.length > 0) {
            setMentionSuggestions(users);
            setActiveMentionIndex(0);
            return;
          }
        }

        // Sinon, requête API
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/users?search=${searchText}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const apiUsers = await res.json();
          const normalizedUsers = apiUsers.map((user) => ({
            id: user.id_utilisateur,
            name: user.nom || "Utilisateur",
          }));

          setMentionSuggestions(normalizedUsers);
          setActiveMentionIndex(0);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche d'utilisateurs:", error);
      }
    },
    [usersInfo]
  );

  // Insérer une mention
  const handleMentionSelect = useCallback(
    (user) => {
      if (!mentionStartIndex && mentionStartIndex !== 0) return;

      // Extraire les parties du message
      const beforeMention = newMessage.substring(0, mentionStartIndex);
      const afterSearchText = newMessage.substring(
        mentionStartIndex +
          (newMessage.substring(mentionStartIndex).indexOf(" ") > -1
            ? newMessage.substring(mentionStartIndex).indexOf(" ") +
              mentionStartIndex
            : newMessage.length)
      );

      // Format visible pour l'utilisateur: @username
      const visibleText = `${beforeMention}@${user.name} ${afterSearchText}`;

      // Format interne pour le traitement: @[userId:username]
      const internalFormat = `@[${user.id}:${user.name}]`;

      // Mémoriser la position du curseur
      const cursorPosition = mentionStartIndex + user.name.length + 2; // +2 pour @ et espace

      // Mettre à jour l'affichage
      setNewMessage(visibleText);

      // Stocker la correspondance
      const newMentionMap = new Map(mentionMap);
      newMentionMap.set(`@${user.name}`, internalFormat);
      setMentionMap(newMentionMap);

      // Fermer la liste de suggestions
      setShowMentionSuggestions(false);
      setMentionStartIndex(null);

      // Remettre le focus
      setTimeout(() => {
        const inputElement = document.querySelector(".dm-input");
        if (inputElement) {
          inputElement.focus();
          if (typeof inputElement.setSelectionRange === "function") {
            inputElement.setSelectionRange(cursorPosition, cursorPosition);
          }
        }
      }, 0);
    },
    [mentionStartIndex, newMessage, mentionMap, setNewMessage]
  );

  // Gérer l'entrée utilisateur pour les mentions
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setNewMessage(value);

      // Détecter les @mentions
      const lastAtPos = value.lastIndexOf("@");
      if (lastAtPos !== -1) {
        const textAfterAt = value.substring(lastAtPos + 1);
        const spaceAfterAt = textAfterAt.indexOf(" ");
        const mentionSearch =
          spaceAfterAt === -1
            ? textAfterAt
            : textAfterAt.substring(0, spaceAfterAt);

        if (
          mentionSearch.length === 0 ||
          (mentionSearch.length > 0 && spaceAfterAt === -1)
        ) {
          setMentionStartIndex(lastAtPos);
          searchUserMentions(mentionSearch);
          setShowMentionSuggestions(true);
          return;
        }
      }

      setShowMentionSuggestions(false);
    },
    [setNewMessage, searchUserMentions]
  );

  // Envoyer un message
  const handleSendMessage = useCallback(
    (e) => {
      e?.preventDefault();

      if ((!newMessage.trim() && attachments.length === 0) || !selectedUser)
        return;

      try {
        // Convertir les mentions visibles en format interne
        let processedMessage = newMessage;
        mentionMap.forEach((internalFormat, visibleMention) => {
          const mentionRegex = new RegExp(`${visibleMention}(\\s|$)`, "g");
          processedMessage = processedMessage.replace(
            mentionRegex,
            `${internalFormat} `
          );
        });

        // Générer un ID temporaire unique pour identifier ce message
        const tempId = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Créer un message optimiste pour l'affichage immédiat
        const optimisticMsg = {
          id_message_prive: tempId,
          contenu: processedMessage,
          fk_expediteur: currentUserId,
          fk_destinataire: selectedUser,
          date_envoi: new Date().toISOString(),
          date_creation: new Date().toISOString(),
          isOptimistic: true,
          tempId: tempId, // Pour identification par le serveur
          attachments: attachments.map((att) => ({
            id_fichier: att.id_fichier,
            nom_fichier: att.nom_fichier,
            url: att.url || att.presignedUrl,
            presignedUrl: att.presignedUrl || att.url,
            type: att.type,
            taille_fichier: att.taille_fichier,
          })),
        };

        // Ajouter à l'UI immédiatement
        setMessages((prev) => [...prev, optimisticMsg]);

        // Préparer les données pour l'envoi
        const messageData = {
          destinataireId: selectedUser,
          contenu: processedMessage,
          tempId: tempId,
          replyToId: replyingTo ? replyingTo.id_message_prive : null,
          attachments: attachments.map((att) => att.id_fichier),
        };

        console.log("[DM] Envoi du message avec pièces jointes:", messageData);

        // Envoi via socket
        if (socket && socket.connected) {
          socket.emit("privateMessage", messageData, (response) => {
            if (response && !response.ok) {
              console.error("Erreur socket:", response.message);
              // Fallback vers API REST
              sendMessage(
                processedMessage,
                selectedUser,
                replyingTo,
                attachments.map((att) => att.id_fichier)
              );
            }
          });
        } else {
          // Envoi via API REST si socket non disponible
          sendMessage(
            processedMessage,
            selectedUser,
            replyingTo,
            attachments.map((att) => att.id_fichier)
          );
        }

        // Réinitialiser les états après envoi
        setNewMessage("");
        setReplyingTo(null);
        setAttachments([]);
        setMentionMap(new Map());

        // Scroll vers le bas
        scrollToBottom();
      } catch (e) {
        console.error("Erreur lors de l'envoi du message:", e);
      }
    },
    [
      newMessage,
      attachments,
      selectedUser,
      currentUserId,
      mentionMap,
      replyingTo,
      socket,
      setMessages,
      setNewMessage,
      setReplyingTo,
      setAttachments,
      scrollToBottom,
      sendMessage,
    ]
  );

  return (
    <div className="app-layout">
      <Sidebar unreadMessageCount={totalUnreadCount} />
      <div className="dm-layout">
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
          onUserSelect={handleSelectUser}
          onOpenNewConversation={handleOpenNewConversation}
          onConversationContextMenu={handleConversationContextMenu}
        />

        {/* Zone des messages */}
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
          editingMessage={editingMessage}
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
          handleFileSelect={handleFileSelect} // Assurez-vous que cette prop est correctement transmise
          handleAttachmentClick={triggerFileInput}
          handleSendMessage={handleSendMessage}
          handleInputChange={handleInputChange}
          handleCancelReply={() => setReplyingTo(null)}
          handleSaveEdit={() => {
            if (!editingMessage) return;
            editMessage(editingMessage.id_message_prive, editMessageContent);
            setEditingMessage(null);
            setEditMessageContent("");
          }}
          handleCancelEdit={() => {
            setEditingMessage(null);
            setEditMessageContent("");
          }}
          removeAttachment={(index) => {
            setAttachments(attachments.filter((_, i) => i !== index));
          }}
          onMessageContextMenu={handleMessageContextMenu}
          onCloseMessageContextMenu={handleCloseMessageContextMenu}
          onReplyMessage={handleReplyMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onAddReaction={handleAddReaction}
          onEmojiSelect={handleEmojiSelect}
          onDownloadFile={downloadFile}
          showMentionSuggestions={showMentionSuggestions}
          mentionSuggestions={mentionSuggestions}
          activeMentionIndex={activeMentionIndex}
          onMentionSelect={handleMentionSelect}
          renderTextWithMentions={renderTextWithMentions}
          formatMessageDate={formatMessageDate}
          getFileIcon={getFileIcon}
          getCompleteFileUrl={getCompleteFileUrl}
          formatFileSize={formatFileSize}
        />

        {/* Menu contextuel pour les conversations */}
        {conversationContextMenu.visible && (
          <ConversationContextMenu
            visible={conversationContextMenu.visible}
            xPos={conversationContextMenu.xPos}
            yPos={conversationContextMenu.yPos}
            userId={conversationContextMenu.userId}
            onOpenConversation={(userId) => {
              handleSelectUser(userId);
              handleCloseConversationContextMenu();
            }}
            onDeleteConversation={(userId) => {
              deleteConversation(userId);
              if (selectedUser === userId) {
                setSelectedUser(null);
                setSelectedUserInfo(null);
                navigate("/direct-messages");
              }
              handleCloseConversationContextMenu();
            }}
            onClose={handleCloseConversationContextMenu}
          />
        )}

        {/* Modal pour nouvelle conversation */}
        {showNewConversationModal && (
          <NewConversationModal
            show={showNewConversationModal}
            onClose={() => setShowNewConversationModal(false)}
            searchQuery={searchUserQuery}
            setSearchQuery={setSearchUserQuery}
            filteredUsers={filteredUsers}
            loadingUsers={loadingUsers}
            onStartConversation={handleStartConversation}
          />
        )}
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default DirectMessages;
