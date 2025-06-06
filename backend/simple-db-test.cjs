const { Client } = require("pg");

// Configuration de connexion à la base de données
const client = new Client({
  user: "admin",
  host: "postgres",
  database: "supchat",
  password: "REDACTED",
  port: 5432,
});

console.log("Tentative de connexion à PostgreSQL...");

// Tentative de connexion
client
  .connect()
  .then(() => {
    console.log("✅ Connexion à PostgreSQL réussie!");

    // Exécution d'une requête test
    return client.query("SELECT version()");
  })
  .then((res) => {
    console.log("Version de PostgreSQL:", res.rows[0].version);

    // Fermeture de la connexion
    return client.end();
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion:", err.message);
    console.error("Détails:", err);
  });
