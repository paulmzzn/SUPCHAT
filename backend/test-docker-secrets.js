// Script pour tester l'accès aux secrets Docker
import fs from "fs";
import path from "path";

// Fonction pour afficher un message en couleur
const colorLog = (message, color = "\x1b[32m") => {
  const reset = "\x1b[0m";
  console.log(`${color}${message}${reset}`);
};

// Vérifier l'existence du répertoire /run/secrets
colorLog("==== Test d'accès aux secrets Docker ====", "\x1b[36m");
colorLog("Vérification du chemin /run/secrets...", "\x1b[33m");

try {
  // Tester si le répertoire /run/secrets existe
  const secretsExists = fs.existsSync("/run/secrets");
  colorLog(
    `Le répertoire /run/secrets existe: ${secretsExists}`,
    secretsExists ? "\x1b[32m" : "\x1b[31m"
  );

  // Si le répertoire existe, lister son contenu
  if (secretsExists) {
    const secretsList = fs.readdirSync("/run/secrets");
    colorLog("Liste des fichiers secrets:", "\x1b[33m");
    secretsList.forEach((file) => {
      colorLog(`  - ${file}`, "\x1b[32m");
    });

    // Tester la lecture des secrets db_user et db_password
    if (
      secretsList.includes("db_user") &&
      secretsList.includes("db_password")
    ) {
      const dbUser = fs.readFileSync("/run/secrets/db_user", "utf8").trim();
      const dbPassword = fs
        .readFileSync("/run/secrets/db_password", "utf8")
        .trim();

      colorLog("Secrets DB lus avec succès:", "\x1b[33m");
      colorLog(`  - Utilisateur: ${dbUser}`, "\x1b[32m");
      colorLog(
        `  - Mot de passe: ${"*".repeat(dbPassword.length)}`,
        "\x1b[32m"
      );
    } else {
      colorLog(
        "Les secrets db_user et/ou db_password n'existent pas",
        "\x1b[31m"
      );
    }
  }
} catch (error) {
  colorLog(`ERREUR: ${error.message}`, "\x1b[31m");

  // Essayer de créer le répertoire (diagnostic seulement)
  colorLog("Tentative de diagnostic supplémentaire...", "\x1b[33m");
  try {
    fs.mkdirSync("/run/secrets", { recursive: true });
    colorLog("Répertoire /run/secrets créé avec succès", "\x1b[32m");
  } catch (mkdirError) {
    colorLog(
      `Impossible de créer le répertoire: ${mkdirError.message}`,
      "\x1b[31m"
    );
  }
}

// Vérifier les alternatives
colorLog("\nVérification des chemins alternatifs...", "\x1b[33m");

// 1. Vérifier le dossier secrets local
const localSecretsPath = path.resolve(process.cwd(), "..", "secrets");
try {
  const localExists = fs.existsSync(localSecretsPath);
  colorLog(
    `Dossier secrets local (${localSecretsPath}): ${localExists}`,
    localExists ? "\x1b[32m" : "\x1b[31m"
  );

  if (localExists) {
    const localSecretsList = fs.readdirSync(localSecretsPath);
    colorLog(`Nombre de fichiers: ${localSecretsList.length}`, "\x1b[32m");
    // Lister quelques fichiers si présents
    if (localSecretsList.length > 0) {
      colorLog("Exemples de fichiers:", "\x1b[33m");
      localSecretsList.slice(0, 3).forEach((file) => {
        colorLog(`  - ${file}`, "\x1b[32m");
      });
    }
  }
} catch (error) {
  colorLog(`ERREUR avec le chemin local: ${error.message}`, "\x1b[31m");
}

// 2. Vérifier les variables d'environnement
colorLog("\nVérification des variables d'environnement...", "\x1b[33m");
const envVars = [
  "DB_USER",
  "DB_PASSWORD",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
];
envVars.forEach((varName) => {
  const exists = process.env[varName] !== undefined;
  colorLog(
    `${varName}: ${exists ? "Présent" : "Absent"}`,
    exists ? "\x1b[32m" : "\x1b[31m"
  );
});

// Affichage du résumé
colorLog("\n==== Résumé du diagnostic ====", "\x1b[36m");
colorLog(
  "Ce script vous aide à diagnostiquer les problèmes d'accès aux secrets Docker.",
  "\x1b[37m"
);
colorLog("Si /run/secrets n'est pas accessible, vérifiez:", "\x1b[33m");
colorLog("1. La configuration des secrets dans docker-compose.yml", "\x1b[37m");
colorLog("2. Les permissions utilisateur dans le conteneur", "\x1b[37m");
colorLog("3. La version de Docker et Docker Compose utilisée", "\x1b[37m");
