// Un utilitaire simple pour tester les sons de notification
import bellSound from "./bell-notification.mp3";

export const testNotificationSound = () => {
  const audio = new Audio(bellSound);
  audio
    .play()
    .then(() => console.log("Son de notification joué avec succès"))
    .catch((err) =>
      console.error("Erreur lors de la lecture du son de notification:", err)
    );
};

// Export du son de notification pour l'utiliser dans d'autres composants
export { bellSound as notificationSound };
