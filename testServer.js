import http from 'http';
import { Server } from 'socket.io';

const app = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket server up and running');
});

const io = new Server(app);

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 3001; // Changez le port ici

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});