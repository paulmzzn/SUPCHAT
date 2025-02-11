import pool from '../config/dbConnection.js';

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
  static async updateUser({ nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut }, id_utilisateur) {
    try {
      const result = await pool.query(
        `UPDATE utilisateur
         SET nom = COALESCE($1, nom), email = COALESCE($2, email), mot_de_passe = COALESCE($3, mot_de_passe), photo_de_profil = COALESCE($4, photo_de_profil), is_activated = COALESCE($5, is_activated), fk_statut = COALESCE($6, fk_statut)
         WHERE id_utilisateur = $7 RETURNING *`,
        [nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut, id_utilisateur]
      );
      return result.rows[0];
    } catch (error) {
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
      console.log('Recherche de l\'utilisateur avec email :', email);
      let user = await pool.query('SELECT * FROM utilisateur WHERE email = $1', [email]);
      if (user.rows.length === 0) {
        console.log('Utilisateur non trouvé, création d\'un nouvel utilisateur.');
        const result = await pool.query(
          `INSERT INTO utilisateur (nom, email, google_id, photo_de_profil, mot_de_passe, fk_statut)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [nom, email, googleId, photo_de_profil, 'default_password', 1] // Provide a default password and fk_statut
        );
        user = result.rows[0];
      } else {
        console.log('Utilisateur trouvé :', email);
        user = user.rows[0];
      }
      return user;
    } catch (error) {
      console.error('Error :', error);
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