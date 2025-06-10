-- =====================================================
-- INITIALISATION DE LA BASE DE DONNÉES SUPCHAT
-- Généré depuis le dump Azure - 10 juin 2025
-- =====================================================

-- Configuration initiale
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
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

-- Fonction trigger pour mettre à jour automatiquement updated_at (reminders)
CREATE OR REPLACE FUNCTION public.update_reminders_updated_at() RETURNS trigger
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

-- Table des statuts
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
    mot_de_passe character varying(255) NOT NULL,
    photo_de_profil character varying(500),
    fk_statut integer DEFAULT 1 NOT NULL,
    google_id character varying(255),
    is_activated boolean DEFAULT false,
    validation_code character varying(6),
    reset_password_code character varying(6),
    reset_password_expires timestamp without time zone,
    date_naissance date,
    bio text,
    status_text character varying(100) DEFAULT NULL::character varying,
    google_drive_enabled boolean DEFAULT false,
    google_drive_access_token text,
    google_drive_refresh_token text,
    google_drive_token_expires_at timestamp without time zone,
    google_drive_connected_at timestamp without time zone,
    google_drive_client_id text,
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
    CONSTRAINT membre_workspace_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT membre_workspace_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE,
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
    CONSTRAINT canal_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE
);

-- Table des fichiers
CREATE TABLE public.fichier (
    id_fichier uuid DEFAULT public.random_uuid() NOT NULL,
    nom_fichier character varying(255) NOT NULL,
    url_fichier character varying(500) NOT NULL,
    taille_fichier bigint,
    type_fichier character varying(100),
    date_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_utilisateur uuid,
    CONSTRAINT fichier_pkey PRIMARY KEY (id_fichier),
    CONSTRAINT fichier_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL
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
    contenu text NOT NULL,
    fk_utilisateur uuid NOT NULL,
    fk_canal uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    parent_id uuid,
    CONSTRAINT message_pkey PRIMARY KEY (id_message),
    CONSTRAINT message_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT message_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal) ON DELETE CASCADE,
    CONSTRAINT message_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message(id_message) ON DELETE CASCADE
);

-- Table de liaison message-fichier
CREATE TABLE public.message_fichier (
    fk_message uuid NOT NULL,
    fk_fichier uuid NOT NULL,
    CONSTRAINT message_fichier_pkey PRIMARY KEY (fk_message, fk_fichier),
    CONSTRAINT message_fichier_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message) ON DELETE CASCADE,
    CONSTRAINT message_fichier_fk_fichier_fkey FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier) ON DELETE CASCADE
);

-- Table de liaison message-hashtag
CREATE TABLE public.message_hashtag (
    fk_message uuid NOT NULL,
    fk_hashtag uuid NOT NULL,
    CONSTRAINT message_hashtag_pkey PRIMARY KEY (fk_message, fk_hashtag),
    CONSTRAINT message_hashtag_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message) ON DELETE CASCADE,
    CONSTRAINT message_hashtag_fk_hashtag_fkey FOREIGN KEY (fk_hashtag) REFERENCES public.hashtag(id_hashtag) ON DELETE CASCADE
);

-- Table de liaison message-mention
CREATE TABLE public.message_mention (
    fk_message uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    CONSTRAINT message_mention_pkey PRIMARY KEY (fk_message, fk_utilisateur),
    CONSTRAINT message_mention_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message) ON DELETE CASCADE,
    CONSTRAINT message_mention_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- Table des invitations workspace
CREATE TABLE public.workspace_invitations (
    id_invitation uuid DEFAULT public.random_uuid() NOT NULL,
    fk_workspace uuid NOT NULL,
    email_invite character varying(255) NOT NULL,
    token_invitation character varying(255) NOT NULL,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_expiration timestamp without time zone,
    is_used boolean DEFAULT false,
    CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id_invitation),
    CONSTRAINT workspace_invitations_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE,
    CONSTRAINT workspace_invitations_token_invitation_key UNIQUE (token_invitation)
);

-- Table des messages privés
CREATE TABLE public.message_prive (
    id_message_prive uuid DEFAULT public.random_uuid() NOT NULL,
    contenu text NOT NULL,
    fk_utilisateur_expediteur uuid NOT NULL,
    fk_utilisateur_destinataire uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_read boolean DEFAULT false,
    parent_id uuid,
    CONSTRAINT message_prive_pkey PRIMARY KEY (id_message_prive),
    CONSTRAINT message_prive_fk_utilisateur_expediteur_fkey FOREIGN KEY (fk_utilisateur_expediteur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT message_prive_fk_utilisateur_destinataire_fkey FOREIGN KEY (fk_utilisateur_destinataire) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT message_prive_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message_prive(id_message_prive) ON DELETE CASCADE
);

-- Table de liaison message privé-fichier
CREATE TABLE public.message_prive_fichier (
    fk_message_prive uuid NOT NULL,
    fk_fichier uuid NOT NULL,
    CONSTRAINT message_prive_fichier_pkey PRIMARY KEY (fk_message_prive, fk_fichier),
    CONSTRAINT message_prive_fichier_fk_message_prive_fkey FOREIGN KEY (fk_message_prive) REFERENCES public.message_prive(id_message_prive) ON DELETE CASCADE,
    CONSTRAINT message_prive_fichier_fk_fichier_fkey FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier) ON DELETE CASCADE
);

