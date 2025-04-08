import pool from '../config/dbConnection.js';
import Reaction from './Reaction.js';

class Message {
  // Créer un message
  static async create({ contenu, fk_canal, fk_utilisateur, parent_id = null }) {
    try {
      console.log('Message.create - params:', { contenu, fk_canal, fk_utilisateur, parent_id });
      
      // Vérifier que tous les paramètres nécessaires sont fournis
      if (!contenu) throw new Error('Le contenu du message est requis');
      if (!fk_canal) throw new Error('L\'ID du canal est requis');
      if (!fk_utilisateur) throw new Error('L\'ID de l\'utilisateur est requis');
      
      let query, params;
      
      // Si parent_id est fourni, l'inclure dans la requête
      if (parent_id) {
        query = `INSERT INTO message (contenu, fk_canal, fk_utilisateur, parent_id, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING *`;
        params = [contenu, fk_canal, fk_utilisateur, parent_id];
      } else {
        query = `INSERT INTO message (contenu, fk_canal, fk_utilisateur, created_at)
                VALUES ($1, $2, $3, NOW())
                RETURNING *`;
        params = [contenu, fk_canal, fk_utilisateur];
      }
      
      const result = await pool.query(query, params);
      
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
  
  // Récupérer un message par ID avec les informations de l'utilisateur et du parent
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
      
      const message = result.rows[0];
      
      // Si le message a un parent, récupérer ses informations
      if (message.parent_id) {
        const parentResult = await pool.query(
          `SELECT m.id_message, m.contenu, u.nom 
           FROM message m
           JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
           WHERE m.id_message = $1`,
          [message.parent_id]
        );
        
        if (parentResult.rows.length > 0) {
          message.parent_message = parentResult.rows[0];
        }
      }
      
      // Récupérer les réactions du message
      message.reactions = await Reaction.getByMessage(messageId);
      
      return message;
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
         ORDER BY m.created_at ASC`,
        [canalId]
      );
      
      const messages = result.rows;
      
      // Récupérer tous les IDs de messages pour obtenir leurs parents et réactions
      if (messages.length > 0) {
        const messageIds = messages.map(m => m.id_message);
        const parentIds = messages.filter(m => m.parent_id).map(m => m.parent_id);
        
        // Récupérer les messages parents en une seule requête
        if (parentIds.length > 0) {
          const parentsResult = await pool.query(
            `SELECT m.id_message, m.contenu, u.nom
             FROM message m
             JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
             WHERE m.id_message = ANY($1)`,
            [parentIds]
          );
          
          const parentsMap = {};
          parentsResult.rows.forEach(parent => {
            parentsMap[parent.id_message] = parent;
          });
          
          // Ajouter les informations du parent à chaque message
          messages.forEach(message => {
            if (message.parent_id && parentsMap[message.parent_id]) {
              message.parent_message = parentsMap[message.parent_id];
            }
          });
        }
        
        // Récupérer toutes les réactions en une seule requête
        const reactionsMap = await Reaction.getByMessages(messageIds);
        
        // Ajouter les réactions à chaque message
        messages.forEach(message => {
          message.reactions = reactionsMap[message.id_message] || [];
        });
      }
      
      return messages;
    } catch (error) {
      console.error('Erreur dans Message.findByChannel:', error);
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
