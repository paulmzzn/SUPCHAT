import express from "express";
import http from "http";
import { Server } from "socket.io";
import pool from "./config/dbConnection.js";
import userRoutes from "./routes/userRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import canalRoutes from "./routes/canalRoutes.js";
import passport from "passport";
import session from "express-session";
import cors from "cors"; // Import CORS
import { googleStrategy } from "./config/passport.js"; // Import Google strategy

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

const PORT = 3000;

app.use(cors()); // Enable CORS
app.use(express.json());
app.use(session({ secret: "REDACTED", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(googleStrategy);

app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/canals", canalRoutes);

io.on("connection", (socket) => {
  console.log("Nouveau client connecté");

  socket.on("joinChannel", (channelId) => {
    socket.join(channelId);
    console.log(`Client a rejoint le canal ${channelId}`);
  });

  socket.on("sendMessage", async (data) => {
    console.log("Nouveau message reçu :", data);

    try {
      const newMessage = await pool.query(
        "INSERT INTO message (contenu, fk_canal, fk_utilisateur) VALUES ($1, $2, $3) RETURNING *",
        [data.contenu, data.fk_channel, data.fk_user]
      );

      console.log("Message créé en base de données :", newMessage.rows[0]);

      io.to(data.fk_channel).emit("receiveMessage", newMessage.rows[0]);
      console.log("Message diffusé aux clients du canal", data.fk_channel);
    } catch (error) {
      console.error("Erreur lors de la création du message :", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client déconnecté");
  });
});

server.listen(PORT, async () => {

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/api/users/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => {
   res.redirect("http://localhost:3001/account");
 });

app.listen(PORT, async () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  try {
    await pool.query("SELECT NOW()");
    console.log("Connexion réussie avec PostgreSQL");
  } catch (error) {
    console.error("Erreur de connexion à PostgreSQL:", error.message);
  }
});