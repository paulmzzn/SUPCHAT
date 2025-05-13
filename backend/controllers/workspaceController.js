import pool from "../config/dbConnection.js";
import Workspace from "../models/Workspace.js";
import UserModel from "../models/User.js";
import sendInvitation from "../config/emailService.js";
import { uploadToS3, deleteFromS3 } from "../config/s3Config.js";
import fs from "fs/promises";
import path from "path";

export const createWorkspace = async (req, res) => {
  try {
    const { nom, description, is_private } = req.body;
    const userId = req.user.id; // Récupérer l'ID de l'utilisateur à partir du token JWT

    // Create workspace with basic data
    const workspace = await Workspace.create({
      nom,
      description: description || "",
      is_private: is_private || false,
      banner_url: null,
      icon_url: null,
    });

    // Ajouter automatiquement l'utilisateur comme propriétaire (rôle 1 = owner)
    await pool.query(
      "INSERT INTO membre_workspace (fk_utilisateur, fk_workspace, fk_role) VALUES ($1, $2, $3)",
      [userId, workspace.id_workspace, 1] // 1 = rôle Owner/Propriétaire
    );

    res.status(201).json(workspace);
  } catch (error) {
    console.error("Error creating workspace:", error);
    res.status(500).json({ error: error.message });
  }
};

// New function to handle S3 image uploads
export const uploadWorkspaceImages = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const updateFields = {};

    // Get existing workspace to check if we need to delete old images
    const existingWorkspace = await Workspace.findById(workspaceId);
    if (!existingWorkspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Upload banner to S3 if provided
    if (req.files && req.files.banner && req.files.banner[0]) {
      // Delete old banner if it exists
      if (existingWorkspace.banner_url) {
        try {
          await deleteFromS3(existingWorkspace.banner_url);
        } catch (err) {
          console.warn("Could not delete old banner:", err);
        }
      }

      // Upload new banner to S3
      const bannerUrl = await uploadToS3(
        req.files.banner[0],
        "workspaces/banners"
      );
      updateFields.banner_url = bannerUrl;
    }

    // Upload icon to S3 if provided
    if (req.files && req.files.icon && req.files.icon[0]) {
      // Delete old icon if it exists
      if (existingWorkspace.icon_url) {
        try {
          await deleteFromS3(existingWorkspace.icon_url);
        } catch (err) {
          console.warn("Could not delete old icon:", err);
        }
      }

      // Upload new icon to S3
      const iconUrl = await uploadToS3(req.files.icon[0], "workspaces/icons");
      updateFields.icon_url = iconUrl;
    }

    // Only update if we have files
    if (Object.keys(updateFields).length > 0) {
      const workspace = await Workspace.update(workspaceId, updateFields);
      res.status(200).json(workspace);
    } else {
      res.status(400).json({ message: "No files were uploaded" });
    }
  } catch (error) {
    console.error("Error uploading workspace images:", error);
    res.status(500).json({
      message: "Error uploading workspace images",
      error: error.message,
    });
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
    const { nom, description, is_private } = req.body;
    const workspace = await Workspace.update(id, {
      nom,
      description,
      is_private,
    });
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

export const deleteWorkspaceCascade = async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.deleteWorkspaceWithCascade(id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res
      .status(200)
      .json({ message: "Workspace deleted with cascade successfully" });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression en cascade du workspace:",
      error
    );
    res.status(500).json({ error: error.message });
  }
};

