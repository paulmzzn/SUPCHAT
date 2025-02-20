import Workspace from "../models/Workspace.js";
import UserModel from "../models/User.js";
import sendInvitation from "../config/emailService.js"; // Ajout de l'import

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
    const { userId, recipientEmail } = req.body;

    // Vérification des données requises
    if (!workspaceId || !userId || !recipientEmail) {
      return res.status(400).json({
        message: "workspaceId, userId et recipientEmail sont requis",
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

    // Envoyer l'invitation avec les bons paramètres
    await sendInvitation(
      recipientEmail,
      workspaceId,
      workspace.nom,
      sender.nom
    );

    res.status(200).json({
      message: "Invitation envoyée avec succès",
      details: {
        sender: sender.nom,
        workspace: workspace.nom,
        recipient: recipientEmail,
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
