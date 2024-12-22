-- Créer la base de données uniquement si elle n'existe pas
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'supchat') THEN
      PERFORM dblink_exec('dbname=postgres user=admin password=root', 'CREATE DATABASE supchat');
   END IF;
END $$;

-- Se connecter à la base de données supchat
\c supchat

-- Activer l'extension uuid-ossp uniquement si elle n'existe pas déjà
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer les tables uniquement si elles n'existent pas déjà
CREATE TABLE IF NOT EXISTS statut (
  id_statut SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS utilisateur (
  id_utilisateur UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  photo_de_profil VARCHAR(2048),
  date_creation TIMESTAMP DEFAULT current_timestamp,
  fk_statut INT NOT NULL REFERENCES statut(id_statut)
);

CREATE TABLE IF NOT EXISTS workspace (
  id_workspace UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  date_creation TIMESTAMP DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS canal (
  id_canal UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  date_creation TIMESTAMP DEFAULT current_timestamp,
  fk_workspace UUID NOT NULL REFERENCES workspace(id_workspace)
);

CREATE TABLE IF NOT EXISTS message (
  id_message UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contenu VARCHAR(255),
  type_message VARCHAR(50),
  date_envoi TIMESTAMP DEFAULT current_timestamp,
  fk_canal UUID NOT NULL REFERENCES canal(id_canal),
  fk_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur)
);

CREATE TABLE IF NOT EXISTS fichier (
  id_fichier UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_fichier VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  type VARCHAR(50),
  date_upload TIMESTAMP DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS role (
  id_role UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS permission (
  id_permission UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_permission VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS hashtag (
  id_hashtag UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS membre_workspace (
  fk_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur),
  fk_workspace UUID NOT NULL REFERENCES workspace(id_workspace),
  fk_role UUID NOT NULL REFERENCES role(id_role),
  PRIMARY KEY (fk_utilisateur, fk_workspace)
);

CREATE TABLE IF NOT EXISTS message_fichier (
  fk_message UUID NOT NULL REFERENCES message(id_message),
  fk_fichier UUID NOT NULL REFERENCES fichier(id_fichier),
  PRIMARY KEY (fk_message, fk_fichier)
);

CREATE TABLE IF NOT EXISTS message_hashtag (
  fk_message UUID NOT NULL REFERENCES message(id_message),
  fk_hashtag UUID NOT NULL REFERENCES hashtag(id_hashtag),
  PRIMARY KEY (fk_message, fk_hashtag)
);

CREATE TABLE IF NOT EXISTS message_mention (
  fk_message UUID NOT NULL REFERENCES message(id_message),
  fk_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur),
  PRIMARY KEY (fk_message, fk_utilisateur)
);

CREATE TABLE IF NOT EXISTS role_permission (
  fk_role UUID NOT NULL REFERENCES role(id_role),
  fk_permission UUID NOT NULL REFERENCES permission(id_permission),
  PRIMARY KEY (fk_role, fk_permission)
);

-- Ajouter des commentaires si nécessaire
DO $$
BEGIN
   IF NOT EXISTS (SELECT obj_description('membre_workspace'::regclass)) THEN
      COMMENT ON TABLE membre_workspace IS 'Relation entre Utilisateur, Workspace et Rôle';
   END IF;
END $$;
