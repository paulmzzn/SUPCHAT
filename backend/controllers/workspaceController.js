import pool from '../config/dbConnection.js';
import Workspace from "../models/Workspace.js";
import UserModel from "../models/User.js";
import sendInvitation from "../config/emailService.js";

export const createWorkspace = async (req, res) => {
  try {
    const { nom, is_private } = req.body;
    const workspace = await Workspace.create({ nom, is_private });
    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWorkspaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.findAll();
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, is_private } = req.body;
    const workspace = await Workspace.update(id, { nom, is_private });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.delete(id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.status(200).json({ message: "Workspace deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendWorkspaceInvitation = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, userId } = req.body;  // Récupérer userId du body au lieu de req.user

    // Vérification des données requises
    if (!workspaceId || !email || !userId) {
      return res.status(400).json({
        message: "workspaceId, userId et email sont requis",
      });
    }

    // Récupérer les informations de l'utilisateur qui envoie l'invitation
    const sender = await UserModel.getUserById(userId);
    if (!sender) {
      return res.status(404).json({ message: "Utilisateur expéditeur non trouvé" });
    }

    // Récupérer les informations du workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace non trouvé" });
    }

    // Envoyer l'invitation
    await sendInvitation(email, workspaceId, workspace.nom, sender.nom);

    res.status(200).json({
      message: "Invitation envoyée avec succès",
      details: {
        workspace: workspace.nom,
        recipient: email,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'invitation:", error);
    res.status(500).json({
      message: "Erreur lors de l'envoi de l'invitation",
      error: error.message,
    });
  }
};

export const checkWorkspaceMember = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    console.log('Checking membership for:', { workspaceId, userId }); // Debug log

    const result = await pool.query(
      'SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2',
      [workspaceId, userId]
    );
    
    const isMember = result.rows.length > 0;
    console.log('Membership result:', { isMember, count: result.rows.length }); // Debug log
    
    res.status(200).json({ isMember });
  } catch (error) {
    console.error('Erreur checkWorkspaceMember:', error);
    res.status(500).json({ error: error.message, isMember: false });
  }
};

export const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const result = await pool.query(
      `SELECT u.id_utilisateur, u.nom, u.fk_statut as status, 
              r.nom_role as role
       FROM utilisateur u
       JOIN membre_workspace mw ON u.id_utilisateur = mw.fk_utilisateur
       JOIN role r ON mw.fk_role = r.id_role
       WHERE mw.fk_workspace = $1`,
      [workspaceId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur getWorkspaceMembers:', error);
    res.status(500).json({ error: error.message });
  }
};

export const joinWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { userId, role = 3 } = req.body; // role par défaut = 3 (member)

    // Vérifier si l'utilisateur n'est pas déjà membre
    const checkMember = await pool.query(
      'SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2',
      [workspaceId, userId]
    );

    if (checkMember.rows.length > 0) {
      return res.status(400).json({ message: 'Déjà membre de ce workspace' });
    }
    
    // Ajouter l'utilisateur comme membre avec le rôle spécifié
    await pool.query(
      'INSERT INTO membre_workspace (fk_utilisateur, fk_workspace, fk_role) VALUES ($1, $2, $3)',
      [userId, workspaceId, role]
    );
    
    res.status(200).json({ message: 'Joined workspace successfully' });
  } catch (error) {
    console.error('Erreur joinWorkspace:', error);
    res.status(500).json({ error: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { workspaceId, userId: memberToRemove } = req.params;
    const { userId: removerId } = req.body;

    // Si l'utilisateur essaie de se retirer lui-même, on autorise
    if (removerId === memberToRemove) {
      await pool.query(
        'DELETE FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2',
        [workspaceId, memberToRemove]
      );
      return res.status(200).json({ message: 'Vous avez quitté le workspace' });
    }

    // Sinon, vérifier si l'utilisateur qui fait la demande est owner
    const ownerCheck = await pool.query(
      'SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2 AND fk_role = 1',
      [workspaceId, removerId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Seul le propriétaire peut retirer des membres' });
    }

    // Vérifier que l'utilisateur à supprimer n'est pas owner
    const memberCheck = await pool.query(
      'SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2',
      [workspaceId, memberToRemove]
    );

    if (memberCheck.rows[0]?.fk_role === 1) {
      return res.status(403).json({ message: 'Impossible de retirer le propriétaire du workspace' });
    }

    // Supprimer le membre
    await pool.query(
      'DELETE FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2',
      [workspaceId, memberToRemove]
    );

    res.status(200).json({ message: 'Membre retiré avec succès' });
  } catch (error) {
    console.error('Erreur removeMember:', error);
    res.status(500).json({ error: error.message });
  }
};
