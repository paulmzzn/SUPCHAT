import React, { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import "./Notifications.css";

const Notifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);

  // Fonction pour ajouter une nouvelle notification
  const addNotification = (notification) => {
    setNotifications((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...notification,
        timestamp: new Date(),
      },
    ]);

    // Auto-supprimer après 5 secondes
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  };

  // Écouter les événements de message privé
  useEffect(() => {
    if (!socket) return;

    // Réception d'un nouveau message privé
    const handlePrivateMessage = (msg) => {
      const userId = localStorage.getItem("userId");
      // Si le message est destiné à l'utilisateur actuel
      if (msg.fk_destinataire === userId) {
        addNotification({
          type: "privateMessage",
          title: "Nouveau message",
          message: `De ${msg.nom || 'Utilisateur'}: ${msg.contenu.substring(0, 30)}${msg.contenu.length > 30 ? '...' : ''}`,
        });
      }
    };

    // Réception d'un nouveau message dans un canal
    const handleChannelMessage = (msg) => {
      const userId = localStorage.getItem("userId");
      // Si le message n'est pas de l'utilisateur actuel
      if (msg.fk_utilisateur !== userId) {
        addNotification({
          type: "channelMessage",
          title: `Nouveau message dans ${msg.nom_canal || 'canal'}`,
          message: `${msg.nom || 'Utilisateur'}: ${msg.contenu.substring(0, 30)}${msg.contenu.length > 30 ? '...' : ''}`,
          channelId: msg.fk_canal
        });
      }
    };

    socket.on("privateMessage", handlePrivateMessage);
    socket.on("message", handleChannelMessage);

    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("message", handleChannelMessage);
    };
  }, [socket]);

  // Supprime une notification
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={`notification ${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-header">
            <h4>{notification.title}</h4>
            <button className="close-btn" onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}>×</button>
          </div>
          <p>{notification.message}</p>
          <small className="notification-time">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </small>
        </div>
      ))}
    </div>
  );
};

export default Notifications;