import express from "express";
import pool from "./config/dbConnection.js"; // Importation du pool configuré
import userRoutes from "./routes/userRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import membreWorkspaceRoutes from "./routes/membreWorkspaceRoutes.js";
import canalRoutes from "./routes/canalRoutes.js";
import passport from "passport";
import session from "express-session";
import cors from "cors"; // Import CORS
import { googleStrategy } from "./config/passport.js"; // Import Google strategy

const app = express();
const PORT = 3000;

app.use(cors()); // Enable CORS
app.use(express.json());
app.use(
  session({
    secret: "REDACTED",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(googleStrategy);

app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/canals", canalRoutes);
app.use("/api/membres", membreWorkspaceRoutes);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/api/users/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:3001/account");
  }
);

app.listen(PORT, async () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  try {
    await pool.query("SELECT NOW()"); // Test simple pour vérifier la connexion
    console.log("Connexion réussie avec PostgreSQL");
  } catch (error) {
    console.error("Erreur de connexion à PostgreSQL:", error.message);
  }
});
