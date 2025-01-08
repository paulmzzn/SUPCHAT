import Canal from '../models/canal.js';

export const createCanal = async (req, res) => {
  try {
    const { id } = req.params; // Récupérer l'ID du workspace depuis les paramètres
    const { nom, is_private } = req.body;
    const canal = await Canal.create({ nom, is_private, fk_workspace: id });
    res.status(201).json(canal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCanalById = async (req, res) => {
  try {
    const { id } = req.params;
    const canal = await Canal.findById(id);
    if (!canal) {
      return res.status(404).json({ message: 'Canal not found' });
    }
    res.status(200).json(canal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCanals = async (req, res) => {
  try {
    const canals = await Canal.findAll();
    res.status(200).json(canals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCanal = async (req, res) => {
  try {
    const { id, canalId } = req.params;
    const { nom, is_private } = req.body;
    const canal = await Canal.update(canalId, { nom, is_private, fk_workspace: id });
    if (!canal) {
      return res.status(404).json({ message: 'Canal not found' });
    }
    res.status(200).json(canal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCanal = async (req, res) => {
  try {
    const { id, canalId } = req.params;
    const canal = await Canal.delete(canalId);
    if (!canal) {
      return res.status(404).json({ message: 'Canal not found' });
    }
    res.status(200).json({ message: 'Canal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};