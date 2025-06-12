// Version simple et fonctionnelle de MessagePrive pour diagnostiquer le problème
import pool from "../config/dbConnection.js";

class MessagePrive {
  static async create({
    contenu,
    fk_expediteur,
    fk_destinataire,
    pieces_jointes = [],
    parent_id = null,
    replyTo = null,
  }) {
    const messageParentId = replyTo || parent_id;
    const result = await pool.query(
      `INSERT INTO message_prive (contenu, fk_expediteur, fk_destinataire, pieces_jointes, created_at, parent_id)
       VALUES ($1, $2, $3, $4, NOW(), $5)
       RETURNING *`,
      [
        contenu,
        fk_expediteur,
        fk_destinataire,
        JSON.stringify(pieces_jointes),
        messageParentId,
      ]
    );
    return result.rows[0];
  }

  static async getConversation(userA, userB, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT mp.* 
       FROM message_prive mp
       WHERE (mp.fk_expediteur = $1 AND mp.fk_destinataire = $2)
          OR (mp.fk_expediteur = $2 AND mp.fk_destinataire = $1)
       ORDER BY mp.created_at ASC`,
      [userA, userB]
    );
    return result.rows;
  }

  static async getById(id_message_prive) {
    const result = await pool.query(
      `SELECT * FROM message_prive WHERE id_message_prive = $1`,
      [id_message_prive]
    );
    return result.rows[0] || null;
  }

  static async getUserConversations(userId) {
    const result = await pool.query(
      `SELECT 
          CASE
            WHEN fk_expediteur = $1 THEN fk_destinataire
            ELSE fk_expediteur
          END AS other_user_id,
          MAX(created_at) as last_message_date
       FROM message_prive
       WHERE (fk_expediteur = $1 OR fk_destinataire = $1) AND is_deleted = false
       GROUP BY other_user_id
       ORDER BY last_message_date DESC`,
      [userId]
    );
    return result.rows.map((row) => row.other_user_id);
  }

  static async getUnreadCounts(userId) {
    const result = await pool.query(
      `SELECT fk_expediteur, COUNT(*) as count
       FROM message_prive
       WHERE fk_destinataire = $1
         AND is_read = false
         AND is_deleted = false
       GROUP BY fk_expediteur`,
      [userId]
    );
    const counts = {};
    for (const row of result.rows) {
      counts[row.fk_expediteur] = parseInt(row.count, 10);
    }
    return counts;
  }
  static async markAsRead(id_message_prive, userId) {
    const result = await pool.query(
      `UPDATE message_prive
       SET is_read = true, date_lecture = NOW()
       WHERE id_message_prive = $1 AND fk_destinataire = $2
       RETURNING *`,
      [id_message_prive, userId]
    );
    return result.rows[0];
  }

  static async updateMessage(id_message_prive, userId, contenu) {
    const result = await pool.query(
      `UPDATE message_prive
       SET contenu = $1, updated_at = NOW()
       WHERE id_message_prive = $2 AND fk_expediteur = $3 AND is_deleted = false
       RETURNING *`,
      [contenu, id_message_prive, userId]
    );
    return result.rows[0];
  }

  static async deleteMessage(id_message_prive, userId) {
    const result = await pool.query(
      `UPDATE message_prive
       SET is_deleted = true, contenu = '[message supprimé]', updated_at = NOW()
       WHERE id_message_prive = $1 AND fk_expediteur = $2 AND is_deleted = false
       RETURNING *`,
      [id_message_prive, userId]
    );
    return result.rows[0];
  }

  static async getRecentSimilarMessages(expediteurId, destinataireId, contenu) {
    try {
      const result = await pool.query(
        `SELECT * FROM message_prive 
         WHERE fk_expediteur = $1 AND fk_destinataire = $2 AND contenu = $3
         AND created_at > NOW() - INTERVAL '5 seconds'
         ORDER BY created_at DESC`,
        [expediteurId, destinataireId, contenu]
      );
      return result.rows;
    } catch (error) {
      console.error("Error checking for similar messages:", error);
      return [];
    }
  }

  static async markAllAsRead(expediteurId, destinataireId) {
    try {
      const result = await pool.query(
        `UPDATE message_prive
         SET is_read = true, date_lecture = NOW()
         WHERE fk_expediteur = $1 AND fk_destinataire = $2 AND is_read = false
         RETURNING id_message_prive, is_read, date_lecture`,
        [expediteurId, destinataireId]
      );
      return {
        success: true,
        markedCount: result.rowCount,
        messages: result.rows,
      };
    } catch (error) {
      console.error("Erreur dans MessagePrive.markAllAsRead:", error);
      throw error;
    }
  }

  static async getUserConversationsExtended(userId) {
    try {
      const conversationUsers = await this.getUserConversations(userId);
      if (!conversationUsers || conversationUsers.length === 0) {
        return [];
      }
      return conversationUsers.map((otherUserId) => ({ userId: otherUserId }));
    } catch (error) {
      console.error(
        "Erreur dans MessagePrive.getUserConversationsExtended:",
        error
      );
      throw error;
    }
  }
}

export default MessagePrive;
