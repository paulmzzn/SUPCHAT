import UserModel from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendInvitationEmail from '../config/emailService.js';
import sendValidationEmail from '../config/validationEmailService.js'; // Import the validation email service
import sendResetPasswordEmail from '../config/resetPasswordEmailService.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Utiliser une variable d'environnement ou une valeur par défaut
const SECRET_KEY = process.env.JWT_SECRET || 'REDACTED';

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

    // Générer le token JWT avec une expiration plus longue (7 jours au lieu de 48h)
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      SECRET_KEY,
      { expiresIn: '7d' } // Augmenté à 7 jours
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
  console.log('Tentative de validation:', { email, code });

  try {
    const user = await UserModel.getUserByEmail(email);
    console.log('User found:', user);

    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    console.log('Comparing codes:', { 
      provided: code, 
      stored: user.validation_code 
    });

    if (user.validation_code !== code) {
      console.log('Code de validation incorrect');
      return res.status(401).json({ message: 'Code de validation incorrect.' });
    }

    // Mettre à jour le statut de l'utilisateur
    await UserModel.updateUser({
      validation_code: null, // Réinitialiser le code
      is_activated: true
    }, user.id_utilisateur);

    // IMPORTANT: Générer un nouveau token après validation
    // Utiliser exactement la même structure que celle attendue par le middleware
    const token = jwt.sign(
      { 
        id: user.id_utilisateur,
        email: user.email 
      },
      SECRET_KEY,
      { expiresIn: '7d' } // Augmenté à 7 jours
    );

    console.log('Nouveau token généré:', { userId: user.id_utilisateur, tokenStart: token.substring(0, 15) });

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

const resendValidationCode = async (req, res) => {
  const { email } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const user = await UserModel.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Générer un nouveau code de validation
    const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Mettre à jour le code de validation dans la base de données
    await UserModel.updateUser({ 
      validation_code: validationCode 
    }, user.id_utilisateur);

    // Envoyer le nouveau code par email
    await sendValidationEmail(email, validationCode);

    res.status(200).json({ 
      message: 'Nouveau code de validation envoyé avec succès.' 
    });

  } catch (error) {
    console.error('Erreur lors du renvoi du code:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'envoi du nouveau code de validation.' 
    });
  }
};

// Fonction de conversion des statuts numériques vers les chaînes attendues par le frontend
const convertStatus = (statusId) => {
  const statusMap = {
    1: 'online',
    2: 'away',
    3: 'dnd',
    4: 'invisible'
  };
  return statusMap[statusId] || 'online'; // Défaut à 'online' si statusId est inconnu
};

// Récupérer le profil d'un utilisateur
const getUserProfile = async (req, res) => {
  try {
    // Utiliser l'ID d'utilisateur du token JWT
    const userId = req.user.id;
    
    const user = await UserModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Renvoyer les informations de profil sans le mot de passe
    const userProfile = {
      id_utilisateur: user.id_utilisateur,
      nom: user.nom,
      email: user.email,
      bio: user.bio || '',
      photo_url: user.photo_de_profil,
      status: convertStatus(user.fk_statut), // Convertir le statut numérique en chaîne
      date_inscription: user.date_inscription,
      date_naissance: user.date_naissance
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du profil utilisateur',
      error: error.message
    });
  }
};

// Ajouter cette fonction pour récupérer un utilisateur par ID
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    // Préparer l'objet de réponse avec le champ date_creation inclus
    const userData = {
      id_utilisateur: user.id_utilisateur,
      nom: user.nom,
      email: user.email,
      photo_de_profil: user.photo_de_profil,
      bio: user.bio || '',
      status: convertStatus(user.fk_statut),
      date_creation: user.date_creation, // S'assurer que ce champ est inclus
      // Inclure d'autres champs si nécessaire
    };
    
    res.status(200).json(userData);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

