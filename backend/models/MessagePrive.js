import pool from "../config/dbConnection.js";

class MessagePrive {
  static async create({
    contenu,
    fk_expediteur,
    fk_destinataire,
    pieces_jointes = [],
    parent_id = null,
  }) {
    const result = await pool.query(
      `INSERT INTO message_prive (contenu, fk_expediteur, fk_destinataire, pieces_jointes, date_creation, parent_id)
       VALUES ($1, $2, $3, $4, NOW(), $5)
       RETURNING *`,
      [contenu, fk_expediteur, fk_destinataire, JSON.stringify(pieces_jointes), parent_id]
    );
    return result.rows[0];
  }

  static async getConversation(userA, userB, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT mp.* 
         FROM message_prive mp
         WHERE (mp.fk_expediteur = $1 AND mp.fk_destinataire = $2)
            OR (mp.fk_expediteur = $2 AND mp.fk_destinataire = $1)
         ORDER BY mp.date_envoi ASC`,
        [userA, userB]
      );

      // Pour chaque message, récupérer les pièces jointes et le parent_message si besoin
      const messagesWithAttachments = await Promise.all(
        result.rows.map(async (message) => {
          // Pièces jointes
          const attachmentsResult = await pool.query(
            `SELECT f.* 
           FROM fichier f
           JOIN message_prive_fichier mpf ON f.id_fichier = mpf.fk_fichier
           WHERE mpf.fk_message_prive = $1`,
            [message.id_message_prive]
          );
          message.attachments = attachmentsResult.rows || [];

          // Ajout du parent_message si parent_id présent
          if (message.parent_id) {
            const parentResult = await pool.query(
              `SELECT id_message_prive, contenu, fk_expediteur FROM message_prive WHERE id_message_prive = $1`,
              [message.parent_id]
            );
            if (parentResult.rows.length > 0) {
              message.parent_message = parentResult.rows[0];
            }
          }
          return message;
        })
      );
      return messagesWithAttachments;
    } catch (error) {
      console.error(
        `Erreur dans MessagePrive.getConversation: ${error.message}`
      );
      throw error;
    }
  }

  static async getById(id_message_prive) {
    try {
      // Requête pour récupérer le message
      const messageResult = await pool.query(
        `SELECT * FROM message_prive WHERE id_message_prive = $1`,
        [id_message_prive]
      );

      if (messageResult.rows.length === 0) {
        return null;
      }

      const message = messageResult.rows[0];

      // Récupérer les pièces jointes associées
      const attachmentsResult = await pool.query(
        `SELECT f.* 
         FROM fichier f
         JOIN message_prive_fichier mpf ON f.id_fichier = mpf.fk_fichier
         WHERE mpf.fk_message_prive = $1`,
        [id_message_prive]
      );

      if (attachmentsResult.rows.length > 0) {
        message.attachments = attachmentsResult.rows;
      } else {
        message.attachments = [];
      }

      // Ajout du parent_message si parent_id présent
      if (message.parent_id) {
        const parentResult = await pool.query(
          `SELECT id_message_prive, contenu, fk_expediteur FROM message_prive WHERE id_message_prive = $1`,
          [message.parent_id]
        );
        if (parentResult.rows.length > 0) {
          message.parent_message = parentResult.rows[0];
        }
      }

      return message;
    } catch (error) {
      console.error(`Erreur dans MessagePrive.getById: ${error.message}`);
      throw error;
    }
  }

  static async updateMessage(id_message_prive, userId, contenu) {
    const result = await pool.query(
      `UPDATE message_prive
       SET contenu = $1, date_modification = NOW()
       WHERE id_message_prive = $2 AND fk_expediteur = $3 AND is_deleted = false
       RETURNING *`,
      [contenu, id_message_prive, userId]
    );
    return result.rows[0];
  }

  static async deleteMessage(id_message_prive, userId) {
    const result = await pool.query(
      `UPDATE message_prive
       SET is_deleted = true, contenu = '[message supprimé]', date_modification = NOW()
       WHERE id_message_prive = $1 AND fk_expediteur = $2 AND is_deleted = false
       RETURNING *`,
      [id_message_prive, userId]
    );
    return result.rows[0];
  }

  static async markAsRead(id_message_prive, userId) {
    // Seul le destinataire peut marquer comme lu
    const result = await pool.query(
      `UPDATE message_prive
       SET date_lecture = NOW()
       WHERE id_message_prive = $1 AND fk_destinataire = $2
       RETURNING *`,
      [id_message_prive, userId]
    );
    return result.rows[0];
  }

  static async getUserConversations(userId) {
    // Retourne la liste des utilisateurs avec qui userId a échangé au moins un message
    const result = await pool.query(
      `SELECT DISTINCT
          CASE
            WHEN fk_expediteur = $1 THEN fk_destinataire
            ELSE fk_expediteur
          END AS other_user_id
       FROM message_prive
       WHERE (fk_expediteur = $1 OR fk_destinataire = $1) AND is_deleted = false`,
      [userId]
    );
    return result.rows.map((row) => row.other_user_id);
  }

  // Ajouter une méthode pour la déduplication des messages
  static async getRecentSimilarMessages(expediteurId, destinataireId, contenu) {
    try {
      const result = await pool.query(
        `SELECT * FROM message_prive 
         WHERE fk_expediteur = $1 AND fk_destinataire = $2 AND contenu = $3
         AND date_creation > NOW() - INTERVAL '5 seconds'
         ORDER BY date_creation DESC`,
        [expediteurId, destinataireId, contenu]
      );
      return result.rows;
    } catch (error) {
      console.error("Error checking for similar messages:", error);
      return []; // Return empty array instead of failing
    }
  }

  /**
   * Ajouter une pièce jointe à un message privé existant
   * @param {Number} messageId - ID du message privé
   * @param {Object} attachmentInfo - Informations de la pièce jointe (url, type, etc.)
   * @returns {Object} - Message mis à jour
   */
  static async addAttachment(messageId, attachmentInfo) {
    try {
      // Récupérer d'abord le message et ses pièces jointes actuelles
      const currentMessage = await pool.query(
        `SELECT pieces_jointes FROM message_prive WHERE id_message_prive = $1`,
        [messageId]
      );

      if (currentMessage.rows.length === 0) {
        throw new Error("Message privé non trouvé");
      }

      // Récupérer les pièces jointes actuelles ou initialiser un tableau vide
      let currentAttachments = [];
      try {
        if (currentMessage.rows[0].pieces_jointes) {
          currentAttachments = JSON.parse(
            currentMessage.rows[0].pieces_jointes
          );
          // S'assurer que c'est un tableau
          if (!Array.isArray(currentAttachments)) {
            currentAttachments = [];
          }
        }
      } catch (parseError) {
        console.warn(
          "Erreur lors du parsing des pièces jointes existantes:",
          parseError
        );
        currentAttachments = [];
      }

      // Ajouter la nouvelle pièce jointe
      currentAttachments.push(attachmentInfo);

      // Mettre à jour le message
      const result = await pool.query(
        `UPDATE message_prive
         SET pieces_jointes = $1, date_modification = NOW()
         WHERE id_message_prive = $2
         RETURNING *`,
        [JSON.stringify(currentAttachments), messageId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans MessagePrive.addAttachment:", error);
      throw error;
    }
  }

  /**
   * Supprimer une pièce jointe d'un message privé
   * @param {Number} messageId - ID du message privé
   * @param {String} attachmentUrl - URL de la pièce jointe à supprimer
   * @returns {Object} - Message mis à jour
   */
  static async removeAttachment(messageId, attachmentUrl) {
    try {
      // Récupérer d'abord le message et ses pièces jointes actuelles
      const currentMessage = await pool.query(
        `SELECT pieces_jointes FROM message_prive WHERE id_message_prive = $1`,
        [messageId]
      );

      if (currentMessage.rows.length === 0) {
        throw new Error("Message privé non trouvé");
      }

      // Récupérer les pièces jointes actuelles
      let currentAttachments = [];
      try {
        if (currentMessage.rows[0].pieces_jointes) {
          currentAttachments = JSON.parse(
            currentMessage.rows[0].pieces_jointes
          );
          if (!Array.isArray(currentAttachments)) {
            return null; // Rien à supprimer
          }
        }
      } catch (parseError) {
        console.warn(
          "Erreur lors du parsing des pièces jointes existantes:",
          parseError
        );
        return null;
      }

      // Filtrer pour enlever la pièce jointe correspondant à l'URL
      const updatedAttachments = currentAttachments.filter(
        (attachment) => attachment.url !== attachmentUrl
      );

      // Si rien n'a changé, on peut retourner null
      if (updatedAttachments.length === currentAttachments.length) {
        return null;
      }

      // Mettre à jour le message
      const result = await pool.query(
        `UPDATE message_prive
         SET pieces_jointes = $1, date_modification = NOW()
         WHERE id_message_prive = $2
         RETURNING *`,
        [JSON.stringify(updatedAttachments), messageId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans MessagePrive.removeAttachment:", error);
      throw error;
    }
  }
}

export default MessagePrive;
