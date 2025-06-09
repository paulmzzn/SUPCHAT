import express from "express";
import pool from "./config/dbConnection.js"; // Importation du pool configuré
import userRoutes from "./routes/userRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import canalRoutes from "./routes/canalRoutes.js";
import canalMemberRoutes from "./routes/canalMemberRoutes.js"; // Import des routes pour les membres des canaux privés
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
import privateMessageReactionRoutes from "./routes/privateMessageReactionRoutes.js"; // Import des routes pour les réactions aux messages privés
import dotenv from "dotenv";
import privateMessageRoutes from "./routes/privateMessageRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js"; // Import attachment routes
import fichierRoutes from "./routes/fichierRoutes.js"; // Import fichier routes
import fileRoutes from "./routes/fileRoutes.js"; // Import des routes
import searchRoutes from "./routes/searchRoutes.js"; // Import des routes de recherche
import reminderRoutes from "./routes/reminderRoutes.js"; // Import des routes de rappels
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path"; // Import path
import fs from "fs"; // Import fs
import strawpollRoutes from "./routes/strawpollRoutes.js"; // Import ES module

// Système de logging simple
// Niveaux: error, warn, info, debug
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Définir le niveau de log actuel (changez cette valeur pour filtrer les logs)
// Par défaut: INFO en production, DEBUG en développement
const currentLogLevel =
  process.env.NODE_ENV === "production" ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

// Remplacer les méthodes console standard
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Nouvelle fonction de log avec niveau
global.logger = {
  error: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      originalConsoleError(`[ERROR] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      originalConsoleWarn(`[WARN] ${message}`, ...args);
    }
  },
  info: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      originalConsoleLog(`[INFO] ${message}`, ...args);
    }
  },
  debug: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      originalConsoleLog(`[DEBUG] ${message}`, ...args);
    }
  },
};

// Remplacer console.log pour rediriger automatiquement vers le niveau info
console.log = (message, ...args) => {
  logger.info(message, ...args);
};

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
      logger.info(`Création du répertoire: ${dir}`);
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
app.use("/api", canalMemberRoutes); // Ajout des routes pour la gestion des membres des canaux privés
app.use("/api/messages", messageRoutes);
app.use("/api", reactionRoutes);
app.use("/api/private-messages", privateMessageRoutes);
app.use("/api", attachmentRoutes); // Ajout des routes pour les pièces jointes
app.use("/api", fichierRoutes); // Ajout des routes pour les fichiers
app.use("/api/files", fileRoutes); // Routes pour les fichiers (incluant notre route content/:path)
app.use("/api/strawpoll", strawpollRoutes); // Ajout des routes pour strawpoll
app.use("/api/private-messages/reactions", privateMessageReactionRoutes); // Ajout des routes pour les réactions aux messages privés
app.use("/api/search", searchRoutes); // Ajout des routes pour la recherche
app.use("/api", reminderRoutes); // Ajout des routes pour les rappels

// Servir les fichiers statiques pour les messages privés et autres
// Ces routes sont maintenant placées APRÈS la définition de fileRoutes pour éviter qu'elles n'interceptent notre route personnalisée
app.use(
  "/api/files/private-messages/files",
  express.static(path.join(__dirname, "uploads/private-messages/files"))
);

// Cette route était problématique car elle interceptait toutes les requêtes /api/files/* y compris notre /api/files/content/*
// Nous la plaçons en dernier comme fallback pour les autres chemins de fichiers
app.use("/api/files", express.static(path.join(__dirname, "uploads")));

// Middleware pour logguer les requêtes de fichiers (niveau debug seulement)
app.use("/api/files", (req, res, next) => {
  logger.debug(`File Access: ${req.method} ${req.url}`);
  next();
});

// Ajouter une route API pour vérifier que le serveur est en ligne
app.get("/api/ping", (req, res) => {
  logger.debug("PING request received");
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
  logger.info("Socket.IO manager initialized successfully");
} catch (error) {
  logger.error("Error initializing Socket.IO manager:", error);
}

httpServer.listen(PORT, "0.0.0.0", () => {
  logger.info(`Serveur démarré sur http://192.168.1.63:${PORT}`);
  logger.info(`WebSocket URL: ws://192.168.1.63:${PORT}`);

  // Déplacer le test de connexion PostgreSQL dans le callback de l'écoute du serveur
  pool
    .query("SELECT NOW()") // Test simple pour vérifier la connexion
    .then(() => {
      logger.info("Connexion réussie avec PostgreSQL");
    })
    .catch((error) => {
      logger.error("Erreur de connexion à PostgreSQL:", error.message);
    });
});

// Gestion des erreurs non capturées
process.on("unhandledRejection", (error) => {
  logger.error("Erreur non gérée:", error);
});
