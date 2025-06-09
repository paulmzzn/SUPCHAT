-- =====================================================
-- SCRIPT D'INITIALISATION SUPCHAT DATABASE
-- Pour conteneur Docker PostgreSQL
-- Date: 2025-06-03
-- =====================================================

-- Configuration initiale
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =====================================================
-- CRÉATION DES TYPES PERSONNALISÉS
-- =====================================================

-- Type énuméré pour les droits d'accès aux canaux
CREATE TYPE public.canal_access_type AS ENUM (
    'lecture',
    'lecture_ecriture'
);

-- =====================================================
-- CRÉATION DES FONCTIONS
-- =====================================================

-- Fonction pour générer des UUID aléatoires
CREATE OR REPLACE FUNCTION public.random_uuid() RETURNS uuid
    LANGUAGE sql
    AS $$
  SELECT regexp_replace(
    md5(random()::text || clock_timestamp()::text),
    '(.{8})(.{4})(.{4})(.{4})(.{12})',
    '\1-\2-\3-\4-\5'
  )::uuid;
$$;

-- Fonction trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_reminder_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =====================================================
-- CRÉATION DES TABLES
-- =====================================================

-- Table des statuts utilisateur
CREATE TABLE public.statut (
    id_statut integer NOT NULL,
    label character varying(255) NOT NULL,
    CONSTRAINT statut_pkey PRIMARY KEY (id_statut)
);

-- Table des utilisateurs
CREATE TABLE public.utilisateur (
    id_utilisateur uuid DEFAULT public.random_uuid() NOT NULL,
    nom character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    mot_de_passe character varying(255),
    photo_de_profil character varying(2048),
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_statut integer DEFAULT 1 NOT NULL,
    google_id character varying(255),
    is_activated boolean DEFAULT false,
    validation_code character varying(6),
    reset_password_code character varying(6),
    reset_password_expires timestamp without time zone,
    date_naissance date,
    bio text,
    status_text character varying(100) DEFAULT NULL::character varying,
    CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur),
    CONSTRAINT utilisateur_email_key UNIQUE (email),
    CONSTRAINT utilisateur_fk_statut_fkey FOREIGN KEY (fk_statut) REFERENCES public.statut(id_statut)
);

-- Table des workspaces
CREATE TABLE public.workspace (
    id_workspace uuid DEFAULT public.random_uuid() NOT NULL,
    nom character varying(255) NOT NULL,
    is_private boolean DEFAULT false,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    banner_url character varying(500),
    icon_url character varying(500),
    description text,
    CONSTRAINT workspace_pkey PRIMARY KEY (id_workspace)
);

-- Table des rôles
CREATE TABLE public.role (
    id_role integer NOT NULL,
    nom_role character varying(50) NOT NULL,
    CONSTRAINT role_pkey PRIMARY KEY (id_role)
);

-- Table des permissions
CREATE TABLE public.permission (
    id_permission uuid DEFAULT public.random_uuid() NOT NULL,
    type_permission character varying(50) NOT NULL,
    CONSTRAINT permission_pkey PRIMARY KEY (id_permission)
);

-- Table de liaison rôle-permission
CREATE TABLE public.role_permission (
    fk_role integer NOT NULL,
    fk_permission uuid NOT NULL,
    CONSTRAINT role_permission_pkey PRIMARY KEY (fk_role, fk_permission),
    CONSTRAINT role_permission_fk_role_fkey FOREIGN KEY (fk_role) REFERENCES public.role(id_role),
    CONSTRAINT role_permission_fk_permission_fkey FOREIGN KEY (fk_permission) REFERENCES public.permission(id_permission)
);

-- Table des membres de workspace
CREATE TABLE public.membre_workspace (
    fk_utilisateur uuid NOT NULL,
    fk_workspace uuid NOT NULL,
    fk_role integer NOT NULL,
    ordre integer DEFAULT 0,
    CONSTRAINT membre_workspace_pkey PRIMARY KEY (fk_utilisateur, fk_workspace),
    CONSTRAINT membre_workspace_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT membre_workspace_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace),
    CONSTRAINT membre_workspace_fk_role_fkey FOREIGN KEY (fk_role) REFERENCES public.role(id_role)
);

-- Table des canaux
CREATE TABLE public.canal (
    id_canal uuid DEFAULT public.random_uuid() NOT NULL,
    nom character varying(255) NOT NULL,
    is_private boolean DEFAULT false,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_workspace uuid NOT NULL,
    updated_at timestamp without time zone,
    CONSTRAINT canal_pkey PRIMARY KEY (id_canal),
    CONSTRAINT canal_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace)
);

