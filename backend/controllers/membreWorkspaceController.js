import MembreWorkspace from "../models/membreWorkspace.js";

export const getMembresByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const membres = await MembreWorkspace.getMembresByWorkspace(workspaceId);
    res.status(200).json(membres);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des membres",
      error: error.message,
    });
  }
};

// Ajout d'un membre au workspace
export const addMembreToWorkspace = async (req, res) => {
  try {
    const { fk_utilisateur, fk_workspace, fk_role } = req.body;
    const nouveauMembre = await MembreWorkspace.addMembreWorkspace(
      fk_utilisateur,
      fk_workspace,
      fk_role
    );
    res.status(201).json(nouveauMembre);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'ajout du membre",
      error: error.message,
    });
  }
};

// Suppression d'un membre du workspace
export const deleteMembreFromWorkspace = async (req, res) => {
  try {
    const { fk_utilisateur, fk_workspace } = req.body;
    await MembreWorkspace.deleteMembreWorkspace(fk_utilisateur, fk_workspace);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la suppression du membre",
      error: error.message,
    });
  }
};

// Mise à jour du rôle d'un membre dans le workspace
export const updateMembreRole = async (req, res) => {
  try {
    const { fk_utilisateur, fk_workspace, nouveau_role } = req.body;
    const membreModifie = await MembreWorkspace.updateMembreWorkspace(
      fk_utilisateur,
      fk_workspace,
      nouveau_role
    );
    res.status(200).json(membreModifie);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour du rôle",
      error: error.message,
    });
  }
};
