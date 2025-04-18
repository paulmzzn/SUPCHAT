--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 17.2

-- Started on 2025-04-17 14:41:23

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
-- TOC entry 4287 (class 1262 OID 5)
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
-- TOC entry 4288 (class 0 OID 0)
-- Dependencies: 4287
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
-- TOC entry 4290 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: azure_pg_admin
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 241 (class 1255 OID 81930)
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
    fk_workspace uuid NOT NULL
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
    date_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    fk_role integer NOT NULL
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
-- TOC entry 233 (class 1259 OID 122890)
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
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.message_prive OWNER TO rootmath;

--
-- TOC entry 4300 (class 0 OID 0)
-- Dependencies: 233
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
-- TOC entry 235 (class 1259 OID 122936)
-- Name: notification; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.notification (
    id_notification uuid DEFAULT public.random_uuid() NOT NULL,
    fk_utilisateur uuid NOT NULL,
    type_notification character varying(50) NOT NULL,
    contenu text,
    donnees jsonb DEFAULT '{}'::jsonb,
    est_lu boolean DEFAULT false,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- TOC entry 232 (class 1259 OID 82405)
-- Name: reaction; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.reaction (
    id_reaction uuid DEFAULT public.random_uuid() NOT NULL,
    fk_message uuid,
    fk_utilisateur uuid NOT NULL,
    emoji_unicode text DEFAULT '{"❔"}'::text NOT NULL,
    date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type_cible character varying(50) DEFAULT 'message'::character varying,
    fk_message_prive uuid,
    reaction_type character varying(50) DEFAULT 'thumbsUp'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_reaction_target_type CHECK ((((fk_message IS NOT NULL) AND (fk_message_prive IS NULL) AND ((type_cible)::text = 'message'::text)) OR ((fk_message IS NULL) AND (fk_message_prive IS NOT NULL) AND ((type_cible)::text = 'message_prive'::text))))
);


ALTER TABLE public.reaction OWNER TO rootmath;

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
-- TOC entry 237 (class 1259 OID 229396)
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
-- TOC entry 236 (class 1259 OID 229395)
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
-- TOC entry 4312 (class 0 OID 0)
-- Dependencies: 236
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
-- TOC entry 4314 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE workspace_invitations; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.workspace_invitations IS 'Stocke les invitations envoyées aux utilisateurs pour rejoindre un workspace';


--
-- TOC entry 4315 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN workspace_invitations.token_invitation; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.workspace_invitations.token_invitation IS 'Token unique pour accepter l''invitation';


--
-- TOC entry 4027 (class 2604 OID 229399)
-- Name: workspace_favoris id_workspace_favoris; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris ALTER COLUMN id_workspace_favoris SET DEFAULT nextval('public.workspace_favoris_id_workspace_favoris_seq'::regclass);


--
-- TOC entry 4264 (class 0 OID 82251)
-- Dependencies: 220
-- Data for Name: canal; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.canal (id_canal, nom, is_private, date_creation, fk_workspace) FROM stdin;
b6053270-d186-1a75-d003-147b121db143	Général	f	2025-04-01 12:49:56.571088	f086734d-23a4-ae64-e38c-e9b501fc1f5b
12f5ec8f-75d7-9374-b80d-3547c99a7f07	test	f	2025-04-01 14:45:30.106802	f086734d-23a4-ae64-e38c-e9b501fc1f5b
118a7c79-f7f8-0da5-53ac-e65f6278d7a1	la golden shower	f	2025-04-07 12:35:51.108824	10573a1f-2a9a-1be3-a9bb-d1bd3eb53ddb
\.


--
-- TOC entry 4266 (class 0 OID 82281)
-- Dependencies: 222
-- Data for Name: fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.fichier (id_fichier, nom_fichier, url, type, date_upload) FROM stdin;
\.


--
-- TOC entry 4269 (class 0 OID 82301)
-- Dependencies: 225
-- Data for Name: hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.hashtag (id_hashtag, label) FROM stdin;
\.


--
-- TOC entry 4270 (class 0 OID 82307)
-- Dependencies: 226
-- Data for Name: membre_workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.membre_workspace (fk_utilisateur, fk_workspace, fk_role) FROM stdin;
a5c1b268-937f-af11-4ca2-2c96634fbe2e	f086734d-23a4-ae64-e38c-e9b501fc1f5b	3
c8eb671d-f3b4-41f6-7364-0f292619dfdc	10573a1f-2a9a-1be3-a9bb-d1bd3eb53ddb	3
c8eb671d-f3b4-41f6-7364-0f292619dfdc	f086734d-23a4-ae64-e38c-e9b501fc1f5b	3
bb6a4d43-70d3-5e36-d943-dfdfc747491f	f086734d-23a4-ae64-e38c-e9b501fc1f5b	3
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	f086734d-23a4-ae64-e38c-e9b501fc1f5b	3
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	10573a1f-2a9a-1be3-a9bb-d1bd3eb53ddb	3
bb6a4d43-70d3-5e36-d943-dfdfc747491f	10573a1f-2a9a-1be3-a9bb-d1bd3eb53ddb	3
bb6a4d43-70d3-5e36-d943-dfdfc747491f	0c3ae3da-c1c1-e6d0-5609-25625babee6f	3
a5c1b268-937f-af11-4ca2-2c96634fbe2e	e674c4eb-fa4a-ca71-104d-af475e6119f9	3
a5c1b268-937f-af11-4ca2-2c96634fbe2e	dfc3204e-c40f-6645-d274-01086535bbd1	1
\.


--
-- TOC entry 4265 (class 0 OID 82264)
-- Dependencies: 221
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message (id_message, contenu, type_message, date_envoi, fk_canal, fk_utilisateur, created_at, updated_at, parent_id) FROM stdin;
f3ddb248-9e18-8588-1232-6d4784927ce6	@mistral salut ! Comment vas tu ?	\N	2025-04-08 14:26:50.057894	12f5ec8f-75d7-9374-b80d-3547c99a7f07	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-08 14:26:50.057894	\N	\N
cf97a9ef-5f82-b88b-6253-7528954e1572	Salut ! Je vais bien, merci. Comment puis-je t'aider aujourd'hui ?	\N	2025-04-08 14:26:51.261147	12f5ec8f-75d7-9374-b80d-3547c99a7f07	00000000-0000-0000-0000-000000000001	2025-04-08 14:26:51.261147	\N	\N
badfc3fb-64e8-ec2f-73fc-cc04f196adee	@mistral test	\N	2025-04-09 08:53:50.631882	12f5ec8f-75d7-9374-b80d-3547c99a7f07	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-09 08:53:50.631882	\N	\N
fd9e24f8-a517-7d2e-e4c2-b3e7409d3a81	Hello! Let's conduct a simple test to ensure I'm working correctly. I'll ask you a few questions, and you can respond with the appropriate answers. Let's start!\n\n1. What is the capital of France?\n   A) London\n   B) Paris\n   C) Madrid\n   D) Rome\n\nPlease reply with the letter corresponding to your answer.	\N	2025-04-09 08:53:52.529926	12f5ec8f-75d7-9374-b80d-3547c99a7f07	00000000-0000-0000-0000-000000000001	2025-04-09 08:53:52.529926	\N	\N
01a14bce-ba35-786b-dd8f-f1d5656809b7	@Paul MAZZON test	\N	2025-04-09 08:56:20.157306	12f5ec8f-75d7-9374-b80d-3547c99a7f07	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-09 08:56:20.157306	\N	badfc3fb-64e8-ec2f-73fc-cc04f196adee
7cf6b036-dc08-700e-8321-9cc20cb839f2	@Mistral ok	\N	2025-04-09 08:56:42.620061	12f5ec8f-75d7-9374-b80d-3547c99a7f07	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-09 08:56:42.620061	\N	cf97a9ef-5f82-b88b-6253-7528954e1572
17771fd3-cc93-3e51-c155-833695867b96	Hello! How can I assist you today? If you're up for it, I can tell a joke to lighten the mood. Here it is:\n\nWhat do you call a fake noodle?\n\nAn impasta!	\N	2025-04-09 08:56:43.904434	12f5ec8f-75d7-9374-b80d-3547c99a7f07	00000000-0000-0000-0000-000000000001	2025-04-09 08:56:43.904434	\N	\N
4bb23cca-282a-76c8-269d-a8337b2dcbf6	@Mistral AI Comment vas tu ?	\N	2025-04-09 09:03:42.608566	b6053270-d186-1a75-d003-147b121db143	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-09 09:03:42.608566	\N	\N
995c972b-629b-fc95-896c-dd08f9dcccb1	Je vais bien, merci ! Comment puis-je vous aider aujourd'hui ?	\N	2025-04-09 09:03:43.291618	b6053270-d186-1a75-d003-147b121db143	00000000-0000-0000-0000-000000000001	2025-04-09 09:03:43.291618	\N	\N
438ad7c9-d785-9667-4fe3-64339450235e	coucou 	\N	2025-04-09 18:30:09.734919	12f5ec8f-75d7-9374-b80d-3547c99a7f07	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-09 18:30:09.734919	\N	\N
d412a609-16bd-96dc-c50c-7dffee4228b6	@mistral quand a ete inventé les lunettes?	\N	2025-04-09 18:30:42.504349	12f5ec8f-75d7-9374-b80d-3547c99a7f07	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-09 18:30:42.504349	\N	\N
db99ac93-2b2e-7f22-0e7b-08fd1692cb32	@Mistral AI Salut	\N	2025-04-17 07:31:58.303174	12f5ec8f-75d7-9374-b80d-3547c99a7f07	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-17 07:31:58.303174	\N	\N
195583aa-eb35-655a-b1dc-2049129e0582	Hello! How can I assist you today? Let's have a friendly conversation. 😊 How are you doing?	\N	2025-04-17 07:32:02.3308	12f5ec8f-75d7-9374-b80d-3547c99a7f07	00000000-0000-0000-0000-000000000001	2025-04-17 07:32:02.3308	\N	\N
5c0d018e-b611-1ee8-d5b3-ac9fed06fa23	@Mistral AI Salut beau gosse	\N	2025-04-17 07:41:17.118112	b6053270-d186-1a75-d003-147b121db143	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-17 07:41:17.118112	\N	\N
ef7fe23a-1ec4-5501-df52-6ebb190a9197	Salut à toi aussi ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-17 07:41:18.898272	b6053270-d186-1a75-d003-147b121db143	00000000-0000-0000-0000-000000000001	2025-04-17 07:41:18.898272	\N	\N
bd2da166-6896-bd97-da2d-b1725c0e1aa5	@Mistral AI salut	\N	2025-04-17 07:44:02.982696	b6053270-d186-1a75-d003-147b121db143	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-17 07:44:02.982696	\N	\N
8841a02d-9731-eddb-8b08-87adf94e8588	Hello! How can I assist you today? Let's have a friendly conversation. 😊 How are you doing?	\N	2025-04-17 07:44:06.176226	b6053270-d186-1a75-d003-147b121db143	00000000-0000-0000-0000-000000000001	2025-04-17 07:44:06.176226	\N	\N
92f79161-222b-3ab1-a315-f24954d27358	@Mistral AI salut	\N	2025-04-17 07:44:14.526445	b6053270-d186-1a75-d003-147b121db143	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-17 07:44:14.526445	\N	\N
e2dff6dc-0e3a-1354-2f13-e5aed0ad1fbb	Hello! How can I assist you today? Let's have a friendly and engaging conversation. 😊 How are you doing?	\N	2025-04-17 07:44:21.723063	b6053270-d186-1a75-d003-147b121db143	00000000-0000-0000-0000-000000000001	2025-04-17 07:44:21.723063	\N	\N
39c39e5e-8de2-93bf-bc95-e20cb23a2b9d	@Mistral AI salut	\N	2025-04-17 07:47:36.366974	b6053270-d186-1a75-d003-147b121db143	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-17 07:47:36.366974	\N	\N
6eccf6da-3874-f87b-1ef8-87ee2bd45a1f	Hello! How can I assist you today? Let's have a friendly conversation. 😊 How are you doing?	\N	2025-04-17 07:47:41.27985	b6053270-d186-1a75-d003-147b121db143	00000000-0000-0000-0000-000000000001	2025-04-17 07:47:41.27985	\N	\N
0acf39f6-3dd0-ae5f-7be4-8e858f881890	@Mistral AI salut	\N	2025-04-17 07:49:06.035842	b6053270-d186-1a75-d003-147b121db143	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-17 07:49:06.035842	\N	\N
3b63a762-0d81-9bcf-e1c1-97c01eb11807	Hello! How can I assist you today? Let's have a friendly and engaging conversation. 😊 How are you doing?	\N	2025-04-17 07:49:07.609916	b6053270-d186-1a75-d003-147b121db143	00000000-0000-0000-0000-000000000001	2025-04-17 07:49:07.609916	\N	\N
593cc76c-241d-6a81-6aae-3db418fcd425	@Mistral AI heeelo	\N	2025-04-17 07:51:46.974779	b6053270-d186-1a75-d003-147b121db143	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-17 07:51:46.974779	\N	\N
deb07ee8-4c46-2203-4fb5-3a7e4634324b	Hello! How can I assist you today? Let's have a friendly conversation. 😊 How are you doing?	\N	2025-04-17 07:51:49.845885	b6053270-d186-1a75-d003-147b121db143	00000000-0000-0000-0000-000000000001	2025-04-17 07:51:49.845885	\N	\N
88712692-8cc6-b677-f7c3-6e75adc4380f	@Mistral AI salut	\N	2025-04-17 07:57:37.577534	12f5ec8f-75d7-9374-b80d-3547c99a7f07	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-17 07:57:37.577534	\N	\N
812acb9b-f4ac-535c-e9c5-789cc2062793	Hello! How can I assist you today? Let's have a friendly conversation. 😊 How are you doing?	\N	2025-04-17 07:57:39.974367	12f5ec8f-75d7-9374-b80d-3547c99a7f07	00000000-0000-0000-0000-000000000001	2025-04-17 07:57:39.974367	\N	\N
5df99389-1532-4a29-17a1-9c032bee51b2	@Paul MAZZON test	\N	2025-04-17 09:28:27.531083	b6053270-d186-1a75-d003-147b121db143	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-04-17 09:28:27.531083	\N	\N
5c521117-10ee-1b56-26d0-035e08a14a19	@Math'BigDick test	\N	2025-04-17 09:32:06.819777	b6053270-d186-1a75-d003-147b121db143	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-17 09:32:06.819777	\N	5df99389-1532-4a29-17a1-9c032bee51b2
6f2848df-90ee-777f-1330-191e12cd1013	jjj	\N	2025-04-17 09:38:47.901639	b6053270-d186-1a75-d003-147b121db143	bb6a4d43-70d3-5e36-d943-dfdfc747491f	2025-04-17 09:38:47.901639	\N	\N
\.


