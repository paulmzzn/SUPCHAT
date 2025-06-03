// Hook personnalisé pour gérer les connexions socket
import { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.57:3000";

/**
 * Hook pour gérer la connexion socket et les événements associés
 * @param {string} currentUserId - ID de l'utilisateur courant
 * @returns {Object} - États et fonctions liés au socket
 */
export const useSocket = (currentUserId) => {
  const [socket, setSocket] = useState(null);
  const [socketStatus, setSocketStatus] = useState({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
  });

  /**
   * Initialise la connexion socket
   */
  const initializeSocket = useCallback(() => {
    if (!currentUserId) return;

    try {
      setSocketStatus((prev) => ({
        ...prev,
        connecting: true,
        error: null,
      }));

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Pas de token d'authentification");
      }

      // Créer la connexion socket
      const newSocket = io(API_URL, {
        query: { token },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Gestionnaires d'événements de connexion
      newSocket.on("connect", () => {
        console.log("Socket.io connecté");
        setSocketStatus({
          connected: true,
          connecting: false,
          error: null,
          reconnectAttempts: 0,
        });

        // Rejoindre le salon privé
        if (currentUserId) {
          newSocket.emit(
            "joinPrivate",
            { userId: currentUserId },
            (response) => {
              if (!response.success) {
                console.error("Erreur lors de la connexion au salon privé");
              }
            }
          );
        }
      });

      newSocket.on("connect_error", (err) => {
        console.error("Erreur de connexion socket:", err);
        setSocketStatus((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: err.message,
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket déconnecté:", reason);
        setSocketStatus((prev) => ({
          ...prev,
          connected: false,
          connecting: reason === "io server disconnect" ? false : true,
          error: reason,
        }));
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`Tentative de reconnexion #${attemptNumber}`);
        setSocketStatus((prev) => ({
          ...prev,
          connecting: true,
          reconnectAttempts: attemptNumber,
        }));
      });

      setSocket(newSocket);

      return newSocket;
    } catch (error) {
      console.error("Erreur lors de l'initialisation du socket:", error);
      setSocketStatus({
        connected: false,
        connecting: false,
        error: error.message,
        reconnectAttempts: 0,
      });
      return null;
    }
  }, [currentUserId]);

  /**
   * Met à jour les messages non lus
   * @param {function} updateCallback - Fonction de mise à jour des compteurs
   */
  const refreshUnreadDM = useCallback(
    (updateCallback) => {
      if (!socket?.connected || !currentUserId) return;

      socket.emit("getUnreadDMCount", { userId: currentUserId }, (response) => {
        if (response.success && updateCallback) {
          updateCallback(response.counts || {});
        }
      });
    },
    [socket, currentUserId]
  );

  /**
   * Déconnecte le socket
   */
  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setSocketStatus({
        connected: false,
        connecting: false,
        error: null,
        reconnectAttempts: 0,
      });
    }
  }, [socket]);

  // Effet pour initialiser le socket quand currentUserId change
  useEffect(() => {
    // Nettoyer l'ancien socket si existant
    if (socket) {
      socket.disconnect();
    }

    // Créer un nouveau socket si l'utilisateur est connecté
    if (currentUserId) {
      const newSocket = initializeSocket();

      // Nettoyage à la désinscription
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [currentUserId, initializeSocket]);

  return {
    socket,
    socketStatus,
    initializeSocket,
    refreshUnreadDM,
    disconnectSocket,
  };
};
