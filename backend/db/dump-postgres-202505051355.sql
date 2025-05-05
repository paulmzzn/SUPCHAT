--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 17.2

-- Started on 2025-05-05 13:55:16

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
-- TOC entry 4333 (class 1262 OID 5)
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
-- TOC entry 4334 (class 0 OID 0)
-- Dependencies: 4333
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: azure_pg_admin
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- TOC entry 7 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: azure_pg_admin
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO azure_pg_admin;

--
-- TOC entry 4336 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: azure_pg_admin
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 249 (class 1255 OID 81930)
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
-- TOC entry 4346 (class 0 OID 0)
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
-- TOC entry 4350 (class 0 OID 0)
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
-- TOC entry 4356 (class 0 OID 0)
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
-- TOC entry 4359 (class 0 OID 0)
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
-- TOC entry 4362 (class 0 OID 0)
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
    fk_statut integer NOT NULL,
    google_id character varying(255),
    is_activated boolean DEFAULT false,
    validation_code character varying(6),
    reset_password_code character varying(6),
    reset_password_expires timestamp without time zone,
    date_naissance date,
    bio text
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
-- TOC entry 4370 (class 0 OID 0)
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
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE workspace_invitations; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.workspace_invitations IS 'Stocke les invitations envoyées aux utilisateurs pour rejoindre un workspace';


--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN workspace_invitations.token_invitation; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.workspace_invitations.token_invitation IS 'Token unique pour accepter l''invitation';


--
-- TOC entry 4045 (class 2604 OID 253975)
-- Name: message_read id; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_read ALTER COLUMN id SET DEFAULT nextval('public.message_read_id_seq'::regclass);


--
-- TOC entry 4050 (class 2604 OID 278630)
-- Name: private_message_reaction id_reaction; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction ALTER COLUMN id_reaction SET DEFAULT nextval('public.private_message_reaction_id_reaction_seq'::regclass);


--
-- TOC entry 4035 (class 2604 OID 229474)
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- TOC entry 4043 (class 2604 OID 245828)
-- Name: reaction id_reaction; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction ALTER COLUMN id_reaction SET DEFAULT nextval('public.reaction_id_reaction_seq'::regclass);


--
-- TOC entry 4033 (class 2604 OID 229399)
-- Name: workspace_favoris id_workspace_favoris; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris ALTER COLUMN id_workspace_favoris SET DEFAULT nextval('public.workspace_favoris_id_workspace_favoris_seq'::regclass);


--
-- TOC entry 4303 (class 0 OID 82251)
-- Dependencies: 220
-- Data for Name: canal; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.canal (id_canal, nom, is_private, date_creation, fk_workspace, updated_at) FROM stdin;
84f03094-c2df-24d7-6257-8bf9e1993b58	test	f	2025-04-26 16:56:38.164983	d4f1cff0-3ef5-7ab1-e654-c05894915c31	\N
07d1837c-59fe-d357-906a-acd22d3e162a	Horraire	f	2025-04-28 07:24:23.988836	d4f1cff0-3ef5-7ab1-e654-c05894915c31	\N
b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	files	f	2025-04-28 13:08:05.531983	d4f1cff0-3ef5-7ab1-e654-c05894915c31	\N
\.


--
-- TOC entry 4305 (class 0 OID 82281)
-- Dependencies: 222
-- Data for Name: fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.fichier (id_fichier, nom_fichier, url, type, date_upload, taille_fichier, extension, mime_type, fk_utilisateur) FROM stdin;
\.


--
-- TOC entry 4308 (class 0 OID 82301)
-- Dependencies: 225
-- Data for Name: hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.hashtag (id_hashtag, label) FROM stdin;
\.


--
-- TOC entry 4309 (class 0 OID 82307)
-- Dependencies: 226
-- Data for Name: membre_workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.membre_workspace (fk_utilisateur, fk_workspace, fk_role, ordre) FROM stdin;
c8eb671d-f3b4-41f6-7364-0f292619dfdc	d4f1cff0-3ef5-7ab1-e654-c05894915c31	1	0
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
bb6a4d43-70d3-5e36-d943-dfdfc747491f	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
a5c1b268-937f-af11-4ca2-2c96634fbe2e	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2	0
\.


