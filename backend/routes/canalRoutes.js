import express from "express";
import pool from "../config/dbConnection.js";
import {
  createCanal,
  getCanals,
  getCanal,
  updateCanal,
  deleteCanal,
  getCanalFiles,
  getPrivateCanals,
  getMemberChannelAccess,
  updateMemberChannelAccess
} from "../controllers/canalController.js";
import { 
  verifyToken, 
  checkWorkspaceMembership, 
  checkWorkspaceAdmin, 
  checkCanalAccess,
  checkCanalWriteAccess
} from "../middleware/authMiddleware.js";
import Fichier from "../models/Fichier.js";

const router = express.Router();

// Routes pour les canaux
// Toutes les routes nécessitent une authentification ET une appartenance au workspace
router.post("/workspace/:workspaceId/canals", verifyToken, checkWorkspaceMembership, createCanal);
router.get("/workspace/:workspaceId/canals", verifyToken, checkWorkspaceMembership, getCanals);
router.get("/workspace/:workspaceId/canals/:canalId", verifyToken, checkWorkspaceMembership, checkCanalAccess, getCanal);
router.put("/workspace/:workspaceId/canals/:canalId", verifyToken, checkWorkspaceMembership, checkWorkspaceAdmin, updateCanal);
router.delete(
  "/workspace/:workspaceId/canals/:canalId",
  verifyToken,
  checkWorkspaceAdmin,
  deleteCanal
);

// Routes pour les canaux privés et gestion des droits d'accès
router.get("/workspaces/:workspaceId/canaux/private", verifyToken, checkWorkspaceMembership, getPrivateCanals);
router.get("/workspaces/:workspaceId/members/:memberId/channel-access", verifyToken, checkWorkspaceMembership, checkWorkspaceAdmin, getMemberChannelAccess);
router.put("/canaux/:canalId/members/:memberId/access", verifyToken, updateMemberChannelAccess);

// Route pour récupérer tous les fichiers d'un canal
router.get("/canals/:canalId/files", verifyToken, checkCanalAccess, getCanalFiles);

// Route pour récupérer tous les fichiers d'un workspace
router.get("/workspaces/:workspaceId/files", verifyToken, checkWorkspaceMembership, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const files = await Fichier.getByWorkspaceId(workspaceId);
    res.status(200).json(files);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des fichiers du workspace:",
      error
    );
    res.status(500).json({ message: error.message });
  }
});

// Route pour ajouter un membre à un canal privé avec permissions
router.post('/:canalId/members/:userId', verifyToken, async (req, res) => {
  try {
    const { canalId, userId } = req.params;
    const { permission = 'lecture' } = req.body;
    const requesterId = req.user.id;

    // Vérifier que le canal existe
    const canalResponse = await pool.query(
      'SELECT c.*, c.fk_workspace FROM canal c WHERE c.id_canal = $1',
      [canalId]
    );

    if (canalResponse.rows.length === 0) {
      return res.status(404).json({ message: 'Canal non trouvé' });
    }

    const canal = canalResponse.rows[0];
    const workspaceId = canal.fk_workspace;

    // Vérifier que le demandeur a les droits (admin/owner du workspace)
    const roleCheck = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, requesterId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({ message: "Vous n'êtes pas membre de ce workspace" });
    }

    const requesterRole = roleCheck.rows[0].fk_role;
    if (requesterRole !== 1 && requesterRole !== 2) {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour gérer les membres de ce canal" });
    }

    // Vérifier que l'utilisateur à ajouter est membre du workspace
    const memberCheck = await pool.query(
      "SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(400).json({ message: "L'utilisateur doit être membre du workspace" });
    }

    // Vérifier si l'utilisateur est déjà membre du canal
    const existingMember = await pool.query(
      "SELECT * FROM membre_canal WHERE fk_canal = $1 AND fk_utilisateur = $2",
      [canalId, userId]
    );

    if (existingMember.rows.length > 0) {
      // Mettre à jour la permission si l'utilisateur est déjà membre
      await pool.query(
        "UPDATE membre_canal SET droit_acces = $1 WHERE fk_canal = $2 AND fk_utilisateur = $3",
        [permission, canalId, userId]
      );
      return res.status(200).json({ message: "Permission mise à jour" });
    }

    // Ajouter l'utilisateur au canal
    await pool.query(
      "INSERT INTO membre_canal (fk_canal, fk_utilisateur, droit_acces) VALUES ($1, $2, $3)",
      [canalId, userId, permission]
    );

    res.status(200).json({ message: "Membre ajouté au canal avec succès" });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du membre au canal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour retirer un membre d'un canal privé
router.delete('/:canalId/members/:userId', verifyToken, async (req, res) => {
  try {
    const { canalId, userId } = req.params;
    const requesterId = req.user.id;

    // Vérifier que le canal existe
    const canalResponse = await pool.query(
      'SELECT c.*, c.fk_workspace FROM canal c WHERE c.id_canal = $1',
      [canalId]
    );

    if (canalResponse.rows.length === 0) {
      return res.status(404).json({ message: 'Canal non trouvé' });
    }

    const canal = canalResponse.rows[0];
    const workspaceId = canal.fk_workspace;

    // Vérifier que le demandeur a les droits
    const roleCheck = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, requesterId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({ message: "Vous n'êtes pas membre de ce workspace" });
    }

    const requesterRole = roleCheck.rows[0].fk_role;
    if (requesterRole !== 1 && requesterRole !== 2 && requesterId !== userId) {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour retirer ce membre" });
    }

    // Retirer l'utilisateur du canal
    const result = await pool.query(
      "DELETE FROM membre_canal WHERE fk_canal = $1 AND fk_utilisateur = $2",
      [canalId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "L'utilisateur n'est pas membre de ce canal" });
    }

    res.status(200).json({ message: "Membre retiré du canal avec succès" });
  } catch (error) {
    console.error('Erreur lors de la suppression du membre du canal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour vérifier si un utilisateur est membre d'un canal et sa permission
router.get('/:canalId/members/:userId', verifyToken, async (req, res) => {
  try {
    const { canalId, userId } = req.params;

    const result = await pool.query(
      "SELECT droit_acces FROM membre_canal WHERE fk_canal = $1 AND fk_utilisateur = $2",
      [canalId, userId]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ 
        isMember: true, 
        permission: result.rows[0].droit_acces 
      });
    } else {
      res.status(200).json({ 
        isMember: false, 
        permission: null 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du membre:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