-- Table des membres de canaux (pour les canaux privés)
CREATE TABLE public.membre_canal (
    id_membre_canal integer GENERATED BY DEFAULT AS IDENTITY,
    fk_canal uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    droit_acces public.canal_access_type DEFAULT 'lecture'::public.canal_access_type NOT NULL,
    date_ajout timestamp with time zone DEFAULT now(),
    CONSTRAINT membre_canal_pkey PRIMARY KEY (id_membre_canal),
    CONSTRAINT membre_canal_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal),
    CONSTRAINT membre_canal_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur)
);

-- Table de lecture des canaux (pour tracking des messages lus)
CREATE TABLE public.canal_lecture (
    id_canal_lecture integer GENERATED BY DEFAULT AS IDENTITY,
    fk_utilisateur uuid NOT NULL,
    fk_canal uuid NOT NULL,
    derniere_lecture timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT canal_lecture_pkey PRIMARY KEY (id_canal_lecture),
    CONSTRAINT canal_lecture_fk_utilisateur_fk_canal_key UNIQUE (fk_utilisateur, fk_canal),
    CONSTRAINT canal_lecture_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT canal_lecture_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal)
);

-- Table des fichiers
CREATE TABLE public.fichier (
    id_fichier uuid DEFAULT public.random_uuid() NOT NULL,
    nom_fichier character varying(255) NOT NULL,
    url character varying(2048) NOT NULL,
    type character varying(50),
    date_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    taille_fichier bigint,
    extension character varying(50),
    mime_type character varying(100),
    fk_utilisateur uuid,
    CONSTRAINT fichier_pkey PRIMARY KEY (id_fichier),
    CONSTRAINT fichier_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur)
);

-- Table des hashtags
CREATE TABLE public.hashtag (
    id_hashtag uuid DEFAULT public.random_uuid() NOT NULL,
    label character varying(255) NOT NULL,
    CONSTRAINT hashtag_pkey PRIMARY KEY (id_hashtag),
    CONSTRAINT hashtag_label_key UNIQUE (label)
);

-- Table des messages
CREATE TABLE public.message (
    id_message uuid DEFAULT public.random_uuid() NOT NULL,
    contenu text,
    type_message character varying(50),
    date_envoi timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_canal uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    parent_id uuid,
    CONSTRAINT message_pkey PRIMARY KEY (id_message),
    CONSTRAINT message_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal),
    CONSTRAINT message_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT message_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message(id_message)
);

-- Table de liaison message-fichier
CREATE TABLE public.message_fichier (
    fk_message uuid NOT NULL,
    fk_fichier uuid NOT NULL,
    CONSTRAINT message_fichier_pkey PRIMARY KEY (fk_message, fk_fichier),
    CONSTRAINT message_fichier_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message),
    CONSTRAINT message_fichier_fk_fichier_fkey FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier)
);

-- Table de liaison message-hashtag
CREATE TABLE public.message_hashtag (
    fk_message uuid NOT NULL,
    fk_hashtag uuid NOT NULL,
    CONSTRAINT message_hashtag_pkey PRIMARY KEY (fk_message, fk_hashtag),
    CONSTRAINT message_hashtag_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message),
    CONSTRAINT message_hashtag_fk_hashtag_fkey FOREIGN KEY (fk_hashtag) REFERENCES public.hashtag(id_hashtag)
);

-- Table des mentions dans les messages
CREATE TABLE public.message_mention (
    fk_message uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    CONSTRAINT message_mention_pkey PRIMARY KEY (fk_message, fk_utilisateur),
    CONSTRAINT message_mention_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message),
    CONSTRAINT message_mention_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur)
);

-- Table de tracking des messages lus
CREATE TABLE public.message_read (
    id integer GENERATED BY DEFAULT AS IDENTITY,
    fk_user uuid NOT NULL,
    fk_canal uuid NOT NULL,
    last_read_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT message_read_pkey PRIMARY KEY (id),
    CONSTRAINT message_read_fk_user_fk_canal_key UNIQUE (fk_user, fk_canal),
    CONSTRAINT message_read_fk_user_fkey FOREIGN KEY (fk_user) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT message_read_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal)
);

-- Table des messages privés
CREATE TABLE public.message_prive (
    id_message_prive uuid DEFAULT public.random_uuid() NOT NULL,
    contenu text NOT NULL,
    date_envoi timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_lecture timestamp without time zone,
    fk_expediteur uuid NOT NULL,
    fk_destinataire uuid NOT NULL,
    pieces_jointes jsonb DEFAULT '[]'::jsonb,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_modification timestamp without time zone,
    is_deleted boolean DEFAULT false,
    parent_id uuid,
    CONSTRAINT message_prive_pkey PRIMARY KEY (id_message_prive),
    CONSTRAINT message_prive_fk_expediteur_fkey FOREIGN KEY (fk_expediteur) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT message_prive_fk_destinataire_fkey FOREIGN KEY (fk_destinataire) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT message_prive_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message_prive(id_message_prive)
);

