// Pour copier dans SocketContext.jsx

// Utiliser un délai (timeout) dans la requête fetch pour éviter les délais d'attente trop longs :
const refreshUnreadDM = async () => {
  const token = localStorage.getItem("token");
  if (!token) return; // Ne pas essayer sans token

  try {
    // Ajouter un timeout pour éviter les longs délais d'attente
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes maximum

    const res = await fetch(`${API_URL}/api/private-messages/unread-counts`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Nettoyer le timeout

    if (res.ok) {
      const data = await res.json();
      // Traitement de la réponse...
    }
  } catch (e) {
    console.error(
      "Erreur lors du rafraîchissement du compteur de messages:",
      e
    );
    // Gestion d'erreur améliorée
  }
};

// Pour l'initialisation du socket, ajouter ces options de connexion :
const socketOptions = {
  auth: { token },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 30,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  timeout: 10000,
  autoConnect: true,
  forceNew: false,
  query: { token },
};

// Ajouter ces gestionnaires d'événements de socket :
newSocket.on("reconnect", (attemptNumber) => {
  console.log("[Socket] Reconnecté après", attemptNumber, "tentatives");

  // Rejoindre la room privée à nouveau
  newSocket.emit("joinPrivate");

  // Rafraîchir les compteurs
  setTimeout(() => {
    refreshUnreadDM();
    refreshUnreadChannels();
  }, 1000);
});

newSocket.on("reconnect_error", (error) => {
  console.error("[Socket] Erreur lors de la reconnexion:", error.message);
});

// Gestionnaires d'événements pour les statuts de lecture des messages privés
newSocket.on("privateMessageRead", (data) => {
  console.log("[Socket] Message privé marqué comme lu:", data);
  refreshUnreadDM();
});

newSocket.on("allMessagesRead", (data) => {
  console.log("[Socket] Tous les messages marqués comme lus:", data);
  refreshUnreadDM();
});

newSocket.on("privateMessagesMarkedAsRead", (data) => {
  console.log("[Socket] Messages privés marqués comme lus:", data);
  refreshUnreadDM();
});

// Remplacer l'adresse IP par une valeur plus sûre :
import { API_URL } from "./config/config";
