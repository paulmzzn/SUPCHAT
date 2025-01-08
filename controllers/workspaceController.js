import Workspace from '../models/workspace.js';

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
      return res.status(404).json({ message: 'Workspace not found' });
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
      return res.status(404).json({ message: 'Workspace not found' });
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
      return res.status(404).json({ message: 'Workspace not found' });
    }
    res.status(200).json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};