export const sendWorkspaceInvitation = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, userId } = req.body; // Récupérer userId du body au lieu de req.user

    // Vérification des données requises
    if (!workspaceId || !email || !userId) {
      return res.status(400).json({
        message: "workspaceId, userId et email sont requis",
      });
    }

    // Récupérer les informations de l'utilisateur qui envoie l'invitation
    const sender = await UserModel.getUserById(userId);
    if (!sender) {
      return res
        .status(404)
        .json({ message: "Utilisateur expéditeur non trouvé" });
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
    console.log("Checking membership for:", { workspaceId, userId }); // Debug log

    const result = await pool.query(
      "SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );

    const isMember = result.rows.length > 0;
    console.log("Membership result:", { isMember, count: result.rows.length }); // Debug log

    res.status(200).json({ isMember });
  } catch (error) {
    console.error("Erreur checkWorkspaceMember:", error);
    res.status(500).json({ error: error.message, isMember: false });
  }
};

export const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const result = await pool.query(
      `SELECT u.id_utilisateur, u.nom, u.fk_statut as status, u.photo_de_profil,
              r.nom_role as role
       FROM utilisateur u
       JOIN membre_workspace mw ON u.id_utilisateur = mw.fk_utilisateur
       JOIN role r ON mw.fk_role = r.id_role
       WHERE mw.fk_workspace = $1`,
      [workspaceId]
    );

    // Formater les URLs des photos de profil
    const members = result.rows.map((member) => {
      if (member.photo_de_profil) {
        // Si la photo commence par http, on la garde telle quelle
        if (member.photo_de_profil.startsWith("http")) {
          member.photo_url = member.photo_de_profil;
        }
        // Si c'est une URL locale (ancien système), la retourner telle quelle
        else if (member.photo_de_profil.startsWith("/uploads/")) {
          member.photo_url = member.photo_de_profil;
        }
        // Si c'est une clé S3, construire l'URL complète
        else {
          const s3Endpoint =
            process.env.SCW_ENDPOINT || "https://s3.fr-par.scw.cloud/";
          const bucketName = process.env.S3_BUCKET_NAME || "REDACTED";
          // S'assurer que l'URL est correctement formatée
          member.photo_url =
            `${s3Endpoint}${bucketName}/${member.photo_de_profil}`.replace(
              /([^:])\/\/+/g,
              "$1/"
            );
        }
      }
      return member;
    });

    res.status(200).json(members);
  } catch (error) {
    console.error("Erreur getWorkspaceMembers:", error);
    res.status(500).json({ error: error.message });
  }
};

