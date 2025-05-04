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
import dotenv from "dotenv";
import privateMessageRoutes from "./routes/privateMessageRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js"; // Import attachment routes
import fichierRoutes from "./routes/fichierRoutes.js"; // Import fichier routes
import fileRoutes from "./routes/fileRoutes.js"; // Import des routes
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path"; // Import path
import fs from "fs"; // Import fs
import strawpollRoutes from './routes/strawpollRoutes.js'; // Import ES module

// Load environment variables at the start
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Obtenir l'équivalent de __dirname pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Assurer que les dossiers d'upload existent
const createUploadDirs = () => {
  const uploadsDir = path.join(__dirname, "uploads");
  const privateMessagesDir = path.join(uploadsDir, "private-messages");
  const privateMessagesFilesDir = path.join(privateMessagesDir, "files");

  // Créer les dossiers s'ils n'existent pas
  [uploadsDir, privateMessagesDir, privateMessagesFilesDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      console.log(`[Server] Création du répertoire: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configuration de CORS avec plus de précision

app.use(
  cors({
    origin: true, // Autorise toutes les origines
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Middleware pour augmenter la limite de taille des requêtes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "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",
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
app.use("/api", attachmentRoutes); // Ajout des routes pour les pièces jointes
app.use("/api", fichierRoutes); // Ajout des routes pour les fichiers
app.use("/api/files", fileRoutes); // Ajout des routes pour les fichiers
app.use('/api/strawpoll', strawpollRoutes); // Ajout des routes pour strawpoll

// Servir les fichiers statiques pour les messages privés et autres
// Configurer avant les routes API pour éviter les conflits d'authentification
app.use(
  "/api/files/private-messages/files",
  express.static(path.join(__dirname, "uploads/private-messages/files"))
);
app.use("/api/files", express.static(path.join(__dirname, "uploads")));

// Middleware pour logguer les requêtes de fichiers
app.use("/api/files", (req, res, next) => {
  console.log(`[File Access] ${req.method} ${req.url}`);
  next();
});

// Ajouter une route API pour vérifier que le serveur est en ligne
app.get("/api/ping", (req, res) => {
  console.log("PING request received");
  res.status(200).send("pong");
});

// Configuration plus détaillée de Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: true, // Autorise toutes les origines
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000, // Augmenter la fréquence des pings
  connectTimeout: 45000, // Plus de temps pour établir la connexion
});

// Définir le port à utiliser
const PORT = process.env.PORT || 3000;

// Assurez-vous que cette ligne est AVANT l'initialisation de socketManager
app.set("io", io);

// Initialiser le gestionnaire de socket avec un try/catch pour capturer les erreurs d'initialisation
try {
  socketManager(io);
  console.log("Socket.IO manager initialized successfully");
} catch (error) {
  console.error("Error initializing Socket.IO manager:", error);
}

httpServer.listen(PORT, "0.0.0.0", () => {


  console.log(`Serveur démarré sur http://192.168.1.63:${PORT}`);
  console.log(`WebSocket URL: ws://192.168.1.63:${PORT}`);



  // Déplacer le test de connexion PostgreSQL dans le callback de l'écoute du serveur
  pool
    .query("SELECT NOW()") // Test simple pour vérifier la connexion
    .then(() => {
      console.log("Connexion réussie avec PostgreSQL");
    })
    .catch((error) => {
      console.error("Erreur de connexion à PostgreSQL:", error.message);
    });
});

// Gestion des erreurs non capturées
process.on("unhandledRejection", (error) => {
  console.error("Erreur non gérée:", error);
});
