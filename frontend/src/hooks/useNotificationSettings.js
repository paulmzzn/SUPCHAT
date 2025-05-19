// Hook pour gérer les paramètres de notification
import { useState, useEffect } from "react";

/**
 * Hook personnalisé pour gérer les préférences de notification de l'utilisateur
 * @returns {Object} - État et fonctions liées aux notifications
 */
export const useNotificationSettings = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    desktop: true,
    mentions: true,
    directMessages: true,
  });

  // Chargement des préférences de notification à partir du localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("notificationSettings");
    if (savedSettings) {
      try {
        setNotificationSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error(
          "Erreur lors du chargement des paramètres de notification:",
          error
        );
      }
    }
  }, []);

  // Sauvegarde des préférences de notification dans le localStorage
  const updateNotificationSettings = (newSettings) => {
    const updatedSettings = { ...notificationSettings, ...newSettings };
    setNotificationSettings(updatedSettings);
    localStorage.setItem(
      "notificationSettings",
      JSON.stringify(updatedSettings)
    );
  };

  return {
    notificationSettings,
    updateNotificationSettings,
  };
};

export default useNotificationSettings;
