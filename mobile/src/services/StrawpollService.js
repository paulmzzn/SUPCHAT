import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';

class StrawpollService {
  constructor() {
    this.baseURL = 'https://strawpoll.com/api/poll';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Construire l'URL d'un sondage
  buildPollUrl(pollId) {
    return `https://strawpoll.com/${pollId}`;
  }

  // Extraire l'ID d'un sondage depuis une URL
  extractPollId(url) {
    try {
      // Patterns supportés:
      // https://strawpoll.com/polls/XXXXXXXX
      // https://strawpoll.com/XXXXXXXX
      // strawpoll.com/XXXXXXXX
      const patterns = [
        /strawpoll\.com\/polls\/([a-zA-Z0-9]+)/,
        /strawpoll\.com\/([a-zA-Z0-9]+)$/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1] && match[1].length >= 8) {
          return match[1];
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur extraction ID sondage:', error);
      return null;
    }
  }

  // Alias pour compatibilité
  extractPollIdFromUrl(url) {
    return this.extractPollId(url);
  }

  // Détecter les liens Strawpoll dans un texte
  detectStrawpollLinks(text) {
    try {
      const urlPattern = /https?:\/\/(?:www\.)?strawpoll\.com\/(?:polls\/)?([a-zA-Z0-9]+)/g;
      const links = [];
      let match;

      while ((match = urlPattern.exec(text)) !== null) {
        const pollId = match[1];
        if (pollId && pollId.length >= 8) {
          links.push({
            url: match[0],
            pollId: pollId,
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
      }

      return links;
    } catch (error) {
      console.error('Erreur détection liens Strawpoll:', error);
      return [];
    }
  }

  // Obtenir les informations d'un sondage via notre backend
  async getPollInfo(pollId) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${env.API_URL}/api/strawpoll/${pollId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`Erreur récupération sondage ${pollId}:`, error);
      throw error;
    }
  }

  // Obtenir les informations avec cache
  async getPollInfoCached(pollId) {
    try {
      // Vérifier le cache
      const cacheKey = `poll_${pollId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }

      // Récupérer depuis l'API
      const data = await this.getPollInfo(pollId);
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      // En cas d'erreur, retourner les données en cache si disponibles
      const cacheKey = `poll_${pollId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        console.warn(`Utilisation cache expiré pour ${pollId}:`, error.message);
        return cached.data;
      }
      
      throw error;
    }
  }

  // Créer un nouveau sondage
  async createPoll(title, options) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const pollData = {
        title: title.trim(),
        options: options.map(opt => opt.trim()).filter(Boolean)
      };

      const response = await fetch(`${env.API_URL}/api/strawpoll/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pollData)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      // Ajouter la propriété pollId si elle n'existe pas mais que id existe
      if (result && result.id && !result.pollId) {
        result.pollId = result.id;
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la création du sondage Strawpoll:', error);
      throw error;
    }
  }

  // Vider le cache
  clearCache() {
    this.cache.clear();
  }

  // Vider le cache expiré
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

export default new StrawpollService();