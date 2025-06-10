import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';

const useReminders = (channelId, workspaceId) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les rappels d'un canal
  const loadReminders = useCallback(async () => {
    if (!channelId) return;

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${env.API_URL}/api/reminders/channel/${channelId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors du chargement des rappels');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rappels:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  // Créer un rappel
  const createReminder = useCallback(async (reminderData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...reminderData,
          canal_id: channelId,
          workspace_id: workspaceId,
        }),
      });

      if (response.ok) {
        const newReminder = await response.json();
        // Recharger les rappels pour maintenir la cohérence
        await loadReminders();
        return { success: true, reminder: newReminder };
      } else {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.message || 'Erreur lors de la création du rappel' 
        };
      }
    } catch (error) {
      console.error('Erreur lors de la création du rappel:', error);
      return { 
        success: false, 
        error: 'Erreur de connexion au serveur' 
      };
    }
  }, [channelId, workspaceId, loadReminders]);

  // Modifier un rappel
  const updateReminder = useCallback(async (reminderId, reminderData) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reminderData),
      });

      if (response.ok) {
        const updatedReminder = await response.json();
        setReminders(prev => 
          prev.map(reminder => 
            reminder.id === reminderId ? updatedReminder : reminder
          )
        );
        return { success: true, reminder: updatedReminder };
      } else {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.message || 'Erreur lors de la modification du rappel' 
        };
      }
    } catch (error) {
      console.error('Erreur lors de la modification du rappel:', error);
      return { 
        success: false, 
        error: 'Erreur de connexion au serveur' 
      };
    }
  }, []);

  // Supprimer un rappel
  const deleteReminder = useCallback(async (reminderId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
        return { success: true };
      } else {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.message || 'Erreur lors de la suppression du rappel' 
        };
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du rappel:', error);
      return { 
        success: false, 
        error: 'Erreur de connexion au serveur' 
      };
    }
  }, []);

  // Charger les rappels au changement de canal
  useEffect(() => {
    if (channelId) {
      loadReminders();
    } else {
      setReminders([]);
    }
  }, [channelId, loadReminders]);

  return {
    reminders,
    loading,
    error,
    loadReminders,
    createReminder,
    updateReminder,
    deleteReminder,
  };
};

export default useReminders;