// Mettre à jour le profil d'un utilisateur
const updateUserProfile = async (req, res) => {
  try {
    // Utiliser l'ID d'utilisateur du token JWT
    const userId = req.user.id;
    console.log('Données reçues pour mise à jour:', req.body);
    
    // Extraire les données basiques
    const { nom, bio } = req.body;
    let photo_de_profil = null;

    // Extraire spécifiquement le statut
    let fk_statut = null;
    if (req.body.fk_statut) {
      fk_statut = parseInt(req.body.fk_statut, 10);
      console.log(`Statut reçu (${typeof req.body.fk_statut}):`, req.body.fk_statut);
      console.log(`Statut converti (${typeof fk_statut}):`, fk_statut);
    }

    // Traiter l'upload d'avatar si présent
    if (req.file) {
      photo_de_profil = `/uploads/avatars/${req.file.filename}`;
      console.log('Nouvel avatar:', photo_de_profil);
    }

    // Préparer les champs à mettre à jour - plus robuste pour éviter les erreurs de colonne manquante
    const fieldsToUpdate = {};
    
    // Ajouter uniquement les champs qui sont présents et valides
    if (nom) fieldsToUpdate.nom = nom;
    if (fk_statut !== null && !isNaN(fk_statut)) fieldsToUpdate.fk_statut = fk_statut;
    if (photo_de_profil) fieldsToUpdate.photo_de_profil = photo_de_profil;
    
    // Vérifier si la table utilisateur contient une colonne bio avant de tenter de la mettre à jour
    try {
      // Tenter d'ajouter bio au champ si fourni
      if (bio !== undefined) fieldsToUpdate.bio = bio;
    } catch (bioError) {
      console.warn('La colonne bio pourrait ne pas exister:', bioError.message);
      // On continue sans ajouter le champ bio
    }

    console.log('Champs à mettre à jour:', fieldsToUpdate);

    // N'effectuer la mise à jour que s'il y a des champs à mettre à jour
    if (Object.keys(fieldsToUpdate).length > 0) {
      try {
        const updatedUser = await UserModel.updateUser(fieldsToUpdate, userId);
        console.log('Résultat de la mise à jour:', updatedUser);

        if (!updatedUser) {
          return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Créer un objet de réponse sans le mot de passe
        const responseUser = {
          id_utilisateur: updatedUser.id_utilisateur,
          nom: updatedUser.nom,
          email: updatedUser.email,
          bio: updatedUser.bio || '',  // Utiliser chaîne vide par défaut si bio n'existe pas
          photo_url: updatedUser.photo_de_profil,
          status: convertStatus(updatedUser.fk_statut) // Convertir le statut numérique en chaîne
        };

        return res.status(200).json({
          message: 'Profil mis à jour avec succès',
          user: responseUser
        });
      } catch (updateError) {
        // Si l'erreur est due à la colonne bio manquante, essayer sans le champ bio
        if (updateError.message && updateError.message.includes('column "bio"') && fieldsToUpdate.bio !== undefined) {
          console.warn('Tentative de mise à jour sans le champ bio');
          delete fieldsToUpdate.bio;
          
          // Réessayer sans le champ bio
          if (Object.keys(fieldsToUpdate).length > 0) {
            const updatedUser = await UserModel.updateUser(fieldsToUpdate, userId);
            
            if (!updatedUser) {
              return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }
            
            return res.status(200).json({
              message: 'Profil partiellement mis à jour (bio ignoré)',
              user: {
                id_utilisateur: updatedUser.id_utilisateur,
                nom: updatedUser.nom,
                email: updatedUser.email,
                photo_url: updatedUser.photo_de_profil,
                status: convertStatus(updatedUser.fk_statut) // Convertir le statut numérique en chaîne
              }
            });
          }
        }
        
        // Si ce n'est pas une erreur de colonne manquante ou si la réessai échoue
        throw updateError;
      }
    }

    res.status(400).json({ message: 'Aucun champ à mettre à jour.' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du profil utilisateur',
      error: error.message
    });
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
  validateUser,
  requestPasswordReset, 
  resetPassword,
  resendValidationCode,  // Ajout du nouveau contrôleur
  getUserProfile,
  getUserById,
  updateUserProfile
};
