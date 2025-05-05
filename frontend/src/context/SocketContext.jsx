import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [globalNotifications, setGlobalNotifications] = useState({
    private: 0,
    workspace: 0,
    // Ajoute d'autres types si besoin
  });
  const socketRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.137:3000';

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

  return (
    <SocketContext.Provider value={{ 
      socket, 
      globalNotifications, 
      setGlobalNotifications,
      refreshUnreadDM // Exposer la fonction pour l'utiliser dans d'autres composants
    }}>
      {children}
    </SocketContext.Provider>
  );
}