--
-- TOC entry 4272 (class 0 OID 82345)
-- Dependencies: 228
-- Data for Name: message_fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_fichier (fk_message, fk_fichier) FROM stdin;
\.


--
-- TOC entry 4273 (class 0 OID 82360)
-- Dependencies: 229
-- Data for Name: message_hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_hashtag (fk_message, fk_hashtag) FROM stdin;
\.


--
-- TOC entry 4274 (class 0 OID 82375)
-- Dependencies: 230
-- Data for Name: message_mention; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_mention (fk_message, fk_utilisateur) FROM stdin;
\.


--
-- TOC entry 4277 (class 0 OID 122890)
-- Dependencies: 233
-- Data for Name: message_prive; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_prive (id_message_prive, contenu, date_envoi, date_lecture, fk_expediteur, fk_destinataire, pieces_jointes, date_creation, date_modification, is_deleted) FROM stdin;
\.


--
-- TOC entry 4278 (class 0 OID 122921)
-- Dependencies: 234
-- Data for Name: message_prive_fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_prive_fichier (fk_message_prive, fk_fichier) FROM stdin;
\.


--
-- TOC entry 4279 (class 0 OID 122936)
-- Dependencies: 235
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.notification (id_notification, fk_utilisateur, type_notification, contenu, donnees, est_lu, date_creation) FROM stdin;
\.


