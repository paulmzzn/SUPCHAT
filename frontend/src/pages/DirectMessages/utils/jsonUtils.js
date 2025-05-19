// Fonctions utilitaires pour la manipulation de JSON

/**
 * Parse un string JSON de manière sécurisée
 * @param {string} jsonString - String JSON à parser
 * @param {any} fallback - Valeur par défaut en cas d'erreur
 * @returns {any} - Objet parsé ou fallback
 */
export const safeJSONParse = (jsonString, fallback = null) => {
  if (!jsonString) return fallback;

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Erreur lors du parsing JSON:", error);
    return fallback;
  }
};

/**
 * Convertit un objet en string JSON de manière sécurisée
 * @param {any} obj - Objet à convertir
 * @returns {string} - String JSON ou string vide
 */
export const safeJSONStringify = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error("Erreur lors de la conversion en JSON:", error);
    return "";
  }
};
