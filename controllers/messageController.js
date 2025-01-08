// controllers/messageController.js
import Message from '../models/messageModel.js';

// Récupérer tous les messages
export async function getAllMessages(req, res, next) {
  try {
    const messages = await Message.findAll();
    return res.json(messages);
  } catch (error) {
    next(error);
  }
}

// Récupérer un message par son ID
export async function getMessageById(req, res, next) {
  try {
    const { id } = req.params;
    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ message: 'Message introuvable' });
    }
    return res.json(message);
  } catch (error) {
    next(error);
  }
}

// Créer un nouveau message
export async function createMessage(req, res, next) {
  try {
    const { contenu, fk_channel, fk_user } = req.body;
    const newMessage = await Message.create({ contenu, fk_channel, fk_user });
    return res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
}

// Mettre à jour un message
export async function updateMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { contenu } = req.body;
    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({ message: 'Message introuvable' });
    }
    
    // Met à jour uniquement le contenu, par exemple
    message.contenu = contenu;
    await message.save();
    return res.json(message);
  } catch (error) {
    next(error);
  }
}

// Supprimer un message
export async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;
    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({ message: 'Message introuvable' });
    }
    
    await message.destroy();
    return res.json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    next(error);
  }
}