-- Table des favoris workspace
CREATE TABLE public.workspace_favoris (
    id_workspace_favoris integer NOT NULL,
    fk_utilisateur uuid NOT NULL,
    fk_workspace uuid NOT NULL,
    date_ajout timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT workspace_favoris_pkey PRIMARY KEY (id_workspace_favoris),
    CONSTRAINT workspace_favoris_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT workspace_favoris_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE,
    CONSTRAINT workspace_favoris_utilisateur_workspace_key UNIQUE (fk_utilisateur, fk_workspace)
);

-- Séquence pour workspace_favoris
CREATE SEQUENCE public.workspace_favoris_id_workspace_favoris_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.workspace_favoris_id_workspace_favoris_seq OWNED BY public.workspace_favoris.id_workspace_favoris;
ALTER TABLE ONLY public.workspace_favoris ALTER COLUMN id_workspace_favoris SET DEFAULT nextval('public.workspace_favoris_id_workspace_favoris_seq'::regclass);

-- Table des abonnements push
CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- Séquence pour push_subscriptions
CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;
ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);

-- Table des réactions
CREATE TABLE public.reaction (
    id_reaction integer NOT NULL,
    fk_message uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    emoji character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reaction_pkey PRIMARY KEY (id_reaction),
    CONSTRAINT reaction_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message) ON DELETE CASCADE,
    CONSTRAINT reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT reaction_utilisateur_message_emoji_key UNIQUE (fk_utilisateur, fk_message, emoji)
);

-- Séquence pour reactions
CREATE SEQUENCE public.reaction_id_reaction_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.reaction_id_reaction_seq OWNED BY public.reaction.id_reaction;
ALTER TABLE ONLY public.reaction ALTER COLUMN id_reaction SET DEFAULT nextval('public.reaction_id_reaction_seq'::regclass);

-- Table des réactions aux messages privés
CREATE TABLE public.private_message_reaction (
    id_reaction integer NOT NULL,
    fk_message_prive uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    emoji character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT private_message_reaction_pkey PRIMARY KEY (id_reaction),
    CONSTRAINT private_message_reaction_fk_message_prive_fkey FOREIGN KEY (fk_message_prive) REFERENCES public.message_prive(id_message_prive) ON DELETE CASCADE,
    CONSTRAINT private_message_reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT private_message_reaction_utilisateur_message_emoji_key UNIQUE (fk_utilisateur, fk_message_prive, emoji)
);

-- Séquence pour private_message_reaction
CREATE SEQUENCE public.private_message_reaction_id_reaction_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.private_message_reaction_id_reaction_seq OWNED BY public.private_message_reaction.id_reaction;
ALTER TABLE ONLY public.private_message_reaction ALTER COLUMN id_reaction SET DEFAULT nextval('public.private_message_reaction_id_reaction_seq'::regclass);

-- Table des lectures de messages
CREATE TABLE public.message_read (
    id integer NOT NULL,
    fk_utilisateur uuid NOT NULL,
    fk_canal uuid NOT NULL,
    last_read_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT message_read_pkey PRIMARY KEY (id),
    CONSTRAINT message_read_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT message_read_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal) ON DELETE CASCADE,
    CONSTRAINT message_read_utilisateur_canal_key UNIQUE (fk_utilisateur, fk_canal)
);

-- Séquence pour message_read
CREATE SEQUENCE public.message_read_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.message_read_id_seq OWNED BY public.message_read.id;
ALTER TABLE ONLY public.message_read ALTER COLUMN id SET DEFAULT nextval('public.message_read_id_seq'::regclass);

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
    CONSTRAINT notification_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- Table des lectures de canaux
CREATE TABLE public.canal_lecture (
    id_canal_lecture integer NOT NULL,
    fk_utilisateur uuid NOT NULL,
    fk_canal uuid NOT NULL,
    derniere_lecture timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT canal_lecture_pkey PRIMARY KEY (id_canal_lecture),
    CONSTRAINT canal_lecture_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT canal_lecture_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal) ON DELETE CASCADE,
    CONSTRAINT canal_lecture_utilisateur_canal_key UNIQUE (fk_utilisateur, fk_canal)
);

-- Séquence pour canal_lecture
CREATE SEQUENCE public.canal_lecture_id_canal_lecture_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.canal_lecture_id_canal_lecture_seq OWNED BY public.canal_lecture.id_canal_lecture;
ALTER TABLE ONLY public.canal_lecture ALTER COLUMN id_canal_lecture SET DEFAULT nextval('public.canal_lecture_id_canal_lecture_seq'::regclass);

-- Table des membres de canaux (pour les canaux privés)
CREATE TABLE public.membre_canal (
    id_membre_canal integer NOT NULL,
    fk_canal uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    droit_acces public.canal_access_type DEFAULT 'lecture'::public.canal_access_type NOT NULL,
    date_ajout timestamp with time zone DEFAULT now(),
    CONSTRAINT membre_canal_pkey PRIMARY KEY (id_membre_canal),
    CONSTRAINT membre_canal_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal) ON DELETE CASCADE,
    CONSTRAINT membre_canal_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT membre_canal_canal_utilisateur_key UNIQUE (fk_canal, fk_utilisateur)
);

