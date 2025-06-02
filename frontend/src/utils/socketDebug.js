/**
 * Utilitaire pour déboguer les connexions et événements Socket.IO
 * Version production - debugging désactivé
 */

export const setupSocketDebugger = (socket) => {
  // Debugging désactivé en production
  return {
    checkStatus: () => ({
      connected: socket?.connected || false,
      id: socket?.id || null,
      transportName: socket?.io?.engine?.transport?.name || null,
    }),
  };
};
