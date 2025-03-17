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

// Load environment variables at the start
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
  },
  pingTimeout: 60000,
});

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
); // Enable CORS
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

app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api", canalRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", reactionRoutes);

// Supprimer la configuration socket.io directement dans server.js
// et utiliser uniquement socketManager
socketManager(io);

// Supprimer ou modifier cette route car elle n'est plus nécessaire
// app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
// app.get("/api/users/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => {
//    res.redirect("http://localhost:3000");
// });

httpServer.listen(PORT, async () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  try {
    await pool.query("SELECT NOW()"); // Test simple pour vérifier la connexion
    console.log("Connexion réussie avec PostgreSQL");
  } catch (error) {
    console.error("Erreur de connexion à PostgreSQL:", error.message);
  }
});

// Gestion des erreurs non capturées
process.on("unhandledRejection", (error) => {
  console.error("Erreur non gérée:", error);
});
