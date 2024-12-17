import pool from '../config/dbConnection.js';

class UserModel {
  // Créer un nouvel utilisateur
  static async createUser({ nom, email, mot_de_passe, photo_de_profil, fk_statut }) {
    try {
      const result = await pool.query(
        `INSERT INTO utilisateur (nom, email, mot_de_passe, photo_de_profil, fk_statut)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [nom, email, mot_de_passe, photo_de_profil, fk_statut]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtenir un utilisateur par email
  static async getUserByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM utilisateur WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtenir un utilisateur par ID
  static async getUserById(id_utilisateur) {
    try {
      const result = await pool.query(
        'SELECT * FROM utilisateur WHERE id_utilisateur = $1',
        [id_utilisateur]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lister tous les utilisateurs
  static async getAllUsers() {
    try {
      const result = await pool.query('SELECT * FROM utilisateur');
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

export default UserModel;