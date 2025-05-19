// Fonctions utilitaires pour le formatage des dates

/**
 * Formate une date pour l'affichage des messages
 * @param {string} dateString - La date au format string
 * @returns {string} - La date formatée
 */
export const formatMessageDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();

  // Si c'est aujourd'hui, afficher seulement l'heure
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Sinon afficher la date et l'heure
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};
