import express from 'express';
import pool from './config/dbConnection.js'; // Importation du pool configuré
import userRoutes from './routes/userRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import canalRoutes from './routes/canalRoutes.js';

const app = express();
const PORT = 3000;

app.use(express.json()); 

app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/canals', canalRoutes);

app.listen(PORT, async () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    try {
        await pool.query('SELECT NOW()'); // Test simple pour vérifier la connexion
        console.log('Connexion réussie avec PostgreSQL');
    } catch (error) {
        console.error('Erreur de connexion à PostgreSQL:', error.message);
    }
});