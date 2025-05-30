--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 17.2

-- Started on 2025-05-30 10:32:43

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4452 (class 1262 OID 5)
-- Name: postgres; Type: DATABASE; Schema: -; Owner: azure_pg_admin
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE postgres OWNER TO azure_pg_admin;

\connect postgres

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 4452
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: azure_pg_admin
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- TOC entry 3 (class 3079 OID 303294)
-- Name: pg_cron; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;


--
-- TOC entry 4455 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pg_cron; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';


--
-- TOC entry 8 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: azure_pg_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO azure_pg_admin;

--
-- TOC entry 4 (class 3079 OID 24756)
-- Name: azure; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS azure WITH SCHEMA pg_catalog;


--
-- TOC entry 4458 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION azure; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION azure IS 'azure extension for PostgreSQL service';


--
-- TOC entry 2 (class 3079 OID 24577)
-- Name: pgaadauth; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgaadauth WITH SCHEMA pg_catalog;


--
-- TOC entry 4459 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgaadauth; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgaadauth IS 'Azure Active Directory Authentication';


--
-- TOC entry 940 (class 1247 OID 303255)
-- Name: canal_access_type; Type: TYPE; Schema: public; Owner: rootmath
--

CREATE TYPE public.canal_access_type AS ENUM (
    'lecture',
    'lecture_ecriture'
);


ALTER TYPE public.canal_access_type OWNER TO rootmath;

--
-- TOC entry 264 (class 1255 OID 81930)
-- Name: random_uuid(); Type: FUNCTION; Schema: public; Owner: rootmath
--

CREATE FUNCTION public.random_uuid() RETURNS uuid
    LANGUAGE sql
    AS $$
  SELECT regexp_replace(
    md5(random()::text || clock_timestamp()::text),
    '(.{8})(.{4})(.{4})(.{4})(.{12})',
    '\1-\2-\3-\4-\5'
  )::uuid;
$$;


ALTER FUNCTION public.random_uuid() OWNER TO rootmath;

--
-- TOC entry 262 (class 1255 OID 303392)
-- Name: update_reminder_updated_at(); Type: FUNCTION; Schema: public; Owner: rootmath
--

CREATE FUNCTION public.update_reminder_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_reminder_updated_at() OWNER TO rootmath;

--
-- TOC entry 263 (class 1255 OID 303401)
-- Name: update_reminders_updated_at(); Type: FUNCTION; Schema: public; Owner: rootmath
--

CREATE FUNCTION public.update_reminders_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_reminders_updated_at() OWNER TO rootmath;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 82251)
-- Name: canal; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.canal (
    id_canal uuid DEFAULT public.random_uuid() NOT NULL,
    nom character varying(255) NOT NULL,
    is_private boolean DEFAULT false,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_workspace uuid NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.canal OWNER TO rootmath;

--
-- TOC entry 249 (class 1259 OID 286780)
-- Name: canal_lecture; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.canal_lecture (
    id_canal_lecture integer NOT NULL,
    fk_utilisateur uuid NOT NULL,
    fk_canal uuid NOT NULL,
    derniere_lecture timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.canal_lecture OWNER TO rootmath;

--
-- TOC entry 4543 (class 0 OID 0)
-- Dependencies: 249
-- Name: TABLE canal_lecture; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.canal_lecture IS 'Enregistre quand un utilisateur a lu un canal pour la dernière fois';


--
-- TOC entry 4544 (class 0 OID 0)
-- Dependencies: 249
-- Name: COLUMN canal_lecture.id_canal_lecture; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.canal_lecture.id_canal_lecture IS 'Identifiant unique de l''enregistrement de lecture';


--
-- TOC entry 4545 (class 0 OID 0)
-- Dependencies: 249
-- Name: COLUMN canal_lecture.fk_utilisateur; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.canal_lecture.fk_utilisateur IS 'Identifiant de l''utilisateur qui a lu le canal';


--
-- TOC entry 4546 (class 0 OID 0)
-- Dependencies: 249
-- Name: COLUMN canal_lecture.fk_canal; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.canal_lecture.fk_canal IS 'Identifiant du canal qui a été lu';


--
-- TOC entry 4547 (class 0 OID 0)
-- Dependencies: 249
-- Name: COLUMN canal_lecture.derniere_lecture; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.canal_lecture.derniere_lecture IS 'Date et heure de la dernière lecture du canal par l''utilisateur';


--
-- TOC entry 248 (class 1259 OID 286779)
-- Name: canal_lecture_id_canal_lecture_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.canal_lecture_id_canal_lecture_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.canal_lecture_id_canal_lecture_seq OWNER TO rootmath;

--
-- TOC entry 4549 (class 0 OID 0)
-- Dependencies: 248
-- Name: canal_lecture_id_canal_lecture_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.canal_lecture_id_canal_lecture_seq OWNED BY public.canal_lecture.id_canal_lecture;


--
-- TOC entry 224 (class 1259 OID 82281)
-- Name: fichier; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.fichier (
    id_fichier uuid DEFAULT public.random_uuid() NOT NULL,
    nom_fichier character varying(255) NOT NULL,
    url character varying(2048) NOT NULL,
    type character varying(50),
    date_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    taille_fichier bigint,
    extension character varying(50),
    mime_type character varying(100),
    fk_utilisateur uuid
);


ALTER TABLE public.fichier OWNER TO rootmath;

--
-- TOC entry 227 (class 1259 OID 82301)
-- Name: hashtag; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.hashtag (
    id_hashtag uuid DEFAULT public.random_uuid() NOT NULL,
    label character varying(255) NOT NULL
);


ALTER TABLE public.hashtag OWNER TO rootmath;

--
-- TOC entry 253 (class 1259 OID 303260)
-- Name: membre_canal; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.membre_canal (
    id_membre_canal integer NOT NULL,
    fk_canal uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    droit_acces public.canal_access_type DEFAULT 'lecture'::public.canal_access_type NOT NULL,
    date_ajout timestamp with time zone DEFAULT now()
);


ALTER TABLE public.membre_canal OWNER TO rootmath;

--
-- TOC entry 4553 (class 0 OID 0)
-- Dependencies: 253
-- Name: TABLE membre_canal; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.membre_canal IS 'Stocke les droits d''accès des membres aux canaux privés';


--
-- TOC entry 4554 (class 0 OID 0)
-- Dependencies: 253
-- Name: COLUMN membre_canal.droit_acces; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.membre_canal.droit_acces IS 'Type d''accès: lecture (read-only) ou lecture_ecriture (read-write)';


--
-- TOC entry 252 (class 1259 OID 303259)
-- Name: membre_canal_id_membre_canal_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.membre_canal_id_membre_canal_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.membre_canal_id_membre_canal_seq OWNER TO rootmath;

--
-- TOC entry 4556 (class 0 OID 0)
-- Dependencies: 252
-- Name: membre_canal_id_membre_canal_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.membre_canal_id_membre_canal_seq OWNED BY public.membre_canal.id_membre_canal;


--
-- TOC entry 228 (class 1259 OID 82307)
-- Name: membre_workspace; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.membre_workspace (
    fk_utilisateur uuid NOT NULL,
    fk_workspace uuid NOT NULL,
    fk_role integer NOT NULL,
    ordre integer DEFAULT 0
);


ALTER TABLE public.membre_workspace OWNER TO rootmath;

--
-- TOC entry 223 (class 1259 OID 82264)
-- Name: message; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message (
    id_message uuid DEFAULT public.random_uuid() NOT NULL,
    contenu text,
    type_message character varying(50),
    date_envoi timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fk_canal uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    parent_id uuid
);


ALTER TABLE public.message OWNER TO rootmath;

--
-- TOC entry 230 (class 1259 OID 82345)
-- Name: message_fichier; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message_fichier (
    fk_message uuid NOT NULL,
    fk_fichier uuid NOT NULL
);


ALTER TABLE public.message_fichier OWNER TO rootmath;

--
-- TOC entry 231 (class 1259 OID 82360)
-- Name: message_hashtag; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message_hashtag (
    fk_message uuid NOT NULL,
    fk_hashtag uuid NOT NULL
);


ALTER TABLE public.message_hashtag OWNER TO rootmath;

--
-- TOC entry 232 (class 1259 OID 82375)
-- Name: message_mention; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message_mention (
    fk_message uuid NOT NULL,
    fk_utilisateur uuid NOT NULL
);


ALTER TABLE public.message_mention OWNER TO rootmath;

--
-- TOC entry 239 (class 1259 OID 229490)
-- Name: message_prive; Type: TABLE; Schema: public; Owner: rootmath
--

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
    parent_id uuid
);


ALTER TABLE public.message_prive OWNER TO rootmath;

--
-- TOC entry 4563 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE message_prive; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.message_prive IS 'Stocke les messages privés échangés entre deux utilisateurs';


--
-- TOC entry 234 (class 1259 OID 122921)
-- Name: message_prive_fichier; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message_prive_fichier (
    fk_message_prive uuid NOT NULL,
    fk_fichier uuid NOT NULL
);


ALTER TABLE public.message_prive_fichier OWNER TO rootmath;

--
-- TOC entry 244 (class 1259 OID 253972)
-- Name: message_read; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message_read (
    id integer NOT NULL,
    fk_user uuid NOT NULL,
    fk_canal uuid NOT NULL,
    last_read_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.message_read OWNER TO rootmath;

--
-- TOC entry 243 (class 1259 OID 253971)
-- Name: message_read_id_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.message_read_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_read_id_seq OWNER TO rootmath;

--
-- TOC entry 4567 (class 0 OID 0)
-- Dependencies: 243
-- Name: message_read_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.message_read_id_seq OWNED BY public.message_read.id;


--
-- TOC entry 242 (class 1259 OID 245848)
-- Name: message_with_alias; Type: VIEW; Schema: public; Owner: rootmath
--

CREATE VIEW public.message_with_alias AS
 SELECT id_message,
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


ALTER VIEW public.message_with_alias OWNER TO rootmath;

--
-- TOC entry 245 (class 1259 OID 262207)
-- Name: notification; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.notification (
    id_notification uuid DEFAULT gen_random_uuid() NOT NULL,
    fk_utilisateur uuid NOT NULL,
    type character varying(50) NOT NULL,
    contenu text NOT NULL,
    lien character varying(255),
    is_read boolean DEFAULT false,
    date_creation timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notification OWNER TO rootmath;

--
-- TOC entry 226 (class 1259 OID 82295)
-- Name: permission; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.permission (
    id_permission uuid DEFAULT public.random_uuid() NOT NULL,
    type_permission character varying(50) NOT NULL
);


ALTER TABLE public.permission OWNER TO rootmath;

--
-- TOC entry 247 (class 1259 OID 278627)
-- Name: private_message_reaction; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.private_message_reaction (
    id_reaction integer NOT NULL,
    fk_message_prive uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    reaction_type character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.private_message_reaction OWNER TO rootmath;

--
-- TOC entry 246 (class 1259 OID 278626)
-- Name: private_message_reaction_id_reaction_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.private_message_reaction_id_reaction_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.private_message_reaction_id_reaction_seq OWNER TO rootmath;

--
-- TOC entry 4573 (class 0 OID 0)
-- Dependencies: 246
-- Name: private_message_reaction_id_reaction_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.private_message_reaction_id_reaction_seq OWNED BY public.private_message_reaction.id_reaction;


--
-- TOC entry 238 (class 1259 OID 229471)
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    auth text NOT NULL,
    p256dh text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.push_subscriptions OWNER TO rootmath;

--
-- TOC entry 237 (class 1259 OID 229470)
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.push_subscriptions_id_seq OWNER TO rootmath;

--
-- TOC entry 4576 (class 0 OID 0)
-- Dependencies: 237
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- TOC entry 241 (class 1259 OID 245825)
-- Name: reaction; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.reaction (
    id_reaction integer NOT NULL,
    fk_message uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    reaction_type character varying(191) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reaction OWNER TO rootmath;

--
-- TOC entry 240 (class 1259 OID 245824)
-- Name: reaction_id_reaction_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.reaction_id_reaction_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reaction_id_reaction_seq OWNER TO rootmath;

--
-- TOC entry 4579 (class 0 OID 0)
-- Dependencies: 240
-- Name: reaction_id_reaction_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.reaction_id_reaction_seq OWNED BY public.reaction.id_reaction;


--
-- TOC entry 258 (class 1259 OID 303373)
-- Name: reminders; Type: TABLE; Schema: public; Owner: rootmath
--

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
    workspace_id integer,
    canal_id integer,
    email_failed boolean DEFAULT false,
    error_message text
);


ALTER TABLE public.reminders OWNER TO rootmath;

--
-- TOC entry 225 (class 1259 OID 82290)
-- Name: role; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.role (
    id_role integer NOT NULL,
    nom_role character varying(50) NOT NULL
);


ALTER TABLE public.role OWNER TO rootmath;

--
-- TOC entry 233 (class 1259 OID 82390)
-- Name: role_permission; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.role_permission (
    fk_role integer NOT NULL,
    fk_permission uuid NOT NULL
);


ALTER TABLE public.role_permission OWNER TO rootmath;

--
-- TOC entry 219 (class 1259 OID 82219)
-- Name: statut; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.statut (
    id_statut integer NOT NULL,
    label character varying(255) NOT NULL
);


ALTER TABLE public.statut OWNER TO rootmath;

--
-- TOC entry 220 (class 1259 OID 82224)
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: rootmath
--

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
    status_text character varying(100) DEFAULT NULL::character varying
);


ALTER TABLE public.utilisateur OWNER TO rootmath;

--
-- TOC entry 221 (class 1259 OID 82243)
-- Name: workspace; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.workspace (
    id_workspace uuid DEFAULT public.random_uuid() NOT NULL,
    nom character varying(255) NOT NULL,
    is_private boolean DEFAULT false,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    banner_url character varying(500),
    icon_url character varying(500),
    description text
);


ALTER TABLE public.workspace OWNER TO rootmath;

--
-- TOC entry 236 (class 1259 OID 229396)
-- Name: workspace_favoris; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.workspace_favoris (
    id_workspace_favoris integer NOT NULL,
    fk_utilisateur uuid NOT NULL,
    fk_workspace uuid NOT NULL,
    date_ajout timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workspace_favoris OWNER TO rootmath;

--
-- TOC entry 235 (class 1259 OID 229395)
-- Name: workspace_favoris_id_workspace_favoris_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.workspace_favoris_id_workspace_favoris_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workspace_favoris_id_workspace_favoris_seq OWNER TO rootmath;

--
-- TOC entry 4588 (class 0 OID 0)
-- Dependencies: 235
-- Name: workspace_favoris_id_workspace_favoris_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.workspace_favoris_id_workspace_favoris_seq OWNED BY public.workspace_favoris.id_workspace_favoris;


--
-- TOC entry 229 (class 1259 OID 82327)
-- Name: workspace_invitations; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.workspace_invitations (
    id_invitation uuid DEFAULT public.random_uuid() NOT NULL,
    fk_workspace uuid NOT NULL,
    email_invite character varying(255) NOT NULL,
    token_invitation character varying(255) NOT NULL,
    date_expiration timestamp without time zone NOT NULL,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.workspace_invitations OWNER TO rootmath;

--
-- TOC entry 4590 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE workspace_invitations; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.workspace_invitations IS 'Stocke les invitations envoyées aux utilisateurs pour rejoindre un workspace';


--
-- TOC entry 4591 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN workspace_invitations.token_invitation; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.workspace_invitations.token_invitation IS 'Token unique pour accepter l''invitation';


--
-- TOC entry 251 (class 1259 OID 303223)
-- Name: workspace_join_requests; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.workspace_join_requests (
    id_request integer NOT NULL,
    fk_workspace uuid NOT NULL,
    fk_utilisateur uuid NOT NULL,
    message text,
    statut character varying(20) DEFAULT 'en_attente'::character varying,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_traitement timestamp without time zone,
    fk_administrateur uuid,
    reject_reason text,
    CONSTRAINT workspace_join_requests_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_attente'::character varying, 'acceptee'::character varying, 'refusee'::character varying])::text[])))
);


ALTER TABLE public.workspace_join_requests OWNER TO rootmath;

--
-- TOC entry 250 (class 1259 OID 303222)
-- Name: workspace_join_requests_id_request_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.workspace_join_requests_id_request_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workspace_join_requests_id_request_seq OWNER TO rootmath;

--
-- TOC entry 4594 (class 0 OID 0)
-- Dependencies: 250
-- Name: workspace_join_requests_id_request_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.workspace_join_requests_id_request_seq OWNED BY public.workspace_join_requests.id_request;


--
-- TOC entry 4101 (class 2604 OID 286783)
-- Name: canal_lecture id_canal_lecture; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture ALTER COLUMN id_canal_lecture SET DEFAULT nextval('public.canal_lecture_id_canal_lecture_seq'::regclass);


--
-- TOC entry 4106 (class 2604 OID 303263)
-- Name: membre_canal id_membre_canal; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_canal ALTER COLUMN id_membre_canal SET DEFAULT nextval('public.membre_canal_id_membre_canal_seq'::regclass);


--
-- TOC entry 4094 (class 2604 OID 253975)
-- Name: message_read id; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_read ALTER COLUMN id SET DEFAULT nextval('public.message_read_id_seq'::regclass);


--
-- TOC entry 4099 (class 2604 OID 278630)
-- Name: private_message_reaction id_reaction; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction ALTER COLUMN id_reaction SET DEFAULT nextval('public.private_message_reaction_id_reaction_seq'::regclass);


--
-- TOC entry 4084 (class 2604 OID 229474)
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- TOC entry 4092 (class 2604 OID 245828)
-- Name: reaction id_reaction; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction ALTER COLUMN id_reaction SET DEFAULT nextval('public.reaction_id_reaction_seq'::regclass);


--
-- TOC entry 4082 (class 2604 OID 229399)
-- Name: workspace_favoris id_workspace_favoris; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris ALTER COLUMN id_workspace_favoris SET DEFAULT nextval('public.workspace_favoris_id_workspace_favoris_seq'::regclass);


--
-- TOC entry 4103 (class 2604 OID 303226)
-- Name: workspace_join_requests id_request; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_join_requests ALTER COLUMN id_request SET DEFAULT nextval('public.workspace_join_requests_id_request_seq'::regclass);


--
-- TOC entry 4057 (class 0 OID 303297)
-- Dependencies: 255
-- Data for Name: job; Type: TABLE DATA; Schema: cron; Owner: azuresu
--

COPY cron.job (jobid, schedule, command, nodename, nodeport, database, username, active, jobname) FROM stdin;
\.


--
-- TOC entry 4059 (class 0 OID 303316)
-- Dependencies: 257
-- Data for Name: job_run_details; Type: TABLE DATA; Schema: cron; Owner: azuresu
--

COPY cron.job_run_details (jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time) FROM stdin;
\.


--
-- TOC entry 4415 (class 0 OID 82251)
-- Dependencies: 222
-- Data for Name: canal; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.canal (id_canal, nom, is_private, date_creation, fk_workspace, updated_at) FROM stdin;
84f03094-c2df-24d7-6257-8bf9e1993b58	test	f	2025-04-26 16:56:38.164983	d4f1cff0-3ef5-7ab1-e654-c05894915c31	\N
07d1837c-59fe-d357-906a-acd22d3e162a	Horraire	f	2025-04-28 07:24:23.988836	d4f1cff0-3ef5-7ab1-e654-c05894915c31	\N
b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	files	f	2025-04-28 13:08:05.531983	d4f1cff0-3ef5-7ab1-e654-c05894915c31	\N
5d159045-e695-98e8-8462-5f5108f021ee	sdmknvnsdkm	f	2025-05-08 12:11:22.980095	6eeddc21-d56a-e978-b0c1-384e3f6cf186	\N
167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	aa	f	2025-05-08 14:27:45.450127	c6d5d602-9fd0-99c7-1654-65c23b0cd792	\N
de06e22f-9eeb-4a6d-351c-9e5143b4edbf	nouveau canal	f	2025-05-12 11:31:05.549489	4e94fed5-a879-6084-8eb7-ace5aa6c6236	\N
fa94bcbf-c844-5a0a-b699-37f59efa1916	canal privé	t	2025-05-18 14:52:05.894512	6eeddc21-d56a-e978-b0c1-384e3f6cf186	\N
9e115ae6-6b12-5f07-99a8-3497de2fef25	test	t	2025-05-19 09:23:16.450403	6eeddc21-d56a-e978-b0c1-384e3f6cf186	2025-05-19 11:50:30.400871
\.


--
-- TOC entry 4441 (class 0 OID 286780)
-- Dependencies: 249
-- Data for Name: canal_lecture; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.canal_lecture (id_canal_lecture, fk_utilisateur, fk_canal, derniere_lecture) FROM stdin;
47	a5c1b268-937f-af11-4ca2-2c96634fbe2e	9e115ae6-6b12-5f07-99a8-3497de2fef25	2025-05-28 15:06:15.286929+00
41	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5d159045-e695-98e8-8462-5f5108f021ee	2025-05-17 16:03:18.485621+00
23	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-26 14:26:45.423911+00
16	c8eb671d-f3b4-41f6-7364-0f292619dfdc	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-28 15:10:13.418843+00
31	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-26 14:26:46.22716+00
18	c8eb671d-f3b4-41f6-7364-0f292619dfdc	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-28 15:10:21.053575+00
42	a5c1b268-937f-af11-4ca2-2c96634fbe2e	fa94bcbf-c844-5a0a-b699-37f59efa1916	2025-05-28 15:16:39.898751+00
49	a5c1b268-937f-af11-4ca2-2c96634fbe2e	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	2025-05-28 15:35:21.959495+00
46	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	fa94bcbf-c844-5a0a-b699-37f59efa1916	2025-05-19 08:27:25.274939+00
26	a5c1b268-937f-af11-4ca2-2c96634fbe2e	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-28 15:36:19.472037+00
21	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-20 13:29:50.191767+00
37	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	de06e22f-9eeb-4a6d-351c-9e5143b4edbf	2025-05-17 15:55:45.990634+00
45	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	5d159045-e695-98e8-8462-5f5108f021ee	2025-05-19 11:03:27.133895+00
40	bb6a4d43-70d3-5e36-d943-dfdfc747491f	de06e22f-9eeb-4a6d-351c-9e5143b4edbf	2025-05-17 14:08:22.645749+00
12	bb6a4d43-70d3-5e36-d943-dfdfc747491f	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-26 07:43:53.852678+00
17	c8eb671d-f3b4-41f6-7364-0f292619dfdc	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-28 15:10:17.014304+00
27	a5c1b268-937f-af11-4ca2-2c96634fbe2e	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-28 15:35:16.636039+00
48	c8eb671d-f3b4-41f6-7364-0f292619dfdc	9e115ae6-6b12-5f07-99a8-3497de2fef25	2025-05-28 15:06:07.231318+00
43	c8eb671d-f3b4-41f6-7364-0f292619dfdc	fa94bcbf-c844-5a0a-b699-37f59efa1916	2025-05-28 15:06:07.738734+00
22	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-20 13:38:47.619683+00
28	a5c1b268-937f-af11-4ca2-2c96634fbe2e	5d159045-e695-98e8-8462-5f5108f021ee	2025-05-28 15:04:53.106845+00
44	c8eb671d-f3b4-41f6-7364-0f292619dfdc	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	2025-05-28 15:10:04.431686+00
25	a5c1b268-937f-af11-4ca2-2c96634fbe2e	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-28 15:35:17.787545+00
13	bb6a4d43-70d3-5e36-d943-dfdfc747491f	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-27 13:23:08.177049+00
19	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-26 13:33:42.992685+00
20	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-27 14:03:21.651842+00
30	c8eb671d-f3b4-41f6-7364-0f292619dfdc	5d159045-e695-98e8-8462-5f5108f021ee	2025-05-28 14:46:06.083761+00
14	bb6a4d43-70d3-5e36-d943-dfdfc747491f	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-20 14:48:30.923488+00
\.


--
-- TOC entry 4417 (class 0 OID 82281)
-- Dependencies: 224
-- Data for Name: fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.fichier (id_fichier, nom_fichier, url, type, date_upload, taille_fichier, extension, mime_type, fk_utilisateur) FROM stdin;
da1f8bd2-c427-0539-ce31-0b50cbedb844	71IF1ngy57L._AC_UF1000,1000_QL80_.jpg	private-messages/files/b22bd468-19f2-4c77-95f9-f6a877ad3a6b.jpg	image/jpeg	2025-05-13 07:50:08.341694	56178	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
52680330-d909-a40c-34be-777b7c4b125e	fiche_loutre_carre.jpg	private-messages/files/8c1da0de-0c2d-49ec-a9ec-30999993f513.jpg	image/jpeg	2025-05-13 11:24:08.8348	216444	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
68afd927-e966-d8fc-951e-757685f6963f	3TPMG - Ordre de passage (1).pdf	private-messages/files/7ae09821-118c-4e34-9ae9-3c6674078859.pdf	application/pdf	2025-05-13 12:08:19.618515	532794	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
c41cd366-20bb-8b99-7f82-db394871e4f3	3TPMG - Ordre de passage (1).pdf	private-messages/files/c71a09a4-5d61-426b-a9c4-2309cd07d310.pdf	application/pdf	2025-05-13 12:08:44.603743	532794	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
f80b3869-ec66-0699-52b3-bde225a46e5a	fiche_loutre_carre.jpg	private-messages/files/b87ac6c3-aef3-454d-983c-68f5f1255863.jpg	image/jpeg	2025-05-13 12:30:29.011271	216444	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
458b37aa-952b-6616-a3e6-3f262e32f5b3	COMCell_Message 1 (ID 1111)_LS.mp3	private-messages/files/8c08736f-a7fa-4076-88bd-5f86db40278f.mp3	audio/mpeg	2025-05-13 14:24:07.500037	256548	\N	\N	c8eb671d-f3b4-41f6-7364-0f292619dfdc
0eea74ab-f389-0dea-f281-570cbb2f9eaa	fiche_loutre_carre.jpg	private-messages/files/e04213e7-b157-44be-a0af-51256ace82a4.jpg	image/jpeg	2025-05-17 09:43:09.942165	216444	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
ba843738-a9f6-8fa0-8f51-582cd699f967	images (4).jpg	private-messages/files/c56419ed-f35e-4100-88b9-adb6fadcaf46.jpg	image/jpeg	2025-05-19 10:59:04.537057	4524	\N	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f
a2ea8ffc-fe7d-d12c-c389-3c4dc41c44aa	images (4).jpg	private-messages/files/687f3180-9fda-4104-98e5-bb124649a89f.jpg	image/jpeg	2025-05-19 13:30:14.317658	4524	\N	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f
2aad3b4e-4ea5-1346-6415-d33020ef7dc7	cout-rat-domestique-093828-650-400.jpg	private-messages/files/fbeca14a-3e4a-4dea-9db5-9b60cec9c0db.jpg	image/jpeg	2025-05-19 14:49:35.329609	188480	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
81613684-1260-6ce0-3d56-d43fa9f5dfc4	8fea42c8-7f58-45fc-a98a-3d3377024f31 (9).csv	private-messages/files/7da544ae-3edf-4401-a6a8-3d59842d72d6.csv	text/csv	2025-05-19 14:49:48.516606	99	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
d46a8bd2-4951-8b8a-f6a8-84c8669bf2bb	Ragondin-et-sa-dent..jpg	private-messages/files/f66f5869-4048-46de-8baf-7543dc8cd388.jpg	image/jpeg	2025-05-20 11:25:30.281912	516080	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
fb71c3fa-e1da-2d84-d220-19ec10ef5b5c	cout-rat-domestique-093828-650-400.jpg	private-messages/files/4271b408-cd57-4a49-b990-8a8b6ee11b45.jpg	image/jpeg	2025-05-20 11:27:16.272591	188480	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
9a854c96-28ce-1b7e-82f8-cedf3b7463d1	cout-rat-domestique-093828-650-400.jpg	private-messages/files/2f861527-b7e1-4e42-bc51-f21d5bf31c1c.jpg	image/jpeg	2025-05-20 11:30:12.827228	188480	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
1293cf8e-405e-fcf1-d0e4-424288c0b4ea	Ragondin-et-sa-dent..jpg	private-messages/files/e0b226e0-6c80-4414-93cd-db901260c765.jpg	image/jpeg	2025-05-20 11:37:54.634654	516080	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
4a17e600-3f57-7db9-b85b-01da0878c772	postgres_-_public.png	private-messages/files/a14f1c3f-9304-48a6-a14a-b0425f7d56db.png	image/png	2025-05-20 11:38:18.574617	148766	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
5d4be682-4105-0d0b-7b2e-859e61e1be9d	cout-rat-domestique-093828-650-400.jpg	private-messages/files/7d01d30a-a0b1-4b52-ae14-ecee5eef4c3a.jpg	image/jpeg	2025-05-20 11:47:47.393026	188480	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
541360e0-a8ff-4cdb-5ca9-a25794f02d6b	fiche_loutre_carre.jpg	private-messages/files/6dab0fc3-9c1f-4452-b0e5-8e9c1ae13853.jpg	image/jpeg	2025-05-20 11:48:47.521538	216444	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
f7aa8292-cee8-3330-80c8-3b17a035812a	Ragondin-et-sa-dent..jpg	private-messages/files/f1ae0e73-775c-4119-a502-7198687cb85a.jpg	image/jpeg	2025-05-20 11:56:03.129974	516080	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
26dd04b2-eafc-7844-e3b6-9cd4aa1e9f43	cout-rat-domestique-093828-650-400.jpg	private-messages/files/f3491da7-c973-49b0-812e-e0eaf91d48de.jpg	image/jpeg	2025-05-20 11:59:24.552134	188480	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
49f56282-a0e6-5e66-1fcb-a06dcf322aa6	fiche_loutre_carre.jpg	private-messages/files/f7beb41f-e651-406e-85de-3d8f9612d1d1.jpg	image/jpeg	2025-05-20 12:09:41.84744	216444	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
de98a8e8-5b2a-3702-233b-b0a23c121f2f	cout-rat-domestique-093828-650-400.jpg	private-messages/files/4afb306e-ddc2-45fb-8202-67acf0bf24b1.jpg	image/jpeg	2025-05-20 12:12:12.811783	188480	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
7c8b26fc-42a2-60b1-52f7-ded15916b9a3	Dbn90RNQxFi2.jpg	private-messages/files/d795e08b-9c96-450b-a2c9-f2f642fec0b8.jpg	image/jpeg	2025-05-20 12:13:20.367773	50292	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
e6649839-2a53-b9fe-19db-91260a01e454	github.png	private-messages/files/2667a1d0-8f74-47a6-a91b-763f282cebed.png	image/png	2025-05-20 12:49:38.332675	13104	\N	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e
5d527ee9-3dc4-7aa6-4874-2eaed5c37d34	github-2.png	private-messages/files/bafe46e7-9fed-494a-bffc-6ca1f4eb2dcd.png	image/png	2025-05-20 12:50:03.388699	17237	\N	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e
90b1f7c8-5db5-91af-6f02-962a6841ce34	google.png	private-messages/files/c4d27850-5757-4ffc-8b8d-791d82b8b397.png	image/png	2025-05-20 12:52:12.247596	20865	\N	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e
e27f453f-1cb4-b58e-3bb4-0ef7e44f3c94	8fea42c8-7f58-45fc-a98a-3d3377024f31 (2).csv	private-messages/files/cc6d9004-628b-403f-b734-e1179a8ee8ea.csv	text/csv	2025-05-20 13:59:19.672795	99	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
32b13ecb-75be-06dc-e328-55b5bdd90e02	8fea42c8-7f58-45fc-a98a-3d3377024f31 (9).csv	private-messages/files/5c4fc14e-8a4a-4214-bbec-5347f12f0697.csv	text/csv	2025-05-26 08:06:32.317075	99	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
0d757be7-dd73-7774-e2f6-908331b3de80	cout-rat-domestique-093828-650-400.jpg	private-messages/files/ff72ca03-5e66-4dab-ab06-dc30030f4db5.jpg	image/jpeg	2025-05-26 08:47:44.993307	188480	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
\.


--
-- TOC entry 4420 (class 0 OID 82301)
-- Dependencies: 227
-- Data for Name: hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.hashtag (id_hashtag, label) FROM stdin;
\.


--
-- TOC entry 4445 (class 0 OID 303260)
-- Dependencies: 253
-- Data for Name: membre_canal; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.membre_canal (id_membre_canal, fk_canal, fk_utilisateur, droit_acces, date_ajout) FROM stdin;
8	9e115ae6-6b12-5f07-99a8-3497de2fef25	a5c1b268-937f-af11-4ca2-2c96634fbe2e	lecture	2025-05-19 09:23:25.041187+00
9	fa94bcbf-c844-5a0a-b699-37f59efa1916	a5c1b268-937f-af11-4ca2-2c96634fbe2e	lecture	2025-05-28 15:05:50.030888+00
\.


--
-- TOC entry 4421 (class 0 OID 82307)
-- Dependencies: 228
-- Data for Name: membre_workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.membre_workspace (fk_utilisateur, fk_workspace, fk_role, ordre) FROM stdin;
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c6d5d602-9fd0-99c7-1654-65c23b0cd792	3	0
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	9e0d7df7-d222-ef58-c1ce-4d431e0a0f47	1	0
c8eb671d-f3b4-41f6-7364-0f292619dfdc	c6d5d602-9fd0-99c7-1654-65c23b0cd792	3	0
a5c1b268-937f-af11-4ca2-2c96634fbe2e	c6d5d602-9fd0-99c7-1654-65c23b0cd792	3	0
a5c1b268-937f-af11-4ca2-2c96634fbe2e	6eeddc21-d56a-e978-b0c1-384e3f6cf186	3	0
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	6eeddc21-d56a-e978-b0c1-384e3f6cf186	3	0
c8eb671d-f3b4-41f6-7364-0f292619dfdc	d4f1cff0-3ef5-7ab1-e654-c05894915c31	1	0
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
bb6a4d43-70d3-5e36-d943-dfdfc747491f	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
a5c1b268-937f-af11-4ca2-2c96634fbe2e	d4f1cff0-3ef5-7ab1-e654-c05894915c31	3	0
c8eb671d-f3b4-41f6-7364-0f292619dfdc	6eeddc21-d56a-e978-b0c1-384e3f6cf186	1	0
bb6a4d43-70d3-5e36-d943-dfdfc747491f	c6d5d602-9fd0-99c7-1654-65c23b0cd792	3	0
bb6a4d43-70d3-5e36-d943-dfdfc747491f	4e94fed5-a879-6084-8eb7-ace5aa6c6236	3	0
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	4e94fed5-a879-6084-8eb7-ace5aa6c6236	2	0
fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
\.


--
-- TOC entry 4416 (class 0 OID 82264)
-- Dependencies: 223
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message (id_message, contenu, type_message, date_envoi, fk_canal, fk_utilisateur, created_at, updated_at, parent_id) FROM stdin;
bf30e4f1-4022-a33b-698d-c5ef3c797049	sd	\N	2025-04-28 17:48:55.3491	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:48:55.3491	\N	\N
b4ad6693-f23c-af61-2355-ed8087f592e0	caca prout	\N	2025-04-28 17:52:03.342694	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:52:03.342694	\N	\N
0215bc84-00c3-0a1b-8e29-35133dcb2840	efzefze	\N	2025-04-29 11:34:56.403319	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 11:34:56.403319	\N	\N
9458090d-eba6-0f9c-05df-ee70efd07e85	sdfsdf	\N	2025-04-29 12:30:38.545664	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:30:38.545664	\N	\N
6b10ef9c-0d16-6400-4247-c9c9640177b5	qsfqs	\N	2025-04-29 12:32:51.862427	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:32:51.862427	\N	\N
4c15a27c-5ce5-18f2-21ee-08082ef061cb	zer	\N	2025-04-29 12:35:24.410517	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:24.410517	\N	\N
dba3fea9-6dd2-ca29-78b8-5ee454fda2b5	zer	\N	2025-04-29 12:35:24.515808	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:24.515808	\N	\N
0bfd8b14-f6a6-ea98-74f7-665b76e590cc	g	\N	2025-04-29 12:35:25.19442	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:25.19442	\N	\N
f649afea-a86c-d337-ffa2-d1956c134e73	g	\N	2025-04-29 12:35:27.282567	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:27.282567	\N	\N
8cf9b959-69cd-76fa-a935-42acdea512c7	h	\N	2025-04-29 12:35:28.390404	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:28.390404	\N	\N
a24d3500-cdae-bfe3-3c6a-b4dd82175a78	e	\N	2025-04-29 12:35:28.56246	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:28.56246	\N	\N
dd1fd6ed-29d5-72fb-40a6-bcaa39c123c9	tyh	\N	2025-04-29 12:35:28.757344	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:28.757344	\N	\N
87e068b4-4869-d9d7-b0b2-1ca1b942103c	y	\N	2025-04-29 12:35:28.918512	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:28.918512	\N	\N
527facdd-2e15-4aa2-893f-c5bae1cccdc2	Salut	\N	2025-04-28 17:44:07.508414	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:07.508414	\N	\N
157fc010-1e02-fbf8-88ef-b0223a96e374	sdf	\N	2025-04-28 17:44:51.288272	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:51.288272	\N	\N
195db01f-0544-9103-6679-0b5aee053774	f	\N	2025-04-28 17:44:56.14847	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:56.14847	\N	\N
3b971400-0aa7-b9ef-24c0-723af8c10aaa	sdf	\N	2025-04-28 17:44:56.329892	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:56.329892	\N	\N
3760c9b7-4d43-195d-73c2-decc98b18b0f	sd	\N	2025-04-28 17:44:56.657425	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:56.657425	\N	\N
6044caf8-7d4a-a2bc-4adc-5dd5f394ef27	f	\N	2025-04-28 17:44:56.790323	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:56.790323	\N	\N
8af52cf3-60cf-4051-3f46-92a49196ddbd	sdf	\N	2025-04-28 17:44:56.95947	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:56.95947	\N	\N
1a6da5bf-94aa-9c17-c5d8-e2b4be2e6ec9	sdf	\N	2025-04-28 17:45:00.32881	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:45:00.32881	\N	\N
26d14fc4-2e91-0653-7bc3-501f7254025a	ds	\N	2025-04-28 17:45:00.488209	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:45:00.488209	\N	\N
b267fc74-d2ee-2893-a5b0-168f60a92a11	ju	\N	2025-04-29 12:35:29.206975	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:29.206975	\N	\N
348ef1fd-6716-0caa-be01-87f8cf28d427	j	\N	2025-04-29 12:35:29.377145	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:29.377145	\N	\N
7d39be2a-406f-afad-9897-95ef3a56e9cd	u	\N	2025-04-29 12:35:29.529167	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:29.529167	\N	\N
6b308655-86c5-c3f5-4442-d6ce0882e205	k	\N	2025-04-29 12:35:29.653493	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:29.653493	\N	\N
6615f294-cd75-06db-260b-70b9e5448ecc	ui	\N	2025-04-29 12:35:29.836021	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:29.836021	\N	\N
db0296e1-1951-f775-6e76-fe8f1b751dd0	lo	\N	2025-04-29 12:35:29.979513	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:29.979513	\N	\N
dbf16644-91ad-a288-3c3f-578a361f3231	ui	\N	2025-04-29 12:35:30.082072	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:30.082072	\N	\N
518e628c-6481-815f-d4f1-79c8d01e7d2e	l	\N	2025-04-29 12:35:30.219229	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:30.219229	\N	\N
dd107636-456d-f1ed-bd76-d5cd44294dee	k	\N	2025-04-29 12:35:30.533134	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:30.533134	\N	\N
2bb12948-8936-6e4c-d45c-764d9ec1bbfc	rt	\N	2025-04-29 12:35:30.687696	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:30.687696	\N	\N
f5b41d10-60ac-5b10-be4e-d6d052566345	gbz	\N	2025-04-29 12:35:30.843234	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:30.843234	\N	\N
9f16e05b-32b4-4df4-4af0-b987490daef5	r	\N	2025-04-29 12:35:30.986979	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:30.986979	\N	\N
c2c3bf07-55ac-2966-4de1-5028309fb807	gze	\N	2025-04-29 12:35:31.163942	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:31.163942	\N	\N
e5ae923b-fb5e-03e7-62d2-d098c499086c	r	\N	2025-04-29 12:35:31.315011	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:31.315011	\N	\N
48b6856a-230f-f11c-fd0b-cd16734fa90a	gfez	\N	2025-04-29 12:35:31.51956	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:31.51956	\N	\N
afc4d70c-77d8-f372-164b-353175773497	{"type":"file","fileUrl":"messages/files/825dd71a-8f8e-444d-8a20-823487a6c8a7.pdf","fileName":"3TPMG - Ordre de passage.pdf","fileSize":532794,"fileType":"application/pdf","isImage":false}	\N	2025-04-29 12:35:38.804107	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:38.804107	\N	\N
60f0a1d9-56be-ef2a-4b43-f5c85481a107	test	\N	2025-04-29 12:39:35.494853	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:39:35.494853	\N	\N
dfc1bb07-28a8-acb9-f772-965a5ec430a3	Sondage créé : [ksndv](https://strawpoll.com/6QnMQrDA8ne)	\N	2025-04-29 14:01:30.755175	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 14:01:30.755175	\N	\N
045c5f9f-1946-b5db-e6aa-9c391516be4a	Sondage créé : [jkblblknlmk](https://strawpoll.com/wby5Q8D0kyA)	\N	2025-04-29 14:15:28.985479	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 14:15:28.985479	\N	\N
ebc88f65-4ec0-d815-1c7f-72f859510624	test	\N	2025-05-04 13:41:50.02628	84f03094-c2df-24d7-6257-8bf9e1993b58	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 13:41:50.02628	\N	\N
50d89d14-7489-e2e9-61f8-0e3f4c4922d2	qsfqsfqsfqsfqsfqsqsfqsfqsfqsfqsfq	\N	2025-05-04 14:54:50.32514	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 14:54:50.32514	\N	\N
0f7262df-5f5b-8991-9765-baccf9dfdcbe	{"type":"file","fileUrl":"messages/files/6da09847-54b3-4eb5-a31a-d9ca9bd4d25f.png","fileName":"baniere_default.png","fileSize":17960,"fileType":"image/png","isImage":true}	\N	2025-05-04 15:22:58.427503	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 15:22:58.427503	\N	\N
35d81955-e795-6ba1-b7c5-8abf3ff592d1	test	\N	2025-05-04 16:03:05.073417	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-04 16:03:05.073417	\N	\N
d4dc34f2-0b03-6e3f-5b49-5d4971afed58	qsdfqsfqs	\N	2025-05-05 11:53:03.814009	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-05 11:53:03.814009	\N	\N
aab642a6-88c7-b764-5019-0baac0c43786	qsdqsd	\N	2025-05-05 11:53:09.979307	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-05 11:53:09.979307	\N	\N
15a3ee0a-1113-e4cd-9c38-65c6cb8ebbe2	{"type":"file","fileUrl":"messages/files/e9623f5b-d663-474a-945b-b579d7deea5f.png","fileName":"baniere_default.png","fileSize":17960,"fileType":"image/png","isImage":true}	\N	2025-05-05 11:53:16.055167	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-05 11:53:16.055167	\N	\N
7f236187-d8d5-e14b-0d8b-776cc32cc1e2	qsdqsdqs	\N	2025-05-05 11:53:27.322801	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-05 11:53:27.322801	\N	c924cbc4-2e5e-ec12-e13a-d28980db9d1b
3152d6ce-b630-f6c7-3a7a-09115005f714	fsdfsd	\N	2025-05-05 12:41:29.937017	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-05 12:41:29.937017	\N	\N
7a24a4ff-eb71-854a-b540-721b231dfaab	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:03:33.522963	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:03:33.522963	\N	\N
f7ce54dc-e1de-274e-4879-b95fb5039362	raer	\N	2025-05-05 13:14:55.485289	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-05 13:14:55.485289	\N	\N
2dd8a1b6-ca81-53e5-f7a4-508611743049	dazda	\N	2025-05-05 13:16:51.685117	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-05 13:16:51.685117	\N	\N
9263e794-8e46-4021-a2e7-0171553fbe24	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:16:52.895765	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:16:52.895765	\N	\N
e3688a43-5f79-5be1-7cf5-6388c2ee22c9	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:23:36.226275	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:23:36.226275	\N	\N
d52d944f-6955-bb12-2d75-948bf00a7d04	mmmmm	\N	2025-05-05 13:39:30.47258	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-05 13:39:30.47258	\N	\N
bb9420b4-885f-2328-b2d5-efb188f6fab0	gvhjbkbhjbhj	\N	2025-05-05 18:41:46.657972	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-05 18:41:46.657972	\N	\N
17e2f0b1-6fe6-78fd-7b9f-be7911a0cf72	iojoijpoj	\N	2025-05-06 08:10:15.669232	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-06 08:10:15.669232	\N	\N
618686b5-8563-4185-4c96-de1a1791fb78	@Mistral AI salut	\N	2025-05-06 09:33:05.425662	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 09:33:05.425662	\N	\N
6aea65bf-c3eb-4d12-93c1-37d1f5c3d5ba	Salut ! Comment puis-je vous aider aujourd'hui ?	\N	2025-05-06 09:33:05.93843	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000001	2025-05-06 09:33:05.93843	\N	\N
48e9db76-b545-2ced-f585-40a84b56e675	Sondage créé : [SALUT](https://strawpoll.com/XOgOVrLl4n3) [strawpoll:XOgOVrLl4n3]	\N	2025-05-06 12:49:48.414433	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 12:49:48.414433	\N	\N
5aa7a2d8-01d6-aff4-0dfb-e7aaf741f8a7	f	\N	2025-05-06 13:13:04.507029	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 13:13:04.507029	\N	\N
cd7598c8-dbaf-a142-10fc-5655071eba69	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) Salut 	\N	2025-05-06 14:42:31.730746	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 14:42:31.730746	\N	\N
4d02b92a-192e-5406-5d68-457608c8b3e5	@[Math'BigDick](bb6a4d43-70d3-5e36-d943-dfdfc747491f) 	\N	2025-05-06 14:46:20.331822	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 14:46:20.331822	\N	\N
2c2248b6-5c77-979c-8dde-76455864a195	dsfsdf	\N	2025-04-28 17:49:04.761598	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:49:04.761598	\N	\N
cf875d8b-2c8e-417a-a650-82cbfdef96ce	rzerzerzer	\N	2025-04-28 17:52:53.001842	84f03094-c2df-24d7-6257-8bf9e1993b58	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-28 17:52:53.001842	\N	\N
7864211b-a168-9d8a-d18b-b5362d48949b	sdfsdf	\N	2025-04-29 12:27:20.66607	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:27:20.66607	\N	\N
10b686d1-4219-dfd3-d407-a7e1ccf04856	sdfsdf	\N	2025-04-29 12:31:15.904327	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:31:15.904327	\N	\N
888d4240-93af-8034-11c5-af2cc1884284	sd	\N	2025-04-29 12:35:22.066381	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:22.066381	\N	\N
0b2702cd-72c3-4aa0-7f7f-8f289089ca8e	sdg	\N	2025-04-29 12:35:22.229049	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:22.229049	\N	\N
7df2e123-5a54-33bb-64bd-fab577121d63	sg	\N	2025-04-29 12:35:22.387826	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:22.387826	\N	\N
450de9cf-c5ab-0243-8301-dcc93933df06	sd	\N	2025-04-29 12:35:22.52754	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:22.52754	\N	\N
1f62a612-97b4-c969-39c3-8781b5616ecd	g	\N	2025-04-29 12:35:22.661468	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:22.661468	\N	\N
a2defdba-b5b4-4f78-ce32-1cb78c5a7a0f	sdg	\N	2025-04-29 12:35:22.812151	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:22.812151	\N	\N
bbfa999d-ed9f-b943-5503-39edda87a462	s	\N	2025-04-29 12:35:22.937508	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:22.937508	\N	\N
b6e39a74-c170-8afc-b14b-e884ca72b86e	dg	\N	2025-04-29 12:35:23.084367	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:23.084367	\N	\N
d33dc6e7-a621-c3f0-3d00-5f81b4c16218	sd	\N	2025-04-29 12:35:23.228261	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:23.228261	\N	\N
29444520-02ec-dae0-45d6-63c9bb1bd4f0	eszgfvzsd	\N	2025-04-28 17:44:49.849349	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:49.849349	\N	\N
2c89027f-380b-c287-3096-3bf94bcd5903	sdf	\N	2025-04-28 17:44:50.742145	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:50.742145	\N	\N
35838f41-5d60-a59e-c828-14b3c7659fdf	f	\N	2025-04-28 17:44:51.417485	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:51.417485	\N	\N
f6a4560a-31ba-06db-706a-76cda714b04b	sdf	\N	2025-04-28 17:44:56.509105	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:56.509105	\N	\N
a6df27d3-cfc4-ade0-e4cd-e4535c60b1fa	fs	\N	2025-04-28 17:45:00.641922	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:45:00.641922	\N	\N
39a0eb80-e72a-fcb6-6899-250653e717b5	sd	\N	2025-04-28 17:45:01.229507	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:45:01.229507	\N	\N
ab4b550c-a953-679a-91e4-0cffe66e1edd	gs	\N	2025-04-29 12:35:23.37208	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:23.37208	\N	\N
65113553-13a7-f35d-0898-01a39c39a2fb	dg	\N	2025-04-29 12:35:23.492997	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:23.492997	\N	\N
0c2c65ca-f763-845d-9114-3b52800912b6	sd	\N	2025-04-29 12:35:23.636018	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:23.636018	\N	\N
81a9cfa7-0cb4-0c49-2e59-bfacec666a87	g	\N	2025-04-29 12:35:23.7599	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:23.7599	\N	\N
19c0fdcc-1df4-c943-6fd0-fc7b2a2ea9ea	sd	\N	2025-04-29 12:35:23.905141	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:23.905141	\N	\N
ab267052-caf6-f328-89f6-80f6fb0ec25d	dgsdg	\N	2025-04-29 12:35:27.151386	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:27.151386	\N	\N
07ac1da2-5b7a-b9f5-58c8-d84404f2ebdb	sd	\N	2025-04-29 12:35:27.301353	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:27.301353	\N	\N
daee84bf-6cc6-d023-32fe-535331389042	g	\N	2025-04-29 12:35:27.426587	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:27.426587	\N	\N
8ee543b1-3bbe-6c74-e634-b8630cc9e169	sdg	\N	2025-04-29 12:35:27.564964	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:27.564964	\N	\N
4a42355b-2b90-c40c-39fa-4f867b332515	sdg	\N	2025-04-29 12:35:27.713363	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:27.713363	\N	\N
66dd4b81-7bd8-cc6b-67ad-5884adb0ffbc	s	\N	2025-04-29 12:35:27.841764	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:27.841764	\N	\N
dc2d0d7e-dc33-cf83-f5a7-00af2b194065	g	\N	2025-04-29 12:35:27.97214	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:27.97214	\N	\N
531f68dd-e332-e695-5151-0417fe45db05	sdg	\N	2025-04-29 12:35:28.115589	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:28.115589	\N	\N
d00a5bd0-8683-6b55-10c1-bb83a8371f9b	sd	\N	2025-04-29 12:35:28.249044	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:28.249044	\N	\N
7188a05a-0c96-899d-991d-3f6b315657ad	g	\N	2025-04-29 12:35:28.380195	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:28.380195	\N	\N
f0d4ae02-b116-576e-2c22-273640815d10	sdg	\N	2025-04-29 12:35:28.532177	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:28.532177	\N	\N
1caaf3f4-55e7-e15c-fbed-fbae5957c6e7	sd	\N	2025-04-29 12:35:28.663136	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:28.663136	\N	\N
52d2d561-8ca9-9843-55b6-6fc428997f18	g	\N	2025-04-29 12:35:28.797654	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:28.797654	\N	\N
9dd68cb5-6c39-7299-0f74-865f7890b599	sdg	\N	2025-04-29 12:35:28.946333	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:28.946333	\N	\N
a108199d-3993-d5c5-922a-55879494fee7	sd	\N	2025-04-29 12:35:29.080805	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:29.080805	\N	\N
3de4f886-f473-422b-729e-73a543f13aa6	g	\N	2025-04-29 12:35:29.22376	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:29.22376	\N	\N
80395cce-9c21-2a2f-db0c-70588f8ec637	sdg	\N	2025-04-29 12:35:29.375107	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:29.375107	\N	\N
27516369-7e0b-9f1b-f5fe-026bfe13780c	sd	\N	2025-04-29 12:35:29.512172	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:29.512172	\N	\N
a47bb966-d23c-e8f1-00f4-ba274fbe4852	gsd	\N	2025-04-29 12:35:29.670964	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:29.670964	\N	\N
1155fed9-5b3c-1cb7-9593-9e3584514942	g	\N	2025-04-29 12:35:29.800574	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:29.800574	\N	\N
20617f0f-1f9e-9a2f-6c44-c567423fb6c2	sd	\N	2025-04-29 12:35:29.943156	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:29.943156	\N	\N
00c75618-f47b-599b-948f-debe6c17d6a8	gs	\N	2025-04-29 12:35:30.10671	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:30.10671	\N	\N
072afc55-c252-78c8-6926-5cea8ff03bad	g	\N	2025-04-29 12:35:30.234497	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:30.234497	\N	\N
ecf8d8c1-25a9-f375-fb75-9298a280b779	sd	\N	2025-04-29 12:35:30.374159	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:30.374159	\N	\N
73712e82-94e1-6764-1817-2bc3b6152c34	g	\N	2025-04-29 12:35:30.521267	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:30.521267	\N	\N
89c84c9e-474c-8cb2-7b23-41b98cfc2c73	sd	\N	2025-04-29 12:35:30.637746	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:30.637746	\N	\N
8de88500-2b44-5cc4-c06a-78437006a84b	g	\N	2025-04-29 12:35:30.793917	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:30.793917	\N	\N
c4901e75-4d3d-9fda-c8ae-bdab923b7aaa	sdg	\N	2025-04-29 12:35:30.931825	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:30.931825	\N	\N
c5d0d7eb-1ae7-d892-23a5-613620ba9b62	sdsdg	\N	2025-04-29 12:35:33.930745	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:33.930745	\N	\N
4059fb56-1122-2538-8c11-5813b54fa069	s	\N	2025-04-29 12:35:34.065507	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:34.065507	\N	\N
e96a2c20-034b-544f-d438-eadae637e89d	dg	\N	2025-04-29 12:35:34.200626	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:34.200626	\N	\N
933e8827-8d4e-e323-a544-6e3fb264f1e4	sd	\N	2025-04-29 12:35:34.347073	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:34.347073	\N	\N
a59e1cf6-1541-5692-1aff-e3b707cd4687	gsd	\N	2025-04-29 12:35:34.499395	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:34.499395	\N	\N
7a090dd7-1248-a7cc-0dfd-2bc717564126	g	\N	2025-04-29 12:35:34.633057	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:34.633057	\N	\N
faddc2ef-092e-8300-6943-40e88ea46e67	sdg	\N	2025-04-29 12:35:34.795161	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:34.795161	\N	\N
88be391f-ea2a-3b6e-0e3f-173bfa238172	sd	\N	2025-04-29 12:35:34.944199	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:34.944199	\N	\N
6ba02cb3-7386-6a32-224e-e1e2f053c18a	g	\N	2025-04-29 12:35:35.11116	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:35.11116	\N	\N
96b1913e-efbe-ed5c-daef-aa38f8827bd0	sg	\N	2025-04-29 12:35:35.379838	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:35.379838	\N	\N
12b2f604-12d5-0bba-8b54-4ccdab76e21f	d	\N	2025-04-29 12:35:35.537771	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:35.537771	\N	\N
a635c993-0884-ce77-0b78-3b698798d713	g	\N	2025-04-29 12:35:35.687331	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:35.687331	\N	\N
b58d7acc-343d-84c1-ea52-8b6ace4fa41c	s	\N	2025-04-29 12:35:35.809394	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:35.809394	\N	\N
e7403a41-eaef-9b6c-7904-e78477f9a600	test	\N	2025-04-29 12:36:40.1797	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:36:40.1797	\N	\N
094c6e03-f19d-5312-815f-66299ac4d38f	caca	\N	2025-04-29 12:42:04.098886	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:42:04.098886	\N	\N
b65c9e43-3f05-e9c2-c9b2-23a6cbd7a400	Sondage créé : [egtsd](https://strawpoll.com/X3nkPDBOLgE)	\N	2025-04-29 14:10:38.361909	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 14:10:38.361909	\N	\N
ca920007-1915-c7ed-b9bb-928505906db2	Sondage créé : [test](https://strawpoll.com/40Zm4jRQoga) [strawpoll:40Zm4jRQoga]	\N	2025-04-29 14:27:55.380692	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 14:27:55.380692	\N	\N
db1176fa-b5d3-30f6-e903-b63381b6f020	hh	\N	2025-04-30 09:58:01.060675	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-04-30 09:58:01.060675	\N	\N
73aed6c9-4009-87dc-ec7f-3999664be3ca	test	\N	2025-05-04 14:51:03.295684	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 14:51:03.295684	\N	\N
21cab17e-4769-e017-d3ab-463aa42765c0	test	\N	2025-05-04 15:18:46.24841	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 15:18:46.24841	\N	\N
24e2697a-bc78-a6a4-2c6e-e4bacf3dbbb5	Sondage créé : [zefqd](https://strawpoll.com/Q0Zp79evAgM) [strawpoll:Q0Zp79evAgM]	\N	2025-05-04 15:28:26.528865	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 15:28:26.528865	\N	\N
1599978b-1374-c7b6-d75f-3839fce5d205	sdf	\N	2025-04-28 17:49:12.881963	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:49:12.881963	\N	\N
6fa5656d-b6e0-51b6-d2f5-c661e659f5d9	sdf	\N	2025-04-28 17:49:18.742321	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:49:18.742321	\N	\N
446ea5b6-e47f-85b3-13ff-1327e9c367c6	sdfsdfs	\N	2025-04-29 12:30:06.047438	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:30:06.047438	\N	\N
5231622b-6c15-d319-5cfd-f3a59b848275	dffdssdf	\N	2025-04-29 12:32:08.066104	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:32:08.066104	\N	\N
cecf0c40-2cd9-615d-3436-33fa90cb0c6e	sdg	\N	2025-04-29 12:35:22.195929	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:35:22.195929	\N	\N
4d0f6450-3469-6109-2b7d-e3ed01824fbd	test	\N	2025-04-29 12:36:45.964251	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:36:45.964251	\N	\N
50e64509-e271-f462-e366-f525d1c8c8de	Sondage créé : [test](https://strawpoll.com/fr/test-1745934606719)	\N	2025-04-29 13:50:06.873336	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 13:50:06.873336	\N	\N
fc6c5636-a315-0fc6-ed62-89e53da69445	Sondage créé : [qsc](https://strawpoll.com/ajnE1DL0mnW)	\N	2025-04-29 14:10:52.84468	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 14:10:52.84468	\N	\N
e45e13b1-bacc-0e49-1c8a-a6e0cbde9d96	test	\N	2025-04-30 12:56:10.385897	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-04-30 12:56:10.385897	\N	\N
9bbb6ec9-072f-e64b-5fbd-386b931f152d	https://google.fr	\N	2025-05-04 14:54:10.476573	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 14:54:10.476573	\N	\N
f22e8050-5d28-d8c0-6459-333b2d84bdbb	sdfsdf	\N	2025-04-28 17:44:50.835926	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:50.835926	\N	\N
ee8f7d2b-6e12-8cde-b8e7-16111e571595	df	\N	2025-04-28 17:44:51.588932	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:51.588932	\N	\N
a5aac550-4656-78cd-1819-5eab775b572c	sdf	\N	2025-04-28 17:44:51.750711	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:51.750711	\N	\N
25a24d7b-8b34-b2d2-2b75-d194f3eade9f	sd	\N	2025-04-28 17:44:56.00914	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:56.00914	\N	\N
8f1752bf-e5cb-d6ba-ccae-941a26c8ee98	f	\N	2025-04-28 17:45:00.168942	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:45:00.168942	\N	\N
c2d63855-32ee-22f2-c7e8-9419c0887508	Sondage créé : [aefa](https://strawpoll.com/jVyG2DPE1Z7) [strawpoll:jVyG2DPE1Z7]	\N	2025-05-04 15:32:39.717303	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 15:32:39.717303	\N	\N
909fd896-5fe6-17d1-aca9-f83ab7182802	sfqs	\N	2025-05-05 12:29:56.048523	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-05 12:29:56.048523	\N	\N
c7e9efbf-01ea-6477-41c7-38ee8e087c02	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:08:31.596958	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:08:31.596958	\N	\N
f906dc92-84a0-dd1a-dea3-1aaa2bb32f25	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:15:16.346746	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:15:16.346746	\N	\N
40fb5e02-b8bb-9720-1753-d50976ca8857	kkk	\N	2025-05-05 13:20:06.916209	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-05 13:20:06.916209	\N	\N
40ca2eaf-9d97-de2f-6b82-00dd8de1dd1e	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:25:09.270378	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:25:09.270378	\N	\N
f60d9b28-c8bc-e198-f3bb-36a304c1c248	²²²	\N	2025-05-05 13:50:45.902127	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-05 13:50:45.902127	\N	\N
4e99c793-192f-4744-1bf4-b2e13d63a571	LLLL	\N	2025-05-05 17:55:56.627698	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-05 17:55:56.627698	\N	\N
2c86a385-9206-8c6c-924e-fd25f1571fda	ffkkjhklj	\N	2025-05-05 19:09:07.506123	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-05 19:09:07.506123	\N	\N
82bfc04b-ecca-40ca-ea6d-a32d81ba2b54	mmmmm	\N	2025-05-06 08:11:50.657819	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-06 08:11:50.657819	\N	\N
6c905b38-7627-062e-41ae-3e894fe3d36b	Paul 2 a démarré un appel vidéo	\N	2025-05-06 11:28:09.701254	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-06 11:28:09.701254	\N	\N
9c0c8eb1-152b-3d4b-ca67-6c62e5afbf45	Sondage créé : [test](https://strawpoll.com/xVg716DkGyr) [strawpoll:xVg716DkGyr]	\N	2025-05-06 13:55:06.859654	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 13:55:06.859654	\N	\N
fe747eb1-bb31-3bac-0a14-1f6b96dfcf98	@[Math TEST](5ee82d1c-df2a-fe2f-ea4a-3e441b0846af) 	\N	2025-05-06 14:44:50.402353	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 14:44:50.402353	\N	\N
f3a31a87-3a14-8192-e77c-8cacc68456ef	@Mistral AI Salut	\N	2025-05-07 19:35:33.341275	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-07 19:35:33.341275	\N	\N
ecc2e31c-1256-3e45-a4dd-2b69e91ce591	Salut ! Comment puis-je vous aider aujourd'hui ?	\N	2025-05-07 19:35:33.794282	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000001	2025-05-07 19:35:33.794282	\N	\N
ef7e6a68-48ce-80c4-0629-4a34115e2357	Paul 2 a démarré un appel vidéo	\N	2025-05-08 09:14:21.69972	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-08 09:14:21.69972	\N	\N
6efb032b-c4b4-c9af-b612-7bad2ac6e693	🪰	\N	2025-05-08 09:28:43.336843	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-08 09:28:43.336843	\N	\N
6af2f238-85c2-ff49-71d5-c0bf3c9ecf59	Paul 2 a démarré un appel vidéo	\N	2025-05-08 09:43:18.881251	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-08 09:43:18.881251	\N	\N
4316a05f-6844-abdc-7935-bb99e8980a03	{"type":"file","fileUrl":"messages/files/c5d25cc9-89b0-4142-8466-05b32ba36bd2.png","fileName":"placeholder.png","fileSize":33605,"fileType":"image/png","isImage":true}	\N	2025-05-08 10:32:03.444471	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-08 10:32:03.444471	\N	\N
b392c0a3-f6d5-fcf8-edbd-4b0088a7903d	{"type":"file","fileUrl":"messages/files/df3554e9-f875-449f-bac6-4303b42ea5bb.gif","fileName":"smile-awkward.gif","fileSize":2682630,"fileType":"image/gif","isImage":true}	\N	2025-05-08 10:32:51.586505	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-08 10:32:51.586505	\N	\N
7a631f75-a732-157e-7811-7360f1eaeb93	{"type":"file","fileUrl":"messages/files/8b510ad5-cf1b-4282-8450-8f7c92c88b95.png","fileName":"Untitled.png","fileSize":405647,"fileType":"image/png","isImage":true}	\N	2025-05-08 11:03:26.716149	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-08 11:03:26.716149	\N	\N
5f83246e-e98e-c65b-6b4d-594c5c215725	{"type":"file","fileUrl":"messages/files/c256e6bb-2cfc-484f-862a-9e171acb548a.png","fileName":"ChatGPT Image 4 mai 2025, 13_44_00.png","fileSize":489,"fileType":"image/png","isImage":true}	\N	2025-05-08 11:05:41.756926	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-08 11:05:41.756926	\N	\N
74444a4f-fcea-f989-9e0c-13f6e11914da	{"type":"file","fileUrl":"messages/files/462c39e5-a13b-4cab-a415-a3c138d02869.png","fileName":"Capture d'Ã©cran 2025-04-29 132639.png","fileSize":1638679,"fileType":"image/png","isImage":true}	\N	2025-05-08 11:07:01.198136	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-08 11:07:01.198136	\N	\N
60b7c775-b81b-c8b6-7323-80e485e432a1	qsfsfqqsdf	\N	2025-05-08 12:11:36.218695	5d159045-e695-98e8-8462-5f5108f021ee	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-08 12:11:36.218695	\N	\N
6a0d17f4-fffe-98b8-0326-e1c8663adfa3	[Message d'un utilisateur supprimé]	\N	2025-05-08 14:00:24.062358	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000001	2025-05-08 14:00:24.062358	\N	\N
1af89603-8c65-d3fc-4844-751d5931cb3d	[Message d'un utilisateur supprimé]	\N	2025-05-08 13:47:42.002368	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-08 13:47:42.002368	\N	\N
6e958a76-235d-48ba-a12c-a50114c7dc27	[Message d'un utilisateur supprimé]	\N	2025-05-08 13:47:53.877361	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-08 13:47:53.877361	\N	\N
b3c747cd-0028-3a93-9e49-f84613df8018	[Message d'un utilisateur supprimé]	\N	2025-05-08 13:25:01.735485	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-08 13:25:01.735485	\N	\N
cb118bdb-4cdf-608a-5839-e1719fbdbc74	[Message d'un utilisateur supprimé]	\N	2025-05-08 13:25:10.890312	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-08 13:25:10.890312	\N	\N
0f2e3f18-31b3-d86f-b045-586d7b96caa2	rien	\N	2025-05-12 08:04:21.937666	84f03094-c2df-24d7-6257-8bf9e1993b58	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-12 08:04:21.937666	\N	\N
ba64cfc9-7fdf-2de3-664b-fb9a65115330	hello	\N	2025-05-12 11:31:09.032081	de06e22f-9eeb-4a6d-351c-9e5143b4edbf	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-12 11:31:09.032081	\N	\N
6f08f53d-9358-784c-6bac-c242aa6ecb85	rien	\N	2025-05-12 14:18:48.054445	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-12 14:18:48.054445	\N	\N
c7e92a63-a89b-1c22-9f24-d78d6a41f238	[Message d'un utilisateur supprimé]	\N	2025-05-04 15:21:41.445601	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-04 15:21:41.445601	\N	\N
f258c105-d610-fb12-f4ab-abc94df6049f	[Message d'un utilisateur supprimé]	\N	2025-05-04 15:21:47.802756	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-04 15:21:47.802756	\N	\N
c924cbc4-2e5e-ec12-e13a-d28980db9d1b	[Message d'un utilisateur supprimé]	\N	2025-05-04 15:21:52.315521	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000003	2025-05-04 15:21:52.315521	\N	\N
24ac6a51-6842-a153-d623-2f712cd21aa4	[Message d'un utilisateur supprimé]	\N	2025-05-05 07:25:09.74577	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-05 07:25:09.74577	\N	\N
6c9961f5-da93-fc08-f605-955c6a4a9620	[Message d'un utilisateur supprimé]	\N	2025-05-06 13:09:48.979697	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000003	2025-05-06 13:09:48.979697	\N	\N
c2427eed-7835-09bb-579f-f9bf1f5812d6	qsfqs	\N	2025-05-13 12:13:52.689254	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 12:13:52.689254	\N	0f2e3f18-31b3-d86f-b045-586d7b96caa2
5f567b23-f696-4bbf-2a7c-9fd2421f534e	yo	\N	2025-05-13 12:16:16.181961	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-13 12:16:16.181961	\N	cd7598c8-dbaf-a142-10fc-5655071eba69
5b90a685-0097-7678-bd63-a52c0d18e711	dqasdqs	\N	2025-05-13 13:22:57.181628	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 13:22:57.181628	\N	\N
06a40568-e925-a62e-507b-d4999577aa09	dqsdqs	\N	2025-05-13 14:22:48.691493	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:22:48.691493	\N	\N
60e2f65c-fdad-d829-7b83-7de3b4c24e30	qsd	\N	2025-05-13 14:36:32.2335	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:36:32.2335	\N	\N
7d6ca917-ee4c-c31f-e8fe-8300fad72eb2	lkhdbvf	\N	2025-04-28 17:50:55.962267	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:50:55.962267	\N	\N
248889ab-8f91-e8b9-fa68-2afd598582a8	test	\N	2025-04-29 11:31:43.07498	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 11:31:43.07498	\N	\N
7e0b0c58-e55c-9ddc-66ce-ca606252e506	qefsdf	\N	2025-04-29 12:30:29.78299	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:30:29.78299	\N	\N
41e23a47-0918-03f2-9df0-33dd6e025bcd	efszdf	\N	2025-04-29 12:32:45.76745	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:32:45.76745	\N	\N
44b79355-44de-e42d-feb3-b3552dba1106	jzrehfireziohre	\N	2025-04-29 12:35:22.526334	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:22.526334	\N	\N
037053df-bb2d-72c7-83b9-fc6b82a539e0	rezg	\N	2025-04-29 12:35:22.936835	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:22.936835	\N	\N
4c0d0ff5-adbe-2b49-7b5c-fee4b1a5fc5d	e	\N	2025-04-29 12:35:23.226109	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:23.226109	\N	\N
53158c06-c7e1-d297-67a1-70ef454885ab	tr	\N	2025-04-29 12:35:23.406714	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:23.406714	\N	\N
caf6ebd3-e8e6-d3eb-fecd-d6dce3660fe5	e	\N	2025-04-29 12:35:23.546634	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:23.546634	\N	\N
02bcfde4-b57f-bc70-d611-c2b9daaef580	te	\N	2025-04-29 12:35:24.027047	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:24.027047	\N	\N
af229125-ad15-56c8-e463-68632b8467a0	f	\N	2025-04-29 12:35:24.368251	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:24.368251	\N	\N
48769ed6-4ea9-ed86-6cf0-3242e16b6c5b	f	\N	2025-04-29 12:35:24.614985	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:24.614985	\N	\N
1160fca9-ee51-4ff3-2bdc-34d50f12d06b	re	\N	2025-04-29 12:35:25.047484	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:25.047484	\N	\N
59b8135e-d8ca-bf41-269f-07f302c11f84	he	\N	2025-04-29 12:35:25.244268	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:25.244268	\N	\N
a1dbb5e8-d3e4-e055-b0f5-5c17a224a281	t	\N	2025-04-29 12:35:25.383946	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:25.383946	\N	\N
a1ee409f-269b-0961-7ab0-505e50f93802	sd	\N	2025-04-28 17:44:51.260716	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:51.260716	\N	\N
efcf069d-8117-bbbe-d506-6d0638a91aa0	s	\N	2025-04-28 17:44:51.751176	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:51.751176	\N	\N
56a78d07-60d8-ef69-65e0-e11ea220a00a	sdf	\N	2025-04-28 17:44:55.802019	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:55.802019	\N	\N
fadf5318-89e2-2ee4-52a6-ca966ac97e40	sdfsdf	\N	2025-04-28 17:44:59.661951	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:44:59.661951	\N	\N
48c860e7-40db-5637-2921-9155f0be1f82	sdfsd	\N	2025-04-28 17:45:00.008896	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:45:00.008896	\N	\N
bd9d4703-ed27-0ce7-78fc-dea225cc008c	df	\N	2025-04-28 17:45:00.789745	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:45:00.789745	\N	\N
bd4b59bf-c1ba-69ed-c2af-a771b1f50903	f	\N	2025-04-28 17:45:01.081914	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-28 17:45:01.081914	\N	\N
ab4bf9ba-dbf2-da96-e2e7-a41c54ff9ebd	h	\N	2025-04-29 12:35:25.538079	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:25.538079	\N	\N
56163f7d-f670-d096-73dd-1625ec2eaf8a	re	\N	2025-04-29 12:35:25.984181	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:25.984181	\N	\N
593a41a6-f46e-e308-5c8c-70b06cd63bae	gf	\N	2025-04-29 12:35:26.144541	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:26.144541	\N	\N
47add51e-1e50-9cf0-a160-89aef5d6da61	re	\N	2025-04-29 12:35:26.307357	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:26.307357	\N	\N
197e2f65-2921-033b-90d3-a07c198ab768	g	\N	2025-04-29 12:35:26.437691	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:26.437691	\N	\N
570d1909-9b44-800a-81ab-42bdc2b7e879	t"	\N	2025-04-29 12:35:26.618184	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:26.618184	\N	\N
2928131b-067a-7000-ecfe-5d39ba91088e	zer	\N	2025-04-29 12:35:26.899766	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:26.899766	\N	\N
545fa0c3-2178-87d6-362b-8389b0f02191	e	\N	2025-04-29 12:35:27.538226	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:27.538226	\N	\N
2b7d8ad3-5f79-4120-789e-dfe2eb6792f0	he	\N	2025-04-29 12:35:28.078588	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:28.078588	\N	\N
40588e49-d7f1-2348-8043-daea11db5ea6	te	\N	2025-04-29 12:35:28.256151	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-29 12:35:28.256151	\N	\N
3ae94aa7-04a9-c675-358a-efd1c399d156	test	\N	2025-04-29 12:39:01.46451	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 12:39:01.46451	\N	\N
50549d23-2b20-86f1-5f18-d317140f03c3	Sondage créé : [test2](https://strawpoll.com/NMnQN9mO0g6)	\N	2025-04-29 14:00:27.676707	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 14:00:27.676707	\N	\N
7349bfed-fe35-5829-ca0a-3bc6f8c4bae5	Sondage créé : [qsdsq](https://strawpoll.com/40Zm4jRJoga)	\N	2025-04-29 14:11:19.458975	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-29 14:11:19.458975	\N	\N
87381a7c-7696-3545-3daa-cbd38766dd52	zfzef	\N	2025-04-30 09:56:09.847263	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-30 09:56:09.847263	\N	\N
84e4d04e-a171-0b82-35f6-1fa7838086b8	test2	\N	2025-04-30 12:56:39.310229	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-04-30 12:56:39.310229	\N	\N
6beaa2ea-162e-189d-9eb1-c69f40e7635a	Sondage créé : [zdczdc](https://strawpoll.com/XmZRQ1Pewgd) [strawpoll:XmZRQ1Pewgd]	\N	2025-05-04 13:28:00.906148	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 13:28:00.906148	\N	\N
db45b595-a7cd-2a6c-2183-ec5e09e2f847	afazef	\N	2025-05-04 14:54:38.620234	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 14:54:38.620234	\N	\N
47247180-4aa1-b2fb-c07f-7116e0864f89	zetoihefzgsohitqez piuoezfgdpoij qvfd pçè! até"' zPOJÙezmflds	\N	2025-05-04 15:21:51.693427	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 15:21:51.693427	\N	\N
d3986fb3-632c-8c4a-2b09-e1a4e1dc483f	test	\N	2025-05-04 15:51:38.026082	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 15:51:38.026082	\N	c7e92a63-a89b-1c22-9f24-d78d6a41f238
843c4844-b01b-3ec5-5415-1872cbd40a01	sdfsdf	\N	2025-05-05 12:30:05.191292	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-05 12:30:05.191292	\N	\N
25f38f97-c0b1-99d7-162e-924ae7d95038	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:02:58.655295	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:02:58.655295	\N	\N
6123d5b7-7625-b162-e349-6a3bc9da36a4	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:14:14.527303	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:14:14.527303	\N	\N
38ccca02-752b-6ae3-d462-68106906809a	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:15:43.512215	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:15:43.512215	\N	\N
a5967feb-5344-ef4f-737e-06626e98c63c	mmmm	\N	2025-05-05 13:20:51.188255	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-05 13:20:51.188255	\N	\N
29871c90-ea81-dd62-0eab-04bd7e61cee4	Paul 2 a démarré un appel vidéo	\N	2025-05-05 13:38:04.76	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 13:38:04.76	\N	\N
aa27a0a6-26cd-363d-70b2-a78289f826ea	kkkk	\N	2025-05-05 13:54:58.691953	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-05 13:54:58.691953	\N	\N
60aadbd0-0fd2-7979-8b53-cf6a31ebd800	esgdjfds	\N	2025-05-05 14:11:51.222092	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-05 14:11:51.222092	\N	\N
4daeacd3-ca29-4a1e-a8e1-7a21148c9f17	jjjj	\N	2025-05-06 08:12:05.420786	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-06 08:12:05.420786	\N	\N
9f7c476b-e791-34f6-281c-4b524417187b	@Paul 2 	\N	2025-05-06 14:37:34.025251	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 14:37:34.025251	\N	\N
22661595-6fd7-8a04-2af8-77a37a8afbfd	@Math TEST 	\N	2025-05-06 14:37:48.88349	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 14:37:48.88349	\N	\N
5ad594c1-25cc-5274-d65d-4fa25bb54752	@Math'BigDick$bb6a4d43-70d3-5e36-d943-dfdfc747491f 	\N	2025-05-06 14:46:03.950185	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-06 14:46:03.950185	\N	\N
0ca02d1e-0c86-b757-8a1e-1ae18cf7b800	Paul 2 a démarré un appel vidéo	\N	2025-05-07 19:35:46.761575	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000003	2025-05-07 19:35:46.761575	\N	\N
34eaf559-a2d3-beb9-85d4-d919170e50a9	@[Mistral AI](00000000-0000-0000-0000-000000000001) hzehfzdfh	\N	2025-05-08 09:14:56.621438	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-08 09:14:56.621438	\N	\N
e6642d57-724a-bd06-fe74-17cf295bacc6	Paul 2 a démarré un appel vidéo	\N	2025-05-08 09:39:24.649801	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-08 09:39:24.649801	\N	\N
2d1ff459-e8ba-0463-355d-37a204fff2f1	test	\N	2025-05-08 10:29:49.241131	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-08 10:29:49.241131	\N	\N
7c4c8604-6703-2bea-55b2-925597944751	{"type":"file","fileUrl":"messages/files/0a07623b-d68b-49f1-a37a-fc2fe92c0e20.gif","fileName":"smile-awkward.gif","fileSize":2682630,"fileType":"image/gif","isImage":true}	\N	2025-05-08 11:02:39.75027	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-08 11:02:39.75027	\N	\N
3c9be637-14c4-06b5-0abd-5394f7abbb43	qsfqsfqs	\N	2025-05-08 12:11:33.309899	5d159045-e695-98e8-8462-5f5108f021ee	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-08 12:11:33.309899	\N	\N
e5e6406d-90f7-3a3a-393c-70285a2a23dc	[Message d'un utilisateur supprimé]	\N	2025-05-05 07:25:30.485537	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 07:25:30.485537	\N	\N
0ae885a9-5805-864a-5fc6-80e68d33e331	[Message d'un utilisateur supprimé]	\N	2025-05-05 18:13:53.227969	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-05 18:13:53.227969	\N	\N
9c3b172f-a1b6-1aad-57a7-58825184754c	[Message d'un utilisateur supprimé]	\N	2025-05-08 14:00:30.046612	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000001	2025-05-08 14:00:30.046612	\N	\N
6cc8092e-5cef-5fe0-624f-a72d0e1f51c4	[Message d'un utilisateur supprimé]	\N	2025-05-08 14:00:43.287749	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000001	2025-05-08 14:00:43.287749	\N	\N
aee2be50-f753-f011-f1fa-5dd72cd16385	Rudy a démarré un appel vidéo	\N	2025-05-08 16:42:15.171659	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-08 16:42:15.171659	\N	\N
ed1b7d07-7289-0a7a-3cd9-bbc625c5fcb5	Rudy a démarré un appel vidéo	\N	2025-05-12 12:01:02.568796	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000003	2025-05-12 12:01:02.568796	\N	\N
6c70fd00-84b2-b1b0-911e-67189b67442f	Rudy a démarré un appel vidéo	\N	2025-05-12 12:01:29.442832	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-12 12:01:29.442832	\N	\N
9db182a6-4950-a344-1b3c-58bc1011a225	Rudy a démarré un appel vidéo	\N	2025-05-12 12:02:42.152247	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-12 12:02:42.152247	\N	\N
641efc1e-e64c-c131-919a-156e4df0e592	Paul MAZZON a démarré un appel vidéo	\N	2025-05-12 12:02:44.367142	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-12 12:02:44.367142	\N	\N
9f262e27-ca87-bca2-9285-5580e083c5b4	Paul MAZZON a démarré un appel vidéo	\N	2025-05-12 12:03:08.730091	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-12 12:03:08.730091	\N	\N
3f5b9a49-585e-dcde-8c0a-4290a4ec07ad	Rudy a démarré un appel vidéo	\N	2025-05-12 14:51:59.675354	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000003	2025-05-12 14:51:59.675354	\N	\N
4daeb50b-c5cc-278c-c91b-fbf719777452	Rudy a démarré un appel vidéo	\N	2025-05-12 18:48:39.884225	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000003	2025-05-12 18:48:39.884225	\N	\N
cec12f20-1d2e-efc9-8a34-24d546cf333f	Sondage créé : [enora prefere ?](https://strawpoll.com/LVyK2rQAkZ0) [strawpoll:LVyK2rQAkZ0]	\N	2025-05-12 18:49:26.891252	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-12 18:49:26.891252	\N	\N
1e53762f-1538-e861-2759-fd013b8198f5	@[Mistral AI](00000000-0000-0000-0000-000000000001) comment vas tu ? 	\N	2025-05-13 08:17:30.279815	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-13 08:17:30.279815	\N	\N
23b5ad6b-0547-18f6-3d47-ddc3ef0366ac	@[Mistral AI] hello	\N	2025-05-13 08:17:56.67151	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-13 08:17:56.67151	\N	\N
56f9359b-0a09-4383-27af-abdfa3e29f91	[Message d'un utilisateur supprimé]	\N	2025-05-05 14:21:04.929105	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-05 14:21:04.929105	\N	\N
3e388294-332c-fa6e-c460-81cbd9d411af	[Message d'un utilisateur supprimé]	\N	2025-05-06 13:09:53.406948	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-06 13:09:53.406948	\N	\N
e1bbd023-8f5b-1051-e937-4567433f9146	[Message d'un utilisateur supprimé]	\N	2025-05-06 12:41:04.869878	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-06 12:41:04.869878	\N	\N
4f14f2ee-ad40-5f3b-32b3-ca74edd6f2df	[Message d'un utilisateur supprimé]	\N	2025-05-06 13:10:30.672318	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000003	2025-05-06 13:10:30.672318	\N	\N
fa3f8224-4913-a2da-d909-b746107ee5ef	[Message d'un utilisateur supprimé]	\N	2025-05-06 13:10:35.270001	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000003	2025-05-06 13:10:35.270001	\N	\N
b08d2c6c-dcd8-71ac-6d9e-0fbf226a666b	[Message d'un utilisateur supprimé]	\N	2025-05-06 13:10:39.096353	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000003	2025-05-06 13:10:39.096353	\N	\N
e5e3de64-1518-6b5e-53a8-923fb41b5ff8	qsd	\N	2025-05-13 14:36:33.695725	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:36:33.695725	\N	\N
c3e21f2f-fd2a-f0eb-d0df-d178c6dd8e00	qsd	\N	2025-05-13 14:36:34.78348	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:36:34.78348	\N	\N
5b83f2b4-86b9-a9f5-ed9d-464bf5f6f0fa	qsd	\N	2025-05-13 14:36:35.890042	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:36:35.890042	\N	\N
e1e20b42-cdf1-3bfd-7ab9-22eb6dce482e	qsd	\N	2025-05-13 14:36:37.036738	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:36:37.036738	\N	\N
7b82e1fd-b42a-8fce-5390-fc0fff10d4be	qsd	\N	2025-05-13 14:36:38.188702	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:36:38.188702	\N	\N
cfc4c1f1-8c7b-5ac4-10a4-a24ec502ec13	qsd	\N	2025-05-13 14:36:39.512203	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:36:39.512203	\N	\N
5ec967e7-f068-6aab-6ed0-8fa2ededcdf3	qsd	\N	2025-05-13 14:36:40.559058	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:36:40.559058	\N	\N
72c033c8-6194-7d64-1343-721d65a94c92	qsd	\N	2025-05-13 14:36:41.826404	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:36:41.826404	\N	\N
4573cd31-0371-3e9e-d89b-2149d812d668	qsd	\N	2025-05-13 14:37:02.561578	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:37:02.561578	\N	\N
28642992-c272-726f-a704-276e3a44afe8	qsd	\N	2025-05-13 14:37:05.715745	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:37:05.715745	\N	\N
8c6c6fb3-da08-2929-36a4-fe6ce860c206	qsd	\N	2025-05-13 14:37:06.86571	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:37:06.86571	\N	\N
e1a16f72-fd65-4947-171a-8b14135c228c	wqsd	\N	2025-05-13 14:37:07.927356	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:37:07.927356	\N	\N
3e5e86f4-4362-15c9-fc03-312c8d872ac5	qsd	\N	2025-05-13 14:37:08.964603	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:37:08.964603	\N	\N
d4f32d1b-1b23-e19f-eb81-ea7c5f46c0a8	qsd	\N	2025-05-13 14:37:09.830594	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:37:09.830594	\N	\N
86fbc34a-6738-dc7c-b95b-a379c1cd8f47	qqsfqs	\N	2025-05-13 14:40:03.268376	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:40:03.268376	\N	\N
1fa1bb9f-ac18-54ad-4e04-d72f60be8cd2	qsf	\N	2025-05-13 14:40:07.362971	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-13 14:40:07.362971	\N	\N
8f781a43-2a34-465e-2776-288dd99083ff	{"type":"file","fileUrl":"messages/files/6a727dd9-8f93-43c4-aefd-eabfaf7b4e9a.jpg","fileName":"fiche_loutre_carre.jpg","fileSize":216444,"fileType":"image/jpeg","isImage":true}	\N	2025-05-17 10:04:29.320476	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 10:04:29.320476	\N	\N
ca5f435f-b2fb-52cf-1dbb-be3098ed5414	qfqdsf	\N	2025-05-17 10:18:32.487135	5d159045-e695-98e8-8462-5f5108f021ee	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-17 10:18:32.487135	\N	\N
7e0739d1-29d6-cf0b-aa63-584bad96e2d4	hyffjyhyfjh	\N	2025-05-17 10:19:08.354975	5d159045-e695-98e8-8462-5f5108f021ee	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-17 10:19:08.354975	\N	\N
edb13c36-9272-b1ed-aed0-52699650164c	# test	\N	2025-05-17 13:23:59.377358	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 13:23:59.377358	\N	\N
63a13c35-a590-2c7b-a90b-ea1a58159ff0	#test	\N	2025-05-17 13:28:52.391498	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 13:28:52.391498	\N	\N
edc9c14a-237f-52e9-f8fb-07d6012805d3	#test	\N	2025-05-17 13:32:14.424582	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 13:32:14.424582	\N	\N
f79e473f-e4de-b731-e629-a97eeac7a590	#	\N	2025-05-17 13:40:24.665094	84f03094-c2df-24d7-6257-8bf9e1993b58	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 13:40:24.665094	\N	\N
842fe7f3-c3e1-a924-6f98-0dc858e14edc	#	\N	2025-05-17 13:56:24.025055	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 13:56:24.025055	\N	\N
fb820840-e6a1-5b63-2127-1fcc1562a399	dfsdf	\N	2025-05-17 14:08:24.237526	de06e22f-9eeb-4a6d-351c-9e5143b4edbf	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-17 14:08:24.237526	\N	\N
ee12c766-d235-f743-e2f7-ba832530778c	#test 	\N	2025-05-17 14:11:31.397933	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:11:31.397933	\N	\N
bb772c39-79cc-8757-7e66-f0c3b36a28eb	#files 	\N	2025-05-17 14:11:50.605237	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:11:50.605237	\N	\N
d1c7a0d5-22fc-33a4-1191-9c111cab37f0	#test 	\N	2025-05-17 14:15:22.844988	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:15:22.844988	\N	\N
25739f64-90c1-0b43-efe5-46e1732221f6	#test 	\N	2025-05-17 14:18:41.905171	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:18:41.905171	\N	\N
f442c4e8-4eb3-bd89-d655-b913e41a8592	#test 	\N	2025-05-17 14:21:34.719231	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:21:34.719231	\N	\N
4b38fd05-2a36-3854-af21-a76961af6ed4	#files 	\N	2025-05-17 14:23:12.5872	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:23:12.5872	\N	\N
14fef79a-2cd1-917c-bdb3-ab8320878735	#files 	\N	2025-05-17 14:23:21.200313	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:23:21.200313	\N	\N
65bbe94c-5acd-1d8a-27c9-da16cabe5288	#test 	\N	2025-05-17 14:25:04.948534	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:25:04.948534	\N	\N
23f64235-ce76-3004-c5cc-42672c3a8ee1	#Horraire 	\N	2025-05-17 14:25:12.52947	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:25:12.52947	\N	\N
284f0c41-2406-05ef-1a50-37994e72c501	{"type":"file","fileUrl":"messages/files/32cb8b56-68e3-4df0-86dc-da7c18410da7.jpg","fileName":"Ragondin-et-sa-dent..jpg","fileSize":516080,"fileType":"image/jpeg","isImage":true}	\N	2025-05-17 14:30:08.771871	84f03094-c2df-24d7-6257-8bf9e1993b58	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:30:08.771871	\N	\N
c33bfd40-d3e6-d443-b226-0f08ebaacc59	#Horraire 	\N	2025-05-17 14:30:22.075708	84f03094-c2df-24d7-6257-8bf9e1993b58	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 14:30:22.075708	\N	\N
ae866145-54ce-9832-46ef-a94e084b5172	aaaa	\N	2025-05-17 14:36:47.815528	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-17 14:36:47.815528	\N	\N
3697b0c9-c1c0-429b-b027-b204e3e85543	aaaa	\N	2025-05-17 14:36:57.472957	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-17 14:36:57.472957	\N	\N
2c049101-c119-bea8-464e-414d8c168033	aaa	\N	2025-05-17 14:37:07.184605	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-17 14:37:07.184605	\N	\N
fcc2709b-15de-aa74-50e4-9aed17e7da5b	Sondage créé : [un sondage vraiiiment](https://strawpoll.com/e7ZJaDvkYg3) [strawpoll:e7ZJaDvkYg3]	\N	2025-05-17 15:17:55.972903	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 15:17:55.972903	\N	\N
4660027e-b6a3-75fc-c467-6277daa2c3bc	kllkklj	\N	2025-05-17 15:54:16.041476	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-17 15:54:16.041476	\N	\N
61bb0fe2-b945-723d-52fa-f0ef1af14528	azazzaaz	\N	2025-05-17 15:56:13.308263	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-17 15:56:13.308263	\N	\N
94332894-3731-8b9a-3d07-11e714c1b15d	#test pour voir	\N	2025-05-17 15:58:04.322917	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 15:58:04.322917	\N	\N
755439f2-6ca8-2dcb-ff2a-ad1c4d8c1a1b	#files 	\N	2025-05-17 15:58:26.59856	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 15:58:26.59856	\N	\N
5db5c94e-a399-38d6-4407-f737a9c0e942	caca pourri	\N	2025-05-17 16:09:04.424152	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-17 16:09:04.424152	\N	\N
ee90c3b7-caac-fdce-d86f-b67d326ebcbc	test	\N	2025-05-17 16:09:51.030035	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-17 16:09:51.030035	\N	\N
305481bb-d695-eef4-e2ea-ff20cd67bfee	#test 	\N	2025-05-17 16:11:10.158002	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-17 16:11:10.158002	\N	\N
ffd8ecef-338c-692b-3039-801fe15d45ea	qsdqs	\N	2025-05-17 16:13:34.56263	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-17 16:13:34.56263	\N	\N
dd18175d-d979-1b59-ab48-c07a9867b495	#Horraire salut	\N	2025-05-17 16:35:05.45738	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-17 16:35:05.45738	\N	\N
a937c221-397a-b747-d6d6-5008bc02617d	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) 	\N	2025-05-18 08:43:36.100443	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 08:43:36.100443	\N	\N
ab6f1e7b-8f46-d0dd-eef7-9ea2b4d13114	@[Mistral AI](00000000-0000-0000-0000-000000000001) 	\N	2025-05-18 08:44:04.635306	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 08:44:04.635306	\N	\N
95588883-f11f-2887-61f7-f282f290483a	@[Mistral AI](00000000-0000-0000-0000-000000000001) hello	\N	2025-05-18 08:44:22.279099	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 08:44:22.279099	\N	\N
bfecaf58-1d35-d508-4945-c74ebe016e5f	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) yo	\N	2025-05-18 08:48:38.809698	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 08:48:38.809698	\N	\N
80ed1ca8-b34e-33e1-9fab-5337cd10b00e	@[Mistral AI](00000000-0000-0000-0000-000000000001) hello	\N	2025-05-18 08:48:46.340039	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 08:48:46.340039	\N	\N
b27482c3-7e9a-3c99-75b9-a8ac83a401be	@[Mistral AI](00000000-0000-0000-0000-000000000001) ca va ?	\N	2025-05-18 08:53:42.153888	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 08:53:42.153888	\N	\N
56cad9c7-98ac-9121-d052-efbab626ad88	@[Mistral AI](00000000-0000-0000-0000-000000000001) tu es dispo ?	\N	2025-05-18 08:56:22.353088	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 08:56:22.353088	\N	\N
c6176d68-a807-3fc1-afed-424d7849836a	Oui, je suis disponible pour t'aider. Que puis-je faire pour toi aujourd'hui ?	\N	2025-05-18 08:56:22.936925	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000001	2025-05-18 08:56:22.936925	\N	\N
cfe1423a-729d-5fd0-a10b-9c1152ab78c0	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) yo	\N	2025-05-18 09:08:12.790993	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 09:08:12.790993	\N	\N
a75d3fae-46dc-9b8e-2674-4a32a89f6637	@[Mistral AI](00000000-0000-0000-0000-000000000001) parle moi de léonard de vinci	\N	2025-05-18 09:12:15.382866	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 09:12:15.382866	\N	\N
e87ca8b2-f988-032b-a80d-de9b67f44b07	@[Mistral AI](00000000-0000-0000-0000-000000000001) tu vas bien?	\N	2025-05-18 09:23:27.409766	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 09:23:27.409766	\N	\N
b32bbd8e-1ad1-b970-2c40-2e4f181e4259	@[Mistral AI](00000000-0000-0000-0000-000000000001) hello	\N	2025-05-18 09:27:12.00284	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 09:27:12.00284	\N	\N
b4411683-c21f-4042-2fbf-7aafbc26fcc2	@[Mistral AI](00000000-0000-0000-0000-000000000001) parle moi de léonard de vinci	\N	2025-05-18 09:30:19.873038	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 09:30:19.873038	\N	\N
f33da5af-13c6-c83a-e8ef-47b7638ee1be	f	\N	2025-05-18 15:41:00.141455	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 15:41:00.141455	\N	\N
b1115fd7-1b3c-9a36-335e-e8a11491c764	Léonard de Vinci, né le 15 avril 1452 à Vinci, en Toscane, et mort le 2 mai 1519 à Amboise, en France, est l'un des artistes et intellectuels les plus célèbres de la Renaissance. Il est souvent considéré comme le prototype de l'homme de la Renaissance, incarnant l'idéal du génie universel.\n\n### Vie et Carrière\n\n#### Enfance et Formation\nLéonard est né hors mariage de Ser Piero, un notaire florentin, et de Caterina, une paysanne. Il a passé son enfance à Vinci avant de déménager à Florence pour suivre une formation artistique. À l'âge de 14 ans, il est devenu apprenti dans l'atelier de Verrocchio, l'un des artistes les plus respectés de Florence.\n\n#### Carrière Artistique\nLéonard de Vinci a excellé dans divers domaines artistiques, notamment la peinture, la sculpture, l'architecture et l'ingénierie. Parmi ses œuvres les plus célèbres figurent :\n- **La Joconde (Mona Lisa)**: Peint entre 1503 et 1506, ce portrait est l'un des tableaux les plus connus et les plus étudiés au monde.\n- **La Cène (Le Dernier Souper)**: Réalisée entre 1495 et 1498, cette fresque murale représente la scène biblique du dernier repas de Jésus avec ses apôtres.\n- **L'Homme de Vitruve**: Un dessin anatomique basé sur les proportions idéales du corps humain, souvent considéré comme une illustration de l'idéal de la Renaissance.\n\n#### Contributions Scientifiques et Techniques\nEn plus de ses talents artistiques, Léonard de Vinci a apporté des contributions significatives dans les domaines de l'anatomie, de la botanique, de la géologie, de l'optique et de l'ingénierie. Ses carnets contiennent des milliers de pages de dessins, de notes et de schémas détaillés qui témoignent de son esprit curieux et innovant. Il a conçu des machines volantes, des sous-marins, des tanks et d'autres inventions bien avant leur temps.\n\n#### Vie Personnelle\nLéonard de Vinci a mené une vie relativement solitaire, bien qu'il ait eu plusieurs amis proches et admirateurs. Il n'a jamais été marié et n'a pas eu d'enfants. Il a passé ses dernières années en France, invité par le roi François Ier, qui lui a offert une résidence au château de Clos Lucé, près d'Amboise.\n\n### Héritage\nLéonard de Vinci est souvent considéré comme l'un des plus grands génies de l'histoire humaine. Son travail a eu une influence durable sur l'art, la science et la technologie. Ses œuvres et ses écrits continuent d'inspirer des artistes, des scientifiques et des ingénieurs à travers le monde.\n\n### Conclusion\nLéonard de Vinci était un homme aux talents multiples et aux intérêts variés, dont	\N	2025-05-18 09:30:58.263478	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000001	2025-05-18 09:30:58.263478	\N	\N
12e9d610-3f17-4bad-0dd9-e31e263e7d71	#files oui	\N	2025-05-18 09:31:35.844648	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 09:31:35.844648	\N	\N
23e47068-6a8c-ef65-25e3-40aae6d316c6	@Paul 2 hello 	\N	2025-05-18 09:36:12.353968	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 09:36:12.353968	\N	\N
3339e9d1-f97a-d812-8b98-b70c7d1a06e4	@Mistral AI bonjour	\N	2025-05-18 09:37:16.907982	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 09:37:16.907982	\N	\N
281a819b-bb4b-baa0-c38b-a2abddf9c983	Bonjour ! Comment puis-je vous aider aujourd'hui ?	\N	2025-05-18 09:37:17.533086	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000001	2025-05-18 09:37:17.533086	\N	\N
a3a3252e-08aa-81e8-883d-e0ea94689f6c	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e)	\N	2025-05-18 09:55:36.236621	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 09:55:36.236621	\N	\N
f6d94ac6-a6d6-afeb-97c4-af7a9cb9c0d0	@Math'BigDick test	\N	2025-05-18 10:03:25.162914	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:03:25.162914	\N	\N
5aa91aeb-dcc6-03f5-70fd-d8926975c79a	@Paul MAZZON tes	\N	2025-05-18 10:03:58.158009	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:03:58.158009	\N	\N
4ad5729e-9ad8-780f-8c1e-8689be0eb5b1	@Paul MAZZON test	\N	2025-05-18 10:06:14.596859	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:06:14.596859	\N	\N
9e9ce169-315a-62f2-f3a2-646a01b20faa	@Paul MAZZON test	\N	2025-05-18 10:07:39.407332	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:07:39.407332	\N	\N
466f85cf-f44f-5a89-972f-c143d6ce5760	@Math'BigDick test	\N	2025-05-18 10:08:10.827581	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:08:10.827581	\N	\N
d0a87808-afa3-ba61-5fb9-093b50b91895	@Mistral AI hello	\N	2025-05-18 10:14:34.308902	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:14:34.308902	\N	\N
60daae21-8ac5-36b1-88a1-813eec5dc22f	Hello! How can I assist you today? Let's have a friendly conversation.  How are you doing?	\N	2025-05-18 10:14:35.398439	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000001	2025-05-18 10:14:35.398439	\N	\N
2b3045f0-c3c4-cdca-a1a7-16e99292c00c	@Paul MAZZON test	\N	2025-05-18 10:14:41.689033	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:14:41.689033	\N	\N
9ac00165-e43e-13c7-14b1-24659efb9dcd	@Paul 2 test	\N	2025-05-18 10:22:15.093825	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:22:15.093825	\N	\N
4916a7f4-9096-9369-27e4-04daf182fa72	@Paul MAZZON hjg	\N	2025-05-18 10:25:01.039304	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:25:01.039304	\N	\N
839d228f-a69d-0816-0d6f-aac66fab0256	@Paul 2 jpp	\N	2025-05-18 10:27:27.471779	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:27:27.471779	\N	\N
c97ef1f3-a07d-475d-2422-3e4e7ee49ad0	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc)	\N	2025-05-18 10:32:08.095148	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:32:08.095148	\N	\N
78cb802e-705f-2004-6d43-9f966a99a815	@Paul 2 test	\N	2025-05-18 10:32:36.996006	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:32:36.996006	\N	\N
4f6d161b-a915-e359-a239-3523227c2d6e	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e)	\N	2025-05-18 10:32:49.295968	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:32:49.295968	\N	\N
088fbc9b-232e-25d2-9075-94e8d88a1fe5	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc)	\N	2025-05-18 10:36:38.585458	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:36:38.585458	\N	\N
71c520ba-c285-601c-30c4-bc4359432b77	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e)	\N	2025-05-18 10:36:45.674207	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:36:45.674207	\N	\N
96e8a4fa-f260-ab4d-27da-6a4cf7308aaf	@Paul MAZZON gyug	\N	2025-05-18 10:37:24.233631	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:37:24.233631	\N	\N
d39f1d3c-5141-c9f2-4c20-4513165c8b1d	@Paul MAZZON test	\N	2025-05-18 10:47:55.427514	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 10:47:55.427514	\N	\N
234d4895-4af3-f6d1-81cb-e3a194892e54	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e)  test	\N	2025-05-18 11:04:23.096878	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 11:04:23.096878	\N	\N
11305e05-5b1b-919a-cd8b-3a31ba64e344	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) un essai	\N	2025-05-18 11:18:20.15049	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 11:18:20.15049	\N	\N
29cb873b-5188-7e26-1947-812ac8b52a95	@[Mistral AI](00000000-0000-0000-0000-000000000001)  dispo?	\N	2025-05-18 11:30:23.334892	84f03094-c2df-24d7-6257-8bf9e1993b58	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 11:30:23.334892	\N	\N
556d8141-b219-7596-b5a2-b6915f693e77	Salut ! Je suis disponible pour t'aider. Que puis-je faire pour toi aujourd'hui ?	\N	2025-05-18 11:30:24.600431	84f03094-c2df-24d7-6257-8bf9e1993b58	00000000-0000-0000-0000-000000000001	2025-05-18 11:30:24.600431	\N	\N
7f71bcb3-2c33-b108-a1d6-84c9e53b93a6	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) 	\N	2025-05-18 12:23:52.73893	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 12:23:52.73893	\N	\N
874a1cee-d872-b8e6-6236-b638c2e3831d	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) 	\N	2025-05-18 12:24:10.534395	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 12:24:10.534395	\N	\N
bd7b4c73-2ddf-57c9-a85c-0e9a92475fad	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) 	\N	2025-05-18 12:50:42.797035	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-18 12:50:42.797035	\N	\N
6d4b0e1d-e574-db41-d231-3573b3b17bb2	#Horraire test	\N	2025-05-18 12:56:43.774823	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-18 12:56:43.774823	\N	\N
8edcd37b-ea66-b620-8b94-aed0d1fcd5b1	ll	\N	2025-05-18 14:35:11.563561	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-18 14:35:11.563561	\N	\N
d6b69520-6adf-72fb-4690-9d13cec22042	caca prout	\N	2025-05-18 14:36:56.084952	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 14:36:56.084952	\N	\N
26607712-02eb-afaf-b0a4-41ea31410fbb	caca	\N	2025-05-18 14:37:45.90531	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 14:37:45.90531	\N	\N
8f928f31-9392-5cd4-51df-f0f11edb6ae3	qsdQSD	\N	2025-05-18 14:48:08.817959	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 14:48:08.817959	\N	\N
a1a2ee19-d9df-2cb9-54a9-c5cf03a2c320	dq	\N	2025-05-18 14:48:20.37347	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 14:48:20.37347	\N	\N
6b327446-c5c7-b794-9fba-cc24c666f6cb	qd	\N	2025-05-18 14:48:20.681339	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 14:48:20.681339	\N	\N
581e4587-9c6d-2d44-afa7-df8ca053e3d3	qd	\N	2025-05-18 14:48:20.902964	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 14:48:20.902964	\N	\N
905bf4f7-7f20-5e55-3a8a-4ea71389b009	qdqd	\N	2025-05-18 14:48:21.262931	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 14:48:21.262931	\N	\N
9a81f107-9998-611f-989c-dff72026199e	test	\N	2025-05-18 14:52:21.174767	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-18 14:52:21.174767	\N	\N
f4bf510e-5811-861a-c3ab-8b9da491ecd7	qsfqsf	\N	2025-05-18 14:53:19.134196	84f03094-c2df-24d7-6257-8bf9e1993b58	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 14:53:19.134196	\N	\N
6a7fe642-d698-e230-5bcb-15a970a5c75d	fqsf	\N	2025-05-18 15:01:22.752674	84f03094-c2df-24d7-6257-8bf9e1993b58	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-18 15:01:22.752674	\N	\N
2f1062c3-9eff-7cc3-48c0-f3753eec0f45	aaa	\N	2025-05-18 15:08:59.107101	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-18 15:08:59.107101	\N	\N
b5c80182-280e-0aa2-5b57-e3959f2e15cd	test	\N	2025-05-18 15:19:13.298529	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-18 15:19:13.298529	\N	\N
cae8aeab-84a2-f709-7b1d-85fa862e5d7c	a	\N	2025-05-18 15:27:06.733692	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-18 15:27:06.733692	\N	\N
abbfc9c5-8783-99dc-f740-c96fb9aa2a48	b	\N	2025-05-18 15:27:08.916341	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-18 15:27:08.916341	\N	\N
e5b0cc39-dcdb-9301-75ba-f55c03f8335b	c	\N	2025-05-18 15:27:10.317645	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-18 15:27:10.317645	\N	\N
bdcc702f-de2a-87f1-d4ca-6c6551789924	d	\N	2025-05-18 15:27:10.817254	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-18 15:27:10.817254	\N	\N
4ac1c7eb-3631-626b-c95d-76963754b0e2	e	\N	2025-05-18 15:27:11.299536	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-18 15:27:11.299536	\N	\N
6e5a483c-b718-cc7c-1080-5c00bd82c81c	a	\N	2025-05-18 16:38:05.666835	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-18 16:38:05.666835	\N	\N
7e93ddf0-10f8-c008-f138-6c767c4a9463	"	\N	2025-05-18 16:38:20.182147	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-18 16:38:20.182147	\N	\N
206a666b-d9bc-ffdd-449d-36b7aec42f81	a	\N	2025-05-18 16:39:03.143917	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-18 16:39:03.143917	\N	\N
9e2fda99-304b-ee27-982f-3096591c369a	a	\N	2025-05-18 16:39:03.857565	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-18 16:39:03.857565	\N	\N
d7830018-4ab5-99f6-deaf-5f686ca183d2	a	\N	2025-05-18 16:44:25.923387	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-18 16:44:25.923387	\N	\N
2dd52836-11a5-33ee-97b1-e7e236318574	z	\N	2025-05-18 16:44:28.407085	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-18 16:44:28.407085	\N	\N
1fe16e32-8b16-96ff-8cb2-8f88bafc0312	a	\N	2025-05-18 20:53:26.519762	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-18 20:53:26.519762	\N	\N
94319f47-d8d4-1f4c-fd49-ac64da266f54	a	\N	2025-05-18 20:53:27.764025	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-18 20:53:27.764025	\N	\N
f6e1021b-2b7a-8c21-9b72-6c7faa073008	z	\N	2025-05-18 20:53:28.638524	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-18 20:53:28.638524	\N	\N
3ff75eb0-d339-7b03-03fc-8d2f3131f504	@[Mistral AI](00000000-0000-0000-0000-000000000001) hello	\N	2025-05-19 07:08:41.409888	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 07:08:41.409888	\N	\N
bf7083b5-fde7-7747-9370-3f61d5f383d6	Hello! How can I assist you today? Let's have a friendly conversation.  how about I share an interesting fact to start? Did you know that sea otters hold hands when they sleep to keep from drifting apart? It's a great example of teamwork and community in the animal kingdom. What's something interesting you know?	\N	2025-05-19 07:08:42.701559	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000001	2025-05-19 07:08:42.701559	\N	\N
94dfff85-65d2-44bc-164b-0ec503907517	j	\N	2025-05-19 07:15:11.108331	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 07:15:11.108331	\N	\N
1674e1ae-1986-7790-6fbf-de9fbc75961a	j	\N	2025-05-19 07:15:12.146146	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 07:15:12.146146	\N	\N
84811131-48f1-781f-3654-2002a42867ee	m	\N	2025-05-19 07:19:34.047164	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 07:19:34.047164	\N	\N
c88e775f-6b5e-19f8-3014-fa232c9beb2a	m	\N	2025-05-19 07:19:45.228532	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 07:19:45.228532	\N	\N
4fd3ead2-a6f0-d2ed-e21f-64b8abe324df	m	\N	2025-05-19 07:19:58.552204	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 07:19:58.552204	\N	\N
98ea8f96-3a7f-ff97-c707-dbda4d14176c	a	\N	2025-05-19 08:04:03.866255	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:04:03.866255	\N	\N
0922152a-f257-1bf0-7d5c-7184570c18fc	a	\N	2025-05-19 08:04:05.440447	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:04:05.440447	\N	\N
38d35b49-95e4-7667-682b-8573def86e04	a	\N	2025-05-19 08:08:09.602156	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:08:09.602156	\N	\N
83c1d7d4-5956-270a-52f7-42437402a4c9	a	\N	2025-05-19 08:08:10.2489	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:08:10.2489	\N	\N
621e14cc-1e96-bbf8-f09f-a5b23c1c3480	a	\N	2025-05-19 08:08:10.886615	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:08:10.886615	\N	\N
a4d910fd-e396-db79-df24-d04ba6a34bea	a	\N	2025-05-19 08:08:53.20215	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:08:53.20215	\N	\N
343b165d-054a-1d32-6415-fc5664452c07	kk	\N	2025-05-19 08:13:22.956536	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 08:13:22.956536	\N	\N
b68249ce-2288-4dc7-f0b3-96be0b18eeef	lnnzef	\N	2025-05-19 08:16:23.954278	fa94bcbf-c844-5a0a-b699-37f59efa1916	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-19 08:16:23.954278	\N	\N
457633e5-afa0-3c0e-8e6f-03b7df9c9503	n	\N	2025-05-19 08:16:30.087126	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:16:30.087126	\N	\N
05f20f86-cb96-98be-b824-676190b1c7c7	l	\N	2025-05-19 08:16:48.992878	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:16:48.992878	\N	\N
c9a7317f-55a9-0a8d-e042-4809e1ac598f	k	\N	2025-05-19 08:16:50.250292	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:16:50.250292	\N	\N
24bdcb88-480e-1575-2dea-4244745d34b5	b	\N	2025-05-19 08:17:37.311267	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:17:37.311267	\N	\N
c8cc6181-9d2f-17f8-e422-8133974330db	h	\N	2025-05-19 08:17:42.898346	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:17:42.898346	\N	\N
adb4e51e-17d1-a5bd-385f-8c2b0adf359f	j	\N	2025-05-19 08:18:50.850488	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:18:50.850488	\N	\N
90341ed1-c4cc-a1e9-d97f-290f3312d63c	k	\N	2025-05-19 08:19:06.483449	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:19:06.483449	\N	\N
1fb895d9-b55d-d748-3d6d-67bbd321a616	l	\N	2025-05-19 08:20:45.878177	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:20:45.878177	\N	\N
f973bf2c-6e20-363e-e513-04b785a26f7d	m	\N	2025-05-19 08:20:48.297397	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:20:48.297397	\N	\N
19386d4a-f7ac-5eb6-e7c1-995cc97eb868	m	\N	2025-05-19 08:21:08.280278	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 08:21:08.280278	\N	\N
aed1832b-6b2d-b755-2026-d127cf17a5eb	klrtbt	\N	2025-05-19 08:23:44.802322	fa94bcbf-c844-5a0a-b699-37f59efa1916	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 08:23:44.802322	\N	\N
ed926cdf-69af-61f9-a5e3-08035a5c36d8	gtre	\N	2025-05-19 08:25:52.152901	fa94bcbf-c844-5a0a-b699-37f59efa1916	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 08:25:52.152901	\N	\N
1524ac81-f4a3-5a9f-1849-ac12cd3d0318	test	\N	2025-05-19 08:28:25.924537	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 08:28:25.924537	\N	\N
f94f8ecc-bad5-cf22-40ce-f3cd869fdb8e	qfqs	\N	2025-05-19 08:50:23.93965	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 08:50:23.93965	\N	\N
4245188e-1b30-daae-8e5a-02f3647c78c2	qsdqsdqds	\N	2025-05-19 08:51:02.354844	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 08:51:02.354844	\N	\N
4c7bd6fa-fb6b-3528-4ea9-92bb800d9006	dqsd	\N	2025-05-19 08:51:12.2504	fa94bcbf-c844-5a0a-b699-37f59efa1916	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-19 08:51:12.2504	\N	\N
6d007749-dc61-946f-281d-1e2340ebaf01	caca	\N	2025-05-19 09:55:01.863261	9e115ae6-6b12-5f07-99a8-3497de2fef25	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 09:55:01.863261	\N	\N
79f29b12-4f89-59c6-0a40-f9e260ab5221	@[Mistral AI](00000000-0000-0000-0000-000000000001) test	\N	2025-05-19 09:56:28.724386	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 09:56:28.724386	\N	\N
38e36566-3bbd-f02c-76c4-6cdaecde3a15	It looks like you've started a test with the identifier "l AI" followed by a UUID (Universally Unique Identifier). UUIDs are often used to uniquely identify information in computer systems.\n\nTo proceed with the test, could you please provide more details about what you would like to test? For example:\n- Are you looking to test a specific AI functionality?\n- Do you have any particular scenarios or questions in mind?\n- Are there any criteria or benchmarks you would like to use for the test?\n\nProviding more context will help me assist you better.	\N	2025-05-19 09:56:32.970634	fa94bcbf-c844-5a0a-b699-37f59efa1916	00000000-0000-0000-0000-000000000001	2025-05-19 09:56:32.970634	\N	\N
9f1c3c2d-0610-71cc-40d1-a6c41bf64fb2	test	\N	2025-05-19 09:56:49.439157	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 09:56:49.439157	\N	\N
32d358e6-8a8b-dd45-1734-81e07fffe74e	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) test	\N	2025-05-19 09:57:22.899234	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 09:57:22.899234	\N	\N
02eeac4c-ecc4-7271-e574-03508fa5785d	@[Mistral AI](00000000-0000-0000-0000-000000000001) test	\N	2025-05-19 10:52:42.795774	5d159045-e695-98e8-8462-5f5108f021ee	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 10:52:42.795774	\N	\N
d0a8e9e9-6a6a-d379-16a1-29eb9fc1e993	It looks like you're providing an identifier or a placeholder. Could you please provide more context or specify what kind of test you're referring to? This will help me assist you better.	\N	2025-05-19 10:52:43.675687	5d159045-e695-98e8-8462-5f5108f021ee	00000000-0000-0000-0000-000000000001	2025-05-19 10:52:43.675687	\N	\N
dbd5d694-2466-4303-393f-b9ecff768f2d	@[Mistral AI](00000000-0000-0000-0000-000000000001) recopie ce que je t'envoi	\N	2025-05-19 10:53:05.028006	5d159045-e695-98e8-8462-5f5108f021ee	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 10:53:05.028006	\N	\N
4fa72403-43ea-d9e4-b47a-7f7c743e775c	Bien sûr, je suis prêt à recopier ce que tu m'envoies. Vas-y, envoie-moi le texte que tu souhaites que je recopie.	\N	2025-05-19 10:53:06.188111	5d159045-e695-98e8-8462-5f5108f021ee	00000000-0000-0000-0000-000000000001	2025-05-19 10:53:06.188111	\N	\N
6d082ec7-82b0-6eea-ebe3-d8cc70b3818f	@[Mistral AI](00000000-0000-0000-0000-000000000001) repond moi exactement ce que je t'envoie 	\N	2025-05-19 10:53:27.07277	5d159045-e695-98e8-8462-5f5108f021ee	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 10:53:27.07277	\N	\N
bc58fe48-7145-9a2d-c52f-71322c048a26	D'accord, envoie-moi ce que tu veux que je répète et je le ferai.	\N	2025-05-19 10:53:27.663781	5d159045-e695-98e8-8462-5f5108f021ee	00000000-0000-0000-0000-000000000001	2025-05-19 10:53:27.663781	\N	\N
2483cd3d-1e3a-a207-1c50-4b89ba3c01c8	@[Mistral AI](00000000-0000-0000-0000-000000000001)" retourne moi ce que je t'envoi avant le "	\N	2025-05-19 10:54:08.227454	5d159045-e695-98e8-8462-5f5108f021ee	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 10:54:08.227454	\N	\N
6481e2d5-bc08-acc4-7fc4-6901738a3673	Bien sûr, je vais reformuler votre phrase en enlevant ce qui vient après "AI". Voici ce que vous avez envoyé :\n\nl AI	\N	2025-05-19 10:54:08.976485	5d159045-e695-98e8-8462-5f5108f021ee	00000000-0000-0000-0000-000000000001	2025-05-19 10:54:08.976485	\N	\N
69a08a6d-fe35-f4ba-eba1-7c17d0dd02ba	test	\N	2025-05-19 10:57:18.097685	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 10:57:18.097685	\N	\N
049742c4-ac65-20ad-c740-41f48ea794d2	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) wsh	\N	2025-05-19 10:59:25.699001	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 10:59:25.699001	\N	\N
5ea42385-a37e-077f-f278-76dfd22946a2	{"type":"file","fileUrl":"messages/files/8463f9ed-894e-4a4b-86a4-af0199e06687.jpg","fileName":"Ragondin-et-sa-dent..jpg","fileSize":516080,"fileType":"image/jpeg","isImage":true}	\N	2025-05-19 10:59:45.628834	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 10:59:45.628834	\N	\N
1ffc1b74-e579-dc29-fe86-c59078e5a5d9	Sondage créé : [cacapout](https://strawpoll.com/XmZRQ1Ojmgd) [strawpoll:XmZRQ1Ojmgd]	\N	2025-05-19 11:00:13.39637	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 11:00:13.39637	\N	\N
bb2c2821-f809-2297-9c43-42b773990771	#canal	\N	2025-05-19 11:01:24.635737	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 11:01:24.635737	\N	\N
9815b384-2f54-ed9a-40d1-0f80f19dd22d	y'a les # a réparer	\N	2025-05-19 11:01:43.640866	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 11:01:43.640866	\N	\N
819d73f7-3d7c-41c2-2fc7-245de49b55e3	zefzf	\N	2025-05-19 11:02:41.754309	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 11:02:41.754309	\N	1ffc1b74-e579-dc29-fe86-c59078e5a5d9
83215269-d49a-df89-1f65-0554d9536879	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) 	\N	2025-05-19 11:05:31.483378	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 11:05:31.483378	\N	\N
1c58fd72-98e9-9946-aaef-7fdf85d4c76d	{"type":"file","fileUrl":"messages/files/75d8f201-543b-4e18-8a5f-36be886cd62a.jpg","fileName":"images (4).jpg","fileSize":4524,"fileType":"image/jpeg","isImage":true}	\N	2025-05-19 11:05:35.450965	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 11:05:35.450965	\N	\N
be65df9a-c712-3326-73d2-c2a3e062dd71	j	\N	2025-05-19 11:14:55.735015	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 11:14:55.735015	\N	\N
ba988693-f23e-5785-1893-dea12ced2f81	h	\N	2025-05-19 11:15:02.389074	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 11:15:02.389074	\N	\N
e788d11c-e1c3-b94f-ded7-ceddd45dbd65	a	\N	2025-05-19 11:15:15.705531	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 11:15:15.705531	\N	\N
880b43ed-daf9-a205-7105-196f300424e2	a	\N	2025-05-19 11:15:21.939003	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 11:15:21.939003	\N	\N
2a8f7d20-b51c-23ad-2536-ffe3e7056955	a	\N	2025-05-19 11:15:30.928404	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 11:15:30.928404	\N	\N
68357bf9-5f7d-5bd3-eb7e-d29cd335cb57	j	\N	2025-05-19 11:15:41.518965	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 11:15:41.518965	\N	\N
926f3154-755c-02e6-bcfc-290d63f61b6e	h	\N	2025-05-19 11:15:48.753247	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 11:15:48.753247	\N	\N
e78b4325-610a-daef-ec12-13b3fb3353aa	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) hello	\N	2025-05-19 11:29:40.710662	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 11:29:40.710662	\N	\N
b7a4ba85-152e-cfd9-5034-552c7f0036a3	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) 	\N	2025-05-19 11:47:09.584962	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 11:47:09.584962	\N	\N
fb21777f-3a57-660d-2a5b-28bcc224da21	@[Math Homo](fd6ff12d-384e-055e-6e7c-f9a06b7e9af0) alexis est VIRé	\N	2025-05-19 11:47:53.589084	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-19 11:47:53.589084	\N	\N
c0b0863b-5cd5-5aaf-f9bf-549aaca59c00	gros con	\N	2025-05-19 11:47:59.446433	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-19 11:47:59.446433	\N	\N
dfa9d367-26f9-5acd-b924-f0d83c13cac3	test	\N	2025-05-19 12:21:32.858302	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-19 12:21:32.858302	\N	\N
b3c12afd-37cc-07ab-be5a-94f405954fb9	lk	\N	2025-05-19 13:25:58.266575	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 13:25:58.266575	\N	\N
cf845e7b-6b11-1a7b-440a-c154c50c1334	pm	\N	2025-05-19 13:26:01.190204	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 13:26:01.190204	\N	\N
2f947eb2-7316-4fbd-2670-e683c232e05e	kkn	\N	2025-05-19 13:26:06.676562	07d1837c-59fe-d357-906a-acd22d3e162a	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-19 13:26:06.676562	\N	\N
48afd596-d627-2364-a996-835ed843f330	a	\N	2025-05-19 14:10:47.463416	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 14:10:47.463416	\N	\N
b717d415-f6e2-7b5c-5a41-592c80a698c1	gros con	\N	2025-05-19 14:42:20.057465	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-19 14:42:20.057465	\N	\N
d15375fc-abad-f73a-4cb9-a8c3d37e15f0	tg	\N	2025-05-19 14:46:30.51639	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 14:46:30.51639	\N	\N
2bc00bbc-fcaf-70a4-fca1-9a83e14bfbc5	toi gros con	\N	2025-05-19 14:46:36.315127	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 14:46:36.315127	\N	\N
eddb6838-5be9-7e0e-8742-bab6fb6fb3c0	@[Math'BigDick](bb6a4d43-70d3-5e36-d943-dfdfc747491f) aaaa	\N	2025-05-19 14:49:07.627742	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-19 14:49:07.627742	\N	\N
231a7d59-b1c5-c5d8-5d07-ab991c6c0caf	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) caca prout	\N	2025-05-19 14:53:47.033583	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-19 14:53:47.033583	\N	\N
b083a316-bd3e-1a64-b225-ca5a43c2bede	@[Math'BigDick](bb6a4d43-70d3-5e36-d943-dfdfc747491f) gros con	\N	2025-05-19 14:53:55.362398	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-19 14:53:55.362398	\N	\N
47b80d31-e41d-f548-3ec1-5c3df412d910	1	\N	2025-05-20 09:14:27.62593	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:27.62593	\N	\N
de345bb8-8aa1-94e4-e63e-c75ee75f52b1	2	\N	2025-05-20 09:14:28.52004	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:28.52004	\N	\N
82ce560f-5c50-3eaf-1d94-8060dfeb1d38	3	\N	2025-05-20 09:14:29.375819	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:29.375819	\N	\N
be713208-baa9-92fe-3d7c-9934caef050b	4	\N	2025-05-20 09:14:30.278652	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:30.278652	\N	\N
063bbb9e-c153-7961-ffdd-4c45ae9d89ad	5	\N	2025-05-20 09:14:31.045101	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:31.045101	\N	\N
1b7bf35b-4dcb-4f49-417c-47e02a0463d9	6	\N	2025-05-20 09:14:31.840615	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:31.840615	\N	\N
d6051b1f-0cfa-0ca6-a05b-3d99bde4797b	7	\N	2025-05-20 09:14:32.529987	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:32.529987	\N	\N
ee1f5fd7-43c4-c65b-8f6f-b963a9370440	8	\N	2025-05-20 09:14:33.422088	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:33.422088	\N	\N
cf675b13-3a5f-360a-27a2-d1a0b64c0edb	9	\N	2025-05-20 09:14:34.442596	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:34.442596	\N	\N
be65f40f-9542-d00a-7278-7f2d22e81aa3	10	\N	2025-05-20 09:14:35.522536	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:35.522536	\N	\N
98afeda6-77b1-e751-09bb-1d76c2d814d5	11	\N	2025-05-20 09:14:36.566497	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:36.566497	\N	\N
fee6d52b-e3a5-415b-c45b-ecb012d8c330	12	\N	2025-05-20 09:14:38.304249	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:38.304249	\N	\N
b3861696-dad9-d89e-8866-d8f300adb4c7	13	\N	2025-05-20 09:14:39.5173	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:39.5173	\N	\N
c0ad1bd2-bc64-7195-0bdd-a90c35724661	14	\N	2025-05-20 09:14:40.614243	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:40.614243	\N	\N
631d2eb2-df6c-b77a-0d1b-04643796abac	15	\N	2025-05-20 09:14:41.907493	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:41.907493	\N	\N
508f88b8-d219-0f04-b277-b5795452c82b	16	\N	2025-05-20 09:14:42.828126	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:42.828126	\N	\N
cdbfadbf-2cb5-fb5c-0159-51d24e352619	17	\N	2025-05-20 09:14:43.90981	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:43.90981	\N	\N
8b817d6e-af52-87db-4d62-b97c36046ba5	18	\N	2025-05-20 09:14:46.082872	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:46.082872	\N	\N
8ab43ce5-2cf6-d83d-1c10-151a302da321	19	\N	2025-05-20 09:14:47.235046	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:47.235046	\N	\N
974b4392-def9-2974-ee40-04dfbba080fc	20	\N	2025-05-20 09:14:49.157236	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:49.157236	\N	\N
9c701e2b-e318-b2bb-89f1-43f514c1460a	21	\N	2025-05-20 09:14:50.189408	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:50.189408	\N	\N
7daec989-51e9-8904-13e4-533d00af1108	22	\N	2025-05-20 09:14:51.057504	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:51.057504	\N	\N
3d973b5a-65b1-0690-0daf-84e556d51567	23	\N	2025-05-20 09:14:52.05272	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:52.05272	\N	\N
128f2093-daa9-e8f6-7697-8ffeb752f75b	24	\N	2025-05-20 09:14:52.990991	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:52.990991	\N	\N
1aa6df6c-8b2a-d0ea-6cdb-4b2e4c159ab1	25	\N	2025-05-20 09:14:54.155872	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:54.155872	\N	\N
f9428d19-9d41-4dd1-83da-acc0655f787d	26	\N	2025-05-20 09:14:55.526807	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:55.526807	\N	\N
bfb78c7a-3f9c-709c-a3e5-44380b960f6b	27	\N	2025-05-20 09:14:57.308917	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:57.308917	\N	\N
9911900a-58ef-aaad-38d2-351a7f2d3bcc	28	\N	2025-05-20 09:14:58.686367	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:14:58.686367	\N	\N
318c8470-0fc3-ae22-2d69-52991c640f0b	29	\N	2025-05-20 09:15:03.433254	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:15:03.433254	\N	\N
ea5e5ecd-2e8a-cf5d-fd86-15ae65f90fa3	30	\N	2025-05-20 09:15:04.565988	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:15:04.565988	\N	\N
32794e76-6590-363d-05ab-b7258a2c95a0	31	\N	2025-05-20 09:15:06.51105	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:15:06.51105	\N	\N
f867f106-24c0-5def-d845-054955aaacd2	42	\N	2025-05-20 09:15:07.674101	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 09:15:07.674101	\N	\N
cfc499d3-0826-c301-ee82-37211f9dc6c3	test	\N	2025-05-20 10:03:53.092591	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 10:03:53.092591	\N	\N
9bcd1925-d8da-b580-9149-a855969fe9a8	caca	\N	2025-05-20 10:05:18.934921	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 10:05:18.934921	\N	\N
5919df85-afee-4ad4-6871-36222426720d	a	\N	2025-05-20 10:15:17.24872	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 10:15:17.24872	\N	\N
5834d936-d1db-e132-f8eb-8c3ab359623c	{"type":"file","fileUrl":"messages/files/78600712-9fd1-4afa-a38e-152fa5ec6e7a.jpg","fileName":"cout-rat-domestique-093828-650-400.jpg","fileSize":188480,"fileType":"image/jpeg","isImage":true}	\N	2025-05-20 11:15:41.32771	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-20 11:15:41.32771	\N	\N
21877843-20b5-b19d-19bf-e168c146731e	Sondage créé : [etst](https://strawpoll.com/3RnYX8GKDye) [strawpoll:3RnYX8GKDye]	\N	2025-05-20 11:19:46.704379	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 11:19:46.704379	\N	\N
9075d774-30ab-d073-4bb7-a61631ed03b8	m	\N	2025-05-20 11:31:16.724003	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-20 11:31:16.724003	\N	\N
abc1889d-895a-b922-e354-9d956b55e480	@[Math Homo](fd6ff12d-384e-055e-6e7c-f9a06b7e9af0) coucou	\N	2025-05-20 11:31:42.666213	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-20 11:31:42.666213	\N	\N
da29988a-a97f-7a27-1dfd-74818bfc8d45	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc)  jjj	\N	2025-05-20 11:43:52.242651	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-20 11:43:52.242651	\N	\N
74d5d999-4dc2-95b3-a374-73ab71f7bf2a	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) caca	\N	2025-05-20 11:45:51.993882	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-20 11:45:51.993882	\N	\N
6182b5a5-66b0-6b6e-b9ac-cdf62b71fa84	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) top	\N	2025-05-20 11:47:33.166592	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-20 11:47:33.166592	\N	\N
6b8224de-2aff-1e8d-76e6-baab2a8ff2da	zizi	\N	2025-05-20 11:50:55.411248	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 11:50:55.411248	\N	\N
e3de27b2-bf01-ccb7-a296-1dee40138298	sida	\N	2025-05-20 11:52:50.253194	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 11:52:50.253194	\N	\N
124a2958-d7a6-e203-feae-691787d1f339	loutre caca	\N	2025-05-20 11:53:04.37449	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 11:53:04.37449	\N	\N
8cb57a36-4697-bf9e-ea6f-d13bade4bce1	aaaaaa	\N	2025-05-20 11:54:50.235537	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 11:54:50.235537	\N	\N
fb391c14-f6d1-5bbf-9eb6-d13894c90513	ououou	\N	2025-05-20 11:55:02.932639	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 11:55:02.932639	\N	\N
128d8f6a-9ba8-0c5c-1fa4-4a2ad58b9289	alalalal	\N	2025-05-20 11:59:22.332736	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-20 11:59:22.332736	\N	\N
dd6a1ff6-dbf0-99af-bb08-0c28a7f1770b	mmmmm	\N	2025-05-20 12:04:02.127569	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 12:04:02.127569	\N	\N
e4c23b17-44b5-545f-89d7-1174150bb03f	LLL	\N	2025-05-20 12:10:08.128661	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 12:10:08.128661	\N	\N
a279c145-3fc8-27db-279b-b09823135007	MMM	\N	2025-05-20 12:10:14.922815	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 12:10:14.922815	\N	\N
40c94b69-bbc4-a9e2-677d-4ea89bbf78af	jjjjj	\N	2025-05-20 12:13:48.373475	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 12:13:48.373475	\N	\N
e003b4e9-0470-74e8-f1f2-a6d2a371c908	kiki	\N	2025-05-20 12:22:51.247359	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-20 12:22:51.247359	\N	128d8f6a-9ba8-0c5c-1fa4-4a2ad58b9289
e9982202-7daa-5f7e-d3db-a199efc3a4db	test	\N	2025-05-20 12:53:17.195861	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 12:53:17.195861	\N	5834d936-d1db-e132-f8eb-8c3ab359623c
9d5e58c9-dd4a-771f-a77a-fcfd015463f8	test	\N	2025-05-20 12:54:08.18365	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 12:54:08.18365	\N	231a7d59-b1c5-c5d8-5d07-ab991c6c0caf
7305bf5b-86b0-28b4-59bc-542ba0848975	test test test test 	\N	2025-05-20 12:55:00.877442	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-20 12:55:00.877442	\N	\N
6e905202-4a8c-9a01-0222-d7c8338f9496	{"type":"file","fileUrl":"messages/files/7c772f96-4be2-47ac-8c44-409ed4c8292d.png","fileName":"google.png","fileSize":20865,"fileType":"image/png","isImage":true}	\N	2025-05-22 07:56:06.76121	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-22 07:56:06.76121	\N	\N
73b4597d-ab4b-1786-a13d-2eeca2042b7f	Sondage créé : [gzefgz](https://strawpoll.com/X3nkPx49zgE) [strawpoll:X3nkPx49zgE]	\N	2025-05-22 07:56:13.323265	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-22 07:56:13.323265	\N	\N
8cfd52f4-8ae9-368b-191f-f0470c58706d	@Mistral AI test	\N	2025-05-22 07:56:18.241309	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-22 07:56:18.241309	\N	\N
41b49060-15ab-a4de-8100-3a848408a2a0	Sure, I'd be happy to help facilitate a test of my capabilities as an artificial intelligence. Here are a few types of tests we could do:\n\n1. **Turing Test**: I can try to convince you that I'm a human. You can ask me any questions or engage in a conversation to see if you can tell that I'm an AI.\n\n2. **Knowledge Test**: You can ask me questions about a wide range of topics to test the breadth and depth of my knowledge.\n\n3. **Reasoning Test**: I can try to solve puzzles or problems that require logical reasoning.\n\n4. **Creativity Test**: I can try to write a short story, a poem, or create something else that requires creativity.\n\n5. **Empathy Test**: I can try to respond appropriately to various emotional scenarios.\n\nPlease choose one or more tests you'd like to conduct, or suggest another type of test you have in mind. Let's start whenever you're ready!	\N	2025-05-22 07:56:23.415236	07d1837c-59fe-d357-906a-acd22d3e162a	00000000-0000-0000-0000-000000000001	2025-05-22 07:56:23.415236	\N	\N
a6543c10-07dc-9671-2986-1e14bc25eb85	@[Math'BigDick](bb6a4d43-70d3-5e36-d943-dfdfc747491f) salut	\N	2025-05-22 07:56:27.398223	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-22 07:56:27.398223	\N	\N
b38ecfe8-3515-8dbf-083a-f0c97bc2540a	#canal1	\N	2025-05-22 07:56:46.018352	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-22 07:56:46.018352	\N	\N
3a10627d-6ba2-67e2-89df-29b2c78548de	#files	\N	2025-05-22 07:56:52.128308	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-22 07:56:52.128308	\N	\N
9d36da7b-6f36-70ce-2ce4-78baa9b60fed	@[Math Homo](fd6ff12d-384e-055e-6e7c-f9a06b7e9af0) coucou	\N	2025-05-22 09:44:38.186149	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-22 09:44:38.186149	\N	\N
bfe214da-03d7-3714-8085-8496065bd39f	{"type":"file","fileUrl":"messages/files/06820381-c0b0-437e-a4b4-98a0e04de55b.png","fileName":"ChatGPT Image 4 mai 2025, 13_44_00.png","fileSize":489,"fileType":"image/png","isImage":true}	\N	2025-05-22 09:45:00.78627	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-22 09:45:00.78627	\N	\N
c8fc472e-747e-eb2e-c74d-d347510c3871	test	\N	2025-05-25 14:47:59.279075	07d1837c-59fe-d357-906a-acd22d3e162a	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-25 14:47:59.279075	\N	\N
a31b4774-5e58-d12e-33f4-d8c882cb51cc	ALALALALALAAL	\N	2025-05-26 07:37:04.037829	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-26 07:37:04.037829	\N	\N
a61dee9f-9c0e-894b-78f3-735e6793017a	Salut	\N	2025-05-26 07:50:54.183563	84f03094-c2df-24d7-6257-8bf9e1993b58	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 07:50:54.183563	\N	\N
2ee01b1a-5e84-f5df-8dac-b8c95841cb54	{"type":"file","fileUrl":"messages/files/7be59caf-ce37-4574-8bcb-154e6fb46794.mp4","fileName":"1599562049529.mp4","fileSize":866358,"fileType":"video/mp4","isImage":false}	\N	2025-05-26 07:56:09.896776	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 07:56:09.896776	\N	\N
eb8f253b-358e-4618-451a-1bbeab966da9	test	\N	2025-05-26 07:56:35.543118	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 07:56:35.543118	\N	\N
0e9c83b2-de12-e251-9071-b0dc64753616	ALALALALA	\N	2025-05-26 07:56:42.782571	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 07:56:42.782571	2025-05-26 07:56:52.100267	\N
5f3f07a7-16fb-f166-6b84-8310aa10de7e	caca prout	\N	2025-05-26 07:58:43.080111	84f03094-c2df-24d7-6257-8bf9e1993b58	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 07:58:43.080111	2025-05-26 07:58:50.792993	\N
51df197a-bb36-fd1b-2431-ae922a127adc	33	\N	2025-05-26 08:04:50.836835	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:04:50.836835	\N	\N
3cab8381-42b2-c5dd-c652-97427aac43ef	34	\N	2025-05-26 08:04:54.201979	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:04:54.201979	\N	\N
51ae5da8-2028-95e4-58eb-086cb5f1a7a7	35	\N	2025-05-26 08:04:55.401107	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:04:55.401107	\N	\N
5e490496-962c-7872-c992-e2738ab43c87	36	\N	2025-05-26 08:04:56.46856	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:04:56.46856	\N	\N
e6a0bf92-aae8-08ef-73ea-e6980741ed77	37	\N	2025-05-26 08:04:57.365527	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:04:57.365527	\N	\N
3c910b90-4c99-8c23-065a-3f8acbd82086	38	\N	2025-05-26 08:04:58.082116	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:04:58.082116	\N	\N
8b8ebe21-542c-8e0d-08ea-d02fffdd745d	39	\N	2025-05-26 08:05:00.494502	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:00.494502	\N	\N
3ef5a996-27b2-ae15-e5d6-f48c4f976f62	40	\N	2025-05-26 08:05:02.188854	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:02.188854	\N	\N
a409b4a7-f36e-5e5f-1a8f-e7cca5ec0b53	41	\N	2025-05-26 08:05:03.396298	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:03.396298	\N	\N
7bd12c23-4ff2-5200-50b0-f05ee3bf7018	4	\N	2025-05-26 08:05:04.164952	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:04.164952	\N	\N
d7990e96-f88f-b12f-319c-b0c0340ec520	43	\N	2025-05-26 08:05:06.750725	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:06.750725	\N	\N
1eb61a7f-3a44-1aa2-ed50-105a5f6de52e	44	\N	2025-05-26 08:05:08.167447	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:08.167447	\N	\N
999192d5-9fc6-6ad1-8024-3fee4bc27af3	45	\N	2025-05-26 08:05:08.906528	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:08.906528	\N	\N
6bf95893-e07e-041e-e7e0-9fb849116014	46	\N	2025-05-26 08:05:09.531071	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:09.531071	\N	\N
9e4d9a77-3ba8-dc39-0716-4f962ea77ccb	47	\N	2025-05-26 08:05:11.002252	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:11.002252	\N	\N
e8b01130-3fe1-b154-fc53-a23d76eb7ea2	48	\N	2025-05-26 08:05:12.238898	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 08:05:12.238898	\N	\N
a6ce22cb-2052-fe76-3792-929ffe76af77	testes	\N	2025-05-26 08:08:26.100528	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-26 08:08:26.100528	\N	\N
28f13c3e-2651-7209-2543-b605b75c9ef0	loulouloulou	\N	2025-05-26 08:08:37.586057	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-26 08:08:37.586057	2025-05-26 08:08:49.247147	\N
f59f97dd-85d8-3411-6467-dfa96921a801	kjj	\N	2025-05-26 08:55:59.116172	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 08:55:59.116172	\N	\N
c57e3db6-eaf0-879a-00b0-18777b012655	LLLL	\N	2025-05-26 09:12:42.361051	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 09:12:42.361051	\N	\N
78a65c10-d512-7906-1ca1-4533f5ca5476	Coucou	\N	2025-05-26 09:40:23.552319	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 09:40:23.552319	\N	\N
6a55dc47-7e8e-2ee2-8e0b-96f020149e6f	Caca	\N	2025-05-26 09:40:28.357652	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 09:40:28.357652	\N	\N
887733c1-6709-5b0d-196e-c94b03d0c192	Test	\N	2025-05-26 09:41:26.787123	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 09:41:26.787123	\N	\N
a31371f5-5ba2-faa3-f41f-dd775a06aa34	Test	\N	2025-05-26 09:41:28.938595	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 09:41:28.938595	\N	\N
34af43b4-b0e9-fada-540a-17b0a94d0d2c	Caca	\N	2025-05-26 09:41:31.494325	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 09:41:31.494325	\N	\N
6a2d12c8-0132-23c0-f051-57df3e9ef0fc	r	\N	2025-05-26 13:39:24.93611	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:39:24.93611	\N	\N
ed5a88e9-3e36-2a09-6835-e0212620b32b	jjlllmmmm	\N	2025-05-26 09:55:17.988845	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 09:55:17.988845	2025-05-26 09:56:45.585109	\N
9be61e09-f277-0281-e820-3355a8959caa	Test	\N	2025-05-26 09:57:06.76205	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 09:57:06.76205	\N	\N
28b1b0a1-9eb1-b0b1-6e81-5c9edfa522ab	caca	\N	2025-05-26 11:11:31.086563	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 11:11:31.086563	\N	\N
a1e6e6c8-dff6-2797-e6ab-85131aa4da56	test	\N	2025-05-26 11:11:34.040173	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 11:11:34.040173	\N	\N
d978c698-eeaa-dc7b-babd-91de4dafb21a	pipi	\N	2025-05-26 11:11:37.423084	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 11:11:37.423084	\N	\N
d03aba9b-b7b6-6c80-a056-ad8d786f6bfa	prout	\N	2025-05-26 11:11:42.323722	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 11:11:42.323722	\N	\N
2a15aa89-187e-df8a-7940-5086934281e7	jkjkbb	\N	2025-05-26 11:16:40.235341	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 11:16:40.235341	\N	\N
00a4641c-7f93-c2ff-f46b-12cffb333612	jkbkjbjkbjkb	\N	2025-05-26 11:17:01.657679	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 11:17:01.657679	2025-05-26 11:17:09.748685	\N
31f32ad6-c58c-84f5-541a-e3817874d4a7	jhjkh	\N	2025-05-26 11:21:25.923221	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 11:21:25.923221	\N	\N
e03f72aa-07de-1082-88a7-89e01a1aad69	khuh	\N	2025-05-26 11:21:28.149051	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 11:21:28.149051	\N	\N
3d0fe708-29d4-45e4-0f2e-793274998fb0	jjj	\N	2025-05-26 12:07:47.611494	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:07:47.611494	\N	\N
724dab95-4f19-72aa-65c8-b7ea99452843	jj	\N	2025-05-26 12:07:49.088177	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:07:49.088177	\N	\N
f42f0167-418a-0359-3071-d472ff5db29c	jk	\N	2025-05-26 12:07:50.103803	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:07:50.103803	\N	\N
844bd255-8f79-a848-64f6-f53be7ecfbdf	jj	\N	2025-05-26 12:07:50.873698	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:07:50.873698	\N	\N
1b1194a6-acc0-35c9-c819-3aecd582c923	jj	\N	2025-05-26 12:07:51.645136	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:07:51.645136	\N	\N
ad701401-c3d2-db78-282b-dda68ef91d12	bb	\N	2025-05-26 12:07:59.182257	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:07:59.182257	\N	\N
6bf8a9dc-cbdd-1332-a772-fb955de0ea35	bb	\N	2025-05-26 12:08:00.275037	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:08:00.275037	\N	\N
f3697636-9e06-2ead-7da6-df54b365ca59	bb	\N	2025-05-26 12:08:01.994137	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:08:01.994137	\N	\N
845d9b3c-bece-cf16-42e8-952c2cb83f99	  *	\N	2025-05-26 12:08:16.842281	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:08:16.842281	\N	\N
d97df2bb-c1c4-b9b2-27b5-17100c680881	kk	\N	2025-05-26 12:08:17.426458	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:08:17.426458	\N	\N
c74f32c6-5718-f90b-a23f-6f6febed309e	kk	\N	2025-05-26 12:08:18.053163	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:08:18.053163	\N	\N
dec31248-0198-5120-2474-70c2fab67fac	kk	\N	2025-05-26 12:08:18.657587	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:08:18.657587	\N	\N
13330c04-30c3-a526-bc0d-77af1ceddbf8	mm	\N	2025-05-26 12:08:27.605281	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:08:27.605281	\N	\N
2af4b264-405f-0e27-0a2a-62178b711a44	kk	\N	2025-05-26 12:09:00.836289	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:09:00.836289	\N	\N
fc574412-860e-de2d-6af6-105e9538142f	jj	\N	2025-05-26 12:09:15.698828	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:09:15.698828	\N	\N
7ac3cb86-3849-0208-e95c-5ffcb115dd9e	caca	\N	2025-05-26 12:09:45.575705	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 12:09:45.575705	\N	\N
31e4adee-34b7-8b48-7178-e061997b96c2	dsfdsdfsd	\N	2025-05-26 12:14:28.607275	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:14:28.607275	\N	\N
9260a1b1-57be-f185-d07f-e5171955d537	fds	\N	2025-05-26 12:14:30.641356	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:14:30.641356	\N	\N
dc8653fe-bcda-f8c0-fa37-9577ef854061	sdf	\N	2025-05-26 12:14:31.497055	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:14:31.497055	\N	\N
86ae1c99-5732-9591-5b10-637d3a0b52df	JIOHIOHOIH	\N	2025-05-26 12:16:07.880554	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:16:07.880554	\N	\N
304f2c43-6e86-e533-ab6b-670ee914f0c9	jjjj	\N	2025-05-26 12:22:44.281105	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:22:44.281105	\N	\N
a3ef69ea-5206-22fa-06d2-7a6ba6100748	ergetryjtuyiiukyjtthgfdfgertrhyuooimlkjhgfdsf	\N	2025-05-26 12:39:32.859103	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:39:32.859103	\N	\N
5919f004-0521-5fd4-2da7-b361685766bc	ghtj	\N	2025-05-26 12:39:33.483498	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:39:33.483498	\N	\N
7d58272a-0dbd-aa6b-8c48-2755c49a0e51	l	\N	2025-05-26 12:39:41.870783	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:39:41.870783	\N	\N
992a7e32-45fc-1758-c1fd-134047a8b92b	jjjj	\N	2025-05-26 12:39:45.501498	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:39:45.501498	\N	\N
dfbd023d-2c39-ac63-19a4-6348db5290e6	fdgdfgfg	\N	2025-05-26 12:45:23.060526	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 12:45:23.060526	\N	\N
4bf6331b-855b-51d9-a969-f45897850b66	mmm	\N	2025-05-26 13:24:49.230496	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:24:49.230496	\N	\N
5d50a051-8f83-0b9b-ea5f-62d4d0554b5d	fjghfjkghksfhg	\N	2025-05-26 13:26:21.039505	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:26:21.039505	\N	\N
fa1a587e-6560-1b96-8888-d0f547278ad2	fdsfdssf	\N	2025-05-26 13:26:44.845006	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:26:44.845006	\N	\N
0a7ebe86-891e-3134-974e-6490bba7b91a	cac	\N	2025-05-26 13:29:26.822203	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:29:26.822203	\N	\N
4debedf1-127f-6bd3-364d-4910ec384c14	test	\N	2025-05-26 13:31:03.770654	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:31:03.770654	\N	\N
9b05f1e0-08fb-8d4e-c24a-553ab02ac3bb	test	\N	2025-05-26 13:32:09.723634	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:32:09.723634	\N	\N
b0aacab2-1676-cbb8-f630-0fdb6fbfebc0	mmm	\N	2025-05-26 13:33:28.613827	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:33:28.613827	\N	\N
5eac12bb-1005-7ddf-6b6a-130a87129491	caca	\N	2025-05-26 13:33:30.097748	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:33:30.097748	\N	\N
5523fdc4-b652-cab6-8ae1-9d4c325de997	m	\N	2025-05-26 13:33:31.417731	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:33:31.417731	\N	\N
5a1b5b52-01c5-9fb8-21cf-dd723ef851fc	caca	\N	2025-05-26 13:33:35.344309	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:33:35.344309	\N	\N
d6cea91e-ae5f-89ef-3ba8-363d604476a4	m	\N	2025-05-26 13:33:35.635758	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:33:35.635758	\N	\N
726d0ced-0fe1-75a1-6935-b641cbb30f54	prout	\N	2025-05-26 13:33:39.425679	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:33:39.425679	\N	\N
aa5cf50f-0213-e0b4-5388-db6176ce6fa9	m	\N	2025-05-26 13:33:47.189918	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:33:47.189918	\N	\N
93258099-36db-3c07-9e66-c75afdd8a7db	yo	\N	2025-05-26 13:33:47.576428	07d1837c-59fe-d357-906a-acd22d3e162a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-05-26 13:33:47.576428	\N	\N
203165ec-4e16-4591-bbc1-a0d358d9a4b3	k	\N	2025-05-26 13:33:49.376616	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:33:49.376616	\N	\N
605da79a-b911-217b-eb9d-4bad47ce756e	gg	\N	2025-05-26 13:36:42.958623	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:36:42.958623	\N	\N
1affe319-0766-8958-2589-81188749718a	ggg	\N	2025-05-26 13:36:47.298458	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:36:47.298458	\N	\N
8e75e3b6-6205-6d10-75dc-ecf6fc77b2d4	g	\N	2025-05-26 13:36:48.203388	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:36:48.203388	\N	\N
96e3cfce-7e3c-27ac-07b7-a4e04eb7e4f4	g	\N	2025-05-26 13:36:58.974297	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:36:58.974297	\N	\N
18ce4790-54e5-4180-bd5a-2ef3d9fecbe8	g	\N	2025-05-26 13:37:00.244989	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:37:00.244989	\N	\N
f3ed8482-c76c-476b-4694-3a2f428dcec7	k	\N	2025-05-26 13:37:03.0895	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:37:03.0895	\N	\N
f4197e65-367b-e24a-7f6c-65b7651823db	ffff	\N	2025-05-26 13:38:38.995949	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:38:38.995949	\N	\N
b40af534-d3a5-a9af-8bfd-68fef3c95eb4	caca	\N	2025-05-26 13:38:42.897641	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:38:42.897641	\N	\N
7dba3bae-5f41-0cf7-ed80-5793b22b2dbe	caca	\N	2025-05-26 13:38:46.368227	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:38:46.368227	\N	\N
99a5712f-af65-8715-2c74-9884c7a6dc1d	h	\N	2025-05-26 13:38:49.643065	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:38:49.643065	\N	\N
31450aa0-0a84-0ccc-4368-cf337e41850d	test	\N	2025-05-26 13:38:53.70182	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:38:53.70182	\N	\N
8a7af500-6d47-d616-fac7-3e6211f9d03d	h	\N	2025-05-26 13:40:56.047852	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:40:56.047852	\N	\N
27388f8f-023c-f5e6-8802-c6ef573885fa	l	\N	2025-05-26 13:40:57.933714	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:40:57.933714	\N	\N
9882005f-0be1-9712-cbd0-54210aae83cc	cac	\N	2025-05-26 13:41:19.939697	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:41:19.939697	\N	\N
a2605779-3cd2-31a0-a959-97aca987e5f0	test	\N	2025-05-26 13:42:39.611649	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:42:39.611649	\N	\N
642952db-db78-568c-fa41-07067b00bff7	caca	\N	2025-05-26 13:42:49.504928	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:42:49.504928	\N	\N
c321946b-a84a-8739-4eaa-65beffb75c5a	test	\N	2025-05-26 13:42:53.301959	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:42:53.301959	\N	\N
de9b8b95-cc81-8751-b280-77f7cca1ae34	caca	\N	2025-05-26 13:44:05.325321	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:44:05.325321	\N	\N
fd70ebf9-5461-3bdf-4c5b-1860a950d228	hiozrghrhu	\N	2025-05-26 13:45:48.598978	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:45:48.598978	\N	\N
d142fbeb-e96f-0e1d-b811-e31e94cb4f3e	prout	\N	2025-05-26 13:46:57.010628	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:46:57.010628	\N	\N
1fa26538-7f13-e3da-0ddb-5d0ae2372e88	test	\N	2025-05-26 13:46:59.793909	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:46:59.793909	\N	\N
bcc0e0dc-75b6-508c-7937-b3c3ae18e30c	test	\N	2025-05-26 13:48:39.895695	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:48:39.895695	\N	\N
3c110284-a614-79b6-d6f1-89667e1d4336	kjbkjk	\N	2025-05-26 13:49:08.548935	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:49:08.548935	\N	\N
b2925672-6bd7-db89-f62f-baefbd0ab01b	opjkoj	\N	2025-05-26 13:55:44.65236	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:55:44.65236	\N	\N
8c798090-a3eb-2f90-a065-285b35245e5e	m	\N	2025-05-26 13:55:51.588371	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:55:51.588371	\N	\N
83d7341d-f93c-c3f1-bdc7-ce6c1d072bf8	mmm	\N	2025-05-26 13:59:39.274463	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 13:59:39.274463	\N	\N
1f958fc2-afb4-6abf-157f-6b9f3b58fc6a	test	\N	2025-05-26 13:59:40.587651	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 13:59:40.587651	\N	\N
f5703645-dd66-4065-b8eb-62aa461b1e07	test	\N	2025-05-26 14:03:28.643197	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:03:28.643197	\N	\N
ec56a06b-2af3-2f52-98c4-7f6895856f16	caca	\N	2025-05-26 14:03:31.961003	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:03:31.961003	\N	\N
68179a5b-2cb6-2770-c0c5-1db419eac800	mmmm	\N	2025-05-26 14:03:33.534759	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:03:33.534759	\N	\N
dddce88c-8fb7-5f48-ea34-c952061cc249	test	\N	2025-05-26 14:03:37.744455	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:03:37.744455	\N	\N
f870f352-e298-4626-4baf-4f670207011d	j	\N	2025-05-26 14:03:41.50253	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:03:41.50253	\N	\N
2560e62c-a155-e5f7-00a8-8d9d0ff8c88b	test	\N	2025-05-26 14:04:13.704455	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:04:13.704455	\N	\N
4aaf38bc-e694-7753-d667-85c1f6e0bcb8	test	\N	2025-05-26 14:04:27.275659	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:04:27.275659	\N	\N
c7bd4e6a-f019-4abf-828a-6dbb261bff38	caca	\N	2025-05-26 14:04:34.741266	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:04:34.741266	\N	\N
f486986a-76b4-58fb-ae36-ccc49c8d3dff	ljhlh	\N	2025-05-26 14:07:44.552549	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:07:44.552549	\N	\N
6470ef43-ea5a-dfc8-b67a-936781d37d63	kkklklkl	\N	2025-05-26 14:07:54.472855	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:07:54.472855	\N	\N
a410386d-0f60-28e9-c43e-bb6070c48858	kk	\N	2025-05-26 14:07:58.677142	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:07:58.677142	\N	\N
a52324bb-181b-2e1f-d3aa-f8dd4a7328c7	m	\N	2025-05-26 14:08:01.985636	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:08:01.985636	\N	\N
f7321c59-1348-6a58-3fd5-6c90053f64fa	mm	\N	2025-05-26 14:08:06.272116	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:08:06.272116	\N	\N
208b9ab7-741a-1eb2-85ec-edf63eb0a9dd	j	\N	2025-05-26 14:08:10.275631	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:08:10.275631	\N	\N
774d6ef6-c284-7148-cbb3-20473052dfba	llll	\N	2025-05-26 14:14:16.710407	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:16.710407	\N	\N
d3761060-5f2f-f717-e4d1-38bee66296ef	m	\N	2025-05-26 14:14:20.409477	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:20.409477	\N	\N
12b0c3d7-a8a0-adad-16a6-85a622139041	mmm	\N	2025-05-26 14:14:23.470635	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:23.470635	\N	\N
4b00e628-9ed1-152e-0e4a-dae62e30c562	az	\N	2025-05-26 14:14:25.449622	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:25.449622	\N	\N
b9ba2dbd-5ac7-62a7-acbf-f513c16b6570	z	\N	2025-05-26 14:14:26.207262	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:26.207262	\N	\N
f6566809-a972-6bbc-1643-4ff1aadb2179	e	\N	2025-05-26 14:14:26.622086	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:26.622086	\N	\N
73e08cbb-7e7e-d415-5501-23e64470289b	r	\N	2025-05-26 14:14:27.029862	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:27.029862	\N	\N
f1eb0855-54b5-24df-9de8-427126b640c2	t	\N	2025-05-26 14:14:27.657876	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:27.657876	\N	\N
47671f10-52c2-8dc5-4eb7-4c96cd3342c1	y	\N	2025-05-26 14:14:28.081318	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:28.081318	\N	\N
c54a0727-91f0-8cfc-4916-091007e3c044	u	\N	2025-05-26 14:14:28.50354	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:28.50354	\N	\N
9e11998a-57a6-e791-2e40-3040b472aa3f	i	\N	2025-05-26 14:14:28.795726	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:28.795726	\N	\N
f8255980-c496-e592-d4c7-ba2eb1807516	o	\N	2025-05-26 14:14:29.205485	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:29.205485	\N	\N
815537ee-4342-5ebb-8636-6574fa9fbcad	p	\N	2025-05-26 14:14:29.53314	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:29.53314	\N	\N
5186cc2b-3881-06a6-5db2-2fba03f55b20	m	\N	2025-05-26 14:14:29.975408	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:29.975408	\N	\N
6c66d9a6-fb17-7f6e-acaa-1ef056784488	l	\N	2025-05-26 14:14:30.271284	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:30.271284	\N	\N
4def7778-e99a-f47a-7fa8-d0e729c887bb	k	\N	2025-05-26 14:14:30.606252	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:30.606252	\N	\N
81f2f0aa-f7b4-0b96-0975-491f1f2fd410	j	\N	2025-05-26 14:14:30.871479	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:30.871479	\N	\N
2deb005d-4c46-6e71-8863-ba14ff74031a	h	\N	2025-05-26 14:14:31.25859	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:31.25859	\N	\N
36e3245b-f7d5-157a-1a2d-f56c47e0c618	g	\N	2025-05-26 14:14:31.592605	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:31.592605	\N	\N
7f3f5773-48aa-3687-c659-7ee6f56ed8b9	f	\N	2025-05-26 14:14:31.858695	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:31.858695	\N	\N
faedfaff-cfbe-5d16-7a02-1d8290278544	d	\N	2025-05-26 14:14:32.209518	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:32.209518	\N	\N
e42c3d2b-e70b-52ce-8163-4e7ac1080454	s	\N	2025-05-26 14:14:32.547885	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:32.547885	\N	\N
91e67cef-d4a0-9e62-2f77-56ad831a58c0	qw	\N	2025-05-26 14:14:33.142221	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:33.142221	\N	\N
c9b11f53-b6f7-f031-e25b-a0d2c19379fc	x	\N	2025-05-26 14:14:33.468796	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:33.468796	\N	\N
fccb2306-e463-d334-ca38-4c342c21e5ec	c	\N	2025-05-26 14:14:33.971309	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:33.971309	\N	\N
f2241170-8026-bc3f-74be-e61979e77701	v	\N	2025-05-26 14:14:34.204356	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:34.204356	\N	\N
90456038-2002-699c-a899-2d4055fea870	b	\N	2025-05-26 14:14:34.591962	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:34.591962	\N	\N
cfad0dd8-6b3a-471b-f6f3-ab519e3e4c77	n	\N	2025-05-26 14:14:34.818004	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:34.818004	\N	\N
eebf7c63-b5aa-546d-c750-1ce70f83c4d8	l	\N	2025-05-26 14:14:35.164194	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:35.164194	\N	\N
1ae804a4-11dd-9340-cafd-96b1fb591e02	jh	\N	2025-05-26 14:14:35.901344	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:35.901344	\N	\N
3639bc5e-4b33-db40-e58e-245b91f589da	g	\N	2025-05-26 14:14:36.238198	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:36.238198	\N	\N
beb3a033-0acd-c83d-f0cd-240d84484758	f	\N	2025-05-26 14:14:36.480827	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:36.480827	\N	\N
83b07b52-1bde-08b9-8510-33bac1f3b5ff	fd	\N	2025-05-26 14:14:36.850604	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:36.850604	\N	\N
e432062f-3dce-b8bc-b48d-325cf8466668	e	\N	2025-05-26 14:14:37.085483	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:37.085483	\N	\N
a6eb587f-a530-67cd-d87e-6058dfe7f874	e	\N	2025-05-26 14:14:37.319113	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:37.319113	\N	\N
fbb8093c-093c-5d18-2c61-a4d6ef14c081	rege	\N	2025-05-26 14:14:37.875306	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:37.875306	\N	\N
13154655-72ce-1f13-d3a5-55f70b22272e	ert	\N	2025-05-26 14:14:38.269464	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:38.269464	\N	\N
18811b31-2865-2e20-eb4e-4391d06619e6	ert	\N	2025-05-26 14:14:38.732996	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:38.732996	\N	\N
f9aa21b8-bed3-8da1-7d0a-3abca258f2ba	ert	\N	2025-05-26 14:14:39.209519	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:39.209519	\N	\N
93d88dc4-ac2f-a742-c9f1-906d3aac6541	ert	\N	2025-05-26 14:14:39.645263	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:39.645263	\N	\N
b1a014b3-042c-df95-e40b-a288154278d0	ert	\N	2025-05-26 14:14:40.082201	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:40.082201	\N	\N
b4650e37-d5bd-27e4-c1b7-47d6a2f33c41	er	\N	2025-05-26 14:14:40.354104	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:40.354104	\N	\N
d6b249bc-c6c2-e2b8-5ca5-af2091dd4806	erte	\N	2025-05-26 14:14:45.130831	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:14:45.130831	\N	\N
10c9d8dd-d6dc-b5e7-9e1e-af9729d35e1c	test	\N	2025-05-26 14:19:33.628741	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:19:33.628741	\N	\N
a70d0370-f1e8-e895-45a8-a4debe4bdbae	oui	\N	2025-05-26 14:20:48.592893	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:20:48.592893	\N	\N
b2bc1d73-a745-02fe-3ae9-182f744eb533	quoi	\N	2025-05-26 14:21:03.030538	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:21:03.030538	\N	\N
48939e72-49d1-fddd-2366-e864e8587392	caca	\N	2025-05-26 14:21:14.241938	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:21:14.241938	\N	\N
43ff3c9b-f014-84c2-c1c1-09618415e657	io	\N	2025-05-26 14:21:21.326671	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:21:21.326671	\N	\N
d8a622f5-65c8-63b2-2b34-f2ed9603be2f	gdgtd	\N	2025-05-26 14:21:34.249868	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:21:34.249868	\N	\N
f5092baf-f51c-6128-05d2-fadd03afd085	khj	\N	2025-05-26 14:21:41.420313	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:21:41.420313	\N	\N
8660a16d-88db-4587-12cb-cbe6544fcc3c	jfyj	\N	2025-05-26 14:21:53.804417	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:21:53.804417	\N	\N
66f2f25c-359a-7fbd-ec71-78f27f29a989	grtgtr	\N	2025-05-26 14:22:00.16515	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:22:00.16515	\N	\N
e7361f3b-feda-0f83-d5e7-2d06828bd2a2	grd	\N	2025-05-26 14:25:42.549681	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:25:42.549681	\N	\N
2195ec96-5653-f948-541e-490e28383079	tfuftuftiyè	\N	2025-05-26 14:25:52.942487	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:25:52.942487	\N	\N
f410d8c0-b373-59b8-44ba-fc1fe8a39e4a	tyiyè	\N	2025-05-26 14:25:56.634822	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:25:56.634822	\N	\N
4ee2826f-6493-9842-4fac-c893a5c9aafc	kyutktyu	\N	2025-05-26 14:26:25.540844	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:26:25.540844	\N	\N
6ab13d90-f96e-4e4a-7981-aea084a1e646	$^	\N	2025-05-26 14:26:39.696371	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:26:39.696371	\N	\N
5e1f91d5-60de-f56e-8e1d-71360869a29c	$pip^poiùpo	\N	2025-05-26 14:26:47.928504	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:26:47.928504	\N	\N
19589350-62d0-8333-41b2-ba1be3f0cea5	test	\N	2025-05-26 14:27:40.60249	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-26 14:27:40.60249	\N	\N
eac89ef5-e0fa-cb34-7300-c0d79f89221c	test	\N	2025-05-26 14:28:13.106453	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:28:13.106453	\N	\N
739cfb68-a65a-8c90-1fc6-a4754926ac68	test	\N	2025-05-26 14:28:31.716229	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:28:31.716229	\N	\N
8c04cb12-3c3e-802d-6e21-07efc0b6ed0e	kkkk	\N	2025-05-26 14:28:36.063105	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:28:36.063105	\N	\N
44dca2d0-7b3c-22a8-b6ca-ef327dac8c4c	ggg	\N	2025-05-26 14:28:42.121833	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:28:42.121833	\N	\N
d830745f-98d7-cdf7-4a7d-790b67464560	fff	\N	2025-05-26 14:28:48.820822	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:28:48.820822	\N	\N
e1a4aa96-78f3-ddeb-ffec-158ff6f49b61	ggg	\N	2025-05-26 14:28:56.098348	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:28:56.098348	\N	\N
3556cefc-f5f2-1500-80b6-a4c6b9eebefe	jj	\N	2025-05-26 14:31:39.399726	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:31:39.399726	\N	\N
62f180d5-e6c6-4ecd-bb76-151f96ca892c	@[Math Homo](fd6ff12d-384e-055e-6e7c-f9a06b7e9af0) jjj	\N	2025-05-26 14:31:58.897691	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:31:58.897691	\N	\N
6422b407-c973-4b04-d3ba-1882b6033b61	caca	\N	2025-05-26 14:32:40.863196	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:32:40.863196	\N	\N
d4cc2e9e-02b9-84d5-6ffc-65cee3409be9	test	\N	2025-05-26 14:33:28.230198	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:33:28.230198	\N	\N
347bcf24-f70e-fa3d-b25d-6b6009849c8b	prout	\N	2025-05-26 14:33:36.932587	9e115ae6-6b12-5f07-99a8-3497de2fef25	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:33:36.932587	\N	\N
4f98c526-6e88-dee6-55f8-e964573cfb77	pipi	\N	2025-05-26 14:33:44.176124	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:33:44.176124	\N	\N
8c4408f4-cc1f-1601-540a-0ecaf414a9b5	test	\N	2025-05-26 14:34:02.208081	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:34:02.208081	\N	\N
a610d417-3fe8-badc-539c-5b6b84c74d8f	prout	\N	2025-05-26 14:34:09.873689	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:34:09.873689	\N	\N
285df394-eb6b-f85e-9147-ba3184a0c3f4	caca	\N	2025-05-26 14:34:23.036422	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:34:23.036422	\N	\N
02aec9a9-3d55-56e6-34f0-ee91eaefa726	caac	\N	2025-05-26 14:34:41.347942	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:34:41.347942	\N	\N
d1e5eba6-bd08-0023-3772-ee6cc2164cd7	caca	\N	2025-05-26 14:35:14.953889	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:35:14.953889	\N	\N
92972bc3-ab2e-b45f-1c14-7f1eedb40524	prout	\N	2025-05-26 14:35:17.612999	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:35:17.612999	\N	\N
25f4f845-47c5-7da5-a3cb-1e2efd44307d	test	\N	2025-05-26 14:37:55.447064	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:37:55.447064	\N	\N
13fafab0-1233-5cfa-f0e8-e24e4a0a609e	caca	\N	2025-05-26 14:40:49.884919	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:40:49.884919	\N	\N
48c73244-bdd6-a538-2aea-7ba59ef40f65	cqcq	\N	2025-05-26 14:40:52.971446	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:40:52.971446	\N	\N
bf10fed2-4da0-17cb-4225-29d83f34816a	prout	\N	2025-05-26 14:41:08.597379	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:41:08.597379	\N	\N
f880ca93-2e79-4550-1a50-88a0049334e7	test	\N	2025-05-26 14:42:24.188424	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:42:24.188424	\N	\N
7eb19c65-b292-6862-2dcb-f795097a1058	test	\N	2025-05-26 14:43:22.327104	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:43:22.327104	\N	\N
56208117-2d66-f510-d413-760b3f957c1f	test	\N	2025-05-26 14:43:36.195363	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:43:36.195363	\N	\N
82d2b5b2-6b5f-284d-a671-859da5e5208d	llll	\N	2025-05-26 14:45:37.856705	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:45:37.856705	\N	\N
3069f170-f4ea-f1ed-c6d1-73219d288ac4	mmm	\N	2025-05-26 14:45:43.334829	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:45:43.334829	\N	\N
e3d31daa-74ab-b4e6-277e-7ded1169ace5	jjj	\N	2025-05-26 14:45:46.236126	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:45:46.236126	\N	\N
e674378e-48fb-b64d-28ba-397e9683457c	l	\N	2025-05-26 14:45:50.356748	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-26 14:45:50.356748	\N	\N
be74548d-8da5-74e2-257f-fd28783e77c8	test	\N	2025-05-26 14:46:14.1837	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:46:14.1837	\N	\N
13ac38e3-c44d-1b23-b76c-0adfb8eae198	caca	\N	2025-05-26 14:47:07.987836	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:47:07.987836	\N	\N
76c1dbcb-0f26-3786-21d3-e017d653b5f1	prout	\N	2025-05-26 14:47:12.537603	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:47:12.537603	\N	\N
6541f0a3-5885-d0e9-d6b3-0da398c6ddec	f	\N	2025-05-26 14:47:16.605852	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:47:16.605852	\N	\N
04e2f787-14dc-8498-06de-1ad5f8dc977a	f	\N	2025-05-26 14:47:17.097809	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:47:17.097809	\N	\N
0b9b4c48-e06b-27a9-7d11-e953d3653eab	f	\N	2025-05-26 14:47:17.653626	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:47:17.653626	\N	\N
29fa991f-9264-0f08-e198-600caa43bd71	g	\N	2025-05-26 14:47:18.230005	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:47:18.230005	\N	\N
0e599d72-d564-7449-aeeb-539e6cc019a6	test	\N	2025-05-26 14:47:30.454534	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:47:30.454534	\N	\N
f07322fe-9b89-345d-a451-f62422361497	test	\N	2025-05-26 14:49:55.998798	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:49:55.998798	\N	\N
197fbb98-eed0-d7bb-7969-75abb5cbd0f9	caca	\N	2025-05-26 14:50:05.461991	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:50:05.461991	\N	\N
d3d68459-41c8-7102-94e9-edac91a293d7	test	\N	2025-05-26 14:58:02.033144	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:58:02.033144	\N	\N
2ce679fe-a573-2346-12cd-c2b861cc18b8	caca	\N	2025-05-26 14:58:04.903146	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:58:04.903146	\N	\N
d4c3324c-ed14-8ab6-41d5-42e5ef0a31c5	test	\N	2025-05-26 14:59:02.92598	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-26 14:59:02.92598	\N	\N
9f9e412a-4094-cf1f-3913-c040bca52e9a	MKJKJKKKKKKK	\N	2025-05-27 13:21:50.583571	84f03094-c2df-24d7-6257-8bf9e1993b58	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	2025-05-27 13:21:50.583571	2025-05-27 13:21:59.931664	\N
b1abd5ca-7f2b-12b2-09e4-8c93c6b6342f	jd	\N	2025-05-27 13:23:15.305961	84f03094-c2df-24d7-6257-8bf9e1993b58	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-05-27 13:23:15.305961	2025-05-27 13:23:22.810499	\N
2d0ec192-893f-7326-89eb-ef0850479d9d	test	\N	2025-05-28 12:29:55.041581	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 12:29:55.041581	\N	\N
dd08a7d0-4168-1053-06e5-38592b0e2f55	caca	\N	2025-05-28 12:29:59.229541	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 12:29:59.229541	\N	\N
8e757ea0-22ba-bb08-802e-294f20001a65	prout	\N	2025-05-28 12:30:03.25705	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 12:30:03.25705	\N	\N
14335e55-89ca-7e2f-020f-8c86276580b9	test	\N	2025-05-28 14:45:52.282884	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:45:52.282884	\N	\N
88d157eb-c188-4202-ec6a-35ac4f2b4ad6	test	\N	2025-05-28 14:45:54.465468	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:45:54.465468	\N	\N
e832b1e1-a0cc-eb15-f5e2-cf85a8782f0f	test	\N	2025-05-28 14:45:58.091946	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:45:58.091946	\N	\N
004fcc8a-55a7-93ab-8b0a-dc27d4aae367	test	\N	2025-05-28 14:46:02.363611	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:46:02.363611	\N	\N
d7d1b229-0258-61ae-91d2-2e4d21382541	test	\N	2025-05-28 14:46:07.450438	5d159045-e695-98e8-8462-5f5108f021ee	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:46:07.450438	\N	\N
6a16a4de-c980-6331-5a90-ff593d1170dd	test	\N	2025-05-28 14:46:10.092051	9e115ae6-6b12-5f07-99a8-3497de2fef25	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:46:10.092051	\N	\N
107d8c52-ba43-f8b7-6805-84a8bf87ed0c	test	\N	2025-05-28 14:46:18.045067	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:46:18.045067	\N	\N
59288110-6051-a0f3-8323-896d9c268ca4	test	\N	2025-05-28 14:51:28.639997	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:51:28.639997	\N	\N
5f9e6840-050a-1b69-b64a-c17f4fba5cef	test	\N	2025-05-28 14:51:31.614254	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:51:31.614254	\N	\N
fd07dea9-3214-79c7-0110-f3942460e569	test	\N	2025-05-28 14:51:34.488361	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 14:51:34.488361	\N	\N
b2c91ec9-84a1-1f92-9097-5c3890ba6f1b	test	\N	2025-05-28 15:10:00.537251	fa94bcbf-c844-5a0a-b699-37f59efa1916	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 15:10:00.537251	\N	\N
5e1649c8-56b1-a7d8-3b92-0f1d2c860a28	test	\N	2025-05-28 15:10:05.929362	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 15:10:05.929362	\N	\N
92f1d843-7551-0931-fc4c-2e965470da68	test	\N	2025-05-28 15:10:15.409166	07d1837c-59fe-d357-906a-acd22d3e162a	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 15:10:15.409166	\N	\N
34cc959c-130d-46d5-cbaf-89cd8a14e234	test	\N	2025-05-28 15:10:18.145271	84f03094-c2df-24d7-6257-8bf9e1993b58	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 15:10:18.145271	\N	\N
cb0ac56d-9000-642b-e9d3-750af308df00	test	\N	2025-05-28 15:10:22.497955	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 15:10:22.497955	\N	\N
a1442fd9-e608-38e2-02d8-04acf7c1abfa	tests	\N	2025-05-28 15:11:07.455372	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 15:11:07.455372	\N	\N
468dc3c2-a440-6aaf-2a88-1a73adf60d3c	tedt	\N	2025-05-28 15:11:15.301283	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-05-28 15:11:15.301283	\N	\N
8c361192-73dd-be5a-778b-580a62a0eae5	@mistral salut	\N	2025-05-28 15:16:04.596668	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-28 15:16:04.596668	\N	\N
23312382-9239-2d42-fb72-15e6bb256d94	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-05-28 15:16:05.496003	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	00000000-0000-0000-0000-000000000001	2025-05-28 15:16:05.496003	\N	\N
313eaa83-b81d-8450-0a9d-0a6cdef24a77	@mistral comment tu vas aujourd’hui ?	\N	2025-05-28 15:16:57.11103	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-28 15:16:57.11103	\N	\N
db065985-a7ed-79b6-4dd8-653fc75683b7	Je vais bien, merci ! Comment puis-je vous aider aujourd'hui ?	\N	2025-05-28 15:16:57.765102	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	00000000-0000-0000-0000-000000000001	2025-05-28 15:16:57.765102	\N	\N
d49408a3-83ea-c760-2158-d5eef8d0c666	@mistral détaille moi le fonctionnement d’une fusée	\N	2025-05-28 15:17:18.956823	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-28 15:17:18.956823	\N	\N
fa951b30-674c-7b4e-acc6-0cc0f5c16a21	Le fonctionnement d'une fusée repose sur plusieurs principes de la physique, notamment la troisième loi de Newton (action-réaction) et la conservation de la quantité de mouvement. Voici un aperçu détaillé de son fonctionnement :\n\n### 1. **Principe de Base : La Troisième Loi de Newton**\nLa troisième loi de Newton stipule que pour toute action, il existe une réaction égale et opposée. Lorsqu'une fusée expulse du gaz par ses moteurs, ce gaz exerce une force sur la fusée dans la direction opposée, propulsant ainsi la fusée vers l'avant.\n\n### 2. **Structure de la Fusée**\nUne fusée typique est composée de plusieurs parties principales :\n- **Réservoirs de carburant** : Contiennent le carburant et le comburant nécessaires pour la combustion.\n- **Moteurs** : Transforment l'énergie chimique du carburant en énergie cinétique pour propulser la fusée.\n- **Structure** : Assure la stabilité et la rigidité de la fusée.\n- **Système de guidage et de contrôle** : Permet de diriger la fusée et de maintenir sa trajectoire.\n- **Charge utile** : Peut être un satellite, une sonde spatiale, ou des astronautes dans une capsule.\n\n### 3. **Moteurs de Fusée**\nLes moteurs de fusée fonctionnent en brûlant un mélange de carburant et de comburant dans une chambre de combustion. Le gaz chaud résultant est ensuite expulsé à travers une tuyère, créant une poussée.\n\n#### a. **Chambre de Combustion**\nLe carburant et le comburant sont injectés dans la chambre de combustion où ils sont mélangés et enflammés. La combustion produit des gaz chauds à haute pression.\n\n#### b. **Tuyère**\nLa tuyère convertit la pression des gaz chauds en vitesse. Elle est conçue pour maximiser la vitesse d'expulsion des gaz, ce qui augmente la poussée. La tuyère est souvent de forme conique pour diriger les gaz de manière optimale.\n\n### 4. **Poussée**\nLa poussée est la force qui propulse la fusée. Elle est générée par l'expulsion des gaz de combustion par la tuyère. La force de poussée (F) peut être calculée par la formule :\n\\[ F = \\dot{m} \\cdot V_e + A_e \\cdot (P_e - P_a) \\]\noù :\n- \\(\\dot{m}\\) est le débit massique des gaz expulsés.\n- \\(V_e\\) est la vitesse d'expulsion des gaz.\n- \\(A_e\\) est l'aire de la sortie de la tuyère.\n- \\(P_e\\) est la pression des gaz à la sortie de la tuyère.\n- \\(P_a\\) est la pression atmosphérique.\n\n### 5. **Étapes de Lancement**\n1. **Allumage et Décollage	\N	2025-05-28 15:17:27.293947	167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	00000000-0000-0000-0000-000000000001	2025-05-28 15:17:27.293947	\N	\N
3d12d331-fdf0-51c7-2af4-3e98641ac92e	Test	\N	2025-05-28 15:35:29.858429	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-28 15:35:29.858429	\N	\N
3d7eb31a-6dc0-870d-52a6-321c57653fe7	Test	\N	2025-05-28 15:36:19.945967	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-28 15:36:19.945967	\N	\N
\.


--
-- TOC entry 4423 (class 0 OID 82345)
-- Dependencies: 230
-- Data for Name: message_fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_fichier (fk_message, fk_fichier) FROM stdin;
\.


--
-- TOC entry 4424 (class 0 OID 82360)
-- Dependencies: 231
-- Data for Name: message_hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_hashtag (fk_message, fk_hashtag) FROM stdin;
\.


--
-- TOC entry 4425 (class 0 OID 82375)
-- Dependencies: 232
-- Data for Name: message_mention; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_mention (fk_message, fk_utilisateur) FROM stdin;
\.


--
-- TOC entry 4432 (class 0 OID 229490)
-- Dependencies: 239
-- Data for Name: message_prive; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_prive (id_message_prive, contenu, date_envoi, date_lecture, fk_expediteur, fk_destinataire, pieces_jointes, date_creation, date_modification, is_deleted, parent_id) FROM stdin;
88563c46-7439-0579-7a8a-b644f5f2ac3f	[message supprimé]	2025-05-13 09:52:30.4524	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	25c01514-5c67-6921-1cfa-6261c29e5d88	[]	2025-05-13 09:52:30.4524	2025-05-13 11:48:13.651445	t	\N
56292f5c-df98-e436-c550-55a411fd4940	fqdsf	2025-05-13 13:30:07.403234	2025-05-13 13:39:43.003494	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:30:07.403234	\N	f	\N
5069c009-5c36-25bb-91ce-ad464d6ba33d	Salut	2025-05-13 11:04:23.993568	2025-05-13 11:56:42.610239	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 11:04:23.993568	\N	f	\N
79631e5f-1b3e-40ce-58f6-9f000bcea0be	[message supprimé]	2025-05-13 12:19:37.429169	2025-05-13 12:19:37.600264	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 12:19:37.429169	2025-05-13 12:19:43.282502	t	\N
b30a055c-174b-3ac3-07fa-dff5661dfff1	sf	2025-05-13 13:40:05.478956	2025-05-13 13:41:12.110349	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:05.478956	\N	f	\N
b02d4008-691d-ab4b-31a4-f18521ed30fc	qsfqsf	2025-05-13 12:57:26.009261	2025-05-13 12:57:53.260008	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 12:57:26.009261	\N	f	\N
e5afd316-3383-5e22-8895-84b73b0e7cc4	f	2025-05-13 13:40:14.866431	2025-05-13 13:41:12.134399	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:14.866431	\N	f	\N
53b236b3-3afb-4854-7b54-1ee615839266	[message supprimé]	2025-05-13 11:57:55.103499	2025-05-13 12:50:15.447679	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:57:55.103499	2025-05-19 07:34:59.606768	t	\N
aff833cc-a10c-b0d2-6e31-6ac794993d7c	Salut	2025-05-17 10:24:53.477371	2025-05-17 10:25:11.180343	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 10:24:53.477371	\N	f	\N
c70202d6-dd8f-37c2-d0c6-68c404137632	[message supprimé]	2025-05-17 09:43:09.981632	2025-05-17 11:24:02.489618	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"0eea74ab-f389-0dea-f281-570cbb2f9eaa\\"}]"	2025-05-17 09:43:09.981632	2025-05-17 09:43:13.7118	t	\N
b5481367-2c46-c88a-a146-7d7ac6ef553e	dgds	2025-05-26 11:10:23.481654	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 11:10:23.481654	\N	f	\N
89412d78-aae2-5f60-f03b-52a623ccaa94	szgzsefs	2025-05-05 12:32:07.066811	2025-05-05 13:15:56.472228	c8eb671d-f3b4-41f6-7364-0f292619dfdc	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-05 12:32:07.066811	\N	f	31e6be05-e6a0-a406-2e2d-108c6433ea62
f9a2f7e3-96fa-b666-89cb-b3f15fbebaae	qsfqfqs	2025-05-13 14:22:04.068406	2025-05-13 14:25:14.788555	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:04.068406	\N	f	\N
a0b91305-5fbb-2e91-55c3-86e2f76f9409	qsfqs	2025-05-13 14:19:14.2812	2025-05-13 14:39:10.493273	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:19:14.2812	\N	f	\N
77876650-6661-98b1-83f6-4e72c2a63fad	ts	2025-05-13 09:09:13.632673	2025-05-13 09:14:32.934981	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 09:09:13.632673	\N	f	\N
5dfb556b-ade4-3a4e-3532-9eaea424e819	qsdqs	2025-05-13 14:30:16.027642	2025-05-13 14:39:10.505397	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:30:16.027642	\N	f	\N
e20487ea-df6a-a3e2-b876-7aa0c059a5bc	e	2025-05-13 09:32:08.470898	2025-05-13 09:34:48.962187	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:32:08.470898	\N	f	\N
18822dcd-28c4-a004-7e47-51fe275bb81b	fdg	2025-05-26 11:10:31.204782	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 11:10:31.204782	\N	f	\N
b13c1680-37d9-4f52-5572-a006d98113cc	qsdf	2025-05-13 14:40:58.760838	2025-05-13 14:51:06.865867	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:40:58.760838	\N	f	\N
a9799d4e-3030-bbb1-a009-b372f37b2582	 vcb	2025-05-13 09:46:46.605281	2025-05-13 09:47:04.534138	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:46.605281	\N	f	\N
5f8241dd-b386-7737-90bb-cffc3dd33928	cs	2025-05-13 09:46:42.748881	2025-05-13 09:47:04.535117	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:42.748881	\N	f	\N
279b41cb-6248-e682-9681-76e66490495e	vb	2025-05-13 09:46:48.88133	2025-05-13 09:47:04.555187	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:48.88133	\N	f	\N
9906ff04-5266-178b-e907-eb6e203dda52	cv	2025-05-13 09:46:49.914802	2025-05-13 09:47:04.561305	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:49.914802	\N	f	\N
bd4e602f-dd52-1948-b771-4cdbdf2094cc	qsfqs	2025-05-17 15:11:17.220953	2025-05-17 15:16:13.090349	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:11:17.220953	\N	f	\N
83e810be-3c10-e2ab-4a3b-aa0580650528	gdf	2025-05-26 11:10:32.672826	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 11:10:32.672826	\N	f	\N
35b016da-0091-29d6-3391-8a95fc19ef08		2025-05-26 08:47:45.060007	2025-05-26 11:46:21.11141	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	"[{\\"id\\":\\"0d757be7-dd73-7774-e2f6-908331b3de80\\"}]"	2025-05-26 08:47:45.060007	\N	f	\N
89949a5f-b3c7-8076-990f-a26615113d9a	caca	2025-05-26 12:52:10.80031	2025-05-26 13:40:04.655299	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 12:52:10.80031	\N	f	\N
a3b7f0c3-0842-f7d8-250e-0c91fe066537	bien	2025-05-20 13:16:29.804852	2025-05-26 13:21:30.498726	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 13:16:29.804852	\N	f	\N
9a1cd878-7cf0-d19f-e479-346fafaf694a	h	2025-05-20 12:54:52.292413	2025-05-26 13:21:30.498995	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 12:54:52.292413	\N	f	\N
ddb6ef63-9465-dd9b-8b10-4894327cb8f5		2025-05-20 13:59:19.709874	2025-05-26 13:21:30.499243	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"e27f453f-1cb4-b58e-3bb4-0ef7e44f3c94\\"}]"	2025-05-20 13:59:19.709874	\N	f	\N
7ba83df2-367b-08d9-9928-1ed68e563440	Test\n	2025-05-13 08:07:02.995242	2025-05-13 09:00:00.545667	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 08:07:02.995242	\N	f	\N
f4532c97-28a6-6088-6dee-6adba7dcda11	Salut 	2025-05-13 08:18:13.498526	2025-05-13 09:00:00.547545	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 08:18:13.498526	\N	f	\N
97556963-45dd-f950-383a-d2942140e026	gfd	2025-05-13 11:24:33.019101	2025-05-13 11:33:06.285817	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:33.019101	\N	f	\N
a4376d6f-b675-b665-12b8-fb67d6eedf57	sdf	2025-05-13 11:24:30.839788	2025-05-13 11:33:06.284911	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:30.839788	\N	f	\N
cdb7c7d6-0431-9dcf-9969-27b2136a4100	efez	2025-05-13 11:27:28.58524	2025-05-13 11:33:06.446457	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:28.58524	\N	f	\N
1aa8c3f9-8845-1da3-cd89-cde7d561d68e	test	2025-05-13 11:44:23.554789	2025-05-17 13:18:33.052559	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-13 11:44:23.554789	\N	f	\N
866322be-9e1e-1091-44b6-46e2eee22b01	sqdsqdsq	2025-05-17 16:12:32.077729	2025-05-18 12:58:21.812872	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 16:12:32.077729	\N	f	\N
d7571025-1dba-c335-31d5-c0f8da00a882	mmmmm	2025-05-18 14:18:03.190792	2025-05-18 15:26:40.703752	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:18:03.190792	\N	f	\N
e7f536d4-4e31-a0f4-561a-38cda5e5376d	[message supprimé]	2025-05-12 11:36:56.271059	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	25c01514-5c67-6921-1cfa-6261c29e5d88	[]	2025-05-12 11:36:56.271059	2025-05-19 07:38:29.642606	t	\N
9b233f49-6c86-9718-184c-ccacb44e17e0	[message supprimé]	2025-04-29 12:40:25.070744	2025-04-29 12:58:46.689839	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-04-29 12:40:25.070744	2025-05-19 10:59:42.859294	t	\N
6a202f0a-954e-ae5b-c14a-891584ed60d8	m	2025-05-19 11:56:24.774145	2025-05-19 12:08:57.752714	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:56:24.774145	\N	f	\N
4f9b8617-9e51-80a3-c035-7c842839c878	lll	2025-05-19 11:56:23.47745	2025-05-19 12:08:57.777533	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:56:23.47745	\N	f	\N
5144348e-c820-cdb3-74cb-953b41f78ffa	loutre	2025-05-19 10:57:29.981467	2025-05-19 11:42:14.14326	bb6a4d43-70d3-5e36-d943-dfdfc747491f	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-19 10:57:29.981467	\N	f	\N
6da57f1c-3336-24b4-78e1-c6cd6d89bdd7	m	2025-05-19 13:32:04.563295	2025-05-19 13:35:34.899609	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 13:32:04.563295	\N	f	\N
4e0152fa-122e-a11e-e006-e854c2b43d9b		2025-05-19 14:49:48.535262	2025-05-20 09:05:47.350212	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"81613684-1260-6ce0-3d56-d43fa9f5dfc4\\"}]"	2025-05-19 14:49:48.535262	\N	f	\N
57a20c80-0214-cf80-96f7-dbff278cc3c8	m	2025-05-19 12:34:01.139051	2025-05-19 13:25:05.370494	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:34:01.139051	\N	f	\N
37a9bd85-03b7-8d35-a153-035acb0edacd	B	2025-05-19 11:48:58.111862	2025-05-19 12:08:57.598325	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:48:58.111862	\N	f	\N
e19553ce-d1bb-61ef-8f51-2c37c675b8db	mm	2025-05-19 13:39:15.072671	2025-05-20 12:13:35.559075	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-19 13:39:15.072671	\N	f	\N
293102c3-993a-e7db-f098-3362fc67c909		2025-05-20 11:30:12.84743	2025-05-20 12:33:27.612987	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"9a854c96-28ce-1b7e-82f8-cedf3b7463d1\\"}]"	2025-05-20 11:30:12.84743	\N	f	\N
798a3b94-47bb-e9ac-3b7e-dc944a6bfd02	yo	2025-05-20 12:13:50.15678	2025-05-20 12:33:27.62516	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 12:13:50.15678	\N	f	\N
de6cae4a-6470-6f86-c102-1b9487ca57d1	[message supprimé]	2025-04-29 11:29:41.539153	2025-04-29 13:00:17.373281	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-04-29 11:29:41.539153	2025-05-26 08:02:33.031179	t	\N
e412564d-edd2-22c6-a21b-668d16e447c7	qdfqs	2025-05-13 13:22:18.125265	2025-05-13 13:30:03.781437	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:22:18.125265	\N	f	\N
ecee9a07-7132-2431-d916-bde020db2d09	test	2025-05-13 09:10:47.312275	2025-05-13 11:56:42.609884	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:10:47.312275	\N	f	\N
4ff595d7-da64-0693-7111-ea9a04522134	ogfdgfd	2025-05-13 11:58:04.618527	2025-05-13 11:58:07.935321	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:58:04.618527	\N	f	\N
79ad5e47-be08-f311-e14c-a8efc59366ab	fs	2025-05-13 13:40:08.43056	2025-05-13 13:41:12.10944	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:08.43056	\N	f	\N
5f9a5faa-860b-2ccf-7df5-297aed1eeefd	ssf	2025-05-13 13:40:12.555829	2025-05-13 13:41:12.112152	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:12.555829	\N	f	\N
3a6bf250-4fac-82d5-78f8-46c17ef55a35	edfs	2025-05-17 10:24:57.970524	2025-05-17 10:25:11.184415	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 10:24:57.970524	\N	f	\N
f253ce1e-4281-9b03-be4a-5bdb1947e677	test	2025-05-13 07:56:38.209627	2025-05-13 09:34:48.675668	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:38.209627	\N	f	\N
915ac26d-7af7-c726-89f8-a25e71c2a7e1	Salut 	2025-05-13 07:56:29.995371	2025-05-13 09:34:48.674212	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:29.995371	\N	f	\N
035c217f-d20c-a295-9736-d49d458be394	Hey	2025-05-13 08:09:56.973696	2025-05-13 09:00:00.545405	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 08:09:56.973696	\N	f	\N
87333437-c229-c19b-87c1-5f02243c24ea	fgjvj	2025-05-13 07:56:45.804256	2025-05-13 09:34:48.673914	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:45.804256	\N	f	\N
f42fe795-2155-59ab-b41b-99418887e6d9	[message supprimé]	2025-04-29 13:51:37.524801	2025-04-29 13:57:55.46001	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 13:51:37.524801	2025-05-19 10:59:42.859294	t	\N
76e46b82-52a0-7a1a-e65a-8ed85fcec4c8	test	2025-05-13 09:39:50.758719	2025-05-13 09:40:43.034424	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:39:50.758719	\N	f	\N
ecfcf909-4d21-e74c-8f6d-a0b6cc639110	test	2025-05-13 09:47:09.872057	2025-05-13 09:47:09.977292	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:09.872057	\N	f	\N
0e8c0058-36bd-e286-2840-7d0619fe9371	sdf	2025-05-13 13:41:51.500779	2025-05-13 13:59:55.116252	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:51.500779	\N	f	\N
60bc59c9-ba48-8f8a-ff6f-0dde639760ca	sfs	2025-05-13 14:10:05.894135	2025-05-13 14:15:07.331061	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:10:05.894135	\N	f	\N
7c9c522c-727f-22d2-0bf5-bab579e90f57	[message supprimé]	2025-05-13 11:37:45.880735	2025-05-13 11:38:25.52913	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:37:45.880735	2025-05-19 07:34:59.606768	t	\N
d887f628-bb9a-f4a9-170a-f56c6f2afaf2	dgsd	2025-05-13 13:39:00.822833	2025-05-13 13:51:15.764231	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:00.822833	\N	f	\N
8be165f3-604f-d4da-f994-9bf5153b45e9	sdgsdgsd	2025-05-13 13:38:57.060408	2025-05-13 13:51:15.748356	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:38:57.060408	\N	f	\N
844bae5c-518e-f4f7-e742-c4d8503d3e29	dsgsdg	2025-05-13 13:38:59.087605	2025-05-13 13:51:15.748479	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:38:59.087605	\N	f	\N
26520fee-0d31-8ebf-a2fe-e4eb045041d5	sdgsg	2025-05-13 13:38:59.917091	2025-05-13 13:51:15.750236	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:38:59.917091	\N	f	\N
9467a64e-0d02-13f0-590c-2171a8d632e6	Holà	2025-05-13 09:52:42.21011	2025-05-13 11:04:13.185405	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:52:42.21011	\N	f	\N
ffa95c78-ab70-268d-3089-bc7f517113f1	qsfdqsf	2025-05-13 11:41:10.896592	2025-05-13 11:42:53.431686	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:41:10.896592	\N	f	\N
d0d43718-7672-5390-fb49-06a45fef430b	[message supprimé]	2025-05-04 13:48:43.502562	2025-05-04 13:55:55.328476	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 13:48:43.502562	2025-05-19 10:59:42.859294	t	\N
e09071d1-05dc-31ae-1801-5797c41d3ea8	[message supprimé]	2025-04-30 12:51:44.117834	2025-04-30 12:57:25.149309	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 12:51:44.117834	2025-05-19 10:59:42.859294	t	\N
fd2a325d-a652-2b8e-bb23-f54c1e05370c	[message supprimé]	2025-05-04 15:08:30.003709	2025-05-04 15:09:46.069169	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:08:30.003709	2025-05-26 08:02:33.031179	t	\N
cbb18ff9-a0b0-1369-b275-02e84b35f5da	Test	2025-05-17 09:44:40.621128	2025-05-17 11:24:02.427618	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:40.621128	\N	f	\N
c566a813-ee11-6162-4a51-eff7a53bdfdf	zefzef	2025-05-13 11:24:05.600845	2025-05-13 11:33:06.284122	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:05.600845	\N	f	\N
734c3b3b-885c-b5d7-97c9-fe0213f1dd54	zef	2025-05-13 11:27:30.317158	2025-05-13 11:33:06.445836	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:30.317158	\N	f	\N
1720c21c-67b4-14b4-b606-3b69644f0533	sdgs	2025-05-13 13:39:00.643742	2025-05-13 13:51:15.750588	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:00.643742	\N	f	\N
72bf082f-2844-0118-ed36-eb435a2ad10b	V	2025-05-17 09:44:49.98725	2025-05-17 11:24:02.43302	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:49.98725	\N	f	\N
2f1ead2c-2311-c37b-e00b-d50fc754c42d	jejeje	2025-05-26 08:55:42.016511	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 08:55:42.016511	\N	f	\N
2c3d541f-d0fb-0ecd-8fcd-13cbe3b2532f	gfd	2025-05-26 11:10:35.30877	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 11:10:35.30877	\N	f	\N
3fda5fd2-2b12-4288-84a8-fb0d4cab9fc1	bite	2025-05-08 10:27:16.211963	2025-05-08 10:31:37.260285	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-08 10:27:16.211963	\N	f	\N
8ddbce78-c317-1bac-86c5-485255dfa85e	gsd	2025-05-13 13:39:01.17579	2025-05-13 13:51:15.766462	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:01.17579	\N	f	\N
02f2eb04-9c9e-2588-715e-ceb9d3bb790f	vdf	2025-05-26 11:10:36.422536	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 11:10:36.422536	\N	f	\N
9653c43d-a0f6-96d0-f191-9eff6841f389	cacz	2025-05-26 12:53:20.282892	2025-05-26 13:40:04.690046	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 12:53:20.282892	\N	f	\N
1a0b3ae2-401a-ab70-d92c-48eb4cbcb445	gs	2025-05-13 13:39:01.002376	2025-05-13 13:51:15.766858	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:01.002376	\N	f	\N
70bbccda-a0b2-e0e1-776f-743ba7621ba7	fs	2025-05-13 13:41:54.864493	2025-05-13 13:59:55.133424	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:54.864493	\N	f	\N
36f4e23a-efbb-758e-2732-6aa139210ef8	[message supprimé]	2025-05-13 09:56:57.622764	2025-05-13 11:32:12.020195	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 09:56:57.622764	2025-05-26 08:02:33.031179	t	\N
14428232-471d-df14-d2af-177d3235a10c	sd	2025-05-13 13:41:52.76013	2025-05-13 13:59:55.119033	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:52.76013	\N	f	\N
7576f236-3b81-e5b0-cc72-2875d9d6b2be	zefzef	2025-05-13 12:56:27.241921	2025-05-13 14:15:13.481729	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 12:56:27.241921	\N	f	\N
63abde6c-9e05-6e49-356f-d47101640a3e	[message supprimé]	2025-05-13 11:23:53.01735	2025-05-13 11:32:06.079608	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:23:53.01735	2025-05-26 08:02:33.031179	t	\N
62b265d5-ade4-d21a-2fef-495d5dde8913	sf	2025-05-13 14:49:38.367099	2025-05-13 14:51:06.870787	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:49:38.367099	\N	f	\N
e215e1ab-0002-2978-2321-d63c20651f83	qds	2025-05-13 14:30:40.062715	2025-05-13 14:39:59.683129	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:30:40.062715	\N	f	\N
9675df1c-fd3d-b3c3-3640-ebda3cf716e6	qsf	2025-05-13 14:22:08.348961	2025-05-13 14:25:14.787459	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:08.348961	\N	f	\N
79a432c4-9023-8943-8f59-95dcffcb786d	ds	2025-05-13 14:30:48.160056	2025-05-13 14:39:59.685987	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:30:48.160056	\N	f	\N
821ef307-b71c-5f71-e6f6-68489748dc3c	[message supprimé]	2025-05-13 11:32:39.287718	2025-05-13 11:33:19.483886	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:32:39.287718	2025-05-26 08:02:33.031179	t	\N
92239247-6469-ba6b-31b1-e9cdac011031	s,gsfd	2025-05-13 11:45:17.152454	2025-05-17 13:18:33.054417	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-13 11:45:17.152454	\N	f	\N
8e027c31-13b4-f8fd-70c2-e07d0d696807	tes	2025-05-17 14:19:35.427395	2025-05-17 14:55:11.069258	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 14:19:35.427395	\N	f	\N
b43b7e18-d04f-f8cd-9d15-e07191af414a	qedfqsf	2025-05-13 11:58:11.953489	2025-05-13 12:09:29.373886	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:58:11.953489	\N	f	\N
d92e19d1-095d-ad7d-2184-2e930d662f81	Test	2025-05-17 09:44:46.093329	2025-05-17 11:24:02.432615	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:46.093329	\N	f	\N
9356e827-6fd8-7034-48b1-806a780f29e7	Bb	2025-05-17 09:44:50.889108	2025-05-17 11:24:02.435851	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:50.889108	\N	f	\N
9317337e-bfb9-5fe4-ffd4-83b36de3e699	aerfpihzefoin	2025-05-13 11:50:20.785726	2025-05-13 11:58:08.126603	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:50:20.785726	\N	f	ecee9a07-7132-2431-d916-bde020db2d09
7306ef1b-0d6b-247c-63db-1935e1fd3f37	sdf	2025-05-17 10:24:59.255141	2025-05-17 10:25:11.18337	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 10:24:59.255141	\N	f	\N
ecd5cf90-d687-e9b5-85e3-dc72a6e2c2b9	gj	2025-05-13 07:56:47.389447	2025-05-13 09:34:48.674491	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:47.389447	\N	f	\N
28dcaa37-70d8-f6b9-3226-9bad33328e9e	vgj	2025-05-13 07:56:48.195756	2025-05-13 09:34:48.677577	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:48.195756	\N	f	\N
563fcab5-37d2-fc51-2d71-2e5fdca381f2	vgjv	2025-05-13 07:56:46.554621	2025-05-13 09:34:48.678413	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:46.554621	\N	f	\N
150f261d-d81c-9851-a50b-8d27d47aaa52	dsqdqsdqs	2025-05-13 13:22:24.007445	2025-05-13 13:30:03.786925	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:22:24.007445	\N	f	\N
35f4e82d-14a9-48b8-8ae0-e5a75f88f6e5	vjv	2025-05-13 07:56:47.702216	2025-05-13 09:34:48.673063	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:47.702216	\N	f	\N
49eaf5ff-d932-5f81-2bef-131bf9fe7c78	jv	2025-05-13 07:56:47.219604	2025-05-13 09:34:48.673559	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:47.219604	\N	f	\N
a2fb7595-a5e8-9637-6b8b-1a3b76ffe163	qsfqsf	2025-05-13 09:14:17.250439	2025-05-13 09:34:48.853354	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:17.250439	\N	f	\N
4a443e80-047e-170c-1652-9d430b5e00e8	qs	2025-05-13 09:14:23.319888	2025-05-13 09:34:48.853732	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.319888	\N	f	\N
0faab116-9891-b0b0-fb12-a83ac035b7f7	f	2025-05-13 09:14:23.424283	2025-05-13 09:34:48.85528	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.424283	\N	f	\N
d4bf15e5-a4ec-1d20-9c8e-5bc431a4ed5b	OJPOJPOJ	2025-05-26 09:03:46.968273	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:03:46.968273	\N	f	\N
70ba3e25-0b8d-7a88-c7a8-380d47d1a342	caca	2025-05-26 11:11:00.699801	2025-05-26 11:11:06.146212	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 11:11:00.699801	\N	f	\N
65dc8beb-3de6-4040-7294-66c30c56ecd7	hello	2025-05-20 14:39:59.167783	2025-05-26 13:21:30.51797	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 14:39:59.167783	\N	f	9837ce7a-8b1e-66eb-cfdc-fdcc1f5e97b6
79a9010d-5ee5-9650-03b6-3c9a2c631ad0	dsq	2025-05-13 09:47:19.88624	2025-05-13 09:47:19.914153	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:19.88624	\N	f	\N
16ec7512-537f-bc92-50fb-09a7419ff6ee	qsd	2025-05-13 09:47:20.768478	2025-05-13 09:47:20.833155	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:20.768478	\N	f	\N
5f1c107c-7e64-52b0-fbd7-a7f3de8558ec	erz	2025-05-13 09:47:42.534046	2025-05-13 09:47:53.936749	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:42.534046	\N	f	\N
b93cb808-2d76-9b10-00c9-1508b9d66c43	ze	2025-05-13 09:47:43.86932	2025-05-13 09:47:53.943724	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:43.86932	\N	f	\N
3ffc77c0-ac7b-982c-088a-4d2a8791f9b2	fsf	2025-05-13 13:40:08.925789	2025-05-13 13:41:12.108419	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:08.925789	\N	f	\N
3c6e5153-2788-77b5-b435-b4109c93a6a2	f	2025-05-13 13:40:09.693107	2025-05-13 13:41:12.113094	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:09.693107	\N	f	\N
8fd7bb4e-84ee-296c-e07b-8991b12ee2cf	merci	2025-05-08 10:29:36.578464	2025-05-08 10:32:24.254588	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-08 10:29:36.578464	\N	f	\N
f7a19e82-afac-fec5-5d48-e1696370c021	Haha	2025-05-13 09:53:26.602736	2025-05-13 11:04:13.184795	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:53:26.602736	\N	f	\N
fc8fb666-2fbd-af27-c93d-4d1be8420aec	Test	2025-05-13 09:57:49.05053	2025-05-13 11:04:13.189512	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:57:49.05053	\N	f	\N
415d8bc4-56fa-ac98-630b-6d3137c15dda	lll	2025-05-17 12:46:20.8847	2025-05-17 13:58:07.167659	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 12:46:20.8847	\N	f	\N
c4d2123f-b12e-6cc2-7fb0-77202dfe283d	test	2025-05-13 11:27:44.27392	2025-05-13 11:33:06.444424	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:44.27392	\N	f	\N
0264e59b-16cc-fcb3-8e17-07f2a75e4ddc	test	2025-05-13 11:27:39.233412	2025-05-13 11:33:06.444836	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:39.233412	\N	f	\N
d176e838-ab26-6167-da62-aeec8acbf4dd	dqsfqfs	2025-05-13 11:32:55.60047	2025-05-13 11:33:06.624674	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:32:55.60047	\N	f	\N
b1feab0b-6330-c4d1-b07f-744740c64aaa	gdf	2025-05-13 11:33:01.10447	2025-05-13 11:33:06.626759	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:33:01.10447	\N	f	\N
6c6ff047-9005-c7dc-7701-fa9f0769482a	y	2025-05-17 15:11:49.172436	2025-05-17 15:16:13.114709	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:11:49.172436	\N	f	\N
db8bc20c-7624-308f-f6a2-f81ac6c46fb3	g	2025-05-13 13:39:06.773971	2025-05-13 13:51:15.782714	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:06.773971	\N	f	\N
1dfd6c6a-eb29-6ab6-f3b4-93caea34e807	sf	2025-05-13 13:41:53.883084	2025-05-13 13:59:55.131166	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:53.883084	\N	f	\N
515c59b2-6c2f-ca1b-32b9-1382849689b1	sdg	2025-05-13 13:39:00.348479	2025-05-13 13:51:15.750902	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:00.348479	\N	f	\N
21b180a5-1aca-db46-0cf0-4e3554da25d7	d	2025-05-13 13:39:10.859011	2025-05-13 13:51:15.783813	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:10.859011	\N	f	\N
219eee96-8839-d44f-23d8-0597355030dd	dg	2025-05-13 13:39:10.718469	2025-05-13 13:51:15.784632	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:10.718469	\N	f	\N
7f87509c-f991-e4fa-faea-11f41d22ef65	ss	2025-05-13 14:02:40.944545	2025-05-13 14:03:37.152926	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:02:40.944545	\N	f	\N
0d2f9fd8-c66b-7831-74d2-cc95cd75fd9a	sdg	2025-05-13 13:39:09.519033	2025-05-13 13:51:15.783468	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:09.519033	\N	f	\N
6028cdee-d989-7795-1107-0560b833d310	dd	2025-05-13 13:39:19.505077	2025-05-13 13:51:15.785861	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:19.505077	\N	f	\N
9837ce7a-8b1e-66eb-cfdc-fdcc1f5e97b6	s	2025-05-13 14:30:48.102776	2025-05-13 14:39:59.683791	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:30:48.102776	\N	f	\N
b6127b54-2679-107a-132d-c2969bcc7480	qsd	2025-05-13 14:49:51.143727	2025-05-13 14:51:06.869279	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:49:51.143727	\N	f	\N
7acaffc6-813b-12f4-6e93-23c1475ddf1d	llll	2025-05-18 14:29:11.65435	2025-05-18 15:26:40.706445	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:29:11.65435	\N	f	\N
4fc21a83-9ef4-168e-bc20-ad9cd19b4a42	[message supprimé]	2025-04-29 12:49:18.818334	2025-04-29 12:58:37.63058	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:49:18.818334	2025-05-19 10:59:42.859294	t	\N
f642bbdf-5566-1100-8217-331e5f0a6980		2025-05-19 10:59:04.554869	2025-05-19 11:42:14.151099	bb6a4d43-70d3-5e36-d943-dfdfc747491f	a5c1b268-937f-af11-4ca2-2c96634fbe2e	"[{\\"id\\":\\"ba843738-a9f6-8fa0-8f51-582cd699f967\\"}]"	2025-05-19 10:59:04.554869	\N	f	\N
5a6cf26e-24b3-f1e2-c753-a6b8ed8a2b59	[message supprimé]	2025-05-17 11:13:50.447258	2025-05-17 11:15:41.005401	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:50.447258	2025-05-26 08:02:33.031179	t	\N
94d24c65-e6d6-549e-8d61-12c336a292be	[message supprimé]	2025-05-17 11:13:55.550049	2025-05-17 11:15:41.000258	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:55.550049	2025-05-26 08:02:33.031179	t	\N
83761754-0115-a4fb-ea14-4f41f37e090c	[message supprimé]	2025-05-17 11:13:56.985203	2025-05-17 11:15:41.004407	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:56.985203	2025-05-26 08:02:33.031179	t	\N
c81006c0-855b-5ae4-bbb2-c712deaa1325	[message supprimé]	2025-05-17 11:13:57.533952	2025-05-17 11:15:41.027544	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:57.533952	2025-05-26 08:02:33.031179	t	\N
b24110ec-890c-902d-c5d8-79fe6c65d943	[message supprimé]	2025-05-17 11:13:57.908936	2025-05-17 11:15:41.032004	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:57.908936	2025-05-26 08:02:33.031179	t	\N
172ea264-be06-258d-ac66-399c12227271	[message supprimé]	2025-05-17 11:13:58.149626	2025-05-17 11:15:41.028642	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:58.149626	2025-05-26 08:02:33.031179	t	\N
0ec44c11-483e-1755-c42d-3fec6d26e790	[message supprimé]	2025-05-17 13:38:08.069747	2025-05-17 13:52:23.331617	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:38:08.069747	2025-05-26 08:02:33.031179	t	\N
7552ff1b-88b3-9d4f-37f9-e0e64de6c983	huhiuh	2025-05-26 09:20:01.623482	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:20:01.623482	\N	f	\N
2caf5280-a8b2-30ba-1d8b-11faa8d25fa1	[message supprimé]	2025-05-13 09:42:16.359393	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	25c01514-5c67-6921-1cfa-6261c29e5d88	[]	2025-05-13 09:42:16.359393	2025-05-13 11:48:13.651445	t	\N
9e151019-d017-312d-b392-2b9b6c017952	dsfds	2025-05-26 09:37:19.658169	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:37:19.658169	\N	f	\N
cf2aa4cd-5ad7-4dca-df9d-7d0782c63b36	sdfsdf	2025-05-17 10:25:04.630657	2025-05-17 10:25:11.183763	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 10:25:04.630657	\N	f	\N
ec41c94c-9719-94bc-9eec-5ac13c8d250b	jjj	2025-05-26 09:54:37.773234	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:54:37.773234	\N	f	\N
7b5c61af-4a2a-ca2c-4ff4-d3b003567c94	B	2025-05-17 09:44:51.703685	2025-05-17 11:24:02.439827	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:51.703685	\N	f	\N
d06ab97c-bd38-1bba-8c0f-21753556fbd3	test	2025-05-17 13:45:59.837349	\N	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	25c01514-5c67-6921-1cfa-6261c29e5d88	[]	2025-05-17 13:45:59.837349	\N	f	\N
00005e78-b9fc-6634-8bb5-7c96a578f8d6	vg	2025-05-13 07:56:47.042471	2025-05-13 09:34:48.676371	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:47.042471	\N	f	\N
5bb3b3d3-2311-1317-cd50-9a975aa8e3cb	v	2025-05-13 07:56:48.323901	2025-05-13 09:34:48.679241	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:48.323901	\N	f	\N
57b1d26f-d169-031b-13c2-ccbf881ce00f	qsfqs	2025-05-13 09:14:23.055233	2025-05-13 09:34:48.853598	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.055233	\N	f	\N
f3e9a0ba-b208-3fbf-3bab-9d1cfbaf8030	sgs	2025-05-17 15:11:31.239604	2025-05-17 15:16:13.090861	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:11:31.239604	\N	f	\N
bd6766fc-76d6-d451-bd90-207ed221b88c	q	2025-05-13 09:14:23.600444	2025-05-13 09:34:48.857128	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.600444	\N	f	\N
91b7dae6-2f6e-9180-f511-cec673897d01	sq	2025-05-13 09:14:23.950982	2025-05-13 09:34:48.862769	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.950982	\N	f	\N
0f6e86c4-8bd8-2f81-2da8-a289db42f88b	caca	2025-05-26 13:27:54.224736	2025-05-26 13:40:04.688876	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 13:27:54.224736	\N	f	\N
752a2d6c-f5a3-0a3d-8e81-573bdc5669d9	test	2025-05-13 09:41:06.427615	2025-05-13 09:47:04.538041	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:41:06.427615	\N	f	\N
7d8d55df-4e36-faa3-c747-517ef04858b2	zef	2025-05-13 09:47:44.242145	2025-05-13 09:47:53.942594	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:44.242145	\N	f	\N
8b4654ad-a325-ade5-7dc6-a450514085f5	ezf	2025-05-13 09:47:43.168757	2025-05-13 09:47:53.945734	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:43.168757	\N	f	\N
49511ac5-8b30-96ec-7477-29dcd4cd0099	caca 	2025-05-13 09:53:35.923743	2025-05-13 09:53:36.035761	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:53:35.923743	\N	f	\N
3277f1df-bccd-2ca6-035b-6c67cdcd0d64	qsfqsf	2025-05-17 14:20:36.007216	2025-05-17 14:20:36.295466	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:20:36.007216	\N	f	\N
11636889-c293-9ca9-8371-21968d98daa2	zef	2025-05-13 11:24:15.337393	2025-05-13 11:33:06.287693	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:15.337393	\N	f	\N
f55894a9-da50-e9ee-91f7-00824647642e	test	2025-05-13 11:27:49.690915	2025-05-13 11:33:06.443607	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:49.690915	\N	f	\N
1300bc25-c968-74ec-72d3-b565ad8b0217	qsf	2025-05-13 11:32:56.705878	2025-05-13 11:33:06.624812	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:32:56.705878	\N	f	\N
7f4358d3-70ce-d717-dbe6-ce2a224e0e94	sf	2025-05-13 13:40:12.848572	2025-05-13 13:41:12.114053	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:12.848572	\N	f	\N
e5b231fe-7d34-1aa7-23e4-034548bc1c10	s	2025-05-13 13:40:14.68857	2025-05-13 13:41:12.132147	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:14.68857	\N	f	\N
14901abe-c656-3454-a393-434e4a19c015	[message supprimé]	2025-05-08 13:24:38.894581	2025-05-08 14:25:11.638227	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-08 13:24:38.894581	2025-05-19 10:59:42.859294	t	\N
c28363b0-af45-6de8-a759-9fd2d1956ddb	s	2025-05-13 13:42:10.598841	2025-05-13 13:59:55.117683	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:10.598841	\N	f	\N
14315b1a-85db-b359-e3f4-dd4ce38c862b	sdsd	2025-05-13 13:42:03.168294	2025-05-13 13:59:55.119738	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:03.168294	\N	f	\N
a8f65d30-27cb-421c-4266-17d2254e9f4e	Salut 	2025-05-13 12:02:56.409613	2025-05-13 12:19:07.938547	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 12:02:56.409613	\N	f	\N
ccf598e7-f064-3539-230f-8589abf1b4f9	sd	2025-05-13 13:42:06.266538	2025-05-13 13:59:55.132692	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:06.266538	\N	f	\N
11027cf9-2e52-f94e-89a0-a2dff6be8ee7	ddssd	2025-05-13 13:42:13.408436	2025-05-13 13:59:55.156865	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:13.408436	\N	f	\N
7ff68614-0bf2-2b00-4d57-3dd2b84acbcf	adazdaz	2025-05-13 13:22:43.052981	2025-05-13 13:24:00.816068	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:22:43.052981	\N	f	\N
d9b12bf3-f7cc-ac42-29b3-10b1d77aee0f	sd	2025-05-13 13:42:11.909673	2025-05-13 13:59:55.154076	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:11.909673	\N	f	\N
ac8209e7-4bdc-7d64-96af-29cd54dbadd0	gsggs	2025-05-13 13:39:01.683984	2025-05-13 13:51:15.765861	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:01.683984	\N	f	\N
db7a5352-be8c-3bda-d706-19eb7b4858fd	gsd	2025-05-13 13:39:06.627345	2025-05-13 13:51:15.767504	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:06.627345	\N	f	\N
3b1db8b1-b096-e5a7-b6aa-5e2f75c8009d	gs	2025-05-13 13:39:06.171725	2025-05-13 13:51:15.769332	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:06.171725	\N	f	\N
ec3132cb-9a1f-c9c6-4dad-3c00299a8a8d	ssdg	2025-05-13 13:39:05.830892	2025-05-13 13:51:15.76969	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:05.830892	\N	f	\N
e9892c86-a8a7-5946-287c-10a808ed0d65	sd	2025-05-13 14:50:17.314772	2025-05-13 14:51:06.870536	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:50:17.314772	\N	f	\N
4902f7fa-de99-923a-4623-97138530ca63	qs	2025-05-13 14:22:09.244146	2025-05-13 14:25:14.787586	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:09.244146	\N	f	\N
a28dfa3a-d714-5136-2fcc-de77969d0a77	fs	2025-05-13 14:50:40.294756	2025-05-13 14:51:06.870271	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:50:40.294756	\N	f	\N
369915cb-c435-0f34-fc4c-70c3701765f8	d	2025-05-13 14:30:48.283314	2025-05-13 14:39:59.680819	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:30:48.283314	\N	f	\N
d9c929ae-2e5d-ca4b-ab01-6943449c1d05	kk	2025-05-18 14:29:53.482749	2025-05-18 15:26:40.709253	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:29:53.482749	\N	f	\N
01ba1603-fc68-0051-4472-99c8e6fa668d	a	2025-05-18 16:44:55.124192	2025-05-18 20:45:00.747773	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-18 16:44:55.124192	\N	f	\N
4f053202-b10f-97f2-2dd6-48903c85f699	gay	2025-05-19 10:59:20.002106	2025-05-19 11:42:14.151928	bb6a4d43-70d3-5e36-d943-dfdfc747491f	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-19 10:59:20.002106	\N	f	f642bbdf-5566-1100-8217-331e5f0a6980
7731dc87-7030-9c33-6613-8e413fab0b39	A	2025-05-19 11:49:06.688842	2025-05-19 12:08:57.766401	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:49:06.688842	\N	f	\N
168f79d8-bffc-2f32-0e0d-7292af5dcdd2	k	2025-05-19 11:57:13.467324	2025-05-19 12:08:57.772715	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:57:13.467324	\N	f	\N
b1de5621-36b0-7989-8bf6-eb1b4a1ff892	k	2025-05-19 12:34:15.8057	2025-05-19 13:25:05.37582	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:34:15.8057	\N	f	\N
c263e790-1847-b363-4504-c8de5153fdde	jj	2025-05-19 14:31:48.760637	2025-05-20 12:13:35.575986	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-19 14:31:48.760637	\N	f	\N
f3c05d33-a7d3-b513-3de4-85ab05e09524	[message supprimé]	2025-04-29 13:54:49.287433	2025-04-30 12:08:40.782589	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.287433	2025-05-26 08:02:33.031179	t	\N
e93f6939-88d5-e093-7bc1-a6b17abedf42	B	2025-05-17 09:46:04.245476	2025-05-17 11:24:02.444106	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:46:04.245476	\N	f	\N
7dd68797-c190-ca55-bd10-eef950af4fc8	qsdqsd	2025-05-13 11:55:56.642427	2025-05-13 11:56:30.51491	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:55:56.642427	\N	f	\N
31e6be05-e6a0-a406-2e2d-108c6433ea62	sdgsdgs	2025-04-29 14:16:46.869163	2025-04-29 14:17:02.255504	c8eb671d-f3b4-41f6-7364-0f292619dfdc	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:16:46.869163	\N	f	\N
e09f3492-eae0-88e1-3a3a-b8124691db73	sdfklsdfkl	2025-05-26 09:25:07.616879	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:25:07.616879	\N	f	\N
fd2371ba-3c9e-e90d-d0aa-6a904442d0ef	Test	2025-05-13 07:57:14.723503	2025-05-13 07:57:14.77219	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 07:57:14.723503	\N	f	\N
60154032-c50e-84ea-10b7-936ba3393d34	ghfgh	2025-05-13 08:36:50.277255	2025-05-13 09:34:48.829792	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:50.277255	\N	f	\N
b0a10290-4d45-c505-e433-666a1582759d	s	2025-05-13 09:14:23.773066	2025-05-13 09:34:48.857049	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.773066	\N	f	\N
82502c48-40b3-729f-bbae-0cb4e83fd111	test	2025-05-17 13:46:14.513004	2025-05-17 13:46:16.614459	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 13:46:14.513004	\N	f	\N
d15f8738-f679-1baa-3d5d-b0fb850b57a0	f	2025-05-13 09:47:44.051841	2025-05-13 09:47:53.943224	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:44.051841	\N	f	\N
15401a50-04b7-d9bf-8f0e-66c9e76dd75f	[message supprimé]	2025-04-29 13:54:50.160317	2025-04-30 12:08:40.828173	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:50.160317	2025-05-26 08:02:33.031179	t	\N
7135ba5d-0b75-0ed7-2733-16acab5efa85	Test	2025-05-17 13:46:23.138234	2025-05-17 13:49:26.228536	a5c1b268-937f-af11-4ca2-2c96634fbe2e	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	[]	2025-05-17 13:46:23.138234	\N	f	\N
5f37ba8c-fb40-f1a2-d99a-5b35f20f18dc	sdf	2025-05-13 11:24:18.365239	2025-05-13 11:33:06.286838	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:18.365239	\N	f	\N
093866f6-22a7-bb7e-5fb3-581241ecdf6d	fg	2025-05-13 11:24:39.818924	2025-05-13 11:33:06.289589	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:39.818924	\N	f	\N
331e6939-f11b-f2ef-8c4d-be4f2d718369	d	2025-05-13 11:24:43.753579	2025-05-13 11:33:06.293536	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:43.753579	\N	f	\N
f49b684b-5ce7-a15a-0b58-1c1cc5fab215	test	2025-05-13 11:28:22.786131	2025-05-13 11:33:06.443669	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:28:22.786131	\N	f	\N
246286d5-1381-d469-ebc4-30c347bd77ac	ez	2025-05-13 11:33:02.463418	2025-05-13 11:33:06.625636	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:33:02.463418	\N	f	\N
a8969930-b0bd-e048-64eb-e708b6596c45	ygigg	2025-05-26 11:46:23.458876	2025-05-26 11:46:31.000642	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 11:46:23.458876	\N	f	\N
0b386fe2-c254-e6b7-bb1e-8e284c830318	Jdjd	2025-05-13 09:48:16.154546	2025-05-13 11:04:13.178924	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:48:16.154546	\N	f	\N
baa2cd64-de38-b2c3-2479-a894c867903d	yo	2025-05-13 12:05:38.101862	2025-05-13 12:19:07.947154	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 12:05:38.101862	\N	f	5ff0115f-dbcf-b7e3-837c-31d55bd219fe
75079d54-6151-a845-d4b9-281e932f6e91	caca prout	2025-05-26 13:31:46.882521	2025-05-26 13:40:04.690949	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 13:31:46.882521	\N	f	\N
f97fdf8f-dc75-4ce5-41db-33cc3d0821cc	fs	2025-05-13 13:40:13.494155	2025-05-13 13:41:12.119202	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:13.494155	\N	f	\N
f4bb07e8-78d1-86a3-f087-39a19af2467b	qsd	2025-05-13 14:33:14.881867	2025-05-13 14:39:10.515662	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:33:14.881867	\N	f	\N
d7630217-f633-4283-4ff3-214ef67b181b	qsd	2025-05-13 14:50:27.937348	2025-05-13 14:51:06.869677	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:50:27.937348	\N	f	\N
35483b60-3329-e772-c324-0eaf44647bcd	fqs	2025-05-13 14:22:10.93147	2025-05-13 14:25:14.79437	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:10.93147	\N	f	\N
c87d4093-11f5-bb5c-f7d7-65189c559d51	fqsfsq	2025-05-13 14:22:14.493591	2025-05-13 14:25:14.797208	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:14.493591	\N	f	\N
d98f5b6c-08d0-bada-8cd6-e3058750304c	sd	2025-05-13 14:22:15.03082	2025-05-13 14:25:14.802265	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:15.03082	\N	f	\N
a84b9800-9b9b-790f-2397-cbf727aa8787	sd	2025-05-13 13:39:03.500624	2025-05-13 13:51:15.768075	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:03.500624	\N	f	\N
e18d0087-dab8-8ead-b2a5-eac16da516c0	s	2025-05-13 13:39:06.447784	2025-05-13 13:51:15.76855	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:06.447784	\N	f	\N
94d490dc-289e-174c-7032-4e2d1c818933	dg	2025-05-13 13:39:04.078774	2025-05-13 13:51:15.768934	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:04.078774	\N	f	\N
e5a9bc7d-34fd-7419-b459-a9d1a5f5ca79	sg	2025-05-13 13:39:06.949818	2025-05-13 13:51:15.782244	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:06.949818	\N	f	\N
49959660-fa87-a1a0-c75b-248661ef27ca	sd	2025-05-13 13:39:08.691898	2025-05-13 13:51:15.783336	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:08.691898	\N	f	\N
d3fc0394-27a4-1e48-d04d-210c56bf803f	adazda	2025-05-13 13:22:45.665473	2025-05-13 13:24:00.963873	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:22:45.665473	\N	f	\N
31010ff9-2745-3ef8-ecd0-7762f5045b6e	d	2025-05-13 13:39:15.967928	2025-05-13 13:51:15.783593	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:15.967928	\N	f	\N
ee9f18b1-1d97-6a1e-39fb-ffd435acc875	dd	2025-05-13 13:39:12.329379	2025-05-13 13:51:15.7865	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:12.329379	\N	f	\N
dad0292a-f162-c0d7-f2de-df3fc2578aed	s	2025-05-13 13:42:15.702154	2025-05-13 13:59:55.155798	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:15.702154	\N	f	\N
2c634c02-47f9-bf2b-af8b-1b893bb3ba8e	[message supprimé]	2025-05-08 13:47:27.628617	2025-05-08 14:25:11.63396	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-08 13:47:27.628617	2025-05-19 10:59:42.859294	t	\N
fd4ec554-34de-a2d0-12c8-53500bd73871	[message supprimé]	2025-04-29 13:54:50.507655	2025-04-30 12:08:40.918184	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:50.507655	2025-05-26 08:02:33.031179	t	\N
73392a2a-6a50-b0d9-e2f0-06180db2c3e4	[message supprimé]	2025-05-17 11:13:56.473773	2025-05-17 11:15:41.00201	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:56.473773	2025-05-26 08:02:33.031179	t	\N
d0f6ee8c-0944-81ae-8911-c345ec617395	sdqd	2025-05-17 14:36:08.885318	2025-05-17 14:55:11.069913	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 14:36:08.885318	\N	f	\N
619e2f7f-99a2-028b-37ac-514c79198ba9	[message supprimé]	2025-05-17 11:13:57.2541	2025-05-17 11:15:41.030067	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:57.2541	2025-05-26 08:02:33.031179	t	\N
819595dd-be67-c622-0b6c-b94aa0247705	[message supprimé]	2025-05-13 09:23:36.65074	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	25c01514-5c67-6921-1cfa-6261c29e5d88	[]	2025-05-13 09:23:36.65074	2025-05-13 11:48:13.651445	t	\N
8f8d096e-b15b-6aed-35b2-8ead306eee87	smldmdsfsf	2025-05-26 09:25:41.575225	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:25:41.575225	\N	f	\N
6e40ebd1-741f-9802-c250-40306ac196b3	yo	2025-05-26 11:46:46.67888	2025-05-26 11:47:11.80927	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-26 11:46:46.67888	\N	f	\N
79619f60-ca70-3b29-3e07-728dce83c4ab	caca	2025-05-26 13:44:12.118161	\N	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 13:44:12.118161	\N	f	\N
1f39d863-2c37-5286-e0f9-73da3e9dae12	[message supprimé]	2025-04-29 12:32:07.97541	2025-04-29 12:48:42.175116	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:32:07.97541	2025-05-19 10:59:42.859294	t	\N
934c7058-3474-ad2d-0dac-88a22c213a21	[message supprimé]	2025-05-13 12:53:22.95961	2025-05-13 13:22:23.631858	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:22.95961	2025-05-19 07:34:59.606768	t	\N
b9a25355-c3a3-ca25-0ba8-a09ec5942e77	g	2025-05-17 15:11:48.727419	2025-05-17 15:16:13.087851	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:11:48.727419	\N	f	\N
031102e4-e1ee-3db3-ddf5-b6ee958c0aa0	qsd	2025-05-13 11:56:43.611388	2025-05-13 11:59:04.090777	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:56:43.611388	\N	f	\N
b28a1eb6-569c-6f3c-68f5-6c579d04d42c	caca	2025-05-13 08:00:55.353167	2025-05-13 09:34:48.826483	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:00:55.353167	\N	f	\N
9b776c1c-4553-f255-3c74-c28f65abc7d0	hf	2025-05-13 08:36:51.371118	2025-05-13 09:34:48.831228	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:51.371118	\N	f	\N
4dbcbc9e-8e15-345e-2b02-d742f440e7a8	hfg	2025-05-13 08:36:50.668577	2025-05-13 09:34:48.829965	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:50.668577	\N	f	\N
29b3404b-a3c6-7439-9a87-93cfb4d9ee1e	test	2025-05-13 09:44:15.100706	2025-05-13 09:47:04.535408	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:44:15.100706	\N	f	\N
fba77909-1ac4-2faf-4132-35d0d6c9c58a	[Message d'un utilisateur supprimé]	2025-05-08 14:00:10.279599	2025-05-08 14:25:11.370554	00000000-0000-0000-0000-000000000001	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-08 14:00:10.279599	\N	f	\N
6f4cb109-a2af-85d2-2ffb-c6829536f354	sdf	2025-05-13 11:24:23.468408	2025-05-13 11:33:06.288698	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:23.468408	\N	f	\N
17bd824d-aa01-643b-2a09-d85d600fd9c3	stest	2025-05-13 11:28:27.742216	2025-05-13 11:33:06.445172	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:28:27.742216	\N	f	\N
5da803eb-a841-e207-7ccd-70b8eb339686	sd	2025-05-13 14:02:44.180172	2025-05-13 14:03:37.157487	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:02:44.180172	\N	f	\N
b93d6a8c-9361-7438-f69a-95aa9293136a		2025-05-13 12:08:19.636146	2025-05-13 12:19:07.949295	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"68afd927-e966-d8fc-951e-757685f6963f\\"}]"	2025-05-13 12:08:19.636146	\N	f	\N
70b58d51-04af-1629-be97-ac85a439837d	test	2025-05-17 13:46:34.642496	2025-05-17 13:46:34.86854	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 13:46:34.642496	\N	f	7135ba5d-0b75-0ed7-2733-16acab5efa85
fc2a71d8-f3bd-b1c2-1612-f83318e535b7	B	2025-05-17 09:46:27.99319	2025-05-17 11:24:02.444679	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:46:27.99319	\N	f	\N
cfe186da-1af1-f128-c0ef-044ed1a06e75	[message supprimé]	2025-05-04 14:44:00.796088	2025-05-04 14:48:27.083202	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:44:00.796088	2025-05-19 10:59:42.859294	t	\N
ad51f907-b41e-766e-6d54-d2d29d857a38	g	2025-05-17 14:07:43.492428	2025-05-17 14:55:11.051232	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 14:07:43.492428	\N	f	\N
05941d2b-f455-0961-b299-5925c1fc649f	[message supprimé]	2025-05-04 15:34:28.277262	2025-05-04 15:44:55.881167	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 15:34:28.277262	2025-05-19 10:59:42.859294	t	\N
4e308f14-89ae-cb14-5e01-4b219949cdea	test	2025-05-17 15:06:23.224483	2025-05-17 15:07:27.761874	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:06:23.224483	\N	f	\N
df65d883-d9a2-9f92-bf81-513d6f99aee5	[message supprimé]	2025-04-29 13:54:51.185496	2025-04-30 12:08:40.919224	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.185496	2025-05-26 08:02:33.031179	t	\N
2642a529-9fd8-9935-c494-e6f0d58689b3	[message supprimé]	2025-04-29 13:54:51.446683	2025-04-30 12:08:40.918618	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.446683	2025-05-26 08:02:33.031179	t	\N
e939f59d-ee4b-ad4f-6f88-8025bd9e73ce	[message supprimé]	2025-04-29 13:54:51.79028	2025-04-30 12:08:40.919563	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.79028	2025-05-26 08:02:33.031179	t	\N
a2f29295-6fba-a537-20d6-08c375c44027	[message supprimé]	2025-04-29 13:54:51.943264	2025-04-30 12:08:40.920556	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.943264	2025-05-26 08:02:33.031179	t	\N
4bdb705c-b3d6-75da-ceb9-cfbff53f1bf9	Salut 	2025-05-13 09:47:59.318058	2025-05-13 11:04:13.179328	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:47:59.318058	\N	f	\N
f9837908-a516-0309-8306-59b3cc6066ca	k	2025-05-13 14:33:17.812705	2025-05-13 14:39:10.520996	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:33:17.812705	\N	f	\N
d780e008-a90a-7be7-3d82-e8eb8d3898e5	p	2025-05-13 14:50:32.298115	2025-05-13 14:51:06.870014	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:50:32.298115	\N	f	\N
b9f0e970-f560-3d9c-7e85-c133274f27f3	dqs	2025-05-13 14:22:14.693201	2025-05-13 14:25:14.800513	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:14.693201	\N	f	\N
370e377d-9ae2-a655-bb9a-84d1e4e9ed15	qsd	2025-05-13 14:22:15.198475	2025-05-13 14:25:14.804118	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:15.198475	\N	f	\N
e73f40e8-4f27-3675-12d8-e526c50ee135	qs	2025-05-13 14:22:15.356418	2025-05-13 14:25:14.807107	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:15.356418	\N	f	\N
11f351f3-24e5-7f0e-59df-4dd264f933b2	d	2025-05-13 13:39:21.102657	2025-05-13 13:51:15.784956	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:21.102657	\N	f	\N
227cb7f5-b8b0-713b-7492-a3fbab71f33f	ss	2025-05-13 13:42:20.210015	2025-05-13 13:59:55.1578	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:20.210015	\N	f	\N
2dc4939a-b112-c4ed-16ad-96f96548aa66	s	2025-05-13 13:42:20.723078	2025-05-13 13:59:55.158353	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:20.723078	\N	f	\N
6dd551fe-f885-8031-2525-11c26ddf852c	[message supprimé]	2025-05-13 09:24:13.581958	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	00000000-0000-0000-0000-000000000001	[]	2025-05-13 09:24:13.581958	2025-05-13 11:48:29.959963	t	\N
334cd564-97a7-7cb0-a615-d7d6a6d3cb94	pipi	2025-05-19 14:56:14.915709	2025-05-26 11:45:38.088094	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 14:56:14.915709	\N	f	\N
a909b2b0-24cf-68e6-74b1-d64b450aefac	ojkjkok^pk	2025-05-26 09:26:06.284901	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:26:06.284901	\N	f	\N
5594f306-f61c-7377-4c74-d342a6372111	gh	2025-05-13 08:36:51.701141	2025-05-13 09:34:48.831716	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:51.701141	\N	f	\N
a5730655-b117-358d-28eb-c834a890c814	[message supprimé]	2025-05-17 09:48:25.331834	2025-05-17 11:24:02.490074	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"fa82e186-4b40-34b6-eca8-4d7d36a47d7b\\"}]"	2025-05-17 09:48:25.331834	2025-05-17 09:48:29.145052	t	\N
3b71a2da-b9c3-aa90-6bd8-5807139dcff6	fg	2025-05-13 11:24:34.291999	2025-05-13 11:33:06.290413	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:34.291999	\N	f	\N
0d41c476-3213-683d-7ae9-8f09a97735bb	etst	2025-05-13 11:28:35.223087	2025-05-13 11:33:06.445491	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:28:35.223087	\N	f	\N
7d248b96-5dfc-8555-e5cd-2667832b63dc	test	2025-05-13 11:28:29.808155	2025-05-13 11:33:06.446153	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:28:29.808155	\N	f	\N
cf389f50-8f34-d6f6-94ac-aabf2828b36f	sf	2025-05-13 13:39:50.879894	2025-05-13 13:41:12.107635	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:39:50.879894	\N	f	\N
502c9dd3-3c5f-7784-f2dc-ffbe2aaced2a	qsfqsfq	2025-05-13 14:16:46.769608	2025-05-13 14:17:52.194532	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:16:46.769608	\N	f	\N
d220e0b7-d7d7-aab7-1f43-bd65c7730579	fsdfsd	2025-05-13 13:41:45.290306	2025-05-13 13:59:55.115271	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:45.290306	\N	f	\N
6577780b-5c54-8db4-2a7b-9d29400d7d7d	Bebe	2025-05-13 09:48:12.470865	2025-05-13 11:04:13.179737	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:48:12.470865	\N	f	\N
aa900129-cebd-9278-2db5-c2c238684a52	tesqxt	2025-05-13 13:29:31.519063	2025-05-13 13:30:03.786009	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:29:31.519063	\N	f	\N
06b7b031-5911-9340-0238-9da97b7cc2e6	trhr	2025-05-26 11:47:01.288763	2025-05-26 11:47:11.80927	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-26 11:47:01.288763	\N	f	\N
d8b5af07-40e1-7090-7375-25ed3cb46b2a	diff	2025-05-13 14:35:26.488583	2025-05-13 14:39:10.518757	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:35:26.488583	\N	f	\N
571ee35d-a9d2-322a-4075-3bbe119e0e01	m	2025-05-17 12:50:42.302899	2025-05-17 13:58:07.170113	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 12:50:42.302899	\N	f	\N
6ae2e17c-028f-9800-5612-15518c373277	caca	2025-05-26 13:45:48.4736	\N	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 13:45:48.4736	\N	f	\N
8e13959c-17f0-f1dc-5dd5-133df6a1a778	Test	2025-05-13 08:02:41.682562	2025-05-13 08:59:59.62045	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 08:02:41.682562	\N	f	\N
640bda70-fdc1-b12a-a67d-67b08da3999e	dsf	2025-05-17 15:11:21.229803	2025-05-17 15:16:13.091659	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:11:21.229803	\N	f	\N
6efb3d05-572d-1683-8a6a-57a6b1153305	lklk	2025-05-17 14:20:27.029072	2025-05-17 14:55:11.069363	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 14:20:27.029072	\N	f	\N
0428a2f6-4524-db60-cea0-428ae8cef77f	qfsqs	2025-05-17 14:20:33.622772	2025-05-17 14:20:34.595593	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:20:33.622772	\N	f	\N
45e9bbe8-2d01-ec5d-718b-daca03dd65b2	dq	2025-05-13 14:22:14.852623	2025-05-13 14:25:14.802369	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:14.852623	\N	f	\N
9176f37c-7cfc-5eb5-1f41-31c43f5977f2	d	2025-05-13 14:22:15.66772	2025-05-13 14:25:14.807594	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:15.66772	\N	f	\N
77447078-b5b1-3a94-a5ec-232111bf41f7	fqfqs	2025-05-17 14:20:13.357743	2025-05-17 14:20:14.14044	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:20:13.357743	\N	f	\N
1cb57354-22e2-2c5f-92bf-50440ab41fff	eilhflshf	2025-05-17 15:53:20.142533	2025-05-18 12:27:25.202943	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 15:53:20.142533	\N	f	\N
97e6bbd5-531e-1d09-05c8-5f831a5a4bbe	sfqdfq	2025-05-17 14:31:48.23875	2025-05-17 14:31:49.266002	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:31:48.23875	\N	f	\N
50e2043e-0fa5-5765-de09-26db8165ac07	a	2025-05-18 20:38:34.35523	2025-05-18 20:45:00.74681	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-18 20:38:34.35523	\N	f	\N
bfb5ddb5-6c77-d247-e1d8-39eeceb77ac4	dsdfsdf	2025-05-17 13:46:51.906777	2025-05-17 14:55:11.042361	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:46:51.906777	\N	f	\N
22abc797-1075-5a68-0333-c980e7f324f4	fzefzf	2025-05-17 15:06:45.040535	2025-05-17 15:07:27.766334	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:06:45.040535	\N	f	9b19e8e9-2e37-9278-534a-11b16568b543
c765d43a-f32d-68a6-c0be-e87d5b498106	f	2025-05-17 15:06:27.203588	2025-05-17 15:07:27.767633	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:06:27.203588	\N	f	\N
ae994af1-aee2-c37a-02c2-a2464d35cd0a	[message supprimé]	2025-05-13 11:56:56.006899	2025-05-13 12:50:15.45498	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:56:56.006899	2025-05-19 07:34:59.606768	t	\N
27afe61b-68d4-5b70-7647-8a67f8514509	mmm	2025-05-18 13:46:04.938675	2025-05-18 15:26:40.665271	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:46:04.938675	\N	f	\N
2b0774ce-7f24-6f30-2618-57bae540bb0d	sdqsq	2025-05-18 13:52:07.414287	2025-05-18 15:26:40.673856	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:52:07.414287	\N	f	\N
6c94d1ff-98f6-bc6e-4846-05fa3278adfb	mmmm	2025-05-18 13:54:50.696679	2025-05-18 15:26:40.683774	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:54:50.696679	\N	f	\N
b019508f-18a0-2181-799f-86507af7eedb	[message supprimé]	2025-04-29 12:38:00.442888	2025-04-29 12:48:42.177452	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:38:00.442888	2025-05-19 10:59:42.859294	t	\N
6784fbd0-3d4d-2114-e1bc-6bbefdf77f45	[message supprimé]	2025-05-04 14:48:43.961763	2025-05-04 14:49:25.435461	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:48:43.961763	2025-05-19 10:59:42.859294	t	\N
31adc5f2-13b3-d6c9-bd53-d9027cfb1580	b	2025-05-19 10:58:59.82015	2025-05-19 11:42:14.151601	bb6a4d43-70d3-5e36-d943-dfdfc747491f	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-19 10:58:59.82015	2025-05-19 10:59:35.094509	f	\N
c57a52dd-2987-e1cd-efd9-cd686920c3db	a	2025-05-19 11:57:20.8966	2025-05-19 12:08:57.783902	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:57:20.8966	\N	f	\N
ffc08e1e-1f0e-c79b-2420-8940a5fb3017	K	2025-05-19 11:49:50.872732	2025-05-19 12:08:57.749264	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:49:50.872732	\N	f	\N
755e99d2-e6bd-e65f-bf01-2b3035e43931	jdz	2025-05-19 12:37:32.962918	2025-05-19 13:25:05.409755	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:37:32.962918	\N	f	\N
9698b6d1-7374-b102-ff7f-6c6f1881409c	[message supprimé]	2025-04-29 13:54:51.5969	2025-04-30 12:08:40.918996	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.5969	2025-05-26 08:02:33.031179	t	\N
fcf89989-16bb-0e0d-d0be-6712f062333b	dsdfqdfdqfq	2025-05-26 09:33:04.142501	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:33:04.142501	\N	f	\N
887c4666-f895-87f7-5d03-ae967135faf6	giugug	2025-05-26 11:47:14.709698	2025-05-26 11:49:38.201542	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 11:47:14.709698	\N	f	\N
83d839b6-6bff-d984-b430-7b1f05554227	f	2025-05-17 09:53:25.419698	2025-05-17 11:24:02.45386	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:53:25.419698	\N	f	\N
5cbfb9df-eed4-555f-1378-c92cbe0138dd	fg	2025-05-13 08:36:51.71457	2025-05-13 09:34:48.834454	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:51.71457	\N	f	\N
18992c71-34ea-e66c-8c34-2c7754219704	z	2025-05-13 08:06:44.968333	2025-05-13 09:34:48.827563	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:06:44.968333	\N	f	\N
280d3b4c-c53e-7c34-1bda-36998414985d	h	2025-05-13 08:36:53.405452	2025-05-13 09:34:48.846444	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:53.405452	\N	f	\N
7f5720ee-b16b-3de2-5871-4a0ac6894828	test	2025-05-13 09:31:10.937787	2025-05-13 09:34:48.954669	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:31:10.937787	\N	f	\N
55556687-c092-6b4a-c172-7477f43f1907	cvb	2025-05-13 09:46:47.548764	2025-05-13 09:47:04.531948	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:47.548764	\N	f	\N
433aca7e-0a9e-a062-4b8a-5cf6110860c2	test	2025-05-13 09:46:39.284156	2025-05-13 09:47:04.536735	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:39.284156	\N	f	\N
98e0d607-f458-8ddd-781c-15621f64499f	est	2025-05-13 09:46:17.599573	2025-05-13 09:47:04.537139	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:17.599573	\N	f	\N
4f9e25fb-5110-e581-ed5b-3da1cf77f202	c	2025-05-13 09:46:48.104589	2025-05-13 09:47:04.537562	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:48.104589	\N	f	\N
c5e54f42-e769-bc50-1053-bdd0f01e3d71	b	2025-05-13 09:46:50.163771	2025-05-13 09:47:04.562071	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:50.163771	\N	f	\N
84b80da4-7134-9038-3739-4bd54c84fcec	e	2025-05-13 11:24:48.646032	2025-05-13 11:33:06.297395	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:48.646032	\N	f	\N
73c080e6-ae55-ff70-8ac2-1de6ddb7e8c4	test	2025-05-13 11:31:27.274857	2025-05-13 11:33:06.447322	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:27.274857	\N	f	\N
19388c05-bef7-0fe9-e144-13adb76d62ba	Salut 	2025-05-13 09:48:19.411945	2025-05-13 11:04:13.181041	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:48:19.411945	\N	f	\N
057596e0-b24f-c0e6-542f-19838fe06bf5	fh	2025-05-13 11:31:33.871974	2025-05-13 11:33:06.465077	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:33.871974	\N	f	\N
2158f124-d656-0aec-b051-38b23c9e2040	hf	2025-05-13 11:31:38.371989	2025-05-13 11:33:06.464868	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:38.371989	\N	f	\N
49257564-fb69-53e0-83d0-574e00c438ba	sf	2025-05-13 11:31:36.126928	2025-05-13 11:33:06.46571	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:36.126928	\N	f	\N
9c948211-3235-3123-1197-f6c5e7091226	jf	2025-05-13 11:31:41.276074	2025-05-13 11:33:06.467019	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:41.276074	\N	f	\N
10b64859-9444-d882-c48a-638ed332ee5e	gj	2025-05-13 11:31:45.552504	2025-05-13 11:33:06.622954	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:45.552504	\N	f	\N
55be711d-f1a8-ae59-d0f2-e34bd578ba73	s	2025-05-13 11:31:47.080565	2025-05-13 11:33:06.624219	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:47.080565	\N	f	\N
e2f3feef-1540-fcb9-2dde-a967192ac27b	qsd	2025-05-13 14:22:22.604601	2025-05-13 14:25:14.808224	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:22.604601	\N	f	\N
8a37786d-cf06-8719-5114-c0206a62905b	q	2025-05-13 14:22:23.560709	2025-05-13 14:25:14.816093	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:23.560709	\N	f	\N
eda919af-6ecf-d616-0da4-c4c610675c28	zdfpjzpofhzpfjpzzjfpzjfpjzfpizefpzepFzefzefze	2025-05-13 11:57:34.986384	2025-05-13 11:58:07.934058	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:57:34.986384	\N	f	\N
3010f972-f538-0d20-1234-8c58172c6603	s	2025-05-13 14:02:46.041349	2025-05-13 14:03:37.156626	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:02:46.041349	\N	f	\N
2ccf973c-a810-1188-f47a-1699e79c9fe6	[message supprimé]	2025-04-29 12:38:16.262525	2025-04-29 12:48:42.214951	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:38:16.262525	2025-05-19 10:59:42.859294	t	\N
b400b3f5-93e3-02bd-55c2-94dd2e333018	sgsg	2025-05-17 15:11:35.294022	2025-05-17 15:16:13.092698	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:11:35.294022	\N	f	\N
44bb22f0-7205-0b86-f294-a4f38dea3ef8	fqsf	2025-05-13 13:29:34.886512	2025-05-13 13:30:03.787561	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:29:34.886512	\N	f	\N
5cec789b-35a8-215d-5a22-43be494e4e8e	oui	2025-05-13 12:11:08.478186	2025-05-13 12:19:07.952836	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 12:11:08.478186	\N	f	eda919af-6ecf-d616-0da4-c4c610675c28
4307ed41-f1de-8a0c-6b2c-1224ecec3a58	caca	2025-05-26 13:46:38.588982	\N	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 13:46:38.588982	\N	f	\N
06856c99-38dc-5e72-4ec7-e046144e384b	[message supprimé]	2025-05-13 11:35:42.629727	2025-05-13 11:42:46.639891	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:35:42.629727	2025-05-19 10:59:42.859294	t	\N
c7e62e1a-0260-3262-d8cb-885b303453d8	sssss	2025-05-17 13:21:10.463386	2025-05-17 13:58:07.169856	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:21:10.463386	\N	f	\N
e5b74a5a-60e7-7fe1-7506-7d33cc34747d	fdgfdg	2025-05-17 16:10:01.806714	2025-05-18 12:27:25.212757	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 16:10:01.806714	\N	f	\N
b3987861-89af-d2f2-3e66-52630c04076f	ezf	2025-05-17 09:52:39.226122	2025-05-17 11:24:02.445026	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:52:39.226122	\N	f	\N
c9ed2ab3-d175-1cea-96d7-71f490367ff7	Salut	2025-05-13 14:16:23.53274	2025-05-13 14:51:35.424085	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 14:16:23.53274	\N	f	\N
c55c84c6-94e7-4964-a97d-4a7cb4a196ae	aezfeza	2025-05-17 09:52:33.453816	2025-05-17 11:24:02.445352	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:52:33.453816	\N	f	\N
3b6a9a24-f769-7376-c83f-11491d9860f8	[message supprimé]	2025-05-13 11:35:07.798397	2025-05-13 11:38:25.528598	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:35:07.798397	2025-05-19 07:34:59.606768	t	\N
3ef54608-bbe0-302b-15c2-c96c8f6749ed	[message supprimé]	2025-05-13 13:32:26.181742	2025-05-17 13:58:07.188194	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 13:32:26.181742	2025-05-19 07:34:59.606768	t	\N
1b43ae13-6bf4-01d0-7b80-5ce989308e3c	qsfqsf	2025-05-17 14:27:06.274155	2025-05-17 14:27:08.364633	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:27:06.274155	\N	f	\N
8f08b24a-5992-bfbd-c38f-7889116fc92f	[message supprimé]	2025-04-30 14:09:04.988956	2025-04-30 14:16:14.9575	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-04-30 14:09:04.988956	2025-05-19 10:59:42.859294	t	\N
d1edadd8-b4fb-fef0-a47a-36746cb8fc09	[message supprimé]	2025-05-04 17:10:16.59356	2025-05-04 17:11:56.251916	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-04 17:10:16.59356	2025-05-19 10:59:42.859294	t	\N
41c6b18e-54da-df17-0ff2-0497fe8f9634	dffsdf	2025-05-18 13:52:00.073575	2025-05-18 15:26:40.665812	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:52:00.073575	\N	f	\N
192eeadb-e16f-c309-dbd4-8e65eccb7be3	ml,nhi	2025-05-18 13:57:56.130683	2025-05-18 15:26:40.682498	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:57:56.130683	\N	f	\N
88e37a0a-5567-ba51-7bad-9ff6e65c778f	a	2025-05-18 16:44:49.009566	2025-05-18 20:45:00.752732	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-18 16:44:49.009566	\N	f	\N
b6065911-79f8-36f6-faf9-459ffcad909c	[message supprimé]	2025-04-30 12:51:14.986106	2025-04-30 12:51:29.628045	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 12:51:14.986106	2025-05-19 10:59:42.859294	t	\N
811f6a89-142c-528e-94a7-467ca961ee8c	[message supprimé]	2025-04-29 12:59:28.945118	2025-04-29 13:08:29.12446	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:59:28.945118	2025-05-19 10:59:42.859294	t	\N
30f71474-1057-672f-bbe2-3a874ae23752	[message supprimé]	2025-04-29 12:59:46.93003	2025-04-29 13:08:29.124931	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:59:46.93003	2025-05-19 10:59:42.859294	t	\N
1f2f3c4b-4ed1-b751-e60e-1a25b5b06633	[message supprimé]	2025-04-29 14:07:53.419589	2025-04-29 14:13:35.712723	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:07:53.419589	2025-05-19 10:59:42.859294	t	\N
8315531c-f97c-4054-213a-4993f4317b24	ll	2025-05-19 11:51:15.503527	2025-05-19 12:08:57.775901	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:51:15.503527	\N	f	\N
e0c74cec-7665-34ab-6b84-22f23785e75e	A	2025-05-19 12:00:02.581943	2025-05-19 13:25:05.156749	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:00:02.581943	\N	f	\N
d5960bbe-8c8b-14b0-7bf6-22538a32aaaf	[message supprimé]	2025-04-29 13:54:51.803665	2025-04-30 12:08:40.919801	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.803665	2025-05-26 08:02:33.031179	t	\N
ef1dfad4-0fa6-9b57-290f-b0ccb2a69860	s	2025-05-13 13:40:09.297244	2025-05-13 13:41:12.111204	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:09.297244	\N	f	\N
a226a8e1-f416-e2f9-fd19-f8683010cd9c	g	2025-05-13 08:36:52.112021	2025-05-13 09:34:48.833954	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:52.112021	\N	f	\N
cfa620cb-75ae-9d7e-a79b-19335eb7999c	sfs	2025-05-13 13:40:03.243755	2025-05-13 13:41:12.107172	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:03.243755	\N	f	\N
c89b1b84-8d5a-5a77-afae-46bb74d47018	e	2025-05-13 08:06:45.194126	2025-05-13 09:34:48.829333	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:06:45.194126	\N	f	\N
5ff0115f-dbcf-b7e3-837c-31d55bd219fe	fkjbkvhj	2025-05-13 11:57:47.241792	2025-05-13 11:58:07.935816	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:57:47.241792	\N	f	\N
0906c814-54d8-c5d7-fac0-ac9213f4737f	f	2025-05-13 08:36:52.75033	2025-05-13 09:34:48.836644	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:52.75033	\N	f	\N
cc8dcd5b-adce-9eed-bff3-d89de06df28e	fgh	2025-05-13 08:36:53.491418	2025-05-13 09:34:48.850912	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:53.491418	\N	f	\N
2635d10e-d8f9-cfce-7d8c-73131d5d370a	efzef	2025-05-13 09:31:55.112381	2025-05-13 09:34:48.955888	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:31:55.112381	\N	f	\N
9fbd4288-6b44-89de-1f8d-233b3ec79b3d	gcq	2025-05-13 09:46:41.09877	2025-05-13 09:47:04.533169	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:41.09877	\N	f	\N
259e182b-f1d2-4861-536c-0ea345c05854	sc	2025-05-13 09:46:42.056248	2025-05-13 09:47:04.536183	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:42.056248	\N	f	\N
2675861d-39ee-0b91-03dc-2ea01b7ea8af	test	2025-05-13 09:50:47.522657	2025-05-13 09:50:53.012781	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:50:47.522657	\N	f	\N
094fbd9f-572b-00f4-b997-dae796e50b9b	f	2025-05-13 11:24:51.09988	2025-05-13 11:33:06.306078	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:51.09988	\N	f	\N
dcdb446d-7751-07d4-adc4-456acbd44a68	fd	2025-05-13 11:31:30.550994	2025-05-13 11:33:06.462897	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:30.550994	\N	f	\N
895e4a9e-c413-9968-208c-22b6a05fa850	vc	2025-05-13 11:31:34.940934	2025-05-13 11:33:06.465342	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:34.940934	\N	f	\N
00000ffa-c201-7015-0f72-9534e75aa0cf	dg	2025-05-13 11:31:32.924372	2025-05-13 11:33:06.463368	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:32.924372	\N	f	\N
97799af5-3d14-3ef8-a116-9e46eba74a79	dsg	2025-05-13 11:31:42.318969	2025-05-13 11:33:06.46711	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:42.318969	\N	f	\N
a4f8bbcb-fb85-acab-b3a3-781b17f37a8c	sd	2025-05-13 11:31:39.231404	2025-05-13 11:33:06.465812	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:39.231404	\N	f	\N
aa06fd12-d760-5e2a-de91-484689a04ad3	gd	2025-05-13 11:31:37.217226	2025-05-13 11:33:06.465897	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:37.217226	\N	f	\N
a7cc359a-ce54-18ee-ccb5-4e97ed497fd8	gf	2025-05-13 11:31:44.026041	2025-05-13 11:33:06.622405	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:44.026041	\N	f	\N
c719945c-753b-77ea-49a2-95cc00748781	df	2025-05-13 11:31:46.338195	2025-05-13 11:33:06.623197	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:46.338195	\N	f	\N
5f980b49-725d-36fd-425c-53ec37d10ab1	hf	2025-05-13 11:31:44.767581	2025-05-13 11:33:06.623082	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:31:44.767581	\N	f	\N
667db76e-3102-c3ea-d723-3770b9a2cae7	zefzezfzefez	2025-05-26 09:37:04.091077	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:37:04.091077	\N	f	\N
e8ca0ba6-8387-23d6-51e4-4ba4b12fb537	[message supprimé]	2025-05-13 12:19:11.928767	2025-05-13 12:19:25.885584	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 12:19:11.928767	2025-05-13 12:19:41.158402	t	\N
77f45d77-8e99-a4a2-908d-358f1ad05bb6	qsf	2025-05-13 13:29:35.841575	2025-05-13 13:30:03.786639	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:29:35.841575	\N	f	\N
1c514834-c69e-791e-46c9-4eecd51a0e5b	sd	2025-05-13 13:41:57.990277	2025-05-13 13:59:55.131739	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:57.990277	\N	f	\N
740022b4-05f1-0c0d-d80c-13977d184ee2	[message supprimé]	2025-05-13 11:37:32.16804	2025-05-13 11:38:10.402425	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:37:32.16804	2025-05-19 07:34:59.606768	t	\N
2932fd16-0300-c928-a4ec-57c65f775db5	d	2025-05-13 13:42:10.803052	2025-05-13 13:59:55.134176	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:10.803052	\N	f	\N
57edc153-1d9e-ff4e-0137-afe6b4c5352c	ds	2025-05-13 13:42:11.427317	2025-05-13 13:59:55.151899	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:11.427317	\N	f	\N
62a9b764-7d46-23a0-5d7d-fbdd8036fc3e	psd	2025-05-13 14:35:44.660258	2025-05-13 14:39:10.517509	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:35:44.660258	\N	f	\N
c76b4c9e-e217-f76b-db53-2abfc79bf93d	qsdqsd	2025-05-17 10:23:45.932036	2025-05-17 11:24:02.454317	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 10:23:45.932036	\N	f	\N
90765781-8efd-2177-e7e1-f5d46c2d9e2d	qsfqsf	2025-05-13 14:16:51.887265	2025-05-13 14:25:14.782169	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:51.887265	\N	f	\N
9bb94a51-54c1-7b6a-9504-4ad68d2bfcae	qsf	2025-05-13 14:16:54.611493	2025-05-13 14:25:14.785693	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:54.611493	\N	f	\N
54b57ef9-a6a8-fe28-f3ea-60aaa571fe2f	wsfqsf	2025-05-13 14:16:53.980526	2025-05-13 14:25:14.784779	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:53.980526	\N	f	\N
835ce089-d6cd-96ac-d905-a5e05fac5db4	qsfd	2025-05-13 14:16:57.030809	2025-05-13 14:25:14.785564	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:57.030809	\N	f	\N
ad99b430-437d-09a6-b9e2-1c287976d6a2	BBIU	2025-05-26 11:55:21.239376	2025-05-26 12:09:24.393825	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 11:55:21.239376	\N	f	\N
8df7a5ed-964f-f1fd-4742-2c98156b5969	qs	2025-05-13 14:22:22.980427	2025-05-13 14:25:14.808667	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:22.980427	\N	f	\N
c0888da7-5d91-3550-0ddd-8fe88a07849c	dq	2025-05-13 14:22:23.064073	2025-05-13 14:25:14.811717	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:23.064073	\N	f	\N
cd78376a-3a55-fd79-f1bb-25880ab9c1b4	coucouc beau gosse	2025-05-17 10:24:02.029022	2025-05-17 11:24:02.464802	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 10:24:02.029022	2025-05-17 11:47:55.701524	f	\N
93435da1-576f-d446-8ead-79d486fb94ec	Test	2025-05-17 13:49:21.831238	2025-05-17 13:49:45.341577	a5c1b268-937f-af11-4ca2-2c96634fbe2e	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	[]	2025-05-17 13:49:21.831238	\N	f	70b58d51-04af-1629-be97-ac85a439837d
d65a3282-46bf-cc46-a741-2f9e1fe9e583	sqdqd	2025-05-17 14:36:23.308277	2025-05-17 15:19:07.396395	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 14:36:23.308277	\N	f	\N
e903e63c-6779-6bc0-c32d-a56f6754e004	jjj	2025-05-17 14:55:00.250056	2025-05-17 15:19:07.403729	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 14:55:00.250056	\N	f	\N
f7c9af46-ca85-983a-a314-7b14a8dc846f	test	2025-05-26 13:48:56.979607	\N	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 13:48:56.979607	\N	f	\N
a533c7bd-e61e-5dc6-0b3a-0758063e813a	qs	2025-05-17 14:20:16.754552	2025-05-17 14:20:19.669877	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:20:16.754552	\N	f	\N
35e72e78-484b-a5ce-6a83-aa640163b689	aaa	2025-05-17 13:21:18.977905	2025-05-17 13:58:07.171105	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:21:18.977905	\N	f	\N
8cdff91d-4d65-9c31-1ef8-630a0e45db18	dfdsfdsfsdf	2025-05-17 09:53:00.740653	2025-05-17 11:24:02.447233	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:53:00.740653	\N	f	\N
311c19f7-c1d6-c884-e80a-3934941ee06d	qsfqsf	2025-05-17 14:27:11.668525	2025-05-17 14:27:11.970222	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:27:11.668525	\N	f	\N
50a7fa2d-aa62-552c-5593-b1e8e6753f34	flhdfhis	2025-05-17 14:08:03.874641	2025-05-17 14:55:11.067939	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 14:08:03.874641	\N	f	\N
9d4bc9bd-0b0f-4fdc-6003-18c77ec4f8c3	fsd	2025-05-17 15:06:26.726716	2025-05-17 15:07:27.767964	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:06:26.726716	\N	f	\N
cc9f2b05-9da4-6ef2-292d-0eff7432ef38	AAAA	2025-05-17 15:59:01.776764	2025-05-18 12:27:25.206278	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 15:59:01.776764	\N	f	\N
6641cb4a-cec8-a9ee-84dc-15602604c4dc	fhj	2025-05-17 14:31:52.613545	2025-05-17 14:31:53.269362	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:31:52.613545	\N	f	\N
762bfccb-2a94-d2f7-f594-16c102a6b204	mmmm	2025-05-18 13:45:19.388663	2025-05-18 15:26:40.666063	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:45:19.388663	\N	f	\N
71a9bf18-4cf8-99f6-9cc7-7d562bb266da	a	2025-05-18 16:44:43.317252	2025-05-18 20:45:00.746392	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-18 16:44:43.317252	\N	f	\N
cbed91cb-7fe4-b8ad-84b6-d55499636137	[message supprimé]	2025-04-30 13:41:37.754001	2025-04-30 13:55:36.559534	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 13:41:37.754001	2025-05-19 10:59:42.859294	t	\N
1f722d36-789b-c14a-b7b4-925a8ff42a6a	rtyuuoo	2025-05-18 13:59:13.13851	2025-05-18 15:26:40.68319	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:59:13.13851	\N	f	\N
8cc4c82d-58cf-9b21-8f04-e58a1b55a9dd	[message supprimé]	2025-05-04 14:58:23.917359	2025-05-04 15:00:37.540166	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:58:23.917359	2025-05-19 10:59:42.859294	t	\N
c9aecf3e-d97c-6e5a-6f2f-717f386f118d	[message supprimé]	2025-04-29 12:48:58.729671	2025-04-29 12:58:37.630627	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:48:58.729671	2025-05-19 10:59:42.859294	t	\N
bafaae55-dd65-978c-24e0-77b7299fcb5c	[message supprimé]	2025-05-13 12:55:46.494067	2025-05-13 13:22:23.509053	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:55:46.494067	2025-05-26 08:02:33.031179	t	\N
24385936-c359-53f8-9b90-8b9ad7598750	[message supprimé]	2025-05-17 11:13:55.017062	2025-05-17 11:15:41.006748	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:55.017062	2025-05-26 08:02:33.031179	t	\N
f5249380-7ead-f998-6259-24fe0589c498	sd	2025-05-13 14:30:47.930673	2025-05-13 14:39:59.684128	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:30:47.930673	\N	f	\N
9e72edd4-ca5e-fbd0-e62a-c32e4680561f	mm	2025-05-18 14:00:11.909822	2025-05-18 15:26:40.687814	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:00:11.909822	\N	f	\N
afc1208e-9047-b6c1-d590-eedcc1659104	[message supprimé]	2025-05-17 11:13:51.628243	2025-05-17 11:15:41.006435	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:51.628243	2025-05-26 08:02:33.031179	t	\N
82534cec-548c-342b-d3e1-6ef7a8a57a2a	lll	2025-05-17 13:40:02.497072	2025-05-17 14:55:11.041263	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:40:02.497072	\N	f	\N
b657e49a-6eb7-58a4-d6f4-40e735f73641	[message supprimé]	2025-05-17 13:42:13.041975	2025-05-17 13:52:23.22187	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:42:13.041975	2025-05-26 08:02:33.031179	t	0ec44c11-483e-1755-c42d-3fec6d26e790
b6faf802-b0c8-cc5e-838e-4e82182c9e84	kkk	2025-05-18 14:34:12.726063	2025-05-18 15:26:40.720994	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:34:12.726063	\N	f	\N
8dd4e298-646a-b7c3-1961-859ca8eda82d	sf	2025-05-17 14:28:53.608152	2025-05-17 14:28:54.726482	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:28:53.608152	\N	f	\N
acc882f0-27dc-cb34-4a5e-6f793c735dc8	qdf	2025-05-17 14:28:51.983658	2025-05-17 14:28:53.039464	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:28:51.983658	\N	f	\N
9ddd8eab-949c-21d4-a07f-390cff74f0d5	a	2025-05-18 16:44:38.022499	2025-05-18 20:45:00.765611	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-18 16:44:38.022499	\N	f	\N
e7f437be-d117-721c-2565-9464b8dbb544	jhjhjh	2025-05-17 14:55:23.704357	2025-05-17 15:19:07.405006	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 14:55:23.704357	\N	f	\N
d6a5853a-c101-8bd9-38fb-aaf3c33f2112	qsd	2025-05-17 10:23:48.395208	2025-05-17 11:24:02.454418	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 10:23:48.395208	\N	f	\N
8e9f9359-205d-56b3-f27e-f992dc3b947a	sd	2025-05-13 14:22:23.18053	2025-05-13 14:25:14.812023	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:23.18053	\N	f	\N
40aea244-4826-2781-dc57-ececc74f805e	d	2025-05-13 14:22:24.195052	2025-05-13 14:25:14.818346	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:24.195052	\N	f	\N
d7b6ce00-ab93-db6e-d545-2fb68bc7f905	[message supprimé]	2025-04-29 12:52:20.804243	2025-04-29 12:58:37.630683	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:52:20.804243	2025-05-19 10:59:42.859294	t	\N
80f1ba0f-03ff-3b1a-12c1-150483d0367f	[message supprimé]	2025-05-17 09:53:39.998723	2025-05-17 11:24:02.492694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"056d2242-1e60-37ed-e75b-d9a39c8ea420\\"}]"	2025-05-17 09:53:39.998723	2025-05-17 09:53:46.10377	t	\N
777adb41-46aa-177d-bd3e-dcafe75e2100	[message supprimé]	2025-05-06 13:40:33.945309	2025-05-08 09:16:33.660804	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-06 13:40:33.945309	2025-05-19 10:59:42.859294	t	\N
d5933c0e-da5c-6e4e-c9e9-3d303164d782	[message supprimé]	2025-04-30 14:14:21.17032	2025-04-30 14:16:14.746744	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 14:14:21.17032	2025-05-19 10:59:42.859294	t	\N
0970d7f3-8af1-ff20-673d-fe3b036255fb	test	2025-05-17 13:49:36.320721	2025-05-17 13:49:36.831316	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 13:49:36.320721	\N	f	7135ba5d-0b75-0ed7-2733-16acab5efa85
b9414322-70d0-f356-c566-f0fb8aeb8b24	[message supprimé]	2025-05-04 13:44:58.193466	2025-05-04 13:45:01.189915	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 13:44:58.193466	2025-05-19 10:59:42.859294	t	\N
9b19e8e9-2e37-9278-534a-11b16568b543	sd	2025-05-17 15:06:27.763429	2025-05-17 15:07:27.766805	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:06:27.763429	\N	f	\N
2794e0ce-7448-d99e-8cfb-35783551d969	sdf	2025-05-17 15:06:27.52615	2025-05-17 15:07:27.768446	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:06:27.52615	\N	f	\N
56474991-230c-3223-8587-b06c4c7d6217	sddsfdsfsdf	2025-05-17 15:26:01.70946	2025-05-17 15:58:12.624051	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 15:26:01.70946	\N	f	\N
34bc9a14-7938-d40d-b4c2-5e0b0f2f123e	fdqsdqd	2025-05-17 15:26:17.489563	2025-05-17 15:58:12.626337	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 15:26:17.489563	\N	f	\N
ce716c63-a8d9-bf04-f8f1-fbfcd3d23a27	test	2025-05-17 13:41:16.073936	2025-05-18 12:27:25.19102	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:41:16.073936	\N	f	12357f94-3918-109a-2bbd-6830b1e0dad7
8d893b7a-2658-5f37-4d85-917f7e75d36c	j'ai fait ca : paulmazzon@MacBook-Air-de-Paul SUPCHAT % git pull --rebase remote: Enumerating objects: 1, done. remote: Counting objects: 100% (1/1), done. remote: Total 1 (delta 0), reused 1 (delta 0), pack-reused 0 (from 0) Unpacking objects: 100% (1/1), 167 bytes | 41.00 KiB/s, done. From https://github.com/paulmzzn/SUPCHAT    b1b4676..cd8504b  math11          -> origin/math11  * [new branch]      math13          -> origin/math13  * [new branch]      math14          -> origin/math14  * [new branch]      rgt_francais    -> origin/rgt_francais  * [new branch]      rgt_notif_sound -> origin/rgt_notif_sound Already up to date. paulmazzon@MacBook-Air-de-Paul SUPCHAT % 	2025-05-17 14:42:27.71091	2025-05-18 13:10:16.247888	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:42:27.71091	\N	f	\N
26101c30-68ab-b1da-d4f8-3c06d06cabd6	[message supprimé]	2025-05-13 11:41:09.053795	2025-05-13 11:43:29.498564	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-13 11:41:09.053795	2025-05-19 10:59:42.859294	t	\N
3caae238-ffc6-7b7b-dee0-e43109698896	qsf	2025-05-17 14:20:14.561365	2025-05-17 14:20:16.735853	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:20:14.561365	\N	f	\N
d9e95fbe-8aa8-554e-0d75-3aa26fc53033	[message supprimé]	2025-04-29 14:11:26.181723	2025-04-29 14:13:35.711366	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:11:26.181723	2025-05-19 10:59:42.859294	t	\N
92c5dc7e-b46b-45f7-5a95-da85fbee7023	qsfqsf	2025-05-17 14:28:51.494955	2025-05-17 14:28:51.948562	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:28:51.494955	\N	f	\N
4d9e0e47-a41f-5017-6cc9-514605215d6e	qsf	2025-05-17 14:28:54.746157	2025-05-17 14:28:55.446856	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:28:54.746157	\N	f	\N
95dfa04e-d2f6-050c-b9f0-c9b9c52fc24d	mmm	2025-05-17 13:21:47.987571	2025-05-17 13:58:07.180093	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:21:47.987571	\N	f	\N
f62799f9-5377-b252-d603-c8aa4679a49b	qs	2025-05-17 14:31:49.385643	2025-05-17 14:31:50.061031	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:31:49.385643	\N	f	\N
e714e1bf-de71-7e4c-1e6c-d6d5ebdda285	[message supprimé]	2025-04-29 12:49:07.38283	2025-04-29 12:58:37.630087	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:49:07.38283	2025-05-19 10:59:42.859294	t	\N
d659770a-a246-b026-9b92-fe331bfc9c77	f	2025-05-17 14:28:52.734907	2025-05-17 14:28:54.237279	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:28:52.734907	\N	f	\N
f6ec2263-9233-bd74-bda6-1b0790f75d1a	[message supprimé]	2025-04-30 13:55:36.148456	2025-04-30 13:56:33.349379	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 13:55:36.148456	2025-05-19 10:59:42.859294	t	\N
e2fc9f2a-4eca-b6c2-f67d-8b832d4b6e4f	[message supprimé]	2025-05-04 16:35:37.397253	2025-05-04 17:02:02.986255	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 16:35:37.397253	2025-05-19 10:59:42.859294	t	\N
72153dfa-1c10-6132-048f-b633fe928304	[message supprimé]	2025-05-04 14:53:15.551773	2025-05-04 14:58:08.565405	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:53:15.551773	2025-05-19 10:59:42.859294	t	\N
24dfadbf-fc68-a09c-06b2-b5617734010a	[message supprimé]	2025-04-29 12:40:35.689867	2025-04-29 12:58:46.690555	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-04-29 12:40:35.689867	2025-05-19 10:59:42.859294	t	\N
9f4b3971-3eae-d018-213f-2312e6477615	fqs	2025-05-17 14:28:53.046383	2025-05-17 14:28:53.581383	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:28:53.046383	\N	f	\N
a59fbad2-bed8-f4e6-0666-a2e77f43f822	[message supprimé]	2025-04-29 12:18:35.837173	2025-04-29 12:29:30.296242	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-04-29 12:18:35.837173	2025-05-19 10:59:42.859294	t	\N
396da536-903d-cb12-b9df-041286616d53	aaa	2025-05-26 09:37:38.980766	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:37:38.980766	\N	f	\N
4d189d59-e4db-51ff-b61e-767718398ec3	zzzz	2025-05-26 09:37:41.246897	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:37:41.246897	\N	f	\N
59cb476f-4342-e3cd-5a04-1a37d243a71d	[message supprimé]	2025-05-04 14:53:01.688999	2025-05-04 14:58:14.360597	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-04 14:53:01.688999	2025-05-19 10:59:42.859294	t	\N
91accb11-c5d1-444d-7867-f43a4f548d49	jjgjgh	2025-05-18 14:02:41.791731	2025-05-18 15:26:40.688233	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:02:41.791731	\N	f	\N
2d38db3f-065e-3625-1854-45304d304948	[message supprimé]	2025-04-30 12:51:59.106413	2025-04-30 12:57:25.150537	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 12:51:59.106413	2025-05-19 10:59:42.859294	t	\N
eaf16bb0-9c32-3b17-63f7-3b5d9783f1f4	[message supprimé]	2025-04-29 13:51:58.562737	2025-04-29 14:02:46.778713	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 13:51:58.562737	2025-05-19 10:59:42.859294	t	\N
a63afbae-3945-e8cc-02e3-bef08aa9095e	[message supprimé]	2025-04-29 14:13:46.61287	2025-04-29 14:16:25.978534	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:13:46.61287	2025-05-19 10:59:42.859294	t	\N
113f25d2-aae8-8666-a8b8-1ac042094fc8	JVHJV	2025-05-26 11:55:24.781505	2025-05-26 12:09:24.393825	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 11:55:24.781505	\N	f	\N
00a1f569-34c2-3e07-d357-3c45e66491e9	mmmm	2025-05-17 15:31:22.339456	2025-05-17 15:58:15.136556	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-17 15:31:22.339456	\N	f	\N
eaa525d0-3d73-7d5c-4810-98705885cc0d	[message supprimé]	2025-04-29 12:29:44.563262	2025-04-29 12:37:36.615153	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:29:44.563262	2025-05-19 10:59:42.859294	t	\N
64e52a1d-971c-d0cc-413f-86e9ce14edfa	qfzdsf	2025-05-17 13:42:57.592236	2025-05-17 14:32:36.055284	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 13:42:57.592236	\N	f	013950dd-13e8-43f8-ec2f-410acf45ea91
d8fb4d67-66d3-eed1-e8a9-14863e15c971	[message supprimé]	2025-05-12 14:29:25.801268	2025-05-12 14:40:53.934057	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-12 14:29:25.801268	2025-05-19 10:59:42.859294	t	\N
cbda3b15-c419-94bd-16ba-d895db27b224	caca	2025-05-17 14:34:25.658798	2025-05-17 14:37:06.08865	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:34:25.658798	\N	f	\N
ab19c93a-f9a6-df7e-ff6f-4899069bd29c	[message supprimé]	2025-05-13 12:30:29.028155	2025-05-13 14:36:28.737698	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"f80b3869-ec66-0699-52b3-bde225a46e5a\\"}]"	2025-05-13 12:30:29.028155	2025-05-13 12:31:15.704242	t	\N
91fc17bd-1a55-923b-2ddd-6c1932ea1cea	ssqd	2025-05-13 14:37:36.975902	2025-05-13 14:39:10.520088	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:37:36.975902	\N	f	\N
3006cff1-d2b7-ea90-2fbe-10eedc1822db	[message supprimé]	2025-04-30 14:03:51.284271	2025-04-30 14:13:10.027903	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 14:03:51.284271	2025-05-19 10:59:42.859294	t	\N
3c8bb747-0d70-127b-aadd-4a8cdc0c852d	[message supprimé]	2025-05-17 10:23:56.256442	2025-05-17 11:24:02.462618	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 10:23:56.256442	2025-05-17 11:48:15.642726	t	\N
130f3fad-046a-282e-1094-50190b4f616c	[message supprimé]	2025-05-13 11:41:32.21025	2025-05-13 11:43:29.498681	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-13 11:41:32.21025	2025-05-19 10:59:42.859294	t	\N
58dd84bb-099b-75e5-5709-d403ee154fc5	[message supprimé]	2025-04-29 14:16:18.591643	2025-04-29 14:16:25.979312	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:16:18.591643	2025-05-19 10:59:42.859294	t	\N
a2127f32-d1bb-5f9f-fa0b-17afcacd5133	[message supprimé]	2025-05-04 13:57:39.98085	2025-05-04 14:05:57.644513	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 13:57:39.98085	2025-05-19 10:59:42.859294	t	\N
e32c7c2b-9d81-7d38-34c6-dc925458818f	[message supprimé]	2025-04-29 12:29:52.968866	2025-04-29 12:37:36.614943	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:29:52.968866	2025-05-19 10:59:42.859294	t	\N
1721d012-249b-5a5e-b3ef-04009056a5aa	f	2025-05-17 14:31:50.087159	2025-05-17 14:31:50.826079	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:31:50.087159	\N	f	\N
bf15ecde-a57f-5337-6662-2017bf5101d5	[message supprimé]	2025-05-04 15:14:29.905149	2025-05-04 15:17:00.985426	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 15:14:29.905149	2025-05-19 10:59:42.859294	t	\N
9559507a-f635-d705-43ee-60ff0897af02	fqsdfqs	2025-05-17 14:21:21.592108	2025-05-17 14:21:22.886805	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:21:21.592108	\N	f	\N
8fe30894-f9c3-2077-0a2b-30966b428c20	SDFDSFSD	2025-05-17 15:28:11.136914	2025-05-17 15:58:12.630396	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 15:28:11.136914	\N	f	\N
1052b125-e2c4-e691-59d7-a60d135b9ee4	test	2025-05-17 13:41:03.726681	2025-05-18 12:27:25.18759	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:41:03.726681	\N	f	4930ff47-d650-3429-a8a8-68b4de3aaa30
ee469c28-51e2-0db8-642d-3642f6b764a5	mmm	2025-05-17 13:23:18.653629	2025-05-17 13:58:07.185314	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:23:18.653629	\N	f	\N
2937387d-e0bb-ecdb-29ef-c6400f3c2dcd	Test	2025-05-17 13:51:46.827733	2025-05-17 14:22:17.650416	a5c1b268-937f-af11-4ca2-2c96634fbe2e	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	[]	2025-05-17 13:51:46.827733	\N	f	0970d7f3-8af1-ff20-673d-fe3b036255fb
7b981fa1-455f-b8f1-a978-d3825cebdac6	[message supprimé]	2025-05-13 11:43:04.328253	2025-05-13 11:43:29.502707	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-13 11:43:04.328253	2025-05-19 10:59:42.859294	t	\N
93dc37d7-add0-8c63-39e0-5bf588311768	[message supprimé]	2025-04-29 12:30:08.397192	2025-04-29 12:48:42.174266	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:30:08.397192	2025-05-19 10:59:42.859294	t	\N
aab39835-ed7a-f09e-75e0-933060abd9db	sdfsdf	2025-05-17 15:06:26.353537	2025-05-17 15:07:27.767237	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 15:06:26.353537	\N	f	\N
0f969905-7a59-a14c-0b62-7b1061dca46d	qsfq	2025-05-17 14:31:50.817552	2025-05-17 14:31:51.675394	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:31:50.817552	\N	f	\N
1a3e5ffe-9324-e27c-8921-ce0b8c7c2912	[message supprimé]	2025-05-04 15:17:25.968743	2025-05-04 15:34:05.851345	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-04 15:17:25.968743	2025-05-19 10:59:42.859294	t	\N
bd203d40-8622-36c6-59cb-db764b912bfb	[message supprimé]	2025-05-13 11:33:39.918722	2025-05-13 11:42:46.64182	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:33:39.918722	2025-05-19 10:59:42.859294	t	\N
ccf866d5-ff6a-4efb-daee-9342e12eea3c	[message supprimé]	2025-04-29 13:58:11.674952	2025-04-29 14:02:46.776459	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 13:58:11.674952	2025-05-19 10:59:42.859294	t	\N
a293004d-3680-3898-8441-951b32bfa3cc	[message supprimé]	2025-05-17 09:55:18.152747	2025-05-17 11:24:02.497465	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"e5acec96-69d8-dde7-387c-7db793d13fda\\"}]"	2025-05-17 09:55:18.152747	2025-05-17 09:57:55.776322	t	\N
c6c72219-4d13-1bba-714b-6af59fe0c251	[message supprimé]	2025-04-29 12:38:26.988174	2025-04-29 12:48:42.216618	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:38:26.988174	2025-05-19 10:59:42.859294	t	\N
5b76aa3f-f624-c2c4-1836-eed301afcc29	[message supprimé]	2025-05-04 15:45:09.27878	2025-05-04 15:45:10.678122	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-04 15:45:09.27878	2025-05-19 10:59:42.859294	t	\N
580c84a9-4f76-cbbd-1612-074e98b46eb6	aaaa	2025-05-18 13:35:06.518866	2025-05-18 15:26:40.585999	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:35:06.518866	\N	f	\N
38880680-9837-281f-5df3-950e030a1a89	a	2025-05-20 10:14:42.828581	2025-05-26 11:45:38.088094	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 10:14:42.828581	\N	f	\N
dbe2d3e8-8e76-56dd-d1df-60a77b40cd46	mk	2025-05-19 13:25:51.097948	2025-05-19 13:35:34.894804	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 13:25:51.097948	\N	f	\N
4e9bde3e-e097-182d-e63c-d2747c7de96c	mkmkk	2025-05-17 14:55:29.72625	2025-05-17 15:58:14.485686	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-17 14:55:29.72625	\N	f	\N
691b73d3-4b02-a5e6-e2b4-12fb0c3e5fec	aaazzz	2025-05-18 13:35:27.441345	2025-05-18 15:26:40.6629	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:35:27.441345	\N	f	\N
674c6ab9-6d84-e3cc-7631-142fe882ea90	couille	2025-05-18 13:41:42.714977	2025-05-18 15:26:40.664749	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:41:42.714977	\N	f	\N
6bbdbcc7-534f-8549-2983-bec7312b458b	hhfgfjf	2025-05-18 14:03:46.70835	2025-05-18 15:26:40.700667	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:03:46.70835	\N	f	\N
9de7287d-a2ea-93b3-4889-750a7b509af7	eee	2025-05-26 09:37:42.316295	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:37:42.316295	\N	f	\N
75bf86ab-567c-dae6-c1b7-6f446336c760	k	2025-05-19 11:53:50.818735	2025-05-19 12:08:57.769339	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:53:50.818735	\N	f	\N
3d7bf1db-26a4-6c26-dfb2-d3e3a300fb5c	a	2025-05-18 20:45:08.338248	2025-05-18 20:57:21.531981	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 20:45:08.338248	\N	f	\N
cd1fb00f-7f79-dd0a-93c5-28e9424bba0f	klkjlkj	2025-05-26 12:07:35.121533	2025-05-26 12:09:24.393825	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 12:07:35.121533	\N	f	\N
18ae5dcc-ca83-c832-de5e-cede57eb7978	mm	2025-05-26 13:59:56.815745	2025-05-26 14:13:54.841479	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 13:59:56.815745	\N	f	\N
12bf5666-7db6-b227-c069-74c8834815fb	[message supprimé]	2025-05-13 14:10:07.152206	2025-05-13 14:13:24.525091	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:10:07.152206	2025-05-19 07:34:59.606768	t	\N
10a0dbbd-4bef-c9ce-c6d2-dfb5e30ef862	kk	2025-05-26 14:00:01.155751	2025-05-26 14:13:54.841479	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 14:00:01.155751	\N	f	\N
e6ef0a81-54e8-4c46-3f04-4e863027aac1	mlk	2025-05-19 12:59:26.11888	2025-05-19 13:35:34.886733	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:59:26.11888	\N	f	\N
544af20d-2c12-24f5-fbfe-094c9390ee18	ll	2025-05-19 13:41:30.965858	2025-05-20 12:13:35.575265	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-19 13:41:30.965858	\N	f	340e65de-9f34-aa8d-4ce1-aa1da4b29d18
9d85b514-75cc-ccd1-fb6d-2ece11ffe7ee		2025-05-20 11:37:54.654949	2025-05-20 12:33:27.593835	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"1293cf8e-405e-fcf1-d0e4-424288c0b4ea\\"}]"	2025-05-20 11:37:54.654949	\N	f	\N
91bd6bcb-6ac1-8f1a-23a3-a174ec9d6488		2025-05-20 11:59:24.572997	2025-05-22 09:53:12.041327	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	"[{\\"id\\":\\"26dd04b2-eafc-7844-e3b6-9cd4aa1e9f43\\"}]"	2025-05-20 11:59:24.572997	\N	f	\N
ffbd5343-294a-a924-8a3e-b2737112f006	[message supprimé]	2025-05-17 11:13:35.939341	2025-05-17 11:32:31.086667	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 11:13:35.939341	2025-05-26 08:02:33.031179	t	\N
e5fa1170-4d18-c6a8-ef35-2b723a73ca3f	[message supprimé]	2025-05-19 12:07:06.661172	2025-05-19 12:42:59.845603	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 12:07:06.661172	2025-05-26 08:02:33.031179	t	\N
f9af1219-4059-36bd-a1d0-f27451554302	zrter	2025-05-13 14:37:48.346648	2025-05-13 14:39:10.522228	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:37:48.346648	\N	f	\N
013950dd-13e8-43f8-ec2f-410acf45ea91	qdfqsd	2025-05-17 12:29:31.411857	2025-05-17 12:29:44.082416	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 12:29:31.411857	\N	f	\N
14481fbf-db7e-7ba4-458e-1b4950fe9b2d	test	2025-05-17 12:29:39.153721	2025-05-17 12:29:44.220501	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 12:29:39.153721	\N	f	013950dd-13e8-43f8-ec2f-410acf45ea91
e3f760db-dece-16b0-f0cc-8e87d7af8472	qsdqsd	2025-05-13 14:10:13.497484	2025-05-13 14:13:24.526728	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:10:13.497484	\N	f	\N
d047b9ac-47d1-e44b-5957-1998d274d2de	Suft	2025-05-17 14:22:06.984513	2025-05-17 14:22:07.039122	a5c1b268-937f-af11-4ca2-2c96634fbe2e	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	[]	2025-05-17 14:22:06.984513	\N	f	\N
c821631b-1faf-2de9-408f-2a9a36ef0b92	test	2025-05-17 13:52:23.140606	2025-05-17 13:52:24.453305	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 13:52:23.140606	\N	f	7135ba5d-0b75-0ed7-2733-16acab5efa85
9578e7fd-dbfd-7112-488e-e29a24209781		2025-05-13 14:24:07.526832	2025-05-13 14:25:14.819476	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	"[{\\"id\\":\\"458b37aa-952b-6616-a3e6-3f262e32f5b3\\"}]"	2025-05-13 14:24:07.526832	\N	f	\N
8b23a0bd-9eb1-d9c3-1aad-2d2f36a09b6d	oui	2025-05-20 10:15:36.858976	2025-05-20 12:33:27.602019	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 10:15:36.858976	\N	f	\N
6c8dc654-03a2-245b-0ab1-0d856c49dc62		2025-05-20 11:38:18.598935	2025-05-20 12:33:27.604969	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"4a17e600-3f57-7db9-b85b-01da0878c772\\"}]"	2025-05-20 11:38:18.598935	\N	f	\N
81dc1ae4-bbf7-e485-3864-1f03030624d9	test	2025-05-17 14:34:42.855562	2025-05-17 14:37:06.088037	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:34:42.855562	\N	f	\N
8539dee4-e39e-60b9-ec04-60ef4c2d7156	test	2025-05-17 14:37:12.837994	2025-05-17 14:37:20.527979	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:37:12.837994	\N	f	\N
ecdf38f2-13e4-2134-376d-cfdb3787dd6c		2025-05-19 13:30:14.33602	2025-05-19 13:34:33.424569	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	"[{\\"id\\":\\"a2ea8ffc-fe7d-d12c-c389-3c4dc41c44aa\\"}]"	2025-05-19 13:30:14.33602	\N	f	\N
ecf28006-5403-711c-d9ad-23e12807411b	l	2025-05-19 12:22:53.386092	2025-05-19 13:25:05.374962	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:22:53.386092	\N	f	\N
59a26637-729c-1fae-e56a-836f9b9dd535	fqs	2025-05-17 14:20:16.762323	2025-05-17 14:20:18.080713	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:20:16.762323	\N	f	\N
2b4e974f-bf22-c05b-3221-c845c43046c5	m	2025-05-19 07:19:51.152211	2025-05-19 09:49:56.466172	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 07:19:51.152211	\N	f	\N
fc6a1ee4-e9ec-4fba-2d4c-469c5f84d05b	ff	2025-05-26 09:37:44.697114	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:37:44.697114	\N	f	\N
24e14268-7e0d-4bcc-af31-f14ac8fc9764	fqefqsdf	2025-05-17 13:43:12.797667	2025-05-17 15:20:36.356123	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:43:12.797667	\N	f	97566e28-0882-09b1-8c93-642bcaea1bb4
65cc4fa1-dcbf-529b-f1b6-844004d3befe	jjjjj	2025-05-17 15:05:14.283216	2025-05-17 15:58:12.61842	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 15:05:14.283216	\N	f	\N
d5457cd9-f3b3-081f-d5b2-1ce6376eb045	asdfg	2025-05-17 15:31:08.145256	2025-05-17 15:58:12.634975	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 15:31:08.145256	\N	f	\N
ac7e5a15-bf4f-4676-fad2-f5e23b138349	[message supprimé]	2025-05-17 15:06:38.035393	2025-05-17 15:09:33.909275	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 15:06:38.035393	2025-05-17 15:07:17.445476	t	9b19e8e9-2e37-9278-534a-11b16568b543
00ae31ec-13b8-9a05-7a9a-37439243fbe3	qsdsqdsqd	2025-05-17 16:12:18.224309	2025-05-18 12:27:25.216459	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 16:12:18.224309	\N	f	\N
9fc7ba51-8d40-cfaa-a373-4f5e69ed590c	fsqf	2025-05-17 14:31:49.388455	2025-05-17 14:31:50.281964	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:31:49.388455	\N	f	\N
1a8742e5-2cfd-e484-d43a-3f0ab86eaa1f	mmmmmm	2025-05-18 13:35:17.29805	2025-05-18 15:26:40.66895	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:35:17.29805	\N	f	\N
2a7268fd-bdba-8311-b280-e62fcda679ad	kkjkj	2025-05-18 14:05:53.454008	2025-05-18 15:26:40.700344	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:05:53.454008	\N	f	\N
360683ba-6cff-8056-6cbe-623a619a8c9f	p	2025-05-18 14:05:54.335841	2025-05-18 15:26:40.70206	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:05:54.335841	\N	f	\N
7ed01712-8b22-315f-ba9d-83cd572d5cfd	azerty	2025-05-17 09:57:44.852234	2025-05-17 11:24:02.453703	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:57:44.852234	\N	f	\N
871986ab-bb25-e336-6e68-07524f79629d	Gay	2025-05-19 11:42:14.011618	2025-05-19 11:44:59.333447	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:42:14.011618	\N	f	\N
f68adf65-9b92-4490-7475-abe3e5e9f872	test	2025-05-18 14:37:30.696049	2025-05-18 15:26:40.724426	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:37:30.696049	\N	f	\N
dd0110a9-87a7-edf7-e860-ddb4171411d0	dgh	2025-05-17 14:20:18.583892	2025-05-17 14:20:18.868541	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:20:18.583892	\N	f	\N
650d4df6-b802-97aa-4617-09a79879f30d	est	2025-05-26 14:15:09.370645	\N	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 14:15:09.370645	\N	f	\N
ecc4d734-acfa-06f5-977f-d9d9389cc548	n	2025-05-19 11:53:53.463444	2025-05-19 12:08:57.759322	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:53:53.463444	\N	f	\N
0c69d78d-536b-59fb-952f-d886077e5ed6	test	2025-05-26 12:08:08.575914	2025-05-26 12:08:41.083135	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 12:08:08.575914	\N	f	\N
f0de7bc3-15b0-f4d0-70ed-28a91af7a924	d	2025-05-26 12:08:12.170792	2025-05-26 12:08:41.08372	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 12:08:12.170792	\N	f	\N
99981883-14a3-1568-030e-f82bd0147c48	oui	2025-05-20 10:12:59.734634	2025-05-22 09:53:12.038832	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-20 10:12:59.734634	\N	f	\N
b8e012ab-c59e-749e-cc23-3a75e9041fcd	yo	2025-05-20 10:09:29.306047	2025-05-20 12:33:27.453116	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 10:09:29.306047	\N	f	\N
93ca9e45-2bf4-21c8-6ee1-64c8f01acb01	a	2025-05-19 14:08:03.89937	2025-05-20 12:13:35.576097	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-19 14:08:03.89937	\N	f	\N
93713525-9d39-1b7a-4d3e-3f825b6a0c52		2025-05-20 12:09:41.870671	2025-05-22 09:53:12.040992	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	"[{\\"id\\":\\"49f56282-a0e6-5e66-1fcb-a06dcf322aa6\\"}]"	2025-05-20 12:09:41.870671	\N	f	\N
0f1f23f4-6a97-af15-c0a3-3f9a7c4c4d17	hello	2025-05-20 14:36:58.885508	2025-05-26 13:21:30.566631	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 14:36:58.885508	\N	f	\N
b2f3a1f5-c7c9-61d1-3ae1-5da4efc95fcb	hello	2025-05-20 14:36:51.704496	2025-05-26 13:21:30.570257	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 14:36:51.704496	\N	f	\N
eb5905ee-d387-b28a-3aaf-3b3a571d1846	roihgerhig	2025-05-22 09:48:06.626635	2025-05-22 09:53:15.868275	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-22 09:48:06.626635	\N	f	26837983-c01e-5ba0-209e-977278705c07
73f3774d-28d2-42a7-e717-549f31e76c8f	[message supprimé]	2025-05-17 13:30:47.920602	2025-05-17 13:52:23.314882	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:30:47.920602	2025-05-26 08:02:33.031179	t	\N
eea8ad7b-cddf-b994-b3e3-b0bad0a69b2a	[message supprimé]	2025-05-20 12:50:03.41295	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	"[{\\"id\\":\\"5d527ee9-3dc4-7aa6-4874-2eaed5c37d34\\"}]"	2025-05-20 12:50:03.41295	2025-05-26 08:02:33.031179	t	\N
823c63c8-da52-6c3c-c6bc-7a71c950a29b	LLL	2025-05-20 12:10:51.690234	2025-05-22 09:53:11.951085	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-20 12:10:51.690234	\N	f	\N
42eaa66d-9a0a-2735-7929-4c0483f4939d	[message supprimé]	2025-05-20 12:55:17.37773	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 12:55:17.37773	2025-05-26 08:02:33.031179	t	\N
7d836ce3-cd44-8a40-759c-f5183d247936	[message supprimé]	2025-05-19 14:48:13.814968	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 14:48:13.814968	2025-05-26 08:02:33.031179	t	\N
3d6c89a6-ac4b-16b3-16d8-969a9dd49e3d	[message supprimé]	2025-05-20 13:17:52.708674	2025-05-22 07:54:38.793291	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-20 13:17:52.708674	2025-05-26 08:02:33.031179	t	\N
f53c988f-0c93-c963-9b3a-b3b8a131838e	sfdfzf	2025-05-26 09:44:31.624555	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:44:31.624555	\N	f	\N
d105f2bc-cabe-b24c-0a22-41e4927df37f	Fitd	2025-05-17 14:22:15.289669	2025-05-17 14:22:17.651202	a5c1b268-937f-af11-4ca2-2c96634fbe2e	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	[]	2025-05-17 14:22:15.289669	\N	f	\N
2e0cf27d-933f-fa78-908e-5dcf8ede949b	Test 	2025-05-13 14:15:40.756968	2025-05-13 14:51:35.421618	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 14:15:40.756968	\N	f	\N
7a778ce7-721e-65c5-d36d-f1b4676f9b83	qs	2025-05-17 14:28:52.346535	2025-05-17 14:28:55.092099	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:28:52.346535	\N	f	\N
e6437ffc-6712-8b8e-01d0-9827bdf820b8	d	2025-05-26 12:08:18.474305	2025-05-26 12:08:41.084076	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 12:08:18.474305	\N	f	\N
3f3b61be-2471-e39a-bcb5-04b97d801bf5	wv	2025-05-17 14:28:51.978661	2025-05-17 14:28:52.336547	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:28:51.978661	\N	f	\N
8749a4e1-c1ff-bc42-d588-e655a9ed0c61	f	2025-05-13 14:22:09.42235	2025-05-13 14:25:14.789555	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:09.42235	\N	f	\N
3b0efd3e-99f9-1398-a55b-35a63f6c113f	test	2025-05-17 13:52:31.430306	2025-05-17 13:52:31.673626	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 13:52:31.430306	\N	f	82502c48-40b3-729f-bbae-0cb4e83fd111
79bf7709-e7ae-1e9a-afd7-882e04f256d2	kk	2025-05-19 11:54:21.030814	2025-05-19 12:08:57.765677	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:54:21.030814	\N	f	\N
f6a93d10-4021-d694-c110-2d0bb8f06720	test	2025-05-17 12:38:46.920017	2025-05-17 13:58:07.119134	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 12:38:46.920017	\N	f	\N
867d940b-6134-5154-2c82-d812f9e70b12	zefns	2025-05-17 13:42:05.827283	2025-05-18 12:27:25.192937	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:42:05.827283	\N	f	12357f94-3918-109a-2bbd-6830b1e0dad7
797abf3b-39f2-c96f-2917-50fb6ff369f4	hello	2025-05-20 14:37:13.117195	2025-05-26 13:21:30.566785	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 14:37:13.117195	\N	f	\N
8dc81401-ae0e-7914-7c6a-ab57bbea3258	fgd	2025-05-17 14:20:16.774908	2025-05-17 14:20:18.302032	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:20:16.774908	\N	f	\N
b576952c-210c-b3d5-bf75-396740db511c	sdqdsqdq	2025-05-17 16:04:11.582493	2025-05-18 12:27:25.210157	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 16:04:11.582493	\N	f	\N
62b70624-5bf4-9826-eef6-3c6f38cb7248	ds	2025-05-26 14:15:11.370273	\N	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 14:15:11.370273	\N	f	\N
25cac6ce-9bfb-58a2-0230-f2bb299840b9	est	2025-05-26 14:15:26.260642	\N	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 14:15:26.260642	\N	f	\N
9debb43a-3395-cd3f-f86f-f237bf73e151	test	2025-05-13 14:39:21.667728	2025-05-13 14:39:21.713914	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:39:21.667728	\N	f	\N
f07b7806-0dd9-4a3b-9201-dff9b5e7271c	j	2025-05-20 11:25:45.946934	2025-05-20 12:33:27.598804	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 11:25:45.946934	\N	f	\N
3297a4b8-5343-8561-3b1a-37f7bf1f968a	a	2025-05-19 12:09:44.110073	2025-05-19 13:25:05.157615	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:09:44.110073	\N	f	\N
332d797f-e231-77fb-7f40-1e553c79619a	aaaaa	2025-05-18 13:38:14.132036	2025-05-18 15:26:40.615877	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:38:14.132036	\N	f	\N
628bf56c-99db-6fc2-2d35-8f22e7da0bce	kkkkk	2025-05-18 14:07:46.44655	2025-05-18 15:26:40.702553	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:07:46.44655	\N	f	\N
de2804c9-85fd-121e-8ba6-048e2017f1df	sf	2025-05-17 14:31:50.817836	2025-05-17 14:31:52.438684	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:31:50.817836	\N	f	\N
cc7b5dd3-8400-4b0b-6eff-d7903fccb158	lklklklk	2025-05-18 14:07:16.190898	2025-05-18 15:26:40.703074	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:07:16.190898	\N	f	\N
74165c27-cfca-f80e-f5a1-a3e772fb9398	fq	2025-05-17 14:28:53.593536	2025-05-17 14:28:55.274937	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:28:53.593536	\N	f	\N
a3028ac8-ad23-aa95-95f2-71a366464275	aaa	2025-05-18 15:09:06.179169	2025-05-18 20:45:00.74655	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-18 15:09:06.179169	\N	f	\N
ceb10cbf-517e-5633-b29a-fb975aa681fe	[message supprimé]	2025-05-13 11:37:37.896215	2025-05-13 11:38:10.42742	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:37:37.896215	2025-05-19 07:34:59.606768	t	\N
8e3bc0be-2ad0-6518-2282-053329ae8fcc	[message supprimé]	2025-05-13 11:38:12.090209	2025-05-13 11:38:25.530189	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:38:12.090209	2025-05-19 07:34:59.606768	t	\N
f97712c6-a02a-cbf2-5dd2-6a021192b5c1	[message supprimé]	2025-05-13 14:16:31.294063	2025-05-13 14:25:14.824033	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:31.294063	2025-05-19 07:34:59.606768	t	\N
77c84029-cac4-93b8-bd8d-fd4ca3c27ce7	mm	2025-05-19 12:31:57.559074	2025-05-19 13:25:05.407822	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:31:57.559074	\N	f	\N
8e330760-9265-9dd3-ebc5-a62b1918c250	[message supprimé]	2025-05-13 11:55:50.441257	2025-05-13 11:58:08.128372	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:55:50.441257	2025-05-19 07:34:59.606768	t	\N
a2354d92-34c9-4d95-aed3-519fee8ef61d	[message supprimé]	2025-05-13 12:53:11.67602	2025-05-13 13:22:23.614998	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:11.67602	2025-05-19 07:34:59.606768	t	\N
58066262-38e9-e31c-5b60-ce51d1ad6506	Test	2025-05-19 11:47:37.681625	2025-05-19 12:06:39.20415	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-19 11:47:37.681625	\N	f	\N
f455803b-836c-69e5-40e6-ddb6bba73e3c		2025-05-20 11:25:30.303503	2025-05-20 12:33:27.61671	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"d46a8bd2-4951-8b8a-f6a8-84c8669bf2bb\\"}]"	2025-05-20 11:25:30.303503	\N	f	\N
6df1cc33-887b-0171-0d2d-c80a77a40ca7	ll	2025-05-19 13:30:33.601809	2025-05-19 13:34:33.457943	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-19 13:30:33.601809	\N	f	\N
7dc90178-bd92-4632-d1ae-7b1e85a5d5dd	mm	2025-05-19 13:38:53.966326	2025-05-20 12:13:35.558968	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-19 13:38:53.966326	\N	f	\N
4293fb10-13f1-740e-b85a-deb637b778d4		2025-05-20 11:47:47.412605	2025-05-20 12:33:27.60077	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"5d4be682-4105-0d0b-7b2e-859e61e1be9d\\"}]"	2025-05-20 11:47:47.412605	\N	f	\N
79712134-c960-1e3d-2824-b5fe8f3b7ff3	[message supprimé]	2025-05-13 14:14:51.012639	2025-05-13 14:39:59.709588	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:14:51.012639	2025-05-26 08:02:33.031179	t	\N
0155f756-87ef-cf1d-5439-67e98a8450b3		2025-05-20 11:56:03.170091	2025-05-22 09:53:12.040251	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	"[{\\"id\\":\\"f7aa8292-cee8-3330-80c8-3b17a035812a\\"}]"	2025-05-20 11:56:03.170091	\N	f	\N
f3934cb7-2137-b706-3b3c-be810627e0b6	hello	2025-05-20 10:09:56.474377	2025-05-22 09:53:12.004351	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-20 10:09:56.474377	\N	f	\N
079337fb-c661-318b-0a4d-c8036981ca8f	[message supprimé]	2025-05-17 13:32:02.070122	2025-05-17 13:52:23.324658	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:32:02.070122	2025-05-26 08:02:33.031179	t	\N
07992062-3c11-bf45-2931-66a8bdc7619e	[message supprimé]	2025-05-17 13:45:29.233228	2025-05-17 16:19:08.434055	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:45:29.233228	2025-05-26 08:02:33.031179	t	3e3a3dfe-b6e4-81ac-8df1-f4fb1c86a2e1
64482483-9e23-95f2-dbb2-1585ee7f5b82	[message supprimé]	2025-05-17 10:00:41.44637	2025-05-17 10:39:05.049714	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:00:41.44637	2025-05-26 08:02:33.031179	t	\N
f357bd7d-75e4-ff08-d07f-38894c706cac	test	2025-05-13 14:08:29.883983	2025-05-13 14:09:28.180855	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:08:29.883983	\N	f	\N
5f65c13d-1fa4-dbae-5230-6234a94661ab	ii	2025-05-26 09:44:50.190067	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:44:50.190067	\N	f	\N
13adfdb1-6964-2555-8f04-016ef833f64a	sdf	2025-05-13 14:40:25.632746	2025-05-13 14:41:33.939583	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:40:25.632746	\N	f	\N
97566e28-0882-09b1-8c93-642bcaea1bb4	sdf	2025-05-13 14:40:42.273884	2025-05-13 14:41:33.940497	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:40:42.273884	\N	f	\N
7b7b478e-1496-2068-6712-f48c8500ffce	qf	2025-05-13 14:22:10.456154	2025-05-13 14:25:14.791291	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:10.456154	\N	f	\N
6fa3bb87-bd24-8f8b-bf56-edfea30d17cd	hfh	2025-05-17 14:31:52.465481	2025-05-17 14:31:53.141808	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:31:52.465481	\N	f	\N
e3a00106-25b0-0d85-9b56-08e22f31c524	m	2025-05-19 13:32:02.375721	2025-05-19 13:35:34.901169	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 13:32:02.375721	\N	f	\N
a40cbbf2-3404-3c62-3c2b-552a7088fe79	tedst	2025-05-17 14:37:14.51096	2025-05-17 14:37:20.528179	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:37:14.51096	\N	f	\N
5bd5f1a8-4885-c2af-3545-5e8d5611654c	jhh	2025-05-26 14:23:32.860396	2025-05-26 14:23:49.386824	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 14:23:32.860396	\N	f	\N
fb02d7f3-7fab-f655-e082-831cd895dc8c	bite	2025-05-18 13:41:09.874097	2025-05-18 15:26:40.674097	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 13:41:09.874097	\N	f	\N
79d9dec6-78da-1d99-69ea-1ae6fcccade4	lll	2025-05-18 14:13:12.514093	2025-05-18 15:26:40.702388	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-18 14:13:12.514093	\N	f	\N
f5190ff1-2372-2fc5-5a14-466b662631c5	aaaa	2025-05-18 15:09:13.348501	2025-05-18 20:45:00.746009	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-18 15:09:13.348501	\N	f	\N
62591d01-177c-d1aa-0710-219e8ad7c718	g	2025-05-17 14:20:17.572576	2025-05-17 14:20:18.468772	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:20:17.572576	\N	f	\N
59c60a2a-0b1c-c0e2-97f8-ad7fb94744b1	Bfkxk	2025-05-17 15:07:26.381134	2025-05-17 15:09:33.913803	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 15:07:26.381134	\N	f	22abc797-1075-5a68-0333-c980e7f324f4
bb6e5bca-9384-215c-bc9a-8f25300c0ac1	nn	2025-05-19 11:54:34.916392	2025-05-19 12:08:57.757846	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:54:34.916392	\N	f	\N
fbe38b9e-b5a2-76c1-4e56-86521b05cc19	kk	2025-05-19 11:54:33.022486	2025-05-19 12:08:57.781571	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 11:54:33.022486	\N	f	\N
340e65de-9f34-aa8d-4ce1-aa1da4b29d18	opjpj	2025-05-19 13:41:20.607409	2025-05-20 12:13:35.574228	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-19 13:41:20.607409	\N	f	\N
a3e9cc03-9de8-6f37-8e75-88ea2b783645	fqdfq	2025-05-17 14:27:04.786535	2025-05-17 14:27:05.134755	ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 14:27:04.786535	\N	f	\N
ee5dcc27-9ae6-2a0b-79ce-80fd342f7d34	b	2025-05-19 12:09:45.975277	2025-05-19 13:25:05.385885	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:09:45.975277	\N	f	\N
8cdfc076-f965-0900-487e-113c901a1e6d	kk	2025-05-19 12:32:02.475319	2025-05-19 13:25:05.406068	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 12:32:02.475319	\N	f	\N
4930ff47-d650-3429-a8a8-68b4de3aaa30	qsfqs	2025-05-17 12:41:13.919765	2025-05-17 13:58:07.119184	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 12:41:13.919765	\N	f	\N
12357f94-3918-109a-2bbd-6830b1e0dad7	sdfsdf	2025-05-17 13:35:21.426725	2025-05-17 13:58:07.119059	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:35:21.426725	\N	f	\N
c9db0266-0a80-7eb9-d101-8aa58e410362	jjj	2025-05-17 15:05:24.105022	2025-05-17 15:58:12.620661	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 15:05:24.105022	\N	f	\N
2c28c4e3-a35f-046d-24a8-5b194b378a25	lkhjklh	2025-05-17 15:53:07.99638	2025-05-17 15:58:12.636364	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 15:53:07.99638	\N	f	\N
b90c62e1-d76c-e7b6-1da6-3a10017a0edd	hhh	2025-05-17 13:35:00.570718	2025-05-17 13:58:07.186185	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 13:35:00.570718	\N	f	\N
8b63b734-df2b-06cf-2803-4efecbdbf6a7	couimle	2025-05-17 16:06:31.06924	2025-05-18 12:27:25.212972	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-17 16:06:31.06924	\N	f	\N
d53b395f-8be9-c6dd-62a0-5f9dd3c9266b	mlmll	2025-05-17 16:07:27.737133	2025-05-18 12:45:26.411535	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-17 16:07:27.737133	\N	f	\N
60f15e4c-2a7b-d49d-660e-9c409d0f65b7	oui	2025-05-20 12:54:46.484473	2025-05-26 13:21:30.497943	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 12:54:46.484473	\N	f	\N
26837983-c01e-5ba0-209e-977278705c07	KKKK	2025-05-20 12:10:21.152239	2025-05-22 09:53:11.950214	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-20 12:10:21.152239	\N	f	\N
8ee4d736-5621-9039-169f-7fd1489edc14	oui	2025-05-20 13:20:45.885021	2025-05-26 13:21:30.498382	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 13:20:45.885021	\N	f	\N
2794ab92-8adc-6052-ea46-9025501af4f8	a	2025-05-19 09:20:15.702015	2025-05-19 09:49:56.473924	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-19 09:20:15.702015	\N	f	\N
886d545d-2d21-18be-8436-b827924ec661		2025-05-20 11:27:16.296629	2025-05-20 12:33:27.604259	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"fb71c3fa-e1da-2d84-d220-19ec10ef5b5c\\"}]"	2025-05-20 11:27:16.296629	\N	f	\N
1151e794-6979-926b-1e82-f35e0dee3428		2025-05-20 12:13:20.387065	2025-05-20 12:33:27.612349	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"7c8b26fc-42a2-60b1-52f7-ded15916b9a3\\"}]"	2025-05-20 12:13:20.387065	\N	f	\N
5e02a657-7b6b-8c7a-2c28-17bacf6a05e4		2025-05-19 14:49:35.349443	2025-05-20 09:05:47.346861	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"2aad3b4e-4ea5-1346-6415-d33020ef7dc7\\"}]"	2025-05-19 14:49:35.349443	\N	f	\N
d7e7e5c0-202d-99c5-e82d-385f6c836f89	Test	2025-05-19 11:48:31.58977	2025-05-20 09:05:47.351997	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-19 11:48:31.58977	\N	f	\N
eaa4b9d4-941b-c626-b4c7-78bd74ee8b02	hello	2025-05-20 14:37:31.411347	2025-05-26 13:21:30.568581	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-20 14:37:31.411347	\N	f	\N
2a00bbe4-eee2-9b6c-9126-abd7ea4f74c5	caca rpout	2025-05-26 12:08:49.02128	2025-05-26 12:09:19.431505	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 12:08:49.02128	\N	f	\N
0c265379-5bce-e7bd-ade9-f7b55f252f0b	vre	2025-05-20 10:10:07.151098	2025-05-22 09:53:12.038171	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-20 10:10:07.151098	\N	f	\N
c16638e5-c7d6-676b-89aa-649b3f19a681		2025-05-20 11:48:47.541696	2025-05-22 09:53:12.038911	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	"[{\\"id\\":\\"541360e0-a8ff-4cdb-5ca9-a25794f02d6b\\"}]"	2025-05-20 11:48:47.541696	\N	f	\N
1b565044-fb16-eb4c-7824-8b98ea38a223	[message supprimé]	2025-05-17 10:01:20.025285	2025-05-17 10:39:05.059049	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:01:20.025285	2025-05-26 08:02:33.031179	t	\N
18414e04-ef10-756b-1d99-af2fd124d117	[message supprimé]	2025-05-17 10:01:44.256261	2025-05-17 10:39:05.06253	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:01:44.256261	2025-05-26 08:02:33.031179	t	\N
2c3a300d-3167-679a-f1bb-bef3e00e6606	[message supprimé]	2025-05-19 14:29:36.718443	2025-05-19 14:45:46.167522	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-19 14:29:36.718443	2025-05-26 08:02:33.031179	t	\N
8175f25c-d4a1-4a4c-b458-1c8b6be7d361	[message supprimé]	2025-05-20 13:15:45.04514	2025-05-22 07:54:38.79117	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-20 13:15:45.04514	2025-05-26 08:02:33.031179	t	\N
22b0ac22-a072-8b92-45a8-f5dc0b0168f2	[message supprimé]	2025-05-20 14:41:01.456344	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 14:41:01.456344	2025-05-26 08:02:33.031179	t	\N
0d3ce314-1050-b948-4f03-3aa3045a18bc	dgdfgdgd	2025-05-26 09:49:31.58461	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:49:31.58461	\N	f	\N
f9bdd69f-ef7b-070b-f235-6f3bd777bb38	fdsfsdf	2025-05-26 12:14:47.717365	2025-05-26 12:15:07.473421	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 12:14:47.717365	\N	f	\N
c9caf665-acfc-7b1d-33a2-7e5a829c3791	test	2025-05-26 14:49:08.628135	\N	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-26 14:49:08.628135	\N	f	\N
bd2dda62-b872-1ed7-fdd0-efe4d470e6f2	fghfghfghgf	2025-05-26 09:52:00.0337	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:52:00.0337	\N	f	\N
fc82fd9e-82e1-280b-1e5f-92f89295506f	f	2025-05-26 12:14:58.555887	2025-05-26 12:15:07.473421	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 12:14:58.555887	\N	f	\N
80c33801-736f-bd53-0516-056faabf0735	fsfsdfdsdsfsd	2025-05-26 09:54:25.436158	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:54:25.436158	\N	f	\N
396fa9d7-0501-6e66-a902-9604ec0708fd	KJKJPJ	2025-05-26 12:16:00.133041	2025-05-26 12:16:20.887448	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 12:16:00.133041	\N	f	\N
7bf04be8-ae90-6a6d-5308-79f30a112a01	sf	2025-05-26 09:54:28.101357	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:54:28.101357	\N	f	\N
bccb1935-a5d2-a86f-f26d-566c9c8bff4d	lllllllllllllllllll	2025-05-26 12:22:52.219544	2025-05-26 12:23:06.887543	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 12:22:52.219544	\N	f	\N
0a371a79-598a-8d4b-2031-faf9b4ff6ae5	amamamam	2025-05-22 09:50:33.466302	2025-05-22 09:53:14.264773	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-22 09:50:33.466302	\N	f	\N
bd2a217e-caac-4d11-d860-d4ab389e7eb9	[message supprimé]	2025-05-13 07:52:26.032021	2025-05-13 08:09:29.479214	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 07:52:26.032021	2025-05-26 08:02:33.031179	t	\N
a263c8da-7f56-78b9-58fd-7a7493d5f9f6	[message supprimé]	2025-05-13 14:09:59.20211	2025-05-13 14:13:24.521525	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:09:59.20211	2025-05-26 08:02:33.031179	t	\N
62b57b9a-ceee-e47f-cf09-0d6a674af885	[message supprimé]	2025-05-04 15:46:53.1236	2025-05-04 15:52:56.810593	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:46:53.1236	2025-05-26 08:02:33.031179	t	\N
09968db6-cc8a-bde9-fa58-0134154f0ded	[message supprimé]	2025-05-17 12:44:05.900319	2025-05-17 13:08:04.196823	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 12:44:05.900319	2025-05-26 08:02:33.031179	t	\N
f4f5d882-07f1-d919-f54d-4868e4b1724c	[message supprimé]	2025-05-17 13:44:46.018531	2025-05-17 16:19:08.436306	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:44:46.018531	2025-05-26 08:02:33.031179	t	\N
ec3422a5-66e2-5d5c-0d56-85e340584c5d	[message supprimé]	2025-05-19 12:13:04.652363	2025-05-19 12:42:59.864052	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 12:13:04.652363	2025-05-26 08:02:33.031179	t	\N
b22f23a2-1d28-70f4-4b84-6213c40e4329	[message supprimé]	2025-05-19 14:31:34.281651	2025-05-19 14:45:46.16791	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-19 14:31:34.281651	2025-05-26 08:02:33.031179	t	\N
e5f5455e-80f6-fd22-0db7-63c417e27e4d	[message supprimé]	2025-05-20 10:11:52.601814	2025-05-20 11:35:29.461061	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-20 10:11:52.601814	2025-05-26 08:02:33.031179	t	\N
68bedd8c-fed3-0a11-0382-fc0a4fbaa17e	[message supprimé]	2025-05-17 11:13:54.09417	2025-05-17 11:15:41.00355	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:54.09417	2025-05-26 08:02:33.031179	t	\N
15d8138f-017c-7e5f-a484-2d529bd4a12d	[message supprimé]	2025-05-17 11:13:58.633537	2025-05-17 11:15:41.028216	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:58.633537	2025-05-26 08:02:33.031179	t	\N
cdbf7852-3329-3965-e39a-5ffd2817e28c	[message supprimé]	2025-05-12 14:20:32.090631	2025-05-12 14:32:20.368276	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-12 14:20:32.090631	2025-05-26 08:02:33.031179	t	\N
ab5ea085-9e9e-5455-ed43-ce4bdd8f0a7d	[message supprimé]	2025-05-13 08:32:29.828948	2025-05-13 08:33:07.265113	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:29.828948	2025-05-26 08:02:33.031179	t	\N
b0882a2f-4628-ac6f-a27f-4d2caff60500	[message supprimé]	2025-05-13 09:57:26.422443	2025-05-13 11:32:12.021055	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 09:57:26.422443	2025-05-26 08:02:33.031179	t	\N
6b846588-edf3-b7fa-8361-fd7308fc353b	[message supprimé]	2025-05-13 11:04:46.421803	2025-05-13 11:04:55.620709	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:04:46.421803	2025-05-26 08:02:33.031179	t	\N
762acf4a-8823-7f20-f05f-1f19a87c19e8	[message supprimé]	2025-05-13 11:32:48.68848	2025-05-13 11:33:19.484816	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:32:48.68848	2025-05-26 08:02:33.031179	t	\N
fbd9630b-a9ec-f98f-f5cc-0c5f11514191	[message supprimé]	2025-05-04 13:53:11.886847	2025-05-04 14:44:41.317333	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 13:53:11.886847	2025-05-26 08:02:33.031179	t	\N
877997c5-35d5-8dde-c7c4-da29a9dfd6a8	[message supprimé]	2025-05-04 15:10:03.906143	2025-05-04 15:15:46.936315	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:10:03.906143	2025-05-26 08:02:33.031179	t	\N
8d3a8bb5-a4f8-608b-61e9-6551ef4cc191	[message supprimé]	2025-05-13 12:41:28.820796	2025-05-13 13:22:23.578283	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:41:28.820796	2025-05-26 08:02:33.031179	t	\N
ce32cc3a-19ce-a417-24a0-59da6363aac0	[message supprimé]	2025-05-19 12:15:04.514238	2025-05-19 12:42:59.866294	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 12:15:04.514238	2025-05-26 08:02:33.031179	t	\N
5e47f0b7-cb07-961e-e4db-6a60642b9bb8	[message supprimé]	2025-05-19 14:56:08.850857	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 14:56:08.850857	2025-05-26 08:02:33.031179	t	\N
e22a1d3a-391b-0af9-ad9a-0c0589c25775	[message supprimé]	2025-05-17 13:45:25.163298	2025-05-17 16:19:08.406568	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:45:25.163298	2025-05-26 08:02:33.031179	t	f23f52dd-ffbb-d8e8-d524-32481990f001
6fa40a3f-7648-7884-2b81-6a4bef9c2fb6	[message supprimé]	2025-05-13 08:32:42.151903	2025-05-13 08:33:10.180224	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:42.151903	2025-05-26 08:02:33.031179	t	\N
684efacd-7fdc-5a78-805c-b62ce1cc0579	[message supprimé]	2025-05-13 08:32:42.869809	2025-05-13 08:33:10.180347	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:42.869809	2025-05-26 08:02:33.031179	t	\N
acfc972a-9306-0606-7ba7-c5a979fe36e8	[message supprimé]	2025-05-13 08:32:43.008792	2025-05-13 08:33:10.182792	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:43.008792	2025-05-26 08:02:33.031179	t	\N
1a20fb0d-5f57-c35d-119d-0d8f55025477	[message supprimé]	2025-05-13 08:32:43.16576	2025-05-13 08:33:10.182436	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:43.16576	2025-05-26 08:02:33.031179	t	\N
8483d290-386d-ac07-7e1b-5e34c2e29eee	[message supprimé]	2025-05-13 09:40:07.14709	2025-05-13 09:40:44.843023	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:40:07.14709	2025-05-26 08:02:33.031179	t	\N
9464222e-78e5-cd21-7a65-0222484e15b0	[message supprimé]	2025-05-13 11:04:58.112477	2025-05-13 11:32:12.02353	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:04:58.112477	2025-05-26 08:02:33.031179	t	\N
00410183-ef20-9e5d-e693-b7834079ad22	[message supprimé]	2025-05-13 11:05:04.635208	2025-05-13 11:32:12.026123	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:05:04.635208	2025-05-26 08:02:33.031179	t	\N
e4fac9ea-498a-d8a1-959c-042685d83fbe	[message supprimé]	2025-05-13 11:24:08.851126	2025-05-13 11:33:19.479903	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	"[{\\"id\\":\\"52680330-d909-a40c-34be-777b7c4b125e\\"}]"	2025-05-13 11:24:08.851126	2025-05-26 08:02:33.031179	t	\N
1bce0cfa-9ce2-12d9-3abf-c692a26d3613	[message supprimé]	2025-04-29 13:54:49.445603	2025-04-30 12:08:40.828436	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.445603	2025-05-26 08:02:33.031179	t	\N
6d4f8a8a-6f46-0bd2-dda5-dfe03a46b92c	[message supprimé]	2025-04-29 13:54:49.787921	2025-04-30 12:08:40.828652	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.787921	2025-05-26 08:02:33.031179	t	\N
9f180bbc-f6b6-44ec-2ec4-c28824fbf6d7	[message supprimé]	2025-04-29 13:54:49.986266	2025-04-30 12:08:40.827612	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.986266	2025-05-26 08:02:33.031179	t	\N
bf55643a-7c7c-45ed-b9aa-d132868f7c92	[message supprimé]	2025-05-13 08:32:46.20053	2025-05-13 08:33:10.187049	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:46.20053	2025-05-26 08:02:33.031179	t	\N
3a22f827-c382-b3d8-db12-8a3304dd34ac	[message supprimé]	2025-05-13 08:32:46.306143	2025-05-13 08:33:10.189104	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:46.306143	2025-05-26 08:02:33.031179	t	\N
9bc19731-e88e-acd4-ff9f-686495279e25	[message supprimé]	2025-05-13 07:47:06.942032	2025-05-13 08:09:29.475501	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 07:47:06.942032	2025-05-26 08:02:33.031179	t	\N
a9ba56e1-7be5-42a3-024e-27bfeeb3949b	[message supprimé]	2025-04-29 13:54:52.201389	2025-04-30 12:08:40.920441	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:52.201389	2025-05-26 08:02:33.031179	t	\N
9cf395dd-b9a3-f28c-1649-0b5ffa3e52f9	[message supprimé]	2025-04-29 13:54:52.456653	2025-04-30 12:08:40.920227	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:52.456653	2025-05-26 08:02:33.031179	t	\N
851d1225-24f5-8a70-699d-7161376f969b	[message supprimé]	2025-04-29 13:54:52.961198	2025-04-30 12:08:40.928536	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:52.961198	2025-05-26 08:02:33.031179	t	\N
19160721-1331-b2d4-a03b-3faa3457e07a	[message supprimé]	2025-05-17 11:13:49.695824	2025-05-17 11:15:40.998975	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:49.695824	2025-05-26 08:02:33.031179	t	\N
b99625fa-8d58-17a5-d5d5-93eb9cb8a15e	[message supprimé]	2025-05-17 12:46:41.111074	2025-05-17 12:47:55.567338	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 12:46:41.111074	2025-05-26 08:02:33.031179	t	\N
61b01595-19f3-b0ab-1925-13e8f609c583	[message supprimé]	2025-05-13 11:05:31.000376	2025-05-13 11:06:27.986157	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:05:31.000376	2025-05-26 08:02:33.031179	t	\N
495e2861-c304-4f14-1d67-1aa00e8d8d67	[message supprimé]	2025-04-29 13:54:50.692903	2025-04-30 12:08:40.918772	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:50.692903	2025-05-26 08:02:33.031179	t	\N
8355cc44-07e1-d2c8-28fa-045d7f90466d	[message supprimé]	2025-05-04 14:40:57.016919	2025-05-04 14:45:14.6327	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-04 14:40:57.016919	2025-05-26 08:02:33.031179	t	\N
597117d7-2a20-6a79-9230-9a2d935bfe9a	[message supprimé]	2025-05-13 09:41:36.837569	2025-05-13 09:45:29.867223	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:41:36.837569	2025-05-26 08:02:33.031179	t	\N
2371ca20-3929-28f1-a553-cc423c2a2bf9	[message supprimé]	2025-05-13 07:50:08.364321	2025-05-13 09:17:33.851777	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	"[{\\"id\\":\\"da1f8bd2-c427-0539-ce31-0b50cbedb844\\"}]"	2025-05-13 07:50:08.364321	2025-05-26 08:02:33.031179	t	\N
89b0c9e8-6449-f6ff-a71e-5f1147a12eb6	[message supprimé]	2025-05-13 12:53:22.926805	2025-05-13 13:22:23.633293	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:22.926805	2025-05-26 08:02:33.031179	t	\N
d2db167b-7965-badf-941a-8d61d2e0befd	[message supprimé]	2025-05-13 12:53:29.430702	2025-05-13 13:22:23.463415	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:29.430702	2025-05-26 08:02:33.031179	t	\N
5a855a61-6926-a183-cb48-ef2d05643937	[message supprimé]	2025-05-17 11:13:53.602631	2025-05-17 11:15:41.001364	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:53.602631	2025-05-26 08:02:33.031179	t	\N
ef8d5ecd-8e33-02fa-0792-331e23f5e11f	[message supprimé]	2025-05-13 12:08:44.642012	2025-05-13 12:08:47.169747	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	"[{\\"id\\":\\"c41cd366-20bb-8b99-7f82-db394871e4f3\\"}]"	2025-05-13 12:08:44.642012	2025-05-26 08:02:33.031179	t	\N
198b5ca1-d354-4f55-643d-5b7ac04b158c	[message supprimé]	2025-05-04 15:38:49.51123	2025-05-04 15:43:42.599309	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:38:49.51123	2025-05-26 08:02:33.031179	t	\N
de2cf76e-70c9-b0dc-a802-a19ee76e0ad7	[message supprimé]	2025-05-13 09:44:21.738364	2025-05-13 09:45:29.872555	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:44:21.738364	2025-05-26 08:02:33.031179	t	\N
089d0cf9-cf95-7358-7a46-11402b3f495f	[message supprimé]	2025-05-13 12:53:31.10311	2025-05-13 13:22:23.478406	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:31.10311	2025-05-26 08:02:33.031179	t	\N
8b684bcc-5030-b531-0a7b-5e7bc299190a	[message supprimé]	2025-04-29 13:54:53.476009	2025-04-30 12:08:40.931093	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:53.476009	2025-05-26 08:02:33.031179	t	\N
d04890bd-6041-2fa3-3c75-383496297a2a	[message supprimé]	2025-04-29 13:54:54.112666	2025-04-30 12:08:40.931309	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:54.112666	2025-05-26 08:02:33.031179	t	\N
19efc36c-adb0-3ed9-18bb-4939ae18f82e	[message supprimé]	2025-04-29 13:54:54.354456	2025-04-30 12:08:40.930651	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:54.354456	2025-05-26 08:02:33.031179	t	\N
0c71eb9b-56aa-a066-c88d-948d8a0ff392	[message supprimé]	2025-04-29 13:54:55.304203	2025-04-30 12:08:40.932397	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:55.304203	2025-05-26 08:02:33.031179	t	\N
ac4c8063-a06a-7006-643a-2e3c20a36577	[message supprimé]	2025-04-29 13:54:55.737512	2025-04-30 12:08:40.931724	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:55.737512	2025-05-26 08:02:33.031179	t	\N
234c9dd6-04e3-70ee-429c-c087d0dbe45e	[message supprimé]	2025-04-29 13:54:56.303692	2025-04-30 12:08:40.931668	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:56.303692	2025-05-26 08:02:33.031179	t	\N
aed029e9-17ab-4980-6ed6-a82266445ca2	[message supprimé]	2025-04-29 13:54:56.855581	2025-04-30 12:08:40.932344	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:56.855581	2025-05-26 08:02:33.031179	t	\N
3e3a3dfe-b6e4-81ac-8df1-f4fb1c86a2e1	[message supprimé]	2025-05-17 13:41:31.227008	2025-05-17 13:43:54.61969	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 13:41:31.227008	2025-05-26 08:02:33.031179	t	\N
4aa6b732-af65-6356-d5bd-e3a12738395f	[message supprimé]	2025-05-19 12:15:19.972223	2025-05-19 12:42:59.869277	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 12:15:19.972223	2025-05-26 08:02:33.031179	t	\N
0a299d0a-8145-c005-bf22-79e169c89e40	[message supprimé]	2025-05-19 12:15:32.281753	2025-05-19 12:42:59.865641	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 12:15:32.281753	2025-05-26 08:02:33.031179	t	\N
b1e07ab5-2518-ba05-3c2c-43dabfc8c89a	[message supprimé]	2025-05-19 12:15:32.524296	2025-05-19 12:42:59.867661	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 12:15:32.524296	2025-05-26 08:02:33.031179	t	\N
bd0ae14a-def5-a571-a68c-e546b5324f56	[message supprimé]	2025-05-19 14:45:45.386531	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 14:45:45.386531	2025-05-26 08:02:33.031179	t	\N
fc89eff7-cb32-c146-835b-5d22322d1fc2	[message supprimé]	2025-04-29 13:54:57.262422	2025-04-30 12:08:40.931767	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:57.262422	2025-05-26 08:02:33.031179	t	\N
3a44160c-1b24-a096-c3e7-071033bf0015	[message supprimé]	2025-05-04 15:44:32.164948	2025-05-04 15:44:39.287517	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:44:32.164948	2025-05-26 08:02:33.031179	t	\N
d53515ed-73b5-ffd6-e488-f674ea7c07b8	[message supprimé]	2025-05-17 11:13:52.525712	2025-05-17 11:15:41.003014	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 11:13:52.525712	2025-05-26 08:02:33.031179	t	\N
fc127be4-2a79-6858-1096-df939c55fb53	[message supprimé]	2025-05-13 12:54:30.36218	2025-05-13 13:22:23.482041	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:54:30.36218	2025-05-26 08:02:33.031179	t	\N
1226ea47-34a6-f1f4-7b37-644debb5998e	[message supprimé]	2025-05-17 13:41:37.453117	2025-05-17 13:43:54.627508	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 13:41:37.453117	2025-05-26 08:02:33.031179	t	0ec44c11-483e-1755-c42d-3fec6d26e790
7ee22a40-3ecd-99fd-0ba7-e8b1a88fd76a	[message supprimé]	2025-05-17 10:16:40.397183	2025-05-17 10:39:05.036995	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:16:40.397183	2025-05-26 08:02:33.031179	t	\N
4eb2b269-0545-7d8a-6fec-241604c16f90	[message supprimé]	2025-05-19 12:15:33.199349	2025-05-19 12:42:59.869013	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 12:15:33.199349	2025-05-26 08:02:33.031179	t	\N
3c6d0bb5-e461-ad41-5463-644c4c20a454	[message supprimé]	2025-05-19 14:47:48.629759	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 14:47:48.629759	2025-05-26 08:02:33.031179	t	\N
8862b9e3-fc6e-bc2f-8d9d-c29593f2954c	[message supprimé]	2025-05-19 12:21:24.253759	2025-05-19 12:42:59.869667	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 12:21:24.253759	2025-05-26 08:02:33.031179	t	\N
ad1fc9b4-6ef7-33fe-582a-5bc3dd6a479e	[message supprimé]	2025-05-19 14:47:58.588058	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 14:47:58.588058	2025-05-26 08:02:33.031179	t	\N
d1cc8a0d-2f9b-fb74-6928-c027ab428689	[message supprimé]	2025-05-20 12:49:38.357823	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	"[{\\"id\\":\\"e6649839-2a53-b9fe-19db-91260a01e454\\"}]"	2025-05-20 12:49:38.357823	2025-05-26 08:02:33.031179	t	\N
90fbf4c2-48df-e54e-fad4-98d555d00174	[message supprimé]	2025-05-19 14:48:07.733144	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 14:48:07.733144	2025-05-26 08:02:33.031179	t	\N
49f2dab8-9bf8-6fa2-cf42-279956b16afe	[message supprimé]	2025-05-20 12:55:10.792321	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 12:55:10.792321	2025-05-26 08:02:33.031179	t	\N
045bb1aa-9592-f18e-501e-4f2d4d297569	[message supprimé]	2025-05-20 14:40:33.93881	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 14:40:33.93881	2025-05-26 08:02:33.031179	t	\N
94bb6dff-a129-29af-eeac-e43be5e600dc	[message supprimé]	2025-05-20 14:44:16.529788	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 14:44:16.529788	2025-05-26 08:02:33.031179	t	\N
3d5a21cf-e488-6e1c-9202-82820374c474	[message supprimé]	2025-05-20 14:40:59.529887	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 14:40:59.529887	2025-05-26 08:02:33.031179	t	\N
3d4fb8a3-9dab-02e1-90f0-5904d0a3e038	[message supprimé]	2025-05-19 12:07:23.771547	2025-05-19 12:42:59.854685	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 12:07:23.771547	2025-05-26 08:02:33.031179	t	\N
6bab5f8d-c5c6-39b5-c016-520c7c1774bd	[message supprimé]	2025-05-20 14:44:28.396854	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 14:44:28.396854	2025-05-26 08:02:33.031179	t	\N
4b8d6b94-ab24-026c-e797-1af8a8d9dd6c	[message supprimé]	2025-05-20 14:51:01.271603	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 14:51:01.271603	2025-05-26 08:02:33.031179	t	\N
2797380d-af0a-1559-6aba-182b7d528399	[message supprimé]	2025-05-20 13:16:40.232602	2025-05-22 07:54:38.791652	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-20 13:16:40.232602	2025-05-26 08:02:33.031179	t	\N
5c2ff179-58c7-fe30-bc66-12a28b6132b3	[message supprimé]	2025-05-17 10:00:54.308311	2025-05-17 10:39:05.049814	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:00:54.308311	2025-05-26 08:02:33.031179	t	\N
3b0698df-3c60-36d3-09fc-61373312b172	[message supprimé]	2025-05-17 10:01:04.265616	2025-05-17 10:39:05.060286	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:01:04.265616	2025-05-26 08:02:33.031179	t	\N
0ac89edd-bd4d-0e00-19b1-b02590d1dce2	[message supprimé]	2025-05-17 10:01:10.813674	2025-05-17 10:39:05.041794	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:01:10.813674	2025-05-26 08:02:33.031179	t	\N
fece9d11-3866-21d6-0048-584bac77891b	[message supprimé]	2025-05-17 13:44:40.104917	2025-05-17 16:19:08.419312	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:44:40.104917	2025-05-26 08:02:33.031179	t	\N
46446d10-75e2-d5cc-12d0-05a04dac76cb	[message supprimé]	2025-05-20 12:12:12.856272	2025-05-20 12:27:06.214634	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	"[{\\"id\\":\\"de98a8e8-5b2a-3702-233b-b0a23c121f2f\\"}]"	2025-05-20 12:12:12.856272	2025-05-26 08:02:33.031179	t	\N
99d4011b-bbcc-9c3d-ddd7-0a69f8012764	[message supprimé]	2025-05-20 14:41:00.860361	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 14:41:00.860361	2025-05-26 08:02:33.031179	t	\N
4c4aa6e6-db22-38dc-c6d6-9b6f0a7f285c	[message supprimé]	2025-05-19 14:29:03.533909	2025-05-19 14:45:46.161378	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-19 14:29:03.533909	2025-05-26 08:02:33.031179	t	8862b9e3-fc6e-bc2f-8d9d-c29593f2954c
fe963918-d018-dc97-7db2-f592798480da	[message supprimé]	2025-05-20 14:46:25.007415	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 14:46:25.007415	2025-05-26 08:02:33.031179	t	\N
4badedb6-b135-c533-1c79-756a9ebdb327	[message supprimé]	2025-05-20 12:52:12.267369	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	"[{\\"id\\":\\"90b1f7c8-5db5-91af-6f02-962a6841ce34\\"}]"	2025-05-20 12:52:12.267369	2025-05-26 08:02:33.031179	t	\N
930f64b4-8590-b2b1-981a-10e9bb60c347	[message supprimé]	2025-05-20 14:52:11.941581	2025-05-22 07:54:38.794347	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-20 14:52:11.941581	2025-05-26 08:02:33.031179	t	fe963918-d018-dc97-7db2-f592798480da
376a2185-ada9-39b7-9f06-0e313f83244b	[message supprimé]	2025-05-19 14:48:18.624098	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-19 14:48:18.624098	2025-05-26 08:02:33.031179	t	\N
87ee245d-7b8a-eaf1-a102-63fe6fde2582	[message supprimé]	2025-05-20 12:56:13.814298	2025-05-22 07:54:38.767686	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-20 12:56:13.814298	2025-05-26 08:02:33.031179	t	\N
281df1ac-213e-40b0-4629-c71d71c25c1e	[message supprimé]	2025-05-20 13:18:05.854788	2025-05-22 07:54:38.793824	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-20 13:18:05.854788	2025-05-26 08:02:33.031179	t	\N
f56ed0f2-d89c-f598-7e67-26479cb7154f	[message supprimé]	2025-05-20 14:46:35.49461	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-20 14:46:35.49461	2025-05-26 08:02:33.031179	t	fe963918-d018-dc97-7db2-f592798480da
84d76545-9a70-6fc0-8f26-723bb33a575f	[message supprimé]	2025-05-20 14:10:19.580955	2025-05-22 07:54:38.79469	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-20 14:10:19.580955	2025-05-26 08:02:33.031179	t	\N
f23f52dd-ffbb-d8e8-d524-32481990f001	[message supprimé]	2025-05-17 13:44:31.15372	2025-05-17 16:19:08.434805	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 13:44:31.15372	2025-05-26 08:02:33.031179	t	\N
233ea14d-c489-9b6e-322c-6d93031d9840	ft	2025-05-26 08:05:16.596454	2025-05-26 08:08:52.50001	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-26 08:05:16.596454	\N	f	\N
57b09cf4-ac35-7514-ea04-e2df579178ed		2025-05-26 08:06:32.339057	2025-05-26 08:08:52.501851	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	"[{\\"id\\":\\"32b13ecb-75be-06dc-e328-55b5bdd90e02\\"}]"	2025-05-26 08:06:32.339057	\N	f	\N
6d850e48-0739-be47-ffdf-97d5a00f0f2b	aa	2025-05-26 08:05:31.341387	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 08:05:31.341387	\N	f	\N
02480272-259d-0d35-b139-64d457d8851d	kkkk	2025-05-26 09:54:47.469081	2025-05-26 11:46:01.436057	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 09:54:47.469081	\N	f	\N
0bdb5e77-8cb6-a0e1-fc8e-60951f358050	ghfgfghfgg	2025-05-26 12:39:16.735564	2025-05-26 12:40:01.275328	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-26 12:39:16.735564	\N	f	\N
008e1216-557e-196a-6e98-af1f1567807d	yu	2025-05-26 08:05:00.389293	2025-05-27 13:20:26.130004	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-26 08:05:00.389293	\N	f	\N
\.


--
-- TOC entry 4427 (class 0 OID 122921)
-- Dependencies: 234
-- Data for Name: message_prive_fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_prive_fichier (fk_message_prive, fk_fichier) FROM stdin;
2371ca20-3929-28f1-a553-cc423c2a2bf9	da1f8bd2-c427-0539-ce31-0b50cbedb844
e4fac9ea-498a-d8a1-959c-042685d83fbe	52680330-d909-a40c-34be-777b7c4b125e
b93d6a8c-9361-7438-f69a-95aa9293136a	68afd927-e966-d8fc-951e-757685f6963f
ef8d5ecd-8e33-02fa-0792-331e23f5e11f	c41cd366-20bb-8b99-7f82-db394871e4f3
ab19c93a-f9a6-df7e-ff6f-4899069bd29c	f80b3869-ec66-0699-52b3-bde225a46e5a
9578e7fd-dbfd-7112-488e-e29a24209781	458b37aa-952b-6616-a3e6-3f262e32f5b3
c70202d6-dd8f-37c2-d0c6-68c404137632	0eea74ab-f389-0dea-f281-570cbb2f9eaa
f642bbdf-5566-1100-8217-331e5f0a6980	ba843738-a9f6-8fa0-8f51-582cd699f967
ecdf38f2-13e4-2134-376d-cfdb3787dd6c	a2ea8ffc-fe7d-d12c-c389-3c4dc41c44aa
5e02a657-7b6b-8c7a-2c28-17bacf6a05e4	2aad3b4e-4ea5-1346-6415-d33020ef7dc7
4e0152fa-122e-a11e-e006-e854c2b43d9b	81613684-1260-6ce0-3d56-d43fa9f5dfc4
f455803b-836c-69e5-40e6-ddb6bba73e3c	d46a8bd2-4951-8b8a-f6a8-84c8669bf2bb
886d545d-2d21-18be-8436-b827924ec661	fb71c3fa-e1da-2d84-d220-19ec10ef5b5c
293102c3-993a-e7db-f098-3362fc67c909	9a854c96-28ce-1b7e-82f8-cedf3b7463d1
9d85b514-75cc-ccd1-fb6d-2ece11ffe7ee	1293cf8e-405e-fcf1-d0e4-424288c0b4ea
6c8dc654-03a2-245b-0ab1-0d856c49dc62	4a17e600-3f57-7db9-b85b-01da0878c772
4293fb10-13f1-740e-b85a-deb637b778d4	5d4be682-4105-0d0b-7b2e-859e61e1be9d
c16638e5-c7d6-676b-89aa-649b3f19a681	541360e0-a8ff-4cdb-5ca9-a25794f02d6b
0155f756-87ef-cf1d-5439-67e98a8450b3	f7aa8292-cee8-3330-80c8-3b17a035812a
91bd6bcb-6ac1-8f1a-23a3-a174ec9d6488	26dd04b2-eafc-7844-e3b6-9cd4aa1e9f43
93713525-9d39-1b7a-4d3e-3f825b6a0c52	49f56282-a0e6-5e66-1fcb-a06dcf322aa6
46446d10-75e2-d5cc-12d0-05a04dac76cb	de98a8e8-5b2a-3702-233b-b0a23c121f2f
1151e794-6979-926b-1e82-f35e0dee3428	7c8b26fc-42a2-60b1-52f7-ded15916b9a3
d1cc8a0d-2f9b-fb74-6928-c027ab428689	e6649839-2a53-b9fe-19db-91260a01e454
eea8ad7b-cddf-b994-b3e3-b0bad0a69b2a	5d527ee9-3dc4-7aa6-4874-2eaed5c37d34
4badedb6-b135-c533-1c79-756a9ebdb327	90b1f7c8-5db5-91af-6f02-962a6841ce34
ddb6ef63-9465-dd9b-8b10-4894327cb8f5	e27f453f-1cb4-b58e-3bb4-0ef7e44f3c94
57b09cf4-ac35-7514-ea04-e2df579178ed	32b13ecb-75be-06dc-e328-55b5bdd90e02
35b016da-0091-29d6-3391-8a95fc19ef08	0d757be7-dd73-7774-e2f6-908331b3de80
\.


--
-- TOC entry 4436 (class 0 OID 253972)
-- Dependencies: 244
-- Data for Name: message_read; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_read (id, fk_user, fk_canal, last_read_at) FROM stdin;
33	a5c1b268-937f-af11-4ca2-2c96634fbe2e	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-04-28 19:49:23.372
28	c8eb671d-f3b4-41f6-7364-0f292619dfdc	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-04-28 19:52:45.055
29	c8eb671d-f3b4-41f6-7364-0f292619dfdc	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-04-28 19:52:45.843
32	a5c1b268-937f-af11-4ca2-2c96634fbe2e	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-04-29 13:29:11.392
31	a5c1b268-937f-af11-4ca2-2c96634fbe2e	07d1837c-59fe-d357-906a-acd22d3e162a	2025-04-29 13:37:45.803
27	c8eb671d-f3b4-41f6-7364-0f292619dfdc	07d1837c-59fe-d357-906a-acd22d3e162a	2025-04-29 13:37:45.784
\.


--
-- TOC entry 4437 (class 0 OID 262207)
-- Dependencies: 245
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.notification (id_notification, fk_utilisateur, type, contenu, lien, is_read, date_creation) FROM stdin;
\.


--
-- TOC entry 4419 (class 0 OID 82295)
-- Dependencies: 226
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.permission (id_permission, type_permission) FROM stdin;
\.


--
-- TOC entry 4439 (class 0 OID 278627)
-- Dependencies: 247
-- Data for Name: private_message_reaction; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.private_message_reaction (id_reaction, fk_message_prive, fk_utilisateur, reaction_type, created_at) FROM stdin;
1	d1edadd8-b4fb-fef0-a47a-36746cb8fc09	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-04 17:10:20.966235
3	31e6be05-e6a0-a406-2e2d-108c6433ea62	c8eb671d-f3b4-41f6-7364-0f292619dfdc	❤️	2025-05-05 12:32:02.261539
4	762acf4a-8823-7f20-f05f-1f19a87c19e8	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 11:13:44.102741
5	19160721-1331-b2d4-a03b-3faa3457e07a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 11:15:49.840217
6	ffbd5343-294a-a924-8a3e-b2737112f006	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 11:37:25.439801
7	cf2aa4cd-5ad7-4dca-df9d-7d0782c63b36	c8eb671d-f3b4-41f6-7364-0f292619dfdc	👍	2025-05-17 11:39:16.924826
8	7306ef1b-0d6b-247c-63db-1935e1fd3f37	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 11:44:18.535395
9	3a6bf250-4fac-82d5-78f8-46c17ef55a35	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 11:45:03.077684
10	aff833cc-a10c-b0d2-6e31-6ac794993d7c	c8eb671d-f3b4-41f6-7364-0f292619dfdc	👍	2025-05-17 11:46:32.38897
11	3a6bf250-4fac-82d5-78f8-46c17ef55a35	a5c1b268-937f-af11-4ca2-2c96634fbe2e	😂	2025-05-17 11:49:40.252845
12	cd78376a-3a55-fd79-f1bb-25880ab9c1b4	c8eb671d-f3b4-41f6-7364-0f292619dfdc	😮	2025-05-17 11:50:39.430335
13	7306ef1b-0d6b-247c-63db-1935e1fd3f37	a5c1b268-937f-af11-4ca2-2c96634fbe2e	😂	2025-05-17 11:50:47.647478
14	14481fbf-db7e-7ba4-458e-1b4950fe9b2d	c8eb671d-f3b4-41f6-7364-0f292619dfdc	❤️	2025-05-17 12:30:41.958874
16	14481fbf-db7e-7ba4-458e-1b4950fe9b2d	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 12:32:37.85294
18	013950dd-13e8-43f8-ec2f-410acf45ea91	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 12:32:54.627119
20	b99625fa-8d58-17a5-d5d5-93eb9cb8a15e	a5c1b268-937f-af11-4ca2-2c96634fbe2e	😢	2025-05-17 12:52:18.563115
22	b99625fa-8d58-17a5-d5d5-93eb9cb8a15e	a5c1b268-937f-af11-4ca2-2c96634fbe2e	😮	2025-05-17 13:24:42.50411
23	b99625fa-8d58-17a5-d5d5-93eb9cb8a15e	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 13:38:44.94433
24	2937387d-e0bb-ecdb-29ef-c6400f3c2dcd	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 14:19:41.738303
25	22abc797-1075-5a68-0333-c980e7f324f4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	❤️	2025-05-17 15:06:53.500731
26	ac7e5a15-bf4f-4676-fad2-f5e23b138349	c8eb671d-f3b4-41f6-7364-0f292619dfdc	😢	2025-05-17 15:07:00.129871
27	f642bbdf-5566-1100-8217-331e5f0a6980	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-19 10:59:12.924596
28	dbe2d3e8-8e76-56dd-d1df-60a77b40cd46	bb6a4d43-70d3-5e36-d943-dfdfc747491f	😮	2025-05-19 13:30:19.717531
29	e6ef0a81-54e8-4c46-3f04-4e863027aac1	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-19 13:30:25.264803
30	ecdf38f2-13e4-2134-376d-cfdb3787dd6c	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-19 13:30:28.980908
31	e3a00106-25b0-0d85-9b56-08e22f31c524	bb6a4d43-70d3-5e36-d943-dfdfc747491f	😮	2025-05-19 13:32:19.961185
32	6da57f1c-3336-24b4-78e1-c6cd6d89bdd7	bb6a4d43-70d3-5e36-d943-dfdfc747491f	😂	2025-05-19 13:34:43.574113
33	6da57f1c-3336-24b4-78e1-c6cd6d89bdd7	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-19 13:35:22.035652
34	6df1cc33-887b-0171-0d2d-c80a77a40ca7	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-19 13:36:52.5659
35	7dc90178-bd92-4632-d1ae-7b1e85a5d5dd	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-19 13:38:58.751495
36	340e65de-9f34-aa8d-4ce1-aa1da4b29d18	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-19 13:41:25.285343
37	e5fa1170-4d18-c6a8-ef35-2b723a73ca3f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	👍	2025-05-19 14:32:53.305389
38	13adfdb1-6964-2555-8f04-016ef833f64a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	👍	2025-05-20 12:35:04.358126
39	13adfdb1-6964-2555-8f04-016ef833f64a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	😮	2025-05-20 12:35:08.047149
40	13adfdb1-6964-2555-8f04-016ef833f64a	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	❤️	2025-05-20 12:37:19.055049
41	97566e28-0882-09b1-8c93-642bcaea1bb4	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	😮	2025-05-20 12:37:28.350412
42	24e14268-7e0d-4bcc-af31-f14ac8fc9764	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	❤️	2025-05-20 12:40:07.90853
43	369915cb-c435-0f34-fc4c-70c3701765f8	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	😂	2025-05-20 12:44:59.981495
44	79a432c4-9023-8943-8f59-95dcffcb786d	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	✅	2025-05-20 12:45:47.729272
45	38880680-9837-281f-5df3-950e030a1a89	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	😂	2025-05-20 12:47:49.641887
46	42eaa66d-9a0a-2735-7929-4c0483f4939d	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	👍	2025-05-20 13:15:51.489984
47	6bab5f8d-c5c6-39b5-c016-520c7c1774bd	a5c1b268-937f-af11-4ca2-2c96634fbe2e	🎉	2025-05-20 14:45:00.579798
48	94bb6dff-a129-29af-eeac-e43be5e600dc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	👍	2025-05-20 14:45:11.481163
49	823c63c8-da52-6c3c-c6bc-7a71c950a29b	bb6a4d43-70d3-5e36-d943-dfdfc747491f	😢	2025-05-22 09:48:12.067137
\.


--
-- TOC entry 4431 (class 0 OID 229471)
-- Dependencies: 238
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.push_subscriptions (id, user_id, endpoint, auth, p256dh, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4434 (class 0 OID 245825)
-- Dependencies: 241
-- Data for Name: reaction; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.reaction (id_reaction, fk_message, fk_utilisateur, reaction_type, created_at) FROM stdin;
16	60f0a1d9-56be-ef2a-4b43-f5c85481a107	c8eb671d-f3b4-41f6-7364-0f292619dfdc	surprise	2025-04-29 13:52:19.81121
17	84e4d04e-a171-0b82-35f6-1fa7838086b8	bb6a4d43-70d3-5e36-d943-dfdfc747491f	thumbsUp	2025-04-30 12:57:18.397295
18	84e4d04e-a171-0b82-35f6-1fa7838086b8	a5c1b268-937f-af11-4ca2-2c96634fbe2e	sad	2025-05-04 13:41:37.431401
19	84e4d04e-a171-0b82-35f6-1fa7838086b8	a5c1b268-937f-af11-4ca2-2c96634fbe2e	angry	2025-05-04 13:41:41.01486
20	c7e92a63-a89b-1c22-9f24-d78d6a41f238	a5c1b268-937f-af11-4ca2-2c96634fbe2e	laugh	2025-05-04 15:51:41.515246
21	0f7262df-5f5b-8991-9765-baccf9dfdcbe	a5c1b268-937f-af11-4ca2-2c96634fbe2e	sad	2025-05-04 15:51:49.180877
22	c7e92a63-a89b-1c22-9f24-d78d6a41f238	a5c1b268-937f-af11-4ca2-2c96634fbe2e	thumbsUp	2025-05-04 15:53:07.400868
23	c7e92a63-a89b-1c22-9f24-d78d6a41f238	a5c1b268-937f-af11-4ca2-2c96634fbe2e	heart	2025-05-04 15:54:14.751162
25	c7e92a63-a89b-1c22-9f24-d78d6a41f238	a5c1b268-937f-af11-4ca2-2c96634fbe2e	surprise	2025-05-04 15:54:49.997693
26	c7e92a63-a89b-1c22-9f24-d78d6a41f238	a5c1b268-937f-af11-4ca2-2c96634fbe2e	angry	2025-05-04 15:55:02.089082
27	d3986fb3-632c-8c4a-2b09-e1a4e1dc483f	a5c1b268-937f-af11-4ca2-2c96634fbe2e	surprise	2025-05-04 15:59:05.061092
28	35d81955-e795-6ba1-b7c5-8abf3ff592d1	a5c1b268-937f-af11-4ca2-2c96634fbe2e	heart	2025-05-04 16:03:13.099422
29	c924cbc4-2e5e-ec12-e13a-d28980db9d1b	bb6a4d43-70d3-5e36-d943-dfdfc747491f	thumbsUp	2025-05-04 17:14:13.470596
30	c924cbc4-2e5e-ec12-e13a-d28980db9d1b	c8eb671d-f3b4-41f6-7364-0f292619dfdc	sad	2025-05-05 11:53:21.772548
31	d3986fb3-632c-8c4a-2b09-e1a4e1dc483f	c8eb671d-f3b4-41f6-7364-0f292619dfdc	angry	2025-05-06 11:41:46.335981
32	128d8f6a-9ba8-0c5c-1fa4-4a2ad58b9289	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	thumbsUp	2025-05-20 12:22:55.610703
\.


--
-- TOC entry 4446 (class 0 OID 303373)
-- Dependencies: 258
-- Data for Name: reminders; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.reminders (id, user_id, title, description, reminder_date, created_at, updated_at, is_sent, email_sent_at, workspace_id, canal_id, email_failed, error_message) FROM stdin;
\.


--
-- TOC entry 4418 (class 0 OID 82290)
-- Dependencies: 225
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role (id_role, nom_role) FROM stdin;
1	owner
2	admin
3	member
\.


--
-- TOC entry 4426 (class 0 OID 82390)
-- Dependencies: 233
-- Data for Name: role_permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role_permission (fk_role, fk_permission) FROM stdin;
\.


--
-- TOC entry 4412 (class 0 OID 82219)
-- Dependencies: 219
-- Data for Name: statut; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.statut (id_statut, label) FROM stdin;
1	online
2	away
3	dnd
4	invisible
0	offline
\.


--
-- TOC entry 4413 (class 0 OID 82224)
-- Dependencies: 220
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.utilisateur (id_utilisateur, nom, email, mot_de_passe, photo_de_profil, date_creation, fk_statut, google_id, is_activated, validation_code, reset_password_code, reset_password_expires, date_naissance, bio, status_text) FROM stdin;
00000000-0000-0000-0000-000000000001	Mistral AI	bot@mistral.ai	dummy_password	https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp	2025-04-08 13:32:15.598295	1	\N	t	\N	\N	\N	\N	\N	\N
c8eb671d-f3b4-41f6-7364-0f292619dfdc	Paul 2	paul.mazzon@icloud.com	$2a$10$husIr5kZtQDeVE44nNAz1eCZMM5w/74Cgu3RDzVQ8VAT4XNfnyLqi	\N	2025-04-01 12:32:20.707977	4	\N	t	\N	\N	\N	2004-01-06		\N
bb6a4d43-70d3-5e36-d943-dfdfc747491f	Math'BigDick	mathis.malzac@supinfo.com	$2a$10$Ga1TJtB5.ufn0C9h8hs1YuQ39emibG9WS9ow/o5GczMeFOWwM.W2a	\N	2025-02-27 13:47:22.59845	1	\N	t	\N	\N	\N	2010-02-16		\N
25c01514-5c67-6921-1cfa-6261c29e5d88	Paul Mazzon 2	paul.mazzon@supinfo.com	$2a$10$Q1/HrF0MUVJ2m/gFfAfo1eOddB78xzfJuscFr.fO4mEhqMjL/gjBG	\N	2025-05-12 11:07:01.643263	1	\N	t	\N	\N	\N	2004-01-06	\N	\N
343f33f0-7f91-a104-c028-fc867feeffbd	RUDY2	rudy.gault@supinfo.com	$2a$10$xwa2WBaTpcbMLkHFozQzPuamnt5SMWUrRlm2JR8E5mrnivxH1n4O2	\N	2025-05-17 12:51:28.560495	1	\N	f	499562	\N	\N	2001-08-27	\N	\N
00000000-0000-0000-0000-000000000003	System	system	dummy_password_ocr		2025-04-18 11:46:23.860732	1	\N	t	\N	\N	\N	\N	System	\N
00000000-0000-0000-0000-000000000002	MistralOCR	bot-ocr@mistral.ai	dummy_password_ocr	https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp	2025-04-18 11:46:23.860732	1	\N	t	\N	\N	\N	\N	Je suis l'assistant OCR de Mistral AI.	\N
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	Rudy	gault.rudy@gmail.com	$2a$10$KwpeHvkEQHur5hFUPhngEezuvRDMAB5EPMotu1xb/SE20ZL5YK0ki	https://s3.fr-par.scw.cloud/s3-supchat/avatars/1c7ca609-2f45-4277-a75d-f81aeb91beb6.jpg	2025-02-27 13:11:18.704602	4	\N	t	\N	\N	\N	2010-02-27	j'aime la crotte	\N
fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	Math Homo	a@a.com	$2a$10$2W17CqGmWTtYGMk63c.iueIy9cg2VLxKqFU9nD3d1T1q3I6HyxKWK	https://s3.fr-par.scw.cloud/s3-supchat/avatars/8b52616b-df43-41e0-80f3-37b78f292e7a.jpg	2025-05-08 10:24:15.013714	1	\N	t	\N	\N	\N	2010-05-06		\N
ab31a4a3-437a-6ff4-d96f-bf97eabba0c6	Paul 4	admin@admin.com	$2a$10$nImjzyJUwRLbSaqfKu2CT.dKod3NblFYNmrBaePCdpD4kV.KUBcbK	\N	2025-05-17 13:07:31.124052	1	\N	t	\N	\N	\N	2010-05-17	\N	\N
a5c1b268-937f-af11-4ca2-2c96634fbe2e	Paul MAZZON	paul.mazzon@gmail.com	$2a$10$.ikIVHLztRKsTWBG2gRPgeszkqImsSq95gkCklLm0bD.xAlJuZOk6	https://avatars.githubusercontent.com/u/63354977?v=4	2025-02-26 13:35:29.993728	4	\N	t	\N	\N	\N	2004-01-06	Salut !	\N
\.


--
-- TOC entry 4414 (class 0 OID 82243)
-- Dependencies: 221
-- Data for Name: workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace (id_workspace, nom, is_private, date_creation, banner_url, icon_url, description) FROM stdin;
6eeddc21-d56a-e978-b0c1-384e3f6cf186	test private	t	2025-05-08 09:57:59.364282	workspaces/banners/61630ddf-087f-47a5-9560-6323368a19c7.png	workspaces/icons/eff8552c-8db2-4256-b689-78c1cfb72848.png	test
c6d5d602-9fd0-99c7-1654-65c23b0cd792	Test zizi	f	2025-05-08 14:27:00.042832	\N	\N	zizi
4e94fed5-a879-6084-8eb7-ace5aa6c6236	testinvit	f	2025-05-09 11:41:27.655447	\N	\N	testinvitation
d4f1cff0-3ef5-7ab1-e654-c05894915c31	Supchat	f	2025-04-26 16:55:29.216308	workspaces/banners/2aa33e5b-a476-493d-935b-663a6b535ec8.jpg	workspaces/icons/41103c3c-3c22-439e-978e-9bc2b0562864.png	Serveur officiel de SUPCHATTTT
50488325-0e58-2558-ffc5-033c938688c7	loutre de combat	t	2025-05-17 11:53:07.410992	workspaces/banners/06ffb482-13f3-43b2-828d-380e982483e9.jpg	workspaces/icons/babdae0c-8151-42ed-8c95-016c9456e7aa.jpg	
9e0d7df7-d222-ef58-c1ce-4d431e0a0f47	equipe	t	2025-05-17 12:21:07.484947	workspaces/banners/0a17b5b3-2f5e-4d45-b1da-02e66fbd951b.png	workspaces/icons/703a9f61-aacc-4ceb-a83b-56bd76b022af.jpg	
\.


--
-- TOC entry 4429 (class 0 OID 229396)
-- Dependencies: 236
-- Data for Name: workspace_favoris; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_favoris (id_workspace_favoris, fk_utilisateur, fk_workspace, date_ajout) FROM stdin;
13	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2025-04-28 08:15:46.242175
16	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2025-05-07 19:33:36.037155
17	a5c1b268-937f-af11-4ca2-2c96634fbe2e	6eeddc21-d56a-e978-b0c1-384e3f6cf186	2025-05-08 12:09:05.770797
21	c8eb671d-f3b4-41f6-7364-0f292619dfdc	6eeddc21-d56a-e978-b0c1-384e3f6cf186	2025-05-08 13:01:26.01789
25	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2025-05-17 12:19:47.675656
26	c8eb671d-f3b4-41f6-7364-0f292619dfdc	4e94fed5-a879-6084-8eb7-ace5aa6c6236	2025-05-17 12:42:11.21888
28	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c6d5d602-9fd0-99c7-1654-65c23b0cd792	2025-05-18 13:31:40.788919
29	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2025-05-20 12:17:53.800884
30	bb6a4d43-70d3-5e36-d943-dfdfc747491f	c6d5d602-9fd0-99c7-1654-65c23b0cd792	2025-05-22 09:44:15.59923
\.


--
-- TOC entry 4422 (class 0 OID 82327)
-- Dependencies: 229
-- Data for Name: workspace_invitations; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_invitations (id_invitation, fk_workspace, email_invite, token_invitation, date_expiration, date_creation) FROM stdin;
d9733e4a-8c6e-8d82-b49c-662124946a53	d4f1cff0-3ef5-7ab1-e654-c05894915c31	mathis.malzac@supinfo.com	e2obo7zjq8exy9uerjnv	2025-05-23 11:45:55.465	2025-05-22 09:45:55.7878
\.


--
-- TOC entry 4443 (class 0 OID 303223)
-- Dependencies: 251
-- Data for Name: workspace_join_requests; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_join_requests (id_request, fk_workspace, fk_utilisateur, message, statut, date_creation, date_traitement, fk_administrateur, reject_reason) FROM stdin;
5	6eeddc21-d56a-e978-b0c1-384e3f6cf186	a5c1b268-937f-af11-4ca2-2c96634fbe2e	caca prout	acceptee	2025-05-18 14:46:01.421852	2025-05-18 14:46:23.6333	c8eb671d-f3b4-41f6-7364-0f292619dfdc	\N
6	6eeddc21-d56a-e978-b0c1-384e3f6cf186	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	je peux rejoindre ?	acceptee	2025-05-19 07:12:55.010521	2025-05-19 07:13:08.570305	c8eb671d-f3b4-41f6-7364-0f292619dfdc	\N
7	50488325-0e58-2558-ffc5-033c938688c7	a5c1b268-937f-af11-4ca2-2c96634fbe2e	\N	en_attente	2025-05-19 11:44:47.596998	\N	\N	\N
8	9e0d7df7-d222-ef58-c1ce-4d431e0a0f47	bb6a4d43-70d3-5e36-d943-dfdfc747491f	\N	en_attente	2025-05-20 12:17:42.37958	\N	\N	\N
9	50488325-0e58-2558-ffc5-033c938688c7	bb6a4d43-70d3-5e36-d943-dfdfc747491f	\N	en_attente	2025-05-22 09:47:35.827137	\N	\N	\N
\.


--
-- TOC entry 4596 (class 0 OID 0)
-- Dependencies: 254
-- Name: jobid_seq; Type: SEQUENCE SET; Schema: cron; Owner: azuresu
--

SELECT pg_catalog.setval('cron.jobid_seq', 1, false);


--
-- TOC entry 4597 (class 0 OID 0)
-- Dependencies: 256
-- Name: runid_seq; Type: SEQUENCE SET; Schema: cron; Owner: azuresu
--

SELECT pg_catalog.setval('cron.runid_seq', 1, false);


--
-- TOC entry 4598 (class 0 OID 0)
-- Dependencies: 248
-- Name: canal_lecture_id_canal_lecture_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.canal_lecture_id_canal_lecture_seq', 49, true);


--
-- TOC entry 4599 (class 0 OID 0)
-- Dependencies: 252
-- Name: membre_canal_id_membre_canal_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.membre_canal_id_membre_canal_seq', 9, true);


--
-- TOC entry 4600 (class 0 OID 0)
-- Dependencies: 243
-- Name: message_read_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.message_read_id_seq', 87, true);


--
-- TOC entry 4601 (class 0 OID 0)
-- Dependencies: 246
-- Name: private_message_reaction_id_reaction_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.private_message_reaction_id_reaction_seq', 49, true);


--
-- TOC entry 4602 (class 0 OID 0)
-- Dependencies: 237
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


--
-- TOC entry 4603 (class 0 OID 0)
-- Dependencies: 240
-- Name: reaction_id_reaction_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.reaction_id_reaction_seq', 32, true);


--
-- TOC entry 4604 (class 0 OID 0)
-- Dependencies: 235
-- Name: workspace_favoris_id_workspace_favoris_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.workspace_favoris_id_workspace_favoris_seq', 30, true);


--
-- TOC entry 4605 (class 0 OID 0)
-- Dependencies: 250
-- Name: workspace_join_requests_id_request_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.workspace_join_requests_id_request_seq', 9, true);


--
-- TOC entry 4197 (class 2606 OID 286788)
-- Name: canal_lecture canal_lecture_fk_utilisateur_fk_canal_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture
    ADD CONSTRAINT canal_lecture_fk_utilisateur_fk_canal_key UNIQUE (fk_utilisateur, fk_canal);


--
-- TOC entry 4199 (class 2606 OID 286786)
-- Name: canal_lecture canal_lecture_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture
    ADD CONSTRAINT canal_lecture_pkey PRIMARY KEY (id_canal_lecture);


--
-- TOC entry 4133 (class 2606 OID 82258)
-- Name: canal canal_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT canal_pkey PRIMARY KEY (id_canal);


--
-- TOC entry 4137 (class 2606 OID 82289)
-- Name: fichier fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fichier_pkey PRIMARY KEY (id_fichier);


--
-- TOC entry 4143 (class 2606 OID 82306)
-- Name: hashtag hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.hashtag
    ADD CONSTRAINT hashtag_pkey PRIMARY KEY (id_hashtag);


--
-- TOC entry 4213 (class 2606 OID 303267)
-- Name: membre_canal membre_canal_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_canal
    ADD CONSTRAINT membre_canal_pkey PRIMARY KEY (id_membre_canal);


--
-- TOC entry 4145 (class 2606 OID 82311)
-- Name: membre_workspace membre_workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT membre_workspace_pkey PRIMARY KEY (fk_utilisateur, fk_workspace);


--
-- TOC entry 4155 (class 2606 OID 82349)
-- Name: message_fichier message_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT message_fichier_pkey PRIMARY KEY (fk_message, fk_fichier);


--
-- TOC entry 4157 (class 2606 OID 82364)
-- Name: message_hashtag message_hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT message_hashtag_pkey PRIMARY KEY (fk_message, fk_hashtag);


--
-- TOC entry 4159 (class 2606 OID 82379)
-- Name: message_mention message_mention_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT message_mention_pkey PRIMARY KEY (fk_message, fk_utilisateur);


--
-- TOC entry 4135 (class 2606 OID 82270)
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id_message);


--
-- TOC entry 4163 (class 2606 OID 122925)
-- Name: message_prive_fichier message_prive_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT message_prive_fichier_pkey PRIMARY KEY (fk_message_prive, fk_fichier);


--
-- TOC entry 4179 (class 2606 OID 229501)
-- Name: message_prive message_prive_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT message_prive_pkey PRIMARY KEY (id_message_prive);


--
-- TOC entry 4185 (class 2606 OID 253980)
-- Name: message_read message_read_fk_user_fk_canal_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_read
    ADD CONSTRAINT message_read_fk_user_fk_canal_key UNIQUE (fk_user, fk_canal);


--
-- TOC entry 4187 (class 2606 OID 253978)
-- Name: message_read message_read_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_read
    ADD CONSTRAINT message_read_pkey PRIMARY KEY (id);


--
-- TOC entry 4190 (class 2606 OID 262216)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id_notification);


--
-- TOC entry 4141 (class 2606 OID 82300)
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id_permission);


--
-- TOC entry 4193 (class 2606 OID 278635)
-- Name: private_message_reaction private_message_reaction_fk_message_prive_fk_utilisateur_re_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_fk_message_prive_fk_utilisateur_re_key UNIQUE (fk_message_prive, fk_utilisateur, reaction_type);


--
-- TOC entry 4195 (class 2606 OID 278633)
-- Name: private_message_reaction private_message_reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_pkey PRIMARY KEY (id_reaction);


--
-- TOC entry 4171 (class 2606 OID 229482)
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- TOC entry 4173 (class 2606 OID 229480)
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4181 (class 2606 OID 245833)
-- Name: reaction reaction_fk_message_fk_utilisateur_reaction_type_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_message_fk_utilisateur_reaction_type_key UNIQUE (fk_message, fk_utilisateur, reaction_type);


--
-- TOC entry 4183 (class 2606 OID 245831)
-- Name: reaction reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_pkey PRIMARY KEY (id_reaction);


--
-- TOC entry 4226 (class 2606 OID 303383)
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- TOC entry 4161 (class 2606 OID 82394)
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (fk_role, fk_permission);


--
-- TOC entry 4139 (class 2606 OID 82294)
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id_role);


--
-- TOC entry 4123 (class 2606 OID 82223)
-- Name: statut statut_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.statut
    ADD CONSTRAINT statut_pkey PRIMARY KEY (id_statut);


--
-- TOC entry 4215 (class 2606 OID 303269)
-- Name: membre_canal unique_membre_canal; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_canal
    ADD CONSTRAINT unique_membre_canal UNIQUE (fk_canal, fk_utilisateur);


--
-- TOC entry 4125 (class 2606 OID 82235)
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- TOC entry 4127 (class 2606 OID 82237)
-- Name: utilisateur utilisateur_google_id_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_google_id_key UNIQUE (google_id);


--
-- TOC entry 4129 (class 2606 OID 82233)
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);


--
-- TOC entry 4165 (class 2606 OID 229404)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fk_workspace_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fk_workspace_key UNIQUE (fk_utilisateur, fk_workspace);


--
-- TOC entry 4167 (class 2606 OID 229402)
-- Name: workspace_favoris workspace_favoris_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_pkey PRIMARY KEY (id_workspace_favoris);


--
-- TOC entry 4149 (class 2606 OID 82339)
-- Name: workspace_invitations workspace_invitations_fk_workspace_email_invite_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_fk_workspace_email_invite_key UNIQUE (fk_workspace, email_invite);


--
-- TOC entry 4151 (class 2606 OID 82335)
-- Name: workspace_invitations workspace_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id_invitation);


--
-- TOC entry 4153 (class 2606 OID 82337)
-- Name: workspace_invitations workspace_invitations_token_invitation_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_token_invitation_key UNIQUE (token_invitation);


--
-- TOC entry 4207 (class 2606 OID 303235)
-- Name: workspace_join_requests workspace_join_requests_fk_workspace_fk_utilisateur_statut_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_join_requests
    ADD CONSTRAINT workspace_join_requests_fk_workspace_fk_utilisateur_statut_key UNIQUE (fk_workspace, fk_utilisateur, statut);


--
-- TOC entry 4209 (class 2606 OID 303233)
-- Name: workspace_join_requests workspace_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_join_requests
    ADD CONSTRAINT workspace_join_requests_pkey PRIMARY KEY (id_request);


--
-- TOC entry 4131 (class 2606 OID 82250)
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id_workspace);


--
-- TOC entry 4200 (class 1259 OID 286800)
-- Name: idx_canal_lecture_canal; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_canal_lecture_canal ON public.canal_lecture USING btree (fk_canal);


--
-- TOC entry 4201 (class 1259 OID 286801)
-- Name: idx_canal_lecture_derniere_lecture; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_canal_lecture_derniere_lecture ON public.canal_lecture USING btree (derniere_lecture);


--
-- TOC entry 4202 (class 1259 OID 286799)
-- Name: idx_canal_lecture_utilisateur; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_canal_lecture_utilisateur ON public.canal_lecture USING btree (fk_utilisateur);


--
-- TOC entry 4146 (class 1259 OID 82427)
-- Name: idx_invitation_email; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_email ON public.workspace_invitations USING btree (email_invite);


--
-- TOC entry 4147 (class 1259 OID 82426)
-- Name: idx_invitation_workspace; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_workspace ON public.workspace_invitations USING btree (fk_workspace);


--
-- TOC entry 4210 (class 1259 OID 303281)
-- Name: idx_membre_canal_canal; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_membre_canal_canal ON public.membre_canal USING btree (fk_canal);


--
-- TOC entry 4211 (class 1259 OID 303280)
-- Name: idx_membre_canal_user; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_membre_canal_user ON public.membre_canal USING btree (fk_utilisateur);


--
-- TOC entry 4174 (class 1259 OID 229515)
-- Name: idx_message_prive_conversation; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_conversation ON public.message_prive USING btree (fk_expediteur, fk_destinataire);


--
-- TOC entry 4175 (class 1259 OID 229514)
-- Name: idx_message_prive_date_envoi; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_date_envoi ON public.message_prive USING btree (date_envoi);


--
-- TOC entry 4176 (class 1259 OID 229513)
-- Name: idx_message_prive_destinataire; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_destinataire ON public.message_prive USING btree (fk_destinataire);


--
-- TOC entry 4177 (class 1259 OID 229512)
-- Name: idx_message_prive_expediteur; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_expediteur ON public.message_prive USING btree (fk_expediteur);


--
-- TOC entry 4188 (class 1259 OID 262222)
-- Name: idx_notification_utilisateur_read; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_notification_utilisateur_read ON public.notification USING btree (fk_utilisateur, is_read);


--
-- TOC entry 4191 (class 1259 OID 278646)
-- Name: idx_private_message_reaction_message; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_private_message_reaction_message ON public.private_message_reaction USING btree (fk_message_prive);


--
-- TOC entry 4168 (class 1259 OID 229489)
-- Name: idx_push_subscriptions_endpoint; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions USING btree (endpoint);


--
-- TOC entry 4169 (class 1259 OID 229488)
-- Name: idx_push_subscriptions_user; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions USING btree (user_id);


--
-- TOC entry 4222 (class 1259 OID 303391)
-- Name: idx_reminders_is_sent; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_reminders_is_sent ON public.reminders USING btree (is_sent);


--
-- TOC entry 4223 (class 1259 OID 303390)
-- Name: idx_reminders_reminder_date; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_reminders_reminder_date ON public.reminders USING btree (reminder_date);


--
-- TOC entry 4224 (class 1259 OID 303389)
-- Name: idx_reminders_user_id; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_reminders_user_id ON public.reminders USING btree (user_id);


--
-- TOC entry 4203 (class 1259 OID 303253)
-- Name: idx_workspace_join_requests_statut; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_workspace_join_requests_statut ON public.workspace_join_requests USING btree (statut);


--
-- TOC entry 4204 (class 1259 OID 303252)
-- Name: idx_workspace_join_requests_utilisateur; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_workspace_join_requests_utilisateur ON public.workspace_join_requests USING btree (fk_utilisateur);


--
-- TOC entry 4205 (class 1259 OID 303251)
-- Name: idx_workspace_join_requests_workspace; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_workspace_join_requests_workspace ON public.workspace_join_requests USING btree (fk_workspace);


--
-- TOC entry 4266 (class 2620 OID 303402)
-- Name: reminders trigger_update_reminders_updated_at; Type: TRIGGER; Schema: public; Owner: rootmath
--

CREATE TRIGGER trigger_update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_reminders_updated_at();


--
-- TOC entry 4267 (class 2620 OID 303399)
-- Name: reminders update_reminder_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: rootmath
--

CREATE TRIGGER update_reminder_updated_at_trigger BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_reminder_updated_at();


--
-- TOC entry 4257 (class 2606 OID 286794)
-- Name: canal_lecture canal_lecture_fk_canal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture
    ADD CONSTRAINT canal_lecture_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal) ON DELETE CASCADE;


--
-- TOC entry 4258 (class 2606 OID 286789)
-- Name: canal_lecture canal_lecture_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture
    ADD CONSTRAINT canal_lecture_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4262 (class 2606 OID 303270)
-- Name: membre_canal fk_canal_membre_canal; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_canal
    ADD CONSTRAINT fk_canal_membre_canal FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal) ON DELETE CASCADE;


--
-- TOC entry 4228 (class 2606 OID 82259)
-- Name: canal fk_canal_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT fk_canal_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4232 (class 2606 OID 245852)
-- Name: fichier fk_fichier_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fk_fichier_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4236 (class 2606 OID 82340)
-- Name: workspace_invitations fk_invitation_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT fk_invitation_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4233 (class 2606 OID 82322)
-- Name: membre_workspace fk_membre_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4234 (class 2606 OID 82312)
-- Name: membre_workspace fk_membre_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4235 (class 2606 OID 82317)
-- Name: membre_workspace fk_membre_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4229 (class 2606 OID 82271)
-- Name: message fk_message_canal; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_canal FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal);


--
-- TOC entry 4249 (class 2606 OID 229507)
-- Name: message_prive fk_message_prive_destinataire; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_destinataire FOREIGN KEY (fk_destinataire) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4250 (class 2606 OID 229502)
-- Name: message_prive fk_message_prive_expediteur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_expediteur FOREIGN KEY (fk_expediteur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4230 (class 2606 OID 82276)
-- Name: message fk_message_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4237 (class 2606 OID 82355)
-- Name: message_fichier fk_messagefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier);


--
-- TOC entry 4238 (class 2606 OID 82350)
-- Name: message_fichier fk_messagefichier_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4239 (class 2606 OID 82370)
-- Name: message_hashtag fk_messagehashtag_hashtag; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_hashtag FOREIGN KEY (fk_hashtag) REFERENCES public.hashtag(id_hashtag);


--
-- TOC entry 4240 (class 2606 OID 82365)
-- Name: message_hashtag fk_messagehashtag_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4241 (class 2606 OID 82380)
-- Name: message_mention fk_messagemention_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4242 (class 2606 OID 82385)
-- Name: message_mention fk_messagemention_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4245 (class 2606 OID 122931)
-- Name: message_prive_fichier fk_messageprivefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT fk_messageprivefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier) ON DELETE CASCADE;


--
-- TOC entry 4264 (class 2606 OID 303394)
-- Name: reminders fk_reminders_user_id; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT fk_reminders_user_id FOREIGN KEY (user_id) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4243 (class 2606 OID 82400)
-- Name: role_permission fk_rolepermission_permission; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_permission FOREIGN KEY (fk_permission) REFERENCES public.permission(id_permission);


--
-- TOC entry 4244 (class 2606 OID 82395)
-- Name: role_permission fk_rolepermission_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4263 (class 2606 OID 303275)
-- Name: membre_canal fk_user_membre_canal; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_canal
    ADD CONSTRAINT fk_user_membre_canal FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4227 (class 2606 OID 82238)
-- Name: utilisateur fk_utilisateur_statut; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT fk_utilisateur_statut FOREIGN KEY (fk_statut) REFERENCES public.statut(id_statut);


--
-- TOC entry 4231 (class 2606 OID 188437)
-- Name: message message_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message(id_message) ON DELETE SET NULL;


--
-- TOC entry 4251 (class 2606 OID 245859)
-- Name: message_prive message_prive_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT message_prive_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message_prive(id_message_prive);


--
-- TOC entry 4254 (class 2606 OID 262217)
-- Name: notification notification_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4255 (class 2606 OID 278636)
-- Name: private_message_reaction private_message_reaction_fk_message_prive_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_fk_message_prive_fkey FOREIGN KEY (fk_message_prive) REFERENCES public.message_prive(id_message_prive) ON DELETE CASCADE;


--
-- TOC entry 4256 (class 2606 OID 278641)
-- Name: private_message_reaction private_message_reaction_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4248 (class 2606 OID 229483)
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4252 (class 2606 OID 245834)
-- Name: reaction reaction_fk_message_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message) ON DELETE CASCADE;


--
-- TOC entry 4253 (class 2606 OID 245839)
-- Name: reaction reaction_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4265 (class 2606 OID 303384)
-- Name: reminders reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4246 (class 2606 OID 229405)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4247 (class 2606 OID 229410)
-- Name: workspace_favoris workspace_favoris_fk_workspace_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE;


--
-- TOC entry 4259 (class 2606 OID 303246)
-- Name: workspace_join_requests workspace_join_requests_fk_administrateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_join_requests
    ADD CONSTRAINT workspace_join_requests_fk_administrateur_fkey FOREIGN KEY (fk_administrateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- TOC entry 4260 (class 2606 OID 303241)
-- Name: workspace_join_requests workspace_join_requests_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_join_requests
    ADD CONSTRAINT workspace_join_requests_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4261 (class 2606 OID 303236)
-- Name: workspace_join_requests workspace_join_requests_fk_workspace_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_join_requests
    ADD CONSTRAINT workspace_join_requests_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE;


--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 4452
-- Name: DATABASE postgres; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON DATABASE postgres TO "paul.mazzon@supinfo.com";
GRANT ALL ON DATABASE postgres TO "rudy.gault@supinfo.com";
GRANT ALL ON DATABASE postgres TO "mathis.malzac@supinfo.com";
GRANT ALL ON DATABASE postgres TO "REDACTED";


--
-- TOC entry 4456 (class 0 OID 0)
-- Dependencies: 9
-- Name: SCHEMA cron; Type: ACL; Schema: -; Owner: azuresu
--

GRANT USAGE ON SCHEMA cron TO azure_pg_admin WITH GRANT OPTION;


--
-- TOC entry 4457 (class 0 OID 0)
-- Dependencies: 8
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON SCHEMA public TO "rudy.gault@supinfo.com";
GRANT ALL ON SCHEMA public TO "paul.mazzon@supinfo.com";
GRANT ALL ON SCHEMA public TO "REDACTED";


--
-- TOC entry 4460 (class 0 OID 0)
-- Dependencies: 293
-- Name: FUNCTION alter_job(job_id bigint, schedule text, command text, database text, username text, active boolean); Type: ACL; Schema: cron; Owner: azuresu
--

GRANT ALL ON FUNCTION cron.alter_job(job_id bigint, schedule text, command text, database text, username text, active boolean) TO azure_pg_admin WITH GRANT OPTION;


--
-- TOC entry 4461 (class 0 OID 0)
-- Dependencies: 291
-- Name: FUNCTION job_cache_invalidate(); Type: ACL; Schema: cron; Owner: azuresu
--

GRANT ALL ON FUNCTION cron.job_cache_invalidate() TO azure_pg_admin WITH GRANT OPTION;


--
-- TOC entry 4462 (class 0 OID 0)
-- Dependencies: 289
-- Name: FUNCTION schedule(schedule text, command text); Type: ACL; Schema: cron; Owner: azuresu
--

GRANT ALL ON FUNCTION cron.schedule(schedule text, command text) TO azure_pg_admin WITH GRANT OPTION;


--
-- TOC entry 4463 (class 0 OID 0)
-- Dependencies: 292
-- Name: FUNCTION schedule(job_name text, schedule text, command text); Type: ACL; Schema: cron; Owner: azuresu
--

GRANT ALL ON FUNCTION cron.schedule(job_name text, schedule text, command text) TO azure_pg_admin WITH GRANT OPTION;


--
-- TOC entry 4464 (class 0 OID 0)
-- Dependencies: 294
-- Name: FUNCTION schedule_in_database(job_name text, schedule text, command text, database text, username text, active boolean); Type: ACL; Schema: cron; Owner: azuresu
--

GRANT ALL ON FUNCTION cron.schedule_in_database(job_name text, schedule text, command text, database text, username text, active boolean) TO azure_pg_admin WITH GRANT OPTION;


--
-- TOC entry 4465 (class 0 OID 0)
-- Dependencies: 290
-- Name: FUNCTION unschedule(job_id bigint); Type: ACL; Schema: cron; Owner: azuresu
--

GRANT ALL ON FUNCTION cron.unschedule(job_id bigint) TO azure_pg_admin WITH GRANT OPTION;


--
-- TOC entry 4466 (class 0 OID 0)
-- Dependencies: 295
-- Name: FUNCTION unschedule(job_name text); Type: ACL; Schema: cron; Owner: azuresu
--

GRANT ALL ON FUNCTION cron.unschedule(job_name text) TO azure_pg_admin WITH GRANT OPTION;


--
-- TOC entry 4467 (class 0 OID 0)
-- Dependencies: 259
-- Name: FUNCTION pg_replication_origin_advance(text, pg_lsn); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_advance(text, pg_lsn) TO azure_pg_admin;


--
-- TOC entry 4468 (class 0 OID 0)
-- Dependencies: 275
-- Name: FUNCTION pg_replication_origin_create(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_create(text) TO azure_pg_admin;


--
-- TOC entry 4469 (class 0 OID 0)
-- Dependencies: 267
-- Name: FUNCTION pg_replication_origin_drop(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_drop(text) TO azure_pg_admin;


--
-- TOC entry 4470 (class 0 OID 0)
-- Dependencies: 268
-- Name: FUNCTION pg_replication_origin_oid(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_oid(text) TO azure_pg_admin;


--
-- TOC entry 4471 (class 0 OID 0)
-- Dependencies: 269
-- Name: FUNCTION pg_replication_origin_progress(text, boolean); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_progress(text, boolean) TO azure_pg_admin;


--
-- TOC entry 4472 (class 0 OID 0)
-- Dependencies: 270
-- Name: FUNCTION pg_replication_origin_session_is_setup(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_is_setup() TO azure_pg_admin;


--
-- TOC entry 4473 (class 0 OID 0)
-- Dependencies: 271
-- Name: FUNCTION pg_replication_origin_session_progress(boolean); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_progress(boolean) TO azure_pg_admin;


--
-- TOC entry 4474 (class 0 OID 0)
-- Dependencies: 276
-- Name: FUNCTION pg_replication_origin_session_reset(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_reset() TO azure_pg_admin;


--
-- TOC entry 4475 (class 0 OID 0)
-- Dependencies: 272
-- Name: FUNCTION pg_replication_origin_session_setup(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_setup(text) TO azure_pg_admin;


--
-- TOC entry 4476 (class 0 OID 0)
-- Dependencies: 273
-- Name: FUNCTION pg_replication_origin_xact_reset(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_reset() TO azure_pg_admin;


--
-- TOC entry 4477 (class 0 OID 0)
-- Dependencies: 274
-- Name: FUNCTION pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone) TO azure_pg_admin;


--
-- TOC entry 4478 (class 0 OID 0)
-- Dependencies: 277
-- Name: FUNCTION pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn) TO azure_pg_admin;


--
-- TOC entry 4479 (class 0 OID 0)
-- Dependencies: 260
-- Name: FUNCTION pg_stat_reset(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset() TO azure_pg_admin;


--
-- TOC entry 4480 (class 0 OID 0)
-- Dependencies: 261
-- Name: FUNCTION pg_stat_reset_shared(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset_shared(text) TO azure_pg_admin;


--
-- TOC entry 4481 (class 0 OID 0)
-- Dependencies: 266
-- Name: FUNCTION pg_stat_reset_single_function_counters(oid); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset_single_function_counters(oid) TO azure_pg_admin;


--
-- TOC entry 4482 (class 0 OID 0)
-- Dependencies: 265
-- Name: FUNCTION pg_stat_reset_single_table_counters(oid); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset_single_table_counters(oid) TO azure_pg_admin;


--
-- TOC entry 4483 (class 0 OID 0)
-- Dependencies: 102
-- Name: COLUMN pg_config.name; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(name) ON TABLE pg_catalog.pg_config TO azure_pg_admin;


--
-- TOC entry 4484 (class 0 OID 0)
-- Dependencies: 102
-- Name: COLUMN pg_config.setting; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(setting) ON TABLE pg_catalog.pg_config TO azure_pg_admin;


--
-- TOC entry 4485 (class 0 OID 0)
-- Dependencies: 98
-- Name: COLUMN pg_hba_file_rules.line_number; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(line_number) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4486 (class 0 OID 0)
-- Dependencies: 98
-- Name: COLUMN pg_hba_file_rules.type; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(type) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4487 (class 0 OID 0)
-- Dependencies: 98
-- Name: COLUMN pg_hba_file_rules.database; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(database) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4488 (class 0 OID 0)
-- Dependencies: 98
-- Name: COLUMN pg_hba_file_rules.user_name; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(user_name) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4489 (class 0 OID 0)
-- Dependencies: 98
-- Name: COLUMN pg_hba_file_rules.address; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(address) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4490 (class 0 OID 0)
-- Dependencies: 98
-- Name: COLUMN pg_hba_file_rules.netmask; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(netmask) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4491 (class 0 OID 0)
-- Dependencies: 98
-- Name: COLUMN pg_hba_file_rules.auth_method; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(auth_method) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4492 (class 0 OID 0)
-- Dependencies: 98
-- Name: COLUMN pg_hba_file_rules.options; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(options) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4493 (class 0 OID 0)
-- Dependencies: 98
-- Name: COLUMN pg_hba_file_rules.error; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(error) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4494 (class 0 OID 0)
-- Dependencies: 148
-- Name: COLUMN pg_replication_origin_status.local_id; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(local_id) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4495 (class 0 OID 0)
-- Dependencies: 148
-- Name: COLUMN pg_replication_origin_status.external_id; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(external_id) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4496 (class 0 OID 0)
-- Dependencies: 148
-- Name: COLUMN pg_replication_origin_status.remote_lsn; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(remote_lsn) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4497 (class 0 OID 0)
-- Dependencies: 148
-- Name: COLUMN pg_replication_origin_status.local_lsn; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(local_lsn) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4498 (class 0 OID 0)
-- Dependencies: 103
-- Name: COLUMN pg_shmem_allocations.name; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(name) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4499 (class 0 OID 0)
-- Dependencies: 103
-- Name: COLUMN pg_shmem_allocations.off; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(off) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4500 (class 0 OID 0)
-- Dependencies: 103
-- Name: COLUMN pg_shmem_allocations.size; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(size) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4501 (class 0 OID 0)
-- Dependencies: 103
-- Name: COLUMN pg_shmem_allocations.allocated_size; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(allocated_size) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4502 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.starelid; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(starelid) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4503 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.staattnum; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staattnum) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4504 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stainherit; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stainherit) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4505 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stanullfrac; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanullfrac) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4506 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stawidth; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stawidth) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4507 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stadistinct; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stadistinct) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4508 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stakind1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4509 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stakind2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4510 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stakind3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4511 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stakind4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4512 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stakind5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4513 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.staop1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4514 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.staop2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4515 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.staop3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4516 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.staop4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4517 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.staop5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4518 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stacoll1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4519 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stacoll2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4520 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stacoll3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4521 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stacoll4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4522 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stacoll5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4523 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stanumbers1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4524 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stanumbers2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4525 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stanumbers3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4526 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stanumbers4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4527 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stanumbers5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4528 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stavalues1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4529 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stavalues2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4530 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stavalues3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4531 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stavalues4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4532 (class 0 OID 0)
-- Dependencies: 43
-- Name: COLUMN pg_statistic.stavalues5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4533 (class 0 OID 0)
-- Dependencies: 68
-- Name: COLUMN pg_subscription.oid; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(oid) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4534 (class 0 OID 0)
-- Dependencies: 68
-- Name: COLUMN pg_subscription.subdbid; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subdbid) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4535 (class 0 OID 0)
-- Dependencies: 68
-- Name: COLUMN pg_subscription.subname; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subname) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4536 (class 0 OID 0)
-- Dependencies: 68
-- Name: COLUMN pg_subscription.subowner; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subowner) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4537 (class 0 OID 0)
-- Dependencies: 68
-- Name: COLUMN pg_subscription.subenabled; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subenabled) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4538 (class 0 OID 0)
-- Dependencies: 68
-- Name: COLUMN pg_subscription.subconninfo; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subconninfo) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4539 (class 0 OID 0)
-- Dependencies: 68
-- Name: COLUMN pg_subscription.subslotname; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subslotname) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4540 (class 0 OID 0)
-- Dependencies: 68
-- Name: COLUMN pg_subscription.subsynccommit; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subsynccommit) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4541 (class 0 OID 0)
-- Dependencies: 68
-- Name: COLUMN pg_subscription.subpublications; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subpublications) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4542 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE canal; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "REDACTED";


--
-- TOC entry 4548 (class 0 OID 0)
-- Dependencies: 249
-- Name: TABLE canal_lecture; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal_lecture TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal_lecture TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal_lecture TO "REDACTED";


--
-- TOC entry 4550 (class 0 OID 0)
-- Dependencies: 248
-- Name: SEQUENCE canal_lecture_id_canal_lecture_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.canal_lecture_id_canal_lecture_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.canal_lecture_id_canal_lecture_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.canal_lecture_id_canal_lecture_seq TO "REDACTED";


--
-- TOC entry 4551 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "REDACTED";


--
-- TOC entry 4552 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "REDACTED";


--
-- TOC entry 4555 (class 0 OID 0)
-- Dependencies: 253
-- Name: TABLE membre_canal; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_canal TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_canal TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_canal TO "REDACTED";


--
-- TOC entry 4557 (class 0 OID 0)
-- Dependencies: 252
-- Name: SEQUENCE membre_canal_id_membre_canal_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.membre_canal_id_membre_canal_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.membre_canal_id_membre_canal_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.membre_canal_id_membre_canal_seq TO "REDACTED";


--
-- TOC entry 4558 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE membre_workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "REDACTED";


--
-- TOC entry 4559 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE message; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "REDACTED";


--
-- TOC entry 4560 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE message_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "REDACTED";


--
-- TOC entry 4561 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE message_hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "REDACTED";


--
-- TOC entry 4562 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE message_mention; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "REDACTED";


--
-- TOC entry 4564 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE message_prive; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "REDACTED";


--
-- TOC entry 4565 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE message_prive_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "REDACTED";


--
-- TOC entry 4566 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE message_read; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_read TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_read TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_read TO "REDACTED";


--
-- TOC entry 4568 (class 0 OID 0)
-- Dependencies: 243
-- Name: SEQUENCE message_read_id_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.message_read_id_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.message_read_id_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.message_read_id_seq TO "REDACTED";


--
-- TOC entry 4569 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE message_with_alias; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "REDACTED";


--
-- TOC entry 4570 (class 0 OID 0)
-- Dependencies: 245
-- Name: TABLE notification; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "REDACTED";


--
-- TOC entry 4571 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "REDACTED";


--
-- TOC entry 4572 (class 0 OID 0)
-- Dependencies: 247
-- Name: TABLE private_message_reaction; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.private_message_reaction TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.private_message_reaction TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.private_message_reaction TO "REDACTED";


--
-- TOC entry 4574 (class 0 OID 0)
-- Dependencies: 246
-- Name: SEQUENCE private_message_reaction_id_reaction_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.private_message_reaction_id_reaction_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.private_message_reaction_id_reaction_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.private_message_reaction_id_reaction_seq TO "REDACTED";


--
-- TOC entry 4575 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "REDACTED";


--
-- TOC entry 4577 (class 0 OID 0)
-- Dependencies: 237
-- Name: SEQUENCE push_subscriptions_id_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "REDACTED";


--
-- TOC entry 4578 (class 0 OID 0)
-- Dependencies: 241
-- Name: TABLE reaction; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "REDACTED";


--
-- TOC entry 4580 (class 0 OID 0)
-- Dependencies: 240
-- Name: SEQUENCE reaction_id_reaction_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "REDACTED";


--
-- TOC entry 4581 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE reminders; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reminders TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reminders TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reminders TO "REDACTED";


--
-- TOC entry 4582 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE role; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "REDACTED";


--
-- TOC entry 4583 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE role_permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "REDACTED";


--
-- TOC entry 4584 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE statut; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "REDACTED";


--
-- TOC entry 4585 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE utilisateur; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "REDACTED";


--
-- TOC entry 4586 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "REDACTED";


--
-- TOC entry 4587 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE workspace_favoris; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "REDACTED";


--
-- TOC entry 4589 (class 0 OID 0)
-- Dependencies: 235
-- Name: SEQUENCE workspace_favoris_id_workspace_favoris_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "REDACTED";


--
-- TOC entry 4592 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE workspace_invitations; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "REDACTED";


--
-- TOC entry 4593 (class 0 OID 0)
-- Dependencies: 251
-- Name: TABLE workspace_join_requests; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_join_requests TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_join_requests TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_join_requests TO "REDACTED";


--
-- TOC entry 4595 (class 0 OID 0)
-- Dependencies: 250
-- Name: SEQUENCE workspace_join_requests_id_request_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.workspace_join_requests_id_request_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_join_requests_id_request_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_join_requests_id_request_seq TO "REDACTED";


--
-- TOC entry 2197 (class 826 OID 65747)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "REDACTED";


--
-- TOC entry 2196 (class 826 OID 65746)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "REDACTED";


-- Completed on 2025-05-30 10:32:47

--
-- PostgreSQL database dump complete
--

