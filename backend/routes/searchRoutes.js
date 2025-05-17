import express from "express";
import { searchInWorkspace } from "../controllers/searchController.js";
import { verifyToken, checkWorkspaceMembership } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protéger la route de recherche avec la vérification d'appartenance au workspace
router.get("/workspace/:workspaceId", verifyToken, checkWorkspaceMembership, searchInWorkspace);

export default router;
