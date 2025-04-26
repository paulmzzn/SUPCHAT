import pool from "../config/dbConnection.js";

class Fichier {
  /**
   * Créer un nouveau fichier
   * @param {Object} fichier - Données du fichier
   * @returns {Object} - Fichier créé
   */
  static async create(fichier) {
    const {
      nom_fichier,
      url,
      type,
      taille_fichier = null,
      extension = null,
      mime_type = null,
      fk_utilisateur,
    } = fichier;

    try {
      const query = `
        INSERT INTO fichier (nom_fichier, url, type, taille_fichier, extension, mime_type, fk_utilisateur, date_upload)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;

      const values = [
        nom_fichier,
        url,
        type,
        taille_fichier,
        extension,
        mime_type,
        fk_utilisateur,
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans Fichier.create:", error);
      throw error;
    }
  }

  /**
   * Récupérer un fichier par ID
   * @param {String} id - ID du fichier
   * @returns {Object|null} - Fichier ou null si non trouvé
   */
  static async findById(id) {
    try {
      const query = `
        SELECT * FROM fichier WHERE id_fichier = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans Fichier.findById:", error);
      throw error;
    }
  }

  /**
   * Associer un fichier à un message
   * @param {String} messageId - ID du message
   * @param {String} fichierId - ID du fichier
   * @returns {Object} - Association créée
   */
  static async addToMessage(messageId, fichierId) {
    try {
      const query = `
        INSERT INTO message_fichier (fk_message, fk_fichier)
        VALUES ($1, $2)
        RETURNING *
      `;

      const result = await pool.query(query, [messageId, fichierId]);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans Fichier.addToMessage:", error);
      throw error;
    }
  }

  /**
   * Retirer l'association d'un fichier avec un message
   * @param {String} messageId - ID du message
   * @param {String} fichierId - ID du fichier
   * @returns {Boolean} - Résultat de l'opération
   */
  static async removeFromMessage(messageId, fichierId) {
    try {
      const result = await pool.query(
        `DELETE FROM message_fichier 
         WHERE fk_message = $1 AND fk_fichier = $2
         RETURNING *`,
        [messageId, fichierId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error("Erreur dans Fichier.removeFromMessage:", error);
      throw error;
    }
  }

  /**
   * Associer un fichier à un message privé
   * @param {String} messagePriveId - ID du message privé
   * @param {String} fichierId - ID du fichier
   * @returns {Object} - Association créée
   */
  static async addToPrivateMessage(messagePriveId, fichierId) {
    try {
      const query = `
        INSERT INTO message_prive_fichier (fk_message_prive, fk_fichier)
        VALUES ($1, $2)
        RETURNING *
      `;

      const result = await pool.query(query, [messagePriveId, fichierId]);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans Fichier.addToPrivateMessage:", error);
      throw error;
    }
  }

  /**
   * Récupérer les fichiers d'un message
   * @param {String} messageId - ID du message
   * @returns {Array} - Fichiers du message
   */
  static async getByMessageId(messageId) {
    try {
      const query = `
        SELECT f.* 
        FROM fichier f
        JOIN message_fichier mf ON f.id_fichier = mf.fk_fichier
        WHERE mf.fk_message = $1
        ORDER BY f.date_upload DESC
      `;

      const result = await pool.query(query, [messageId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur dans Fichier.getByMessageId:", error);
      throw error;
    }
  }

  /**
   * Récupérer les fichiers d'un message privé
   * @param {String} messagePriveId - ID du message privé
   * @returns {Array} - Fichiers du message privé
   */
  static async getByPrivateMessageId(messagePriveId) {
    try {
      const query = `
        SELECT f.* 
        FROM fichier f
        JOIN message_prive_fichier mpf ON f.id_fichier = mpf.fk_fichier
        WHERE mpf.fk_message_prive = $1
        ORDER BY f.date_upload DESC
      `;

      const result = await pool.query(query, [messagePriveId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur dans Fichier.getByPrivateMessageId:", error);
      throw error;
    }
  }

  /**
   * Supprimer un fichier
   * @param {String} id - ID du fichier
   * @param {String} userId - ID de l'utilisateur qui effectue la suppression
   * @returns {Object|null} - Fichier supprimé ou null si non trouvé
   */
  static async delete(id, userId) {
    try {
      // Vérifier d'abord si l'utilisateur a le droit de supprimer le fichier
      const checkQuery = `
        SELECT * FROM fichier
        WHERE id_fichier = $1 AND fk_utilisateur = $2
      `;

      const checkResult = await pool.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return null; // L'utilisateur n'est pas autorisé ou le fichier n'existe pas
      }

      // Si l'utilisateur est autorisé, récupérer l'URL pour la suppression de S3 plus tard
      const fichierToDelete = checkResult.rows[0];

      // Supprimer les associations avec les messages
      await pool.query(`DELETE FROM message_fichier WHERE fk_fichier = $1`, [
        id,
      ]);

      // Supprimer les associations avec les messages privés
      await pool.query(
        `DELETE FROM message_prive_fichier WHERE fk_fichier = $1`,
        [id]
      );

      // Supprimer le fichier de la base de données
      const deleteQuery = `
        DELETE FROM fichier
        WHERE id_fichier = $1
        RETURNING *
      `;

      const deleteResult = await pool.query(deleteQuery, [id]);

      if (deleteResult.rows.length === 0) {
        return null;
      }

      // Retourner le fichier supprimé contenant l'URL pour la suppression du fichier S3
      return fichierToDelete;
    } catch (error) {
      console.error("Erreur dans Fichier.delete:", error);
      throw error;
    }
  }

  /**
   * Récupérer les fichiers d'un utilisateur
   * @param {String} userId - ID de l'utilisateur
   * @returns {Array} - Fichiers de l'utilisateur
   */
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT * FROM fichier
        WHERE fk_utilisateur = $1
        ORDER BY date_upload DESC
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur dans Fichier.getByUserId:", error);
      throw error;
    }
  }

  /**
   * Récupérer les fichiers d'un workspace (via les messages de canaux)
   * @param {Number} workspaceId - ID du workspace
   * @returns {Array} - Fichiers du workspace
   */
  static async getByWorkspaceId(workspaceId) {
    try {
      const query = `
        SELECT f.*, u.nom as username
        FROM fichier f
        JOIN utilisateur u ON f.fk_utilisateur = u.id_utilisateur
        JOIN message_fichier mf ON f.id_fichier = mf.fk_fichier
        JOIN message m ON mf.fk_message = m.id_message
        JOIN canal c ON m.fk_canal = c.id_canal
        WHERE c.fk_workspace = $1
        ORDER BY f.date_upload DESC
      `;

      const result = await pool.query(query, [workspaceId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur dans Fichier.getByWorkspaceId:", error);
      throw error;
    }
  }
}

export default Fichier;
