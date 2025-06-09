import pool from "../config/dbConnection.js";

class Reminder {  // Créer un rappel
  static async create(reminderData) {
    const {
      user_id,
      title,
      description,
      reminder_date,
      workspace_id,
      canal_id,
      channel_id
    } = reminderData;
    
    // Support both canal_id and channel_id
    const actualCanalId = canal_id || channel_id;

    try {
      // Insert the reminder and return it with user information
      const query = `
        INSERT INTO reminders (user_id, title, description, reminder_date, workspace_id, canal_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id, title, description, reminder_date, workspace_id, canal_id, is_sent, created_at, updated_at
      `;
      
      const values = [user_id, title, description, reminder_date, workspace_id, actualCanalId];
      const result = await pool.query(query, values);
      
      const newReminder = result.rows[0];
      
      // Now fetch the reminder with user information
      const fetchQuery = `
        SELECT 
          r.*,
          u.nom as user_name,
          u.photo_de_profil as user_avatar
        FROM reminders r
        JOIN utilisateur u ON r.user_id = u.id_utilisateur
        WHERE r.id = $1
      `;
      
      const fetchResult = await pool.query(fetchQuery, [newReminder.id]);
      return fetchResult.rows[0];
    } catch (error) {
      console.error("Erreur lors de la création du rappel:", error);
      throw error;
    }
  }

  // Récupérer tous les rappels d'un canal
  static async getByCanalId(canalId) {
    try {
      const query = `
        SELECT 
          r.*,
          u.nom as user_name,
          u.photo_de_profil as user_avatar
        FROM reminders r
        JOIN utilisateur u ON r.user_id = u.id_utilisateur
        WHERE r.canal_id = $1
        ORDER BY r.reminder_date ASC
      `;
      
      const result = await pool.query(query, [canalId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur lors de la récupération des rappels:", error);
      throw error;
    }
  }

  // Récupérer les rappels d'un utilisateur
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT 
          r.*,
          c.nom as canal_name,
          w.nom as workspace_name
        FROM reminders r
        LEFT JOIN canal c ON r.canal_id = c.id_canal
        LEFT JOIN workspace w ON r.workspace_id = w.id_workspace
        WHERE r.user_id = $1
        ORDER BY r.reminder_date ASC
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error("Erreur lors de la récupération des rappels utilisateur:", error);
      throw error;
    }
  }

  // Récupérer les rappels qui doivent être envoyés
  static async getPendingReminders() {
    try {
      const query = `
        SELECT 
          r.*,
          u.nom as user_name,
          u.email as user_email,
          c.nom as canal_name,
          w.nom as workspace_name
        FROM reminders r
        JOIN utilisateur u ON r.user_id = u.id_utilisateur
        LEFT JOIN canal c ON r.canal_id = c.id_canal
        LEFT JOIN workspace w ON r.workspace_id = w.id_workspace
        WHERE r.reminder_date <= NOW()
        AND r.is_sent = false
        AND r.email_failed = false
        ORDER BY r.reminder_date ASC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Erreur lors de la récupération des rappels en attente:", error);
      throw error;
    }
  }

  // Marquer un rappel comme envoyé
  static async markAsSent(reminderId) {
    try {
      const query = `
        UPDATE reminders 
        SET is_sent = true, email_sent_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [reminderId]);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rappel:", error);
      throw error;
    }
  }

  // Marquer un rappel comme ayant échoué lors de l'envoi
  static async markAsFailed(reminderId, errorMessage) {
    try {
      const query = `
        UPDATE reminders 
        SET email_failed = true, error_message = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [reminderId, errorMessage]);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rappel (échec):", error);
      throw error;
    }
  }

  // Supprimer un rappel
  static async delete(reminderId, userId) {
    try {
      const query = `
        DELETE FROM reminders 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [reminderId, userId]);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur lors de la suppression du rappel:", error);
      throw error;
    }
  }

  // Mettre à jour un rappel
  static async update(reminderId, userId, updateData) {
    try {
      const { title, description, reminder_date } = updateData;
      
      const query = `
        UPDATE reminders 
        SET title = $3, description = $4, reminder_date = $5, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const values = [reminderId, userId, title, description, reminder_date];
      const result = await pool.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rappel:", error);
      throw error;
    }
  }

  // Récupérer un rappel par ID
  static async getById(reminderId) {
    try {
      const query = `
        SELECT 
          r.*,
          u.nom as user_name,
          u.photo_de_profil as user_avatar,
          c.nom as canal_name,
          w.nom as workspace_name
        FROM reminders r
        JOIN utilisateur u ON r.user_id = u.id_utilisateur
        LEFT JOIN canal c ON r.canal_id = c.id_canal
        LEFT JOIN workspace w ON r.workspace_id = w.id_workspace
        WHERE r.id = $1
      `;
      
      const result = await pool.query(query, [reminderId]);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur lors de la récupération du rappel:", error);
      throw error;
    }
  }
}

export default Reminder;