--
-- TOC entry 4304 (class 0 OID 82264)
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
c7e92a63-a89b-1c22-9f24-d78d6a41f238	couille	\N	2025-05-04 15:21:41.445601	07d1837c-59fe-d357-906a-acd22d3e162a	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	2025-05-04 15:21:41.445601	\N	\N
f258c105-d610-fb12-f4ab-abc94df6049f	couille	\N	2025-05-04 15:21:47.802756	84f03094-c2df-24d7-6257-8bf9e1993b58	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	2025-05-04 15:21:47.802756	\N	\N
c924cbc4-2e5e-ec12-e13a-d28980db9d1b	couille	\N	2025-05-04 15:21:52.315521	b2c05146-9ffa-349d-f3bf-1bea6cc7a6b2	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	2025-05-04 15:21:52.315521	\N	\N
c2d63855-32ee-22f2-c7e8-9419c0887508	Sondage créé : [aefa](https://strawpoll.com/jVyG2DPE1Z7) [strawpoll:jVyG2DPE1Z7]	\N	2025-05-04 15:32:39.717303	07d1837c-59fe-d357-906a-acd22d3e162a	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-05-04 15:32:39.717303	\N	\N
24ac6a51-6842-a153-d623-2f712cd21aa4	pppp	\N	2025-05-05 07:25:09.74577	84f03094-c2df-24d7-6257-8bf9e1993b58	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	2025-05-05 07:25:09.74577	\N	\N
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
e5e6406d-90f7-3a3a-393c-70285a2a23dc	lkjhgfvcxvghjk	\N	2025-05-05 07:25:30.485537	07d1837c-59fe-d357-906a-acd22d3e162a	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	2025-05-05 07:25:30.485537	\N	\N
\.


--
-- TOC entry 4311 (class 0 OID 82345)
-- Dependencies: 228
-- Data for Name: message_fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_fichier (fk_message, fk_fichier) FROM stdin;
\.


--
-- TOC entry 4312 (class 0 OID 82360)
-- Dependencies: 229
-- Data for Name: message_hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_hashtag (fk_message, fk_hashtag) FROM stdin;
\.


--
-- TOC entry 4313 (class 0 OID 82375)
-- Dependencies: 230
-- Data for Name: message_mention; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_mention (fk_message, fk_utilisateur) FROM stdin;
\.


--
-- TOC entry 4320 (class 0 OID 229490)
-- Dependencies: 237
-- Data for Name: message_prive; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_prive (id_message_prive, contenu, date_envoi, date_lecture, fk_expediteur, fk_destinataire, pieces_jointes, date_creation, date_modification, is_deleted, parent_id) FROM stdin;
b6065911-79f8-36f6-faf9-459ffcad909c	mmm	2025-04-30 12:51:14.986106	2025-04-30 12:51:29.628045	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 12:51:14.986106	\N	f	\N
de6cae4a-6470-6f86-c102-1b9487ca57d1	test	2025-04-29 11:29:41.539153	2025-04-29 13:00:17.373281	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-04-29 11:29:41.539153	\N	f	\N
811f6a89-142c-528e-94a7-467ca961ee8c	klkl	2025-04-29 12:59:28.945118	2025-04-29 13:08:29.12446	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:59:28.945118	\N	f	\N
30f71474-1057-672f-bbe2-3a874ae23752	mmm	2025-04-29 12:59:46.93003	2025-04-29 13:08:29.124931	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:59:46.93003	\N	f	\N
1f2f3c4b-4ed1-b751-e60e-1a25b5b06633	jkjkjk	2025-04-29 14:07:53.419589	2025-04-29 14:13:35.712723	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:07:53.419589	\N	f	\N
d1edadd8-b4fb-fef0-a47a-36746cb8fc09	cfgvhj	2025-05-04 17:10:16.59356	2025-05-04 17:11:56.251916	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-05-04 17:10:16.59356	\N	f	\N
cbed91cb-7fe4-b8ad-84b6-d55499636137	mmmmmmmmm	2025-04-30 13:41:37.754001	2025-04-30 13:55:36.559534	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 13:41:37.754001	\N	f	\N
8cc4c82d-58cf-9b21-8f04-e58a1b55a9dd	rtyuiop	2025-05-04 14:58:23.917359	2025-05-04 15:00:37.540166	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:58:23.917359	\N	f	\N
c9aecf3e-d97c-6e5a-6f2f-717f386f118d	mmmm	2025-04-29 12:48:58.729671	2025-04-29 12:58:37.630627	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:48:58.729671	\N	f	\N
d7b6ce00-ab93-db6e-d545-2fb68bc7f905	kk	2025-04-29 12:52:20.804243	2025-04-29 12:58:37.630683	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:52:20.804243	\N	f	\N
62b57b9a-ceee-e47f-cf09-0d6a674af885	nzpevùosbnvùs<v`p<sjp$oDIV odflvj zd!àfo uùzizDK;	2025-05-04 15:46:53.1236	2025-05-04 15:52:56.810593	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:46:53.1236	\N	f	\N
9b233f49-6c86-9718-184c-ccacb44e17e0	jkjkjjkjk	2025-04-29 12:40:25.070744	2025-04-29 12:58:46.689839	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-29 12:40:25.070744	\N	f	\N
d5933c0e-da5c-6e4e-c9e9-3d303164d782	mmmm	2025-04-30 14:14:21.17032	2025-04-30 14:16:14.746744	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 14:14:21.17032	\N	f	\N
8f08b24a-5992-bfbd-c38f-7889116fc92f	jkjkkjkjk	2025-04-30 14:09:04.988956	2025-04-30 14:16:14.9575	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-30 14:09:04.988956	\N	f	\N
b9414322-70d0-f356-c566-f0fb8aeb8b24	llllll	2025-05-04 13:44:58.193466	2025-05-04 13:45:01.189915	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 13:44:58.193466	\N	f	\N
f42fe795-2155-59ab-b41b-99418887e6d9	klklklj	2025-04-29 13:51:37.524801	2025-04-29 13:57:55.46001	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 13:51:37.524801	\N	f	\N
d0d43718-7672-5390-fb49-06a45fef430b	pppp	2025-05-04 13:48:43.502562	2025-05-04 13:55:55.328476	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 13:48:43.502562	\N	f	\N
e09071d1-05dc-31ae-1801-5797c41d3ea8	kkkkk	2025-04-30 12:51:44.117834	2025-04-30 12:57:25.149309	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 12:51:44.117834	\N	f	\N
d9e95fbe-8aa8-554e-0d75-3aa26fc53033	hhhh	2025-04-29 14:11:26.181723	2025-04-29 14:13:35.711366	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:11:26.181723	\N	f	\N
e714e1bf-de71-7e4c-1e6c-d6d5ebdda285	mmm	2025-04-29 12:49:07.38283	2025-04-29 12:58:37.630087	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:49:07.38283	\N	f	\N
a59fbad2-bed8-f4e6-0666-a2e77f43f822	test	2025-04-29 12:18:35.837173	2025-04-29 12:29:30.296242	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-29 12:18:35.837173	\N	f	\N
fd2a325d-a652-2b8e-bb23-f54c1e05370c	touktouk	2025-05-04 15:08:30.003709	2025-05-04 15:09:46.069169	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:08:30.003709	\N	f	\N
f6ec2263-9233-bd74-bda6-1b0790f75d1a	mmmdssdfsdf	2025-04-30 13:55:36.148456	2025-04-30 13:56:33.349379	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 13:55:36.148456	\N	f	\N
e2fc9f2a-4eca-b6c2-f67d-8b832d4b6e4f	vghjkl	2025-05-04 16:35:37.397253	2025-05-04 17:02:02.986255	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 16:35:37.397253	\N	f	\N
24dfadbf-fc68-a09c-06b2-b5617734010a	klklkl	2025-04-29 12:40:35.689867	2025-04-29 12:58:46.690555	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-29 12:40:35.689867	\N	f	\N
72153dfa-1c10-6132-048f-b633fe928304	dfcgvhbjklm	2025-05-04 14:53:15.551773	2025-05-04 14:58:08.565405	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:53:15.551773	\N	f	\N
59cb476f-4342-e3cd-5a04-1a37d243a71d	sdfghjkl	2025-05-04 14:53:01.688999	2025-05-04 14:58:14.360597	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-05-04 14:53:01.688999	\N	f	\N
4fc21a83-9ef4-168e-bc20-ad9cd19b4a42	lll	2025-04-29 12:49:18.818334	2025-04-29 12:58:37.63058	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:49:18.818334	\N	f	\N
2d38db3f-065e-3625-1854-45304d304948	mmm	2025-04-30 12:51:59.106413	2025-04-30 12:57:25.150537	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 12:51:59.106413	\N	f	\N
eaf16bb0-9c32-3b17-63f7-3b5d9783f1f4	kkk	2025-04-29 13:51:58.562737	2025-04-29 14:02:46.778713	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 13:51:58.562737	\N	f	\N
877997c5-35d5-8dde-c7c4-da29a9dfd6a8	prout 💨	2025-05-04 15:10:03.906143	2025-05-04 15:15:46.936315	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:10:03.906143	\N	f	\N
a63afbae-3945-e8cc-02e3-bef08aa9095e	sqdlqsl	2025-04-29 14:13:46.61287	2025-04-29 14:16:25.978534	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:13:46.61287	\N	f	\N
fbd9630b-a9ec-f98f-f5cc-0c5f11514191	caca	2025-05-04 13:53:11.886847	2025-05-04 14:44:41.317333	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 13:53:11.886847	\N	f	\N
eaa525d0-3d73-7d5c-4810-98705885cc0d	test	2025-04-29 12:29:44.563262	2025-04-29 12:37:36.615153	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:29:44.563262	\N	f	\N
3006cff1-d2b7-ea90-2fbe-10eedc1822db	egfsdfg	2025-04-30 14:03:51.284271	2025-04-30 14:13:10.027903	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-30 14:03:51.284271	\N	f	\N
58dd84bb-099b-75e5-5709-d403ee154fc5	huuhuhu	2025-04-29 14:16:18.591643	2025-04-29 14:16:25.979312	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:16:18.591643	\N	f	\N
f3c05d33-a7d3-b513-3de4-85ab05e09524	hyt	2025-04-29 13:54:49.287433	2025-04-30 12:08:40.782589	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.287433	\N	f	\N
9f180bbc-f6b6-44ec-2ec4-c28824fbf6d7	jhy	2025-04-29 13:54:49.986266	2025-04-30 12:08:40.827612	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.986266	\N	f	\N
1bce0cfa-9ce2-12d9-3abf-c692a26d3613	rh	2025-04-29 13:54:49.445603	2025-04-30 12:08:40.828436	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.445603	\N	f	\N
6d4f8a8a-6f46-0bd2-dda5-dfe03a46b92c	yt	2025-04-29 13:54:49.787921	2025-04-30 12:08:40.828652	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:49.787921	\N	f	\N
a2127f32-d1bb-5f9f-fa0b-17afcacd5133	mmmm	2025-05-04 13:57:39.98085	2025-05-04 14:05:57.644513	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 13:57:39.98085	\N	f	\N
e32c7c2b-9d81-7d38-34c6-dc925458818f	test	2025-04-29 12:29:52.968866	2025-04-29 12:37:36.614943	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:29:52.968866	\N	f	\N
bf15ecde-a57f-5337-6662-2017bf5101d5	azerty	2025-05-04 15:14:29.905149	2025-05-04 15:17:00.985426	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 15:14:29.905149	\N	f	\N
93dc37d7-add0-8c63-39e0-5bf588311768	test	2025-04-29 12:30:08.397192	2025-04-29 12:48:42.174266	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:30:08.397192	\N	f	\N
31e6be05-e6a0-a406-2e2d-108c6433ea62	sdgsdgs	2025-04-29 14:16:46.869163	2025-04-29 14:17:02.255504	c8eb671d-f3b4-41f6-7364-0f292619dfdc	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 14:16:46.869163	\N	f	\N
15401a50-04b7-d9bf-8f0e-66c9e76dd75f	rj	2025-04-29 13:54:50.160317	2025-04-30 12:08:40.828173	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:50.160317	\N	f	\N
fd4ec554-34de-a2d0-12c8-53500bd73871	hy	2025-04-29 13:54:50.507655	2025-04-30 12:08:40.918184	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:50.507655	\N	f	\N
495e2861-c304-4f14-1d67-1aa00e8d8d67	rb	2025-04-29 13:54:50.692903	2025-04-30 12:08:40.918772	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:50.692903	\N	f	\N
8355cc44-07e1-d2c8-28fa-045d7f90466d	flichdaput	2025-05-04 14:40:57.016919	2025-05-04 14:45:14.6327	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-05-04 14:40:57.016919	\N	f	\N
1a3e5ffe-9324-e27c-8921-ce0b8c7c2912	egchvjbknl	2025-05-04 15:17:25.968743	2025-05-04 15:34:05.851345	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-05-04 15:17:25.968743	\N	f	\N
1f39d863-2c37-5286-e0f9-73da3e9dae12	test	2025-04-29 12:32:07.97541	2025-04-29 12:48:42.175116	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:32:07.97541	\N	f	\N
cfe186da-1af1-f128-c0ef-044ed1a06e75	sdfghj	2025-05-04 14:44:00.796088	2025-05-04 14:48:27.083202	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:44:00.796088	\N	f	\N
05941d2b-f455-0961-b299-5925c1fc649f	sedrftgyhujikoikjuygtfrd	2025-05-04 15:34:28.277262	2025-05-04 15:44:55.881167	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 15:34:28.277262	\N	f	\N
df65d883-d9a2-9f92-bf81-513d6f99aee5	yr	2025-04-29 13:54:51.185496	2025-04-30 12:08:40.919224	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.185496	\N	f	\N
2642a529-9fd8-9935-c494-e6f0d58689b3	y	2025-04-29 13:54:51.446683	2025-04-30 12:08:40.918618	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.446683	\N	f	\N
e939f59d-ee4b-ad4f-6f88-8025bd9e73ce	h	2025-04-29 13:54:51.79028	2025-04-30 12:08:40.919563	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.79028	\N	f	\N
9cf395dd-b9a3-f28c-1649-0b5ffa3e52f9	ytr	2025-04-29 13:54:52.456653	2025-04-30 12:08:40.920227	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:52.456653	\N	f	\N
a2f29295-6fba-a537-20d6-08c375c44027	ty	2025-04-29 13:54:51.943264	2025-04-30 12:08:40.920556	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.943264	\N	f	\N
a9ba56e1-7be5-42a3-024e-27bfeeb3949b	rt	2025-04-29 13:54:52.201389	2025-04-30 12:08:40.920441	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:52.201389	\N	f	\N
851d1225-24f5-8a70-699d-7161376f969b	ry	2025-04-29 13:54:52.961198	2025-04-30 12:08:40.928536	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:52.961198	\N	f	\N
8b684bcc-5030-b531-0a7b-5e7bc299190a	r	2025-04-29 13:54:53.476009	2025-04-30 12:08:40.931093	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:53.476009	\N	f	\N
19efc36c-adb0-3ed9-18bb-4939ae18f82e	th	2025-04-29 13:54:54.354456	2025-04-30 12:08:40.930651	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:54.354456	\N	f	\N
d04890bd-6041-2fa3-3c75-383496297a2a	tyh	2025-04-29 13:54:54.112666	2025-04-30 12:08:40.931309	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:54.112666	\N	f	\N
0c71eb9b-56aa-a066-c88d-948d8a0ff392	rh	2025-04-29 13:54:55.304203	2025-04-30 12:08:40.932397	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:55.304203	\N	f	\N
234c9dd6-04e3-70ee-429c-c087d0dbe45e	yth	2025-04-29 13:54:56.303692	2025-04-30 12:08:40.931668	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:56.303692	\N	f	\N
ac4c8063-a06a-7006-643a-2e3c20a36577	yt	2025-04-29 13:54:55.737512	2025-04-30 12:08:40.931724	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:55.737512	\N	f	\N
aed029e9-17ab-4980-6ed6-a82266445ca2	h	2025-04-29 13:54:56.855581	2025-04-30 12:08:40.932344	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:56.855581	\N	f	\N
9698b6d1-7374-b102-ff7f-6c6f1881409c	bhyt	2025-04-29 13:54:51.5969	2025-04-30 12:08:40.918996	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.5969	\N	f	\N
b019508f-18a0-2181-799f-86507af7eedb	testcaca	2025-04-29 12:38:00.442888	2025-04-29 12:48:42.177452	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:38:00.442888	\N	f	\N
198b5ca1-d354-4f55-643d-5b7ac04b158c	🤮	2025-05-04 15:38:49.51123	2025-05-04 15:43:42.599309	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:38:49.51123	\N	f	\N
6784fbd0-3d4d-2114-e1bc-6bbefdf77f45	eghjkl	2025-05-04 14:48:43.961763	2025-05-04 14:49:25.435461	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-05-04 14:48:43.961763	\N	f	\N
d5960bbe-8c8b-14b0-7bf6-22538a32aaaf	b	2025-04-29 13:54:51.803665	2025-04-30 12:08:40.919801	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:51.803665	\N	f	\N
fc89eff7-cb32-c146-835b-5d22322d1fc2	y	2025-04-29 13:54:57.262422	2025-04-30 12:08:40.931767	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-29 13:54:57.262422	\N	f	\N
3a44160c-1b24-a096-c3e7-071033bf0015	grzszrtbhq<et<qetg<deft	2025-05-04 15:44:32.164948	2025-05-04 15:44:39.287517	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	[]	2025-05-04 15:44:32.164948	\N	f	\N
2ccf973c-a810-1188-f47a-1699e79c9fe6	test	2025-04-29 12:38:16.262525	2025-04-29 12:48:42.214951	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:38:16.262525	\N	f	\N
5b76aa3f-f624-c2c4-1836-eed301afcc29	cvghjop	2025-05-04 15:45:09.27878	2025-05-04 15:45:10.678122	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-05-04 15:45:09.27878	\N	f	\N
ccf866d5-ff6a-4efb-daee-9342e12eea3c	jj	2025-04-29 13:58:11.674952	2025-04-29 14:02:46.776459	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 13:58:11.674952	\N	f	\N
c6c72219-4d13-1bba-714b-6af59fe0c251	mm	2025-04-29 12:38:26.988174	2025-04-29 12:48:42.216618	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-29 12:38:26.988174	\N	f	\N
\.


--
-- TOC entry 4315 (class 0 OID 122921)
-- Dependencies: 232
-- Data for Name: message_prive_fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_prive_fichier (fk_message_prive, fk_fichier) FROM stdin;
\.


--
-- TOC entry 4324 (class 0 OID 253972)
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
-- TOC entry 4325 (class 0 OID 262207)
-- Dependencies: 243
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.notification (id_notification, fk_utilisateur, type, contenu, lien, is_read, date_creation) FROM stdin;
\.


--
-- TOC entry 4307 (class 0 OID 82295)
-- Dependencies: 224
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.permission (id_permission, type_permission) FROM stdin;
\.


--
-- TOC entry 4327 (class 0 OID 278627)
-- Dependencies: 245
-- Data for Name: private_message_reaction; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.private_message_reaction (id_reaction, fk_message_prive, fk_utilisateur, reaction_type, created_at) FROM stdin;
1	d1edadd8-b4fb-fef0-a47a-36746cb8fc09	bb6a4d43-70d3-5e36-d943-dfdfc747491f	👍	2025-05-04 17:10:20.966235
2	d1edadd8-b4fb-fef0-a47a-36746cb8fc09	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	❤️	2025-05-04 17:11:56.164727
\.


--
-- TOC entry 4319 (class 0 OID 229471)
-- Dependencies: 236
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.push_subscriptions (id, user_id, endpoint, auth, p256dh, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4322 (class 0 OID 245825)
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
\.


--
-- TOC entry 4306 (class 0 OID 82290)
-- Dependencies: 223
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role (id_role, nom_role) FROM stdin;
1	owner
2	admin
3	member
\.


--
-- TOC entry 4314 (class 0 OID 82390)
-- Dependencies: 231
-- Data for Name: role_permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role_permission (fk_role, fk_permission) FROM stdin;
\.


--
-- TOC entry 4300 (class 0 OID 82219)
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
-- TOC entry 4301 (class 0 OID 82224)
-- Dependencies: 218
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.utilisateur (id_utilisateur, nom, email, mot_de_passe, photo_de_profil, date_creation, fk_statut, google_id, is_activated, validation_code, reset_password_code, reset_password_expires, date_naissance, bio) FROM stdin;
00000000-0000-0000-0000-000000000001	Mistral AI	bot@mistral.ai	dummy_password	https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp	2025-04-08 13:32:15.598295	1	\N	t	\N	\N	\N	\N	\N
bb6a4d43-70d3-5e36-d943-dfdfc747491f	Math'BigDick	mathis.malzac@supinfo.com	$2a$10$ZQlN0LDqaRGKYlHVXj.F4eQf/CeBUuMRZDkUQZ3UYNJRyaWbCK72G	\N	2025-02-27 13:47:22.59845	1	\N	t	\N	\N	\N	2010-02-16	
5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	Math TEST	test@test.com	$2a$10$EsFqhD2hegX0k7jxpJkonO0woveEBvH2D0UglMuDCUniTX9YXnDQ2	\N	2025-04-18 07:37:40.668084	1	\N	t	\N	\N	\N	2010-04-15	\N
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	Rudy	gault.rudy@gmail.com	$2a$10$KwpeHvkEQHur5hFUPhngEezuvRDMAB5EPMotu1xb/SE20ZL5YK0ki	\N	2025-02-27 13:11:18.704602	0	\N	t	\N	\N	\N	2010-02-27	j'aime la crotte
c8eb671d-f3b4-41f6-7364-0f292619dfdc	Paul 2	paul.mazzon@icloud.com	$2a$10$husIr5kZtQDeVE44nNAz1eCZMM5w/74Cgu3RDzVQ8VAT4XNfnyLqi	\N	2025-04-01 12:32:20.707977	1	\N	t	\N	\N	\N	2004-01-06	
00000000-0000-0000-0000-000000000002	MistralOCR	bot-ocr@mistral.ai	dummy_password_ocr	https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp	2025-04-18 11:46:23.860732	1	\N	t	\N	\N	\N	\N	Je suis l'assistant OCR de Mistral AI.
a5c1b268-937f-af11-4ca2-2c96634fbe2e	Paul MAZZON	paul.mazzon@gmail.com	$2a$10$x0A7Vw3xf6GYahB1KJphV.QRqvWdBdUQJq0lHbMgx1oqfJqATe3MO	https://avatars.githubusercontent.com/u/63354977?v=4	2025-02-26 13:35:29.993728	1	\N	t	\N	\N	\N	2004-01-06	Salut !
\.


--
-- TOC entry 4302 (class 0 OID 82243)
-- Dependencies: 219
-- Data for Name: workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace (id_workspace, nom, is_private, date_creation, banner_url, icon_url, description) FROM stdin;
d4f1cff0-3ef5-7ab1-e654-c05894915c31	Supchat	f	2025-04-26 16:55:29.216308	workspaces/banners/077587df-0a44-48ec-9ef0-883dd4af9639.png	workspaces/icons/41103c3c-3c22-439e-978e-9bc2b0562864.png	Serveur officiel de SUPCHAT
\.


--
-- TOC entry 4317 (class 0 OID 229396)
-- Dependencies: 234
-- Data for Name: workspace_favoris; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_favoris (id_workspace_favoris, fk_utilisateur, fk_workspace, date_ajout) FROM stdin;
13	a5c1b268-937f-af11-4ca2-2c96634fbe2e	d4f1cff0-3ef5-7ab1-e654-c05894915c31	2025-04-28 08:15:46.242175
\.


--
-- TOC entry 4310 (class 0 OID 82327)
-- Dependencies: 227
-- Data for Name: workspace_invitations; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_invitations (id_invitation, fk_workspace, email_invite, token_invitation, date_expiration, date_creation) FROM stdin;
\.


--
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 241
-- Name: message_read_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.message_read_id_seq', 87, true);


--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 244
-- Name: private_message_reaction_id_reaction_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.private_message_reaction_id_reaction_seq', 2, true);


--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 235
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 238
-- Name: reaction_id_reaction_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.reaction_id_reaction_seq', 30, true);


--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 233
-- Name: workspace_favoris_id_workspace_favoris_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.workspace_favoris_id_workspace_favoris_seq', 15, true);


--
-- TOC entry 4063 (class 2606 OID 82258)
-- Name: canal canal_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT canal_pkey PRIMARY KEY (id_canal);


--
-- TOC entry 4067 (class 2606 OID 82289)
-- Name: fichier fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fichier_pkey PRIMARY KEY (id_fichier);


--
-- TOC entry 4073 (class 2606 OID 82306)
-- Name: hashtag hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.hashtag
    ADD CONSTRAINT hashtag_pkey PRIMARY KEY (id_hashtag);


--
-- TOC entry 4075 (class 2606 OID 82311)
-- Name: membre_workspace membre_workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT membre_workspace_pkey PRIMARY KEY (fk_utilisateur, fk_workspace);


--
-- TOC entry 4085 (class 2606 OID 82349)
-- Name: message_fichier message_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT message_fichier_pkey PRIMARY KEY (fk_message, fk_fichier);


--
-- TOC entry 4087 (class 2606 OID 82364)
-- Name: message_hashtag message_hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT message_hashtag_pkey PRIMARY KEY (fk_message, fk_hashtag);


--
-- TOC entry 4089 (class 2606 OID 82379)
-- Name: message_mention message_mention_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT message_mention_pkey PRIMARY KEY (fk_message, fk_utilisateur);


--
-- TOC entry 4065 (class 2606 OID 82270)
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id_message);


--
-- TOC entry 4093 (class 2606 OID 122925)
-- Name: message_prive_fichier message_prive_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT message_prive_fichier_pkey PRIMARY KEY (fk_message_prive, fk_fichier);


--
-- TOC entry 4109 (class 2606 OID 229501)
-- Name: message_prive message_prive_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT message_prive_pkey PRIMARY KEY (id_message_prive);


--
-- TOC entry 4115 (class 2606 OID 253980)
-- Name: message_read message_read_fk_user_fk_canal_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_read
    ADD CONSTRAINT message_read_fk_user_fk_canal_key UNIQUE (fk_user, fk_canal);


--
-- TOC entry 4117 (class 2606 OID 253978)
-- Name: message_read message_read_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_read
    ADD CONSTRAINT message_read_pkey PRIMARY KEY (id);


--
-- TOC entry 4120 (class 2606 OID 262216)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id_notification);


--
-- TOC entry 4071 (class 2606 OID 82300)
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id_permission);


--
-- TOC entry 4123 (class 2606 OID 278635)
-- Name: private_message_reaction private_message_reaction_fk_message_prive_fk_utilisateur_re_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_fk_message_prive_fk_utilisateur_re_key UNIQUE (fk_message_prive, fk_utilisateur, reaction_type);


--
-- TOC entry 4125 (class 2606 OID 278633)
-- Name: private_message_reaction private_message_reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_pkey PRIMARY KEY (id_reaction);


--
-- TOC entry 4101 (class 2606 OID 229482)
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- TOC entry 4103 (class 2606 OID 229480)
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4111 (class 2606 OID 245833)
-- Name: reaction reaction_fk_message_fk_utilisateur_reaction_type_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_message_fk_utilisateur_reaction_type_key UNIQUE (fk_message, fk_utilisateur, reaction_type);


--
-- TOC entry 4113 (class 2606 OID 245831)
-- Name: reaction reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_pkey PRIMARY KEY (id_reaction);


--
-- TOC entry 4091 (class 2606 OID 82394)
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (fk_role, fk_permission);


--
-- TOC entry 4069 (class 2606 OID 82294)
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id_role);


--
-- TOC entry 4053 (class 2606 OID 82223)
-- Name: statut statut_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.statut
    ADD CONSTRAINT statut_pkey PRIMARY KEY (id_statut);


--
-- TOC entry 4055 (class 2606 OID 82235)
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- TOC entry 4057 (class 2606 OID 82237)
-- Name: utilisateur utilisateur_google_id_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_google_id_key UNIQUE (google_id);


--
-- TOC entry 4059 (class 2606 OID 82233)
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);


--
-- TOC entry 4095 (class 2606 OID 229404)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fk_workspace_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fk_workspace_key UNIQUE (fk_utilisateur, fk_workspace);


--
-- TOC entry 4097 (class 2606 OID 229402)
-- Name: workspace_favoris workspace_favoris_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_pkey PRIMARY KEY (id_workspace_favoris);


--
-- TOC entry 4079 (class 2606 OID 82339)
-- Name: workspace_invitations workspace_invitations_fk_workspace_email_invite_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_fk_workspace_email_invite_key UNIQUE (fk_workspace, email_invite);


--
-- TOC entry 4081 (class 2606 OID 82335)
-- Name: workspace_invitations workspace_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id_invitation);


--
-- TOC entry 4083 (class 2606 OID 82337)
-- Name: workspace_invitations workspace_invitations_token_invitation_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_token_invitation_key UNIQUE (token_invitation);


--
-- TOC entry 4061 (class 2606 OID 82250)
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id_workspace);


--
-- TOC entry 4076 (class 1259 OID 82427)
-- Name: idx_invitation_email; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_email ON public.workspace_invitations USING btree (email_invite);


--
-- TOC entry 4077 (class 1259 OID 82426)
-- Name: idx_invitation_workspace; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_workspace ON public.workspace_invitations USING btree (fk_workspace);


--
-- TOC entry 4104 (class 1259 OID 229515)
-- Name: idx_message_prive_conversation; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_conversation ON public.message_prive USING btree (fk_expediteur, fk_destinataire);


--
-- TOC entry 4105 (class 1259 OID 229514)
-- Name: idx_message_prive_date_envoi; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_date_envoi ON public.message_prive USING btree (date_envoi);


--
-- TOC entry 4106 (class 1259 OID 229513)
-- Name: idx_message_prive_destinataire; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_destinataire ON public.message_prive USING btree (fk_destinataire);


--
-- TOC entry 4107 (class 1259 OID 229512)
-- Name: idx_message_prive_expediteur; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_expediteur ON public.message_prive USING btree (fk_expediteur);


--
-- TOC entry 4118 (class 1259 OID 262222)
-- Name: idx_notification_utilisateur_read; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_notification_utilisateur_read ON public.notification USING btree (fk_utilisateur, is_read);


--
-- TOC entry 4121 (class 1259 OID 278646)
-- Name: idx_private_message_reaction_message; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_private_message_reaction_message ON public.private_message_reaction USING btree (fk_message_prive);


--
-- TOC entry 4098 (class 1259 OID 229489)
-- Name: idx_push_subscriptions_endpoint; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions USING btree (endpoint);


--
-- TOC entry 4099 (class 1259 OID 229488)
-- Name: idx_push_subscriptions_user; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions USING btree (user_id);


--
-- TOC entry 4127 (class 2606 OID 82259)
-- Name: canal fk_canal_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT fk_canal_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4131 (class 2606 OID 245852)
-- Name: fichier fk_fichier_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fk_fichier_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4135 (class 2606 OID 82340)
-- Name: workspace_invitations fk_invitation_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT fk_invitation_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4132 (class 2606 OID 82322)
-- Name: membre_workspace fk_membre_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4133 (class 2606 OID 82312)
-- Name: membre_workspace fk_membre_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4134 (class 2606 OID 82317)
-- Name: membre_workspace fk_membre_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4128 (class 2606 OID 82271)
-- Name: message fk_message_canal; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_canal FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal);


--
-- TOC entry 4148 (class 2606 OID 229507)
-- Name: message_prive fk_message_prive_destinataire; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_destinataire FOREIGN KEY (fk_destinataire) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4149 (class 2606 OID 229502)
-- Name: message_prive fk_message_prive_expediteur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_expediteur FOREIGN KEY (fk_expediteur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4129 (class 2606 OID 82276)
-- Name: message fk_message_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4136 (class 2606 OID 82355)
-- Name: message_fichier fk_messagefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier);


--
-- TOC entry 4137 (class 2606 OID 82350)
-- Name: message_fichier fk_messagefichier_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4138 (class 2606 OID 82370)
-- Name: message_hashtag fk_messagehashtag_hashtag; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_hashtag FOREIGN KEY (fk_hashtag) REFERENCES public.hashtag(id_hashtag);


--
-- TOC entry 4139 (class 2606 OID 82365)
-- Name: message_hashtag fk_messagehashtag_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4140 (class 2606 OID 82380)
-- Name: message_mention fk_messagemention_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4141 (class 2606 OID 82385)
-- Name: message_mention fk_messagemention_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4144 (class 2606 OID 122931)
-- Name: message_prive_fichier fk_messageprivefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT fk_messageprivefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier) ON DELETE CASCADE;


--
-- TOC entry 4142 (class 2606 OID 82400)
-- Name: role_permission fk_rolepermission_permission; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_permission FOREIGN KEY (fk_permission) REFERENCES public.permission(id_permission);


--
-- TOC entry 4143 (class 2606 OID 82395)
-- Name: role_permission fk_rolepermission_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4126 (class 2606 OID 82238)
-- Name: utilisateur fk_utilisateur_statut; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT fk_utilisateur_statut FOREIGN KEY (fk_statut) REFERENCES public.statut(id_statut);


--
-- TOC entry 4130 (class 2606 OID 188437)
-- Name: message message_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message(id_message) ON DELETE SET NULL;


--
-- TOC entry 4150 (class 2606 OID 245859)
-- Name: message_prive message_prive_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT message_prive_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message_prive(id_message_prive);


--
-- TOC entry 4153 (class 2606 OID 262217)
-- Name: notification notification_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4154 (class 2606 OID 278636)
-- Name: private_message_reaction private_message_reaction_fk_message_prive_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_fk_message_prive_fkey FOREIGN KEY (fk_message_prive) REFERENCES public.message_prive(id_message_prive) ON DELETE CASCADE;


--
-- TOC entry 4155 (class 2606 OID 278641)
-- Name: private_message_reaction private_message_reaction_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.private_message_reaction
    ADD CONSTRAINT private_message_reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4147 (class 2606 OID 229483)
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4151 (class 2606 OID 245834)
-- Name: reaction reaction_fk_message_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message) ON DELETE CASCADE;


--
-- TOC entry 4152 (class 2606 OID 245839)
-- Name: reaction reaction_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4145 (class 2606 OID 229405)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4146 (class 2606 OID 229410)
-- Name: workspace_favoris workspace_favoris_fk_workspace_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE;


--
-- TOC entry 4335 (class 0 OID 0)
-- Dependencies: 4333
-- Name: DATABASE postgres; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON DATABASE postgres TO "paul.mazzon@supinfo.com";
GRANT ALL ON DATABASE postgres TO "rudy.gault@supinfo.com";
GRANT ALL ON DATABASE postgres TO "mathis.malzac@supinfo.com";
GRANT ALL ON DATABASE postgres TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4337 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON SCHEMA public TO "rudy.gault@supinfo.com";
GRANT ALL ON SCHEMA public TO "paul.mazzon@supinfo.com";
GRANT ALL ON SCHEMA public TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4338 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE canal; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4340 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE membre_workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE message; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE message_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE message_hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE message_mention; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE message_prive; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE message_prive_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4349 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE message_read; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_read TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_read TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_read TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4351 (class 0 OID 0)
-- Dependencies: 241
-- Name: SEQUENCE message_read_id_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.message_read_id_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.message_read_id_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.message_read_id_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4352 (class 0 OID 0)
-- Dependencies: 240
-- Name: TABLE message_with_alias; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4353 (class 0 OID 0)
-- Dependencies: 243
-- Name: TABLE notification; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4354 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4355 (class 0 OID 0)
-- Dependencies: 245
-- Name: TABLE private_message_reaction; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.private_message_reaction TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.private_message_reaction TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.private_message_reaction TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4357 (class 0 OID 0)
-- Dependencies: 244
-- Name: SEQUENCE private_message_reaction_id_reaction_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.private_message_reaction_id_reaction_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.private_message_reaction_id_reaction_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.private_message_reaction_id_reaction_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4358 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4360 (class 0 OID 0)
-- Dependencies: 235
-- Name: SEQUENCE push_subscriptions_id_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4361 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE reaction; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4363 (class 0 OID 0)
-- Dependencies: 238
-- Name: SEQUENCE reaction_id_reaction_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4364 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE role; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4365 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE role_permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4366 (class 0 OID 0)
-- Dependencies: 217
-- Name: TABLE statut; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4367 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE utilisateur; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4368 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE workspace_favoris; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 233
-- Name: SEQUENCE workspace_favoris_id_workspace_favoris_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4374 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE workspace_invitations; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 2154 (class 826 OID 65747)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 2153 (class 826 OID 65746)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "mathis.malzac.user@supinfo.com";


-- Completed on 2025-05-05 13:55:18

--
-- PostgreSQL database dump complete
--

