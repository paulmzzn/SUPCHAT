import pool from "../config/dbConnection.js";

class MessageFichier {
  /**
   * Lie un message à un fichier dans la table de liaison.
   * @param {string} fk_message - UUID du message.
   * @param {string} fk_fichier - UUID du fichier.
   * @returns {Promise<object>} L'objet de liaison créé.
   */
  static async link(fk_message, fk_fichier) {
    try {
      console.log("MessageFichier.link - Début avec params:", {
        fk_message,
        fk_fichier,
      });
      const query = `
        INSERT INTO message_fichier (fk_message, fk_fichier)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const values = [fk_message, fk_fichier];
      const { rows } = await pool.query(query, values);

      if (rows.length === 0) {
        console.error(
          "MessageFichier.link - Échec de l'insertion, aucune ligne retournée."
        );
        throw new Error("Erreur lors de la liaison message-fichier.");
      }

      console.log("MessageFichier.link - Liaison créée:", rows[0]);
      return rows[0];
    } catch (error) {
      console.error("Erreur DÉTAILLÉE dans MessageFichier.link:", error);
      console.error("Erreur Stack:", error.stack);
      throw error;
    }
  }
}

export default MessageFichier;
