import pool from '../config/dbConnection.js';

class MessageModel {
  static async createMessage({ user_id, canal_id, content }) {
    try {
      const result = await pool.query(
        'INSERT INTO message (fk_utilisateur, fk_canal, contenu) VALUES ($1, $2, $3) RETURNING *',
        [user_id, canal_id, content]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getMessagesByCanal(canal_id, workspace_id) {
    try {
      const result = await pool.query(
        `SELECT 
          m.id_message,
          m.contenu,
          m.date_envoi,
          u.nom as username,
          u.id_utilisateur as user_id
         FROM message m 
         JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur 
         JOIN canal c ON m.fk_canal = c.id_canal
         WHERE m.fk_canal = $1 
         AND c.fk_workspace = $2
         ORDER BY m.date_envoi ASC`,
        [canal_id, workspace_id]
      );
      
      // Formater les résultats
      return result.rows.map(msg => ({
        id: msg.id_message,
        content: msg.contenu,
        created_at: msg.date_envoi,
        username: msg.username,
        user_id: msg.user_id
      }));
    } catch (error) {
      throw error;
    }
  }

  static async getMessageById(message_id) {
    try {
      const result = await pool.query(
        `SELECT 
          m.id_message,
          m.contenu,
          m.date_envoi,
          u.nom as username,
          u.id_utilisateur as user_id
         FROM message m 
         JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur 
         WHERE m.id_message = $1`,
        [message_id]
      );

      const msg = result.rows[0];
      if (!msg) return null;

      // Formater le résultat
      return {
        id: msg.id_message,
        content: msg.contenu,
        created_at: msg.date_envoi,
        username: msg.username,
        user_id: msg.user_id
      };
    } catch (error) {
      throw error;
    }
  }
}

export default MessageModel;