--
-- TOC entry 4268 (class 0 OID 82295)
-- Dependencies: 224
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.permission (id_permission, type_permission) FROM stdin;
\.


--
-- TOC entry 4276 (class 0 OID 82405)
-- Dependencies: 232
-- Data for Name: reaction; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.reaction (id_reaction, fk_message, fk_utilisateur, emoji_unicode, date_creation, type_cible, fk_message_prive, reaction_type, created_at) FROM stdin;
3cb3836a-69e3-99ba-72f3-3aaccd3e13ee	88712692-8cc6-b677-f7c3-6e75adc4380f	a5c1b268-937f-af11-4ca2-2c96634fbe2e	{"❔"}	2025-04-17 07:58:50.607925	message	\N	surprise	2025-04-17 07:58:50.607925
d02cb5e3-f3e0-49e5-f425-cf8c72a32a8f	0acf39f6-3dd0-ae5f-7be4-8e858f881890	bb6a4d43-70d3-5e36-d943-dfdfc747491f	{"❔"}	2025-04-17 09:27:09.215334	message	\N	sad	2025-04-17 09:27:09.215334
\.


--
-- TOC entry 4267 (class 0 OID 82290)
-- Dependencies: 223
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role (id_role, nom_role) FROM stdin;
1	owner
2	admin
3	member
\.