-- Table de liaison message privé-fichier
CREATE TABLE public.message_prive_fichier (
    fk_message_prive uuid NOT NULL,
    fk_fichier uuid NOT NULL,
    CONSTRAINT message_prive_fichier_pkey PRIMARY KEY (fk_message_prive, fk_fichier),
    CONSTRAINT message_prive_fichier_fk_message_prive_fkey FOREIGN KEY (fk_message_prive) REFERENCES public.message_prive(id_message_prive),
    CONSTRAINT message_prive_fichier_fk_fichier_fkey FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier)
);

-- Table des réactions aux messages
CREATE TABLE public.reaction (
    id_reaction integer GENERATED BY DEFAULT AS IDENTITY,
    fk_message uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    reaction_type character varying(191) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reaction_pkey PRIMARY KEY (id_reaction),
    CONSTRAINT reaction_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message),
    CONSTRAINT reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT reaction_fk_message_fk_utilisateur_reaction_type_key UNIQUE (fk_message, fk_utilisateur, reaction_type)
);

-- Table des réactions aux messages privés
CREATE TABLE public.private_message_reaction (
    id_reaction integer GENERATED BY DEFAULT AS IDENTITY,
    fk_message_prive uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    reaction_type character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT private_message_reaction_pkey PRIMARY KEY (id_reaction),
    CONSTRAINT private_message_reaction_fk_message_prive_fkey FOREIGN KEY (fk_message_prive) REFERENCES public.message_prive(id_message_prive),
    CONSTRAINT private_message_reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT private_message_reaction_fk_message_prive_fk_utilisateur_re_key UNIQUE (fk_message_prive, fk_utilisateur, reaction_type)
);

-- Table des notifications
CREATE TABLE public.notification (
    id_notification uuid DEFAULT gen_random_uuid() NOT NULL,
    fk_utilisateur uuid NOT NULL,
    type character varying(50) NOT NULL,
    contenu text NOT NULL,
    lien character varying(255),
    is_read boolean DEFAULT false,
    date_creation timestamp with time zone DEFAULT now(),
    CONSTRAINT notification_pkey PRIMARY KEY (id_notification),
    CONSTRAINT notification_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur)
);

-- Table des souscriptions push
CREATE TABLE public.push_subscriptions (
    id integer GENERATED BY DEFAULT AS IDENTITY,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    auth text NOT NULL,
    p256dh text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint),
    CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilisateur(id_utilisateur)
);

-- Table des rappels (reminders)
CREATE TABLE public.reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    reminder_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_sent boolean DEFAULT false,
    email_sent_at timestamp with time zone,
    workspace_id uuid,
    canal_id uuid,
    email_failed boolean DEFAULT false,
    error_message text,
    CONSTRAINT reminders_pkey PRIMARY KEY (id),
    CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT reminders_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspace(id_workspace),
    CONSTRAINT reminders_canal_id_fkey FOREIGN KEY (canal_id) REFERENCES public.canal(id_canal)
);

-- Table des favoris workspace
CREATE TABLE public.workspace_favoris (
    id_workspace_favoris integer GENERATED BY DEFAULT AS IDENTITY,
    fk_utilisateur uuid NOT NULL,
    fk_workspace uuid NOT NULL,
    date_ajout timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT workspace_favoris_pkey PRIMARY KEY (id_workspace_favoris),
    CONSTRAINT workspace_favoris_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT workspace_favoris_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace)
);

-- Table des invitations workspace
CREATE TABLE public.workspace_invitations (
    id_invitation uuid DEFAULT public.random_uuid() NOT NULL,
    fk_workspace uuid NOT NULL,
    fk_inviteur uuid NOT NULL,
    email_invite character varying(255) NOT NULL,
    date_invitation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_expiration timestamp without time zone,
    is_accepted boolean DEFAULT false,
    fk_role integer NOT NULL,
    CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id_invitation),
    CONSTRAINT workspace_invitations_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace),
    CONSTRAINT workspace_invitations_fk_inviteur_fkey FOREIGN KEY (fk_inviteur) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT workspace_invitations_fk_role_fkey FOREIGN KEY (fk_role) REFERENCES public.role(id_role)
);

