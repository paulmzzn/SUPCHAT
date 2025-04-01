import pool from '../config/dbConnection.js';

class Canal {
  // Créer un canal
  static async create({ nom, is_private, fk_workspace }) {
    try {
      const query = `INSERT INTO canal (nom, is_private, fk_workspace)
                     VALUES ($1, $2, $3)
                     RETURNING *`;
      const params = [nom, is_private, fk_workspace];
      
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans Canal.create:', error);
      throw error;
    }
  }
  
  // Trouver tous les canaux d'un workspace
  static async findByWorkspace(workspaceId) {
    try {
      const result = await pool.query(
        `SELECT * FROM canal 
         WHERE fk_workspace = $1
         ORDER BY id_canal`,
        [workspaceId]
      );
      return result.rows;
    } catch (error) {
      console.error('Erreur dans Canal.findByWorkspace:', error);
      throw error;
    }
  }
  
  // Trouver un canal par ID
  static async findById(canalId) {
    try {
      const result = await pool.query(
        `SELECT * FROM canal WHERE id_canal = $1`,
        [canalId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans Canal.findById:', error);
      throw error;
    }
  }
  
  // Mettre à jour un canal
  static async update(canalId, { nom, is_private }) {
    try {
      const result = await pool.query(
        `UPDATE canal 
         SET nom = COALESCE($1, nom),
             is_private = COALESCE($2, is_private),
             updated_at = NOW()
         WHERE id_canal = $3
         RETURNING *`,
        [nom, is_private, canalId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans Canal.update:', error);
      throw error;
    }
  }
  
  // Supprimer un canal
  static async delete(canalId) {
    try {
      // D'abord, vérifier si le canal existe
      const checkResult = await pool.query(
        `SELECT id_canal FROM canal WHERE id_canal = $1`,
        [canalId]
      );
      
      if (checkResult.rows.length === 0) {
        return null;
      }
      
      // Supprimer d'abord les messages associés (si cette table existe)
      try {
        await pool.query(
          `DELETE FROM message WHERE fk_canal = $1`,
          [canalId]
        );
      } catch (err) {
        console.warn("Table message non existante ou aucun message à supprimer:", err.message);
        // Continuer même si cette étape échoue
      }
      
      // Supprimer d'abord les membres du canal (si cette table existe)
      try {
        await pool.query(
          `DELETE FROM membre_canal WHERE fk_canal = $1`,
          [canalId]
        );
      } catch (err) {
        console.warn("Table membre_canal non existante ou aucun membre à supprimer:", err.message);
        // Continuer même si cette étape échoue
      }
      
      // Enfin, supprimer le canal lui-même
      const result = await pool.query(
        `DELETE FROM canal WHERE id_canal = $1 RETURNING *`,
        [canalId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Erreur dans Canal.delete:', error);
      throw error;
    }
  }
}

export default Canal;