--
-- TOC entry 4275 (class 0 OID 82390)
-- Dependencies: 231
-- Data for Name: role_permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role_permission (fk_role, fk_permission) FROM stdin;
\.


--
-- TOC entry 4261 (class 0 OID 82219)
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
-- TOC entry 4262 (class 0 OID 82224)
-- Dependencies: 218
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.utilisateur (id_utilisateur, nom, email, mot_de_passe, photo_de_profil, date_creation, fk_statut, google_id, is_activated, validation_code, reset_password_code, reset_password_expires, date_naissance, bio) FROM stdin;
c8eb671d-f3b4-41f6-7364-0f292619dfdc	Paul 2	paul.mazzon@icloud.com	$2a$10$husIr5kZtQDeVE44nNAz1eCZMM5w/74Cgu3RDzVQ8VAT4XNfnyLqi	\N	2025-04-01 12:32:20.707977	0	\N	t	\N	\N	\N	2004-01-06	
00000000-0000-0000-0000-000000000001	Mistral AI	bot@mistral.ai	dummy_password	https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp	2025-04-08 13:32:15.598295	1	\N	t	\N	\N	\N	\N	\N
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	Rudy	gault.rudy@gmail.com	$2a$10$KwpeHvkEQHur5hFUPhngEezuvRDMAB5EPMotu1xb/SE20ZL5YK0ki	\N	2025-02-27 13:11:18.704602	0	\N	t	\N	\N	\N	2010-02-27	j'aime la crotte
bb6a4d43-70d3-5e36-d943-dfdfc747491f	Math'BigDick	mathis.malzac@supinfo.com	$2a$10$ZQlN0LDqaRGKYlHVXj.F4eQf/CeBUuMRZDkUQZ3UYNJRyaWbCK72G	\N	2025-02-27 13:47:22.59845	1	\N	t	\N	\N	\N	2010-02-16	
a5c1b268-937f-af11-4ca2-2c96634fbe2e	Paul MAZZON	paul.mazzon@gmail.com	$2a$10$x0A7Vw3xf6GYahB1KJphV.QRqvWdBdUQJq0lHbMgx1oqfJqATe3MO	https://lh3.googleusercontent.com/a/ACg8ocLhoCSsOYjFP4M9QMgG50pJAZ5f_NMppmSe74ljctDAGUexDRO6=s96-c	2025-02-26 13:35:29.993728	1	113420320740006784252	t	853593	\N	\N	2004-01-06	Salut !
\.


