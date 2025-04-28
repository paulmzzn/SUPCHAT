import pool from '../config/dbConnection.js';
import bcrypt from 'bcryptjs';

class UserModel {
  // Créer un nouvel utilisateur
  static async createUser({ nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut }) {
    try {
      const validationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random 6-digit code
      const result = await pool.query(
        `INSERT INTO utilisateur (nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut, validation_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut, validationCode]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error.stack); // Log the error stack trace
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

  // Mettre à jour un utilisateur
  static async updateUser(fields, id_utilisateur) {
    try {
      const setClause = Object.keys(fields)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const values = [...Object.values(fields), id_utilisateur];
      
      const result = await pool.query(
        `UPDATE utilisateur
         SET ${setClause}
         WHERE id_utilisateur = $${values.length}
         RETURNING *`,
        values
      );
      console.log('Update result:', result.rows[0]); // Debug log
      return result.rows[0];
    } catch (error) {
      console.error('Update error:', error); // Debug log
      throw error;
    }
  }

  // Supprimer un utilisateur
  static async deleteUser(id_utilisateur) {
    try {
      const result = await pool.query(
        'DELETE FROM utilisateur WHERE id_utilisateur = $1',
        [id_utilisateur]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findOrCreateUser({ nom, email, googleId, photo_de_profil }) {
    try {
      const existingUser = await pool.query(
        'SELECT * FROM utilisateur WHERE email = $1',
        [email]
      );

      const defaultStatus = 2;

      if (existingUser.rows.length > 0) {
        // Mettre à jour avec les infos Google même si l'utilisateur existe déjà
        const updatedUser = await pool.query(
          `UPDATE utilisateur 
           SET google_id = $1,
               photo_de_profil = COALESCE($2, photo_de_profil),
               is_activated = true
           WHERE email = $3 
           RETURNING *`,
          [googleId, photo_de_profil, email]
        );
        return updatedUser.rows[0];
      }

      // Créer un nouveau compte Google sans mot de passe
      const newUser = await pool.query(
        `INSERT INTO utilisateur 
         (nom, email, google_id, photo_de_profil, is_activated, fk_statut) 
         VALUES ($1, $2, $3, $4, true, $5) 
         RETURNING *`,
        [nom, email, googleId, photo_de_profil, defaultStatus]
      );

      return newUser.rows[0];
    } catch (error) {
      console.error('Erreur dans findOrCreateUser:', error);
      throw error;
    }
  }

  static async registerUser({ nom, email, mot_de_passe, photo_de_profil, date_naissance }) {
    try {
      if (!mot_de_passe) {
        throw new Error('Le mot de passe est obligatoire pour l\'inscription classique');
      }

      const defaultStatus = 1;
      const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Vérifier si l'utilisateur existe
      const existingUser = await pool.query(
        'SELECT * FROM utilisateur WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        const user = existingUser.rows[0];
        
        // Si l'utilisateur a uniquement un compte Google (pas de mot de passe)
        if (!user.mot_de_passe) {
          // Ajouter le mot de passe au compte Google existant
          const updatedUser = await pool.query(
            `UPDATE utilisateur 
             SET mot_de_passe = $1,
                 nom = COALESCE($2, nom),
                 photo_de_profil = COALESCE($3, photo_de_profil),
                 validation_code = $4
             WHERE email = $5 
             RETURNING *`,
            [mot_de_passe, nom, photo_de_profil, validationCode, email]
          );
          return updatedUser.rows[0];
        }

        throw new Error('Un compte avec cet email existe déjà');
      }

      // Ajouter un jour à la date de naissance pour compenser le décalage
      const dateNaissance = new Date(date_naissance);
      dateNaissance.setDate(dateNaissance.getDate() + 1); // Ajoute un jour
      const formattedDate = dateNaissance.toISOString().split('T')[0]; // Format YYYY-MM-DD

      // Créer un nouveau compte
      const newUser = await pool.query(
        `INSERT INTO utilisateur 
         (nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut, validation_code, date_naissance) 
         VALUES ($1, $2, $3, $4, false, $5, $6, $7::date) 
         RETURNING *`,
        [nom, email, mot_de_passe, photo_de_profil, defaultStatus, validationCode, formattedDate]
      );

      return newUser.rows[0];
    } catch (error) {
      console.error('Erreur dans registerUser:', error);
      throw error;
    }
  }

  static async validateUser(email, validationCode) {
    try {
      const result = await pool.query(
        `UPDATE utilisateur 
         SET is_activated = true 
         WHERE email = $1 AND validation_code = $2
         RETURNING *`,
        [email, validationCode]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async setResetPasswordCode(email) {
    try {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date(Date.now() + 30 * 60000); // 30 minutes from now
      
      const result = await pool.query(
        `UPDATE utilisateur 
         SET reset_password_code = $1, reset_password_expires = $2
         WHERE email = $3 RETURNING *`,
        [resetCode, expiryTime, email]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async resetPassword(email, resetCode, newPassword) {
    try {
      const result = await pool.query(
        `UPDATE utilisateur 
         SET mot_de_passe = $1, reset_password_code = NULL, reset_password_expires = NULL
         WHERE email = $2 
         AND reset_password_code = $3 
         AND reset_password_expires > NOW()
         RETURNING *`,
        [newPassword, email, resetCode]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default UserModel;