import express from "express";
import {
  getMembresByWorkspace,
  addMembreToWorkspace,
  deleteMembreFromWorkspace,
  updateMembreRole,
} from "../controllers/membreWorkspaceController.js";

const router = express.Router();

// Récupération des membres d'un workspace
router.get("/:workspaceId", getMembresByWorkspace);

// Ajout d'un membre
router.post("/", addMembreToWorkspace);

// Suppression d'un membre
router.delete("/", deleteMembreFromWorkspace);

// Mise à jour du rôle d'un membre
router.put("/", updateMembreRole);

export default router;