--
-- TOC entry 4263 (class 0 OID 82243)
-- Dependencies: 219
-- Data for Name: workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace (id_workspace, nom, is_private, date_creation, banner_url, icon_url, description) FROM stdin;
425829c2-fbc9-bb69-157d-d06815e5b162	test	f	2025-04-17 12:12:31.770514	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/banners/1744891951807-Logo_Paul.png	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/icons/1744891952585-iconjpeg.jpg	test
e674c4eb-fa4a-ca71-104d-af475e6119f9	Paul	f	2025-04-17 12:15:39.775931	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/banners/1744892139814-Logo_Paul.png	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/icons/1744892140587-Logo_Paul.png	tets
10573a1f-2a9a-1be3-a9bb-d1bd3eb53ddb	test description	f	2025-03-17 15:33:57.872642	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/banners/1742225637943-Capture-dâÃ©cran-2025-03-17-Ã-10.58.16.png	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/icons/1742225639035-Capture-dâÃ©cran-2025-03-17-Ã-10.58.16.png	test description
9e70ddcd-229c-d97d-1e3c-854172766d52	Test	t	2025-04-01 07:56:01.84582	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/banners/1743494161907-banniere-popart-joyeuse-mot-amusant-dans-couleurs-vives-style-comique_124865-79127.jpg.avif	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/icons/1743494162562-banniere-popart-joyeuse-mot-amusant-dans-couleurs-vives-style-comique_124865-79127.jpg.avif	testtatdtf
f086734d-23a4-ae64-e38c-e9b501fc1f5b	SUPCHAT	f	2025-04-01 12:29:30.504155	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/banners/1743510570556-baniere_default.png	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/icons/1743510571098-icon.png	Le serveur officiel de Supchat
73dc8fab-4c40-3b4e-d3c9-eefffbecbed4	redctfvygbhnjk	f	2025-04-08 12:23:47.708433	\N	\N	sedrftgyhujiko
dfc3204e-c40f-6645-d274-01086535bbd1	test3	f	2025-04-17 12:18:17.134467	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/banners/1744892297194-Logo_Paul.png	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/icons/1744892297947-Logo_Paul.png	test
0c3ae3da-c1c1-e6d0-5609-25625babee6f	bhjn	f	2025-04-08 12:24:05.893784	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/banners/1744115046519-ChatGPT-Image-7-avr.-2025,-00_08_26.png	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/icons/1744115053285-ChatGPT-Image-7-avr.-2025,-00_08_26.png	bhnj
0983ca8d-c07d-cc6a-5600-20718a5b555a	bhjn	t	2025-04-08 12:24:12.687378	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/banners/1744115053047-ChatGPT-Image-7-avr.-2025,-00_08_26.png	https://bucket-supchat.s3.us-east-1.amazonaws.com/workspaces/icons/1744115059076-ChatGPT-Image-7-avr.-2025,-00_08_26.png	bhnj
f61d85b4-7886-4415-4d51-f1c20ab399ed	testtest	f	2025-04-17 09:32:34.688057	\N	\N	aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
\.


