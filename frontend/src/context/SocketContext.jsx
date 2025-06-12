import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { setupSocketDebugger } from "../utils/socketDebug";
import { API_URL } from "../config/config";

const SocketContext = createContext(null);

export function useSocket() {
  const context = useContext(SocketContext);
  // Retourner un objet vide par défaut pour éviter les erreurs
  return (
    context || {
      socket: null,
      isSocketConnected: false,
      hasJoinedPrivateRoom: false,
      isInitializing: true,
      ensurePrivateRoomJoined: () => false,
      refreshUnreadDM: () => {},
      refreshUnreadChannels: () => {},
      globalNotifications: { private: 0, workspace: 0 },
      userStatuses: {},
    }
  );
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [hasJoinedPrivateRoom, setHasJoinedPrivateRoom] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [globalNotifications, setGlobalNotifications] = useState({
    private: 0,
    workspace: 0,
  });

  // Ajouter un state pour les statuts utilisateur
  const [userStatuses, setUserStatuses] = useState({});
  const socketRef = useRef(null);
  const hasJoinedPrivateRoomRef = useRef(false);
  const initializeSocketRef = useRef(null);



  // Fonction pour rafraîchir le compteur de messages privés non lus
  const refreshUnreadDM = useCallback(async () => {
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
  }, []);
  // Nouvelle fonction pour rafraîchir le compteur de messages non lus par canal
  const refreshUnreadChannels = useCallback(async () => {
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
  }, []);
  // Initialisation du socket au démarrage de l'application - IMMÉDIATE
  useLayoutEffect(() => {
    let tokenCheckInterval;

    // Fonction d'initialisation du socket
    const initializeSocket = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("[Socket] Pas de token, pas d'initialisation socket");
        setIsInitializing(false);
        return;
      }

      // Si un socket existe déjà et qu'il est connecté, ne pas le recréer
      if (socketRef.current && socketRef.current.connected) {
        console.log("[Socket] Socket déjà connecté, pas de réinitialisation");
        setIsInitializing(false);
        return;
      }

      console.log("[Socket] Initialisation immédiate du socket avec token:", token.substring(0, 20) + "...");

      try {
        // Nettoyer l'ancien socket s'il existe
        if (socketRef.current) {
          socketRef.current.off();
          socketRef.current.disconnect();
        }

        const socketOptions = {
          auth: { token },
          transports: ["websocket", "polling"], // Try websocket first, fallback to polling
          reconnection: true,
          reconnectionAttempts: 30, // Augmenté pour plus de résilience
          reconnectionDelay: 1000, // Délai initial court
          reconnectionDelayMax: 30000, // Délai maximal plus long (30 sec)
          timeout: 10000, // Timeout plus court pour détecter rapidement les problèmes
          autoConnect: true,
          forceNew: true, // Forcer une nouvelle connexion
          query: { token }, // Inclure aussi le token dans la query pour plus de flexibilité
        };

        // Log de debug temporaire
        console.debug("[Socket] Tentative de connexion au serveur", API_URL);

        const newSocket = io(API_URL, socketOptions);

        newSocket.on("connect", () => {
          console.log("[Socket] Connexion établie");
          setIsSocketConnected(true);
          setIsInitializing(false);
          newSocket.emit("joinPrivate"); // Rejoindre la room privée

          // Fetch notifications on reconnect to ensure badges are up-to-date
          setTimeout(() => {
            // Légère temporisation pour laisser au serveur le temps de traiter le joinPrivate
            refreshUnreadDM();
            refreshUnreadChannels();
          }, 500);
        });

        // Écouter la confirmation de la room privée
        newSocket.on("privateRoomJoined", (response) => {
          if (response.status === "success") {
            console.log("[Socket] Room privée rejointe avec succès");
            setHasJoinedPrivateRoom(true);
            hasJoinedPrivateRoomRef.current = true;
          }
        });

        // Timeout de sécurité pour rejoindre la room privée
        const privateRoomTimeout = setTimeout(() => {
          if (!hasJoinedPrivateRoomRef.current) {
            console.warn("[Socket] Timeout pour rejoindre la room privée, nouvelle tentative");
            newSocket.emit("joinPrivate");
          }
        }, 3000);

        newSocket.on("connect_error", (err) => {
          console.error("[Socket] Erreur de connexion:", err.message);
          setIsSocketConnected(false);
          setHasJoinedPrivateRoom(false);
          hasJoinedPrivateRoomRef.current = false;
          setIsInitializing(false);

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
          setIsSocketConnected(false);
          setHasJoinedPrivateRoom(false);
          hasJoinedPrivateRoomRef.current = false;

          // Si le serveur nous a déconnecté intentionnellement, ne pas tenter de reconnexion automatique
          if (reason === "io server disconnect") {
            console.warn(
              "[Socket] Déconnexion initiée par le serveur, pas de reconnexion automatique"
            );
          }
        });

        newSocket.on("reconnect", (attemptNumber) => {
          console.log("[Socket] Reconnecté après", attemptNumber, "tentatives");
          setIsSocketConnected(true);
          setHasJoinedPrivateRoom(false); // Reset jusqu'à confirmation
          hasJoinedPrivateRoomRef.current = false;

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
          setIsSocketConnected(false);
          setHasJoinedPrivateRoom(false);
          hasJoinedPrivateRoomRef.current = false;
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
        setIsInitializing(false);
      } catch (error) {
        console.error("[Socket] Erreur lors de l'initialisation:", error);
        setIsInitializing(false);
      }
    };

    // Fonction pour vérifier périodiquement s'il y a un token
    const checkForToken = () => {
      const token = localStorage.getItem("token");
      
      if (token && !socketRef.current) {
        console.log("[Socket] Token détecté, initialisation du socket");
        initializeSocket();
      } else if (!token && socketRef.current) {
        console.log("[Socket] Token supprimé, déconnexion du socket");
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
          setIsSocketConnected(false);
          setHasJoinedPrivateRoom(false);
          hasJoinedPrivateRoomRef.current = false;
          setIsInitializing(false);
        }
      }
    };

    // Initialiser immédiatement si un token est présent
    initializeSocket();

    // Exposer la fonction d'initialisation globalement pour qu'elle puisse être appelée depuis les pages de login/validation
    initializeSocketRef.current = initializeSocket;
    window.initializeSocket = initializeSocket;

    // Vérifier périodiquement s'il y a un token (toutes les 2 secondes, moins fréquent)
    tokenCheckInterval = setInterval(checkForToken, 2000);

    // Écouter les changements de token dans localStorage (pour les autres onglets)
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        if (e.newValue) {
          console.log("[Socket] Nouveau token détecté (storage event), initialisation du socket");
          // Si un nouveau token apparaît, initialiser le socket
          if (!socketRef.current) {
            initializeSocket();
          }
        } else {
          console.log("[Socket] Token supprimé (storage event), déconnexion du socket");
          // Si le token est supprimé, déconnecter le socket
          if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsSocketConnected(false);
            setHasJoinedPrivateRoom(false);
            hasJoinedPrivateRoomRef.current = false;
            setIsInitializing(false);
          }
        }
      }
    };

    // Écouter les événements de storage pour réagir aux changements de token
    window.addEventListener("storage", handleStorageChange);

    // Fonction de nettoyage du useEffect
    return () => {
      clearInterval(tokenCheckInterval);
      window.removeEventListener("storage", handleStorageChange);
      // Nettoyer la fonction globale
      delete window.initializeSocket;
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsSocketConnected(false);
      setHasJoinedPrivateRoom(false);
      hasJoinedPrivateRoomRef.current = false;
      setIsInitializing(false);
    };
  }, []); // Pas de dépendances pour que ce soit exécuté une seule fois
  // Initialisation des compteurs de messages non lus au montage
  useEffect(() => {
    // Charger les compteurs au démarrage
    refreshUnreadDM();
    refreshUnreadChannels();

    // Configurer un intervalle pour rafraîchir périodiquement les compteurs
    // Cela garantit que les compteurs restent synchronisés même si des événements sont manqués
    const refreshInterval = setInterval(() => {
      refreshUnreadDM();
      refreshUnreadChannels();
    }, 30000); // Rafraîchir toutes les 30 secondes

    // Écouter les événements de storage pour la synchronisation entre onglets
    const handleStorageChange = (e) => {
      if (
        e.key === "unreadPrivateMessages" ||
        e.key === "unreadChannelMessages"
      ) {
        try {
          const count = parseInt(e.newValue, 10);
          if (!isNaN(count)) {
            if (e.key === "unreadPrivateMessages") {
              setGlobalNotifications((prev) => ({ ...prev, private: count }));
            } else if (e.key === "unreadChannelMessages") {
              setGlobalNotifications((prev) => ({ ...prev, workspace: count }));
            }
          }
        } catch (err) {
          console.error(
            "[Socket] Erreur lors du traitement des données du stockage:",
            err
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshUnreadDM, refreshUnreadChannels]);
  // Gestion des notifications pour les messages privés
  useEffect(() => {
    if (!socket) return;

    // Mise à jour du compteur à chaque message reçu
    socket.on("privateMessage", (msg) => {
      // Récupérer l'ID utilisateur actuel
      const userId = localStorage.getItem("userId");

      // Si le message est destiné à l'utilisateur courant et qu'il n'en est pas l'expéditeur
      if (
        msg &&
        userId &&
        msg.fk_destinataire === userId &&
        msg.fk_expediteur !== userId
      ) {
        // Mise à jour immédiate du compteur global
        setGlobalNotifications((prev) => {
          const newPrivateCount = prev.private + 1;
          return {
            ...prev,
            private: newPrivateCount,
          };
        });

        // Mettre à jour localStorage pour assurer la cohérence entre les pages
        const currentCount = parseInt(
          localStorage.getItem("unreadPrivateMessages") || "0",
          10
        );
        const newCount = currentCount + 1;
        localStorage.setItem("unreadPrivateMessages", newCount.toString());

        // Émettre un événement pour notifier les autres composants
        window.dispatchEvent(
          new CustomEvent("unreadMessagesUpdated", {
            detail: { count: newCount },
          })
        );
      }
    });    // Mise à jour du compteur à chaque lecture de message
    socket.on("privateMessageRead", (data) => {
      console.log("[SocketContext] Message privé marqué comme lu:", data);
      refreshUnreadDM();
    });

    // Écouter l'événement de réinitialisation des compteurs
    socket.on("privateMessagesMarkedAsRead", (data) => {
      console.log("[SocketContext] Messages privés marqués comme lus:", data);
      refreshUnreadDM();
    });

    // Écouter l'événement pour tous les messages marqués comme lus d'un coup
    socket.on("allMessagesRead", (data) => {
      console.log("[SocketContext] Tous les messages marqués comme lus:", data);
      refreshUnreadDM();
    });

    return () => {
      socket.off("privateMessage");
      socket.off("privateMessageRead");
      socket.off("privateMessagesMarkedAsRead");
      socket.off("allMessagesRead");
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
    }); // Mise à jour quand un canal est marqué comme lu
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

      // Émettre un événement de manière asynchrone pour éviter les problèmes de rendu React
      setTimeout(() => {
        const event = new CustomEvent("unreadChannelMessagesUpdated", {
          detail: {
            total: data.total,
            channels: data.channels,
          },
        });
        window.dispatchEvent(event);
      }, 0);
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

  // Fonction pour forcer la connexion à la room privée
  const ensurePrivateRoomJoined = useCallback(() => {
    if (!socket || !isSocketConnected) {
      console.warn("[Socket] Socket non connecté, impossible de rejoindre la room privée");
      return false;
    }

    if (hasJoinedPrivateRoom) {
      console.log("[Socket] Room privée déjà rejointe");
      return true;
    }

    console.log("[Socket] Tentative de rejoindre la room privée...");
    setHasJoinedPrivateRoom(false);
    socket.emit("joinPrivate");
    return true;
  }, [socket, isSocketConnected, hasJoinedPrivateRoom]);

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
        isSocketConnected,
        hasJoinedPrivateRoom,
        isInitializing,
        ensurePrivateRoomJoined,
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
