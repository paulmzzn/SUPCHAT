import { API_URL } from "../config/config";

/**
 * Cache pour stocker les profils utilisateurs déjà récupérés
 * afin d'éviter des requêtes répétées pour les mêmes utilisateurs
 */
const userProfileCache = new Map();

// Durée de vie du cache (en ms) - 15 minutes
const CACHE_TTL = 15 * 60 * 1000;

/**
 * Récupère le profil d'un utilisateur à partir de son ID
 * Utilise un cache avec TTL pour éviter des requêtes répétées
 * 
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} - Informations du profil ou null en cas d'erreur
 */
export const getUserProfile = async (userId) => {
  // Vérifier si le profil est déjà dans le cache et n'est pas expiré
  if (userProfileCache.has(userId)) {
    const cachedData = userProfileCache.get(userId);
    
    // Vérifier si les données du cache sont encore valides
    if (cachedData.timestamp > Date.now() - CACHE_TTL) {
      return cachedData.data;
    }
    
    // Données expirées, nettoyer le cache
    userProfileCache.delete(userId);
  }

  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.error("Pas de token d'authentification trouvé");
      return null;
    }

    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error(`Erreur lors de la récupération du profil utilisateur (${userId}):`, response.status);
      return null;
    }

    const userData = await response.json();
    
    // Mettre en cache pour les futures requêtes
    userProfileCache.set(userId, {
      data: userData,
      timestamp: Date.now()
    });
    
    return userData;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil utilisateur:", error);
    return null;
  }
};

/**
 * Rafraîchit le cache d'un profil spécifique
 * 
 * @param {string} userId - ID de l'utilisateur à rafraîchir
 */
export const refreshUserProfile = (userId) => {
  if (userProfileCache.has(userId)) {
    userProfileCache.delete(userId);
  }
};

/**
 * Efface le cache complet des profils utilisateurs
 */
export const clearUserProfileCache = () => {
  userProfileCache.clear();
};

/**
 * Nettoie le cache des entrées expirées
 * Cette fonction peut être appelée périodiquement pour éviter que le cache ne grossisse trop
 */
export const cleanExpiredCache = () => {
  const expiryTime = Date.now() - CACHE_TTL;
  
  for (const [userId, entry] of userProfileCache.entries()) {
    if (entry.timestamp < expiryTime) {
      userProfileCache.delete(userId);
    }
  }
};