--
-- TOC entry 4281 (class 0 OID 229396)
-- Dependencies: 237
-- Data for Name: workspace_favoris; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_favoris (id_workspace_favoris, fk_utilisateur, fk_workspace, date_ajout) FROM stdin;
1	a5c1b268-937f-af11-4ca2-2c96634fbe2e	f086734d-23a4-ae64-e38c-e9b501fc1f5b	2025-04-17 12:07:35.006672
2	a5c1b268-937f-af11-4ca2-2c96634fbe2e	10573a1f-2a9a-1be3-a9bb-d1bd3eb53ddb	2025-04-17 12:07:42.694438
3	a5c1b268-937f-af11-4ca2-2c96634fbe2e	425829c2-fbc9-bb69-157d-d06815e5b162	2025-04-17 12:12:43.926494
4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	e674c4eb-fa4a-ca71-104d-af475e6119f9	2025-04-17 12:17:25.438462
\.


--
-- TOC entry 4271 (class 0 OID 82327)
-- Dependencies: 227
-- Data for Name: workspace_invitations; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_invitations (id_invitation, fk_workspace, email_invite, token_invitation, date_expiration, date_creation) FROM stdin;
\.


--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 236
-- Name: workspace_favoris_id_workspace_favoris_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.workspace_favoris_id_workspace_favoris_seq', 4, true);


--
-- TOC entry 4041 (class 2606 OID 82258)
-- Name: canal canal_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT canal_pkey PRIMARY KEY (id_canal);


--
-- TOC entry 4045 (class 2606 OID 82289)
-- Name: fichier fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fichier_pkey PRIMARY KEY (id_fichier);


--
-- TOC entry 4051 (class 2606 OID 82306)
-- Name: hashtag hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.hashtag
    ADD CONSTRAINT hashtag_pkey PRIMARY KEY (id_hashtag);


--
-- TOC entry 4053 (class 2606 OID 82311)
-- Name: membre_workspace membre_workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT membre_workspace_pkey PRIMARY KEY (fk_utilisateur, fk_workspace);


--
-- TOC entry 4063 (class 2606 OID 82349)
-- Name: message_fichier message_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT message_fichier_pkey PRIMARY KEY (fk_message, fk_fichier);


--
-- TOC entry 4065 (class 2606 OID 82364)
-- Name: message_hashtag message_hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT message_hashtag_pkey PRIMARY KEY (fk_message, fk_hashtag);


--
-- TOC entry 4067 (class 2606 OID 82379)
-- Name: message_mention message_mention_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT message_mention_pkey PRIMARY KEY (fk_message, fk_utilisateur);


--
-- TOC entry 4043 (class 2606 OID 82270)
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id_message);


--
-- TOC entry 4082 (class 2606 OID 122925)
-- Name: message_prive_fichier message_prive_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT message_prive_fichier_pkey PRIMARY KEY (fk_message_prive, fk_fichier);


--
-- TOC entry 4080 (class 2606 OID 122899)
-- Name: message_prive message_prive_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT message_prive_pkey PRIMARY KEY (id_message_prive);


--
-- TOC entry 4086 (class 2606 OID 122946)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id_notification);


--
-- TOC entry 4049 (class 2606 OID 82300)
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id_permission);