export const joinWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id; // Récupérer l'ID utilisateur du token JWT
    const { role = 3 } = req.body; // role par défaut = 3 (member)

    // Vérifier si l'utilisateur n'est pas déjà membre
    const checkMember = await pool.query(
      "SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );

    if (checkMember.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Vous êtes déjà membre de ce workspace" });
    }

    // Vérifier si le workspace existe
    const workspaceExists = await pool.query(
      "SELECT * FROM workspace WHERE id_workspace = $1",
      [workspaceId]
    );

    if (workspaceExists.rows.length === 0) {
      return res.status(404).json({ message: "Workspace non trouvé" });
    }

    // Si le workspace est privé, vérifier si l'utilisateur a une invitation
    if (workspaceExists.rows[0].is_private) {
      // Implémenter la vérification des invitations si nécessaire
      // Pour l'instant, refuser l'accès aux workspaces privés sans invitation
      return res.status(403).json({
        message: "Ce workspace est privé. Une invitation est requise.",
      });
    }

    // Ajouter l'utilisateur comme membre avec le rôle spécifié
    await pool.query(
      "INSERT INTO membre_workspace (fk_utilisateur, fk_workspace, fk_role) VALUES ($1, $2, $3)",
      [userId, workspaceId, role]
    );

    res.status(200).json({
      message: "Vous avez rejoint le workspace avec succès",
      workspace_id: workspaceId,
    });
  } catch (error) {
    console.error("Erreur joinWorkspace:", error);
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
        "DELETE FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
        [workspaceId, memberToRemove]
      );
      return res.status(200).json({ message: "Vous avez quitté le workspace" });
    }

    // Sinon, vérifier si l'utilisateur qui fait la demande est owner
    const ownerCheck = await pool.query(
      "SELECT * FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2 AND fk_role = 1",
      [workspaceId, removerId]
    );

    if (ownerCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Seul le propriétaire peut retirer des membres" });
    }

    // Vérifier que l'utilisateur à supprimer n'est pas owner
    const memberCheck = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, memberToRemove]
    );

    if (memberCheck.rows[0]?.fk_role === 1) {
      return res.status(403).json({
        message: "Impossible de retirer le propriétaire du workspace",
      });
    }

    // Supprimer le membre
    await pool.query(
      "DELETE FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, memberToRemove]
    );

    res.status(200).json({ message: "Membre retiré avec succès" });
  } catch (error) {
    console.error("Erreur removeMember:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id; // Récupère l'ID de l'utilisateur depuis le token décodé

    // Requête pour obtenir tous les workspaces auxquels l'utilisateur appartient
    const result = await pool.query(
      `SELECT w.*, 
        (SELECT COUNT(*) FROM membre_workspace mw2 WHERE mw2.fk_workspace = w.id_workspace) as total_members,
        r.nom_role as user_role
       FROM workspace w
       JOIN membre_workspace mw ON w.id_workspace = mw.fk_workspace
       JOIN role r ON mw.fk_role = r.id_role
       WHERE mw.fk_utilisateur = $1
       ORDER BY w.id_workspace DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des workspaces de l'utilisateur:",
      error
    );
    res.status(500).json({ error: error.message });
  }
};

// Changer le rôle d'un membre (owner only)
export const changeMemberRole = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const { newRole } = req.body; // 'admin' ou 'member'
    const requesterId = req.user.id;

    // Vérifier que le demandeur est owner OU admin (admin ne peut promouvoir que des membres)
    const roleCheck = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, requesterId]
    );
    if (!roleCheck.rows.length) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    const requesterRole = roleCheck.rows[0].fk_role;
    // Owner (1) : tout permis. Admin (2) : peut seulement promouvoir un membre en admin
    if (requesterRole !== 1 && !(requesterRole === 2 && newRole === "admin")) {
      return res.status(403).json({
        message:
          "Seul le propriétaire peut changer le rôle d'un membre, sauf promotion admin par un admin.",
      });
    }

    // On ne peut pas changer le rôle du owner
    const memberCheck = await pool.query(
      "SELECT fk_role FROM membre_workspace WHERE fk_workspace = $1 AND fk_utilisateur = $2",
      [workspaceId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Membre non trouvé dans ce workspace" });
    }
    if (memberCheck.rows[0].fk_role === 1) {
      return res
        .status(403)
        .json({ message: "Impossible de modifier le rôle du propriétaire" });
    }

    // Déterminer la valeur numérique du rôle
    let roleValue = 3; // member par défaut
    if (newRole === "admin") roleValue = 2;
    if (newRole === "member") roleValue = 3;

    await pool.query(
      "UPDATE membre_workspace SET fk_role = $1 WHERE fk_workspace = $2 AND fk_utilisateur = $3",
      [roleValue, workspaceId, userId]
    );

    // DEBUG LOGS: Afficher les sockets dans la room avant émission
    if (req.app && req.app.get("io")) {
      const sockets = await req.app.get("io").in(workspaceId).allSockets();
      console.log(
        "[WS DEBUG] Sockets in workspace room",
        workspaceId,
        ":",
        Array.from(sockets)
      );
      req.app.get("io").to(workspaceId).emit("memberRoleChanged", {
        workspaceId,
        userId,
        newRole,
      });
      console.log(
        "[WS DEBUG] Event memberRoleChanged emitted to room",
        workspaceId,
        "for user",
        userId,
        "newRole:",
        newRole
      );
    }

    res.status(200).json({ message: `Rôle mis à jour en ${newRole}` });
  } catch (error) {
    console.error("Erreur lors du changement de rôle:", error);
    res.status(500).json({ message: error.message });
  }
};
