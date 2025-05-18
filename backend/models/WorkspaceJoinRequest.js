import pool from '../config/dbConnection.js';

class WorkspaceJoinRequest {
  /**
   * Créer une nouvelle demande d'adhésion
   * @param {Object} requestData - Les données de la demande
   * @returns {Object} - La demande créée
   */
  static async create(requestData) {
    const { fk_workspace, fk_utilisateur, message } = requestData;
    
    try {
      const query = `
        INSERT INTO workspace_join_requests (fk_workspace, fk_utilisateur, message)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const values = [fk_workspace, fk_utilisateur, message || null];
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      // Si l'utilisateur a déjà une demande en cours pour ce workspace
      if (error.code === '23505') { 
        throw new Error('Vous avez déjà une demande en cours pour ce workspace');
      }
      throw error;
    }
  }

  /**
   * Récupérer les demandes en attente pour un workspace
   * @param {Number} workspaceId - ID du workspace
   * @returns {Array} - Liste des demandes en attente
   */
  static async getPendingByWorkspace(workspaceId) {
    const query = `
      SELECT jr.*, u.nom as nom_utilisateur, u.email, u.photo_de_profil
      FROM workspace_join_requests jr
      JOIN utilisateur u ON jr.fk_utilisateur = u.id_utilisateur
      WHERE jr.fk_workspace = $1 
      AND jr.statut = 'en_attente'
      ORDER BY jr.date_creation DESC
    `;
    const values = [workspaceId];
    const { rows } = await pool.query(query, values);
    return rows;
  }

  /**
   * Récupérer les demandes pour un utilisateur
   * @param {Number} userId - ID de l'utilisateur
   * @returns {Array} - Liste des demandes
   */
  static async getByUser(userId) {
    const query = `
      SELECT jr.*, w.nom as workspace_nom, w.banner_url, w.icon_url, 
             u.nom as admin_nom
      FROM workspace_join_requests jr
      JOIN workspace w ON jr.fk_workspace = w.id_workspace
      LEFT JOIN utilisateur u ON jr.fk_administrateur = u.id_utilisateur
      WHERE jr.fk_utilisateur = $1
      ORDER BY jr.date_creation DESC
    `;
    const values = [userId];
    const { rows } = await pool.query(query, values);
    return rows;
  }

  /**
   * Accepter une demande d'adhésion
   * @param {Number} requestId - ID de la demande
   * @param {Number} adminId - ID de l'administrateur qui traite la demande
   * @returns {Object} - La demande mise à jour
   */
  static async accept(requestId, adminId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Mettre à jour la demande
      const updateQuery = `
        UPDATE workspace_join_requests 
        SET statut = 'acceptee', date_traitement = NOW(), fk_administrateur = $1
        WHERE id_request = $2
        RETURNING *
      `;
      const updateValues = [adminId, requestId];
      const { rows: updatedRequest } = await client.query(updateQuery, updateValues);
      
      if (updatedRequest.length === 0) {
        throw new Error('Demande non trouvée');
      }

      // Récupérer les informations de la demande
      const request = updatedRequest[0];

      // Vérifier si l'utilisateur n'est pas déjà membre
      const memberCheck = await client.query(
        "SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
        [request.fk_workspace, request.fk_utilisateur]
      );

      if (memberCheck.rows.length === 0) {
        // Ajouter l'utilisateur comme membre avec le rôle membre (3)
        await client.query(
          "INSERT INTO membre_workspace (fk_utilisateur, fk_workspace, fk_role) VALUES ($1, $2, 3)",
          [request.fk_utilisateur, request.fk_workspace]
        );
      }

      await client.query('COMMIT');
      return updatedRequest[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Refuser une demande d'adhésion
   * @param {Number} requestId - ID de la demande
   * @param {Number} adminId - ID de l'administrateur qui traite la demande
   * @param {String} rejectReason - Raison du refus
   * @returns {Object} - La demande mise à jour
   */
  static async reject(requestId, adminId, rejectReason) {
    const query = `
      UPDATE workspace_join_requests 
      SET statut = 'refusee', date_traitement = NOW(), fk_administrateur = $1, reject_reason = $2
      WHERE id_request = $3
      RETURNING *
    `;
    const values = [adminId, rejectReason || null, requestId];
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      throw new Error('Demande non trouvée');
    }
    
    return rows[0];
  }

  /**
   * Vérifier si un utilisateur a une demande en attente pour un workspace
   * @param {Number} workspaceId - ID du workspace
   * @param {Number} userId - ID de l'utilisateur
   * @returns {Boolean} - True si une demande existe, false sinon
   */
  static async hasPendingRequest(workspaceId, userId) {
    const query = `
      SELECT * FROM workspace_join_requests
      WHERE fk_workspace = $1 
      AND fk_utilisateur = $2
      AND statut = 'en_attente'
    `;
    const values = [workspaceId, userId];
    const { rows } = await pool.query(query, values);
    return rows.length > 0;
  }

  /**
   * Récupérer une demande par son ID
   * @param {Number} requestId - ID de la demande
   * @returns {Object} - La demande
   */
  static async getById(requestId) {
    const query = `
      SELECT * FROM workspace_join_requests
      WHERE id_request = $1
    `;
    const values = [requestId];
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }
}

export default WorkspaceJoinRequest;