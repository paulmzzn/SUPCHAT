-- Initialisation de la base de données SUPCHAT pour Docker
-- Ce script créé la base de données et l'utilisateur si nécessaire

-- Création de la base de données si elle n'existe pas
SELECT 'CREATE DATABASE supchat'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'supchat')\gexec

-- Connexion à la base de données supchat
\c supchat;

-- Extension pour UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Les tables et données seront importées depuis le dump principal
-- Ce script sert de point d'entrée pour l'initialisation Docker


