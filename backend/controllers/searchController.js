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

    console.log(`[SearchController] Résultats de recherche:
      - ${results.canaux?.length || 0} canaux
      - ${results.utilisateurs?.length || 0} utilisateurs
      - ${results.messages?.length || 0} messages`);

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
