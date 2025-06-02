/**
 * Utilitaire pour gérer les sons de notification dans l'application
 * Ce fichier fournit des fonctions pour jouer des sons en fonction des paramètres utilisateur
 */

import { simpleBeep, longerBeep } from "./simple-beep";
import notificationSound from "./bell-notification.mp3";

// Instance audio unique pour toute l'application
let audioInstance = null;

/**
 * Joue un son de notification si les paramètres utilisateur le permettent
 * @param {Object} notificationSettings - Les paramètres de notification de l'utilisateur
 * @returns {Promise|null} - Une promesse résolue quand le son est joué, ou null si le son est désactivé
 */
export async function playNotificationSound(notificationSettings) {
  if (!notificationSettings?.sounds) {
    audio.volume = 0.8; // adapte le volume si besoin
    await audio.play();
  }
}

/**
 * Teste le son de notification en utilisant différents formats
 * @returns {Promise} - Une promesse résolue quand le son est joué
 */
export const testNotificationSound = () => {
  try {
    // Créer un élément audio visible dans le DOM pour contourner les restrictions de navigateur
    const audioEl = document.createElement("audio");
    audioEl.src = simpleBeep;
    audioEl.volume = 1.0;

    // Ajouter temporairement au DOM pour permettre l'interaction
    document.body.appendChild(audioEl);

    return audioEl.play()
      .then(() => {
        // Retirer l'élément après lecture
        setTimeout(() => document.body.removeChild(audioEl), 1000);
        return true;
      })
      .catch((error) => {
        console.error("Erreur lors du test de son:", error);
        document.body.removeChild(audioEl);
        return false;
      });
  } catch (error) {
    console.error("Erreur lors de la création de l'audio pour le test:", error);
    return Promise.reject(error);
  }
};
