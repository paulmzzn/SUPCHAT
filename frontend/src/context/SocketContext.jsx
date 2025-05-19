import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { setupSocketDebugger } from "../utils/socketDebug";

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [globalNotifications, setGlobalNotifications] = useState({
    private: 0,
    workspace: 0,
  });

  // Ajouter un state pour les statuts utilisateur
  const [userStatuses, setUserStatuses] = useState({});
  const socketRef = useRef(null);

  // Permettre l'utilisation de la variable d'environnement ou une valeur de secours
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
  // Fonction pour rafraîchir le compteur de messages privés non lus
  const refreshUnreadDM = async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // Ne pas essayer sans token

    try {
      // Ajouter un timeout pour éviter les longs délais d'attente
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes maximum

      const res = await fetch(`${API_URL}/api/private-messages/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Nettoyer le timeout

      if (res.ok) {
        const data = await res.json();
        // data = { [userId]: count, ... }
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        setGlobalNotifications((prev) => ({ ...prev, private: total }));

        // Mettre à jour également localStorage pour les autres composants
        localStorage.setItem("unreadPrivateMessages", total.toString());

        // Émettre un événement pour les composants qui écoutent
        const event = new CustomEvent("unreadMessagesUpdated", {
          detail: { count: total },
        });
        window.dispatchEvent(event);
      } else {
        console.warn(
          "Erreur lors du rafraîchissement du compteur: Statut",
          res.status
        );
        // Utiliser les données mises en cache précédemment si disponibles
        const cachedCount = localStorage.getItem("unreadPrivateMessages");
        if (cachedCount) {
          setGlobalNotifications((prev) => ({
            ...prev,
            private: parseInt(cachedCount, 10),
          }));
        }
      }
    } catch (e) {
      console.error(
        "Erreur lors du rafraîchissement du compteur de messages:",
        e
      );
      // Ne pas afficher d'erreur pour les aborts (timeout ou navigation)
      if (e.name !== "AbortError") {
        // Utiliser les données mises en cache précédemment si disponibles
        const cachedCount = localStorage.getItem("unreadPrivateMessages");
        if (cachedCount) {
          setGlobalNotifications((prev) => ({
            ...prev,
            private: parseInt(cachedCount, 10),
          }));
        }
      }
    }
  };
  // Nouvelle fonction pour rafraîchir le compteur de messages non lus par canal
  const refreshUnreadChannels = async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // Ne pas essayer sans token

    try {
      // Ajouter un timeout pour éviter les longs délais d'attente
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes maximum

      const res = await fetch(`${API_URL}/api/messages/unread`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Nettoyer le timeout

      if (res.ok) {
        const data = await res.json();
        // data = { channels: { [channelId]: count, ... }, total: number }
        setGlobalNotifications((prev) => ({
          ...prev,
          workspace: data.total,
          channels: data.channels, // Stocker les compteurs par canal
        }));

        // Mettre à jour également localStorage pour les autres composants
        localStorage.setItem("unreadChannelMessages", data.total.toString());
        localStorage.setItem(
          "unreadChannelMessagesDetails",
          JSON.stringify(data.channels)
        );

        // Émettre un événement pour les composants qui écoutent
        const event = new CustomEvent("unreadChannelMessagesUpdated", {
          detail: {
            total: data.total,
            channels: data.channels,
          },
        });
        window.dispatchEvent(event);
      } else {
        console.warn(
          "Erreur lors du rafraîchissement des canaux non lus: Statut",
          res.status
        );
        // Utiliser les données mises en cache précédemment si disponibles
        const cachedTotal = localStorage.getItem("unreadChannelMessages");
        const cachedDetails = localStorage.getItem(
          "unreadChannelMessagesDetails"
        );

        if (cachedTotal && cachedDetails) {
          try {
            const channels = JSON.parse(cachedDetails);
            setGlobalNotifications((prev) => ({
              ...prev,
              workspace: parseInt(cachedTotal, 10),
              channels: channels,
            }));
          } catch (err) {
            console.error("Erreur de parsing des données en cache:", err);
          }
        }
      }
    } catch (e) {
      console.error(
        "Erreur lors du rafraîchissement du compteur de messages par canal:",
        e
      );
      // Ne pas afficher d'erreur pour les aborts (timeout ou navigation)
      if (e.name !== "AbortError") {
        // Utiliser les données mises en cache précédemment si disponibles
        const cachedTotal = localStorage.getItem("unreadChannelMessages");
        const cachedDetails = localStorage.getItem(
          "unreadChannelMessagesDetails"
        );

        if (cachedTotal && cachedDetails) {
          try {
            const channels = JSON.parse(cachedDetails);
            setGlobalNotifications((prev) => ({
              ...prev,
              workspace: parseInt(cachedTotal, 10),
              channels: channels,
            }));
          } catch (err) {
            console.error("Erreur de parsing des données en cache:", err);
          }
        }
      }
    }
  };
  // Initialisation du socket au démarrage de l'application
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    // Petite temporisation avant de tenter la connexion socket
    // pour laisser le temps à l'application de s'initialiser
    const timeoutId = setTimeout(() => {
      try {
        const socketOptions = {
          auth: { token },
          transports: ["websocket", "polling"], // Try websocket first, fallback to polling
          reconnection: true,
          reconnectionAttempts: 30, // Augmenté pour plus de résilience
          reconnectionDelay: 1000, // Délai initial court
          reconnectionDelayMax: 30000, // Délai maximal plus long (30 sec)
          timeout: 10000, // Timeout plus court pour détecter rapidement les problèmes
          autoConnect: true,
          forceNew: false,
          query: { token }, // Inclure aussi le token dans la query pour plus de flexibilité
        };

        // Log de debug temporaire
        console.debug("[Socket] Tentative de connexion au serveur", API_URL);

        const newSocket = io(API_URL, socketOptions);

        newSocket.on("connect", () => {
          console.log("[Socket] Connexion établie");
          newSocket.emit("joinPrivate"); // Rejoindre la room privée

          // Fetch notifications on reconnect to ensure badges are up-to-date
          setTimeout(() => {
            // Légère temporisation pour laisser au serveur le temps de traiter le joinPrivate
            refreshUnreadDM();
            refreshUnreadChannels();
          }, 500);
        });
        newSocket.on("connect_error", (err) => {
          console.error("[Socket] Erreur de connexion:", err.message);

          // Si la connexion échoue en raison d'une erreur d'autorisation, rediriger vers la page de connexion
          if (
            err.message === "Authorization failed" ||
            err.message.includes("auth")
          ) {
            console.warn("[Socket] Problème d'authentification, déconnexion");
            // La déconnexion sera gérée par un autre composant - nous informons simplement ici
          }
        });

        // Ajouter des gestionnaires d'événements pour la reconnexion
        newSocket.on("disconnect", (reason) => {
          console.warn("[Socket] Déconnecté:", reason);

          // Si le serveur nous a déconnecté intentionnellement, ne pas tenter de reconnexion automatique
          if (reason === "io server disconnect") {
            console.warn(
              "[Socket] Déconnexion initiée par le serveur, pas de reconnexion automatique"
            );
          }
        });

        newSocket.on("reconnect", (attemptNumber) => {
          console.log("[Socket] Reconnecté après", attemptNumber, "tentatives");

          // Rejoindre la room privée à nouveau
          newSocket.emit("joinPrivate");

          // Rafraîchir les compteurs
          setTimeout(() => {
            refreshUnreadDM();
            refreshUnreadChannels();
          }, 1000);
        });

        newSocket.on("reconnect_attempt", (attemptNumber) => {
          console.log("[Socket] Tentative de reconnexion #", attemptNumber);
        });

        newSocket.on("reconnect_error", (error) => {
          console.error(
            "[Socket] Erreur lors de la reconnexion:",
            error.message
          );
        });

        newSocket.on("reconnect_failed", () => {
          console.error(
            "[Socket] Échec de la reconnexion après le nombre maximal de tentatives"
          );
          // Essayer de recréer un nouveau socket après un délai
          setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.close();
              socketRef.current = null;
              setSocket(null);
              // L'effet useEffect se déclenchera à nouveau et tentera de créer un nouveau socket
            }
          }, 5000);
        });

        setSocket(newSocket);
        socketRef.current = newSocket;

        return () => {
          newSocket.off();
          newSocket.disconnect();
        };
      } catch (error) {
        console.error("[Socket] Erreur lors de l'initialisation:", error);
      }
    }, 0); // Fermé avec un délai de 0
  }, [API_URL]);

  // Initialisation des compteurs de messages non lus au montage
  useEffect(() => {
    refreshUnreadDM();
    refreshUnreadChannels();
  }, []);

  // Gestion des notifications pour les messages privés
  useEffect(() => {
    if (!socket) return;

    // Mise à jour du compteur à chaque message reçu
    socket.on("privateMessage", (msg) => {
      // Récupérer l'ID utilisateur actuel - essayer plusieurs sources
      const tokenInfo = localStorage.getItem("token_info");
      let userId;

      try {
        // Essayer de récupérer depuis token_info (si c'est un JSON)
        if (tokenInfo) userId = JSON.parse(tokenInfo)?.id;

        // Si pas d'ID, essayer d'autres sources courantes
        if (!userId) userId = localStorage.getItem("userId");
      } catch (e) {
        console.error(
          "[Socket] Erreur lors de la récupération de l'ID utilisateur:",
          e
        );
        // Fallback: essayer avec userId directement
        userId = localStorage.getItem("userId");
      }

      // Si le message est destiné à l'utilisateur courant et qu'il n'en est pas l'expéditeur
      if (
        msg &&
        userId &&
        msg.fk_destinataire === userId &&
        msg.fk_expediteur !== userId
      ) {
        // Mise à jour immédiate du compteur global
        setGlobalNotifications((prev) => ({
          ...prev,
          private: prev.private + 1,
        }));

        // Mettre à jour localStorage pour assurer la cohérence entre les pages
        const currentCount = parseInt(
          localStorage.getItem("unreadPrivateMessages") || "0",
          10
        );
        localStorage.setItem(
          "unreadPrivateMessages",
          (currentCount + 1).toString()
        );

        // Émettre un événement pour notifier les autres composants
        window.dispatchEvent(
          new CustomEvent("unreadMessagesUpdated", {
            detail: { count: currentCount + 1 },
          })
        );
      }
    });

    // Mise à jour du compteur à chaque lecture de message
    socket.on("privateMessageRead", (data) => {
      refreshUnreadDM();
    });

    return () => {
      socket.off("privateMessage");
      socket.off("privateMessageRead");
    };
  }, [socket]);

  // Nouvelle gestion des notifications pour les messages de canal
  useEffect(() => {
    if (!socket) return;

    // Réception d'un nouveau message (peut incrémenter le compteur)
    socket.on("message", (msg) => {
      const userId = localStorage.getItem("userId");
      // Si le message n'est pas de l'utilisateur actuel, incrémenter le compteur
      if (msg && msg.fk_utilisateur !== userId) {
        // Rafraîchir le compteur pour tous les canaux
        refreshUnreadChannels();
      }
    });

    // Mise à jour quand un canal est marqué comme lu
    socket.on("unreadChannelMessagesUpdated", (data) => {
      // Mettre à jour les compteurs globaux
      setGlobalNotifications((prev) => ({
        ...prev,
        workspace: data.total,
        channels: data.channels,
      }));

      // Mettre à jour localStorage
      localStorage.setItem("unreadChannelMessages", data.total.toString());
      localStorage.setItem(
        "unreadChannelMessagesDetails",
        JSON.stringify(data.channels)
      );

      // Émettre un événement
      const event = new CustomEvent("unreadChannelMessagesUpdated", {
        detail: {
          total: data.total,
          channels: data.channels,
        },
      });
      window.dispatchEvent(event);
    });

    // Confirmation qu'un canal a été marqué comme lu
    socket.on("channelMarkedAsRead", (data) => {
      // Pas besoin de faire quoi que ce soit ici car l'événement
      // unreadChannelMessagesUpdated sera également émis
    });

    return () => {
      socket.off("message");
      socket.off("unreadChannelMessagesUpdated");
      socket.off("channelMarkedAsRead");
    };
  }, [socket]);

  // Connexion WebSocket AMÉLIORÉE - écoute direct et synchrone des statuts
  useEffect(() => {
    if (!socket) return;

    // Handler direct pour les changements de statut WebSocket
    const handleStatusChange = (data) => {
      const { userId, status } = data;

      if (!userId) {
        console.error(
          "[WEBSOCKET] Réception d'un changement de statut sans userId:",
          data
        );
        return;
      }

      console.log(
        `[WEBSOCKET] Changement de statut reçu: ${userId} -> ${status}`
      );

      // Mise à jour synchrone des statuts (mise à jour en DIRECT)
      setUserStatuses((prevStatuses) => {
        const newStatuses = { ...prevStatuses, [userId]: status };

        // Déboguer les détails des statuts après mise à jour
        const userIds = Object.keys(newStatuses);
        console.log(
          `[WEBSOCKET] ${userIds.length} statuts utilisateur dans le tableau:`,
          userIds.map((id) => `${id}: ${newStatuses[id]}`).join(", ")
        );

        return newStatuses;
      });
    };

    // Écouter UNIQUEMENT sur le socket
    socket.on("userStatusChanged", handleStatusChange);

    // Demander l'état des statuts au moment du chargement
    console.log("[WEBSOCKET] Demande de l'état initial des statuts");
    socket.emit("getUserStatuses");

    // Configuration du débogage
    if (process.env.NODE_ENV === "development") {
      setupSocketDebugger(socket);
    }

    return () => {
      socket.off("userStatusChanged", handleStatusChange);
    };
  }, [socket]);

  // Ajouter un gestionnaire pour recevoir les statuts initiaux
  useEffect(() => {
    if (!socket) return;

    const handleInitialStatuses = (statusData) => {
      console.log("[WEBSOCKET] Réception des statuts initiaux:", statusData);
      if (statusData && typeof statusData === "object") {
        setUserStatuses((currentStatuses) => ({
          ...currentStatuses,
          ...statusData,
        }));
      }
    };

    socket.on("initialUserStatuses", handleInitialStatuses);

    return () => {
      socket.off("initialUserStatuses", handleInitialStatuses);
    };
  }, [socket]);

  // Fonction pour envoyer un changement de statut - simplifiée et directe
  const setUserStatus = (status) => {
    if (!socket || !socket.connected) {
      console.error(
        "[Socket] Impossible de définir le statut: Socket non connecté"
      );
      return false;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error(
        "[Socket] Impossible de définir le statut: ID utilisateur non trouvé"
      );
      return false;
    }

    console.log(
      `[Socket] Envoi du changement de statut au serveur: ${userId} -> ${status}`
    );

    // Mise à jour optimiste locale AVANT envoi au serveur
    setUserStatuses((prev) => ({ ...prev, [userId]: status }));

    // Émission au serveur - communication WebSocket pure
    socket.emit("setUserStatus", { status, userId });
    return true;
  };

  // Notifier le backend des workspaces rejoints au chargement
  useEffect(() => {
    if (!socket || !socket.connected) return;

    const loadWorkspaces = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/workspaces/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const workspaces = await response.json();
          const workspaceIds = workspaces.map((w) => w.id_workspace);

          // Informer le serveur des workspaces rejoints
          socket.emit("userJoinedWorkspaces", { workspaces: workspaceIds });
        }
      } catch (error) {
        console.error(
          "[Socket] Erreur lors du chargement des workspaces:",
          error
        );
      }
    };

    loadWorkspaces();
  }, [socket, API_URL]);
  return (
    <SocketContext.Provider
      value={{
        socket,
        globalNotifications,
        setGlobalNotifications,
        refreshUnreadDM, // Exposer la fonction pour l'utiliser dans d'autres composants
        refreshUnreadChannels, // Exposer la nouvelle fonction
        userStatuses, // Statuts en direct
        setUserStatus, // Fonction pour changer le statut
      }}
    >
      {children}{" "}
    </SocketContext.Provider>
  );
}
