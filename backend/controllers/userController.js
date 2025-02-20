import UserModel from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendInvitationEmail from '../config/emailService.js';
import sendValidationEmail from '../config/validationEmailService.js'; // Import the validation email service
import sendResetPasswordEmail from '../config/resetPasswordEmailService.js';

const SECRET_KEY = 'your_secret_key'; // Remplace avec une clé secrète plus sécurisée dans un environnement variable

// Fonction pour enregistrer un nouvel utilisateur
const registerUser = async (req, res) => {
  const { nom, email, mot_de_passe, photo_de_profil } = req.body;

  try {
    const existingUser = await UserModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Utilisateur déjà existant avec cet email.' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const user = await UserModel.createUser({
      nom,
      email,
      mot_de_passe: hashedPassword,
      photo_de_profil,
      is_activated: false, // Account is not activated by default
      fk_statut: 1 // Default status
    });

    // Send validation code via email
    await sendValidationEmail(email, user.validation_code);

    // Schedule deletion of non-activated account after 30 minutes
    setTimeout(async () => {
      const user = await UserModel.getUserByEmail(email);
      if (user && !user.is_activated) {
        await UserModel.deleteUser(user.id_utilisateur);
        console.log(`Non-activated account with email ${email} has been deleted.`);
      }
    }, 30 * 60 * 1000); // 30 minutes

    res.status(201).json({
      message: 'Utilisateur enregistré avec succès. Un code de validation a été envoyé à votre adresse email.',
      user,
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error.stack); // Log the error stack trace
    res.status(500).json({
      message: 'Erreur lors de l\'enregistrement',
      error: error.message,
    });
  }
};

// Fonction pour récupérer tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des utilisateurs.',
      error: error.message,
    });
  }
};

// Fonction pour la connexion
const loginUser = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  try {
    const user = await UserModel.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    if (!user.is_activated) {
      return res.status(403).json({ message: 'Compte non activé. Veuillez vérifier votre email pour le code de validation.' });
    }

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Connexion réussie.',
      user, // Include user data in the response
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

// Fonction pour valider le code
const validateCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await UserModel.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    if (user.validation_code !== code) {
      return res.status(401).json({ message: 'Code de validation incorrect.' });
    }

    // Mettre à jour le statut de l'utilisateur pour indiquer qu'il est validé
    await UserModel.updateUser({ is_activated: true }, user.id_utilisateur);

    res.status(200).json({
      message: 'Validation réussie.',
    });
  } catch (error) {
    console.error('Erreur lors de la validation:', error.stack); // Log the error stack trace
    res.status(500).json({
      message: 'Erreur lors de la validation',
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  const { nom, email, mot_de_passe, photo_de_profil, fk_statut } = req.body;
  const { id } = req.params;

  try {
    const user = await UserModel.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const updatedFields = {
      nom: nom || user.nom,
      email: email || user.email,
      mot_de_passe: mot_de_passe ? await bcrypt.hash(mot_de_passe, 10) : user.mot_de_passe,
      photo_de_profil: photo_de_profil || user.photo_de_profil,
      fk_statut: fk_statut || user.fk_statut,
    };

    const updatedUser = await UserModel.updateUser(updatedFields, id);

    res.status(200).json({
      message: 'Utilisateur mis à jour avec succès.',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de l\'utilisateur.',
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    await UserModel.deleteUser(id);
    res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
  }
  catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'utilisateur.',
      error: error.message,
    });
  }
}

const sendInvitation = async (req, res) => {
  const { email, chatRoomName, senderName } = req.body;

  if (!email || !chatRoomName || !senderName) {
      return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
      await sendInvitationEmail(email, chatRoomName, senderName);
      res.status(200).json({ message: 'Invitation sent successfully!' });
  } catch (error) {
      res.status(500).json({ message: 'Failed to send invitation', error: error.message });
  }
};

export const validateUser = async (req, res) => {
  try {
    const { email, code } = req.query;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email et code de validation requis' });
    }

    const user = await UserModel.validateUser(email, code);
    if (!user) {
      return res.status(400).json({ error: 'Code de validation invalide' });
    }

    res.json({ message: 'Compte validé avec succès', user });
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    res.status(500).json({ error: 'Erreur lors de la validation du compte' });
  }
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await UserModel.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Aucun compte associé à cet email.' });
    }

    const updatedUser = await UserModel.setResetPasswordCode(email);
    await sendResetPasswordEmail(email, updatedUser.reset_password_code);

    res.json({ message: 'Instructions de réinitialisation envoyées par email.' });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation.' });
  }
};

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await UserModel.resetPassword(email, code, hashedPassword);
    
    if (!user) {
      return res.status(400).json({ 
        message: 'Code invalide ou expiré.' 
      });
    }

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe.' });
  }
};

export { registerUser, getAllUsers, loginUser, updateUser, deleteUser, sendInvitation, validateCode, requestPasswordReset, resetPassword };
