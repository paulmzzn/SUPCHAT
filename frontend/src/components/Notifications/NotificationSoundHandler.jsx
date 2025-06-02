import React, { useEffect, useState } from "react";
import { useNotificationSettings } from "../../context/NotificationSettingsContext";
import { playNotificationSound } from "../../assets/sounds/soundUtils";

const NotificationSoundHandler = () => {
  const { notificationSettings } = useNotificationSettings();
  const [hasInteracted, setHasInteracted] = useState(false);

  // Gestion de l'interaction utilisateur
  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      document.documentElement.classList.add("user-has-interacted");

      // Supprimer les écouteurs après la première interaction
      ["click", "keydown", "touchstart", "mousedown"].forEach((event) => {
        window.removeEventListener(event, handleFirstInteraction);
      });
    };

    // Ajouter plusieurs types d'écouteurs pour maximiser les chances
    ["click", "keydown", "touchstart", "mousedown"].forEach((event) => {
      window.addEventListener(event, handleFirstInteraction, { once: true });
    });

    return () => {
      ["click", "keydown", "touchstart", "mousedown"].forEach((event) => {
        window.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, []);
  useEffect(() => {
    const handleChannelNotification = (event) => {
      if (
        event.detail.isNewMessage &&
        hasInteracted &&
        notificationSettings?.sounds
      ) {
        playNotificationSound(notificationSettings);
      }
    };

    const handlePrivateMessageNotification = (event) => {
      if (
        event.detail.isNewMessage &&
        hasInteracted &&
        notificationSettings?.sounds
      ) {
        playNotificationSound(notificationSettings);
      }
    };

    window.addEventListener(
      "unreadChannelMessagesUpdated",
      handleChannelNotification
    );
    window.addEventListener(
      "unreadMessagesUpdated",
      handlePrivateMessageNotification
    );

    return () => {
      window.removeEventListener(
        "unreadChannelMessagesUpdated",
        handleChannelNotification
      );
      window.removeEventListener(
        "unreadMessagesUpdated",
        handlePrivateMessageNotification
      );
    };
  }, [notificationSettings, hasInteracted]);

  return null;
};

export default NotificationSoundHandler;
