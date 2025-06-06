import fs from "fs";
import path from "path";

/**
 * Fonction utilitaire pour lire les secrets Docker
 * @param {string} secretName - Nom du secret (nom du fichier sans .txt)
 * @param {string} envVarName - Nom de la variable d'environnement de fallback
 * @returns {string} - Valeur du secret
 */
export const getSecret = (secretName, envVarName = null) => {
  try {
    // En production, les secrets sont montés dans /run/secrets/
    const secretPath = `/run/secrets/${secretName}`;

    if (fs.existsSync(secretPath)) {
      const secret = fs.readFileSync(secretPath, "utf8").trim();
      console.log(`✅ Secret '${secretName}' lu depuis /run/secrets/`);
      return secret;
    }

    // En développement, chercher dans le dossier secrets local
    const localSecretPath = path.join(
      process.cwd(),
      "..",
      "secrets",
      `${secretName}.txt`
    );

    if (fs.existsSync(localSecretPath)) {
      const secret = fs.readFileSync(localSecretPath, "utf8").trim();
      console.log(`✅ Secret '${secretName}' lu depuis le fichier local`);
      return secret;
    }

    // Si le secret n'est pas trouvé et qu'il s'agit du mot de passe DB, essayer de lire à partir de l'environnement
    if (secretName === "db_password" && process.env.POSTGRES_PASSWORD) {
      console.log(
        `⚠️ Utilisation de POSTGRES_PASSWORD comme fallback pour db_password`
      );
      return process.env.POSTGRES_PASSWORD;
    }

    if (secretName === "db_user" && process.env.POSTGRES_USER) {
      console.log(
        `⚠️ Utilisation de POSTGRES_USER comme fallback pour db_user`
      );
      return process.env.POSTGRES_USER;
    }

    // Fallback vers les variables d'environnement
    if (envVarName && process.env[envVarName]) {
      console.log(
        `⚠️ Secret '${secretName}' lu depuis la variable d'environnement ${envVarName}`
      );
      return process.env[envVarName];
    }

    throw new Error(`Secret '${secretName}' introuvable`);
  } catch (error) {
    console.error(
      `❌ Erreur lors de la lecture du secret '${secretName}':`,
      error.message
    );

    // En cas d'erreur, essayer la variable d'environnement
    if (envVarName && process.env[envVarName]) {
      console.log(
        `🔄 Utilisation de la variable d'environnement ${envVarName} en fallback`
      );
      return process.env[envVarName];
    }

    throw error;
  }
};

/**
 * Fonction pour charger tous les secrets de base de données
 * @returns {Object} - Configuration de base de données avec secrets
 */
export const getDbConfig = () => {
  return {
    user: getSecret("db_user", "DB_USER"),
    password: getSecret("db_password", "DB_PASSWORD"),
    host: process.env.DB_HOST || "postgres",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || process.env.POSTGRES_DB || "supchat",
    // Pour Docker Compose/local, toujours désactiver SSL (sinon erreur de handshake)
    ssl: false, // ⚠️ En production cloud, activer SSL si nécessaire
  };
};

/**
 * Fonction pour charger la configuration S3/Scaleway
 * @returns {Object} - Configuration S3 avec secrets
 */
export const getS3Config = () => {
  return {
    accessKeyId: getSecret("scw_access_key", "SCW_ACCESS_KEY_ID"),
    secretAccessKey: getSecret("scw_secret_key", "SCW_SECRET_ACCESS_KEY"),
    endpoint: process.env.SCW_ENDPOINT || "https://s3.fr-par.scw.cloud/",
    region: process.env.SCW_REGION || "fr-par",
    bucketName: process.env.S3_BUCKET_NAME || "s3-supchat",
  };
};

/**
 * Fonction pour charger la configuration OAuth
 * @returns {Object} - Configuration OAuth avec secrets
 */
export const getOAuthConfig = () => {
  return {
    google: {
      clientId: getSecret("google_client_id", "GOOGLE_CLIENT_ID"),
      clientSecret: getSecret("google_client_secret", "GOOGLE_CLIENT_SECRET"),
    },
    github: {
      clientId: getSecret("github_client_id", "GITHUB_CLIENT_ID"),
      clientSecret: getSecret("github_client_secret", "GITHUB_CLIENT_SECRET"),
    },
  };
};

/**
 * Fonction pour charger la configuration email
 * @returns {Object} - Configuration email avec secrets
 */
export const getEmailConfig = () => {
  return {
    user: getSecret("email_user", "EMAIL_USER"),
    password: getSecret("email_password", "EMAIL_PASSWORD"),
    host: process.env.EMAIL_HOST || "mail86.lwspanel.com",
    port: process.env.EMAIL_PORT || 465,
    secure: true,
  };
};

/**
 * Fonction pour charger le secret JWT
 * @returns {string} - Clé secrète JWT
 */
export const getJwtSecret = () => {
  return getSecret("jwt_secret", "JWT_SECRET");
};

/**
 * Fonction pour charger les clés API
 * @returns {Object} - Clés API avec secrets
 */
export const getApiKeys = () => {
  return {
    strawpoll: getSecret("strawpoll_api_key", "STRAWPOLL_API_KEY"),
    mistral: getSecret("mistral_api_key", "MISTRAL_API_KEY"),
  };
};
