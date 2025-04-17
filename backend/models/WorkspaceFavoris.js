import pool from "../config/dbConnection.js";

class WorkspaceFavoris {
  static async add(userId, workspaceId) {
    try {
      const query = `
        INSERT INTO workspace_favoris (fk_utilisateur, fk_workspace)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const values = [userId, workspaceId];
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      if (error.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
        throw new Error('Ce workspace est déjà dans vos favoris');
      }
      throw error;
    }
  }

  static async remove(userId, workspaceId) {
    const query = `
      DELETE FROM workspace_favoris
      WHERE fk_utilisateur = $1 AND fk_workspace = $2
      RETURNING *;
    `;
    const values = [userId, workspaceId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getForUser(userId) {
    const query = `
      SELECT w.*, wf.date_ajout as date_ajout_favoris
      FROM workspace_favoris wf
      JOIN workspace w ON wf.fk_workspace = w.id_workspace
      WHERE wf.fk_utilisateur = $1
      ORDER BY wf.date_ajout DESC;
    `;
    const values = [userId];
    const { rows } = await pool.query(query, values);
    return rows;
  }

  static async check(userId, workspaceId) {
    const query = `
      SELECT * FROM workspace_favoris
      WHERE fk_utilisateur = $1 AND fk_workspace = $2;
    `;
    const values = [userId, workspaceId];
    const { rows } = await pool.query(query, values);
    return rows.length > 0;
  }
}

export default WorkspaceFavoris;
