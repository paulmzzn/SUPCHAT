import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useNotificationSettings } from "../../context/NotificationSettingsContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { getUserProfile } from "../../services/userService";
// Importer l'utilitaire de gestion des sons
import { playNotificationSound } from "../../assets/sounds/soundUtils";
import NotificationBubble from "../NotificationBadge/NotificationBubble";
import notificationService from "../../utils/notificationService"; // Nouveau service
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
    // Paramètres de notification mis à jour
  }, [notificationSettings]);

  // Mise à jour de la référence quand les notifications changent
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Extraire l'aperçu du contenu du message de manière intelligente
  const getMessagePreview = (content) => {
    if (!content) return "Nouveau message";

    // Supprimer les balises HTML si présentes
    const cleanContent = content.replace(/<[^>]*>?/gm, "");

    // Limiter à 60 caractères et ajouter des points de suspension si nécessaire
    const previewLength = 60;
    if (cleanContent.length <= previewLength) {
      return cleanContent;
    }

    // Essayer de couper à un espace pour ne pas couper au milieu d'un mot
    const truncated = cleanContent.substring(0, previewLength);
    const lastSpaceIndex = truncated.lastIndexOf(" ");

    if (lastSpaceIndex > previewLength * 0.8) {
      // Si l'espace est assez loin
      return truncated.substring(0, lastSpaceIndex) + "...";
    }

    return truncated + "...";
  };
  // Nettoie les mentions markdown pour n'afficher que le nom
  const cleanMentions = (content) => {
    if (!content) return content;
    // Remplace @[nom](uuid) par @nom
    return content.replace(/@\[(.+?)\]\([^)]+\)/g, "@$1");
  };

  // Fonction pour ajouter une nouvelle notification
  const addNotification = async (notification) => {
    const notificationId = Date.now();

    // Nettoyer le contenu pour les mentions    let cleanedContent = notification.content;
    if (notification.type === "mention") {
      cleanedContent = cleanMentions(notification.content);
    }

    // Si un userId est fourni, récupérer les données du profil
    let userProfile = null;
    if (notification.userId) {
      userProfile = await getUserProfile(notification.userId);
    }
    const fullNotification = {
      id: notificationId,
      ...notification,
      content: cleanedContent, // Utiliser le contenu nettoyé
      userProfile,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, fullNotification]);

    // Auto-supprimer après 8 secondes
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }, 8000);

    // Jouer le son de notification
    playNotificationSound(notificationSettings);

    // NOUVEAU: Afficher la notification push du navigateur si activée
    if (
      notificationSettings?.desktop &&
      notificationService.isNotificationEnabled()
    ) {
      if (notification.type === "privateMessage") {
        notificationService.showPrivateMessageNotification(
          notification.senderName || "Utilisateur",
          cleanedContent,
          notification.userId
        );
      } else if (notification.type === "mention") {
        notificationService.showMentionNotification(
          notification.workspaceName || "Workspace",
          notification.nom_canal || "canal",
          cleanedContent,
          notification.senderName || "Utilisateur",
          notification.workspaceId,
          notification.channelId
        );
      }
    }
  };
  // Fonction pour naviguer vers la conversation
  const navigateToConversation = (notification) => {
    if (notification.type === "privateMessage" && notification.userId) {
      // Naviguer vers la conversation privée
      navigate(`/direct-messages?userId=${notification.userId}`);
    } else if (
      notification.type === "channelMessage" &&
      notification.channelId
    ) {
      // Naviguer vers le canal du workspace
      navigate(
        `/workspace/${notification.workspaceId}?channel=${notification.channelId}`
      );
    }
  };
  // Écouter les événements de message privé
  useEffect(() => {
    if (!socket) return; // Réception d'un nouveau message privé
    const handlePrivateMessage = async (msg) => {
      const userId = localStorage.getItem("userId");

      // Si le message est destiné à l'utilisateur actuel
      if (msg.fk_destinataire === userId) {
        // Récupérer le profil de l'expéditeur pour avoir des informations complètes
        let expediteurProfile = null;
        if (msg.fk_expediteur || msg.fk_utilisateur) {
          const expediteurId = msg.fk_expediteur || msg.fk_utilisateur;
          expediteurProfile = await getUserProfile(expediteurId);
        }

        // Utiliser les données du profil si disponibles, sinon se rabattre sur les données du message
        addNotification({
          type: "privateMessage",
          title: "Nouveau message",
          content: msg.contenu,
          userId: msg.fk_expediteur || msg.fk_utilisateur,
          photoUrl:
            msg.photo_url ||
            (expediteurProfile ? expediteurProfile.photo_url : null),
          senderName:
            msg.nom ||
            (expediteurProfile ? expediteurProfile.nom : "Utilisateur"),
        });
      }
    }; // Réception d'un nouveau message dans un canal
    const handleChannelMessage = async (msg) => {
      const userId = localStorage.getItem("userId");

      // Si le message n'est pas de l'utilisateur actuel
      if (msg.fk_utilisateur !== userId) {
        // Récupérer le profil de l'expéditeur pour avoir des informations complètes
        let expediteurProfile = null;
        if (msg.fk_utilisateur) {
          expediteurProfile = await getUserProfile(msg.fk_utilisateur);
        }

        // Utiliser les données du profil si disponibles, sinon se rabattre sur les données du message
        addNotification({
          type: "channelMessage",
          title: `Nouveau message dans ${msg.nom_canal || "canal"}`,
          content: msg.contenu,
          userId: msg.fk_utilisateur,
          photoUrl:
            msg.photo_url ||
            (expediteurProfile ? expediteurProfile.photo_url : null),
          senderName:
            msg.nom ||
            (expediteurProfile ? expediteurProfile.nom : "Utilisateur"),
          channelId: msg.fk_canal,
          workspaceId: msg.fk_workspace,
        });
      }
    }; // --- AJOUT: Réception d'une notification de mention ---
    const handleMentionNotification = async (notif) => {
      addNotification({
        type: "mention",
        title: notif.title || "Vous avez été mentionné",
        content: notif.content,
        userId: notif.userId, // Remettre l'userId pour la récupération du profil
        photoUrl: notif.photoUrl,
        senderName: notif.senderName,
        channelId: notif.channelId,
        workspaceId: notif.workspaceId,
        nom_canal: notif.nom_canal,
        workspaceName: notif.workspaceName,
        messageId: notif.messageId,
      });
    };

    socket.on("privateMessage", handlePrivateMessage);
    socket.on("message", handleChannelMessage);
    socket.on("mentionNotification", handleMentionNotification); // <-- AJOUT

    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("message", handleChannelMessage);
      socket.off("mentionNotification", handleMentionNotification); // <-- AJOUT
    };
  }, [socket]);

  // Supprime une notification
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  if (notifications.length === 0) return null;

  return (
    <div
      className={`notifications-container ${
        theme === "light" ? "theme-light" : "theme-dark"
      }`}
    >
      {" "}
      {notifications.map((notification) => {
        // Définir les infos de l'avatar
        let avatarUrl = notification.photoUrl;
        let senderName = notification.senderName;

        // Si on a récupéré le profil utilisateur, utiliser ces données
        if (notification.userProfile) {
          // Vérifier toutes les propriétés possibles pour le champ photo
          const possiblePhotoFields = [
            "photo_url",
            "photo",
            "photo_de_profil",
            "avatar",
            "image",
          ];
          for (const field of possiblePhotoFields) {
            if (notification.userProfile[field]) {
              if (!avatarUrl) avatarUrl = notification.userProfile[field];
            }
          }

          // Vérifier toutes les propriétés possibles pour le nom
          const possibleNameFields = [
            "nom",
            "name",
            "pseudo",
            "displayName",
            "prenom",
          ];
          for (const field of possibleNameFields) {
            if (notification.userProfile[field]) {
              if (!senderName || senderName === "Utilisateur")
                senderName = notification.userProfile[field];
            }
          }
        }

        // Utiliser le composant NotificationBubble pour un affichage cohérent
        return (
          <NotificationBubble
            key={notification.id}
            userId={notification.userId}
            senderName={senderName}
            content={notification.content}
            photoUrl={avatarUrl}
            timestamp={notification.timestamp}
            type={notification.type}
            channelId={notification.channelId}
            workspaceId={notification.workspaceId}
            nom_canal={notification.nom_canal}
            workspaceName={notification.workspaceName}
            userProfile={notification.userProfile}
            onClose={() => removeNotification(notification.id)}
          />
        );
      })}
    </div>
  );
};

export default Notifications;
