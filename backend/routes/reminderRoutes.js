import express from "express";
import {
  createReminder,
  getRemindersByCanal,
  getUserReminders,
  deleteReminder,
  updateReminder,
  processPendingReminders,
  triggerReminderProcessing
} from "../controllers/reminderController.js";
import { verifyToken, checkWorkspaceMembership } from "../middleware/authMiddleware.js";

const router = express.Router();

// Simple routes for direct channel access (used by frontend)
// Route pour créer un rappel (simple)
router.post("/reminders", 
  verifyToken, 
  createReminder
);

// Route pour récupérer tous les rappels d'un canal (simple)
router.get("/reminders/channel/:channelId", 
  verifyToken, 
  getRemindersByCanal
);

// Route pour créer un rappel dans un canal spécifique
router.post("/workspace/:workspaceId/canal/:canalId/reminders", 
  verifyToken, 
  checkWorkspaceMembership, 
  createReminder
);

// Route pour récupérer tous les rappels d'un canal
router.get("/workspace/:workspaceId/canal/:canalId/reminders", 
  verifyToken, 
  checkWorkspaceMembership, 
  getRemindersByCanal
);

// Route pour récupérer tous les rappels d'un utilisateur dans un workspace
router.get("/workspace/:workspaceId/user/reminders", 
  verifyToken, 
  checkWorkspaceMembership, 
  getUserReminders
);

// Route pour supprimer un rappel
router.delete("/reminders/:reminderId", 
  verifyToken, 
  deleteReminder
);

// Route pour mettre à jour un rappel
router.put("/reminders/:reminderId", 
  verifyToken, 
  updateReminder
);

// Route pour traiter manuellement les rappels en attente (admin uniquement)
router.post("/reminders/process-pending", 
  verifyToken, 
  processPendingReminders
);

// Route pour déclencher le traitement des rappels (système interne)
router.post("/reminders/trigger-processing", 
  triggerReminderProcessing
);

export default router;