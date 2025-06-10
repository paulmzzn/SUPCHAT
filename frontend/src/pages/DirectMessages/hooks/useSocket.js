// Hook personnalisé pour gérer les connexions socket
import { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.73:3000";

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

      // Gestion des nouveaux messages privés
      newSocket.on("private_message", async (msg) => {
        console.log("[DM] Received private message:", msg);

        if (!currentUserId) return;

        // Mise à jour du compteur de messages non lus
        if (
          msg.fk_expediteur !== currentUserId &&
          (!selectedUser || msg.fk_expediteur !== selectedUser)
        ) {
          // Jouer une notification sonore
          playNotificationSound(notificationSettings);

          updateUnreadCounts((prev) => {
            const senderId = msg.fk_expediteur;
            const newCounts = {
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1,
            };
            return newCounts;
          });
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
            // Vérifier si le message existe déjà (par ID ou tempId)
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
                  return {
                    ...msg,
                    attachments,
                    isOptimistic: false, // Remplacer le message optimiste par la version serveur
                  };
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
