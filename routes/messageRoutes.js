import express from 'express';
import { Message, User } from '../models/sequelizeInit.js'; // Importez les modèles nécessaires via des exportations nommées

const router = express.Router();

// Envoyer un message
router.post('/send', async (req, res) => {
  try {
    const { contenu, fk_canal, fk_utilisateur } = req.body;
    const message = await Message.create({ contenu, fk_canal, fk_utilisateur });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recevoir les messages d'un canal
router.get('/:fk_canal', async (req, res) => {
  try {
    const messages = await Message.findAll({ 
      where: { fk_canal: req.params.fk_canal },
      include: User, // Inclure les informations de l'utilisateur
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;