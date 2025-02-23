import UserModel from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendInvitationEmail from '../config/emailService.js';
import sendValidationEmail from '../config/validationEmailService.js'; // Import the validation email service
import sendResetPasswordEmail from '../config/resetPasswordEmailService.js';

const SECRET_KEY = 'your_secret_key'; // Remplace avec une clé secrète plus sécurisée dans un environnement variable

// Fonction pour enregistrer un nouvel utilisateur
const registerUser = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, photo_de_profil, date_naissance } = req.body;

    if (!mot_de_passe) {
      return res.status(400).json({ message: "Le mot de passe est obligatoire pour l'inscription classique" });
    }

    // S'assurer que la date est valide
    const parsedDate = new Date(date_naissance);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "La date de naissance n'est pas valide" });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const user = await UserModel.registerUser({
      nom,
      email,
      mot_de_passe: hashedPassword,
      photo_de_profil,
      date_naissance: date_naissance
    });

    // Envoyer le code de validation immédiatement après l'inscription
    try {
      await sendValidationEmail(email, user.validation_code);
      console.log('Code de validation envoyé:', user.validation_code);
    } catch (emailError) {
      console.error('Erreur d\'envoi email:', emailError);
      // On continue même si l'email échoue, mais on log l'erreur
    }

    res.status(201).json({
      message: "Inscription réussie, veuillez vérifier votre email",
      user: {
        id: user.id_utilisateur,
        email: user.email,
        nom: user.nom
      }
    });
  } catch (error) {
    if (error.message === 'Un compte avec cet email existe déjà') {
      res.status(409).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Erreur lors de l'inscription" });
    }
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

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // Générer un nouveau code de validation
    const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Mettre à jour le code de validation dans la base de données
    await UserModel.updateUser({ 
      validation_code: validationCode 
    }, user.id_utilisateur);

    // Envoyer le code par email
    try {
      await sendValidationEmail(email, validationCode);
      console.log('Code de validation envoyé:', validationCode); // Pour le débogage
    } catch (emailError) {
      console.error('Erreur d\'envoi email:', emailError);
      return res.status(500).json({ message: 'Erreur lors de l\'envoi du code de validation' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      SECRET_KEY,
      { expiresIn: '48h' }
    );

    res.status(200).json({
      message: 'Code de validation envoyé.',
      token,
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

// Fonction pour valider le code
const validateCode = async (req, res) => {
  const { email, code } = req.body;
  console.log('Tentative de validation:', { email, code }); // Debug log

  try {
    const user = await UserModel.getUserByEmail(email);
    console.log('User found:', user); // Debug log

    if (!user) {
      console.log('Utilisateur non trouvé'); // Debug log
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    console.log('Comparing codes:', { 
      provided: code, 
      stored: user.validation_code 
    }); // Debug log

    if (user.validation_code !== code) {
      console.log('Code de validation incorrect'); // Debug log
      return res.status(401).json({ message: 'Code de validation incorrect.' });
    }

    // Mettre à jour le statut de l'utilisateur
    await UserModel.updateUser({
      validation_code: null, // Réinitialiser le code
      is_activated: true
    }, user.id_utilisateur);

    // Générer un nouveau token après validation
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      SECRET_KEY,
      { expiresIn: '48h' }
    );

    res.status(200).json({
      message: 'Validation réussie.',
      token
    });
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    res.status(500).json({
      message: 'Erreur lors de la validation',
      error: error.message
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

const validateUser = async (req, res) => {
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

export { 
  registerUser, 
  getAllUsers, 
  loginUser, 
  updateUser, 
  deleteUser, 
  sendInvitation, 
  validateCode, 
  validateUser,  // Maintenant exporté une seule fois
  requestPasswordReset, 
  resetPassword 
};
