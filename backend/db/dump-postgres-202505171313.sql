--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 17.2

-- Started on 2025-05-17 13:13:36

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
-- TOC entry 4374 (class 1262 OID 5)
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
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 4374
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: azure_pg_admin
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- TOC entry 7 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: azure_pg_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO azure_pg_admin;

--
-- TOC entry 3 (class 3079 OID 24756)
-- Name: azure; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS azure WITH SCHEMA pg_catalog;


--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION azure; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION azure IS 'azure extension for PostgreSQL service';


--
-- TOC entry 2 (class 3079 OID 24577)
-- Name: pgaadauth; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgaadauth WITH SCHEMA pg_catalog;


--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgaadauth; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgaadauth IS 'Azure Active Directory Authentication';


--
-- TOC entry 253 (class 1255 OID 81930)
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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 82251)
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
-- TOC entry 247 (class 1259 OID 286780)
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
-- TOC entry 4456 (class 0 OID 0)
-- Dependencies: 247
-- Name: TABLE canal_lecture; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.canal_lecture IS 'Enregistre quand un utilisateur a lu un canal pour la dernière fois';


--
-- TOC entry 4457 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN canal_lecture.id_canal_lecture; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.canal_lecture.id_canal_lecture IS 'Identifiant unique de l''enregistrement de lecture';


--
-- TOC entry 4458 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN canal_lecture.fk_utilisateur; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.canal_lecture.fk_utilisateur IS 'Identifiant de l''utilisateur qui a lu le canal';


--
-- TOC entry 4459 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN canal_lecture.fk_canal; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.canal_lecture.fk_canal IS 'Identifiant du canal qui a été lu';


--
-- TOC entry 4460 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN canal_lecture.derniere_lecture; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.canal_lecture.derniere_lecture IS 'Date et heure de la dernière lecture du canal par l''utilisateur';


--
-- TOC entry 246 (class 1259 OID 286779)
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
-- TOC entry 4462 (class 0 OID 0)
-- Dependencies: 246
-- Name: canal_lecture_id_canal_lecture_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.canal_lecture_id_canal_lecture_seq OWNED BY public.canal_lecture.id_canal_lecture;


--
-- TOC entry 222 (class 1259 OID 82281)
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
-- TOC entry 225 (class 1259 OID 82301)
-- Name: hashtag; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.hashtag (
    id_hashtag uuid DEFAULT public.random_uuid() NOT NULL,
    label character varying(255) NOT NULL
);


ALTER TABLE public.hashtag OWNER TO rootmath;

--
-- TOC entry 226 (class 1259 OID 82307)
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
-- TOC entry 221 (class 1259 OID 82264)
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
-- TOC entry 228 (class 1259 OID 82345)
-- Name: message_fichier; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message_fichier (
    fk_message uuid NOT NULL,
    fk_fichier uuid NOT NULL
);


ALTER TABLE public.message_fichier OWNER TO rootmath;

--
-- TOC entry 229 (class 1259 OID 82360)
-- Name: message_hashtag; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message_hashtag (
    fk_message uuid NOT NULL,
    fk_hashtag uuid NOT NULL
);


ALTER TABLE public.message_hashtag OWNER TO rootmath;

--
-- TOC entry 230 (class 1259 OID 82375)
-- Name: message_mention; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message_mention (
    fk_message uuid NOT NULL,
    fk_utilisateur uuid NOT NULL
);


ALTER TABLE public.message_mention OWNER TO rootmath;

--
-- TOC entry 237 (class 1259 OID 229490)
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
-- TOC entry 4471 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE message_prive; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.message_prive IS 'Stocke les messages privés échangés entre deux utilisateurs';


--
-- TOC entry 232 (class 1259 OID 122921)
-- Name: message_prive_fichier; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.message_prive_fichier (
    fk_message_prive uuid NOT NULL,
    fk_fichier uuid NOT NULL
);


ALTER TABLE public.message_prive_fichier OWNER TO rootmath;

--
-- TOC entry 242 (class 1259 OID 253972)
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
-- TOC entry 241 (class 1259 OID 253971)
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
-- TOC entry 4475 (class 0 OID 0)
-- Dependencies: 241
-- Name: message_read_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.message_read_id_seq OWNED BY public.message_read.id;


--
-- TOC entry 240 (class 1259 OID 245848)
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
-- TOC entry 243 (class 1259 OID 262207)
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
-- TOC entry 224 (class 1259 OID 82295)
-- Name: permission; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.permission (
    id_permission uuid DEFAULT public.random_uuid() NOT NULL,
    type_permission character varying(50) NOT NULL
);


ALTER TABLE public.permission OWNER TO rootmath;

--
-- TOC entry 245 (class 1259 OID 278627)
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
-- TOC entry 244 (class 1259 OID 278626)
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
-- TOC entry 4481 (class 0 OID 0)
-- Dependencies: 244
-- Name: private_message_reaction_id_reaction_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.private_message_reaction_id_reaction_seq OWNED BY public.private_message_reaction.id_reaction;


--
-- TOC entry 236 (class 1259 OID 229471)
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
-- TOC entry 235 (class 1259 OID 229470)
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
-- TOC entry 4484 (class 0 OID 0)
-- Dependencies: 235
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- TOC entry 239 (class 1259 OID 245825)
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
-- TOC entry 238 (class 1259 OID 245824)
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
-- TOC entry 4487 (class 0 OID 0)
-- Dependencies: 238
-- Name: reaction_id_reaction_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.reaction_id_reaction_seq OWNED BY public.reaction.id_reaction;


--
-- TOC entry 223 (class 1259 OID 82290)
-- Name: role; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.role (
    id_role integer NOT NULL,
    nom_role character varying(50) NOT NULL
);


ALTER TABLE public.role OWNER TO rootmath;

--
-- TOC entry 231 (class 1259 OID 82390)
-- Name: role_permission; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.role_permission (
    fk_role integer NOT NULL,
    fk_permission uuid NOT NULL
);


ALTER TABLE public.role_permission OWNER TO rootmath;

--
-- TOC entry 217 (class 1259 OID 82219)
-- Name: statut; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.statut (
    id_statut integer NOT NULL,
    label character varying(255) NOT NULL
);


ALTER TABLE public.statut OWNER TO rootmath;

--
-- TOC entry 218 (class 1259 OID 82224)
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
-- TOC entry 219 (class 1259 OID 82243)
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
-- TOC entry 234 (class 1259 OID 229396)
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
-- TOC entry 233 (class 1259 OID 229395)
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
-- TOC entry 4495 (class 0 OID 0)
-- Dependencies: 233
-- Name: workspace_favoris_id_workspace_favoris_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.workspace_favoris_id_workspace_favoris_seq OWNED BY public.workspace_favoris.id_workspace_favoris;


--
-- TOC entry 227 (class 1259 OID 82327)
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
-- TOC entry 4497 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE workspace_invitations; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.workspace_invitations IS 'Stocke les invitations envoyées aux utilisateurs pour rejoindre un workspace';


--
-- TOC entry 4498 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN workspace_invitations.token_invitation; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.workspace_invitations.token_invitation IS 'Token unique pour accepter l''invitation';


--
-- TOC entry 249 (class 1259 OID 294943)
-- Name: workspace_requests; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.workspace_requests (
    id_request integer NOT NULL,
    fk_utilisateur uuid NOT NULL,
    fk_workspace uuid NOT NULL,
    is_accepted boolean DEFAULT false,
    is_invitation boolean DEFAULT false,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_reponse timestamp without time zone
);


ALTER TABLE public.workspace_requests OWNER TO rootmath;

--
-- TOC entry 4500 (class 0 OID 0)
-- Dependencies: 249
-- Name: TABLE workspace_requests; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.workspace_requests IS 'Stocke les invitations et demandes d''adhésion à un workspace';


--
-- TOC entry 4501 (class 0 OID 0)
-- Dependencies: 249
-- Name: COLUMN workspace_requests.is_accepted; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.workspace_requests.is_accepted IS 'Indique si la demande a été acceptée';


--
-- TOC entry 4502 (class 0 OID 0)
-- Dependencies: 249
-- Name: COLUMN workspace_requests.is_invitation; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.workspace_requests.is_invitation IS 'True si invitation envoyée par admin, False si demande d''adhésion par l''utilisateur';


--
-- TOC entry 248 (class 1259 OID 294942)
-- Name: workspace_requests_id_request_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.workspace_requests_id_request_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workspace_requests_id_request_seq OWNER TO rootmath;

--
-- TOC entry 4504 (class 0 OID 0)
-- Dependencies: 248
-- Name: workspace_requests_id_request_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.workspace_requests_id_request_seq OWNED BY public.workspace_requests.id_request;


--
-- TOC entry 4064 (class 2604 OID 286783)
-- Name: canal_lecture id_canal_lecture; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture ALTER COLUMN id_canal_lecture SET DEFAULT nextval('public.canal_lecture_id_canal_lecture_seq'::regclass);


--
-- TOC entry 4057 (class 2604 OID 253975)
-- Name: message_read id; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_read ALTER COLUMN id SET DEFAULT nextval('public.message_read_id_seq'::regclass);


--
-- TOC entry 4062 (class 2604 OID 278630)
-- Name: private_message_reaction id_reaction; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction ALTER COLUMN id_reaction SET DEFAULT nextval('public.private_message_reaction_id_reaction_seq'::regclass);


--
-- TOC entry 4047 (class 2604 OID 229474)
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- TOC entry 4055 (class 2604 OID 245828)
-- Name: reaction id_reaction; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction ALTER COLUMN id_reaction SET DEFAULT nextval('public.reaction_id_reaction_seq'::regclass);


--
-- TOC entry 4045 (class 2604 OID 229399)
-- Name: workspace_favoris id_workspace_favoris; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris ALTER COLUMN id_workspace_favoris SET DEFAULT nextval('public.workspace_favoris_id_workspace_favoris_seq'::regclass);


--
-- TOC entry 4066 (class 2604 OID 294946)
-- Name: workspace_requests id_request; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_requests ALTER COLUMN id_request SET DEFAULT nextval('public.workspace_requests_id_request_seq'::regclass);


--
-- TOC entry 4340 (class 0 OID 82251)
-- Dependencies: 220
-- Data for Name: canal; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.canal (id_canal, nom, is_private, date_creation, fk_workspace, updated_at) FROM stdin;
84f03094-c2df-24d7-6257-8bf9e1993b58	test	f	2025-04-26 16:56:38.164983	d4f1cff0-3ef5-7ab1-e654-c05894915c31	\N
07d1837c-59fe-d357-906a-acd22d3e162a	Horraire	f	2025-04-28 07:24:23.988836	d4f1cff0-3ef5-7ab1-e654-c05894915c31	\N
b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	files	f	2025-04-28 13:08:05.531983	d4f1cff0-3ef5-7ab1-e654-c05894915c31	\N
5d159045-e695-98e8-8462-5f5108f021ee	sdmknvnsdkm	f	2025-05-08 12:11:22.980095	6eeddc21-d56a-e978-b0c1-384e3f6cf186	\N
167bf6dc-b1d2-8d1a-e9c7-00e50b2916cb	aa	f	2025-05-08 14:27:45.450127	c6d5d602-9fd0-99c7-1654-65c23b0cd792	\N
de06e22f-9eeb-4a6d-351c-9e5143b4edbf	nouveau canal	f	2025-05-12 11:31:05.549489	4e94fed5-a879-6084-8eb7-ace5aa6c6236	\N
\.


--
-- TOC entry 4366 (class 0 OID 286780)
-- Dependencies: 247
-- Data for Name: canal_lecture; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.canal_lecture (id_canal_lecture, fk_utilisateur, fk_canal, derniere_lecture) FROM stdin;
18	c8eb671d-f3b4-41f6-7364-0f292619dfdc	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-08 12:12:42.020316+00
23	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-13 14:37:13.865407+00
31	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-13 09:31:10.678433+00
16	c8eb671d-f3b4-41f6-7364-0f292619dfdc	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-13 14:51:55.819467+00
37	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	de06e22f-9eeb-4a6d-351c-9e5143b4edbf	2025-05-13 09:37:39.245876+00
26	a5c1b268-937f-af11-4ca2-2c96634fbe2e	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-17 10:13:15.522117+00
12	bb6a4d43-70d3-5e36-d943-dfdfc747491f	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-09 11:16:29.06003+00
21	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-08 11:06:01.374568+00
27	a5c1b268-937f-af11-4ca2-2c96634fbe2e	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-12 14:26:55.245771+00
22	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-08 11:53:09.049001+00
17	c8eb671d-f3b4-41f6-7364-0f292619dfdc	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-13 12:13:49.088375+00
13	bb6a4d43-70d3-5e36-d943-dfdfc747491f	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-13 14:35:40.520812+00
28	a5c1b268-937f-af11-4ca2-2c96634fbe2e	5d159045-e695-98e8-8462-5f5108f021ee	2025-05-17 10:18:30.347665+00
19	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	07d1837c-59fe-d357-906a-acd22d3e162a	2025-05-17 10:34:19.183523+00
25	a5c1b268-937f-af11-4ca2-2c96634fbe2e	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-12 14:47:03.012194+00
14	bb6a4d43-70d3-5e36-d943-dfdfc747491f	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	2025-05-13 13:36:18.899896+00
20	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	84f03094-c2df-24d7-6257-8bf9e1993b58	2025-05-08 11:53:10.945575+00
30	c8eb671d-f3b4-41f6-7364-0f292619dfdc	5d159045-e695-98e8-8462-5f5108f021ee	2025-05-08 13:37:30.282456+00
\.


--
-- TOC entry 4342 (class 0 OID 82281)
-- Dependencies: 222
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
\.


--
-- TOC entry 4345 (class 0 OID 82301)
-- Dependencies: 225
-- Data for Name: hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.hashtag (id_hashtag, label) FROM stdin;
\.


--
-- TOC entry 4346 (class 0 OID 82307)
-- Dependencies: 226
-- Data for Name: membre_workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.membre_workspace (fk_utilisateur, fk_workspace, fk_role, ordre) FROM stdin;
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c6d5d602-9fd0-99c7-1654-65c23b0cd792	3	0
c8eb671d-f3b4-41f6-7364-0f292619dfdc	d4f1cff0-3ef5-7ab1-e654-c05894915c31	1	0
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
bb6a4d43-70d3-5e36-d943-dfdfc747491f	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
a5c1b268-937f-af11-4ca2-2c96634fbe2e	d4f1cff0-3ef5-7ab1-e654-c05894915c31	3	0
c8eb671d-f3b4-41f6-7364-0f292619dfdc	6eeddc21-d56a-e978-b0c1-384e3f6cf186	1	0
bb6a4d43-70d3-5e36-d943-dfdfc747491f	c6d5d602-9fd0-99c7-1654-65c23b0cd792	3	0
bb6a4d43-70d3-5e36-d943-dfdfc747491f	4e94fed5-a879-6084-8eb7-ace5aa6c6236	3	0
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	4e94fed5-a879-6084-8eb7-ace5aa6c6236	2	0
fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
a5c1b268-937f-af11-4ca2-2c96634fbe2e	c6d5d602-9fd0-99c7-1654-65c23b0cd792	3	0
\.


