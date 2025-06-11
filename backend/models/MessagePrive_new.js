import pool from "../config/dbConnection.js";
import ReactionPrive from "./ReactionPrive.js";

class MessagePrive {
  static async create({
    contenu,
    fk_expediteur,
    fk_destinataire,
    pieces_jointes = [],
    parent_id = null,
    replyTo = null,
  }) {
    // Utiliser replyTo comme parent_id s'il est fourni, sinon utiliser parent_id
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

    // Si c'est une réponse à un message, récupérer les détails du message parent
    let messageData = result.rows[0];
    if (messageParentId) {
      try {
        const parentResult = await pool.query(
          `SELECT id_message_prive, contenu, fk_expediteur FROM message_prive WHERE id_message_prive = $1`,
          [messageParentId]
        );
        if (parentResult.rows.length > 0) {
          messageData.parent_message = parentResult.rows[0];
          // Ajouter aussi les informations sous format replyData pour la compatibilité
          messageData.reply_data = {
            reply_to: parentResult.rows[0].id_message_prive,
            reply_content: parentResult.rows[0].contenu,
            reply_user_id: parentResult.rows[0].fk_expediteur,
          };
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du message parent:",
          error
        );
      }
    }

    return messageData;
  }

  static async getConversation(userA, userB, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT mp.* 
         FROM message_prive mp
         WHERE (mp.fk_expediteur = $1 AND mp.fk_destinataire = $2)
            OR (mp.fk_expediteur = $2 AND mp.fk_destinataire = $1)
         ORDER BY mp.created_at ASC`,
        [userA, userB]
      );

      // Récupérer tous les IDs de messages pour obtenir leurs réactions en une fois
      const messageIds = result.rows.map((m) => m.id_message_prive);

      // Récupérer toutes les réactions en une seule requête pour optimiser les performances
      const reactionsMap = await ReactionPrive.getByMessages(messageIds);

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

              // Ajouter les données de réponse au format attendu par l'app mobile
              message.reply_data = {
                reply_to: parentResult.rows[0].id_message_prive,
                reply_content: parentResult.rows[0].contenu,
                reply_user_id: parentResult.rows[0].fk_expediteur,
              };
            }
          }

          // Ajouter les réactions au message
          message.reactions = reactionsMap[message.id_message_prive] || [];

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

          // Ajouter les données de réponse au format attendu par l'app mobile
          message.reply_data = {
            reply_to: parentResult.rows[0].id_message_prive,
            reply_content: parentResult.rows[0].contenu,
            reply_user_id: parentResult.rows[0].fk_expediteur,
          };
        }
      }

      // Récupérer les réactions du message
      message.reactions = await ReactionPrive.getByMessage(id_message_prive);

      return message;
    } catch (error) {
      console.error(`Erreur dans MessagePrive.getById: ${error.message}`);
      throw error;
    }
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

  static async markAsRead(id_message_prive, userId) {
    // Seul le destinataire peut marquer comme lu
    const result = await pool.query(
      `UPDATE message_prive
       SET is_read = true
       WHERE id_message_prive = $1 AND fk_destinataire = $2
       RETURNING *`,
      [id_message_prive, userId]
    );
    return result.rows[0];
  }

  static async getUserConversations(userId) {
    // Retourne la liste des utilisateurs avec qui userId a échangé au moins un message,
    // triée par date du dernier message décroissante (plus récent d'abord)
    try {
      console.log("Récupération des conversations pour l'utilisateur:", userId);

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

      // Debug - afficher les résultats avec leurs dates
      console.log("Nombre de conversations trouvées:", result.rows.length);
      if (result.rows.length > 0) {
        console.log("Échantillon des conversations triées:");
        result.rows.slice(0, 3).forEach((row) => {
          console.log(
            `- Utilisateur: ${row.other_user_id}, Dernier message: ${row.last_message_date}`
          );
        });
      }

      return result.rows.map((row) => row.other_user_id);
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error);
      throw error;
    }
  }

  // Ajouter une méthode pour la déduplication des messages
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
         SET pieces_jointes = $1, updated_at = NOW()
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
         SET pieces_jointes = $1, updated_at = NOW()
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

  /**
   * Retourne le nombre de messages privés non lus par expéditeur pour un utilisateur donné
   * @param {string} userId - L'ID de l'utilisateur connecté (destinataire)
   * @returns {Object} - { expéditeurId: count, ... }
   */
  static async getUnreadCounts(userId) {
    try {
      const result = await pool.query(
        `SELECT fk_expediteur, COUNT(*) as count
         FROM message_prive
         WHERE fk_destinataire = $1
           AND is_read = false
           AND is_deleted = false
         GROUP BY fk_expediteur`,
        [userId]
      );
      // Retourne un objet { expéditeurId: count, ... }
      const counts = {};
      for (const row of result.rows) {
        counts[row.fk_expediteur] = parseInt(row.count, 10);
      }
      return counts;
    } catch (error) {
      console.error("Erreur dans MessagePrive.getUnreadCounts:", error);
      throw error;
    }
  }

  /**
   * Supprimer tous les messages d'une conversation entre deux utilisateurs
   * @param {string} userA - ID du premier utilisateur
   * @param {string} userB - ID du deuxième utilisateur
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  static async deleteConversation(userA, userB) {
    try {
      const result = await pool.query(
        `UPDATE message_prive
         SET is_deleted = true, contenu = '[message supprimé]', updated_at = NOW()
         WHERE (fk_expediteur = $1 AND fk_destinataire = $2)
            OR (fk_expediteur = $2 AND fk_destinataire = $1)
         RETURNING *`,
        [userA, userB]
      );
      return {
        success: true,
        deletedCount: result.rowCount,
        messages: result.rows,
      };
    } catch (error) {
      console.error("Erreur dans MessagePrive.deleteConversation:", error);
      throw error;
    }
  }

  /**
   * Marquer tous les messages d'un expéditeur comme lus par le destinataire
   * @param {string} expediteurId - ID de l'expéditeur des messages
   * @param {string} destinataireId - ID du destinataire qui marque comme lu
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  static async markAllAsRead(expediteurId, destinataireId) {
    try {
      const result = await pool.query(
        `UPDATE message_prive
         SET is_read = true
         WHERE fk_expediteur = $1 AND fk_destinataire = $2 AND is_read = false
         RETURNING id_message_prive, is_read`,
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

  /**
   * Récupérer toutes les conversations d'un utilisateur avec les infos utilisateur et derniers messages
   * Cette méthode optimisée récupère tout en une seule requête pour améliorer les performances
   *
   * @param {string} userId - L'ID de l'utilisateur connecté
   * @returns {Promise<Array>} - Un tableau d'objets contenant les infos de conversation complètes
   */
  static async getUserConversationsExtended(userId) {
    try {
      // Étape 1: Récupérer tous les utilisateurs avec qui l'utilisateur a conversé
      const conversationUsers = await this.getUserConversations(userId);
      if (!conversationUsers || conversationUsers.length === 0) {
        return [];
      }

      // Étape 2: Créer un tableau de promesses pour récupérer en parallèle
      // les informations de chaque utilisateur et le dernier message
      const conversationPromises = conversationUsers.map(
        async (otherUserId) => {
          // Récupérer les informations de l'utilisateur
          const userInfoResult = await pool.query(
            `SELECT id_utilisateur, nom, email, photo_de_profil 
           FROM utilisateur 
           WHERE id_utilisateur = $1`,
            [otherUserId]
          );
          const userInfo = userInfoResult.rows[0] || null;

          // Récupérer le dernier message échangé
          const lastMessageResult = await pool.query(
            `SELECT * FROM message_prive
           WHERE ((fk_expediteur = $1 AND fk_destinataire = $2) OR
                 (fk_expediteur = $2 AND fk_destinataire = $1))
           AND is_deleted = false
           ORDER BY created_at DESC
           LIMIT 1`,
            [userId, otherUserId]
          );
          const lastMessage = lastMessageResult.rows[0] || null;

          // Récupérer le nombre de messages non lus de cet utilisateur
          const unreadCountResult = await pool.query(
            `SELECT COUNT(*) as unread_count
           FROM message_prive
           WHERE fk_expediteur = $1 
           AND fk_destinataire = $2
           AND is_read = false
           AND is_deleted = false`,
            [otherUserId, userId]
          );
          const unreadCount = parseInt(
            unreadCountResult.rows[0].unread_count || 0,
            10
          );

          // Déterminer le timestamp de la dernière activité pour le tri
          let lastActivity = 0;
          if (lastMessage) {
            lastActivity = new Date(lastMessage.created_at).getTime();
          }

          return {
            userId: otherUserId,
            userInfo,
            lastMessage,
            unreadCount,
            lastActivity,
          };
        }
      );

      // Attendre toutes les promesses et renvoyer les résultats
      return await Promise.all(conversationPromises);
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
