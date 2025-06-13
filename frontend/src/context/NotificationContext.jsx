import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useSocket } from "./SocketContext";
import { API_URL } from "../config/config";

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { socket } = useSocket();
  const [unreadCounts, setUnreadCounts] = useState({
    channels: {},
    total: 0,
  });

  // Add a ref to track last marked channel to prevent duplicate requests
  const lastMarkedChannelRef = useRef(null);
  const markChannelTimerRef = useRef(null);
  const processingRef = useRef(false);

  // Fonction pour récupérer le nombre de messages non lus par canal
  const refreshUnreadChannelCounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Skip if already processing to avoid overloading the server
      if (processingRef.current) return;
      processingRef.current = true;

      const unreadResponse = await fetch(`${API_URL}/api/messages/unread`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (unreadResponse.ok) {
        const unreadData = await unreadResponse.json();

        setUnreadCounts({
          channels: unreadData.channels || {},
          total: unreadData.total || 0,
        });

        // Émettre un événement pour mettre à jour les badges
        const event = new CustomEvent("unreadChannelMessagesUpdated", {
          detail: {
            total: unreadData.total,
            channels: unreadData.channels,
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des messages non lus:",
        error
      );
    } finally {
      processingRef.current = false;
    }
  };

  // Marquer un canal comme lu
  const markChannelAsRead = async (channelId) => {
    if (!channelId) {
      console.warn("Tentative de marquer un canal sans ID comme lu");
      return;
    }

    // Prevent repeated calls for the same channel in short succession
    if (lastMarkedChannelRef.current === channelId) {
      return;
    }

    // Clear any pending timer
    if (markChannelTimerRef.current) {
      clearTimeout(markChannelTimerRef.current);
    }

    // Set this channel as the last marked one
    lastMarkedChannelRef.current = channelId;

    // Mise à jour optimiste de l'interface
    setUnreadCounts((prev) => {
      const newChannels = { ...prev.channels };
      if (newChannels[channelId]) {
        newChannels[channelId] = { ...newChannels[channelId], count: 0 };
      }

      // Recalculer le total en excluant le canal qu'on vient de lire
      const newTotal = Object.values(newChannels).reduce((sum, data) => {
        return sum + (data.count || 0);
      }, 0);

      const newState = {
        channels: newChannels,
        total: newTotal,
      };

      // Note: L'événement global sera émis par le listener socket quand le serveur confirmera
      // Pas besoin d'émettre ici pour éviter les doublons

      return newState;
    });

    // Use debouncing to avoid making too many API calls
    markChannelTimerRef.current = setTimeout(async () => {
      try {
        // Essayer d'abord via socket.io si disponible
        if (socket && socket.connected) {
          socket.emit("markChannelAsRead", { channelId });
        } else {
          // Sinon, utiliser l'API REST
          const token = localStorage.getItem("token");
          if (!token) return;

          const markReadResponse = await fetch(
            `${API_URL}/api/messages/channel/${channelId}/read`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (markReadResponse.ok) {
            console.log(`Canal ${channelId} marqué comme lu via API REST`);
            // Refresh pour s'assurer que les données sont synchronisées
            setTimeout(() => refreshUnreadChannelCounts(), 100);
          } else {
            console.error(
              "Erreur API lors du marquage du canal comme lu:",
              await markReadResponse.text()
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors du marquage du canal comme lu:", error);
      } finally {
        // Reset the debounce after 500ms to allow marking the same channel again if needed
        setTimeout(() => {
          lastMarkedChannelRef.current = null;
        }, 500);
      }
    }, 300); // Wait 300ms before making the API call
  };

  // Synchroniser les notifications avec Socket.IO
  useEffect(() => {
    if (!socket) return;

    // Écouter les nouveaux messages
    socket.on("message", (msg) => {
      const userId = localStorage.getItem("userId");
      if (msg && msg.fk_utilisateur !== userId) {
        refreshUnreadChannelCounts();
      }
    });
    // Écouter les mises à jour des compteurs
    socket.on("unreadChannelMessagesUpdated", (data) => {
      setUnreadCounts({
        channels: data.channels || {},
        total: data.total || 0,
      });

      // Émettre un événement global pour synchroniser tous les composants
      const event = new CustomEvent("unreadChannelMessagesUpdated", {
        detail: {
          total: data.total,
          channels: data.channels,
        },
      });
      window.dispatchEvent(event);
    });

    return () => {
      socket.off("message");
      socket.off("unreadChannelMessagesUpdated");
    };
  }, [socket]);

  // Charger les notifications au démarrage
  useEffect(() => {
    refreshUnreadChannelCounts();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCounts,
        markChannelAsRead,
        refreshUnreadChannelCounts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