--
-- TOC entry 4341 (class 0 OID 82264)
-- Dependencies: 221
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
\.


--
-- TOC entry 4348 (class 0 OID 82345)
-- Dependencies: 228
-- Data for Name: message_fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_fichier (fk_message, fk_fichier) FROM stdin;
\.


--
-- TOC entry 4349 (class 0 OID 82360)
-- Dependencies: 229
-- Data for Name: message_hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_hashtag (fk_message, fk_hashtag) FROM stdin;
\.


--
-- TOC entry 4350 (class 0 OID 82375)
-- Dependencies: 230
-- Data for Name: message_mention; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_mention (fk_message, fk_utilisateur) FROM stdin;
\.


--
-- TOC entry 4357 (class 0 OID 229490)
-- Dependencies: 237
-- Data for Name: message_prive; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_prive (id_message_prive, contenu, date_envoi, date_lecture, fk_expediteur, fk_destinataire, pieces_jointes, date_creation, date_modification, is_deleted, parent_id) FROM stdin;
1aa8c3f9-8845-1da3-cd89-cde7d561d68e	test	2025-05-13 11:44:23.554789	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-13 11:44:23.554789	\N	f	\N
88563c46-7439-0579-7a8a-b644f5f2ac3f	[message supprimé]	2025-05-13 09:52:30.4524	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	25c01514-5c67-6921-1cfa-6261c29e5d88	[]	2025-05-13 09:52:30.4524	2025-05-13 11:48:13.651445	t	\N
3ef54608-bbe0-302b-15c2-c96c8f6749ed	yo	2025-05-13 13:32:26.181742	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 13:32:26.181742	\N	f	\N
56292f5c-df98-e436-c550-55a411fd4940	fqdsf	2025-05-13 13:30:07.403234	2025-05-13 13:39:43.003494	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:30:07.403234	\N	f	\N
5069c009-5c36-25bb-91ce-ad464d6ba33d	Salut	2025-05-13 11:04:23.993568	2025-05-13 11:56:42.610239	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 11:04:23.993568	\N	f	\N
79631e5f-1b3e-40ce-58f6-9f000bcea0be	[message supprimé]	2025-05-13 12:19:37.429169	2025-05-13 12:19:37.600264	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 12:19:37.429169	2025-05-13 12:19:43.282502	t	\N
b30a055c-174b-3ac3-07fa-dff5661dfff1	sf	2025-05-13 13:40:05.478956	2025-05-13 13:41:12.110349	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:05.478956	\N	f	\N
b02d4008-691d-ab4b-31a4-f18521ed30fc	qsfqsf	2025-05-13 12:57:26.009261	2025-05-13 12:57:53.260008	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 12:57:26.009261	\N	f	\N
e5afd316-3383-5e22-8895-84b73b0e7cc4	f	2025-05-13 13:40:14.866431	2025-05-13 13:41:12.134399	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:14.866431	\N	f	\N
e7f536d4-4e31-a0f4-561a-38cda5e5376d	yo	2025-05-12 11:36:56.271059	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	25c01514-5c67-6921-1cfa-6261c29e5d88	[]	2025-05-12 11:36:56.271059	\N	f	\N
53b236b3-3afb-4854-7b54-1ee615839266	couille	2025-05-13 11:57:55.103499	2025-05-13 12:50:15.447679	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:57:55.103499	\N	f	\N
aff833cc-a10c-b0d2-6e31-6ac794993d7c	Salut	2025-05-17 10:24:53.477371	2025-05-17 10:25:11.180343	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 10:24:53.477371	\N	f	\N
c70202d6-dd8f-37c2-d0c6-68c404137632	[message supprimé]	2025-05-17 09:43:09.981632	2025-05-17 11:12:13.205745	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"0eea74ab-f389-0dea-f281-570cbb2f9eaa\\"}]"	2025-05-17 09:43:09.981632	2025-05-17 09:43:13.7118	t	\N
ffbd5343-294a-a924-8a3e-b2737112f006	Salut	2025-05-17 11:13:35.939341	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 11:13:35.939341	\N	f	\N
89412d78-aae2-5f60-f03b-52a623ccaa94	szgzsefs	2025-05-05 12:32:07.066811	2025-05-05 13:15:56.472228	c8eb671d-f3b4-41f6-7364-0f292619dfdc	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-05 12:32:07.066811	\N	f	31e6be05-e6a0-a406-2e2d-108c6433ea62
f9a2f7e3-96fa-b666-89cb-b3f15fbebaae	qsfqfqs	2025-05-13 14:22:04.068406	2025-05-13 14:25:14.788555	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:04.068406	\N	f	\N
a0b91305-5fbb-2e91-55c3-86e2f76f9409	qsfqs	2025-05-13 14:19:14.2812	2025-05-13 14:39:10.493273	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:19:14.2812	\N	f	\N
77876650-6661-98b1-83f6-4e72c2a63fad	ts	2025-05-13 09:09:13.632673	2025-05-13 09:14:32.934981	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 09:09:13.632673	\N	f	\N
5dfb556b-ade4-3a4e-3532-9eaea424e819	qsdqs	2025-05-13 14:30:16.027642	2025-05-13 14:39:10.505397	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:30:16.027642	\N	f	\N
e20487ea-df6a-a3e2-b876-7aa0c059a5bc	e	2025-05-13 09:32:08.470898	2025-05-13 09:34:48.962187	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:32:08.470898	\N	f	\N
b13c1680-37d9-4f52-5572-a006d98113cc	qsdf	2025-05-13 14:40:58.760838	2025-05-13 14:51:06.865867	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:40:58.760838	\N	f	\N
a9799d4e-3030-bbb1-a009-b372f37b2582	 vcb	2025-05-13 09:46:46.605281	2025-05-13 09:47:04.534138	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:46.605281	\N	f	\N
5f8241dd-b386-7737-90bb-cffc3dd33928	cs	2025-05-13 09:46:42.748881	2025-05-13 09:47:04.535117	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:42.748881	\N	f	\N
279b41cb-6248-e682-9681-76e66490495e	vb	2025-05-13 09:46:48.88133	2025-05-13 09:47:04.555187	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:48.88133	\N	f	\N
9906ff04-5266-178b-e907-eb6e203dda52	cv	2025-05-13 09:46:49.914802	2025-05-13 09:47:04.561305	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:46:49.914802	\N	f	\N
de6cae4a-6470-6f86-c102-1b9487ca57d1	[message supprimé]	2025-04-29 11:29:41.539153	2025-04-29 13:00:17.373281	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-04-29 11:29:41.539153	2025-05-17 10:16:13.324776	t	\N
9b233f49-6c86-9718-184c-ccacb44e17e0	[Message d'un utilisateur supprimé]	2025-04-29 12:40:25.070744	2025-04-29 12:58:46.689839	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-04-29 12:40:25.070744	\N	f	\N
8f08b24a-5992-bfbd-c38f-7889116fc92f	[Message d'un utilisateur supprimé]	2025-04-30 14:09:04.988956	2025-04-30 14:16:14.9575	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-04-30 14:09:04.988956	\N	f	\N
bd2a217e-caac-4d11-d860-d4ab389e7eb9	[message supprimé]	2025-05-13 07:52:26.032021	2025-05-13 08:09:29.479214	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 07:52:26.032021	2025-05-17 10:16:13.324776	t	\N
d1edadd8-b4fb-fef0-a47a-36746cb8fc09	[Message d'un utilisateur supprimé]	2025-05-04 17:10:16.59356	2025-05-04 17:11:56.251916	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-04 17:10:16.59356	\N	f	\N
a263c8da-7f56-78b9-58fd-7a7493d5f9f6	[message supprimé]	2025-05-13 14:09:59.20211	2025-05-13 14:13:24.521525	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:09:59.20211	2025-05-17 10:16:13.324776	t	\N
b6065911-79f8-36f6-faf9-459ffcad909c	[Message d'un utilisateur supprimé]	2025-04-30 12:51:14.986106	2025-04-30 12:51:29.628045	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 12:51:14.986106	\N	f	\N
811f6a89-142c-528e-94a7-467ca961ee8c	[Message d'un utilisateur supprimé]	2025-04-29 12:59:28.945118	2025-04-29 13:08:29.12446	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:59:28.945118	\N	f	\N
30f71474-1057-672f-bbe2-3a874ae23752	[Message d'un utilisateur supprimé]	2025-04-29 12:59:46.93003	2025-04-29 13:08:29.124931	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:59:46.93003	\N	f	\N
7ba83df2-367b-08d9-9928-1ed68e563440	Test\n	2025-05-13 08:07:02.995242	2025-05-13 09:00:00.545667	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 08:07:02.995242	\N	f	\N
f4532c97-28a6-6088-6dee-6adba7dcda11	Salut 	2025-05-13 08:18:13.498526	2025-05-13 09:00:00.547545	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 08:18:13.498526	\N	f	\N
1f2f3c4b-4ed1-b751-e60e-1a25b5b06633	[Message d'un utilisateur supprimé]	2025-04-29 14:07:53.419589	2025-04-29 14:13:35.712723	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:07:53.419589	\N	f	\N
ceb10cbf-517e-5633-b29a-fb975aa681fe	JDJDJSDJSD	2025-05-13 11:37:37.896215	2025-05-13 11:38:10.42742	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:37:37.896215	\N	f	\N
97556963-45dd-f950-383a-d2942140e026	gfd	2025-05-13 11:24:33.019101	2025-05-13 11:33:06.285817	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:33.019101	\N	f	\N
a4376d6f-b675-b665-12b8-fb67d6eedf57	sdf	2025-05-13 11:24:30.839788	2025-05-13 11:33:06.284911	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:30.839788	\N	f	\N
cdb7c7d6-0431-9dcf-9969-27b2136a4100	efez	2025-05-13 11:27:28.58524	2025-05-13 11:33:06.446457	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:28.58524	\N	f	\N
cbed91cb-7fe4-b8ad-84b6-d55499636137	[Message d'un utilisateur supprimé]	2025-04-30 13:41:37.754001	2025-04-30 13:55:36.559534	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 13:41:37.754001	\N	f	\N
8cc4c82d-58cf-9b21-8f04-e58a1b55a9dd	[Message d'un utilisateur supprimé]	2025-05-04 14:58:23.917359	2025-05-04 15:00:37.540166	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:58:23.917359	\N	f	\N
c9aecf3e-d97c-6e5a-6f2f-717f386f118d	[Message d'un utilisateur supprimé]	2025-04-29 12:48:58.729671	2025-04-29 12:58:37.630627	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:48:58.729671	\N	f	\N
d7b6ce00-ab93-db6e-d545-2fb68bc7f905	[Message d'un utilisateur supprimé]	2025-04-29 12:52:20.804243	2025-04-29 12:58:37.630683	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:52:20.804243	\N	f	\N
777adb41-46aa-177d-bd3e-dcafe75e2100	[Message d'un utilisateur supprimé]	2025-05-06 13:40:33.945309	2025-05-08 09:16:33.660804	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-06 13:40:33.945309	\N	f	\N
d5933c0e-da5c-6e4e-c9e9-3d303164d782	[Message d'un utilisateur supprimé]	2025-04-30 14:14:21.17032	2025-04-30 14:16:14.746744	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 14:14:21.17032	\N	f	\N
b9414322-70d0-f356-c566-f0fb8aeb8b24	[Message d'un utilisateur supprimé]	2025-05-04 13:44:58.193466	2025-05-04 13:45:01.189915	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 13:44:58.193466	\N	f	\N
26101c30-68ab-b1da-d4f8-3c06d06cabd6	[Message d'un utilisateur supprimé]	2025-05-13 11:41:09.053795	2025-05-13 11:43:29.498564	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-13 11:41:09.053795	\N	f	\N
62b57b9a-ceee-e47f-cf09-0d6a674af885	[message supprimé]	2025-05-04 15:46:53.1236	2025-05-04 15:52:56.810593	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:46:53.1236	2025-05-17 10:16:13.324776	t	\N
92239247-6469-ba6b-31b1-e9cdac011031	s,gsfd	2025-05-13 11:45:17.152454	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-13 11:45:17.152454	\N	f	\N
e412564d-edd2-22c6-a21b-668d16e447c7	qdfqs	2025-05-13 13:22:18.125265	2025-05-13 13:30:03.781437	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:22:18.125265	\N	f	\N
cbb18ff9-a0b0-1369-b275-02e84b35f5da	Test	2025-05-17 09:44:40.621128	2025-05-17 11:12:13.147807	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:40.621128	\N	f	\N
ecee9a07-7132-2431-d916-bde020db2d09	test	2025-05-13 09:10:47.312275	2025-05-13 11:56:42.609884	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:10:47.312275	\N	f	\N
4ff595d7-da64-0693-7111-ea9a04522134	ogfdgfd	2025-05-13 11:58:04.618527	2025-05-13 11:58:07.935321	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:58:04.618527	\N	f	\N
79ad5e47-be08-f311-e14c-a8efc59366ab	fs	2025-05-13 13:40:08.43056	2025-05-13 13:41:12.10944	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:08.43056	\N	f	\N
5f9a5faa-860b-2ccf-7df5-297aed1eeefd	ssf	2025-05-13 13:40:12.555829	2025-05-13 13:41:12.112152	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:12.555829	\N	f	\N
3a6bf250-4fac-82d5-78f8-46c17ef55a35	edfs	2025-05-17 10:24:57.970524	2025-05-17 10:25:11.184415	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 10:24:57.970524	\N	f	\N
f253ce1e-4281-9b03-be4a-5bdb1947e677	test	2025-05-13 07:56:38.209627	2025-05-13 09:34:48.675668	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:38.209627	\N	f	\N
915ac26d-7af7-c726-89f8-a25e71c2a7e1	Salut 	2025-05-13 07:56:29.995371	2025-05-13 09:34:48.674212	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:29.995371	\N	f	\N
035c217f-d20c-a295-9736-d49d458be394	Hey	2025-05-13 08:09:56.973696	2025-05-13 09:00:00.545405	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 08:09:56.973696	\N	f	\N
87333437-c229-c19b-87c1-5f02243c24ea	fgjvj	2025-05-13 07:56:45.804256	2025-05-13 09:34:48.673914	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:45.804256	\N	f	\N
72bf082f-2844-0118-ed36-eb435a2ad10b	V	2025-05-17 09:44:49.98725	2025-05-17 11:12:13.151228	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:49.98725	\N	f	\N
76e46b82-52a0-7a1a-e65a-8ed85fcec4c8	test	2025-05-13 09:39:50.758719	2025-05-13 09:40:43.034424	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:39:50.758719	\N	f	\N
ecfcf909-4d21-e74c-8f6d-a0b6cc639110	test	2025-05-13 09:47:09.872057	2025-05-13 09:47:09.977292	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:09.872057	\N	f	\N
0e8c0058-36bd-e286-2840-7d0619fe9371	sdf	2025-05-13 13:41:51.500779	2025-05-13 13:59:55.116252	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:51.500779	\N	f	\N
60bc59c9-ba48-8f8a-ff6f-0dde639760ca	sfs	2025-05-13 14:10:05.894135	2025-05-13 14:15:07.331061	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:10:05.894135	\N	f	\N
d887f628-bb9a-f4a9-170a-f56c6f2afaf2	dgsd	2025-05-13 13:39:00.822833	2025-05-13 13:51:15.764231	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:00.822833	\N	f	\N
8be165f3-604f-d4da-f994-9bf5153b45e9	sdgsdgsd	2025-05-13 13:38:57.060408	2025-05-13 13:51:15.748356	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:38:57.060408	\N	f	\N
844bae5c-518e-f4f7-e742-c4d8503d3e29	dsgsdg	2025-05-13 13:38:59.087605	2025-05-13 13:51:15.748479	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:38:59.087605	\N	f	\N
26520fee-0d31-8ebf-a2fe-e4eb045041d5	sdgsg	2025-05-13 13:38:59.917091	2025-05-13 13:51:15.750236	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:38:59.917091	\N	f	\N
9467a64e-0d02-13f0-590c-2171a8d632e6	Holà	2025-05-13 09:52:42.21011	2025-05-13 11:04:13.185405	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:52:42.21011	\N	f	\N
ffa95c78-ab70-268d-3089-bc7f517113f1	qsfdqsf	2025-05-13 11:41:10.896592	2025-05-13 11:42:53.431686	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:41:10.896592	\N	f	\N
f42fe795-2155-59ab-b41b-99418887e6d9	[Message d'un utilisateur supprimé]	2025-04-29 13:51:37.524801	2025-04-29 13:57:55.46001	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 13:51:37.524801	\N	f	\N
d0d43718-7672-5390-fb49-06a45fef430b	[Message d'un utilisateur supprimé]	2025-05-04 13:48:43.502562	2025-05-04 13:55:55.328476	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 13:48:43.502562	\N	f	\N
e09071d1-05dc-31ae-1801-5797c41d3ea8	[Message d'un utilisateur supprimé]	2025-04-30 12:51:44.117834	2025-04-30 12:57:25.149309	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 12:51:44.117834	\N	f	\N
c566a813-ee11-6162-4a51-eff7a53bdfdf	zefzef	2025-05-13 11:24:05.600845	2025-05-13 11:33:06.284122	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:05.600845	\N	f	\N
734c3b3b-885c-b5d7-97c9-fe0213f1dd54	zef	2025-05-13 11:27:30.317158	2025-05-13 11:33:06.445836	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:30.317158	\N	f	\N
1720c21c-67b4-14b4-b606-3b69644f0533	sdgs	2025-05-13 13:39:00.643742	2025-05-13 13:51:15.750588	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:00.643742	\N	f	\N
d9e95fbe-8aa8-554e-0d75-3aa26fc53033	[Message d'un utilisateur supprimé]	2025-04-29 14:11:26.181723	2025-04-29 14:13:35.711366	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:11:26.181723	\N	f	\N
e714e1bf-de71-7e4c-1e6c-d6d5ebdda285	[Message d'un utilisateur supprimé]	2025-04-29 12:49:07.38283	2025-04-29 12:58:37.630087	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:49:07.38283	\N	f	\N
f6ec2263-9233-bd74-bda6-1b0790f75d1a	[Message d'un utilisateur supprimé]	2025-04-30 13:55:36.148456	2025-04-30 13:56:33.349379	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 13:55:36.148456	\N	f	\N
e2fc9f2a-4eca-b6c2-f67d-8b832d4b6e4f	[Message d'un utilisateur supprimé]	2025-05-04 16:35:37.397253	2025-05-04 17:02:02.986255	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 16:35:37.397253	\N	f	\N
3fda5fd2-2b12-4288-84a8-fb0d4cab9fc1	bite	2025-05-08 10:27:16.211963	2025-05-08 10:31:37.260285	bb6a4d43-70d3-5e36-d943-dfdfc747491f	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	[]	2025-05-08 10:27:16.211963	\N	f	\N
8ddbce78-c317-1bac-86c5-485255dfa85e	gsd	2025-05-13 13:39:01.17579	2025-05-13 13:51:15.766462	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:01.17579	\N	f	\N
72153dfa-1c10-6132-048f-b633fe928304	[Message d'un utilisateur supprimé]	2025-05-04 14:53:15.551773	2025-05-04 14:58:08.565405	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:53:15.551773	\N	f	\N
24dfadbf-fc68-a09c-06b2-b5617734010a	[Message d'un utilisateur supprimé]	2025-04-29 12:40:35.689867	2025-04-29 12:58:46.690555	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-04-29 12:40:35.689867	\N	f	\N
a59fbad2-bed8-f4e6-0666-a2e77f43f822	[Message d'un utilisateur supprimé]	2025-04-29 12:18:35.837173	2025-04-29 12:29:30.296242	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-04-29 12:18:35.837173	\N	f	\N
59cb476f-4342-e3cd-5a04-1a37d243a71d	[Message d'un utilisateur supprimé]	2025-05-04 14:53:01.688999	2025-05-04 14:58:14.360597	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-04 14:53:01.688999	\N	f	\N
1a0b3ae2-401a-ab70-d92c-48eb4cbcb445	gs	2025-05-13 13:39:01.002376	2025-05-13 13:51:15.766858	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:01.002376	\N	f	\N
70bbccda-a0b2-e0e1-776f-743ba7621ba7	fs	2025-05-13 13:41:54.864493	2025-05-13 13:59:55.133424	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:54.864493	\N	f	\N
7c9c522c-727f-22d2-0bf5-bab579e90f57	yo	2025-05-13 11:37:45.880735	2025-05-13 11:38:25.52913	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:37:45.880735	\N	f	\N
14428232-471d-df14-d2af-177d3235a10c	sd	2025-05-13 13:41:52.76013	2025-05-13 13:59:55.119033	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:52.76013	\N	f	\N
7576f236-3b81-e5b0-cc72-2875d9d6b2be	zefzef	2025-05-13 12:56:27.241921	2025-05-13 14:15:13.481729	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 12:56:27.241921	\N	f	\N
62b265d5-ade4-d21a-2fef-495d5dde8913	sf	2025-05-13 14:49:38.367099	2025-05-13 14:51:06.870787	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:49:38.367099	\N	f	\N
e215e1ab-0002-2978-2321-d63c20651f83	qds	2025-05-13 14:30:40.062715	2025-05-13 14:39:59.683129	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:30:40.062715	\N	f	\N
9675df1c-fd3d-b3c3-3640-ebda3cf716e6	qsf	2025-05-13 14:22:08.348961	2025-05-13 14:25:14.787459	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:08.348961	\N	f	\N
79a432c4-9023-8943-8f59-95dcffcb786d	ds	2025-05-13 14:30:48.160056	2025-05-13 14:39:59.685987	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:30:48.160056	\N	f	\N
36f4e23a-efbb-758e-2732-6aa139210ef8	[message supprimé]	2025-05-13 09:56:57.622764	2025-05-13 11:32:12.020195	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 09:56:57.622764	2025-05-17 10:16:13.324776	t	\N
63abde6c-9e05-6e49-356f-d47101640a3e	[message supprimé]	2025-05-13 11:23:53.01735	2025-05-13 11:32:06.079608	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:23:53.01735	2025-05-17 10:16:13.324776	t	\N
821ef307-b71c-5f71-e6f6-68489748dc3c	[message supprimé]	2025-05-13 11:32:39.287718	2025-05-13 11:33:19.483886	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:32:39.287718	2025-05-17 10:16:13.324776	t	\N
fd2a325d-a652-2b8e-bb23-f54c1e05370c	[message supprimé]	2025-05-04 15:08:30.003709	2025-05-04 15:09:46.069169	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:08:30.003709	2025-05-17 10:16:13.324776	t	\N
b43b7e18-d04f-f8cd-9d15-e07191af414a	qedfqsf	2025-05-13 11:58:11.953489	2025-05-13 12:09:29.373886	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:58:11.953489	\N	f	\N
d92e19d1-095d-ad7d-2184-2e930d662f81	Test	2025-05-17 09:44:46.093329	2025-05-17 11:12:13.150424	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:46.093329	\N	f	\N
9356e827-6fd8-7034-48b1-806a780f29e7	Bb	2025-05-17 09:44:50.889108	2025-05-17 11:12:13.1509	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:50.889108	\N	f	\N
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
79a9010d-5ee5-9650-03b6-3c9a2c631ad0	dsq	2025-05-13 09:47:19.88624	2025-05-13 09:47:19.914153	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:19.88624	\N	f	\N
16ec7512-537f-bc92-50fb-09a7419ff6ee	qsd	2025-05-13 09:47:20.768478	2025-05-13 09:47:20.833155	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:20.768478	\N	f	\N
5f1c107c-7e64-52b0-fbd7-a7f3de8558ec	erz	2025-05-13 09:47:42.534046	2025-05-13 09:47:53.936749	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:42.534046	\N	f	\N
b93cb808-2d76-9b10-00c9-1508b9d66c43	ze	2025-05-13 09:47:43.86932	2025-05-13 09:47:53.943724	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:43.86932	\N	f	\N
3ffc77c0-ac7b-982c-088a-4d2a8791f9b2	fsf	2025-05-13 13:40:08.925789	2025-05-13 13:41:12.108419	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:08.925789	\N	f	\N
3c6e5153-2788-77b5-b435-b4109c93a6a2	f	2025-05-13 13:40:09.693107	2025-05-13 13:41:12.113094	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:09.693107	\N	f	\N
8fd7bb4e-84ee-296c-e07b-8991b12ee2cf	merci	2025-05-08 10:29:36.578464	2025-05-08 10:32:24.254588	fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-08 10:29:36.578464	\N	f	\N
f7a19e82-afac-fec5-5d48-e1696370c021	Haha	2025-05-13 09:53:26.602736	2025-05-13 11:04:13.184795	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:53:26.602736	\N	f	\N
fc8fb666-2fbd-af27-c93d-4d1be8420aec	Test	2025-05-13 09:57:49.05053	2025-05-13 11:04:13.189512	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:57:49.05053	\N	f	\N
4fc21a83-9ef4-168e-bc20-ad9cd19b4a42	[Message d'un utilisateur supprimé]	2025-04-29 12:49:18.818334	2025-04-29 12:58:37.63058	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:49:18.818334	\N	f	\N
2d38db3f-065e-3625-1854-45304d304948	[Message d'un utilisateur supprimé]	2025-04-30 12:51:59.106413	2025-04-30 12:57:25.150537	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 12:51:59.106413	\N	f	\N
eaf16bb0-9c32-3b17-63f7-3b5d9783f1f4	[Message d'un utilisateur supprimé]	2025-04-29 13:51:58.562737	2025-04-29 14:02:46.778713	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 13:51:58.562737	\N	f	\N
8e3bc0be-2ad0-6518-2282-053329ae8fcc	caca	2025-05-13 11:38:12.090209	2025-05-13 11:38:25.530189	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:38:12.090209	\N	f	\N
a63afbae-3945-e8cc-02e3-bef08aa9095e	[Message d'un utilisateur supprimé]	2025-04-29 14:13:46.61287	2025-04-29 14:16:25.978534	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:13:46.61287	\N	f	\N
c4d2123f-b12e-6cc2-7fb0-77202dfe283d	test	2025-05-13 11:27:44.27392	2025-05-13 11:33:06.444424	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:44.27392	\N	f	\N
0264e59b-16cc-fcb3-8e17-07f2a75e4ddc	test	2025-05-13 11:27:39.233412	2025-05-13 11:33:06.444836	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:39.233412	\N	f	\N
eaa525d0-3d73-7d5c-4810-98705885cc0d	[Message d'un utilisateur supprimé]	2025-04-29 12:29:44.563262	2025-04-29 12:37:36.615153	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:29:44.563262	\N	f	\N
d8fb4d67-66d3-eed1-e8a9-14863e15c971	[Message d'un utilisateur supprimé]	2025-05-12 14:29:25.801268	2025-05-12 14:40:53.934057	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-12 14:29:25.801268	\N	f	\N
3006cff1-d2b7-ea90-2fbe-10eedc1822db	[Message d'un utilisateur supprimé]	2025-04-30 14:03:51.284271	2025-04-30 14:13:10.027903	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 14:03:51.284271	\N	f	\N
d176e838-ab26-6167-da62-aeec8acbf4dd	dqsfqfs	2025-05-13 11:32:55.60047	2025-05-13 11:33:06.624674	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:32:55.60047	\N	f	\N
b1feab0b-6330-c4d1-b07f-744740c64aaa	gdf	2025-05-13 11:33:01.10447	2025-05-13 11:33:06.626759	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:33:01.10447	\N	f	\N
130f3fad-046a-282e-1094-50190b4f616c	[Message d'un utilisateur supprimé]	2025-05-13 11:41:32.21025	2025-05-13 11:43:29.498681	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-13 11:41:32.21025	\N	f	\N
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
f97712c6-a02a-cbf2-5dd2-6a021192b5c1	rudy sida	2025-05-13 14:16:31.294063	2025-05-13 14:25:14.824033	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:31.294063	\N	f	\N
7b5c61af-4a2a-ca2c-4ff4-d3b003567c94	B	2025-05-17 09:44:51.703685	2025-05-17 11:12:13.15235	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:44:51.703685	\N	f	\N
2caf5280-a8b2-30ba-1d8b-11faa8d25fa1	[message supprimé]	2025-05-13 09:42:16.359393	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	25c01514-5c67-6921-1cfa-6261c29e5d88	[]	2025-05-13 09:42:16.359393	2025-05-13 11:48:13.651445	t	\N
cf2aa4cd-5ad7-4dca-df9d-7d0782c63b36	sdfsdf	2025-05-17 10:25:04.630657	2025-05-17 10:25:11.183763	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-17 10:25:04.630657	\N	f	\N
00005e78-b9fc-6634-8bb5-7c96a578f8d6	vg	2025-05-13 07:56:47.042471	2025-05-13 09:34:48.676371	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:47.042471	\N	f	\N
5bb3b3d3-2311-1317-cd50-9a975aa8e3cb	v	2025-05-13 07:56:48.323901	2025-05-13 09:34:48.679241	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 07:56:48.323901	\N	f	\N
57b1d26f-d169-031b-13c2-ccbf881ce00f	qsfqs	2025-05-13 09:14:23.055233	2025-05-13 09:34:48.853598	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.055233	\N	f	\N
bd6766fc-76d6-d451-bd90-207ed221b88c	q	2025-05-13 09:14:23.600444	2025-05-13 09:34:48.857128	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.600444	\N	f	\N
91b7dae6-2f6e-9180-f511-cec673897d01	sq	2025-05-13 09:14:23.950982	2025-05-13 09:34:48.862769	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.950982	\N	f	\N
14901abe-c656-3454-a393-434e4a19c015	[Message d'un utilisateur supprimé]	2025-05-08 13:24:38.894581	2025-05-08 14:25:11.638227	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-08 13:24:38.894581	\N	f	\N
752a2d6c-f5a3-0a3d-8e81-573bdc5669d9	test	2025-05-13 09:41:06.427615	2025-05-13 09:47:04.538041	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:41:06.427615	\N	f	\N
7d8d55df-4e36-faa3-c747-517ef04858b2	zef	2025-05-13 09:47:44.242145	2025-05-13 09:47:53.942594	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:44.242145	\N	f	\N
8b4654ad-a325-ade5-7dc6-a450514085f5	ezf	2025-05-13 09:47:43.168757	2025-05-13 09:47:53.945734	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:43.168757	\N	f	\N
49511ac5-8b30-96ec-7477-29dcd4cd0099	caca 	2025-05-13 09:53:35.923743	2025-05-13 09:53:36.035761	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:53:35.923743	\N	f	\N
11636889-c293-9ca9-8371-21968d98daa2	zef	2025-05-13 11:24:15.337393	2025-05-13 11:33:06.287693	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:15.337393	\N	f	\N
f55894a9-da50-e9ee-91f7-00824647642e	test	2025-05-13 11:27:49.690915	2025-05-13 11:33:06.443607	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:27:49.690915	\N	f	\N
1300bc25-c968-74ec-72d3-b565ad8b0217	qsf	2025-05-13 11:32:56.705878	2025-05-13 11:33:06.624812	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:32:56.705878	\N	f	\N
7f4358d3-70ce-d717-dbe6-ce2a224e0e94	sf	2025-05-13 13:40:12.848572	2025-05-13 13:41:12.114053	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:12.848572	\N	f	\N
e5b231fe-7d34-1aa7-23e4-034548bc1c10	s	2025-05-13 13:40:14.68857	2025-05-13 13:41:12.132147	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:40:14.68857	\N	f	\N
8e330760-9265-9dd3-ebc5-a62b1918c250	RUDY GOAT	2025-05-13 11:55:50.441257	2025-05-13 11:58:08.128372	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:55:50.441257	\N	f	\N
a2354d92-34c9-4d95-aed3-519fee8ef61d	LOUTRE	2025-05-13 12:53:11.67602	2025-05-13 13:22:23.614998	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:11.67602	\N	f	\N
58dd84bb-099b-75e5-5709-d403ee154fc5	[Message d'un utilisateur supprimé]	2025-04-29 14:16:18.591643	2025-04-29 14:16:25.979312	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:16:18.591643	\N	f	\N
a2127f32-d1bb-5f9f-fa0b-17afcacd5133	[Message d'un utilisateur supprimé]	2025-05-04 13:57:39.98085	2025-05-04 14:05:57.644513	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 13:57:39.98085	\N	f	\N
e32c7c2b-9d81-7d38-34c6-dc925458818f	[Message d'un utilisateur supprimé]	2025-04-29 12:29:52.968866	2025-04-29 12:37:36.614943	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:29:52.968866	\N	f	\N
bf15ecde-a57f-5337-6662-2017bf5101d5	[Message d'un utilisateur supprimé]	2025-05-04 15:14:29.905149	2025-05-04 15:17:00.985426	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 15:14:29.905149	\N	f	\N
7b981fa1-455f-b8f1-a978-d3825cebdac6	[Message d'un utilisateur supprimé]	2025-05-13 11:43:04.328253	2025-05-13 11:43:29.502707	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-13 11:43:04.328253	\N	f	\N
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
cdbf7852-3329-3965-e39a-5ffd2817e28c	[message supprimé]	2025-05-12 14:20:32.090631	2025-05-12 14:32:20.368276	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-12 14:20:32.090631	2025-05-17 10:16:13.324776	t	\N
ab5ea085-9e9e-5455-ed43-ce4bdd8f0a7d	[message supprimé]	2025-05-13 08:32:29.828948	2025-05-13 08:33:07.265113	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:29.828948	2025-05-17 10:16:13.324776	t	\N
b0882a2f-4628-ac6f-a27f-4d2caff60500	[message supprimé]	2025-05-13 09:57:26.422443	2025-05-13 11:32:12.021055	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 09:57:26.422443	2025-05-17 10:16:13.324776	t	\N
369915cb-c435-0f34-fc4c-70c3701765f8	d	2025-05-13 14:30:48.283314	2025-05-13 14:39:59.680819	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:30:48.283314	\N	f	\N
6b846588-edf3-b7fa-8361-fd7308fc353b	[message supprimé]	2025-05-13 11:04:46.421803	2025-05-13 11:04:55.620709	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:04:46.421803	2025-05-17 10:16:13.324776	t	\N
762acf4a-8823-7f20-f05f-1f19a87c19e8	[message supprimé]	2025-05-13 11:32:48.68848	2025-05-13 11:33:19.484816	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:32:48.68848	2025-05-17 10:16:13.324776	t	\N
fbd9630b-a9ec-f98f-f5cc-0c5f11514191	[message supprimé]	2025-05-04 13:53:11.886847	2025-05-04 14:44:41.317333	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 13:53:11.886847	2025-05-17 10:16:13.324776	t	\N
877997c5-35d5-8dde-c7c4-da29a9dfd6a8	[message supprimé]	2025-05-04 15:10:03.906143	2025-05-04 15:15:46.936315	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:10:03.906143	2025-05-17 10:16:13.324776	t	\N
8d3a8bb5-a4f8-608b-61e9-6551ef4cc191	[message supprimé]	2025-05-13 12:41:28.820796	2025-05-13 13:22:23.578283	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:41:28.820796	2025-05-17 10:16:13.324776	t	\N
f3c05d33-a7d3-b513-3de4-85ab05e09524	[message supprimé]	2025-04-29 13:54:49.287433	2025-04-30 12:08:40.782589	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.287433	2025-05-17 10:16:13.324776	t	\N
e93f6939-88d5-e093-7bc1-a6b17abedf42	B	2025-05-17 09:46:04.245476	2025-05-17 11:12:13.15352	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:46:04.245476	\N	f	\N
7dd68797-c190-ca55-bd10-eef950af4fc8	qsdqsd	2025-05-13 11:55:56.642427	2025-05-13 11:56:30.51491	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:55:56.642427	\N	f	\N
31e6be05-e6a0-a406-2e2d-108c6433ea62	sdgsdgs	2025-04-29 14:16:46.869163	2025-04-29 14:17:02.255504	c8eb671d-f3b4-41f6-7364-0f292619dfdc	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:16:46.869163	\N	f	\N
fd2371ba-3c9e-e90d-d0aa-6a904442d0ef	Test	2025-05-13 07:57:14.723503	2025-05-13 07:57:14.77219	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 07:57:14.723503	\N	f	\N
60154032-c50e-84ea-10b7-936ba3393d34	ghfgh	2025-05-13 08:36:50.277255	2025-05-13 09:34:48.829792	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:50.277255	\N	f	\N
b0a10290-4d45-c505-e433-666a1582759d	s	2025-05-13 09:14:23.773066	2025-05-13 09:34:48.857049	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:14:23.773066	\N	f	\N
d15f8738-f679-1baa-3d5d-b0fb850b57a0	f	2025-05-13 09:47:44.051841	2025-05-13 09:47:53.943224	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:47:44.051841	\N	f	\N
2c634c02-47f9-bf2b-af8b-1b893bb3ba8e	[Message d'un utilisateur supprimé]	2025-05-08 13:47:27.628617	2025-05-08 14:25:11.63396	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-08 13:47:27.628617	\N	f	\N
5f37ba8c-fb40-f1a2-d99a-5b35f20f18dc	sdf	2025-05-13 11:24:18.365239	2025-05-13 11:33:06.286838	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:18.365239	\N	f	\N
093866f6-22a7-bb7e-5fb3-581241ecdf6d	fg	2025-05-13 11:24:39.818924	2025-05-13 11:33:06.289589	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:39.818924	\N	f	\N
331e6939-f11b-f2ef-8c4d-be4f2d718369	d	2025-05-13 11:24:43.753579	2025-05-13 11:33:06.293536	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:43.753579	\N	f	\N
f49b684b-5ce7-a15a-0b58-1c1cc5fab215	test	2025-05-13 11:28:22.786131	2025-05-13 11:33:06.443669	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:28:22.786131	\N	f	\N
246286d5-1381-d469-ebc4-30c347bd77ac	ez	2025-05-13 11:33:02.463418	2025-05-13 11:33:06.625636	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:33:02.463418	\N	f	\N
93dc37d7-add0-8c63-39e0-5bf588311768	[Message d'un utilisateur supprimé]	2025-04-29 12:30:08.397192	2025-04-29 12:48:42.174266	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:30:08.397192	\N	f	\N
0b386fe2-c254-e6b7-bb1e-8e284c830318	Jdjd	2025-05-13 09:48:16.154546	2025-05-13 11:04:13.178924	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:48:16.154546	\N	f	\N
1a3e5ffe-9324-e27c-8921-ce0b8c7c2912	[Message d'un utilisateur supprimé]	2025-05-04 15:17:25.968743	2025-05-04 15:34:05.851345	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-04 15:17:25.968743	\N	f	\N
baa2cd64-de38-b2c3-2479-a894c867903d	yo	2025-05-13 12:05:38.101862	2025-05-13 12:19:07.947154	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 12:05:38.101862	\N	f	5ff0115f-dbcf-b7e3-837c-31d55bd219fe
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
6fa40a3f-7648-7884-2b81-6a4bef9c2fb6	[message supprimé]	2025-05-13 08:32:42.151903	2025-05-13 08:33:10.180224	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:42.151903	2025-05-17 10:16:13.324776	t	\N
684efacd-7fdc-5a78-805c-b62ce1cc0579	[message supprimé]	2025-05-13 08:32:42.869809	2025-05-13 08:33:10.180347	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:42.869809	2025-05-17 10:16:13.324776	t	\N
acfc972a-9306-0606-7ba7-c5a979fe36e8	[message supprimé]	2025-05-13 08:32:43.008792	2025-05-13 08:33:10.182792	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:43.008792	2025-05-17 10:16:13.324776	t	\N
1a20fb0d-5f57-c35d-119d-0d8f55025477	[message supprimé]	2025-05-13 08:32:43.16576	2025-05-13 08:33:10.182436	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:43.16576	2025-05-17 10:16:13.324776	t	\N
8483d290-386d-ac07-7e1b-5e34c2e29eee	[message supprimé]	2025-05-13 09:40:07.14709	2025-05-13 09:40:44.843023	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:40:07.14709	2025-05-17 10:16:13.324776	t	\N
dad0292a-f162-c0d7-f2de-df3fc2578aed	s	2025-05-13 13:42:15.702154	2025-05-13 13:59:55.155798	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:15.702154	\N	f	\N
9464222e-78e5-cd21-7a65-0222484e15b0	[message supprimé]	2025-05-13 11:04:58.112477	2025-05-13 11:32:12.02353	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:04:58.112477	2025-05-17 10:16:13.324776	t	\N
00410183-ef20-9e5d-e693-b7834079ad22	[message supprimé]	2025-05-13 11:05:04.635208	2025-05-13 11:32:12.026123	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:05:04.635208	2025-05-17 10:16:13.324776	t	\N
e4fac9ea-498a-d8a1-959c-042685d83fbe	[message supprimé]	2025-05-13 11:24:08.851126	2025-05-13 11:33:19.479903	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	"[{\\"id\\":\\"52680330-d909-a40c-34be-777b7c4b125e\\"}]"	2025-05-13 11:24:08.851126	2025-05-17 10:16:13.324776	t	\N
1bce0cfa-9ce2-12d9-3abf-c692a26d3613	[message supprimé]	2025-04-29 13:54:49.445603	2025-04-30 12:08:40.828436	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.445603	2025-05-17 10:16:13.324776	t	\N
6d4f8a8a-6f46-0bd2-dda5-dfe03a46b92c	[message supprimé]	2025-04-29 13:54:49.787921	2025-04-30 12:08:40.828652	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.787921	2025-05-17 10:16:13.324776	t	\N
9f180bbc-f6b6-44ec-2ec4-c28824fbf6d7	[message supprimé]	2025-04-29 13:54:49.986266	2025-04-30 12:08:40.827612	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.986266	2025-05-17 10:16:13.324776	t	\N
bf55643a-7c7c-45ed-b9aa-d132868f7c92	[message supprimé]	2025-05-13 08:32:46.20053	2025-05-13 08:33:10.187049	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:46.20053	2025-05-17 10:16:13.324776	t	\N
3a22f827-c382-b3d8-db12-8a3304dd34ac	[message supprimé]	2025-05-13 08:32:46.306143	2025-05-13 08:33:10.189104	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 08:32:46.306143	2025-05-17 10:16:13.324776	t	\N
9bc19731-e88e-acd4-ff9f-686495279e25	[message supprimé]	2025-05-13 07:47:06.942032	2025-05-13 08:09:29.475501	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 07:47:06.942032	2025-05-17 10:16:13.324776	t	\N
15401a50-04b7-d9bf-8f0e-66c9e76dd75f	[message supprimé]	2025-04-29 13:54:50.160317	2025-04-30 12:08:40.828173	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:50.160317	2025-05-17 10:16:13.324776	t	\N
fd4ec554-34de-a2d0-12c8-53500bd73871	[message supprimé]	2025-04-29 13:54:50.507655	2025-04-30 12:08:40.918184	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:50.507655	2025-05-17 10:16:13.324776	t	\N
819595dd-be67-c622-0b6c-b94aa0247705	[message supprimé]	2025-05-13 09:23:36.65074	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	25c01514-5c67-6921-1cfa-6261c29e5d88	[]	2025-05-13 09:23:36.65074	2025-05-13 11:48:13.651445	t	\N
fc2a71d8-f3bd-b1c2-1612-f83318e535b7	B	2025-05-17 09:46:27.99319	2025-05-17 11:12:13.158356	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:46:27.99319	\N	f	\N
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
934c7058-3474-ad2d-0dac-88a22c213a21	LOUTRE SIDA	2025-05-13 12:53:22.95961	2025-05-13 13:22:23.631858	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:22.95961	\N	f	\N
4bdb705c-b3d6-75da-ceb9-cfbff53f1bf9	Salut 	2025-05-13 09:47:59.318058	2025-05-13 11:04:13.179328	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:47:59.318058	\N	f	\N
f9837908-a516-0309-8306-59b3cc6066ca	k	2025-05-13 14:33:17.812705	2025-05-13 14:39:10.520996	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:33:17.812705	\N	f	\N
d780e008-a90a-7be7-3d82-e8eb8d3898e5	p	2025-05-13 14:50:32.298115	2025-05-13 14:51:06.870014	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:50:32.298115	\N	f	\N
b9f0e970-f560-3d9c-7e85-c133274f27f3	dqs	2025-05-13 14:22:14.693201	2025-05-13 14:25:14.800513	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:14.693201	\N	f	\N
370e377d-9ae2-a655-bb9a-84d1e4e9ed15	qsd	2025-05-13 14:22:15.198475	2025-05-13 14:25:14.804118	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:15.198475	\N	f	\N
e73f40e8-4f27-3675-12d8-e526c50ee135	qs	2025-05-13 14:22:15.356418	2025-05-13 14:25:14.807107	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:15.356418	\N	f	\N
61b01595-19f3-b0ab-1925-13e8f609c583	[message supprimé]	2025-05-13 11:05:31.000376	2025-05-13 11:06:27.986157	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:05:31.000376	2025-05-17 10:16:13.324776	t	\N
11f351f3-24e5-7f0e-59df-4dd264f933b2	d	2025-05-13 13:39:21.102657	2025-05-13 13:51:15.784956	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 13:39:21.102657	\N	f	\N
227cb7f5-b8b0-713b-7492-a3fbab71f33f	ss	2025-05-13 13:42:20.210015	2025-05-13 13:59:55.1578	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:20.210015	\N	f	\N
2dc4939a-b112-c4ed-16ad-96f96548aa66	s	2025-05-13 13:42:20.723078	2025-05-13 13:59:55.158353	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:20.723078	\N	f	\N
1f39d863-2c37-5286-e0f9-73da3e9dae12	[Message d'un utilisateur supprimé]	2025-04-29 12:32:07.97541	2025-04-29 12:48:42.175116	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:32:07.97541	\N	f	\N
cfe186da-1af1-f128-c0ef-044ed1a06e75	[Message d'un utilisateur supprimé]	2025-05-04 14:44:00.796088	2025-05-04 14:48:27.083202	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:44:00.796088	\N	f	\N
05941d2b-f455-0961-b299-5925c1fc649f	[Message d'un utilisateur supprimé]	2025-05-04 15:34:28.277262	2025-05-04 15:44:55.881167	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 15:34:28.277262	\N	f	\N
bd203d40-8622-36c6-59cb-db764b912bfb	[Message d'un utilisateur supprimé]	2025-05-13 11:33:39.918722	2025-05-13 11:42:46.64182	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:33:39.918722	\N	f	\N
495e2861-c304-4f14-1d67-1aa00e8d8d67	[message supprimé]	2025-04-29 13:54:50.692903	2025-04-30 12:08:40.918772	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:50.692903	2025-05-17 10:16:13.324776	t	\N
8355cc44-07e1-d2c8-28fa-045d7f90466d	[message supprimé]	2025-05-04 14:40:57.016919	2025-05-04 14:45:14.6327	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-04 14:40:57.016919	2025-05-17 10:16:13.324776	t	\N
597117d7-2a20-6a79-9230-9a2d935bfe9a	[message supprimé]	2025-05-13 09:41:36.837569	2025-05-13 09:45:29.867223	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:41:36.837569	2025-05-17 10:16:13.324776	t	\N
2371ca20-3929-28f1-a553-cc423c2a2bf9	[message supprimé]	2025-05-13 07:50:08.364321	2025-05-13 09:17:33.851777	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	"[{\\"id\\":\\"da1f8bd2-c427-0539-ce31-0b50cbedb844\\"}]"	2025-05-13 07:50:08.364321	2025-05-17 10:16:13.324776	t	\N
89b0c9e8-6449-f6ff-a71e-5f1147a12eb6	[message supprimé]	2025-05-13 12:53:22.926805	2025-05-13 13:22:23.633293	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:22.926805	2025-05-17 10:16:13.324776	t	\N
d2db167b-7965-badf-941a-8d61d2e0befd	[message supprimé]	2025-05-13 12:53:29.430702	2025-05-13 13:22:23.463415	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:29.430702	2025-05-17 10:16:13.324776	t	\N
df65d883-d9a2-9f92-bf81-513d6f99aee5	[message supprimé]	2025-04-29 13:54:51.185496	2025-04-30 12:08:40.919224	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.185496	2025-05-17 10:16:13.324776	t	\N
2642a529-9fd8-9935-c494-e6f0d58689b3	[message supprimé]	2025-04-29 13:54:51.446683	2025-04-30 12:08:40.918618	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.446683	2025-05-17 10:16:13.324776	t	\N
e939f59d-ee4b-ad4f-6f88-8025bd9e73ce	[message supprimé]	2025-04-29 13:54:51.79028	2025-04-30 12:08:40.919563	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.79028	2025-05-17 10:16:13.324776	t	\N
a2f29295-6fba-a537-20d6-08c375c44027	[message supprimé]	2025-04-29 13:54:51.943264	2025-04-30 12:08:40.920556	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.943264	2025-05-17 10:16:13.324776	t	\N
a9ba56e1-7be5-42a3-024e-27bfeeb3949b	[message supprimé]	2025-04-29 13:54:52.201389	2025-04-30 12:08:40.920441	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:52.201389	2025-05-17 10:16:13.324776	t	\N
9cf395dd-b9a3-f28c-1649-0b5ffa3e52f9	[message supprimé]	2025-04-29 13:54:52.456653	2025-04-30 12:08:40.920227	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:52.456653	2025-05-17 10:16:13.324776	t	\N
851d1225-24f5-8a70-699d-7161376f969b	[message supprimé]	2025-04-29 13:54:52.961198	2025-04-30 12:08:40.928536	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:52.961198	2025-05-17 10:16:13.324776	t	\N
6dd551fe-f885-8031-2525-11c26ddf852c	[message supprimé]	2025-05-13 09:24:13.581958	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	00000000-0000-0000-0000-000000000001	[]	2025-05-13 09:24:13.581958	2025-05-13 11:48:29.959963	t	\N
5594f306-f61c-7377-4c74-d342a6372111	gh	2025-05-13 08:36:51.701141	2025-05-13 09:34:48.831716	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 08:36:51.701141	\N	f	\N
3b71a2da-b9c3-aa90-6bd8-5807139dcff6	fg	2025-05-13 11:24:34.291999	2025-05-13 11:33:06.290413	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:24:34.291999	\N	f	\N
0d41c476-3213-683d-7ae9-8f09a97735bb	etst	2025-05-13 11:28:35.223087	2025-05-13 11:33:06.445491	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:28:35.223087	\N	f	\N
7d248b96-5dfc-8555-e5cd-2667832b63dc	test	2025-05-13 11:28:29.808155	2025-05-13 11:33:06.446153	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 11:28:29.808155	\N	f	\N
b019508f-18a0-2181-799f-86507af7eedb	[Message d'un utilisateur supprimé]	2025-04-29 12:38:00.442888	2025-04-29 12:48:42.177452	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:38:00.442888	\N	f	\N
6784fbd0-3d4d-2114-e1bc-6bbefdf77f45	[Message d'un utilisateur supprimé]	2025-05-04 14:48:43.961763	2025-05-04 14:49:25.435461	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:48:43.961763	\N	f	\N
cf389f50-8f34-d6f6-94ac-aabf2828b36f	sf	2025-05-13 13:39:50.879894	2025-05-13 13:41:12.107635	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:39:50.879894	\N	f	\N
502c9dd3-3c5f-7784-f2dc-ffbe2aaced2a	qsfqsfq	2025-05-13 14:16:46.769608	2025-05-13 14:17:52.194532	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:16:46.769608	\N	f	\N
d220e0b7-d7d7-aab7-1f43-bd65c7730579	fsdfsd	2025-05-13 13:41:45.290306	2025-05-13 13:59:55.115271	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:45.290306	\N	f	\N
6577780b-5c54-8db4-2a7b-9d29400d7d7d	Bebe	2025-05-13 09:48:12.470865	2025-05-13 11:04:13.179737	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 09:48:12.470865	\N	f	\N
a5730655-b117-358d-28eb-c834a890c814	[message supprimé]	2025-05-17 09:48:25.331834	2025-05-17 11:12:13.205425	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"fa82e186-4b40-34b6-eca8-4d7d36a47d7b\\"}]"	2025-05-17 09:48:25.331834	2025-05-17 09:48:29.145052	t	\N
aa900129-cebd-9278-2db5-c2c238684a52	tesqxt	2025-05-13 13:29:31.519063	2025-05-13 13:30:03.786009	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:29:31.519063	\N	f	\N
ae994af1-aee2-c37a-02c2-a2464d35cd0a	ZIZI	2025-05-13 11:56:56.006899	2025-05-13 12:50:15.45498	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:56:56.006899	\N	f	\N
d8b5af07-40e1-7090-7375-25ed3cb46b2a	diff	2025-05-13 14:35:26.488583	2025-05-13 14:39:10.518757	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:35:26.488583	\N	f	\N
8b684bcc-5030-b531-0a7b-5e7bc299190a	[message supprimé]	2025-04-29 13:54:53.476009	2025-04-30 12:08:40.931093	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:53.476009	2025-05-17 10:16:13.324776	t	\N
d04890bd-6041-2fa3-3c75-383496297a2a	[message supprimé]	2025-04-29 13:54:54.112666	2025-04-30 12:08:40.931309	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:54.112666	2025-05-17 10:16:13.324776	t	\N
19efc36c-adb0-3ed9-18bb-4939ae18f82e	[message supprimé]	2025-04-29 13:54:54.354456	2025-04-30 12:08:40.930651	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:54.354456	2025-05-17 10:16:13.324776	t	\N
0c71eb9b-56aa-a066-c88d-948d8a0ff392	[message supprimé]	2025-04-29 13:54:55.304203	2025-04-30 12:08:40.932397	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:55.304203	2025-05-17 10:16:13.324776	t	\N
ac4c8063-a06a-7006-643a-2e3c20a36577	[message supprimé]	2025-04-29 13:54:55.737512	2025-04-30 12:08:40.931724	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:55.737512	2025-05-17 10:16:13.324776	t	\N
234c9dd6-04e3-70ee-429c-c087d0dbe45e	[message supprimé]	2025-04-29 13:54:56.303692	2025-04-30 12:08:40.931668	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:56.303692	2025-05-17 10:16:13.324776	t	\N
8e13959c-17f0-f1dc-5dd5-133df6a1a778	Test	2025-05-13 08:02:41.682562	2025-05-13 08:59:59.62045	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 08:02:41.682562	\N	f	\N
aed029e9-17ab-4980-6ed6-a82266445ca2	[message supprimé]	2025-04-29 13:54:56.855581	2025-04-30 12:08:40.932344	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:56.855581	2025-05-17 10:16:13.324776	t	\N
9698b6d1-7374-b102-ff7f-6c6f1881409c	[message supprimé]	2025-04-29 13:54:51.5969	2025-04-30 12:08:40.918996	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.5969	2025-05-17 10:16:13.324776	t	\N
ef8d5ecd-8e33-02fa-0792-331e23f5e11f	[message supprimé]	2025-05-13 12:08:44.642012	2025-05-13 12:08:47.169747	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	"[{\\"id\\":\\"c41cd366-20bb-8b99-7f82-db394871e4f3\\"}]"	2025-05-13 12:08:44.642012	2025-05-17 10:16:13.324776	t	\N
198b5ca1-d354-4f55-643d-5b7ac04b158c	[message supprimé]	2025-05-04 15:38:49.51123	2025-05-04 15:43:42.599309	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:38:49.51123	2025-05-17 10:16:13.324776	t	\N
de2cf76e-70c9-b0dc-a802-a19ee76e0ad7	[message supprimé]	2025-05-13 09:44:21.738364	2025-05-13 09:45:29.872555	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 09:44:21.738364	2025-05-17 10:16:13.324776	t	\N
089d0cf9-cf95-7358-7a46-11402b3f495f	[message supprimé]	2025-05-13 12:53:31.10311	2025-05-13 13:22:23.478406	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:53:31.10311	2025-05-17 10:16:13.324776	t	\N
45e9bbe8-2d01-ec5d-718b-daca03dd65b2	dq	2025-05-13 14:22:14.852623	2025-05-13 14:25:14.802369	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:14.852623	\N	f	\N
9176f37c-7cfc-5eb5-1f41-31c43f5977f2	d	2025-05-13 14:22:15.66772	2025-05-13 14:25:14.807594	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:15.66772	\N	f	\N
7ee22a40-3ecd-99fd-0ba7-e8b1a88fd76a	test	2025-05-17 10:16:40.397183	2025-05-17 10:39:05.036995	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:16:40.397183	\N	f	\N
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
3b6a9a24-f769-7376-c83f-11491d9860f8	hello	2025-05-13 11:35:07.798397	2025-05-13 11:38:25.528598	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:35:07.798397	\N	f	\N
44bb22f0-7205-0b86-f294-a4f38dea3ef8	fqsf	2025-05-13 13:29:34.886512	2025-05-13 13:30:03.787561	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:29:34.886512	\N	f	\N
c55c84c6-94e7-4964-a97d-4a7cb4a196ae	aezfeza	2025-05-17 09:52:33.453816	2025-05-17 11:12:13.161301	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:52:33.453816	\N	f	\N
b3987861-89af-d2f2-3e66-52630c04076f	ezf	2025-05-17 09:52:39.226122	2025-05-17 11:12:13.16194	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:52:39.226122	\N	f	\N
83d839b6-6bff-d984-b430-7b1f05554227	f	2025-05-17 09:53:25.419698	2025-05-17 11:12:13.167869	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:53:25.419698	\N	f	\N
5cec789b-35a8-215d-5a22-43be494e4e8e	oui	2025-05-13 12:11:08.478186	2025-05-13 12:19:07.952836	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 12:11:08.478186	\N	f	eda919af-6ecf-d616-0da4-c4c610675c28
2ccf973c-a810-1188-f47a-1699e79c9fe6	[Message d'un utilisateur supprimé]	2025-04-29 12:38:16.262525	2025-04-29 12:48:42.214951	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:38:16.262525	\N	f	\N
06856c99-38dc-5e72-4ec7-e046144e384b	[Message d'un utilisateur supprimé]	2025-05-13 11:35:42.629727	2025-05-13 11:42:46.639891	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-13 11:35:42.629727	\N	f	\N
c9ed2ab3-d175-1cea-96d7-71f490367ff7	Salut	2025-05-13 14:16:23.53274	2025-05-13 14:51:35.424085	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 14:16:23.53274	\N	f	\N
d5960bbe-8c8b-14b0-7bf6-22538a32aaaf	[message supprimé]	2025-04-29 13:54:51.803665	2025-04-30 12:08:40.919801	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.803665	2025-05-17 10:16:13.324776	t	\N
fc89eff7-cb32-c146-835b-5d22322d1fc2	[message supprimé]	2025-04-29 13:54:57.262422	2025-04-30 12:08:40.931767	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:57.262422	2025-05-17 10:16:13.324776	t	\N
3a44160c-1b24-a096-c3e7-071033bf0015	[message supprimé]	2025-05-04 15:44:32.164948	2025-05-04 15:44:39.287517	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:44:32.164948	2025-05-17 10:16:13.324776	t	\N
fc127be4-2a79-6858-1096-df939c55fb53	[message supprimé]	2025-05-13 12:54:30.36218	2025-05-13 13:22:23.482041	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:54:30.36218	2025-05-17 10:16:13.324776	t	\N
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
ccf866d5-ff6a-4efb-daee-9342e12eea3c	[Message d'un utilisateur supprimé]	2025-04-29 13:58:11.674952	2025-04-29 14:02:46.776459	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 13:58:11.674952	\N	f	\N
c6c72219-4d13-1bba-714b-6af59fe0c251	[Message d'un utilisateur supprimé]	2025-04-29 12:38:26.988174	2025-04-29 12:48:42.216618	00000000-0000-0000-0000-000000000003	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:38:26.988174	\N	f	\N
5b76aa3f-f624-c2c4-1836-eed301afcc29	[Message d'un utilisateur supprimé]	2025-05-04 15:45:09.27878	2025-05-04 15:45:10.678122	bb6a4d43-70d3-5e36-d943-dfdfc747491f	00000000-0000-0000-0000-000000000003	[]	2025-05-04 15:45:09.27878	\N	f	\N
e8ca0ba6-8387-23d6-51e4-4ba4b12fb537	[message supprimé]	2025-05-13 12:19:11.928767	2025-05-13 12:19:25.885584	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 12:19:11.928767	2025-05-13 12:19:41.158402	t	\N
77f45d77-8e99-a4a2-908d-358f1ad05bb6	qsf	2025-05-13 13:29:35.841575	2025-05-13 13:30:03.786639	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:29:35.841575	\N	f	\N
1c514834-c69e-791e-46c9-4eecd51a0e5b	sd	2025-05-13 13:41:57.990277	2025-05-13 13:59:55.131739	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:41:57.990277	\N	f	\N
740022b4-05f1-0c0d-d80c-13977d184ee2	TEST TET	2025-05-13 11:37:32.16804	2025-05-13 11:38:10.402425	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 11:37:32.16804	\N	f	\N
2932fd16-0300-c928-a4ec-57c65f775db5	d	2025-05-13 13:42:10.803052	2025-05-13 13:59:55.134176	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:10.803052	\N	f	\N
57edc153-1d9e-ff4e-0137-afe6b4c5352c	ds	2025-05-13 13:42:11.427317	2025-05-13 13:59:55.151899	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 13:42:11.427317	\N	f	\N
62a9b764-7d46-23a0-5d7d-fbdd8036fc3e	psd	2025-05-13 14:35:44.660258	2025-05-13 14:39:10.517509	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:35:44.660258	\N	f	\N
bafaae55-dd65-978c-24e0-77b7299fcb5c	[message supprimé]	2025-05-13 12:55:46.494067	2025-05-13 13:22:23.509053	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 12:55:46.494067	2025-05-17 10:16:13.324776	t	\N
8cdff91d-4d65-9c31-1ef8-630a0e45db18	dfdsfdsfsdf	2025-05-17 09:53:00.740653	2025-05-17 11:12:13.165818	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:53:00.740653	\N	f	\N
90765781-8efd-2177-e7e1-f5d46c2d9e2d	qsfqsf	2025-05-13 14:16:51.887265	2025-05-13 14:25:14.782169	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:51.887265	\N	f	\N
9bb94a51-54c1-7b6a-9504-4ad68d2bfcae	qsf	2025-05-13 14:16:54.611493	2025-05-13 14:25:14.785693	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:54.611493	\N	f	\N
54b57ef9-a6a8-fe28-f3ea-60aaa571fe2f	wsfqsf	2025-05-13 14:16:53.980526	2025-05-13 14:25:14.784779	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:53.980526	\N	f	\N
835ce089-d6cd-96ac-d905-a5e05fac5db4	qsfd	2025-05-13 14:16:57.030809	2025-05-13 14:25:14.785564	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:16:57.030809	\N	f	\N
c76b4c9e-e217-f76b-db53-2abfc79bf93d	qsdqsd	2025-05-17 10:23:45.932036	2025-05-17 11:12:13.172138	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 10:23:45.932036	\N	f	\N
8df7a5ed-964f-f1fd-4742-2c98156b5969	qs	2025-05-13 14:22:22.980427	2025-05-13 14:25:14.808667	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:22.980427	\N	f	\N
c0888da7-5d91-3550-0ddd-8fe88a07849c	dq	2025-05-13 14:22:23.064073	2025-05-13 14:25:14.811717	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:23.064073	\N	f	\N
cd78376a-3a55-fd79-f1bb-25880ab9c1b4	coucouc	2025-05-17 10:24:02.029022	2025-05-17 11:12:13.174604	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 10:24:02.029022	\N	f	\N
f5249380-7ead-f998-6259-24fe0589c498	sd	2025-05-13 14:30:47.930673	2025-05-13 14:39:59.684128	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:30:47.930673	\N	f	\N
d6a5853a-c101-8bd9-38fb-aaf3c33f2112	qsd	2025-05-17 10:23:48.395208	2025-05-17 11:12:13.173146	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 10:23:48.395208	\N	f	\N
80f1ba0f-03ff-3b1a-12c1-150483d0367f	[message supprimé]	2025-05-17 09:53:39.998723	2025-05-17 11:12:13.209622	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"056d2242-1e60-37ed-e75b-d9a39c8ea420\\"}]"	2025-05-17 09:53:39.998723	2025-05-17 09:53:46.10377	t	\N
8e9f9359-205d-56b3-f27e-f992dc3b947a	sd	2025-05-13 14:22:23.18053	2025-05-13 14:25:14.812023	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:23.18053	\N	f	\N
40aea244-4826-2781-dc57-ececc74f805e	d	2025-05-13 14:22:24.195052	2025-05-13 14:25:14.818346	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:24.195052	\N	f	\N
12bf5666-7db6-b227-c069-74c8834815fb	sida prout	2025-05-13 14:10:07.152206	2025-05-13 14:13:24.525091	bb6a4d43-70d3-5e36-d943-dfdfc747491f	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:10:07.152206	\N	f	\N
ab19c93a-f9a6-df7e-ff6f-4899069bd29c	[message supprimé]	2025-05-13 12:30:29.028155	2025-05-13 14:36:28.737698	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"f80b3869-ec66-0699-52b3-bde225a46e5a\\"}]"	2025-05-13 12:30:29.028155	2025-05-13 12:31:15.704242	t	\N
91fc17bd-1a55-923b-2ddd-6c1932ea1cea	ssqd	2025-05-13 14:37:36.975902	2025-05-13 14:39:10.520088	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:37:36.975902	\N	f	\N
3c8bb747-0d70-127b-aadd-4a8cdc0c852d	cx	2025-05-17 10:23:56.256442	2025-05-17 11:12:13.172834	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 10:23:56.256442	\N	f	\N
a293004d-3680-3898-8441-951b32bfa3cc	[message supprimé]	2025-05-17 09:55:18.152747	2025-05-17 11:12:13.211759	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"e5acec96-69d8-dde7-387c-7db793d13fda\\"}]"	2025-05-17 09:55:18.152747	2025-05-17 09:57:55.776322	t	\N
f9af1219-4059-36bd-a1d0-f27451554302	zrter	2025-05-13 14:37:48.346648	2025-05-13 14:39:10.522228	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:37:48.346648	\N	f	\N
e3f760db-dece-16b0-f0cc-8e87d7af8472	qsdqsd	2025-05-13 14:10:13.497484	2025-05-13 14:13:24.526728	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:10:13.497484	\N	f	\N
9578e7fd-dbfd-7112-488e-e29a24209781		2025-05-13 14:24:07.526832	2025-05-13 14:25:14.819476	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	"[{\\"id\\":\\"458b37aa-952b-6616-a3e6-3f262e32f5b3\\"}]"	2025-05-13 14:24:07.526832	\N	f	\N
7ed01712-8b22-315f-ba9d-83cd572d5cfd	azerty	2025-05-17 09:57:44.852234	2025-05-17 11:12:13.170079	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-17 09:57:44.852234	\N	f	\N
0ac89edd-bd4d-0e00-19b1-b02590d1dce2	[message supprimé]	2025-05-17 10:01:10.813674	2025-05-17 10:39:05.041794	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:01:10.813674	2025-05-17 10:16:13.324776	t	\N
64482483-9e23-95f2-dbb2-1585ee7f5b82	[message supprimé]	2025-05-17 10:00:41.44637	2025-05-17 10:39:05.049714	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:00:41.44637	2025-05-17 10:16:13.324776	t	\N
5c2ff179-58c7-fe30-bc66-12a28b6132b3	[message supprimé]	2025-05-17 10:00:54.308311	2025-05-17 10:39:05.049814	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:00:54.308311	2025-05-17 10:16:13.324776	t	\N
3b0698df-3c60-36d3-09fc-61373312b172	[message supprimé]	2025-05-17 10:01:04.265616	2025-05-17 10:39:05.060286	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:01:04.265616	2025-05-17 10:16:13.324776	t	\N
2e0cf27d-933f-fa78-908e-5dcf8ede949b	Test 	2025-05-13 14:15:40.756968	2025-05-13 14:51:35.421618	a5c1b268-937f-af11-4ca2-2c96634fbe2e	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-05-13 14:15:40.756968	\N	f	\N
79712134-c960-1e3d-2824-b5fe8f3b7ff3	[message supprimé]	2025-05-13 14:14:51.012639	2025-05-13 14:39:59.709588	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:14:51.012639	2025-05-17 10:16:13.324776	t	\N
8749a4e1-c1ff-bc42-d588-e655a9ed0c61	f	2025-05-13 14:22:09.42235	2025-05-13 14:25:14.789555	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:09.42235	\N	f	\N
9debb43a-3395-cd3f-f86f-f237bf73e151	test	2025-05-13 14:39:21.667728	2025-05-13 14:39:21.713914	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:39:21.667728	\N	f	\N
f357bd7d-75e4-ff08-d07f-38894c706cac	test	2025-05-13 14:08:29.883983	2025-05-13 14:09:28.180855	c8eb671d-f3b4-41f6-7364-0f292619dfdc	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-13 14:08:29.883983	\N	f	\N
1b565044-fb16-eb4c-7824-8b98ea38a223	[message supprimé]	2025-05-17 10:01:20.025285	2025-05-17 10:39:05.059049	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:01:20.025285	2025-05-17 10:16:13.324776	t	\N
18414e04-ef10-756b-1d99-af2fd124d117	[message supprimé]	2025-05-17 10:01:44.256261	2025-05-17 10:39:05.06253	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-17 10:01:44.256261	2025-05-17 10:16:13.324776	t	\N
13adfdb1-6964-2555-8f04-016ef833f64a	sdf	2025-05-13 14:40:25.632746	2025-05-13 14:41:33.939583	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:40:25.632746	\N	f	\N
97566e28-0882-09b1-8c93-642bcaea1bb4	sdf	2025-05-13 14:40:42.273884	2025-05-13 14:41:33.940497	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:40:42.273884	\N	f	\N
7b7b478e-1496-2068-6712-f48c8500ffce	qf	2025-05-13 14:22:10.456154	2025-05-13 14:25:14.791291	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-13 14:22:10.456154	\N	f	\N
\.


--
-- TOC entry 4352 (class 0 OID 122921)
-- Dependencies: 232
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
\.


--
-- TOC entry 4361 (class 0 OID 253972)
-- Dependencies: 242
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
-- TOC entry 4362 (class 0 OID 262207)
-- Dependencies: 243
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.notification (id_notification, fk_utilisateur, type, contenu, lien, is_read, date_creation) FROM stdin;
\.


--
-- TOC entry 4344 (class 0 OID 82295)
-- Dependencies: 224
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.permission (id_permission, type_permission) FROM stdin;
\.


--
-- TOC entry 4364 (class 0 OID 278627)
-- Dependencies: 245
-- Data for Name: private_message_reaction; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.private_message_reaction (id_reaction, fk_message_prive, fk_utilisateur, reaction_type, created_at) FROM stdin;
1	d1edadd8-b4fb-fef0-a47a-36746cb8fc09	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-04 17:10:20.966235
3	31e6be05-e6a0-a406-2e2d-108c6433ea62	c8eb671d-f3b4-41f6-7364-0f292619dfdc	❤️	2025-05-05 12:32:02.261539
\.


--
-- TOC entry 4356 (class 0 OID 229471)
-- Dependencies: 236
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.push_subscriptions (id, user_id, endpoint, auth, p256dh, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4359 (class 0 OID 245825)
-- Dependencies: 239
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
\.


--
-- TOC entry 4343 (class 0 OID 82290)
-- Dependencies: 223
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role (id_role, nom_role) FROM stdin;
1	owner
2	admin
3	member
\.


--
-- TOC entry 4351 (class 0 OID 82390)
-- Dependencies: 231
-- Data for Name: role_permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role_permission (fk_role, fk_permission) FROM stdin;
\.


--
-- TOC entry 4337 (class 0 OID 82219)
-- Dependencies: 217
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
-- TOC entry 4338 (class 0 OID 82224)
-- Dependencies: 218
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.utilisateur (id_utilisateur, nom, email, mot_de_passe, photo_de_profil, date_creation, fk_statut, google_id, is_activated, validation_code, reset_password_code, reset_password_expires, date_naissance, bio, status_text) FROM stdin;
00000000-0000-0000-0000-000000000001	Mistral AI	bot@mistral.ai	dummy_password	https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp	2025-04-08 13:32:15.598295	1	\N	t	\N	\N	\N	\N	\N	\N
25c01514-5c67-6921-1cfa-6261c29e5d88	Paul Mazzon 2	paul.mazzon@supinfo.com	$2a$10$Q1/HrF0MUVJ2m/gFfAfo1eOddB78xzfJuscFr.fO4mEhqMjL/gjBG	\N	2025-05-12 11:07:01.643263	1	\N	t	\N	\N	\N	2004-01-06	\N	\N
c8eb671d-f3b4-41f6-7364-0f292619dfdc	Paul 2	paul.mazzon@icloud.com	$2a$10$husIr5kZtQDeVE44nNAz1eCZMM5w/74Cgu3RDzVQ8VAT4XNfnyLqi	\N	2025-04-01 12:32:20.707977	1	\N	t	\N	\N	\N	2004-01-06		\N
bb6a4d43-70d3-5e36-d943-dfdfc747491f	Math'BigDick	mathis.malzac@supinfo.com	$2a$10$Ga1TJtB5.ufn0C9h8hs1YuQ39emibG9WS9ow/o5GczMeFOWwM.W2a	\N	2025-02-27 13:47:22.59845	1	\N	t	\N	\N	\N	2010-02-16		\N
fd6ff12d-384e-055e-6e7c-f9a06b7e9af0	Bulk BULK	a@a.com	$2a$10$2W17CqGmWTtYGMk63c.iueIy9cg2VLxKqFU9nD3d1T1q3I6HyxKWK	\N	2025-05-08 10:24:15.013714	4	\N	t	\N	\N	\N	2010-05-06	\N	\N
00000000-0000-0000-0000-000000000003	System	system	dummy_password_ocr		2025-04-18 11:46:23.860732	1	\N	t	\N	\N	\N	\N	System	\N
00000000-0000-0000-0000-000000000002	MistralOCR	bot-ocr@mistral.ai	dummy_password_ocr	https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp	2025-04-18 11:46:23.860732	1	\N	t	\N	\N	\N	\N	Je suis l'assistant OCR de Mistral AI.	\N
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	Rudy	gault.rudy@gmail.com	$2a$10$KwpeHvkEQHur5hFUPhngEezuvRDMAB5EPMotu1xb/SE20ZL5YK0ki	https://s3.fr-par.scw.cloud/s3-supchat/avatars/1c7ca609-2f45-4277-a75d-f81aeb91beb6.jpg	2025-02-27 13:11:18.704602	1	\N	t	\N	\N	\N	2010-02-27	j'aime la crotte	\N
a5c1b268-937f-af11-4ca2-2c96634fbe2e	Paul MAZZON	paul.mazzon@gmail.com	$2a$10$.ikIVHLztRKsTWBG2gRPgeszkqImsSq95gkCklLm0bD.xAlJuZOk6	https://avatars.githubusercontent.com/u/63354977?v=4	2025-02-26 13:35:29.993728	1	\N	t	\N	\N	\N	2004-01-06	Salut !	\N
\.


--
-- TOC entry 4339 (class 0 OID 82243)
-- Dependencies: 219
-- Data for Name: workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace (id_workspace, nom, is_private, date_creation, banner_url, icon_url, description) FROM stdin;
6eeddc21-d56a-e978-b0c1-384e3f6cf186	test private	t	2025-05-08 09:57:59.364282	workspaces/banners/61630ddf-087f-47a5-9560-6323368a19c7.png	workspaces/icons/eff8552c-8db2-4256-b689-78c1cfb72848.png	test
c6d5d602-9fd0-99c7-1654-65c23b0cd792	Test zizi	f	2025-05-08 14:27:00.042832	\N	\N	zizi
4e94fed5-a879-6084-8eb7-ace5aa6c6236	testinvit	f	2025-05-09 11:41:27.655447	\N	\N	testinvitation
d4f1cff0-3ef5-7ab1-e654-c05894915c31	Supchat	f	2025-04-26 16:55:29.216308	workspaces/banners/2aa33e5b-a476-493d-935b-663a6b535ec8.jpg	workspaces/icons/41103c3c-3c22-439e-978e-9bc2b0562864.png	Serveur officiel de SUPCHATTTT
\.


--
-- TOC entry 4354 (class 0 OID 229396)
-- Dependencies: 234
-- Data for Name: workspace_favoris; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_favoris (id_workspace_favoris, fk_utilisateur, fk_workspace, date_ajout) FROM stdin;
13	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2025-04-28 08:15:46.242175
16	c8eb671d-f3b4-41f6-7364-0f292619dfdc	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2025-05-07 19:33:36.037155
17	a5c1b268-937f-af11-4ca2-2c96634fbe2e	6eeddc21-d56a-e978-b0c1-384e3f6cf186	2025-05-08 12:09:05.770797
21	c8eb671d-f3b4-41f6-7364-0f292619dfdc	6eeddc21-d56a-e978-b0c1-384e3f6cf186	2025-05-08 13:01:26.01789
\.


--
-- TOC entry 4347 (class 0 OID 82327)
-- Dependencies: 227
-- Data for Name: workspace_invitations; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_invitations (id_invitation, fk_workspace, email_invite, token_invitation, date_expiration, date_creation) FROM stdin;
\.


--
-- TOC entry 4368 (class 0 OID 294943)
-- Dependencies: 249
-- Data for Name: workspace_requests; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_requests (id_request, fk_utilisateur, fk_workspace, is_accepted, is_invitation, date_creation, date_reponse) FROM stdin;
1	a5c1b268-937f-af11-4ca2-2c96634fbe2e	6eeddc21-d56a-e978-b0c1-384e3f6cf186	f	f	2025-05-08 12:44:11.345894	\N
\.


--
-- TOC entry 4506 (class 0 OID 0)
-- Dependencies: 246
-- Name: canal_lecture_id_canal_lecture_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.canal_lecture_id_canal_lecture_seq', 39, true);


--
-- TOC entry 4507 (class 0 OID 0)
-- Dependencies: 241
-- Name: message_read_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.message_read_id_seq', 87, true);


--
-- TOC entry 4508 (class 0 OID 0)
-- Dependencies: 244
-- Name: private_message_reaction_id_reaction_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.private_message_reaction_id_reaction_seq', 3, true);


--
-- TOC entry 4509 (class 0 OID 0)
-- Dependencies: 235
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


--
-- TOC entry 4510 (class 0 OID 0)
-- Dependencies: 238
-- Name: reaction_id_reaction_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.reaction_id_reaction_seq', 31, true);


--
-- TOC entry 4511 (class 0 OID 0)
-- Dependencies: 233
-- Name: workspace_favoris_id_workspace_favoris_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.workspace_favoris_id_workspace_favoris_seq', 24, true);


--
-- TOC entry 4512 (class 0 OID 0)
-- Dependencies: 248
-- Name: workspace_requests_id_request_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.workspace_requests_id_request_seq', 1, true);


--
-- TOC entry 4145 (class 2606 OID 286788)
-- Name: canal_lecture canal_lecture_fk_utilisateur_fk_canal_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture
    ADD CONSTRAINT canal_lecture_fk_utilisateur_fk_canal_key UNIQUE (fk_utilisateur, fk_canal);


--
-- TOC entry 4147 (class 2606 OID 286786)
-- Name: canal_lecture canal_lecture_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture
    ADD CONSTRAINT canal_lecture_pkey PRIMARY KEY (id_canal_lecture);


--
-- TOC entry 4081 (class 2606 OID 82258)
-- Name: canal canal_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT canal_pkey PRIMARY KEY (id_canal);


--
-- TOC entry 4085 (class 2606 OID 82289)
-- Name: fichier fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fichier_pkey PRIMARY KEY (id_fichier);


--
-- TOC entry 4091 (class 2606 OID 82306)
-- Name: hashtag hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.hashtag
    ADD CONSTRAINT hashtag_pkey PRIMARY KEY (id_hashtag);


--
-- TOC entry 4093 (class 2606 OID 82311)
-- Name: membre_workspace membre_workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT membre_workspace_pkey PRIMARY KEY (fk_utilisateur, fk_workspace);


--
-- TOC entry 4103 (class 2606 OID 82349)
-- Name: message_fichier message_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT message_fichier_pkey PRIMARY KEY (fk_message, fk_fichier);


--
-- TOC entry 4105 (class 2606 OID 82364)
-- Name: message_hashtag message_hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT message_hashtag_pkey PRIMARY KEY (fk_message, fk_hashtag);


--
-- TOC entry 4107 (class 2606 OID 82379)
-- Name: message_mention message_mention_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT message_mention_pkey PRIMARY KEY (fk_message, fk_utilisateur);


--
-- TOC entry 4083 (class 2606 OID 82270)
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id_message);


--
-- TOC entry 4111 (class 2606 OID 122925)
-- Name: message_prive_fichier message_prive_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT message_prive_fichier_pkey PRIMARY KEY (fk_message_prive, fk_fichier);


--
-- TOC entry 4127 (class 2606 OID 229501)
-- Name: message_prive message_prive_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT message_prive_pkey PRIMARY KEY (id_message_prive);


--
-- TOC entry 4133 (class 2606 OID 253980)
-- Name: message_read message_read_fk_user_fk_canal_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_read
    ADD CONSTRAINT message_read_fk_user_fk_canal_key UNIQUE (fk_user, fk_canal);


--
-- TOC entry 4135 (class 2606 OID 253978)
-- Name: message_read message_read_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_read
    ADD CONSTRAINT message_read_pkey PRIMARY KEY (id);


--
-- TOC entry 4138 (class 2606 OID 262216)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id_notification);


--
-- TOC entry 4089 (class 2606 OID 82300)
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id_permission);


--
-- TOC entry 4141 (class 2606 OID 278635)
-- Name: private_message_reaction private_message_reaction_fk_message_prive_fk_utilisateur_re_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_fk_message_prive_fk_utilisateur_re_key UNIQUE (fk_message_prive, fk_utilisateur, reaction_type);


--
-- TOC entry 4143 (class 2606 OID 278633)
-- Name: private_message_reaction private_message_reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_pkey PRIMARY KEY (id_reaction);


--
-- TOC entry 4119 (class 2606 OID 229482)
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- TOC entry 4121 (class 2606 OID 229480)
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4129 (class 2606 OID 245833)
-- Name: reaction reaction_fk_message_fk_utilisateur_reaction_type_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_message_fk_utilisateur_reaction_type_key UNIQUE (fk_message, fk_utilisateur, reaction_type);


--
-- TOC entry 4131 (class 2606 OID 245831)
-- Name: reaction reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_pkey PRIMARY KEY (id_reaction);


--
-- TOC entry 4109 (class 2606 OID 82394)
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (fk_role, fk_permission);


--
-- TOC entry 4087 (class 2606 OID 82294)
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id_role);


--
-- TOC entry 4071 (class 2606 OID 82223)
-- Name: statut statut_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.statut
    ADD CONSTRAINT statut_pkey PRIMARY KEY (id_statut);


--
-- TOC entry 4073 (class 2606 OID 82235)
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- TOC entry 4075 (class 2606 OID 82237)
-- Name: utilisateur utilisateur_google_id_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_google_id_key UNIQUE (google_id);


--
-- TOC entry 4077 (class 2606 OID 82233)
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);


--
-- TOC entry 4113 (class 2606 OID 229404)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fk_workspace_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fk_workspace_key UNIQUE (fk_utilisateur, fk_workspace);


--
-- TOC entry 4115 (class 2606 OID 229402)
-- Name: workspace_favoris workspace_favoris_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_pkey PRIMARY KEY (id_workspace_favoris);


--
-- TOC entry 4097 (class 2606 OID 82339)
-- Name: workspace_invitations workspace_invitations_fk_workspace_email_invite_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_fk_workspace_email_invite_key UNIQUE (fk_workspace, email_invite);


--
-- TOC entry 4099 (class 2606 OID 82335)
-- Name: workspace_invitations workspace_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id_invitation);


--
-- TOC entry 4101 (class 2606 OID 82337)
-- Name: workspace_invitations workspace_invitations_token_invitation_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_token_invitation_key UNIQUE (token_invitation);


--
-- TOC entry 4079 (class 2606 OID 82250)
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id_workspace);


--
-- TOC entry 4156 (class 2606 OID 294951)
-- Name: workspace_requests workspace_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_requests
    ADD CONSTRAINT workspace_requests_pkey PRIMARY KEY (id_request);


--
-- TOC entry 4158 (class 2606 OID 294953)
-- Name: workspace_requests workspace_requests_unique; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_requests
    ADD CONSTRAINT workspace_requests_unique UNIQUE (fk_utilisateur, fk_workspace);


--
-- TOC entry 4148 (class 1259 OID 286800)
-- Name: idx_canal_lecture_canal; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_canal_lecture_canal ON public.canal_lecture USING btree (fk_canal);


--
-- TOC entry 4149 (class 1259 OID 286801)
-- Name: idx_canal_lecture_derniere_lecture; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_canal_lecture_derniere_lecture ON public.canal_lecture USING btree (derniere_lecture);


--
-- TOC entry 4150 (class 1259 OID 286799)
-- Name: idx_canal_lecture_utilisateur; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_canal_lecture_utilisateur ON public.canal_lecture USING btree (fk_utilisateur);


--
-- TOC entry 4094 (class 1259 OID 82427)
-- Name: idx_invitation_email; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_email ON public.workspace_invitations USING btree (email_invite);


--
-- TOC entry 4095 (class 1259 OID 82426)
-- Name: idx_invitation_workspace; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_workspace ON public.workspace_invitations USING btree (fk_workspace);


--
-- TOC entry 4122 (class 1259 OID 229515)
-- Name: idx_message_prive_conversation; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_conversation ON public.message_prive USING btree (fk_expediteur, fk_destinataire);


--
-- TOC entry 4123 (class 1259 OID 229514)
-- Name: idx_message_prive_date_envoi; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_date_envoi ON public.message_prive USING btree (date_envoi);


--
-- TOC entry 4124 (class 1259 OID 229513)
-- Name: idx_message_prive_destinataire; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_destinataire ON public.message_prive USING btree (fk_destinataire);


--
-- TOC entry 4125 (class 1259 OID 229512)
-- Name: idx_message_prive_expediteur; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_expediteur ON public.message_prive USING btree (fk_expediteur);


--
-- TOC entry 4136 (class 1259 OID 262222)
-- Name: idx_notification_utilisateur_read; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_notification_utilisateur_read ON public.notification USING btree (fk_utilisateur, is_read);


--
-- TOC entry 4139 (class 1259 OID 278646)
-- Name: idx_private_message_reaction_message; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_private_message_reaction_message ON public.private_message_reaction USING btree (fk_message_prive);


--
-- TOC entry 4116 (class 1259 OID 229489)
-- Name: idx_push_subscriptions_endpoint; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions USING btree (endpoint);


--
-- TOC entry 4117 (class 1259 OID 229488)
-- Name: idx_push_subscriptions_user; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions USING btree (user_id);


--
-- TOC entry 4151 (class 1259 OID 294966)
-- Name: idx_workspace_requests_accepted; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_workspace_requests_accepted ON public.workspace_requests USING btree (is_accepted);


--
-- TOC entry 4152 (class 1259 OID 294967)
-- Name: idx_workspace_requests_invitation; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_workspace_requests_invitation ON public.workspace_requests USING btree (is_invitation);


--
-- TOC entry 4153 (class 1259 OID 294965)
-- Name: idx_workspace_requests_user; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_workspace_requests_user ON public.workspace_requests USING btree (fk_utilisateur);


--
-- TOC entry 4154 (class 1259 OID 294964)
-- Name: idx_workspace_requests_workspace; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_workspace_requests_workspace ON public.workspace_requests USING btree (fk_workspace);


--
-- TOC entry 4189 (class 2606 OID 286794)
-- Name: canal_lecture canal_lecture_fk_canal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture
    ADD CONSTRAINT canal_lecture_fk_canal_fkey FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal) ON DELETE CASCADE;


--
-- TOC entry 4190 (class 2606 OID 286789)
-- Name: canal_lecture canal_lecture_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal_lecture
    ADD CONSTRAINT canal_lecture_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4160 (class 2606 OID 82259)
-- Name: canal fk_canal_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT fk_canal_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4164 (class 2606 OID 245852)
-- Name: fichier fk_fichier_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fk_fichier_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4168 (class 2606 OID 82340)
-- Name: workspace_invitations fk_invitation_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT fk_invitation_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4165 (class 2606 OID 82322)
-- Name: membre_workspace fk_membre_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4166 (class 2606 OID 82312)
-- Name: membre_workspace fk_membre_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4167 (class 2606 OID 82317)
-- Name: membre_workspace fk_membre_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4161 (class 2606 OID 82271)
-- Name: message fk_message_canal; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_canal FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal);


--
-- TOC entry 4181 (class 2606 OID 229507)
-- Name: message_prive fk_message_prive_destinataire; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_destinataire FOREIGN KEY (fk_destinataire) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4182 (class 2606 OID 229502)
-- Name: message_prive fk_message_prive_expediteur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_expediteur FOREIGN KEY (fk_expediteur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4162 (class 2606 OID 82276)
-- Name: message fk_message_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4169 (class 2606 OID 82355)
-- Name: message_fichier fk_messagefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier);


--
-- TOC entry 4170 (class 2606 OID 82350)
-- Name: message_fichier fk_messagefichier_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4171 (class 2606 OID 82370)
-- Name: message_hashtag fk_messagehashtag_hashtag; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_hashtag FOREIGN KEY (fk_hashtag) REFERENCES public.hashtag(id_hashtag);


--
-- TOC entry 4172 (class 2606 OID 82365)
-- Name: message_hashtag fk_messagehashtag_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4173 (class 2606 OID 82380)
-- Name: message_mention fk_messagemention_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4174 (class 2606 OID 82385)
-- Name: message_mention fk_messagemention_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4177 (class 2606 OID 122931)
-- Name: message_prive_fichier fk_messageprivefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT fk_messageprivefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier) ON DELETE CASCADE;


--
-- TOC entry 4175 (class 2606 OID 82400)
-- Name: role_permission fk_rolepermission_permission; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_permission FOREIGN KEY (fk_permission) REFERENCES public.permission(id_permission);


--
-- TOC entry 4176 (class 2606 OID 82395)
-- Name: role_permission fk_rolepermission_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4159 (class 2606 OID 82238)
-- Name: utilisateur fk_utilisateur_statut; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT fk_utilisateur_statut FOREIGN KEY (fk_statut) REFERENCES public.statut(id_statut);


--
-- TOC entry 4163 (class 2606 OID 188437)
-- Name: message message_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message(id_message) ON DELETE SET NULL;


--
-- TOC entry 4183 (class 2606 OID 245859)
-- Name: message_prive message_prive_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT message_prive_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message_prive(id_message_prive);


--
-- TOC entry 4186 (class 2606 OID 262217)
-- Name: notification notification_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4187 (class 2606 OID 278636)
-- Name: private_message_reaction private_message_reaction_fk_message_prive_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_fk_message_prive_fkey FOREIGN KEY (fk_message_prive) REFERENCES public.message_prive(id_message_prive) ON DELETE CASCADE;


--
-- TOC entry 4188 (class 2606 OID 278641)
-- Name: private_message_reaction private_message_reaction_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4180 (class 2606 OID 229483)
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4184 (class 2606 OID 245834)
-- Name: reaction reaction_fk_message_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message) ON DELETE CASCADE;


--
-- TOC entry 4185 (class 2606 OID 245839)
-- Name: reaction reaction_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4178 (class 2606 OID 229405)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4179 (class 2606 OID 229410)
-- Name: workspace_favoris workspace_favoris_fk_workspace_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE;


--
-- TOC entry 4191 (class 2606 OID 294954)
-- Name: workspace_requests workspace_requests_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_requests
    ADD CONSTRAINT workspace_requests_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4192 (class 2606 OID 294959)
-- Name: workspace_requests workspace_requests_fk_workspace_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_requests
    ADD CONSTRAINT workspace_requests_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE;


--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 4374
-- Name: DATABASE postgres; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON DATABASE postgres TO "paul.mazzon@supinfo.com";
GRANT ALL ON DATABASE postgres TO "rudy.gault@supinfo.com";
GRANT ALL ON DATABASE postgres TO "mathis.malzac@supinfo.com";
GRANT ALL ON DATABASE postgres TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON SCHEMA public TO "rudy.gault@supinfo.com";
GRANT ALL ON SCHEMA public TO "paul.mazzon@supinfo.com";
GRANT ALL ON SCHEMA public TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 250
-- Name: FUNCTION pg_replication_origin_advance(text, pg_lsn); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_advance(text, pg_lsn) TO azure_pg_admin;


--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 264
-- Name: FUNCTION pg_replication_origin_create(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_create(text) TO azure_pg_admin;


--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 256
-- Name: FUNCTION pg_replication_origin_drop(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_drop(text) TO azure_pg_admin;


--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 257
-- Name: FUNCTION pg_replication_origin_oid(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_oid(text) TO azure_pg_admin;


--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 258
-- Name: FUNCTION pg_replication_origin_progress(text, boolean); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_progress(text, boolean) TO azure_pg_admin;


--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 259
-- Name: FUNCTION pg_replication_origin_session_is_setup(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_is_setup() TO azure_pg_admin;


--
-- TOC entry 4386 (class 0 OID 0)
-- Dependencies: 260
-- Name: FUNCTION pg_replication_origin_session_progress(boolean); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_progress(boolean) TO azure_pg_admin;


--
-- TOC entry 4387 (class 0 OID 0)
-- Dependencies: 265
-- Name: FUNCTION pg_replication_origin_session_reset(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_reset() TO azure_pg_admin;


--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 261
-- Name: FUNCTION pg_replication_origin_session_setup(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_setup(text) TO azure_pg_admin;


--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 262
-- Name: FUNCTION pg_replication_origin_xact_reset(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_reset() TO azure_pg_admin;


--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 263
-- Name: FUNCTION pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone) TO azure_pg_admin;


--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 266
-- Name: FUNCTION pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn) TO azure_pg_admin;


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 251
-- Name: FUNCTION pg_stat_reset(); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset() TO azure_pg_admin;


--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 252
-- Name: FUNCTION pg_stat_reset_shared(text); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset_shared(text) TO azure_pg_admin;


--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 255
-- Name: FUNCTION pg_stat_reset_single_function_counters(oid); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset_single_function_counters(oid) TO azure_pg_admin;


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 254
-- Name: FUNCTION pg_stat_reset_single_table_counters(oid); Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT ALL ON FUNCTION pg_catalog.pg_stat_reset_single_table_counters(oid) TO azure_pg_admin;


--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN pg_config.name; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(name) ON TABLE pg_catalog.pg_config TO azure_pg_admin;


--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN pg_config.setting; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(setting) ON TABLE pg_catalog.pg_config TO azure_pg_admin;


--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 96
-- Name: COLUMN pg_hba_file_rules.line_number; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(line_number) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 96
-- Name: COLUMN pg_hba_file_rules.type; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(type) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 96
-- Name: COLUMN pg_hba_file_rules.database; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(database) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 96
-- Name: COLUMN pg_hba_file_rules.user_name; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(user_name) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 96
-- Name: COLUMN pg_hba_file_rules.address; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(address) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 96
-- Name: COLUMN pg_hba_file_rules.netmask; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(netmask) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4404 (class 0 OID 0)
-- Dependencies: 96
-- Name: COLUMN pg_hba_file_rules.auth_method; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(auth_method) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4405 (class 0 OID 0)
-- Dependencies: 96
-- Name: COLUMN pg_hba_file_rules.options; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(options) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4406 (class 0 OID 0)
-- Dependencies: 96
-- Name: COLUMN pg_hba_file_rules.error; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(error) ON TABLE pg_catalog.pg_hba_file_rules TO azure_pg_admin;


--
-- TOC entry 4407 (class 0 OID 0)
-- Dependencies: 146
-- Name: COLUMN pg_replication_origin_status.local_id; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(local_id) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4408 (class 0 OID 0)
-- Dependencies: 146
-- Name: COLUMN pg_replication_origin_status.external_id; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(external_id) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4409 (class 0 OID 0)
-- Dependencies: 146
-- Name: COLUMN pg_replication_origin_status.remote_lsn; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(remote_lsn) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4410 (class 0 OID 0)
-- Dependencies: 146
-- Name: COLUMN pg_replication_origin_status.local_lsn; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(local_lsn) ON TABLE pg_catalog.pg_replication_origin_status TO azure_pg_admin;


--
-- TOC entry 4411 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN pg_shmem_allocations.name; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(name) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4412 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN pg_shmem_allocations.off; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(off) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4413 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN pg_shmem_allocations.size; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(size) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4414 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN pg_shmem_allocations.allocated_size; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(allocated_size) ON TABLE pg_catalog.pg_shmem_allocations TO azure_pg_admin;


--
-- TOC entry 4415 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.starelid; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(starelid) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4416 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.staattnum; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staattnum) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4417 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stainherit; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stainherit) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4418 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stanullfrac; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanullfrac) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4419 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stawidth; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stawidth) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4420 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stadistinct; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stadistinct) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4421 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stakind1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4422 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stakind2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4423 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stakind3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4424 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stakind4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4425 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stakind5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stakind5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4426 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.staop1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4427 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.staop2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4428 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.staop3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4429 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.staop4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4430 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.staop5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(staop5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4431 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stacoll1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4432 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stacoll2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4433 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stacoll3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4434 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stacoll4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4435 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stacoll5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stacoll5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4436 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stanumbers1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4437 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stanumbers2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4438 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stanumbers3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4439 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stanumbers4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4440 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stanumbers5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stanumbers5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4441 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stavalues1; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues1) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4442 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stavalues2; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues2) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4443 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stavalues3; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues3) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4444 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stavalues4; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues4) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4445 (class 0 OID 0)
-- Dependencies: 41
-- Name: COLUMN pg_statistic.stavalues5; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(stavalues5) ON TABLE pg_catalog.pg_statistic TO azure_pg_admin;


--
-- TOC entry 4446 (class 0 OID 0)
-- Dependencies: 66
-- Name: COLUMN pg_subscription.oid; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(oid) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4447 (class 0 OID 0)
-- Dependencies: 66
-- Name: COLUMN pg_subscription.subdbid; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subdbid) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4448 (class 0 OID 0)
-- Dependencies: 66
-- Name: COLUMN pg_subscription.subname; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subname) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4449 (class 0 OID 0)
-- Dependencies: 66
-- Name: COLUMN pg_subscription.subowner; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subowner) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4450 (class 0 OID 0)
-- Dependencies: 66
-- Name: COLUMN pg_subscription.subenabled; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subenabled) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4451 (class 0 OID 0)
-- Dependencies: 66
-- Name: COLUMN pg_subscription.subconninfo; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subconninfo) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4452 (class 0 OID 0)
-- Dependencies: 66
-- Name: COLUMN pg_subscription.subslotname; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subslotname) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 66
-- Name: COLUMN pg_subscription.subsynccommit; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subsynccommit) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 66
-- Name: COLUMN pg_subscription.subpublications; Type: ACL; Schema: pg_catalog; Owner: azuresu
--

GRANT SELECT(subpublications) ON TABLE pg_catalog.pg_subscription TO azure_pg_admin;


--
-- TOC entry 4455 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE canal; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4461 (class 0 OID 0)
-- Dependencies: 247
-- Name: TABLE canal_lecture; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal_lecture TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal_lecture TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal_lecture TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4463 (class 0 OID 0)
-- Dependencies: 246
-- Name: SEQUENCE canal_lecture_id_canal_lecture_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.canal_lecture_id_canal_lecture_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.canal_lecture_id_canal_lecture_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.canal_lecture_id_canal_lecture_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4464 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4465 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4466 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE membre_workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4467 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE message; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4468 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE message_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4469 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE message_hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4470 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE message_mention; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4472 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE message_prive; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4473 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE message_prive_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4474 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE message_read; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_read TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_read TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_read TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4476 (class 0 OID 0)
-- Dependencies: 241
-- Name: SEQUENCE message_read_id_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.message_read_id_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.message_read_id_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.message_read_id_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4477 (class 0 OID 0)
-- Dependencies: 240
-- Name: TABLE message_with_alias; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4478 (class 0 OID 0)
-- Dependencies: 243
-- Name: TABLE notification; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4479 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4480 (class 0 OID 0)
-- Dependencies: 245
-- Name: TABLE private_message_reaction; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.private_message_reaction TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.private_message_reaction TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.private_message_reaction TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4482 (class 0 OID 0)
-- Dependencies: 244
-- Name: SEQUENCE private_message_reaction_id_reaction_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.private_message_reaction_id_reaction_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.private_message_reaction_id_reaction_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.private_message_reaction_id_reaction_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4483 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4485 (class 0 OID 0)
-- Dependencies: 235
-- Name: SEQUENCE push_subscriptions_id_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4486 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE reaction; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4488 (class 0 OID 0)
-- Dependencies: 238
-- Name: SEQUENCE reaction_id_reaction_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4489 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE role; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4490 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE role_permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4491 (class 0 OID 0)
-- Dependencies: 217
-- Name: TABLE statut; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4492 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE utilisateur; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4493 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4494 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE workspace_favoris; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4496 (class 0 OID 0)
-- Dependencies: 233
-- Name: SEQUENCE workspace_favoris_id_workspace_favoris_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4499 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE workspace_invitations; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4503 (class 0 OID 0)
-- Dependencies: 249
-- Name: TABLE workspace_requests; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_requests TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_requests TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_requests TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4505 (class 0 OID 0)
-- Dependencies: 248
-- Name: SEQUENCE workspace_requests_id_request_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.workspace_requests_id_request_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_requests_id_request_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_requests_id_request_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 2164 (class 826 OID 65747)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 2163 (class 826 OID 65746)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "mathis.malzac.user@supinfo.com";


-- Completed on 2025-05-17 13:13:40

--
-- PostgreSQL database dump complete
--

