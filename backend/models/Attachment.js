import pool from "../config/dbConnection.js";

class Attachment {
  /**
   * Créer une nouvelle pièce jointe
   * @param {Object} attachment - Données de la pièce jointe
   * @returns {Object} - Pièce jointe créée
   */
  static async create(attachment) {
    const {
      url,
      file_name,
      file_type,
      file_size,
      file_extension,
      content_type,
      fk_message = null,
      fk_message_prive = null,
      fk_workspace = null,
      fk_utilisateur,
    } = attachment;

    try {
      const query = `
        INSERT INTO attachment (
          url, file_name, file_type, file_size, file_extension, content_type,
          fk_message, fk_message_prive, fk_workspace, fk_utilisateur, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *
      `;

      const params = [
        url,
        file_name,
        file_type,
        file_size,
        file_extension,
        content_type,
        fk_message,
        fk_message_prive,
        fk_workspace,
        fk_utilisateur,
      ];

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans Attachment.create:", error);
      throw error;
    }
  }

  /**
   * Récupérer les pièces jointes d'un message
   * @param {Number} messageId - ID du message
   * @returns {Array} - Pièces jointes
   */
  static async getByMessageId(messageId) {
    try {
      const query = `
        SELECT * FROM attachment
        WHERE fk_message = $1
        ORDER BY created_at ASC
      `;

      const result = await pool.query(query, [messageId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur dans Attachment.getByMessageId:", error);
      throw error;
    }
  }

  /**
   * Récupérer les pièces jointes d'un message privé
   * @param {Number} messagePriveId - ID du message privé
   * @returns {Array} - Pièces jointes
   */
  static async getByPrivateMessageId(messagePriveId) {
    try {
      const query = `
        SELECT * FROM attachment
        WHERE fk_message_prive = $1
        ORDER BY created_at ASC
      `;

      const result = await pool.query(query, [messagePriveId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur dans Attachment.getByPrivateMessageId:", error);
      throw error;
    }
  }

  /**
   * Récupérer les pièces jointes d'un utilisateur
   * @param {String} userId - ID de l'utilisateur
   * @returns {Array} - Pièces jointes
   */
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT * FROM attachment
        WHERE fk_utilisateur = $1
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur dans Attachment.getByUserId:", error);
      throw error;
    }
  }

  /**
   * Récupérer les pièces jointes d'un workspace
   * @param {Number} workspaceId - ID du workspace
   * @returns {Array} - Pièces jointes
   */
  static async getByWorkspaceId(workspaceId) {
    try {
      const query = `
        SELECT a.*, u.nom as username
        FROM attachment a
        JOIN utilisateur u ON a.fk_utilisateur = u.id_utilisateur
        WHERE a.fk_workspace = $1 OR
              a.fk_message IN (
                SELECT m.id_message 
                FROM message m 
                JOIN canal c ON m.fk_canal = c.id_canal
                WHERE c.fk_workspace = $1
              )
        ORDER BY a.created_at DESC
      `;

      const result = await pool.query(query, [workspaceId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur dans Attachment.getByWorkspaceId:", error);
      throw error;
    }
  }

  /**
   * Supprimer une pièce jointe
   * @param {Number} id - ID de la pièce jointe
   * @param {String} userId - ID de l'utilisateur qui effectue la suppression
   * @returns {Object|null} - Pièce jointe supprimée ou null si non trouvée
   */
  static async delete(id, userId) {
    try {
      // On vérifie d'abord si l'utilisateur a le droit de supprimer la pièce jointe
      const checkQuery = `
        SELECT * FROM attachment
        WHERE id_attachment = $1 AND fk_utilisateur = $2
      `;

      const checkResult = await pool.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return null; // L'utilisateur n'est pas autorisé ou la pièce jointe n'existe pas
      }

      // Si l'utilisateur est autorisé, on récupère l'URL pour la suppression de S3 plus tard
      const attachmentToDelete = checkResult.rows[0];

      // Supprimer la pièce jointe de la base de données
      const deleteQuery = `
        DELETE FROM attachment
        WHERE id_attachment = $1
        RETURNING *
      `;

      const deleteResult = await pool.query(deleteQuery, [id]);

      if (deleteResult.rows.length === 0) {
        return null;
      }

      // Retourner la pièce jointe supprimée contenant l'URL pour la suppression du fichier S3
      return attachmentToDelete;
    } catch (error) {
      console.error("Erreur dans Attachment.delete:", error);
      throw error;
    }
  }

  /**
   * Récupérer une pièce jointe par ID
   * @param {Number} id - ID de la pièce jointe
   * @returns {Object|null} - Pièce jointe ou null si non trouvée
   */
  static async findById(id) {
    try {
      const query = `
        SELECT * FROM attachment
        WHERE id_attachment = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans Attachment.findById:", error);
      throw error;
    }
  }
}

export default Attachment;
