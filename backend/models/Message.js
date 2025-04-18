import pool from "../config/dbConnection.js";
import Reaction from "./Reaction.js";

class Message {
  // Créer un message (sans infos de fichier directes)
  static async create({ contenu, fk_canal, fk_utilisateur, parent_id = null }) {
    try {
      // Logique modifiée : ne gère plus file_url, file_type
      console.log("Message.create - Début avec params:", {
        contenu,
        fk_canal,
        fk_utilisateur,
        parent_id,
      });

      // Le contenu peut être null si c'est juste un fichier (géré dans le contrôleur)
      if (!fk_canal) throw new Error("L'ID du canal est requis");
      if (!fk_utilisateur) throw new Error("L'ID de l'utilisateur est requis");

      const columns = ["fk_canal", "fk_utilisateur", "created_at"];
      const values = [fk_canal, fk_utilisateur, "NOW()"];
      const placeholders = ["$1", "$2", "$3"];
      let placeholderIndex = 3;

      // Ajouter contenu et parent_id s'ils sont fournis
      if (contenu) {
        columns.push("contenu");
        values.push(contenu);
        placeholders.push(`$${++placeholderIndex}`);
      }
      if (parent_id) {
        columns.push("parent_id");
        values.push(parent_id);
        placeholders.push(`$${++placeholderIndex}`);
      }

      const query = `INSERT INTO message (${columns.join(", ")})
                     VALUES (${placeholders.join(", ")})
                     RETURNING id_message`; // Retourner seulement l'ID ici

      console.log("Message.create - Exécution requête:", query);
      console.log("Message.create - Avec valeurs:", values);

      const result = await pool.query(query, values);

      if (result.rows.length === 0 || !result.rows[0].id_message) {
        console.error(
          "Message.create - Échec de l'insertion, aucun ID retourné."
        );
        throw new Error(
          "Erreur lors de la création du message, insertion échouée."
        );
      }

      const newMessageId = result.rows[0].id_message;
      console.log("Message.create - Message inséré avec ID:", newMessageId);

      // IMPORTANT: Ne pas appeler getById ici, car la liaison fichier n'est pas encore faite.
      // Le contrôleur appellera getById *après* la liaison.
      // Retourner juste l'ID ou un objet minimal.
      return { id_message: newMessageId };
    } catch (error) {
      console.error("Erreur DÉTAILLÉE dans Message.create:", error);
      console.error("Erreur Stack:", error.stack);
      throw error;
    }
  }

  // Récupérer un message par ID avec les informations de l'utilisateur, du parent ET du fichier associé
  static async getById(messageId) {
    try {
      console.log("Message.getById - Récupération pour ID:", messageId);

      // Jointure avec utilisateur, message_fichier et fichier
      const result = await pool.query(
        `SELECT
           m.id_message, m.contenu, m.fk_canal, m.fk_utilisateur, m.created_at, m.updated_at, m.parent_id,
           u.nom, u.photo_de_profil,
           f.id_fichier, f.nom_fichier, f.url AS file_url, f.type AS file_type, f.date_upload AS file_date_upload
         FROM message m
         JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
         LEFT JOIN message_fichier mf ON m.id_message = mf.fk_message
         LEFT JOIN fichier f ON mf.fk_fichier = f.id_fichier
         WHERE m.id_message = $1`,
        [messageId]
      );

      if (result.rows.length === 0) {
        console.warn(
          `Message.getById - Aucun message trouvé avec l'ID: ${messageId}`
        );
        return null;
      }

      const message = result.rows[0];
      console.log(
        "Message.getById - Message brut trouvé (avec fichier potentiel):",
        message
      );

      // Si un fichier est trouvé, s'assurer que les champs sont bien nommés
      if (message.id_fichier) {
        // Les alias dans la requête (file_url, file_type) devraient déjà être corrects
        console.log(
          `Message.getById - Fichier associé trouvé: ${message.nom_fichier}`
        );
      } else {
        // Mettre les champs fichier à null si aucun fichier n'est associé
        message.file_url = null;
        message.file_type = null;
        message.nom_fichier = null;
        message.id_fichier = null;
        message.file_date_upload = null;
      }

      // Si le message a un parent, récupérer ses informations
      if (message.parent_id) {
        console.log(
          `Message.getById - Récupération du parent pour ${messageId}, parent_id: ${message.parent_id}`
        );
        const parentResult = await pool.query(
          `SELECT m.id_message, m.contenu, u.nom 
           FROM message m
           JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
           WHERE m.id_message = $1`,
          [message.parent_id]
        );

        if (parentResult.rows.length > 0) {
          message.parent_message = parentResult.rows[0];
          console.log(
            `Message.getById - Message parent trouvé pour ${messageId}:`,
            message.parent_message
          );
        } else {
          console.warn(
            `Message.getById - Message parent ${message.parent_id} non trouvé pour ${messageId}`
          );
        }
      }

      // Récupérer les réactions du message
      console.log(
        `Message.getById - Récupération des réactions pour ${messageId}`
      );
      message.reactions = await Reaction.getByMessage(messageId);
      console.log(
        `Message.getById - Réactions trouvées pour ${messageId}:`,
        message.reactions
      );

      console.log(
        "Message.getById - Message final retourné (avec fichier potentiel):",
        message
      );
      return message;
    } catch (error) {
      console.error(
        `Erreur DÉTAILLÉE dans Message.getById pour ID ${messageId}:`,
        error
      );
      console.error("Erreur Stack:", error.stack);
      throw error;
    }
  }

  // Récupérer tous les messages d'un canal avec les informations des utilisateurs ET des fichiers associés
  static async findByChannel(canalId) {
    try {
      console.log("Message.findByChannel - canalId:", canalId);

      // Jointure avec utilisateur, message_fichier et fichier
      const result = await pool.query(
        `SELECT
           m.id_message, m.contenu, m.fk_canal, m.fk_utilisateur, m.created_at, m.updated_at, m.parent_id,
           u.nom, u.photo_de_profil,
           f.id_fichier, f.nom_fichier, f.url AS file_url, f.type AS file_type, f.date_upload AS file_date_upload
         FROM message m
         JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
         LEFT JOIN message_fichier mf ON m.id_message = mf.fk_message
         LEFT JOIN fichier f ON mf.fk_fichier = f.id_fichier
         WHERE m.fk_canal = $1
         ORDER BY m.created_at ASC`,
        [canalId]
      );

      const messages = result.rows;
      console.log(
        `Message.findByChannel - ${messages.length} messages bruts trouvés pour canal ${canalId}`
      );

      // Traiter chaque message pour s'assurer que les champs fichier sont null si aucun fichier n'est associé
      messages.forEach((message) => {
        if (!message.id_fichier) {
          message.file_url = null;
          message.file_type = null;
          message.nom_fichier = null;
          message.id_fichier = null;
          message.file_date_upload = null;
        }
      });

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

      console.log(
        `Message.findByChannel - Messages finaux retournés pour canal ${canalId}:`,
        messages
      );
      return messages;
    } catch (error) {
      console.error(
        `Erreur DÉTAILLÉE dans Message.findByChannel pour canal ${canalId}:`,
        error
      );
      console.error("Erreur Stack:", error.stack);
      // Retourner un tableau vide en cas d'erreur pour éviter de planter l'application
      // Ou remonter l'erreur si le contrôleur peut la gérer
      throw error;
    }
  }

  // Mettre à jour un message (ne concerne pas les fichiers ici)
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

  // Supprimer un message (devrait aussi gérer la suppression du lien dans message_fichier, voire du fichier lui-même si nécessaire)
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
}

export default Message;
