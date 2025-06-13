import pool from '../config/dbConnection.js';
import bcrypt from 'bcryptjs';

// ID d'un utilisateur système pour représenter les utilisateurs supprimés
// Assurez-vous que cet ID existe dans votre base de données ou créez-le
const DELETED_USER_ID = '00000000-0000-0000-0000-000000000003'; // UUID valide pour un utilisateur système

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

  // Supprimer un utilisateur avec gestion des relations
  static async deleteUserWithCascade(id_utilisateur) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Anonymiser les messages du canal et assigner au compte utilisateur supprimé
      await client.query(
        `UPDATE message 
         SET contenu = '[Message d''un utilisateur supprimé]',
             fk_utilisateur = $2
         WHERE fk_utilisateur = $1`,
        [id_utilisateur, DELETED_USER_ID]
      );
      
      // 2. Retirer l'utilisateur des workspaces (membre_workspace)
      await client.query(
        'DELETE FROM membre_workspace WHERE fk_utilisateur = $1',
        [id_utilisateur]
      );
      
      // 3. Anonymiser les fichiers téléchargés et retirer la référence à l'utilisateur
      await client.query(
        `UPDATE fichier 
         SET nom_fichier = 'fichier_supprime.bin',
             fk_utilisateur = NULL
         WHERE fk_utilisateur = $1`,
        [id_utilisateur]
      );
      
      // 4. Gérer les éventuelles réactions de l'utilisateur
      await client.query(
        'DELETE FROM reaction WHERE fk_utilisateur = $1',
        [id_utilisateur]
      );
      
      // 5. Gérer les éventuelles réactions aux messages privés
      await client.query(
        'DELETE FROM private_message_reaction WHERE fk_utilisateur = $1',
        [id_utilisateur]
      );
      
      // 6. Gérer les messages privés
      await client.query(
        `UPDATE message_prive
         SET contenu = '[Message d''un utilisateur supprimé]',
             fk_expediteur = $2
         WHERE fk_expediteur = $1`,
        [id_utilisateur, DELETED_USER_ID]
      );
      
      await client.query(
        `UPDATE message_prive
         SET contenu = '[Message d''un utilisateur supprimé]',
             fk_destinataire = $2
         WHERE fk_destinataire = $1`,
        [id_utilisateur, DELETED_USER_ID]
      );
      
      // 7. Supprimer l'utilisateur lui-même
      const result = await client.query(
        'DELETE FROM utilisateur WHERE id_utilisateur = $1 RETURNING *',
        [id_utilisateur]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Erreur lors de la suppression en cascade de l'utilisateur:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findOrCreateUser({ nom, email, googleId, photo_de_profil }) {
    try {
      const existingUser = await pool.query(
        'SELECT * FROM utilisateur WHERE email = $1',
        [email]
      );      const defaultStatus = 4; // 4 = Hors ligne par défaut

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
      }      const defaultStatus = 4; // 4 = Hors ligne par défaut
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

  // S'assurer que le compte utilisateur "supprimé" existe dans la base de données
  static async ensureDeletedUserExists() {
    try {
      // Vérifier si l'utilisateur supprimé existe déjà
      const existingUser = await pool.query(
        'SELECT * FROM utilisateur WHERE id_utilisateur = $1',
        [DELETED_USER_ID]
      );

      if (existingUser.rows.length > 0) {
        return existingUser.rows[0]; // L'utilisateur existe déjà
      }

      // Créer l'utilisateur supprimé s'il n'existe pas
      const result = await pool.query(
        `INSERT INTO utilisateur (id_utilisateur, nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut)
         VALUES ($1, 'Utilisateur Supprimé', 'deleted@system.local', 'nopassword', 'default.png', false, 1)
         ON CONFLICT (id_utilisateur) DO UPDATE
         SET nom = 'Utilisateur Supprimé'
         RETURNING *`,
        [DELETED_USER_ID]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error("Erreur lors de la vérification/création de l'utilisateur supprimé:", error);
      throw error;
    }
  }
}

export default UserModel;