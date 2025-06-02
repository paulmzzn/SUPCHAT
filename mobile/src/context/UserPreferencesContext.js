import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Création du contexte
const UserPreferencesContext = createContext();

// Clés pour AsyncStorage
const PREFERENCES_KEY = '@SUPCHAT:userPreferences';

// Valeurs par défaut des préférences
const DEFAULT_PREFERENCES = {
  notificationSoundEnabled: true, // Par défaut, le son des notifications est activé
};

export const UserPreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Chargement des préférences depuis le stockage local
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem(PREFERENCES_KEY);
        
        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Mise à jour d'une préférence spécifique
  const updatePreference = async (key, value) => {
    try {
      const updatedPreferences = {
        ...preferences,
        [key]: value,
      };
      
      setPreferences(updatedPreferences);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updatedPreferences));

    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
    }
  };

  // Toggle pour activer/désactiver le son des notifications
  const toggleNotificationSound = async () => {
    await updatePreference('notificationSoundEnabled', !preferences.notificationSoundEnabled);
  };

  // Valeurs exposées par le contexte
  const value = {
    preferences,
    isLoading,
    updatePreference,
    toggleNotificationSound,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Hook personnalisé pour utiliser les préférences
export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences doit être utilisé dans un UserPreferencesProvider');
  }
  return context;
};