import pool from '../config/dbConnection.js';

class Canal {
  static async create({ nom, is_private, fk_workspace }) {
    const query = `
      INSERT INTO canal (nom, is_private, fk_workspace)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [nom, is_private, fk_workspace];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findById(id_canal) {
    const query = `
      SELECT * FROM canal
      WHERE id_canal = $1;
    `;
    const values = [id_canal];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findAll() {
    const query = `
      SELECT * FROM canal;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  static async update(id_canal, { nom, is_private, fk_workspace }) {
    const query = `
      UPDATE canal
      SET nom = $1, is_private = $2, fk_workspace = $3
      WHERE id_canal = $4
      RETURNING *;
    `;
    const values = [nom, is_private, fk_workspace, id_canal];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(id_canal) {
    const query = `
      DELETE FROM canal
      WHERE id_canal = $1
      RETURNING *;
    `;
    const values = [id_canal];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

export default Canal;