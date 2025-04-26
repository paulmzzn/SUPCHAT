import express from "express";
import pool from "./config/dbConnection.js"; // Importation du pool configuré
import userRoutes from "./routes/userRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import canalRoutes from "./routes/canalRoutes.js";
import passport from "passport";
import session from "express-session";
import cors from "cors"; // Import CORS
import { googleStrategy } from "./config/passport.js"; // Import Google strategy
import { createServer } from "http";
import { Server } from "socket.io";
import MessageModel from "./models/Message.js";
import messageRoutes from "./routes/messageRoutes.js";
import socketManager from "./socket/socketManager.js";
import reactionRoutes from "./routes/reactionRoutes.js";
import dotenv from 'dotenv';
import privateMessageRoutes from "./routes/privateMessageRoutes.js";

// Load environment variables at the start
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuration de CORS avec plus de précision
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.0:3001",
  "http://192.168.223.1.1.52:3000",
  "http://192.168.223.1.1.52:3001"
];

app.use(cors({
  origin: (origin, callback) => {
    // Autorise les requêtes sans origin ou si l'origine est dans la liste
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS bloqué pour l'origine: ${origin}`);
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "REDACTED",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));

passport.use(googleStrategy);

app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api", canalRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", reactionRoutes);
app.use("/api/private-messages", privateMessageRoutes);

// Ajouter une route API pour vérifier que le serveur est en ligne
app.get('/api/ping', (req, res) => {
  console.log("PING request received");
  res.status(200).send('pong');
});

// Configuration plus détaillée de Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,  // Augmenter la fréquence des pings
  connectTimeout: 45000 // Plus de temps pour établir la connexion
});

// Définir le port à utiliser
const PORT = process.env.PORT || 3000;

// Assurez-vous que cette ligne est AVANT l'initialisation de socketManager
app.set('io', io);

// Initialiser le gestionnaire de socket avec un try/catch pour capturer les erreurs d'initialisation
try {
  socketManager(io);
  console.log("Socket.IO manager initialized successfully");
} catch (error) {
  console.error("Error initializing Socket.IO manager:", error);
}

// Démarrer l'écoute du serveur avec l'interface et le port corrects
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://192.168.223.1.1.141:${PORT}`);
  console.log(`WebSocket URL: ws://192.168.223.1.1.141:${PORT}`);
  
  // Déplacer le test de connexion PostgreSQL dans le callback de l'écoute du serveur
  pool.query("SELECT NOW()") // Test simple pour vérifier la connexion
    .then(() => {
      console.log("Connexion réussie avec PostgreSQL");
    })
    .catch(error => {
      console.error("Erreur de connexion à PostgreSQL:", error.message);
    });
});

// Gestion des erreurs non capturées
process.on("unhandledRejection", (error) => {
  console.error("Erreur non gérée:", error);
});
