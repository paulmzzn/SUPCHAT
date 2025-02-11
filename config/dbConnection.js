import pg from "pg";

const { Pool } = pg;

// Configuration avec vos paramètres PostgreSQL externes
const pool = new Pool({
  user: process.env.POSTGRES_USER, // Nom d'utilisateur PostgreSQL
  host: process.env.PGHOST, // Adresse IP ou domaine de la BDD PostgreSQL
  database: process.env.POSTGRES_DB, // Nom de votre base de données
  password: process.env.POSTGRES_PASSWORD, // Mot de passe
  port: process.env.PGPORT, // Port par défaut PostgreSQL
});

export default pool; // Exporter le pool pour l'utiliser dans d'autres parties du backend
