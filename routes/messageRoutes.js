// routes/messageRoutes.js

import express from 'express';
import db from '../models/sequelizeInit.js';  // Ajustez le chemin si nécessaire

const router = express.Router();

// GET all messages
router.get('/', async (req, res) => {
  try {
    const messages = await db.Message.findAll();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new message
router.post('/', async (req, res) => {
  try {
    const { contenu, fk_canal, fk_utilisateur } = req.body;
    // Assurez-vous que fk_canal correspond au type de clé primaire de votre Channel
    const newMessage = await db.Message.create({ contenu, fk_canal, fk_utilisateur });
    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;