-- Séquence pour membre_canal
CREATE SEQUENCE public.membre_canal_id_membre_canal_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.membre_canal_id_membre_canal_seq OWNED BY public.membre_canal.id_membre_canal;
ALTER TABLE ONLY public.membre_canal ALTER COLUMN id_membre_canal SET DEFAULT nextval('public.membre_canal_id_membre_canal_seq'::regclass);

-- Table des demandes d'adhésion aux workspaces
CREATE TABLE public.workspace_join_requests (
    id_request integer NOT NULL,
    fk_utilisateur uuid NOT NULL,
    fk_workspace uuid NOT NULL,
    message text,
    statut character varying(20) DEFAULT 'en_attente'::character varying NOT NULL,
    date_demande timestamp with time zone DEFAULT now() NOT NULL,
    date_traitement timestamp with time zone,
    fk_administrateur uuid,
    motif_refus text,
    CONSTRAINT workspace_join_requests_pkey PRIMARY KEY (id_request),
    CONSTRAINT workspace_join_requests_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT workspace_join_requests_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE,
    CONSTRAINT workspace_join_requests_fk_administrateur_fkey FOREIGN KEY (fk_administrateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL,
    CONSTRAINT workspace_join_requests_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_attente'::character varying, 'acceptee'::character varying, 'refusee'::character varying])::text[]))),
    CONSTRAINT workspace_join_requests_utilisateur_workspace_key UNIQUE (fk_utilisateur, fk_workspace)
);

-- Séquence pour workspace_join_requests
CREATE SEQUENCE public.workspace_join_requests_id_request_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.workspace_join_requests_id_request_seq OWNED BY public.workspace_join_requests.id_request;
ALTER TABLE ONLY public.workspace_join_requests ALTER COLUMN id_request SET DEFAULT nextval('public.workspace_join_requests_id_request_seq'::regclass);

-- Table des rappels
CREATE TABLE public.reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    reminder_date timestamp with time zone NOT NULL,
    fk_utilisateur uuid NOT NULL,
    fk_workspace uuid,
    fk_canal uuid,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    error_message text,
    CONSTRAINT reminders_pkey PRIMARY KEY (id),
    CONSTRAINT reminders_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT reminders_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE,
    CONSTRAINT reminders_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal) ON DELETE CASCADE
);

-- Vue pour la compatibilité des messages
CREATE VIEW public.message_with_alias AS
 SELECT id_message,
    contenu,
    fk_utilisateur,
    created_at,
    created_at AS date_creation,
    updated_at,
    parent_id
   FROM public.message;

-- =====================================================
-- CRÉATION DES TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour updated_at sur les rappels
CREATE TRIGGER update_reminders_updated_at_trigger
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_reminders_updated_at();

-- =====================================================
-- INSERTION DES DONNÉES INITIALES
-- =====================================================

-- Insertion des statuts par défaut
INSERT INTO public.statut (id_statut, label) VALUES 
(1, 'En ligne'),
(2, 'Absent'),
(3, 'Ne pas déranger'),
(4, 'Hors ligne')
ON CONFLICT (id_statut) DO NOTHING;

-- Insertion des rôles par défaut (basé sur votre dump Azure)
INSERT INTO public.role (id_role, nom_role) VALUES 
(1, 'owner'),
(2, 'admin'),
(3, 'member')
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
      ALTER ROLE admin WITH PASSWORD 'REDACTED' SUPERUSER;
   ELSE
      CREATE ROLE admin LOGIN PASSWORD 'REDACTED' SUPERUSER;
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE supchat TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- =====================================================
-- INDEX ET OPTIMISATIONS
-- =====================================================

-- Index pour améliorer les performances sur les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_message_canal ON public.message(fk_canal);
CREATE INDEX IF NOT EXISTS idx_message_utilisateur ON public.message(fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_message_created_at ON public.message(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_membre_workspace_workspace ON public.membre_workspace(fk_workspace);
CREATE INDEX IF NOT EXISTS idx_membre_workspace_utilisateur ON public.membre_workspace(fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_message_prive_expediteur ON public.message_prive(fk_utilisateur_expediteur);
CREATE INDEX IF NOT EXISTS idx_message_prive_destinataire ON public.message_prive(fk_utilisateur_destinataire);
CREATE INDEX IF NOT EXISTS idx_notification_utilisateur ON public.notification(fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON public.notification(is_read);

-- =====================================================
-- FINALISATION
-- =====================================================

-- Mise à jour des statistiques
ANALYZE;

-- Message de confirmation
DO
$$
BEGIN
    RAISE NOTICE 'Base de données SUPCHAT initialisée avec succès !';
    RAISE NOTICE 'Rôles configurés: 1=owner, 2=admin, 3=member';
    RAISE NOTICE 'Schéma mis à jour depuis dump Azure du 10 juin 2025';
END
$$;
