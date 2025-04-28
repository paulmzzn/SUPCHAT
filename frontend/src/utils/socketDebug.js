/**
 * Utilitaire pour déboguer les connexions et événements Socket.IO
 */

export const setupSocketDebugger = (socket) => {
  if (!socket) {
    console.warn("❌ Socket.IO Debugger: Aucun socket fourni");
    return;
  }

  // Log l'état de la connexion
  console.log(`🔌 Socket.IO Debugger: Socket initialisé (ID: ${socket.id})`);
  console.log(
    `🔌 Socket.IO Debugger: État de la connexion: ${
      socket.connected ? "Connecté" : "Déconnecté"
    }`
  );

  // Surveiller les événements de connexion/déconnexion
  socket.on("connect", () => {
    console.log(
      `✅ Socket.IO Debugger: Connecté avec succès (ID: ${socket.id})`
    );
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Socket.IO Debugger: Déconnecté - Raison: ${reason}`);
  });

  socket.on("error", (error) => {
    console.error(`❌ Socket.IO Debugger: Erreur - ${error.message}`);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log(
      `🔄 Socket.IO Debugger: Reconnexion réussie après ${attemptNumber} tentatives`
    );
  });

  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log(
      `🔄 Socket.IO Debugger: Tentative de reconnexion #${attemptNumber}`
    );
  });

  // Surveiller tous les événements reçus
  const originalOnevent = socket.onevent;
  socket.onevent = function (packet) {
    const eventName = packet.data[0];
    const eventData = packet.data.slice(1);

    // Ne pas enregistrer les événements de ping/pong pour éviter de polluer la console
    if (!["ping", "pong"].includes(eventName)) {
      console.log(
        `📥 Socket.IO Debugger: Événement reçu "${eventName}"`,
        eventData
      );
    }

    originalOnevent.call(this, packet);
  };

  // Surveiller tous les événements émis
  const originalEmit = socket.emit;
  socket.emit = function (eventName, ...args) {
    // Ne pas enregistrer les événements de ping/pong pour éviter de polluer la console
    if (!["ping", "pong"].includes(eventName)) {
      console.log(`📤 Socket.IO Debugger: Événement émis "${eventName}"`, args);
    }

    return originalEmit.apply(this, [eventName, ...args]);
  };

  return {
    // Méthode pour vérifier manuellement l'état actuel
    checkStatus: () => {
      console.log(
        `🔍 Socket.IO Debugger: État actuel - ${
          socket.connected ? "Connecté" : "Déconnecté"
        } (ID: ${socket.id || "aucun"})`
      );
      return {
        connected: socket.connected,
        id: socket.id,
        transportName: socket.io?.engine?.transport?.name,
      };
    },
  };
};
