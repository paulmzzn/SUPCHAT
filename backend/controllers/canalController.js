import pool from "../config/dbConnection.js";
import Canal from "../models/Canal.js";
import Workspace from "../models/Workspace.js";
import Fichier from "../models/Fichier.js";

// Créer un nouveau canal
export const createCanal = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { nom, is_private } = req.body;
    const userId = req.user.id;

    // Vérifier si le workspace existe
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Vérifier le rôle de l'utilisateur (owner=1, admin=2)
    const roleRes = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );
    if (
      !roleRes.rows.length ||
      (roleRes.rows[0].fk_role !== 1 && roleRes.rows[0].fk_role !== 2)
    ) {
      return res
        .status(403)
        .json({ message: "Seuls les owners ou admins peuvent créer un canal" });
    }

    const canal = await Canal.create({
      nom,
      is_private: is_private || false,
      fk_workspace: workspaceId,
    });

    // Notifier via socket.io si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(workspaceId).emit('canal_created', canal);
    }

    res.status(201).json(canal);
  } catch (error) {
    console.error("Erreur lors de la création du canal:", error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer tous les canaux d'un workspace accessibles par l'utilisateur
export const getCanals = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    
    // Utiliser la nouvelle méthode pour récupérer uniquement les canaux accessibles
    const canals = await Canal.findAccessibleByUser(workspaceId, userId);
    res.status(200).json(canals);
  } catch (error) {
    console.error("Erreur lors de la récupération des canaux:", error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer un canal spécifique
export const getCanal = async (req, res) => {
  try {
    const { canalId } = req.params;
    const userId = req.user.id;

    // Vérifier que le canal existe
    const canal = await Canal.findById(canalId);
    if (!canal) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }
    
    // Vérifier que l'utilisateur a le droit d'accéder à ce canal
    const accessCheck = await Canal.checkUserAccess(canalId, userId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ message: "Accès refusé à ce canal privé" });
    }
    
    // Ajouter les informations d'accès à la réponse
    const responseCanal = {
      ...canal,
      droitAcces: accessCheck.accessType,
      isAdmin: accessCheck.isAdmin || false
    };

    res.status(200).json(responseCanal);
  } catch (error) {
    console.error("Erreur lors de la récupération du canal:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un canal
export const updateCanal = async (req, res) => {
  try {
    const { canalId, workspaceId } = req.params;
    const { nom, is_private } = req.body;
    const userId = req.user.id;
    
    // Vérifier que le canal existe
    const canalExistant = await Canal.findById(canalId);
    if (!canalExistant) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }
    
    // Vérifier que l'utilisateur est admin ou propriétaire du workspace
    const roleRes = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );
    
    if (!roleRes.rows.length || (roleRes.rows[0].fk_role !== 1 && roleRes.rows[0].fk_role !== 2)) {
      return res.status(403).json({ message: "Seuls les admin ou propriétaires peuvent modifier un canal" });
    }

    const canal = await Canal.update(canalId, {
      nom,
      is_private,
    });
    
    // Notifier via socket.io si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(workspaceId).emit('canal_updated', canal);
    }

    res.status(200).json(canal);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du canal:", error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un canal
export const deleteCanal = async (req, res) => {
  try {
    const { canalId, workspaceId } = req.params;
    const userId = req.user.id;

    // Vérification que le canal existe et appartient au workspace
    const canal = await Canal.findById(canalId);
    if (!canal) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }

    if (canal.fk_workspace != workspaceId) {
      return res
        .status(403)
        .json({ message: "Ce canal n'appartient pas au workspace spécifié" });
    }

    // Vérifier le rôle de l'utilisateur (owner=1, admin=2)
    const roleRes = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );
    if (
      !roleRes.rows.length ||
      (roleRes.rows[0].fk_role !== 1 && roleRes.rows[0].fk_role !== 2)
    ) {
      return res
        .status(403)
        .json({
          message: "Seuls les owners ou admins peuvent supprimer un canal",
        });
    }

    const result = await Canal.delete(canalId);

    if (!result) {
      return res
        .status(404)
        .json({ message: "Erreur lors de la suppression du canal" });
    }
    
    // Notifier via socket.io si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(workspaceId).emit('canal_deleted', { id: canalId });
    }

    res.status(200).json({ message: "Canal supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du canal:", error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer tous les fichiers d'un canal
export const getCanalFiles = async (req, res) => {
  try {
    const { canalId } = req.params;
    const userId = req.user.id;
    
    // Vérifier que l'utilisateur a accès à ce canal
    const accessCheck = await Canal.checkUserAccess(canalId, userId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ message: "Accès refusé à ce canal privé" });
    }
    
    const files = await Fichier.getByCanalId(canalId);
    res.status(200).json(files);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des fichiers du canal:",
      error
    );
    res.status(500).json({ message: error.message });
  }
};

