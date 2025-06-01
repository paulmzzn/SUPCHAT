// Hook personnalisé pour gérer les conversations
import { useState, useEffect, useCallback } from "react";
import { safeJSONParse } from "../utils/jsonUtils";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.31:3000";

/**
 * Hook pour gérer les conversations et les utilisateurs
 * @returns {Object} - Les états et fonctions liés aux conversations
 */
export const useConversations = () => {
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
  const [conversationContextMenu, setConversationContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    userId: null,
  });

  /**
   * Récupère la liste des conversations
   */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/private-messages/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des conversations");
      }

      const data = await response.json();
      setConversations(data.conversations || []);

      // Récupérer les infos utilisateurs pour chaque conversation
      const convUsers = data.conversations || [];

      // Charger aussi les compteurs de messages non lus
      const unreadCountsFromStorage = safeJSONParse(
        localStorage.getItem("unreadDMCounts"),
        {}
      );
      setUnreadMessageCounts(unreadCountsFromStorage);

      // Calculer le total de messages non lus
      const total = calculateTotalUnreadCount(unreadCountsFromStorage);
      setTotalUnreadCount(total);

      // Charger les informations de chaque utilisateur
      await Promise.all(convUsers.map((userId) => fetchUserInfo(userId)));
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de charger les conversations");
    } finally {
      setLoading(false);
    }
  }, []);

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
   * Calcule le nombre total de messages non lus
   * @param {Object} countsObj - Objet avec les compteurs par conversation
   * @returns {number} - Total des messages non lus
   */
  const calculateTotalUnreadCount = useCallback((countsObj) => {
    if (!countsObj) return 0;
    return Object.values(countsObj).reduce((sum, count) => sum + count, 0);
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
   */
  const startConversationWith = useCallback(
    (userId) => {
      // Ajouter à la liste des conversations si pas déjà présent
      if (!conversations.includes(userId)) {
        setConversations((prev) => [...prev, userId]);
      }

      // Fermer le modal
      setShowNewConversationModal(false);

      // Réinitialiser la recherche
      setSearchUserQuery("");

      return userId;
    },
    [conversations]
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
  }, [searchUserQuery, availableUsers]);

  // Effet pour charger les compteurs de messages non lus au démarrage
  useEffect(() => {
    const unreadCountsFromStorage = safeJSONParse(
      localStorage.getItem("unreadDMCounts"),
      {}
    );
    setUnreadMessageCounts(unreadCountsFromStorage);

    const total = calculateTotalUnreadCount(unreadCountsFromStorage);
    setTotalUnreadCount(total);
  }, [calculateTotalUnreadCount]);

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
  };
};
