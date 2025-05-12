import Search from "../models/Search.js";

// Contrôleur pour la recherche unifiée
export const searchInWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { query } = req.query;

    console.log(
      `[SearchController] Requête reçue pour workspace ${workspaceId} avec query "${query}"`
    );

    // Vérifier que la requête de recherche n'est pas vide
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        message: "La requête de recherche doit contenir au moins 2 caractères",
      });
    }

    // Vérifier si l'utilisateur est authentifié correctement
    if (!req.user) {
      console.error("[SearchController] req.user est null ou undefined");
      console.log("Headers:", req.headers);
      return res.status(401).json({
        message: "Authentification requise pour effectuer une recherche",
      });
    }

    // Extraction de l'ID utilisateur du token JWT
    const userId = req.user.id || req.user.id_utilisateur;

    if (!userId) {
      console.error(
        "[SearchController] ID utilisateur non trouvé dans le token"
      );
      console.log("req.user:", req.user);
      return res.status(401).json({
        message: "ID utilisateur non trouvé dans le token",
      });
    }

    console.log(
      `[SearchController] Recherche pour l'utilisateur ${userId} dans le workspace ${workspaceId} avec la requête "${query}"`
    );

    // Effectuer la recherche unifiée
    const results = await Search.searchInWorkspace(workspaceId, query, userId);

    // Afficher un résumé des résultats
    console.log(`[SearchController] Résultats de recherche:
      - ${results.canaux?.length || 0} canaux
      - ${results.utilisateurs?.length || 0} utilisateurs
      - ${results.messages?.length || 0} messages`);

    // Afficher plus de détails pour les messages trouvés
    if (results.messages && results.messages.length > 0) {
      console.log("[SearchController] Détails des messages trouvés:");
      results.messages.forEach((message, index) => {
        console.log(`  Message ${index + 1}:`);
        console.log(
          `    - Contenu: "${message.contenu.substring(0, 30)}${
            message.contenu.length > 30 ? "..." : ""
          }"`
        );
        console.log(
          `    - Canal: ${message.nom_canal} (ID: ${message.id_canal})`
        );
        console.log(
          `    - Auteur: ${message.nom_utilisateur} (ID: ${message.id_utilisateur})`
        );
        console.log(
          `    - Date: ${new Date(message.date_creation).toLocaleString()}`
        );
      });
    }

    // Renvoyer les résultats
    return res.status(200).json(results);
  } catch (error) {
    console.error("[SearchController] Erreur dans searchInWorkspace:", error);

    // Renvoyer une réponse avec des tableaux vides en cas d'erreur
    return res.status(200).json({
      canaux: [],
      utilisateurs: [],
      messages: [],
      error: "Une erreur est survenue lors de la recherche",
    });
  }
};
