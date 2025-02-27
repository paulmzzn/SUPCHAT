import pool from '../config/dbConnection.js';

class Workspace {
  static async create({ nom, is_private }) {
    const query = `
      INSERT INTO workspace (nom, is_private)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [nom, is_private];
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
      SELECT 
        w.id_workspace,
        w.nom,
        w.is_private,
        w.description,
        w.emoji,
        w.banner_url,
        w.icon_url
      FROM workspace w
      ORDER BY w.id_workspace ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  static async update(id_workspace, { nom, is_private }) {
    const query = `
      UPDATE workspace
      SET nom = $1, is_private = $2
      WHERE id_workspace = $3
      RETURNING *;
    `;
    const values = [nom, is_private, id_workspace];
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
}

export default Workspace;