import React, { createContext, useState, useContext, useEffect } from "react";

// Création d'un contexte pour les paramètres de notification
const NotificationSettingsContext = createContext();

export function useNotificationSettings() {
  const context = useContext(NotificationSettingsContext);
  // Retourner un objet par défaut si le contexte est null
  return (
    context || {
      notificationSettings: {
        messages: true,
        mentions: true,
        sounds: true,
        email: false,
        desktop: true,
      },
      updateNotificationSettings: () => {},
      getNotificationSetting: () => true,
    }
  );
}

export function NotificationSettingsProvider({ children }) {
  // Récupérer les préférences depuis le localStorage ou utiliser des valeurs par défaut
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const savedSettings = localStorage.getItem("notification_settings");
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      messages: true,
      mentions: true,
      sounds: true,
      email: false,
      desktop: true,
    };
  });

  // Mettre à jour les paramètres de notification
  const updateNotificationSettings = (settings) => {
    setNotificationSettings(settings);
    localStorage.setItem("notification_settings", JSON.stringify(settings));
  };

  // Récupérer un paramètre spécifique
  const getNotificationSetting = (setting) => {
    return notificationSettings[setting];
  };

  const value = {
    notificationSettings,
    updateNotificationSettings,
    getNotificationSetting,
  };

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
}
