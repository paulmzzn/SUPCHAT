import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
  const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.132:3000';

  // Fonction pour rafraîchir le compteur de messages privés non lus
  const refreshUnreadDM = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/private-messages/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // data = { [userId]: count, ... }
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        setGlobalNotifications((prev) => ({ ...prev, private: total }));
        
        // Mettre à jour également localStorage pour les autres composants
        localStorage.setItem('unreadPrivateMessages', total.toString());
        
        // Émettre un événement pour les composants qui écoutent
        const event = new CustomEvent('unreadMessagesUpdated', {
          detail: { count: total }
        });
        window.dispatchEvent(event);
      }
    } catch (e) {
      console.error("Erreur lors du rafraîchissement du compteur de messages:", e);
    }
  };

  // Initialisation du socket au démarrage de l'application
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("[Socket] Pas de token disponible, socket non initialisé");
      return;
    }

    console.log("[Socket] Initialisation du socket avec le token");
    
    try {
      const socketOptions = {
        auth: { token },
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
        autoConnect: true,
      };

      const newSocket = io(API_URL, socketOptions);
      
      newSocket.on("connect", () => {
        console.log("[Socket] Connecté au serveur avec ID:", newSocket.id);
        newSocket.emit("joinPrivate"); // Rejoindre la room privée
      });

      newSocket.on("connect_error", (err) => {
        console.error("[Socket] Erreur de connexion:", err);
      });

      setSocket(newSocket);
      socketRef.current = newSocket;

      return () => {
        console.log("[Socket] Déconnexion");
        newSocket.off();
        newSocket.disconnect();
      };
    } catch (error) {
      console.error("[Socket] Erreur lors de l'initialisation:", error);
    }
  }, [API_URL]);

  // Initialisation du compteur de messages privés non lus au montage
  useEffect(() => {
    refreshUnreadDM();
  }, []);

  useEffect(() => {
    if (!socket) return;
    // Mise à jour du compteur à chaque message reçu
    socket.on('privateMessage', (msg) => {
      // Si le message est pour moi (destinataire), incrémenter le compteur
      const userId = localStorage.getItem('userId') || (msg && msg.fk_destinataire);
      if (msg && msg.fk_destinataire === userId) {
        setGlobalNotifications((prev) => ({ ...prev, private: prev.private + 1 }));
        // Rafraîchir également le localStorage et déclencher l'événement
        refreshUnreadDM();
      }
    });
    // Mise à jour du compteur à chaque lecture
    socket.on('privateMessageRead', (msg) => {
      setGlobalNotifications((prev) => ({ ...prev, private: Math.max(prev.private - 1, 0) }));
      
      // Rafraîchir complètement le compteur pour s'assurer qu'il est à jour
      refreshUnreadDM();
    });
    return () => {
      socket.off('privateMessage');
      socket.off('privateMessageRead');
    };
  }, [socket]);

  // Connexion WebSocket AMÉLIORÉE - écoute direct et synchrone des statuts
  useEffect(() => {
    if (!socket) return;
    
    // Handler direct pour les changements de statut WebSocket
    const handleStatusChange = (data) => {
      const { userId, status } = data;
      
      if (!userId) {
        console.error("[WEBSOCKET] Réception d'un changement de statut sans userId:", data);
        return;
      }
      
      console.log(`[WEBSOCKET] Changement de statut reçu: ${userId} -> ${status}`);
      
      // Mise à jour synchrone des statuts (mise à jour en DIRECT)
      setUserStatuses(prevStatuses => {
        const newStatuses = { ...prevStatuses, [userId]: status };
        
        // Déboguer les détails des statuts après mise à jour
        const userIds = Object.keys(newStatuses);
        console.log(`[WEBSOCKET] ${userIds.length} statuts utilisateur dans le tableau:`, 
          userIds.map(id => `${id}: ${newStatuses[id]}`).join(', '));
        
        return newStatuses;
      });
    };
    
    // Écouter UNIQUEMENT sur le socket
    socket.on('userStatusChanged', handleStatusChange);
    
    // Demander l'état des statuts au moment du chargement
    console.log("[WEBSOCKET] Demande de l'état initial des statuts");
    socket.emit('getUserStatuses');
    
    // Configuration du débogage
    if (process.env.NODE_ENV === 'development') {
      setupSocketDebugger(socket);
    }
    
    return () => {
      socket.off('userStatusChanged', handleStatusChange);
    };
  }, [socket]);

  // Ajouter un gestionnaire pour recevoir les statuts initiaux
  useEffect(() => {
    if (!socket) return;
    
    const handleInitialStatuses = (statusData) => {
      console.log("[WEBSOCKET] Réception des statuts initiaux:", statusData);
      if (statusData && typeof statusData === 'object') {
        setUserStatuses(currentStatuses => ({
          ...currentStatuses,
          ...statusData
        }));
      }
    };
    
    socket.on('initialUserStatuses', handleInitialStatuses);
    
    return () => {
      socket.off('initialUserStatuses', handleInitialStatuses);
    };
  }, [socket]);

  // Fonction pour envoyer un changement de statut - simplifiée et directe
  const setUserStatus = (status) => {
    if (!socket || !socket.connected) {
      console.error("[Socket] Impossible de définir le statut: Socket non connecté");
      return false;
    }
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error("[Socket] Impossible de définir le statut: ID utilisateur non trouvé");
      return false;
    }
    
    console.log(`[Socket] Envoi du changement de statut au serveur: ${userId} -> ${status}`);
    
    // Mise à jour optimiste locale AVANT envoi au serveur
    setUserStatuses(prev => ({ ...prev, [userId]: status }));
    
    // Émission au serveur - communication WebSocket pure
    socket.emit('setUserStatus', { status, userId });
    return true;
  };

  // Notifier le backend des workspaces rejoints au chargement
  useEffect(() => {
    if (!socket || !socket.connected) return;
    
    const loadWorkspaces = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/workspaces/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const workspaces = await response.json();
          const workspaceIds = workspaces.map(w => w.id_workspace);
          
          // Informer le serveur des workspaces rejoints
          socket.emit('userJoinedWorkspaces', { workspaces: workspaceIds });
        }
      } catch (error) {
        console.error("[Socket] Erreur lors du chargement des workspaces:", error);
      }
    };
    
    loadWorkspaces();
  }, [socket, API_URL]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      globalNotifications, 
      setGlobalNotifications,
      refreshUnreadDM,
      userStatuses, // Statuts en direct
      setUserStatus  // Fonction pour changer le statut
    }}>
      {children}
    </SocketContext.Provider>
  );
}
