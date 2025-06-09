// Hook personnalisé pour gérer les conversations
import { useState, useEffect, useCallback } from "react";
import { safeJSONParse } from "../utils/jsonUtils";
// import { useSocket } from "../../context/SocketContext";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.63:3000";

/**
 * Hook pour gérer les conversations et les utilisateurs
 * @param {Object} options - Options du hook
 * @param {Object} options.socket - Instance socket.io à utiliser pour l'écoute temps réel (optionnel)
 * @returns {Object} - Les états et fonctions liés aux conversations
 */
export const useConversations = (options = {}) => {
  // Déclaration de tous les hooks d'état
  const [conversations, setConversations] = useState([]);
  const [usersInfo, setUsersInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationContextMenu, setConversationContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    userId: null,
  });
  const { socket } = options;

  /**
   * Calcule le nombre total de messages non lus
   * @param {Object} countsObj - Objet avec les compteurs par conversation
   * @returns {number} - Total des messages non lus
   */
  const calculateTotalUnreadCount = useCallback((countsObj) => {
    if (!countsObj) return 0;
    return Object.values(countsObj).reduce((sum, count) => sum + count, 0);
  }, []);
  /**
   * Remet à zéro le compteur de non lus pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   */
  const resetUnreadCountForUser = useCallback(
    (userId) => {
      if (!userId) return;

      console.log(
        "[useConversations] Réinitialisation du compteur pour",
        userId
      );

      setUnreadMessageCounts((prev) => {
        // Si le compteur est déjà à 0 ou n'existe pas, ne rien faire
        if (!prev[userId] || prev[userId] === 0) return prev;

        // Créer de nouveaux compteurs en mettant à zéro le compteur de l'utilisateur
        const newCounts = { ...prev, [userId]: 0 };
        const newTotal = calculateTotalUnreadCount(newCounts);

        console.log("[useConversations] Nouveau total après reset:", newTotal);

        // Mettre à jour le total
        setTotalUnreadCount(newTotal);

        // Sauvegarder dans localStorage
        localStorage.setItem("unreadDMCounts", JSON.stringify(newCounts));
        localStorage.setItem("unreadPrivateMessages", newTotal.toString());

        // Nous utiliserons un setTimeout pour déplacer la distribution d'événement
        // hors du cycle de rendu de React, évitant ainsi l'erreur
        setTimeout(() => {
          // Émettre un événement pour notifier les autres composants
          window.dispatchEvent(
            new CustomEvent("unreadMessagesUpdated", {
              detail: { count: newTotal, counts: newCounts },
            })
          );
        }, 0);

        return newCounts;
      });
    },
    [calculateTotalUnreadCount]
  );
  /**
   * Sélectionne un utilisateur pour la conversation et réinitialise son compteur de messages non lus
   * @param {string} userId - ID de l'utilisateur
   */ const handleSelectUser = useCallback(
    (userId) => {
      setSelectedUser(userId);
      // Réinitialiser le compteur de messages non lus pour cet utilisateur
      resetUnreadCountForUser(userId); // Notifier le serveur que les messages de cet utilisateur ont été lus
      if (socket && socket.connected && userId) {
        console.log(
          `[useConversations] Marquage des messages de ${userId} comme lus`
        );
        socket.emit("readAllPrivateMessages", {
          senderId: userId,
          recipientId: currentUserId,
        });
      }
    },
    [resetUnreadCountForUser, socket]
  );

  /**
   * Récupère les informations d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   */
  const fetchUserInfo = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Erreur lors de la récupération des infos utilisateur ${userId}`
        );
      }

      const userData = await response.json();

      setUsersInfo((prev) => ({
        ...prev,
        [userId]: {
          id: userData.id_utilisateur,
          name: userData.nom,
          avatar: userData.photo_de_profil,
          status: userData.status || "offline",
        },
      }));

      return userData;
    } catch (error) {
      console.error(`Erreur pour l'utilisateur ${userId}:`, error);
      return null;
    }
  }, []);
  /**
   * Récupère la liste des conversations
   */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      console.log("[useConversations] Récupération des conversations...");

      if (!token) {
        console.error("[useConversations] Pas de token d'authentification");
        setError("Vous n'êtes pas connecté");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/private-messages/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`[useConversations] Erreur HTTP: ${response.status}`);
        throw new Error(
          `Erreur lors de la récupération des conversations: ${response.status}`
        );
      }

      const data = await response.json();
      let convList = [];
      if (Array.isArray(data)) {
        convList = data;
      } else if (data.conversations && Array.isArray(data.conversations)) {
        convList = data.conversations;
      } else {
        console.error("[useConversations] Format de données invalide:", data);
        throw new Error("Format de données invalide pour les conversations");
      }

      console.log(
        `[useConversations] ${convList.length} conversations récupérées:`,
        convList
      );

      // Vérifier si la liste a changé pour éviter de déclencher des rendus inutiles
      setConversations((prev) => {
        // Tri des tableaux pour garantir une comparaison correcte
        const sortedPrev = [...prev].sort();
        const sortedNew = [...convList].sort();

        if (JSON.stringify(sortedPrev) === JSON.stringify(sortedNew)) {
          console.log(
            "[useConversations] Aucun changement dans les conversations"
          );
          return prev;
        }
        return convList;
      });

      // Charger les infos utilisateurs pour chaque conversation
      await Promise.all(convList.map((userId) => fetchUserInfo(userId)));
    } catch (error) {
      console.error("[useConversations] Erreur:", error);
      setError("Impossible de charger les conversations");
      // Ne pas effacer les conversations existantes en cas d'erreur
      // pour éviter de perdre des données UI déjà affichées
    } finally {
      setLoading(false);
    }
  }, [fetchUserInfo, API_URL]);

  /**
   * Récupère la liste des utilisateurs disponibles
   */
  const fetchAvailableUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des utilisateurs");
      }

      const data = await response.json();
      setAvailableUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de charger les utilisateurs");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  /**
   * Met à jour les compteurs de messages non lus
   * @param {Object} newCounts - Nouveaux compteurs
   */
  const updateUnreadCounts = useCallback(
    (newCounts) => {
      setUnreadMessageCounts(newCounts);
      const total = calculateTotalUnreadCount(newCounts);
      setTotalUnreadCount(total);
      localStorage.setItem("unreadDMCounts", JSON.stringify(newCounts));
    },
    [calculateTotalUnreadCount]
  );

  /**
   * Rafraîchit les compteurs de messages non lus depuis le localStorage
   */
  const refreshUnreadCounts = useCallback(() => {
    const unreadCountsFromStorage = safeJSONParse(
      localStorage.getItem("unreadDMCounts"),
      {}
    );

    // Nettoyer les compteurs potentiellement invalides
    const cleanCounts = {};
    Object.keys(unreadCountsFromStorage).forEach((key) => {
      const count = parseInt(unreadCountsFromStorage[key]);
      if (!isNaN(count) && count > 0) {
        cleanCounts[key] = count;
      }
    });

    // Si l'utilisateur sélectionné a déjà un compteur, le réinitialiser
    if (selectedUser && cleanCounts[selectedUser]) {
      cleanCounts[selectedUser] = 0;
    }

    setUnreadMessageCounts(cleanCounts);
    const total = calculateTotalUnreadCount(cleanCounts);
    setTotalUnreadCount(total);

    return { counts: cleanCounts, total };
  }, [calculateTotalUnreadCount, selectedUser]);

  /**
   * Filtre les conversations en fonction de la recherche
   */
  const getFilteredConversations = useCallback(() => {
    if (!searchQuery.trim()) return conversations;

    return conversations.filter((userId) => {
      const user = usersInfo[userId] || {};
      const username = user.name || "";
      return username.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, usersInfo, searchQuery]);

  /**
   * Ouvre le modal de nouvelle conversation
   */
  const handleOpenNewConversation = useCallback(() => {
    setShowNewConversationModal(true);
    fetchAvailableUsers();
  }, [fetchAvailableUsers]);

  /**
   * Démarre une conversation avec un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {string} - ID de l'utilisateur ajouté
   */
  const startConversationWith = useCallback(
    (userId) => {
      if (!userId) return null;

      // Vérifier si l'utilisateur est déjà dans les conversations
      if (!conversations.includes(userId)) {
        setConversations((prev) => [...prev, userId]);
      }

      // Si l'utilisateur n'est pas dans usersInfo, on récupère ses infos
      if (!usersInfo[userId]) {
        fetchUserInfo(userId);
      }

      return userId;
    },
    [conversations, usersInfo, fetchUserInfo]
  );

  /**
   * Supprime une conversation
   * @param {string} userId - ID de l'utilisateur
   */
  const deleteConversation = useCallback(
    async (userId) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/private-messages/conversations/${userId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression");
        }

        // Supprimer de la liste des conversations
        setConversations((prev) => prev.filter((id) => id !== userId));

        // Mettre à jour les compteurs de messages non lus
        const newCounts = { ...unreadMessageCounts };
        delete newCounts[userId];
        updateUnreadCounts(newCounts);

        return true;
      } catch (error) {
        console.error(
          "Erreur lors de la suppression de la conversation:",
          error
        );
        return false;
      }
    },
    [unreadMessageCounts, updateUnreadCounts]
  );

  /**
   * Ferme le menu contextuel des conversations
   */
  const handleCloseConversationContextMenu = useCallback(() => {
    setConversationContextMenu({
      visible: false,
      xPos: 0,
      yPos: 0,
      userId: null,
    });
  }, []);

  /**
   * Gère le menu contextuel des conversations
   * @param {Event} e - Événement
   * @param {string} userId - ID de l'utilisateur
   */
  const handleConversationContextMenu = useCallback((e, userId) => {
    e.preventDefault();
    setConversationContextMenu({
      visible: true,
      xPos: e.pageX,
      yPos: e.pageY,
      userId,
    });
  }, []);

  /**
   * Ferme le modal de nouvelle conversation
   */
  const handleCloseNewConversationModal = useCallback(() => {
    setShowNewConversationModal(false);
    setSearchUserQuery("");
  }, []);

  /**
   * Ouvre une conversation avec un utilisateur
   * @param {string} userId - ID de l'utilisateur
   */
  const handleOpenConversation = useCallback(
    (userId) => {
      handleSelectUser(userId);
      handleCloseConversationContextMenu();
    },
    [handleSelectUser, handleCloseConversationContextMenu]
  );

  /**
   * Démarre une conversation avec un utilisateur depuis le modal
   * @param {string} userId - ID de l'utilisateur
   */
  const handleStartConversation = useCallback(
    (userId) => {
      startConversationWith(userId);
      handleSelectUser(userId);
      handleCloseNewConversationModal();
    },
    [startConversationWith, handleSelectUser, handleCloseNewConversationModal]
  );

  /**
   * Supprime une conversation et ferme le menu contextuel
   * @param {string} userId - ID de l'utilisateur
   */
  const handleDeleteConversation = useCallback(
    async (userId) => {
      const success = await deleteConversation(userId);
      if (success && userId === selectedUser) {
        setSelectedUser(null);
      }
      handleCloseConversationContextMenu();
    },
    [deleteConversation, selectedUser, handleCloseConversationContextMenu]
  );

  // Effet pour initialiser l'application et charger les conversations
  useEffect(() => {
    // Récupérer d'abord l'ID utilisateur
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error(
          "[useConversations] Pas de token, impossible de récupérer l'ID utilisateur"
        );
        return;
      }

      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      if (payload && payload.id) {
        console.log("[useConversations] ID utilisateur récupéré:", payload.id);
        setCurrentUserId(payload.id);

        // Une fois l'ID utilisateur défini, charger les conversations une seule fois
        fetchConversations();

        // Nous ne mettons plus à jour périodiquement car nous utilisons les WebSockets
        // pour les mises à jour en temps réel
      }
    } catch (error) {
      console.error(
        "[useConversations] Erreur lors de la récupération de l'ID utilisateur:",
        error
      );
    }
    // Note: fetchConversations est omis intentionnellement pour éviter les appels en boucle
  }, []);

  // Effet pour charger l'utilisateur courant au démarrage
  useEffect(() => {
    // Récupérer l'ID de l'utilisateur courant depuis le localStorage
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );

        const payload = JSON.parse(jsonPayload);
        if (payload && payload.id) {
          setCurrentUserId(payload.id);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'ID utilisateur:",
        error
      );
    }
  }, []);

  // Effet pour filtrer les utilisateurs selon la recherche
  useEffect(() => {
    if (availableUsers.length === 0) return;

    if (!searchUserQuery.trim()) {
      setFilteredUsers(availableUsers);
      return;
    }

    const filtered = availableUsers.filter((user) => {
      const name = user.nom || "";
      return name.toLowerCase().includes(searchUserQuery.toLowerCase());
    });

    setFilteredUsers(filtered);
  }, [searchUserQuery, availableUsers]); // Écouter l'événement allMessagesRead
  useEffect(() => {
    if (!socket) return;

    const handleAllMessagesRead = (data) => {
      console.log("[useConversations] Tous les messages ont été lus:", data);

      // Si ce sont mes messages qui ont été lus par quelqu'un d'autre, ne rien faire
      if (data.readBy !== currentUserId) return;

      // Mettre à jour le compteur pour l'expéditeur concerné
      if (data.count > 0) {
        const senderId =
          data.readBy === currentUserId ? selectedUser : data.readBy;
        resetUnreadCountForUser(senderId);
      }
    };

    socket.on("allMessagesRead", handleAllMessagesRead);

    return () => {
      socket.off("allMessagesRead", handleAllMessagesRead);
    };
  }, [socket, currentUserId, selectedUser, resetUnreadCountForUser]);

  // Effet pour charger les compteurs de messages non lus au démarrage
  useEffect(() => {
    const unreadCountsFromStorage = safeJSONParse(
      localStorage.getItem("unreadDMCounts"),
      {}
    );

    // Nettoyer les compteurs potentiellement invalides (négatifs ou NaN)
    const cleanCounts = {};
    Object.keys(unreadCountsFromStorage).forEach((key) => {
      const count = parseInt(unreadCountsFromStorage[key]);
      if (!isNaN(count) && count > 0) {
        cleanCounts[key] = count;
      }
    });

    // Si l'utilisateur sélectionné a déjà un compteur, le réinitialiser
    if (selectedUser && cleanCounts[selectedUser]) {
      cleanCounts[selectedUser] = 0;
    }

    setUnreadMessageCounts(cleanCounts);
    const total = calculateTotalUnreadCount(cleanCounts);
    setTotalUnreadCount(total);
    // Mettre à jour localStorage avec les valeurs nettoyées
    localStorage.setItem("unreadDMCounts", JSON.stringify(cleanCounts));
    localStorage.setItem("unreadPrivateMessages", total.toString());
  }, [calculateTotalUnreadCount, selectedUser]); // --- Gestion des messages non lus en temps réel ---
  useEffect(() => {
    if (!socket) return;
    const handlePrivateMessage = (msg) => {
      // Ne rien faire si pas d'utilisateur courant
      if (!currentUserId) return;

      // Si c'est un nouvel expéditeur, ajouter à la liste des conversations
      if (msg.fk_expediteur !== currentUserId) {
        const senderId = msg.fk_expediteur;
        setConversations((prev) => {
          // Vérifier si l'expéditeur est déjà dans les conversations
          if (!prev.includes(senderId)) {
            console.log(
              "[useConversations] Nouvelle conversation avec:",
              senderId
            );
            // Récupérer les informations de l'utilisateur
            fetchUserInfo(senderId);
            // Ajouter à la liste des conversations
            return [senderId, ...prev]; // Placer le nouveau contact en premier
          }
          // Sinon, on déplace cette conversation au début de la liste
          return [senderId, ...prev.filter((id) => id !== senderId)];
        });
      }

      // Si le message vient d'un autre utilisateur et que la conversation n'est pas ouverte
      if (
        msg.fk_expediteur !== currentUserId &&
        (!selectedUser || msg.fk_expediteur !== selectedUser)
      ) {
        // Incrémenter le compteur pour l'expéditeur
        setUnreadMessageCounts((prev) => {
          const senderId = msg.fk_expediteur;
          const newCounts = {
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          };
          console.log(
            "[useConversations] Nouveau message non lu de",
            senderId,
            "total:",
            newCounts[senderId],
            "tous compteurs:",
            JSON.stringify(newCounts)
          ); // Mettre à jour le total
          const newTotal = calculateTotalUnreadCount(newCounts);
          setTotalUnreadCount(newTotal);

          // Sauvegarder dans localStorage
          localStorage.setItem("unreadDMCounts", JSON.stringify(newCounts));

          // Utiliser un setTimeout pour éviter les mises à jour d'état pendant le rendu
          setTimeout(() => {
            // Mettre à jour localStorage et émettre un événement personnalisé en dehors du cycle de rendu
            localStorage.setItem("unreadPrivateMessages", newTotal.toString());

            window.dispatchEvent(
              new CustomEvent("unreadMessagesUpdated", {
                detail: { count: newTotal, counts: newCounts },
              })
            );
          }, 0);

          return newCounts;
        });
      }
    };
    socket.on("privateMessage", handlePrivateMessage);
    return () => {
      socket.off("privateMessage", handlePrivateMessage);
    };
  }, [socket, currentUserId, selectedUser, calculateTotalUnreadCount]);

  return {
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
    selectedUser,
    currentUserId,
    handleSelectUser,
    handleConversationContextMenu,
    handleCloseConversationContextMenu,
    handleOpenConversation,
    handleCloseNewConversationModal,
    handleStartConversation,
    handleDeleteConversation,
    resetUnreadCountForUser,
    refreshUnreadCounts,
  };
};
