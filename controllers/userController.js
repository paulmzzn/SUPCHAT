import UserModel from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'REDACTED'; // Remplace avec une clé secrète plus sécurisée dans un environnement variable

// Fonction pour enregistrer un nouvel utilisateur
const registerUser = async (req, res) => {
  const { nom, email, mot_de_passe, photo_de_profil, fk_statut } = req.body;

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
      fk_statut,
    });

    res.status(201).json({
      message: 'Utilisateur enregistré avec succès.',
      user,
    });
  } catch (error) {
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
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

export { registerUser, getAllUsers, loginUser };