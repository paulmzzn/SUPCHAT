import pg from 'pg';

const { Pool } = pg;

// Configuration avec vos paramètres PostgreSQL externes
const pool = new Pool({
  user: 'admin',               // Nom d'utilisateur PostgreSQL
  host: '192.168.1.161',       // Adresse IP ou domaine de la BDD PostgreSQL
  database: 'supchat-db',         // Nom de votre base de données
  password: 'root',            // Mot de passe
  port: 5432,                  // Port par défaut PostgreSQL
});

export default pool; // Exporter le pool pour l'utiliser dans d'autres parties du backend