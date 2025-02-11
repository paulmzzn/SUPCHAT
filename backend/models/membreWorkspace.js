import pool from "../config/dbConnection.js";

class MembreWorkspace {
  static async getMembresByWorkspace(workspaceId) {
    const query = `
      SELECT 
        u.id_utilisateur,
        u.nom,
        u.email,
        r.nom_role
      FROM membre_workspace mw
      JOIN utilisateur u ON mw.fk_utilisateur = u.id_utilisateur
      JOIN role r ON mw.fk_role = r.id_role
      WHERE mw.fk_workspace = $1;
    `;
    const { rows } = await pool.query(query, [workspaceId]);
    return rows;
  }

  // Ajout d'un membre au workspace
  static async addMembreWorkspace(fk_utilisateur, fk_workspace, fk_role) {
    const query = `
      INSERT INTO membre_workspace (fk_utilisateur, fk_workspace, fk_role)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      fk_utilisateur,
      fk_workspace,
      fk_role,
    ]);
    return rows[0];
  }

  // Suppression d'un membre du workspace
  static async deleteMembreWorkspace(fk_utilisateur, fk_workspace) {
    const query = `
      DELETE FROM membre_workspace
      WHERE fk_utilisateur = $1 AND fk_workspace = $2;
    `;
    await pool.query(query, [fk_utilisateur, fk_workspace]);
  }

  // Mise à jour du rôle d'un membre dans le workspace
  static async updateMembreWorkspace(
    fk_utilisateur,
    fk_workspace,
    nouveau_role
  ) {
    const query = `
      UPDATE membre_workspace
      SET fk_role = $3
      WHERE fk_utilisateur = $1 AND fk_workspace = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      fk_utilisateur,
      fk_workspace,
      nouveau_role,
    ]);
    return rows[0];
  }
}

export default MembreWorkspace;
