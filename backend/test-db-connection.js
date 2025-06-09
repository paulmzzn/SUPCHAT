// Test simple de connexion à PostgreSQL depuis Docker
import pg from "pg";
import { getDbConfig } from "./config/secrets.js";

const testDbConnection = async () => {
  console.log("🔍 Test de connexion à PostgreSQL...");

  try {
    // Utiliser la configuration de la base de données depuis le module secrets
    const dbConfig = getDbConfig();

    // Afficher la configuration (sans le mot de passe complet)
    const safeConfig = {
      ...dbConfig,
      password: dbConfig.password
        ? `${dbConfig.password.substring(0, 3)}...`
        : undefined,
    };
    console.log(
      "Configuration de connexion:",
      JSON.stringify(safeConfig, null, 2)
    );

    // Créer un pool de connexion
    const pool = new pg.Pool(dbConfig);

    // Tester la connexion
    console.log("Tentative de connexion...");
    const client = await pool.connect();
    console.log("✅ Connexion établie avec succès!");

    // Exécuter une requête simple
    const result = await client.query(
      "SELECT current_database() as db, current_user as user"
    );
    console.log("Résultat de la requête:", result.rows[0]);

    // Libérer le client
    client.release();

    // Fermer le pool
    await pool.end();

    console.log("✅ Test de connexion réussi!");
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion à PostgreSQL:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    return false;
  }
};

// Exécuter le test
testDbConnection()
  .then((success) => {
    if (!success) {
      console.error("❌ Échec du test de connexion à la base de données");
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("❌ Erreur inattendue:", err);
    process.exit(1);
  });
