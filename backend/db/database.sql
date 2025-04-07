/**
 * @author GAULT Rudy
 * @company Cloud Temple
 * @created_at 2024-12-17 12:30:16
 * @updated_by GAULT Rudy
 * @updated_at 2025-01-08 12:01:14
 */

-- Activer l'extension uuid-ossp pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table statut avec des IDs entiers
CREATE TABLE statut (
  id_statut INT PRIMARY KEY,
  label VARCHAR(255) NOT NULL
);

-- Insertion des statuts pré-définis
INSERT INTO statut (id_statut, label) VALUES
  (1, 'connecté'),
  (2, 'hors ligne'),
  (3, 'occupé');
  (4, 'invisible'); -- Ajout du statut invisible

-- Création de la table utilisateur avec fk_statut en INT
CREATE TABLE utilisateur (
  id_utilisateur UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255),
  photo_de_profil VARCHAR(2048),
  date_creation TIMESTAMP DEFAULT current_timestamp,
  fk_statut INT NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  is_activated BOOLEAN DEFAULT false,
  validation_code VARCHAR(6),
  reset_password_code VARCHAR(6),
  reset_password_expires TIMESTAMP
);

-- Création de la table workspace
CREATE TABLE workspace (
  id_workspace UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  date_creation TIMESTAMP DEFAULT current_timestamp
);

-- Création de la table canal
CREATE TABLE canal (
  id_canal UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  date_creation TIMESTAMP DEFAULT current_timestamp,
  fk_workspace UUID NOT NULL
);

-- Création de la table message
CREATE TABLE message (
  id_message UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contenu VARCHAR(255),
  type_message VARCHAR(50),
  date_envoi TIMESTAMP DEFAULT current_timestamp,
  fk_canal UUID NOT NULL,
  fk_utilisateur UUID NOT NULL
);

-- Création de la table fichier
CREATE TABLE fichier (
  id_fichier UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_fichier VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  type VARCHAR(50),
  date_upload TIMESTAMP DEFAULT current_timestamp
);

-- Modification : Création de la table role avec un identifiant entier et des rôles pré-définis
CREATE TABLE role (
  id_role INT PRIMARY KEY,
  nom_role VARCHAR(50) NOT NULL
);

-- Insertion des rôles fixes (1 = owner, 2 = admin, 3 = member)
INSERT INTO role (id_role, nom_role) VALUES
  (1, 'owner'),
  (2, 'admin'),
  (3, 'member');

-- Création de la table permission
CREATE TABLE permission (
  id_permission UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_permission VARCHAR(50) NOT NULL
);

-- Création de la table hashtag
CREATE TABLE hashtag (
  id_hashtag UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(255) NOT NULL
);

-- Modification : Création de la table membre_workspace avec fk_role en entier
CREATE TABLE membre_workspace (
  fk_utilisateur UUID NOT NULL,
  fk_workspace UUID NOT NULL,
  fk_role INT NOT NULL,
  PRIMARY KEY (fk_utilisateur, fk_workspace)
);

-- Création de la table message_fichier
CREATE TABLE message_fichier (
  fk_message UUID NOT NULL,
  fk_fichier UUID NOT NULL,
  PRIMARY KEY (fk_message, fk_fichier)
);

-- Création de la table message_hashtag
CREATE TABLE message_hashtag (
  fk_message UUID NOT NULL,
  fk_hashtag UUID NOT NULL,
  PRIMARY KEY (fk_message, fk_hashtag)
);

-- Création de la table message_mention
CREATE TABLE message_mention (
  fk_message UUID NOT NULL,
  fk_utilisateur UUID NOT NULL,
  PRIMARY KEY (fk_message, fk_utilisateur)
);

-- Modification : Création de la table role_permission avec fk_role en entier
CREATE TABLE role_permission (
  fk_role INT NOT NULL,
  fk_permission UUID NOT NULL,
  PRIMARY KEY (fk_role, fk_permission)
);

