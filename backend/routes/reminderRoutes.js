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

/**
 * @swagger
 * components:
 *   schemas:
 *     Reminder:
 *       type: object
 *       properties:
 *         id_rappel:
 *           type: integer
 *         titre:
 *           type: string
 *         description:
 *           type: string
 *         date_rappel:
 *           type: string
 *           format: date-time
 *         date_creation:
 *           type: string
 *           format: date-time
 *         traite:
 *           type: boolean
 *         fk_utilisateur:
 *           type: integer
 *         fk_canal:
 *           type: integer
 *     ReminderInput:
 *       type: object
 *       properties:
 *         titre:
 *           type: string
 *         description:
 *           type: string
 *         date_rappel:
 *           type: string
 *           format: date-time
 *         canal_id:
 *           type: integer
 *
 * /reminders:
 *   post:
 *     summary: Crée un nouveau rappel
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReminderInput'
 *     responses:
 *       201:
 *         description: Rappel créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reminder'
 *       401:
 *         description: Non autorisé
 *
 * /reminders/canal/{canalId}:
 *   get:
 *     summary: Récupère les rappels d'un canal
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: canalId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du canal
 *     responses:
 *       200:
 *         description: Liste des rappels du canal
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reminder'
 *       401:
 *         description: Non autorisé
 *
 * /reminders/user:
 *   get:
 *     summary: Récupère les rappels de l'utilisateur connecté
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des rappels de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reminder'
 *       401:
 *         description: Non autorisé
 *
 * /reminders/{reminderId}:
 *   put:
 *     summary: Met à jour un rappel
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du rappel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReminderInput'
 *     responses:
 *       200:
 *         description: Rappel mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reminder'
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Rappel non trouvé
 *
 *   delete:
 *     summary: Supprime un rappel
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du rappel
 *     responses:
 *       204:
 *         description: Rappel supprimé
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Rappel non trouvé
 *
 * /reminders/process:
 *   post:
 *     summary: Traite les rappels en attente (admin)
 *     tags: [Reminders]
 *     responses:
 *       200:
 *         description: Rappels traités
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 processed:
 *                   type: integer
 *                 message:
 *                   type: string
 */

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