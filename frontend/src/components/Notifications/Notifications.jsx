import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useNotificationSettings } from "../../context/NotificationSettingsContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { getUserProfile } from "../../services/userService";
// Importer l'utilitaire de gestion des sons
import { playNotificationSound } from "../../assets/sounds/soundUtils";
import "./Notifications.css";

const Notifications = () => {
  const { socket } = useSocket();
  const { notificationSettings } = useNotificationSettings();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef([]);

  // Surveiller les changements dans les paramètres de notification
  useEffect(() => {
    console.log("Paramètres de notification mis à jour:", notificationSettings);
    console.log(
      "Sons de notification activés:",
      notificationSettings?.sounds ? "OUI" : "NON"
    );
  }, [notificationSettings]);

  // Mise à jour de la référence quand les notifications changent
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Extraire l'aperçu du contenu du message de manière intelligente
  const getMessagePreview = (content) => {
    if (!content) return "Nouveau message";
    
    // Supprimer les balises HTML si présentes
    const cleanContent = content.replace(/<[^>]*>?/gm, '');
    
    // Limiter à 60 caractères et ajouter des points de suspension si nécessaire
    const previewLength = 60;
    if (cleanContent.length <= previewLength) {
      return cleanContent;
    }
    
    // Essayer de couper à un espace pour ne pas couper au milieu d'un mot
    const truncated = cleanContent.substring(0, previewLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > previewLength * 0.8) { // Si l'espace est assez loin
      return truncated.substring(0, lastSpaceIndex) + "...";
    }
    
    return truncated + "...";
  };

  // Fonction pour ajouter une nouvelle notification
  const addNotification = async (notification) => {
    const notificationId = Date.now();

    // Si un userId est fourni, récupérer les données du profil
    let userProfile = null;
    if (notification.userId) {
      userProfile = await getUserProfile(notification.userId);
    }

    const fullNotification = {
      id: notificationId,
      ...notification,
      userProfile,
      timestamp: new Date(),
    };

    setNotifications((prev) => [
      ...prev,
      fullNotification,
    ]);

    // Auto-supprimer après 8 secondes
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }, 8000);
    
    // Jouer le son de notification
    playNotificationSound(notificationSettings);
  };

  // Fonction pour naviguer vers la conversation
  const navigateToConversation = (notification) => {
    if (notification.type === "privateMessage" && notification.userId) {
      // Naviguer vers la conversation privée
      navigate(`/direct-messages?user=${notification.userId}`);
    } else if (notification.type === "channelMessage" && notification.channelId) {
      // Naviguer vers le canal du workspace
      navigate(`/workspace/${notification.workspaceId}?channel=${notification.channelId}`);
    }
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
          content: msg.contenu,
          userId: msg.fk_utilisateur,
          photoUrl: msg.photo_url || null,
          senderName: msg.nom || "Utilisateur"
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
          title: `Nouveau message dans ${msg.nom_canal || "canal"}`,
          content: msg.contenu,
          userId: msg.fk_utilisateur,
          photoUrl: msg.photo_url || null,
          senderName: msg.nom || "Utilisateur",
          channelId: msg.fk_canal,
          workspaceId: msg.fk_workspace
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
    <div className={`notifications-container ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      {notifications.map((notification) => {
        // Définir les infos de l'avatar
        let avatarUrl = notification.photoUrl;
        let senderName = notification.senderName;
        
        // Si on a récupéré le profil utilisateur, utiliser ces données
        if (notification.userProfile) {
          avatarUrl = avatarUrl || notification.userProfile.photo_url;
          senderName = senderName || notification.userProfile.nom || notification.userProfile.name || notification.userProfile.username;
        }
        
        return (
          <div
            key={notification.id}
            className={`notification ${notification.type}`}
            onClick={() => {
              navigateToConversation(notification);
              removeNotification(notification.id);
            }}
          >
            <div className="notification-avatar">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={`Avatar de ${senderName}`} 
                  className="avatar-image" 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.style.display = 'none';
                    e.target.parentNode.querySelector('.avatar-placeholder').style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="avatar-placeholder" style={{display: avatarUrl ? 'none' : 'flex'}}>
                {senderName ? senderName.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
            <div className="notification-content">
              <div className="notification-header">
                <h4>
                  {notification.type === "privateMessage" 
                    ? `Message de ${senderName}` 
                    : notification.title}
                </h4>
                <button
                  className="close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  aria-label="Fermer la notification"
                >
                  ×
                </button>
              </div>
              <p className="notification-message">
                {getMessagePreview(notification.content)}
              </p>
              <small className="notification-time">
                {new Date(notification.timestamp).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Notifications;
