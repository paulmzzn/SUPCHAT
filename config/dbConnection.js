import pg from "pg";

const { Pool } = pg;

// Configuration avec vos variables d’environnement
const pool = new Pool({
  user: process.env.DB_USER || "admin", // Nom d'utilisateur PostgreSQL
  host: process.env.DB_HOST || "postgres-service", // Adresse DNS du service PostgreSQL dans le cluster
  database: process.env.DB_NAME || "supchat", // Nom de votre base de données
  password: process.env.DB_PASSWORD || "root", // Mot de passe
  port: process.env.DB_PORT || 5432, // Port par défaut PostgreSQL
});

export default pool; // Exporter le pool pour l'utiliser dans d'autres parties du backend
