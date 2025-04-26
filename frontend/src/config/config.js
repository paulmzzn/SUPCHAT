// Ce fichier centralise toutes les variables de configuration

const SUPCHAT_HOST = process.env.REACT_APP_SUPCHAT_HOST || "192.168.1.141";
const API_URL = process.env.REACT_APP_API_URL || `http://${SUPCHAT_HOST}:8888`;
export { API_URL, SUPCHAT_HOST };