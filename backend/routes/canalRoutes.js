import express from "express";
import {
  createCanal,
  getCanals,
  getCanal,
  updateCanal,
  deleteCanal,
  getCanalFiles,
} from "../controllers/canalController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Routes pour les canaux
// Toutes les routes nécessitent une authentification
router.post("/workspace/:workspaceId/canals", verifyToken, createCanal);
router.get("/workspace/:workspaceId/canals", verifyToken, getCanals);
router.get("/workspace/:workspaceId/canals/:canalId", verifyToken, getCanal);
router.put("/workspace/:workspaceId/canals/:canalId", verifyToken, updateCanal);
router.delete(
  "/workspace/:workspaceId/canals/:canalId",
  verifyToken,
  deleteCanal
);

// Route pour récupérer tous les fichiers d'un canal
router.get("/canals/:canalId/files", verifyToken, getCanalFiles);

// Route pour récupérer tous les fichiers d'un workspace
router.get("/workspaces/:workspaceId/files", verifyToken, async (req, res) => {
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
