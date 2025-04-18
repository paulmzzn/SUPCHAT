import WorkspaceFavoris from "../models/WorkspaceFavoris.js";
import Workspace from "../models/Workspace.js";

// Ajouter un workspace aux favoris
export const addFavorite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id; // Récupérer depuis le token JWT
    
    // Vérifier si le workspace existe
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    
    const favorite = await WorkspaceFavoris.add(userId, workspaceId);
    
    res.status(201).json({
      message: "Workspace ajouté aux favoris avec succès",
      favorite
    });
  } catch (error) {
    if (error.message === 'Ce workspace est déjà dans vos favoris') {
      return res.status(400).json({ message: error.message });
    }
    console.error("Erreur lors de l'ajout aux favoris:", error);
    res.status(500).json({ message: error.message });
  }
};

// Retirer un workspace des favoris
export const removeFavorite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id; // Récupérer depuis le token JWT
    
    const removed = await WorkspaceFavoris.remove(userId, workspaceId);
    
    if (!removed) {
      return res.status(404).json({ message: "Ce workspace n'est pas dans vos favoris" });
    }
    
    res.status(200).json({
      message: "Workspace retiré des favoris avec succès"
    });
  } catch (error) {
    console.error("Erreur lors du retrait des favoris:", error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer tous les workspaces favoris d'un utilisateur
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id; // Récupérer depuis le token JWT
    
    const favorites = await WorkspaceFavoris.getForUser(userId);
    
    res.status(200).json(favorites);
  } catch (error) {
    console.error("Erreur lors de la récupération des favoris:", error);
    res.status(500).json({ message: error.message });
  }
};

// Vérifier si un workspace est dans les favoris
export const checkFavorite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id; // Récupérer depuis le token JWT
    
    const isFavorite = await WorkspaceFavoris.check(userId, workspaceId);
    
    res.status(200).json({ isFavorite });
  } catch (error) {
    console.error("Erreur lors de la vérification des favoris:", error);
    res.status(500).json({ message: error.message });
  }
};