--
-- TOC entry 4072 (class 2606 OID 188445)
-- Name: reaction reaction_fk_message_fk_utilisateur_emoji_unicode_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_message_fk_utilisateur_emoji_unicode_key UNIQUE (fk_message, fk_utilisateur, emoji_unicode);


--
-- TOC entry 4074 (class 2606 OID 82413)
-- Name: reaction reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_pkey PRIMARY KEY (id_reaction);


--
-- TOC entry 4069 (class 2606 OID 82394)
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (fk_role, fk_permission);


--
-- TOC entry 4047 (class 2606 OID 82294)
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id_role);


--
-- TOC entry 4031 (class 2606 OID 82223)
-- Name: statut statut_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.statut
    ADD CONSTRAINT statut_pkey PRIMARY KEY (id_statut);


--
-- TOC entry 4033 (class 2606 OID 82235)
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- TOC entry 4035 (class 2606 OID 82237)
-- Name: utilisateur utilisateur_google_id_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_google_id_key UNIQUE (google_id);


--
-- TOC entry 4037 (class 2606 OID 82233)
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);


--
-- TOC entry 4088 (class 2606 OID 229404)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fk_workspace_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fk_workspace_key UNIQUE (fk_utilisateur, fk_workspace);


--
-- TOC entry 4090 (class 2606 OID 229402)
-- Name: workspace_favoris workspace_favoris_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_pkey PRIMARY KEY (id_workspace_favoris);


--
-- TOC entry 4057 (class 2606 OID 82339)
-- Name: workspace_invitations workspace_invitations_fk_workspace_email_invite_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_fk_workspace_email_invite_key UNIQUE (fk_workspace, email_invite);


--
-- TOC entry 4059 (class 2606 OID 82335)
-- Name: workspace_invitations workspace_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id_invitation);


--
-- TOC entry 4061 (class 2606 OID 82337)
-- Name: workspace_invitations workspace_invitations_token_invitation_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_token_invitation_key UNIQUE (token_invitation);


--
-- TOC entry 4039 (class 2606 OID 82250)
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id_workspace);


--
-- TOC entry 4054 (class 1259 OID 82427)
-- Name: idx_invitation_email; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_email ON public.workspace_invitations USING btree (email_invite);


--
-- TOC entry 4055 (class 1259 OID 82426)
-- Name: idx_invitation_workspace; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_workspace ON public.workspace_invitations USING btree (fk_workspace);


--
-- TOC entry 4075 (class 1259 OID 122913)
-- Name: idx_message_prive_conversation; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_conversation ON public.message_prive USING btree (fk_expediteur, fk_destinataire);


--
-- TOC entry 4076 (class 1259 OID 122912)
-- Name: idx_message_prive_date_envoi; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_date_envoi ON public.message_prive USING btree (date_envoi);


--
-- TOC entry 4077 (class 1259 OID 122911)
-- Name: idx_message_prive_destinataire; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_destinataire ON public.message_prive USING btree (fk_destinataire);


--
-- TOC entry 4078 (class 1259 OID 122910)
-- Name: idx_message_prive_expediteur; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_expediteur ON public.message_prive USING btree (fk_expediteur);


--
-- TOC entry 4083 (class 1259 OID 122953)
-- Name: idx_notification_type; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_notification_type ON public.notification USING btree (type_notification);


--
-- TOC entry 4084 (class 1259 OID 122952)
-- Name: idx_notification_utilisateur_nonlues; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_notification_utilisateur_nonlues ON public.notification USING btree (fk_utilisateur) WHERE (est_lu = false);


--
-- TOC entry 4070 (class 1259 OID 188442)
-- Name: idx_reaction_message; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_reaction_message ON public.reaction USING btree (fk_message);


--
-- TOC entry 4092 (class 2606 OID 82259)
-- Name: canal fk_canal_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT fk_canal_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4099 (class 2606 OID 82340)
-- Name: workspace_invitations fk_invitation_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT fk_invitation_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4096 (class 2606 OID 82322)
-- Name: membre_workspace fk_membre_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4097 (class 2606 OID 82312)
-- Name: membre_workspace fk_membre_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4098 (class 2606 OID 82317)
-- Name: membre_workspace fk_membre_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4093 (class 2606 OID 82271)
-- Name: message fk_message_canal; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_canal FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal);


