import pg from "pg";

const { Pool } = pg;

// Configuration avec vos paramètres PostgreSQL externes
const pool = new Pool({
  user: "mathis.malzac.user@supinfo.com", // Nom d'utilisateur PostgreSQL
  host: "supchat-postgres.postgres.database.azure.com", // Adresse IP ou domaine de la BDD PostgreSQL
  database: "postgres", // Nom de votre base de données
  password: "rootmath", // Mot de passe
  port: 5432, // Port par défaut PostgreSQL
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool; // Exporter le pool pour l'utiliser dans d'autres parties du backend
