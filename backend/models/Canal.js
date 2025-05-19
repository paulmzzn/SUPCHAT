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

  // Vérifier si un utilisateur a accès à un canal privé
  static async checkUserAccess(canalId, userId) {
    try {
      // D'abord vérifier si le canal est privé
      const canalResult = await pool.query(
        `SELECT c.is_private, c.fk_workspace 
         FROM canal c 
         WHERE c.id_canal = $1`,
        [canalId]
      );
      
      if (canalResult.rows.length === 0) {
        return { hasAccess: false, message: 'Canal non trouvé' };
      }
      
      const canal = canalResult.rows[0];
      const workspaceId = canal.fk_workspace;
      
      // Si le canal n'est pas privé, accès autorisé
      if (!canal.is_private) {
        return { hasAccess: true, accessType: 'lecture_ecriture' };
      }
      
      // Vérifier le rôle de l'utilisateur dans le workspace
      const roleResult = await pool.query(
        `SELECT fk_role 
         FROM membre_workspace 
         WHERE fk_workspace = $1 AND fk_utilisateur = $2`,
        [workspaceId, userId]
      );
      
      // Si admin (2) ou owner (1) du workspace, accès complet
      if (roleResult.rows.length > 0 && (roleResult.rows[0].fk_role === 1 || roleResult.rows[0].fk_role === 2)) {
        return { hasAccess: true, accessType: 'lecture_ecriture', isAdmin: true };
      }
      
      // Sinon, vérifier les droits d'accès spécifiques dans membre_canal
      const accessResult = await pool.query(
        `SELECT droit_acces 
         FROM membre_canal 
         WHERE fk_canal = $1 AND fk_utilisateur = $2`,
        [canalId, userId]
      );
      
      if (accessResult.rows.length > 0) {
        return { 
          hasAccess: true, 
          accessType: accessResult.rows[0].droit_acces 
        };
      }
      
      // Aucun accès trouvé
      return { hasAccess: false, message: 'Accès non autorisé à ce canal privé' };
    } catch (error) {
      console.error('Erreur dans Canal.checkUserAccess:', error);
      throw error;
    }
  }

  // Ajouter un membre à un canal avec des droits spécifiques
  static async addMember(canalId, userId, droitAcces = 'lecture') {
    try {
      // Vérifier si le canal existe
      const canalResult = await pool.query(
        `SELECT id_canal, is_private FROM canal WHERE id_canal = $1`,
        [canalId]
      );
      
      if (canalResult.rows.length === 0) {
        return { success: false, message: 'Canal non trouvé' };
      }
      
      // Vérifier si l'entrée existe déjà
      const existingResult = await pool.query(
        `SELECT id_membre_canal FROM membre_canal 
         WHERE fk_canal = $1 AND fk_utilisateur = $2`,
        [canalId, userId]
      );
      
      if (existingResult.rows.length > 0) {
        // Mettre à jour les droits existants
        const updateResult = await pool.query(
          `UPDATE membre_canal 
           SET droit_acces = $3, date_ajout = NOW() 
           WHERE fk_canal = $1 AND fk_utilisateur = $2
           RETURNING *`,
          [canalId, userId, droitAcces]
        );
        
        return { 
          success: true, 
          message: 'Droits d\'accès mis à jour', 
          membreCanal: updateResult.rows[0] 
        };
      } else {
        // Créer une nouvelle entrée
        const insertResult = await pool.query(
          `INSERT INTO membre_canal (fk_canal, fk_utilisateur, droit_acces)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [canalId, userId, droitAcces]
        );
        
        return { 
          success: true, 
          message: 'Membre ajouté au canal privé', 
          membreCanal: insertResult.rows[0] 
        };
      }
    } catch (error) {
      console.error('Erreur dans Canal.addMember:', error);
      throw error;
    }
  }

  // Supprimer un membre d'un canal privé
  static async removeMember(canalId, userId) {
    try {
      const result = await pool.query(
        `DELETE FROM membre_canal 
         WHERE fk_canal = $1 AND fk_utilisateur = $2
         RETURNING *`,
        [canalId, userId]
      );
      
      return {
        success: result.rowCount > 0,
        message: result.rowCount > 0 ? 'Membre supprimé du canal' : 'Membre non trouvé dans ce canal',
        membreCanal: result.rows[0]
      };
    } catch (error) {
      console.error('Erreur dans Canal.removeMember:', error);
      throw error;
    }
  }

  // Obtenir tous les membres d'un canal avec leurs droits d'accès
  static async getMembers(canalId) {
    try {
      const result = await pool.query(
        `SELECT mc.fk_utilisateur, mc.droit_acces, mc.date_ajout,
                u.nom, u.email, u.photo_de_profil
         FROM membre_canal mc
         JOIN utilisateur u ON mc.fk_utilisateur = u.id_utilisateur
         WHERE mc.fk_canal = $1
         ORDER BY mc.date_ajout ASC`,
        [canalId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Erreur dans Canal.getMembers:', error);
      throw error;
    }
  }

  // Trouver les canaux accessibles par un utilisateur dans un workspace
  static async findAccessibleByUser(workspaceId, userId) {
    try {
      // Requête optimisée pour retourner tous les canaux accessibles par l'utilisateur
      const query = `
        WITH user_role AS (
          SELECT fk_role 
          FROM membre_workspace 
          WHERE fk_workspace = $1 AND fk_utilisateur = $2
        )
        SELECT c.*, 
               CASE 
                 -- Admin ou owner a toujours lecture_ecriture
                 WHEN (SELECT fk_role FROM user_role) IN (1, 2) THEN 'lecture_ecriture'::canal_access_type
                 -- Sinon le droit spécifique du canal ou NULL
                 ELSE mc.droit_acces
               END as droit_acces
        FROM canal c
        LEFT JOIN membre_canal mc ON c.id_canal = mc.fk_canal AND mc.fk_utilisateur = $2
        WHERE c.fk_workspace = $1
        AND (
          -- Canaux publics toujours accessibles
          c.is_private = false
          -- OU canaux privés avec soit admin/owner ou accès spécifique
          OR (c.is_private = true AND (
              (SELECT fk_role FROM user_role) IN (1, 2)
              OR mc.fk_utilisateur IS NOT NULL
          ))
        )
        ORDER BY c.id_canal
      `;
      
      const result = await pool.query(query, [workspaceId, userId]);
      return result.rows;
    } catch (error) {
      console.error('Erreur dans Canal.findAccessibleByUser:', error);
      throw error;
    }
  }
}

export default Canal;