--
-- TOC entry 4111 (class 2606 OID 122905)
-- Name: message_prive fk_message_prive_destinataire; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_destinataire FOREIGN KEY (fk_destinataire) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4112 (class 2606 OID 122900)
-- Name: message_prive fk_message_prive_expediteur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_expediteur FOREIGN KEY (fk_expediteur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4094 (class 2606 OID 82276)
-- Name: message fk_message_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4100 (class 2606 OID 82355)
-- Name: message_fichier fk_messagefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier);


--
-- TOC entry 4101 (class 2606 OID 82350)
-- Name: message_fichier fk_messagefichier_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4102 (class 2606 OID 82370)
-- Name: message_hashtag fk_messagehashtag_hashtag; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_hashtag FOREIGN KEY (fk_hashtag) REFERENCES public.hashtag(id_hashtag);


--
-- TOC entry 4103 (class 2606 OID 82365)
-- Name: message_hashtag fk_messagehashtag_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4104 (class 2606 OID 82380)
-- Name: message_mention fk_messagemention_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4105 (class 2606 OID 82385)
-- Name: message_mention fk_messagemention_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4113 (class 2606 OID 122931)
-- Name: message_prive_fichier fk_messageprivefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT fk_messageprivefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier) ON DELETE CASCADE;


--
-- TOC entry 4114 (class 2606 OID 122926)
-- Name: message_prive_fichier fk_messageprivefichier_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT fk_messageprivefichier_message FOREIGN KEY (fk_message_prive) REFERENCES public.message_prive(id_message_prive) ON DELETE CASCADE;


--
-- TOC entry 4115 (class 2606 OID 122947)
-- Name: notification fk_notification_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT fk_notification_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4108 (class 2606 OID 82416)
-- Name: reaction fk_reaction_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT fk_reaction_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4109 (class 2606 OID 122915)
-- Name: reaction fk_reaction_message_prive; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT fk_reaction_message_prive FOREIGN KEY (fk_message_prive) REFERENCES public.message_prive(id_message_prive) ON DELETE CASCADE;


--
-- TOC entry 4110 (class 2606 OID 82421)
-- Name: reaction fk_reaction_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT fk_reaction_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4106 (class 2606 OID 82400)
-- Name: role_permission fk_rolepermission_permission; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_permission FOREIGN KEY (fk_permission) REFERENCES public.permission(id_permission);


--
-- TOC entry 4107 (class 2606 OID 82395)
-- Name: role_permission fk_rolepermission_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4091 (class 2606 OID 82238)
-- Name: utilisateur fk_utilisateur_statut; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT fk_utilisateur_statut FOREIGN KEY (fk_statut) REFERENCES public.statut(id_statut);


--
-- TOC entry 4095 (class 2606 OID 188437)
-- Name: message message_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message(id_message) ON DELETE SET NULL;


--
-- TOC entry 4116 (class 2606 OID 229405)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4117 (class 2606 OID 229410)
-- Name: workspace_favoris workspace_favoris_fk_workspace_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE;


--
-- TOC entry 4289 (class 0 OID 0)
-- Dependencies: 4287
-- Name: DATABASE postgres; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON DATABASE postgres TO "paul.mazzon@supinfo.com";
GRANT ALL ON DATABASE postgres TO "rudy.gault@supinfo.com";
GRANT ALL ON DATABASE postgres TO "mathis.malzac@supinfo.com";
GRANT ALL ON DATABASE postgres TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4291 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON SCHEMA public TO "rudy.gault@supinfo.com";
GRANT ALL ON SCHEMA public TO "paul.mazzon@supinfo.com";
GRANT ALL ON SCHEMA public TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4292 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE canal; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4293 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4294 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4295 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE membre_workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4296 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE message; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4297 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE message_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4298 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE message_hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4299 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE message_mention; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4301 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE message_prive; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4302 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE message_prive_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4303 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE notification; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notification TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4304 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4305 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE reaction; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4306 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE role; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4307 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE role_permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4308 (class 0 OID 0)
-- Dependencies: 217
-- Name: TABLE statut; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4309 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE utilisateur; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4310 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4311 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE workspace_favoris; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4313 (class 0 OID 0)
-- Dependencies: 236
-- Name: SEQUENCE workspace_favoris_id_workspace_favoris_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 4316 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE workspace_invitations; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 2134 (class 826 OID 65747)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "mathis.malzac.user@supinfo.com";


--
-- TOC entry 2133 (class 826 OID 65746)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "mathis.malzac.user@supinfo.com";


-- Completed on 2025-04-17 14:41:25

--
-- PostgreSQL database dump complete
--

