import pg from 'pg';

const { Pool } = pg;

// Configuration avec vos paramètres PostgreSQL externes
const pool = new Pool({
  user: 'admin',               // Nom d'utilisateur PostgreSQL
  host: '192.168.0.49',       // Adresse IP ou domaine de la BDD PostgreSQL
  database: 'supchat',         // Nom de votre base de données
  password: 'admin',            // Mot de passe
  port: 5432,                  // Port par défaut PostgreSQL
});

export default pool; // Exporter le pool pour l'utiliser dans d'autres parties du backend