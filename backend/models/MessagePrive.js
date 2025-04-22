import pool from '../config/dbConnection.js';

class MessagePrive {
  static async create({ contenu, fk_expediteur, fk_destinataire, pieces_jointes = [] }) {
    const result = await pool.query(
      `INSERT INTO message_prive (contenu, fk_expediteur, fk_destinataire, pieces_jointes, date_creation)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [contenu, fk_expediteur, fk_destinataire, JSON.stringify(pieces_jointes)]
    );
    return result.rows[0];
  }

  static async getConversation(userA, userB, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT mp.*, u.nom AS expediteur_nom, u2.nom AS destinataire_nom, u.photo_de_profil AS expediteur_avatar, u2.photo_de_profil AS destinataire_avatar
       FROM message_prive mp
       JOIN utilisateur u ON mp.fk_expediteur = u.id_utilisateur
       JOIN utilisateur u2 ON mp.fk_destinataire = u2.id_utilisateur
       WHERE ((fk_expediteur = $1 AND fk_destinataire = $2) OR (fk_expediteur = $2 AND fk_destinataire = $1))
       AND is_deleted = false
       ORDER BY date_creation ASC
       LIMIT $3 OFFSET $4`,
      [userA, userB, limit, offset]
    );
    return result.rows;
  }

  static async getById(id_message_prive) {
    const result = await pool.query(
      `SELECT * FROM message_prive WHERE id_message_prive = $1`,
      [id_message_prive]
    );
    return result.rows[0];
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
    return result.rows.map(row => row.other_user_id);
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
      console.error('Error checking for similar messages:', error);
      return []; // Return empty array instead of failing
    }
  }
}

export default MessagePrive;
