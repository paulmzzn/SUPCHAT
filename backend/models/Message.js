import pool from '../config/dbConnection.js';

class Message {
  // Créer un message
  static async create({ contenu, fk_canal, fk_utilisateur }) {
    try {
      console.log('Message.create - params:', { contenu, fk_canal, fk_utilisateur });
      
      // Vérifier que tous les paramètres nécessaires sont fournis
      if (!contenu) throw new Error('Le contenu du message est requis');
      if (!fk_canal) throw new Error('L\'ID du canal est requis');
      if (!fk_utilisateur) throw new Error('L\'ID de l\'utilisateur est requis');
      
      // Modifié pour utiliser created_at au lieu de date_creation
      const result = await pool.query(
        `INSERT INTO message (contenu, fk_canal, fk_utilisateur, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [contenu, fk_canal, fk_utilisateur]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Erreur lors de la création du message');
      }
      
      console.log('Message créé:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans Message.create:', error);
      throw error;
    }
  }
  
  // Récupérer un message par ID avec les informations de l'utilisateur
  static async getById(messageId) {
    try {
      console.log('Message.getById - messageId:', messageId);
      
      const result = await pool.query(
        `SELECT m.*, u.nom, u.photo_de_profil 
         FROM message m
         JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
         WHERE m.id_message = $1`,
        [messageId]
      );
      
      if (result.rows.length === 0) {
        console.warn(`Aucun message trouvé avec l'ID: ${messageId}`);
        return null;
      }
      
      // Log de la structure du message pour déboguer
      console.log('Structure du message récupéré:', JSON.stringify(result.rows[0], null, 2));
      
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans Message.getById:', error);
      throw error;
    }
  }
  
  // Récupérer tous les messages d'un canal avec les informations des utilisateurs
  static async findByChannel(canalId) {
    try {
      console.log('Message.findByChannel - canalId:', canalId);
      
      const result = await pool.query(
        `SELECT m.*, u.nom, u.photo_de_profil 
         FROM message m
         JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
         WHERE m.fk_canal = $1
         ORDER BY m.created_at ASC`,  // Modifié pour utiliser created_at au lieu de date_creation
        [canalId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Erreur dans Message.findByChannel:', error);
      // Retourner un tableau vide plutôt que de propager l'erreur
      return [];
    }
  }
  
  // Mettre à jour un message
  static async update(messageId, { contenu }) {
    try {
      const result = await pool.query(
        `UPDATE message 
         SET contenu = $1,
             updated_at = NOW()
         WHERE id_message = $2
         RETURNING *`,
        [contenu, messageId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Récupérer le message mis à jour avec les informations de l'utilisateur
      return this.getById(messageId);
    } catch (error) {
      console.error('Erreur dans Message.update:', error);
      throw error;
    }
  }
  
  // Supprimer un message
  static async delete(messageId) {
    try {
      const result = await pool.query(
        `DELETE FROM message 
         WHERE id_message = $1
         RETURNING *`,
        [messageId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans Message.delete:', error);
      throw error;
    }
  }
}

export default Message;
