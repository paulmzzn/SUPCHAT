// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import messageRoutes from './routes/messageRoutes.js';
import { Sequelize } from './config/sequelizeInit.js'; // Ton instance Sequelize
import Message from '../models/message.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Pour la partie Socket.IO
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Exemple : vérifier la connexion à la base
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base réussie');
  } catch (error) {
    console.error('Erreur de connexion :', error);
  }
})();

// Route de test
app.get('/test', (req, res) => {
  res.send('Test SUPCHAT');
});

// Attach routes
app.use('/api/messages', messageRoutes);

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Nouveau client connecté');

  socket.on('joinChannel', (channelId) => {
    socket.join(channelId);
  });

  socket.on('sendMessage', async (data) => {
    console.log('Nouveau message reçu :', data);
    // Ici, tu peux créer le message en base + émettre à tous les connectés
    // ...
    io.to(data.fk_channel).emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

// Middleware de gestion d’erreurs global (optionnel)
app.use(errorHandler);

// Lancement du serveur
server.listen(PORT, () => {
  console.log(`Serveur SUPCHAT démarré sur le port ${PORT}`);
});