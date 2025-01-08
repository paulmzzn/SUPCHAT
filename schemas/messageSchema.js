// schemas/messageSchema.js
import { body } from 'express-validator';

export const messageSchema = [
  body('contenu')
    .isString()
    .withMessage('Le contenu doit être une chaîne de caractères')
    .notEmpty()
    .withMessage('Le contenu ne doit pas être vide'),
  // Ajoute d’autres règles pour fk_channel, fk_user, etc.
];