-- Table des demandes de rejoindre un workspace
CREATE TABLE public.workspace_join_requests (
    id_request integer GENERATED BY DEFAULT AS IDENTITY,
    fk_workspace uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    message text,
    status character varying(20) DEFAULT 'pending'::character varying,
    date_demande timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_reponse timestamp without time zone,
    fk_repondeur uuid,
    CONSTRAINT workspace_join_requests_pkey PRIMARY KEY (id_request),
    CONSTRAINT workspace_join_requests_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace),
    CONSTRAINT workspace_join_requests_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur),
    CONSTRAINT workspace_join_requests_fk_repondeur_fkey FOREIGN KEY (fk_repondeur) REFERENCES public.utilisateur(id_utilisateur)
);

-- =====================================================
-- CRÉATION DES VUES
-- =====================================================

-- Vue pour compatibilité avec l'ancien code
CREATE VIEW public.message_with_alias AS
SELECT 
    id_message,
    contenu,
    type_message,
    date_envoi,
    fk_canal,
    fk_utilisateur,
    created_at,
    created_at AS date_creation,
    updated_at,
    parent_id
FROM public.message;

-- =====================================================
-- CRÉATION DES TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour automatiquement updated_at dans reminders
CREATE TRIGGER reminders_updated_at_trigger
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_reminder_updated_at();

-- =====================================================
-- INSERTION DES DONNÉES INITIALES
-- =====================================================

-- Insertion des statuts par défaut
INSERT INTO public.statut (id_statut, label) VALUES 
(1, 'Actif'),
(2, 'Inactif'),
(3, 'Suspendu'),
(4, 'En attente')
ON CONFLICT (id_statut) DO NOTHING;

-- Insertion des rôles par défaut
INSERT INTO public.role (id_role, nom_role) VALUES 
(1, 'Administrateur'),
(2, 'Modérateur'),
(3, 'Membre'),
(4, 'Invité')
ON CONFLICT (id_role) DO NOTHING;

-- Insertion des permissions par défaut
INSERT INTO public.permission (id_permission, type_permission) VALUES 
(public.random_uuid(), 'CREATE_WORKSPACE'),
(public.random_uuid(), 'DELETE_WORKSPACE'),
(public.random_uuid(), 'MANAGE_MEMBERS'),
(public.random_uuid(), 'CREATE_CHANNEL'),
(public.random_uuid(), 'DELETE_CHANNEL'),
(public.random_uuid(), 'SEND_MESSAGE'),
(public.random_uuid(), 'DELETE_MESSAGE'),
(public.random_uuid(), 'UPLOAD_FILE'),
(public.random_uuid(), 'MANAGE_PERMISSIONS')
ON CONFLICT (id_permission) DO NOTHING;

-- ===========================================
-- CRÉATION DE L'UTILISATEUR ADMIN SI ABSENT
-- ===========================================
DO
$$
BEGIN
   IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
      ALTER ROLE admin WITH PASSWORD 'SuperSecretPassword2024!' SUPERUSER;
   ELSE
      CREATE ROLE admin LOGIN PASSWORD 'SuperSecretPassword2024!' SUPERUSER;
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE supchat TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- =====================================================
-- CRÉATION DES INDEX POUR OPTIMISATION
-- =====================================================

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_message_canal ON public.message(fk_canal);
CREATE INDEX IF NOT EXISTS idx_message_utilisateur ON public.message(fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_message_date ON public.message(date_envoi);
CREATE INDEX IF NOT EXISTS idx_message_prive_expediteur ON public.message_prive(fk_expediteur);
CREATE INDEX IF NOT EXISTS idx_message_prive_destinataire ON public.message_prive(fk_destinataire);
CREATE INDEX IF NOT EXISTS idx_canal_workspace ON public.canal(fk_workspace);
CREATE INDEX IF NOT EXISTS idx_membre_workspace_user ON public.membre_workspace(fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_membre_workspace_workspace ON public.membre_workspace(fk_workspace);
CREATE INDEX IF NOT EXISTS idx_notification_utilisateur ON public.notification(fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_notification_date ON public.notification(date_creation);

-- =====================================================
-- COMMENTAIRES SUR LES TABLES
-- =====================================================

COMMENT ON TABLE public.canal_lecture IS 'Enregistre quand un utilisateur a lu un canal pour la dernière fois';
COMMENT ON TABLE public.membre_canal IS 'Stocke les droits d''accès des membres aux canaux privés';
COMMENT ON TABLE public.message_prive IS 'Stocke les messages privés échangés entre deux utilisateurs';
COMMENT ON TABLE public.reminders IS 'Système de rappels pour les utilisateurs';

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Base de données SUPCHAT initialisée avec succès!';
    RAISE NOTICE 'Tables créées: %, Fonctions: %, Types: %', 
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'),
        (SELECT count(*) FROM information_schema.routines WHERE routine_schema = 'public'),
        (SELECT count(*) FROM information_schema.user_defined_types WHERE user_defined_type_schema = 'public');
END $$;
