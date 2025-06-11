import { useState, useCallback } from 'react';
import { API_URL } from '../config/api';

export const useMistral = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Pose une question à Mistral dans un canal avec historique
   */
  const askMistralInChannel = useCallback(async (canalId, question, options = {}) => {
    const { includeHistory = true, historyLimit = 100 } = options;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${API_URL}/api/mistral/channel/${canalId}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          includeHistory,
          historyLimit
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la communication avec Mistral');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Pose une question à Mistral en message privé avec historique
   */
  const askMistralPrivate = useCallback(async (question, options = {}) => {
    const { includeHistory = true, historyLimit = 100 } = options;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${API_URL}/api/mistral/private/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          includeHistory,
          historyLimit
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la communication avec Mistral');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère l'historique des conversations avec Mistral
   */
  const getMistralHistory = useCallback(async (type, canalId = null, limit = 100) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const params = new URLSearchParams({
        type,
        limit: limit.toString()
      });

      if (canalId) {
        params.append('canalId', canalId);
      }

      const response = await fetch(`${API_URL}/api/mistral/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération de l\'historique');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    askMistralInChannel,
    askMistralPrivate,
    getMistralHistory
  };
};
