import express from "express";
import { searchInWorkspace } from "../controllers/searchController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route protégée pour la recherche unifiée dans un workspace
router.get("/workspace/:workspaceId", verifyToken, searchInWorkspace);

export default router;
