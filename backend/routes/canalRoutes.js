import express from "express";
import {
  createCanal,
  getCanals,
  getCanal,
  updateCanal,
  deleteCanal,
  getCanalFiles,
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

export default router;