// Récupérer tous les canaux privés d'un workspace
export const getPrivateCanals = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    
    // Vérifier que l'utilisateur est membre du workspace
    const membershipCheck = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );
    
    if (!membershipCheck.rows.length) {
      return res.status(403).json({ message: "Vous n'êtes pas membre de ce workspace" });
    }
    
    // Vérifier si l'utilisateur est admin ou propriétaire
    const isAdminOrOwner = membershipCheck.rows[0].fk_role === 1 || membershipCheck.rows[0].fk_role === 2;
    
    // Si non admin, on vérifie que l'utilisateur a accès à ces canaux
    let query;
    let params;
    
    if (isAdminOrOwner) {
      // Pour les admins/owners, on récupère tous les canaux privés
      query = `
        SELECT c.* FROM canal c 
        WHERE c.fk_workspace = $1 AND c.is_private = true
        ORDER BY c.nom ASC
      `;
      params = [workspaceId];
    } else {
      // Pour les membres standards, on récupère uniquement les canaux privés auxquels ils ont accès
      query = `
        SELECT c.* FROM canal c
        LEFT JOIN membre_canal mc ON c.id_canal = mc.fk_canal
        WHERE c.fk_workspace = $1 
        AND c.is_private = true
        AND mc.fk_utilisateur = $2
        ORDER BY c.nom ASC
      `;
      params = [workspaceId, userId];
    }
    
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des canaux privés:", error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les droits d'accès d'un membre pour tous les canaux privés
export const getMemberChannelAccess = async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;
    const userId = req.user.id;
    
    // Vérifier que l'utilisateur qui fait la requête est admin ou owner
    const currentUserRole = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );
    
    if (!currentUserRole.rows.length || (currentUserRole.rows[0].fk_role !== 1 && currentUserRole.rows[0].fk_role !== 2)) {
      return res.status(403).json({ message: "Seuls les admins ou propriétaires peuvent consulter les droits d'accès" });
    }
    
    // Vérifier que le membre ciblé fait partie du workspace
    const memberCheck = await pool.query(
      "SELECT 1 FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, memberId]
    );
    
    if (!memberCheck.rows.length) {
      return res.status(404).json({ message: "Utilisateur non trouvé dans ce workspace" });
    }
    
    // Récupérer tous les accès aux canaux privés pour ce membre
    const query = `
      SELECT mc.fk_canal as "canalId", mc.droit_acces as "accessType" 
      FROM membre_canal mc
      JOIN canal c ON mc.fk_canal = c.id_canal
      WHERE c.fk_workspace = $1 
      AND mc.fk_utilisateur = $2
      AND c.is_private = true
    `;
    
    const result = await pool.query(query, [workspaceId, memberId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des droits d'accès:", error);
    res.status(500).json({ message: error.message });
  }
};

// Modifier les droits d'accès d'un membre pour un canal spécifique
export const updateMemberChannelAccess = async (req, res) => {
  try {
    const { canalId, memberId } = req.params;
    const { accessType } = req.body;
    const userId = req.user.id;
    
    // Vérifier que le canal existe
    const canalCheck = await pool.query(
      "SELECT fk_workspace, is_private FROM canal WHERE id_canal = $1",
      [canalId]
    );
    
    if (!canalCheck.rows.length) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }
    
    const canal = canalCheck.rows[0];
    
    // Vérifier que le canal est privé
    if (!canal.is_private) {
      return res.status(400).json({ message: "Ce canal n'est pas privé, pas besoin de gérer les droits d'accès" });
    }
    
    // Vérifier que l'utilisateur qui fait la requête est admin ou owner du workspace
    const currentUserRole = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [canal.fk_workspace, userId]
    );
    
    if (!currentUserRole.rows.length || (currentUserRole.rows[0].fk_role !== 1 && currentUserRole.rows[0].fk_role !== 2)) {
      return res.status(403).json({ message: "Seuls les admins ou propriétaires peuvent modifier les droits d'accès" });
    }
    
    // Vérifier que le membre ciblé fait partie du workspace
    const memberCheck = await pool.query(
      "SELECT 1 FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [canal.fk_workspace, memberId]
    );
    
    if (!memberCheck.rows.length) {
      return res.status(404).json({ message: "Utilisateur non trouvé dans ce workspace" });
    }
    
    let result;
    // Variable pour stocker le type d'accès final à renvoyer au client
    let finalAccessType = accessType;
    
    // Si accessType est "remove", supprimer l'entrée
    if (accessType === "remove") {
      result = await pool.query(
        "DELETE FROM membre_canal WHERE fk_canal = $1 AND fk_utilisateur = $2 RETURNING *",
        [canalId, memberId]
      );
      
      // Mettre à jour le type d'accès renvoyé dans la réponse
      finalAccessType = null;
    } else {
      // Valider le type d'accès
      if (accessType !== 'lecture' && accessType !== 'lecture_ecriture') {
        return res.status(400).json({ message: "Type d'accès invalide. Valeurs acceptées : lecture, lecture_ecriture" });
      }
      
      // Vérifier si le membre a déjà un accès à ce canal
      const existingAccess = await pool.query(
        "SELECT 1 FROM membre_canal WHERE fk_canal = $1 AND fk_utilisateur = $2",
        [canalId, memberId]
      );
      
      if (existingAccess.rows.length) {
        // Mettre à jour l'accès existant
        result = await pool.query(
          "UPDATE membre_canal SET droit_acces = $1 WHERE fk_canal = $2 AND fk_utilisateur = $3 RETURNING *",
          [accessType, canalId, memberId]
        );
      } else {
        // Créer un nouvel accès
        result = await pool.query(
          "INSERT INTO membre_canal (fk_canal, fk_utilisateur, droit_acces) VALUES ($1, $2, $3) RETURNING *",
          [canalId, memberId, accessType]
        );
      }
    }
    
    // Notifier via socket.io si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(canal.fk_workspace).emit('channel_access_updated', { 
        canalId, 
        userId: memberId, 
        accessType: finalAccessType 
      });
    }
    
    res.status(200).json({
      canalId,
      memberId,
      accessType: finalAccessType,
      message: finalAccessType ? "Droits d'accès mis à jour avec succès" : "Accès retiré avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la modification des droits d'accès:", error);
    res.status(500).json({ message: error.message });
  }
};
