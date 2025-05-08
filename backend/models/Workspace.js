import pool from "../config/dbConnection.js";

class Workspace {
  static async create({ nom, description, is_private, banner_url, icon_url }) {
    const query = `
      INSERT INTO workspace (nom, description, is_private, banner_url, icon_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *; 
    `;
    const values = [nom, description, is_private, banner_url, icon_url];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(id_workspace) {
    const query = `
      SELECT * FROM workspace
      WHERE id_workspace = $1;
    `;
    const values = [id_workspace];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findAll() {
    const query = `
      SELECT w.*, 
        (SELECT COUNT(*) FROM membre_workspace mw WHERE mw.fk_workspace = w.id_workspace) as total_members,
        0 as online_users
      FROM workspace w 
      ORDER BY w.id_workspace DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  static async update(id_workspace, fields) {
    // Build the SET clause dynamically based on the fields provided
    const keys = Object.keys(fields).filter(key => fields[key] !== undefined);
    if (keys.length === 0) return null;
    
    const setClause = keys
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    
    const values = keys.map(key => fields[key]);
    values.push(id_workspace);
    
    const query = `
      UPDATE workspace
      SET ${setClause}
      WHERE id_workspace = $${values.length}
      RETURNING *;
    `;
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(id_workspace) {
    const query = `
      DELETE FROM workspace
      WHERE id_workspace = $1
      RETURNING *;
    `;
    const values = [id_workspace];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async deleteWorkspaceWithCascade(id_workspace) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Supprimer les favoris liés à ce workspace
      await client.query('DELETE FROM workspace_favoris WHERE fk_workspace = $1', [id_workspace]);

      // Supprimer les invitations liées à ce workspace
      await client.query('DELETE FROM workspace_invitations WHERE fk_workspace = $1', [id_workspace]);

      // Supprimer les membres du workspace
      await client.query('DELETE FROM membre_workspace WHERE fk_workspace = $1', [id_workspace]);

      // Récupérer les canaux du workspace
      const { rows: canaux } = await client.query('SELECT id_canal FROM canal WHERE fk_workspace = $1', [id_workspace]);
      for (const canal of canaux) {
        // Supprimer les messages du canal
        await client.query('DELETE FROM message WHERE fk_canal = $1', [canal.id_canal]);
        // Supprimer le canal
        await client.query('DELETE FROM canal WHERE id_canal = $1', [canal.id_canal]);
      }

      // Supprimer les fichiers liés à ce workspace (optionnel, selon votre logique)
      // await client.query('DELETE FROM fichier WHERE fk_workspace = $1', [id_workspace]);

      // Supprimer le workspace
      const { rows } = await client.query('DELETE FROM workspace WHERE id_workspace = $1 RETURNING *', [id_workspace]);

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default Workspace;