-- Table pour les messages simples //!\\ UNIQUEMENT POUR TEST : MANQUE LA GESTION DES CANAUX + WORKSPACES. //!\\
CREATE TABLE simple_messages (
  id_message SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajout des commentaires sur les tables
COMMENT ON TABLE membre_workspace IS 'Relation entre Utilisateur, Workspace et Rôle';
COMMENT ON TABLE message_fichier IS 'Relation entre Message et Fichier';
COMMENT ON TABLE message_hashtag IS 'Relation entre Message et Hashtag';
COMMENT ON TABLE message_mention IS 'Relation entre Message et Utilisateur mentionné';
COMMENT ON TABLE role_permission IS 'Relation entre Rôle et Permission';

-- Ajout des contraintes de clé étrangère
ALTER TABLE utilisateur 
  ADD FOREIGN KEY (fk_statut) REFERENCES statut (id_statut);

ALTER TABLE canal 
  ADD FOREIGN KEY (fk_workspace) REFERENCES workspace (id_workspace);

ALTER TABLE message 
  ADD FOREIGN KEY (fk_canal) REFERENCES canal (id_canal),
  ADD FOREIGN KEY (fk_utilisateur) REFERENCES utilisateur (id_utilisateur);

ALTER TABLE membre_workspace 
  ADD FOREIGN KEY (fk_utilisateur) REFERENCES utilisateur (id_utilisateur),
  ADD FOREIGN KEY (fk_workspace) REFERENCES workspace (id_workspace),
  ADD FOREIGN KEY (fk_role) REFERENCES role (id_role);

ALTER TABLE message_fichier 
  ADD FOREIGN KEY (fk_message) REFERENCES message (id_message),
  ADD FOREIGN KEY (fk_fichier) REFERENCES fichier (id_fichier);

ALTER TABLE message_hashtag 
  ADD FOREIGN KEY (fk_message) REFERENCES message (id_message),
  ADD FOREIGN KEY (fk_hashtag) REFERENCES hashtag (id_hashtag);

ALTER TABLE message_mention 
  ADD FOREIGN KEY (fk_message) REFERENCES message (id_message),
  ADD FOREIGN KEY (fk_utilisateur) REFERENCES utilisateur (id_utilisateur);

ALTER TABLE role_permission 
  ADD FOREIGN KEY (fk_role) REFERENCES role (id_role),
  ADD FOREIGN KEY (fk_permission) REFERENCES permission (id_permission);

-- Modifier la table reaction pour assurer l'unicité
DROP TABLE IF EXISTS reaction CASCADE;
CREATE TABLE reaction (
    id_reaction UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fk_message UUID NOT NULL,
    fk_utilisateur UUID NOT NULL,
    emoji_unicode CHARACTER VARYING(8)[] NOT NULL,
    date_creation TIMESTAMP DEFAULT current_timestamp,
    FOREIGN KEY (fk_message) REFERENCES message (id_message),
    FOREIGN KEY (fk_utilisateur) REFERENCES utilisateur (id_utilisateur),
    UNIQUE (fk_message, fk_utilisateur, emoji_unicode) -- Garantit une seule réaction par emoji par utilisateur
);

-- Index pour améliorer les performances des recherches
CREATE INDEX idx_reaction_message ON reaction(fk_message);
CREATE INDEX idx_reaction_utilisateur ON reaction(fk_utilisateur);

COMMENT ON TABLE reaction IS 'Stockage optimisé des réactions emoji sur les messages';
COMMENT ON COLUMN reaction.emoji_unicode IS 'Tableau de codes points Unicode pour supporter les emojis composés';

-- Modifier la contrainte NOT NULL sur mot_de_passe
ALTER TABLE utilisateur ALTER COLUMN mot_de_passe DROP NOT NULL;

-- Ajouter la colonne date_naissance à la table utilisateur
ALTER TABLE utilisateur
ADD COLUMN date_naissance DATE;

-- Définir le fuseau horaire pour la session
SET timezone = 'UTC';

-- Modifier la colonne date_naissance pour s'assurer qu'elle est stockée comme DATE
ALTER TABLE utilisateur
ALTER COLUMN date_naissance TYPE DATE;

