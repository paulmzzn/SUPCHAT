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
  const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.63:3000';

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
  
  // Nouvelle fonction pour rafraîchir le compteur de messages non lus par canal
  const refreshUnreadChannels = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/messages/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // data = { channels: { [channelId]: count, ... }, total: number }
        setGlobalNotifications((prev) => ({ 
          ...prev, 
          workspace: data.total,
          channels: data.channels // Stocker les compteurs par canal
        }));
        
        // Mettre à jour également localStorage pour les autres composants
        localStorage.setItem('unreadChannelMessages', data.total.toString());
        localStorage.setItem('unreadChannelMessagesDetails', JSON.stringify(data.channels));
        
        // Émettre un événement pour les composants qui écoutent
        const event = new CustomEvent('unreadChannelMessagesUpdated', {
          detail: { 
            total: data.total,
            channels: data.channels
          }
        });
        window.dispatchEvent(event);
      }
    } catch (e) {
      console.error("Erreur lors du rafraîchissement du compteur de messages par canal:", e);
    }
  };

  // Initialisation du socket au démarrage de l'application
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const socketOptions = {
        auth: { token },
        transports: ["websocket", "polling"],  // Try websocket first, fallback to polling
        reconnection: true,
        reconnectionAttempts: 15,              // Increased from 10
        reconnectionDelay: 1000,               // Decreased initial delay
        reconnectionDelayMax: 10000,
        timeout: 30000,                        // Increased from 20000
        autoConnect: true,
      };

      const newSocket = io(API_URL, socketOptions);
      
      newSocket.on("connect", () => {
        newSocket.emit("joinPrivate"); // Rejoindre la room privée
        
        // Fetch notifications on reconnect to ensure badges are up-to-date
        refreshUnreadDM();
        refreshUnreadChannels();
      });

      newSocket.on("connect_error", (err) => {
        console.error("[Socket] Erreur de connexion:", err);
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
    socket.on('privateMessage', (msg) => {
      // Récupérer l'ID utilisateur actuel - essayer plusieurs sources
      const tokenInfo = localStorage.getItem('token_info');
      let userId;
      
      try {
        // Essayer de récupérer depuis token_info (si c'est un JSON)
        if (tokenInfo) userId = JSON.parse(tokenInfo)?.id;
        
        // Si pas d'ID, essayer d'autres sources courantes
        if (!userId) userId = localStorage.getItem('userId');
        
      } catch (e) {
        console.error("[Socket] Erreur lors de la récupération de l'ID utilisateur:", e);
        // Fallback: essayer avec userId directement
        userId = localStorage.getItem('userId');
      }
      
      // Si le message est destiné à l'utilisateur courant et qu'il n'en est pas l'expéditeur
      if (msg && userId && msg.fk_destinataire === userId && msg.fk_expediteur !== userId) {
        
        // Mise à jour immédiate du compteur global
        setGlobalNotifications(prev => ({ 
          ...prev, 
          private: prev.private + 1 
        }));
        
        // Mettre à jour localStorage pour assurer la cohérence entre les pages
        const currentCount = parseInt(localStorage.getItem('unreadPrivateMessages') || '0', 10);
        localStorage.setItem('unreadPrivateMessages', (currentCount + 1).toString());
        
        // Émettre un événement pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', {
          detail: { count: currentCount + 1 }
        }));
      }
    });
    
    // Mise à jour du compteur à chaque lecture de message
    socket.on('privateMessageRead', (data) => {
      refreshUnreadDM();
    });
    
    return () => {
      socket.off('privateMessage');
      socket.off('privateMessageRead');
    };
  }, [socket]);
  
  // Nouvelle gestion des notifications pour les messages de canal
  useEffect(() => {
    if (!socket) return;
    
    // Réception d'un nouveau message (peut incrémenter le compteur)
    socket.on('message', (msg) => {
      const userId = localStorage.getItem('userId');
      // Si le message n'est pas de l'utilisateur actuel, incrémenter le compteur
      if (msg && msg.fk_utilisateur !== userId) {
        // Rafraîchir le compteur pour tous les canaux
        refreshUnreadChannels();
      }
    });
    
    // Mise à jour quand un canal est marqué comme lu
    socket.on('unreadChannelMessagesUpdated', (data) => {
      // Mettre à jour les compteurs globaux
      setGlobalNotifications((prev) => ({ 
        ...prev, 
        workspace: data.total,
        channels: data.channels
      }));
      
      // Mettre à jour localStorage
      localStorage.setItem('unreadChannelMessages', data.total.toString());
      localStorage.setItem('unreadChannelMessagesDetails', JSON.stringify(data.channels));
      
      // Émettre un événement
      const event = new CustomEvent('unreadChannelMessagesUpdated', {
        detail: { 
          total: data.total,
          channels: data.channels
        }
      });
      window.dispatchEvent(event);
    });

    // Confirmation qu'un canal a été marqué comme lu
    socket.on('channelMarkedAsRead', (data) => {
      // Pas besoin de faire quoi que ce soit ici car l'événement 
      // unreadChannelMessagesUpdated sera également émis
    });
    
    return () => {
      socket.off('message');
      socket.off('unreadChannelMessagesUpdated');
      socket.off('channelMarkedAsRead');
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      globalNotifications, 
      setGlobalNotifications,
      refreshUnreadDM, // Exposer la fonction pour l'utiliser dans d'autres composants
      refreshUnreadChannels // Exposer la nouvelle fonction
    }}>
      {children}
    </SocketContext.Provider>
  );
}
