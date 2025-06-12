// Ce fichier centralise toutes les variables de configuration

// Configuration de l'API
// Si REACT_APP_API_URL est vide ou undefined, utilise une chaîne vide pour les URLs relatives
// Sinon utilise la valeur ou la valeur par défaut
const API_URL =
  process.env.REACT_APP_API_URL === "" || !process.env.REACT_APP_API_URL
    ? ""
    : process.env.REACT_APP_API_URL || "http://192.168.71.234:3000";

// Configuration des WebSockets
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://192.168.71.234:3000";

export { API_URL, SOCKET_URL };
