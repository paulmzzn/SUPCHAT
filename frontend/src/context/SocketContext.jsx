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

  // Initialisation du compteur de messages privés non lus au montage
  useEffect(() => {
    async function fetchUnreadDM() {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://REDACTED:3000';
      try {
        const res = await fetch(`${API_URL}/api/private-messages/unread-counts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // data = { [userId]: count, ... }
          const total = Object.values(data).reduce((a, b) => a + b, 0);
          setGlobalNotifications((prev) => ({ ...prev, private: total }));
        }
      } catch (e) {
        // fail silently
      }
    }
    fetchUnreadDM();
  }, []);

  useEffect(() => {
    if (!socket) return;
    // Mise à jour du compteur à chaque message reçu
    socket.on('privateMessage', (msg) => {
      // Si le message est pour moi (destinataire), incrémenter le compteur
      const userId = localStorage.getItem('userId') || (msg && msg.fk_destinataire);
      if (msg && msg.fk_destinataire === userId) {
        setGlobalNotifications((prev) => ({ ...prev, private: prev.private + 1 }));
      }
    });
    // Mise à jour du compteur à chaque lecture
    socket.on('privateMessageRead', (msg) => {
      setGlobalNotifications((prev) => ({ ...prev, private: Math.max(prev.private - 1, 0) }));
    });
    return () => {
      socket.off('privateMessage');
      socket.off('privateMessageRead');
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, globalNotifications, setGlobalNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}
