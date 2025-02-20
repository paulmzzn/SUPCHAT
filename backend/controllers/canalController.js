import Canal from '../models/canal.js';
import Workspace from '../models/workspace.js';

export const createCanal = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { nom, is_private } = req.body;

    // Vérifier si le workspace existe
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const canal = await Canal.create({ 
      nom, 
      is_private, 
      fk_workspace: workspaceId 
    });
    res.status(201).json(canal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCanalById = async (req, res) => {
  try {
    const { workspaceId, canalId } = req.params;
    
    // Vérifier si le canal appartient au workspace
    const canal = await Canal.verifyWorkspaceCanal(workspaceId, canalId);
    if (!canal) {
      return res.status(404).json({ message: 'Canal not found in this workspace' });
    }
    
    res.status(200).json(canal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllWorkspaceCanals = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Vérifier si le workspace existe
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const canals = await Canal.findByWorkspaceId(workspaceId);
    res.status(200).json(canals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCanal = async (req, res) => {
  try {
    const { workspaceId, canalId } = req.params;
    const { nom, is_private } = req.body;

    // Vérifier si le canal appartient au workspace
    const existingCanal = await Canal.verifyWorkspaceCanal(workspaceId, canalId);
    if (!existingCanal) {
      return res.status(404).json({ message: 'Canal not found in this workspace' });
    }

    const canal = await Canal.update(canalId, { 
      nom, 
      is_private, 
      fk_workspace: workspaceId 
    });
    res.status(200).json(canal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCanal = async (req, res) => {
  try {
    const { workspaceId, canalId } = req.params;

    // Vérifier si le canal appartient au workspace
    const canal = await Canal.verifyWorkspaceCanal(workspaceId, canalId);
    if (!canal) {
      return res.status(404).json({ message: 'Canal not found in this workspace' });
    }

    await Canal.delete(canalId);
    res.status(200).json({ message: 'Canal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};