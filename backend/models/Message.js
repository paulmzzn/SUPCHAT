import pool from "../config/dbConnection.js";
import Reaction from "./Reaction.js";
import User from "./User.js";

class Message {
  // Créer un message
  static async create({ contenu, fk_canal, fk_utilisateur, parent_id = null }) {
    try {
      console.log("Message.create - params:", {
        contenu,
        fk_canal,
        fk_utilisateur,
        parent_id,
      });

      // Vérifier que tous les paramètres nécessaires sont fournis
      if (!contenu) throw new Error("Le contenu du message est requis");
      if (!fk_canal) throw new Error("L'ID du canal est requis");
      if (!fk_utilisateur) throw new Error("L'ID de l'utilisateur est requis");

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
        throw new Error("Erreur lors de la création du message");
      }

      console.log("Message créé:", result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur dans Message.create:", error);
      throw error;
    }
  }

  // Récupérer un message par ID avec les informations de l'utilisateur et du parent
  static async getById(messageId) {
    try {
      console.log("Message.getById - messageId:", messageId);

      // Handle special case for "unread" or other non-UUID values
      if (messageId === "unread" || typeof messageId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
        console.warn(`Valeur non valide pour messageId: ${messageId}`);
        return null;
      }

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
      console.error("Erreur dans Message.getById:", error);
      throw error;
    }
  }

  // Récupérer tous les messages d'un canal avec les informations des utilisateurs
  static async findByChannel(canalId) {
    try {
      console.log("Message.findByChannel - canalId:", canalId);

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
        const messageIds = messages.map((m) => m.id_message);
        const parentIds = messages
          .filter((m) => m.parent_id)
          .map((m) => m.parent_id);

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
          parentsResult.rows.forEach((parent) => {
            parentsMap[parent.id_message] = parent;
          });

          // Ajouter les informations du parent à chaque message
          messages.forEach((message) => {
            if (message.parent_id && parentsMap[message.parent_id]) {
              message.parent_message = parentsMap[message.parent_id];
            }
          });
        }

        // Récupérer toutes les réactions en une seule requête
        const reactionsMap = await Reaction.getByMessages(messageIds);

        // Ajouter les réactions à chaque message
        messages.forEach((message) => {
          message.reactions = reactionsMap[message.id_message] || [];
        });
      }

