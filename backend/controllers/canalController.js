import pool from "../config/dbConnection.js";
import Canal from "../models/Canal.js";
import Workspace from "../models/Workspace.js";

// Créer un nouveau canal
export const createCanal = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { nom, is_private } = req.body;
    const userId = req.user.id;

    // Vérifier si le workspace existe
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Vérifier le rôle de l'utilisateur (owner=1, admin=2)
    const roleRes = await pool.query(
      'SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2',
      [workspaceId, userId]
    );
    if (!roleRes.rows.length || (roleRes.rows[0].fk_role !== 1 && roleRes.rows[0].fk_role !== 2)) {
      return res.status(403).json({ message: "Seuls les owners ou admins peuvent créer un canal" });
    }

    const canal = await Canal.create({
      nom,
      is_private: is_private || false,
      fk_workspace: workspaceId,
    });

    res.status(201).json(canal);
  } catch (error) {
    console.error("Erreur lors de la création du canal:", error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer tous les canaux d'un workspace
export const getCanals = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const canals = await Canal.findByWorkspace(workspaceId);
    res.status(200).json(canals);
  } catch (error) {
    console.error("Erreur lors de la récupération des canaux:", error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer un canal spécifique
export const getCanal = async (req, res) => {
  try {
    const { canalId } = req.params;
    const canal = await Canal.findById(canalId);

    if (!canal) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }

    res.status(200).json(canal);
  } catch (error) {
    console.error("Erreur lors de la récupération du canal:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un canal
export const updateCanal = async (req, res) => {
  try {
    const { canalId } = req.params;
    const { nom, is_private } = req.body;

    const canal = await Canal.update(canalId, {
      nom,
      is_private
    });

    if (!canal) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }

    res.status(200).json(canal);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du canal:", error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un canal
export const deleteCanal = async (req, res) => {
  try {
    const { canalId, workspaceId } = req.params;
    const userId = req.user.id;

    // Vérification que le canal existe et appartient au workspace
    const canal = await Canal.findById(canalId);
    if (!canal) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }

    if (canal.fk_workspace != workspaceId) {
      return res
        .status(403)
        .json({ message: "Ce canal n'appartient pas au workspace spécifié" });
    }

    // Vérifier le rôle de l'utilisateur (owner=1, admin=2)
    const roleRes = await pool.query(
      'SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2',
      [workspaceId, userId]
    );
    if (!roleRes.rows.length || (roleRes.rows[0].fk_role !== 1 && roleRes.rows[0].fk_role !== 2)) {
      return res.status(403).json({ message: "Seuls les owners ou admins peuvent supprimer un canal" });
    }

    const result = await Canal.delete(canalId);

    if (!result) {
      return res
        .status(404)
        .json({ message: "Erreur lors de la suppression du canal" });
    }

    res.status(200).json({ message: "Canal supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du canal:", error);
    res.status(500).json({ message: error.message });
  }
};
