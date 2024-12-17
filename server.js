import express from 'express';
import pool from './config/dbConnection.js'; // Importation du pool configuré

const app = express();
const PORT = 3000;

// Route de test
app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Test simple
    res.status(200).json({ 
      message: 'Connexion réussie avec PostgreSQL',
      serverTime: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur de connexion', 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});