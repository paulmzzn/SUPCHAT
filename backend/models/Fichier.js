import pool from "../config/dbConnection.js";

class Fichier {
  /**
   * Crée une nouvelle entrée dans la table fichier.
   * @param {object} fileData - Données du fichier.
   * @param {string} fileData.nom_fichier - Nom original du fichier.
   * @param {string} fileData.url - URL S3 du fichier.
   * @param {string} fileData.type - Mime type du fichier.
   * @returns {Promise<object>} L'objet fichier créé.
   */
  static async create({ nom_fichier, url, type }) {
    try {
      console.log("Fichier.create - Début avec params:", {
        nom_fichier,
        url,
        type,
      });
      const query = `
        INSERT INTO fichier (nom_fichier, url, type, date_upload)
        VALUES ($1, $2, $3, NOW())
        RETURNING *;
      `;
      const values = [nom_fichier, url, type];
      const { rows } = await pool.query(query, values);

      if (rows.length === 0) {
        console.error(
          "Fichier.create - Échec de l'insertion, aucune ligne retournée."
        );
        throw new Error("Erreur lors de la création de l'entrée fichier.");
      }

      console.log("Fichier.create - Fichier inséré:", rows[0]);
      return rows[0];
    } catch (error) {
      console.error("Erreur DÉTAILLÉE dans Fichier.create:", error);
      console.error("Erreur Stack:", error.stack);
      throw error;
    }
  }

  /**
   * Récupère un fichier par son ID.
   * @param {string} id_fichier - UUID du fichier.
   * @returns {Promise<object|null>} L'objet fichier ou null si non trouvé.
   */
  static async findById(id_fichier) {
    try {
      const query = "SELECT * FROM fichier WHERE id_fichier = $1";
      const { rows } = await pool.query(query, [id_fichier]);
      return rows[0] || null;
    } catch (error) {
      console.error(
        `Erreur dans Fichier.findById pour ID ${id_fichier}:`,
        error
      );
      throw error;
    }
  }
}

export default Fichier;
