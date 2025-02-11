import pool from '../config/dbConnection.js';

// Définition du modèle Sequelize
export const UserModel = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id_utilisateur: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    mot_de_passe: {
      type: DataTypes.STRING,
      allowNull: false
    },
    photo_de_profil: {
      type: DataTypes.STRING
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fk_statut: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'utilisateur',
    timestamps: false
  });
  return User;
};

// Classe pour les opérations personnalisées avec la base de données via pool
export class UserQueries {
  // Créer un nouvel utilisateur
  static async createUser({ nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut }) {
    try {
      const validationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Génère un code aléatoire à 6 chiffres
      const result = await pool.query(
        `INSERT INTO utilisateur (nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut, validation_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [nom, email, mot_de_passe, photo_de_profil, is_activated, fk_statut, validationCode]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error.stack);
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
        'DELETE FROM utilisateur WHERE id_utilisateur = $1 RETURNING *',
        [id_utilisateur]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Trouver ou créer un utilisateur
  static async findOrCreateUser({ nom, email, googleId, photo_de_profil }) {
    try {
      console.log("Recherche de l'utilisateur avec email :", email);
      const queryResult = await pool.query('SELECT * FROM utilisateur WHERE email = $1', [email]);
      if (queryResult.rows.length === 0) {
        console.log("Utilisateur non trouvé, création d'un nouvel utilisateur.");
        const insertResult = await pool.query(
          `INSERT INTO utilisateur (nom, email, google_id, photo_de_profil, mot_de_passe, fk_statut)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [nom, email, googleId, photo_de_profil, 'default_password', 1]
        );
        return insertResult.rows[0];
      } else {
        console.log("Utilisateur trouvé :", email);
        return queryResult.rows[0];
      }
    } catch (error) {
      console.error('Error :', error);
      throw error;
    }
  }
}