      return messages;
    } catch (error) {
      console.error("Erreur dans Message.findByChannel:", error);
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
      console.error("Erreur dans Message.update:", error);
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
      console.error("Erreur dans Message.delete:", error);
      throw error;
    }
  }

  // Récupérer les messages d'un canal
  static async getByCanal(canalId) {
    try {
      const query = `
        SELECT 
          m.*,
          u.nom,
          u.photo_de_profil,
          COALESCE(jsonb_agg(
            jsonb_build_object(
              'id_reaction', r.id_reaction,
              'reaction_type', r.type_reaction,
              'fk_utilisateur', r.fk_utilisateur,
              'emoji', r.emoji
            )
          ) FILTER (WHERE r.id_reaction IS NOT NULL), '[]'::jsonb) AS reactions,
          pm.id_message as parent_id,
          jsonb_build_object(
            'id_message', pm.id_message,
            'contenu', pm.contenu,
            'fk_utilisateur', pm.fk_utilisateur,
            'nom', pu.nom,
            'date_creation', pm.date_creation
          ) AS parent_message
        FROM message m
        LEFT JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
        LEFT JOIN reaction r ON m.id_message = r.fk_message
        LEFT JOIN message pm ON m.parent_id = pm.id_message
        LEFT JOIN utilisateur pu ON pm.fk_utilisateur = pu.id_utilisateur
        WHERE m.fk_canal = $1
        GROUP BY m.id_message, u.nom, u.photo_de_profil, pm.id_message, pm.contenu, pm.fk_utilisateur, pu.nom, pm.date_creation
        ORDER BY m.date_creation ASC;
      `;
      const { rows } = await pool.query(query, [canalId]);
      return rows;
    } catch (error) {
      console.error('Erreur dans getByCanal:', error);
      throw error;
    }
  }

  /**
   * Récupère le nombre de messages non lus par canal pour un utilisateur donné
   * @param {string} userId - ID de l'utilisateur (UUID)
   * @returns {Promise<Object>} - Objet avec les canaux et le nombre de messages non lus
   */
  static async getUnreadCountByChannel(userId) {
    try {
      const query = `
        WITH derniere_lecture AS (
          SELECT 
            cl.fk_canal,
            cl.derniere_lecture
          FROM canal_lecture cl
          WHERE cl.fk_utilisateur = $1::uuid
        ),
        messages_par_canal AS (
          SELECT 
            m.fk_canal,
            COUNT(m.id_message) AS count
          FROM message m
          LEFT JOIN derniere_lecture dl ON m.fk_canal = dl.fk_canal
          WHERE 
            (dl.derniere_lecture IS NULL OR m.created_at > dl.derniere_lecture)
            AND m.fk_utilisateur != $1::uuid
          GROUP BY m.fk_canal
        ),
        tous_les_canaux AS (
          SELECT 
            c.id_canal,
            c.nom as canal_nom,
            w.id_workspace,
            w.nom as workspace_nom
          FROM canal c
          JOIN workspace w ON c.fk_workspace = w.id_workspace
          JOIN membre_workspace mw ON w.id_workspace = mw.fk_workspace AND mw.fk_utilisateur = $1::uuid
        )
        
        SELECT 
          tc.id_canal,
          tc.canal_nom,
          tc.id_workspace,
          tc.workspace_nom,
          COALESCE(mpc.count, 0) AS unread_count
        FROM tous_les_canaux tc
        LEFT JOIN messages_par_canal mpc ON tc.id_canal = mpc.fk_canal
        ORDER BY tc.canal_nom
      `;
      
      const { rows } = await pool.query(query, [userId]);
      
      // Calculer le total et organiser par canaux
      const result = {
        total: 0,
        channels: {}
      };
      
      for (const row of rows) {
        if (row.unread_count > 0) {
          result.total += parseInt(row.unread_count);
          result.channels[row.id_canal] = {
            count: parseInt(row.unread_count),
            name: row.canal_nom,
            workspaceId: row.id_workspace,
            workspaceName: row.workspace_nom
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Erreur dans getUnreadCountByChannel:', error);
      throw error;
    }
  }

  /**
   * Marque un canal comme lu pour un utilisateur donné
   * @param {string} userId - ID de l'utilisateur (UUID)
   * @param {string} channelId - ID du canal (UUID)
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  static async markChannelAsRead(userId, channelId) {
    const client = await pool.connect();
    try {
      // Validate both IDs are valid UUIDs
      if (!userId || typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        throw new Error(`ID utilisateur invalide: ${userId}`);
      }
      
      if (!channelId || typeof channelId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channelId)) {
        throw new Error(`ID canal invalide: ${channelId}`);
      }
      
      // Make sure we're using the correct parameter order
      console.log(`Marking channel ${channelId} as read for user ${userId}`);
      
      await client.query('BEGIN');
      
      // Vérifier si une entrée existe déjà pour cet utilisateur et ce canal
      const checkQuery = `
        SELECT id_canal_lecture FROM canal_lecture 
        WHERE fk_utilisateur = $1::uuid AND fk_canal = $2::uuid
      `;
      const checkResult = await client.query(checkQuery, [userId, channelId]);
      
      if (checkResult.rows.length > 0) {
        // Mettre à jour l'entrée existante
        const updateQuery = `
          UPDATE canal_lecture 
          SET derniere_lecture = NOW() 
          WHERE fk_utilisateur = $1::uuid AND fk_canal = $2::uuid
          RETURNING id_canal_lecture, fk_canal, fk_utilisateur, derniere_lecture
        `;
        const updateResult = await client.query(updateQuery, [userId, channelId]);
        await client.query('COMMIT');
        return updateResult.rows[0];
      } else {
        // Créer une nouvelle entrée
        const insertQuery = `
          INSERT INTO canal_lecture (fk_utilisateur, fk_canal, derniere_lecture)
          VALUES ($1::uuid, $2::uuid, NOW())
          RETURNING id_canal_lecture, fk_canal, fk_utilisateur, derniere_lecture
        `;
        const insertResult = await client.query(insertQuery, [userId, channelId]);
        await client.query('COMMIT');
        return insertResult.rows[0];
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur dans markChannelAsRead:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default Message;
