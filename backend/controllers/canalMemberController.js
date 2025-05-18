import pool from '../config/dbConnection.js';
import Canal from '../models/Canal.js';

// Récupérer tous les membres d'un canal privé avec leurs droits d'accès
export const getCanalMembers = async (req, res) => {
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
      return res.status(403).json({ message: "Accès refusé à ce canal" });
    }

    // Récupérer les membres du canal
    const members = await Canal.getMembers(canalId);
    res.status(200).json(members);
  } catch (error) {
    console.error("Erreur lors de la récupération des membres du canal:", error);
    res.status(500).json({ message: error.message });
  }
};

// Ajouter un membre à un canal privé avec des droits spécifiques
export const addCanalMember = async (req, res) => {
  try {
    const { canalId } = req.params;
    const { userId, droitAcces } = req.body;
    const requesterId = req.user.id;
    
    // Vérifier que le canal existe
    const canal = await Canal.findById(canalId);
    if (!canal) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }
    
    // Vérifier que l'utilisateur qui fait la demande est admin ou owner du workspace
    const workspaceId = canal.fk_workspace;
    const roleRes = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, requesterId]
    );
    
    if (!roleRes.rows.length || (roleRes.rows[0].fk_role !== 1 && roleRes.rows[0].fk_role !== 2)) {
      return res.status(403).json({ message: "Seuls les admin ou propriétaires peuvent ajouter des membres" });
    }
    
    // Vérifier que l'utilisateur à ajouter est bien membre du workspace
    const memberCheck = await pool.query(
      "SELECT fk_utilisateur FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(400).json({ message: "L'utilisateur n'est pas membre de ce workspace" });
    }
    
    // Ajouter l'utilisateur au canal avec les droits spécifiés
    const result = await Canal.addMember(canalId, userId, droitAcces || 'lecture');
    
    // Notifier via socket.io si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(`canal:${canalId}`)
        .to(`user:${userId}`)
        .emit('canal_member_added', { 
          canalId, 
          userId,
          droitAcces: result.membreCanal.droit_acces 
        });
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un membre au canal:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour les droits d'accès d'un membre
export const updateCanalMember = async (req, res) => {
  try {
    const { canalId, memberId } = req.params;
    const { droitAcces } = req.body;
    const requesterId = req.user.id;
    
    // Vérifier que le canal existe
    const canal = await Canal.findById(canalId);
    if (!canal) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }
    
    // Vérifier que l'utilisateur qui fait la demande est admin ou owner
    const workspaceId = canal.fk_workspace;
    const roleRes = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, requesterId]
    );
    
    if (!roleRes.rows.length || (roleRes.rows[0].fk_role !== 1 && roleRes.rows[0].fk_role !== 2)) {
      return res.status(403).json({ message: "Seuls les admin ou propriétaires peuvent modifier les droits" });
    }
    
    // Mettre à jour les droits (en utilisant la même méthode que pour l'ajout, qui gère l'update)
    const result = await Canal.addMember(canalId, memberId, droitAcces);
    
    // Notifier via socket.io si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(`canal:${canalId}`)
        .to(`user:${memberId}`)
        .emit('canal_member_updated', { 
          canalId, 
          userId: memberId,
          droitAcces: result.membreCanal.droit_acces 
        });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des droits d'un membre:", error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un membre d'un canal privé
export const removeCanalMember = async (req, res) => {
  try {
    const { canalId, memberId } = req.params;
    const requesterId = req.user.id;
    
    // Vérifier que le canal existe
    const canal = await Canal.findById(canalId);
    if (!canal) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }
    
    // Vérifier que l'utilisateur qui fait la demande est admin ou owner
    const workspaceId = canal.fk_workspace;
    const roleRes = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, requesterId]
    );
    
    if (!roleRes.rows.length || (roleRes.rows[0].fk_role !== 1 && roleRes.rows[0].fk_role !== 2)) {
      return res.status(403).json({ message: "Seuls les admin ou propriétaires peuvent supprimer des membres" });
    }
    
    // Supprimer l'utilisateur du canal
    const result = await Canal.removeMember(canalId, memberId);
    
    // Notifier via socket.io si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(`canal:${canalId}`)
        .to(`user:${memberId}`)
        .emit('canal_member_removed', { canalId, userId: memberId });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur lors de la suppression d'un membre du canal:", error);
    res.status(500).json({ message: error.message });
  }
};