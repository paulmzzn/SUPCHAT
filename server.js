import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import pool from './config/dbConnection.js'; // Importation du pool configuré
import db from './models/sequelizeInit.js'; // Importation de Sequelize et des modèles
import messageRoutes from './routes/messageRoutes.js'; // Importation des routes de messagerie

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.json());

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

// Routes de messagerie
app.use('/api/messages', messageRoutes);

// Configuration de Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('sendMessage', async (data) => {
    const { contenu, fk_canal, fk_utilisateur } = data;
    const message = await db.Message.create({ contenu, fk_canal, fk_utilisateur });
    io.to(fk_canal).emit('receiveMessage', message);
  });

  socket.on('joinChannel', (fk_canal) => {
    socket.join(fk_canal);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, async () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  await db.sequelize.sync(); // Synchronisation des modèles Sequelize
});