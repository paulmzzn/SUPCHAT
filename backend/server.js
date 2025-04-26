import express from "express";
import pool from "./config/dbConnection.js"; // Importation du pool configuré
import userRoutes from "./routes/userRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import canalRoutes from "./routes/canalRoutes.js";
import passport from "passport";
import session from "express-session";
import cors from "cors"; // Import CORS
import { googleStrategy, githubStrategy } from "./config/passport.js"; // Import Google and GitHub strategies
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

// Autoriser toutes les origines (CORS ouvert)
app.use(cors({
  origin: true, // Autorise toutes les origines
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
passport.use(githubStrategy);

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
    origin: true, // Autorise toutes les origines
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
  console.log(`Serveur démarré sur http://192.168.1.29:${PORT}`);
  console.log(`WebSocket URL: ws://192.168.1.29:${PORT}`);
  
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
