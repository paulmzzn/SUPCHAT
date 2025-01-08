import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import db from './models/sequelizeInit.js';
import messageRoutes from './routes/messageRoutes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.json());

// Exemple de route de test
app.get('/test', async (req, res) => {
  try {
    // ...
  } catch (error) {
    // ...
  }
});

// Associer le router de messagerie à /api/messages
app.use('/api/messages', messageRoutes);

// Configuration de Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected');

  // Écoute l’événement "joinChannel" pour rejoindre un canal spécifique
  socket.on('joinChannel', (fk_canal) => {
    socket.join(fk_canal);
  });

  // Écoute l’événement "sendMessage"
  socket.on('sendMessage', async (data) => {
    const { contenu, fk_canal, fk_utilisateur } = data;
    const message = await db.Message.create({ contenu, fk_canal, fk_utilisateur });

    // Émet le nouveau message à tous les utilisateurs du canal
    io.to(fk_canal).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});