--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 17.2

-- Started on 2025-04-26 15:37:33

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
-- TOC entry 4307 (class 1262 OID 5)
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
-- TOC entry 4308 (class 0 OID 0)
-- Dependencies: 4307
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
-- TOC entry 4310 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: azure_pg_admin
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 246 (class 1255 OID 81930)
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
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.message_prive OWNER TO rootmath;

--
-- TOC entry 4320 (class 0 OID 0)
-- Dependencies: 239
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
-- TOC entry 236 (class 1259 OID 229448)
-- Name: notifications; Type: TABLE; Schema: public; Owner: rootmath
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    recipient_id uuid NOT NULL,
    sender_id uuid,
    content text NOT NULL,
    reference_id integer,
    reference_type character varying(50),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    read_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO rootmath;

--
-- TOC entry 235 (class 1259 OID 229447)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: rootmath
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO rootmath;

--
-- TOC entry 4325 (class 0 OID 0)
-- Dependencies: 235
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rootmath
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


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
-- TOC entry 4329 (class 0 OID 0)
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
-- TOC entry 4332 (class 0 OID 0)
-- Dependencies: 240
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
-- TOC entry 4340 (class 0 OID 0)
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
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE workspace_invitations; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON TABLE public.workspace_invitations IS 'Stocke les invitations envoyées aux utilisateurs pour rejoindre un workspace';


--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN workspace_invitations.token_invitation; Type: COMMENT; Schema: public; Owner: rootmath
--

COMMENT ON COLUMN public.workspace_invitations.token_invitation IS 'Token unique pour accepter l''invitation';


--
-- TOC entry 4026 (class 2604 OID 229451)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4029 (class 2604 OID 229474)
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- TOC entry 4037 (class 2604 OID 245828)
-- Name: reaction id_reaction; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction ALTER COLUMN id_reaction SET DEFAULT nextval('public.reaction_id_reaction_seq'::regclass);


--
-- TOC entry 4024 (class 2604 OID 229399)
-- Name: workspace_favoris id_workspace_favoris; Type: DEFAULT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris ALTER COLUMN id_workspace_favoris SET DEFAULT nextval('public.workspace_favoris_id_workspace_favoris_seq'::regclass);


--
-- TOC entry 4280 (class 0 OID 82251)
-- Dependencies: 220
-- Data for Name: canal; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.canal (id_canal, nom, is_private, date_creation, fk_workspace) FROM stdin;
899845e2-2633-3c26-423f-e0ed9f114ff4	General	f	2025-04-18 07:23:56.246689	3daf3712-3c74-8c8b-e24c-24cf238e3b60
23e4dc54-0b4e-8ac4-e740-e93411bf0694	test	f	2025-04-18 08:33:08.745072	82572ba1-92f0-7442-6f0b-5d478712b328
689b21fc-db42-a098-39bf-28a6a72d48f1	sdcvdv	f	2025-04-18 12:57:29.203775	82572ba1-92f0-7442-6f0b-5d478712b328
d1f24d6c-1a6e-7e47-3383-d8cd05d9b793	test	f	2025-04-26 11:14:31.482629	7d5591bd-1f13-5097-6844-a248009820eb
\.


--
-- TOC entry 4282 (class 0 OID 82281)
-- Dependencies: 222
-- Data for Name: fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.fichier (id_fichier, nom_fichier, url, type, date_upload, taille_fichier, extension, mime_type, fk_utilisateur) FROM stdin;
fc0e5cb2-74b3-f93b-76c2-d2cc9d0eb00f	Capture dâÃ©cran 2025-04-17 132206.png	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744967833812-Capture-dâÃ©cran-2025-04-17-132206.png	image/png	2025-04-18 09:17:15.565997	\N	\N	\N	\N
992d0ac4-e7e6-348b-31e5-3069d68712b5	file.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744967862162-file.pdf	application/pdf	2025-04-18 09:17:44.019326	\N	\N	\N	\N
68da03a1-4161-e306-6d91-ae629dfb51b9	671a0e031077ee7ae0ff3c80.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744967892062-671a0e031077ee7ae0ff3c80.pdf	application/pdf	2025-04-18 09:18:14.114486	\N	\N	\N	\N
818baf7d-e191-491f-3f7f-3bd963c0f809	Capture dâÃ©cran 2025-04-17 132206.png	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744968251576-Capture-dâÃ©cran-2025-04-17-132206.png	image/png	2025-04-18 09:24:13.653678	\N	\N	\N	\N
ad9baea2-a086-421f-d5f2-e6ad358e24d2	671a0e031077ee7ae0ff3c80.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744968352187-671a0e031077ee7ae0ff3c80.pdf	application/pdf	2025-04-18 09:25:54.784077	\N	\N	\N	\N
e62aa9a3-c834-260f-f965-f3e4fb140c1a	test.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744968562473-test.pdf	application/pdf	2025-04-18 09:29:24.434718	\N	\N	\N	\N
ee864b10-c08a-51fb-d8c3-fdcd8bbf49a2	file.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744969148076-file.pdf	application/pdf	2025-04-18 09:39:09.924321	\N	\N	\N	\N
6feb76b9-5017-482c-9a19-6ec10831054a	test.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744970068996-test.pdf	application/pdf	2025-04-18 09:54:30.849589	\N	\N	\N	\N
68b6940e-21c2-d126-a162-d3d7cba0d591	Ordre de passage - 3ANDM.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744977706733-Ordre-de-passage---3ANDM.pdf	application/pdf	2025-04-18 12:01:48.868447	\N	\N	\N	\N
467b3c50-f88e-9d5f-4675-8b1c6c9f1321	Ordre de passage - 3ANDM.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744980557465-Ordre-de-passage---3ANDM.pdf	application/pdf	2025-04-18 12:49:19.632039	\N	\N	\N	\N
b07bba1c-e329-13b4-16f9-d315bf752df5	Carte_A_Imprimer.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744980713443-Carte_A_Imprimer.pdf	application/pdf	2025-04-18 12:51:55.459117	\N	\N	\N	\N
225f5a2f-6a35-2f25-1660-3b94f3dde396	Ordre de passage - 3ANDM.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744980887500-Ordre-de-passage---3ANDM.pdf	application/pdf	2025-04-18 12:54:49.730114	\N	\N	\N	\N
76af20d4-f606-5ba8-5fe4-4048a7b39c3b	Capture dâÃ©cran 2025-04-11 171716.png	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744981153612-Capture-dâÃ©cran-2025-04-11-171716.png	image/png	2025-04-18 12:59:15.758334	\N	\N	\N	\N
c24bba9e-57d6-bd70-3aed-a7780617748c	Ordre de passage - 3ANDM.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744981293319-Ordre-de-passage---3ANDM.pdf	application/pdf	2025-04-18 13:01:34.948125	\N	\N	\N	\N
7ceac805-13aa-45a4-f043-70b452dcfc3f	Carte_A_Imprimer.pdf	https://s3.fr-par.scw.cloud/s3-supchat/messages/23e4dc54-0b4e-8ac4-e740-e93411bf0694/files/1744982340072-Carte_A_Imprimer.pdf	application/pdf	2025-04-18 13:19:02.316647	\N	\N	\N	\N
dd90f69a-829f-fa7b-a485-59546bc6c910	IMG_6359.jpg	private-messages/files/58e2fd46-996a-411c-9b14-379a2c8a5c5d.jpg	image/jpeg	2025-04-26 13:03:15.720869	9834942	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
21960226-90c0-69ff-33f7-d8efcac124b4	IMG_6359.jpg	private-messages/files/d4d58310-7dda-4172-ad67-ec2e9c9b23d1.jpg	image/jpeg	2025-04-26 13:12:24.696595	9834942	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
63a865d0-3984-97a1-614f-bc263e76f6c1	IMG_6359.jpg	private-messages/files/62a6d454-1555-47d3-b6b2-edc927bd574b.jpg	image/jpeg	2025-04-26 13:18:04.334705	9834942	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
f18d6f97-f393-9250-e76f-0f50a08496ce	IMG_6359.jpg	private-messages/files/d724828b-1329-4ae0-9370-38784f7f158b.jpg	image/jpeg	2025-04-26 13:20:14.975652	9834942	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
246a8e16-7b61-8ea4-fe5b-8091f01073f5	IMG_6359.jpg	private-messages/files/2d045a73-a99a-44b4-a682-90f1a458fe4a.jpg	image/jpeg	2025-04-26 13:24:47.03524	9834942	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
32ae889d-ba56-46b3-ec24-091ef07b3f9f	mermaid-diagram-2025-04-16-111418.png	private-messages/files/51400ab2-f018-4eaf-9ada-02a3a8439bf4.png	image/png	2025-04-26 13:26:01.9927	105970	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
b4876742-ae33-da97-3ff9-ae3b41d02c42	Capture dâÃ©cran 2025-04-11 171716.png	private-messages/files/ed91bb9f-b056-476f-8718-c8f2716104fc.png	image/png	2025-04-26 13:29:30.088653	55539	\N	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63
\.


--
-- TOC entry 4285 (class 0 OID 82301)
-- Dependencies: 225
-- Data for Name: hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.hashtag (id_hashtag, label) FROM stdin;
\.


--
-- TOC entry 4286 (class 0 OID 82307)
-- Dependencies: 226
-- Data for Name: membre_workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.membre_workspace (fk_utilisateur, fk_workspace, fk_role, ordre) FROM stdin;
a5c1b268-937f-af11-4ca2-2c96634fbe2e	3daf3712-3c74-8c8b-e24c-24cf238e3b60	3	1
a5c1b268-937f-af11-4ca2-2c96634fbe2e	7d5591bd-1f13-5097-6844-a248009820eb	1	2
a5c1b268-937f-af11-4ca2-2c96634fbe2e	82572ba1-92f0-7442-6f0b-5d478712b328	3	3
bb6a4d43-70d3-5e36-d943-dfdfc747491f	3daf3712-3c74-8c8b-e24c-24cf238e3b60	3	1
c8eb671d-f3b4-41f6-7364-0f292619dfdc	3daf3712-3c74-8c8b-e24c-24cf238e3b60	3	1
c8eb671d-f3b4-41f6-7364-0f292619dfdc	7d5591bd-1f13-5097-6844-a248009820eb	2	2
c8eb671d-f3b4-41f6-7364-0f292619dfdc	82572ba1-92f0-7442-6f0b-5d478712b328	3	3
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	7d5591bd-1f13-5097-6844-a248009820eb	2	1
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	82572ba1-92f0-7442-6f0b-5d478712b328	3	2
\.


--
-- TOC entry 4281 (class 0 OID 82264)
-- Dependencies: 221
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message (id_message, contenu, type_message, date_envoi, fk_canal, fk_utilisateur, created_at, updated_at, parent_id) FROM stdin;
0c6a4f5b-137a-c946-c332-5f5f40830648	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) Salut	\N	2025-04-18 11:34:18.048941	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:34:18.048941	\N	\N
d6c012e9-b287-6e77-8bbf-9c191e58be8f	@[Mistral AI](00000000-0000-0000-0000-000000000001) Salut	\N	2025-04-18 11:37:19.680965	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:37:19.680965	\N	\N
8d329537-34c9-c9eb-f0ab-1ea1ae06d81a	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) dfssdf	\N	2025-04-18 11:40:02.59187	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:40:02.59187	\N	\N
753bf6b6-57db-1465-959c-0fa8887dbd45	@Mistral AI Salut	\N	2025-04-18 11:41:04.967779	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:41:04.967779	\N	\N
63f1b2e4-f2cb-977f-50a9-a99f88ecf92a	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-18 11:41:05.609842	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 11:41:05.609842	\N	\N
2b1688d8-01ca-bbf8-d136-4151a90ea108	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) Salut	\N	2025-04-18 11:45:12.47902	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:45:12.47902	\N	\N
7cfe805e-a92e-9e42-4ba1-1976fdf78e09	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) test	\N	2025-04-18 11:46:44.144724	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:46:44.144724	\N	\N
a458a83a-ee19-ef16-9f04-27a56ca4ed1e	@Mistral AI Salut beau gosse	\N	2025-04-18 12:01:46.251293	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:01:46.251293	\N	\N
79068958-ec19-3a7b-0e1c-eb82f1d7c7bd	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-18 12:01:51.303819	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 12:01:51.303819	\N	\N
c6811467-72c6-373d-21c4-34516fb901fb	test	\N	2025-04-18 12:02:48.51174	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:02:48.51174	\N	\N
dc03b1e3-0c21-320d-ac63-d2501dc58ce4	Hello! How can I assist you today? Let's have a friendly and engaging conversation. Here are a few things we could do:\n\n1. **Trivia**: I can share interesting facts or trivia on a topic of your choice.\n2. **Jokes**: I can tell you a joke to lighten the mood.\n3. **Word association**: I say a word, and you respond with the first word that comes to your mind. We can go back and forth.\n4. **Story building**: We can build a story together, taking turns adding sentences.\n5. **Q&A**: I can answer your questions to the best of my ability.\n\nWhat would you like to do? Or, if you have something else in mind, just let me know!	\N	2025-04-18 07:24:56.092961	899845e2-2633-3c26-423f-e0ed9f114ff4	00000000-0000-0000-0000-000000000001	2025-04-18 07:24:56.092961	\N	\N
fb87cc97-c393-0aca-014f-d2a5fefc7cfa	test	\N	2025-04-18 07:32:45.316867	899845e2-2633-3c26-423f-e0ed9f114ff4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 07:32:45.316867	\N	\N
64547e89-c94d-b60e-6f6b-3cd1d3f0fbb0	yo	\N	2025-04-18 09:01:59.125272	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:01:59.125272	\N	\N
ffe965ce-e845-7608-54af-28f9df59a740	@Mistral AI Salut	\N	2025-04-18 07:24:50.675986	899845e2-2633-3c26-423f-e0ed9f114ff4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 07:24:50.675986	\N	\N
90f53c78-4670-5a92-eb2d-8a4896070736	yo	\N	2025-04-18 09:06:32.951966	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 09:06:32.951966	\N	\N
00d9a1e6-28e4-2d09-6c55-bc1cd602da21	\N	\N	2025-04-18 09:13:55.182445	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:13:55.182445	\N	\N
260d3655-ad12-6300-3390-074db4b8227d	\N	\N	2025-04-18 09:17:15.590464	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:17:15.590464	\N	\N
3160e5ee-45ca-1adf-5bcb-0c7313837885	\N	\N	2025-04-18 09:17:44.042037	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:17:44.042037	\N	\N
57dfcc87-aa6c-cb26-63a7-67a6fef026bb	\N	\N	2025-04-18 09:18:14.132951	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:18:14.132951	\N	\N
ab9e23e0-597a-ba4b-3660-afd2b6ff1575	\N	\N	2025-04-18 09:24:13.677556	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:24:13.677556	\N	\N
8a321192-6032-8a13-146c-30b8e689799a	hello	\N	2025-04-18 09:25:54.892253	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:25:54.892253	\N	\N
cbf7221b-c745-4c2a-4f01-cb220744f06f	hello	\N	2025-04-18 09:29:24.458976	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:29:24.458976	\N	\N
37eeec36-1dea-b4a7-5d4e-e79a56d95046	@Paul MAZZON test	\N	2025-04-18 09:31:13.826125	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 09:31:13.826125	\N	\N
f71d40c0-8a6d-0084-2da0-fa9bfe481b87	@Paul MAZZON test	\N	2025-04-18 09:36:24.142975	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 09:36:24.142975	\N	\N
d2c05a56-8d1e-c7f2-1b4c-160f751542b8	test	\N	2025-04-18 09:39:09.951179	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:39:09.951179	\N	37eeec36-1dea-b4a7-5d4e-e79a56d95046
daa3a5eb-28b9-c461-ab28-cbaf78afa69b	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) Salut	\N	2025-04-18 09:43:59.101241	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 09:43:59.101241	\N	\N
e5928da7-30af-934d-1e76-840280e6b6c7	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) salut	\N	2025-04-18 09:44:29.080421	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 09:44:29.080421	\N	\N
1a9d1b18-a378-4067-2556-708456ab0ca8	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) test	\N	2025-04-18 09:48:00.630766	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 09:48:00.630766	\N	\N
e2e16286-bbbc-57b0-970d-259eb4f20690	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) test	\N	2025-04-18 09:50:09.675807	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 09:50:09.675807	\N	\N
05b73415-1e7a-b403-7a17-294598f122d8	@MistalOCR hello	\N	2025-04-18 09:50:09.683684	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:50:09.683684	\N	\N
a397ab7c-26d3-c9f2-1a80-d533c46e7675	@Mistral OCR hello	\N	2025-04-18 09:50:48.511216	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:50:48.511216	\N	\N
24a9d317-a941-bf13-59db-3ef48ede5119	It looks like you're mentioning OCR, which stands for Optical Character Recognition. OCR is a technology used to convert different types of documents, such as scanned paper documents, PDFs, or images captured by a digital camera, into editable and searchable data.\n\nIf you have a specific OCR task or need help with something related to OCR, feel free to provide more details!	\N	2025-04-18 09:50:50.626222	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 09:50:50.626222	\N	\N
71a90e50-0e24-f8ba-f6da-b34a07efb7bb	hello	\N	2025-04-18 09:53:03.834729	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:53:03.834729	\N	\N
f2a3773b-d699-6ae5-af84-4160c85a2738	jbsdvbjsd	\N	2025-04-18 09:53:04.358777	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 09:53:04.358777	\N	\N
70a78107-ff40-4749-47fe-972b64e68529	xcvxcvx	\N	2025-04-18 09:53:06.982141	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 09:53:06.982141	\N	\N
ee377199-dda5-7f4e-7d3a-d7d6f336dc14	@[Paul 2](c8eb671d-f3b4-41f6-7364-0f292619dfdc) test	\N	2025-04-18 09:53:19.277824	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 09:53:19.277824	\N	\N
a1144c48-621d-fca7-5bc4-89edd0d74a0a	\N	\N	2025-04-18 09:54:30.872317	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:54:30.872317	\N	\N
7e611f54-69a6-32ae-1dd0-12f27166a965	@MistrlOCR que dit ce fichier ?	\N	2025-04-18 09:54:56.323194	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:54:56.323194	\N	a1144c48-621d-fca7-5bc4-89edd0d74a0a
8ebdd630-c511-71e4-4044-0cbefe45f494	@MistralOCR que dit ce fichier ?	\N	2025-04-18 09:55:18.517465	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 09:55:18.517465	\N	a1144c48-621d-fca7-5bc4-89edd0d74a0a
68d40e24-d17f-bd1e-f4f7-8a9e564761ee	Je ne peux pas directement analyser ou lire des fichiers. Cependant, je peux vous aider à comprendre comment utiliser un logiciel de reconnaissance optique de caractères (OCR) pour extraire du texte d'un fichier. Voici quelques étapes générales pour utiliser un logiciel OCR :\n\n1. **Choisir un logiciel OCR** : Il existe plusieurs logiciels OCR disponibles, tels que Adobe Acrobat, ABBYY FineReader, ou des outils en ligne comme Online OCR.\n\n2. **Télécharger et installer le logiciel** : Si vous n'avez pas encore de logiciel OCR, téléchargez-en un et suivez les instructions d'installation.\n\n3. **Ouvrir le fichier avec le logiciel OCR** :\n   - Si vous utilisez un logiciel installé sur votre ordinateur, ouvrez le fichier via l'interface du logiciel.\n   - Si vous utilisez un outil en ligne, téléchargez le fichier sur le site web de l'outil.\n\n4. **Lancer la reconnaissance OCR** : Suivez les instructions du logiciel pour lancer la reconnaissance de texte. Cela peut inclure la sélection de la langue du texte et d'autres paramètres spécifiques.\n\n5. **Vérifier et corriger le texte** : Une fois la reconnaissance terminée, vérifiez le texte extrait pour vous assurer qu'il est correct. Les logiciels OCR ne sont pas infaillibles et peuvent faire des erreurs, surtout avec des documents de mauvaise qualité.\n\n6. **Enregistrer le texte** : Enregistrez le texte extrait dans un format de votre choix, comme un document Word ou un fichier texte.\n\nSi vous avez des questions spécifiques sur l'utilisation d'un logiciel OCR particulier ou sur le traitement d'un type de fichier spécifique, n'hésitez pas à demander !	\N	2025-04-18 09:55:29.444622	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 09:55:29.444622	\N	\N
034828fc-2c41-aa15-676c-0bc3b73d9fbb	yo	\N	2025-04-18 11:08:33.375619	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 11:08:33.375619	\N	\N
0557b9a5-8858-17ea-c7ed-92f9894f49b2	yo	\N	2025-04-18 11:12:04.230463	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 11:12:04.230463	\N	\N
4ccd7aca-4379-2312-559a-4ae2e3ff3d87	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) Salut	\N	2025-04-18 11:34:08.63076	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:34:08.63076	\N	\N
d488ac2b-abc4-2f23-2006-6719bcd5d976	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) test	\N	2025-04-18 11:35:22.16844	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:35:22.16844	\N	\N
2d9112b7-7bb1-1b76-661e-8ce24e23989c	sdv	\N	2025-04-18 11:39:49.546633	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:39:49.546633	\N	\N
0ad3ed01-8433-4dd9-813e-2401c252711a	@Mistral AI comment	\N	2025-04-18 11:40:44.080586	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:40:44.080586	\N	\N
b9f30b5b-a42d-76d8-c92e-99a94d3726b4	Hello! How can I assist you today? If you're here to chat, that's great. Here are a few things we could do:\n\n1. **Topic Discussion**: We can discuss a wide range of topics, from science and technology to literature and history.\n2. **Q&A**: If you have specific questions, I'll do my best to provide helpful answers.\n3. **Jokes**: I can tell some jokes to lighten the mood.\n4. **Facts**: I can share interesting facts about various subjects.\n5. **Games**: We can play simple text-based games, like trivia or word association.\n\nWhat would you like to do?	\N	2025-04-18 11:40:47.579261	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 11:40:47.579261	\N	\N
15a116fd-1956-0e44-4d0b-426be01ba0c6	@Mistral AI Salut	\N	2025-04-18 11:44:59.912797	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:44:59.912797	\N	\N
7a98ffa2-838f-3cbb-4bba-7d40235dfa54	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-18 11:45:00.493849	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 11:45:00.493849	\N	\N
101ba7b0-60b3-3aa9-e2ff-1dccdaefdbe3	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) salut	\N	2025-04-18 11:45:25.829106	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:45:25.829106	\N	\N
c151ba88-e5eb-3221-910c-4d2d60e9d3d2	@Mistral AI Salute	\N	2025-04-18 11:47:07.331634	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 11:47:07.331634	\N	\N
74ab4754-7ee2-f492-01e5-191b4f242bfd	Hello! How are you today? Let's chat about anything you'd like. 😊	\N	2025-04-18 11:47:08.187919	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 11:47:08.187919	\N	\N
0cbf7527-8433-113e-ef1c-8fd9f548858f	\N	\N	2025-04-18 12:01:48.897802	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 12:01:48.897802	\N	\N
5963d29e-7695-6057-ef0b-e94be82f7df6	@Mistral AI Salut	\N	2025-04-18 12:09:18.033052	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:09:18.033052	\N	\N
d5ad180c-a24a-3ec1-d0a8-9fd191b28f06	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-18 12:09:18.795076	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 12:09:18.795076	\N	\N
cee66c0d-5a84-08ca-e38b-e2b6dddb4089	@Mistral hello	\N	2025-04-18 12:11:51.820301	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 12:11:51.820301	\N	\N
48b2a064-df7c-3b5d-3da3-e304402eed5c	Hello! How can I assist you today? Let's have a friendly conversation. 😊 How are you doing?	\N	2025-04-18 12:11:53.108366	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 12:11:53.108366	\N	\N
0b87f630-0ced-ac95-97a3-4113be0c5757	@Mistral AI Salut	\N	2025-04-18 12:12:59.273327	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:12:59.273327	\N	\N
deadf1af-ab72-217a-eeaf-2d936d1019a3	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-18 12:13:00.282498	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 12:13:00.282498	\N	\N
641d396f-becd-2344-e0ce-f452a1827b6b	@Mistral AI salut	\N	2025-04-18 12:13:06.537441	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:13:06.537441	\N	\N
635cbf90-7a64-79e8-d57a-34621243cf23	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-18 12:13:07.398211	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 12:13:07.398211	\N	\N
cc8c9ac4-d6cc-462e-69ce-2ed08f34e51d	@Mistral AI Salut	\N	2025-04-18 12:15:29.377127	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:15:29.377127	\N	\N
abc66081-9afb-3892-f7a0-0625844ec699	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-18 12:15:30.220854	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 12:15:30.220854	\N	\N
c02f1b91-19a1-72b7-7ca2-df33b56fffde	@Mistral AI Salut beau gosse	\N	2025-04-18 12:18:41.421778	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:18:41.421778	\N	\N
094d69d8-3562-2561-5345-65c32a260d1f	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-18 12:18:42.180583	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 12:18:42.180583	\N	\N
03623e6e-a82c-e8bd-cfb3-14fab36bb45b	@Mistral AI Salut beauy gosse	\N	2025-04-18 12:18:49.616177	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:18:49.616177	\N	\N
46447955-e6be-8d77-31ac-72bdf1685f14	Salut ! Merci pour le compliment. Comment puis-je t'aider aujourd'hui ?	\N	2025-04-18 12:18:50.298442	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-18 12:18:50.298442	\N	\N
fd1dd3a3-46c4-8f21-f033-d472b2bf8298	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) bjdgjbsdg	\N	2025-04-18 12:35:53.240484	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:35:53.240484	\N	\N
d3d11e15-7dad-417c-51f2-d5f6a860fbe1	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) fzegzeg	\N	2025-04-18 12:36:08.595115	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:36:08.595115	\N	\N
b88e889a-f0cd-4647-938c-26695cd53dc4	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) vroum vrouuuuum 🚘🏎️ 	\N	2025-04-18 12:37:44.617446	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:37:44.617446	\N	\N
56e3c448-f27a-b346-5808-0e0c5babe6a9	@[Paul MAZZON](a5c1b268-937f-af11-4ca2-2c96634fbe2e) Salut	\N	2025-04-18 12:41:49.530752	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-18 12:41:49.530752	\N	\N
0d58c6e8-139e-d831-1029-d9eca7b95a8a	SAlut	\N	2025-04-18 12:43:53.663731	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:43:53.663731	\N	\N
c4309172-2ab6-35d7-d9ed-7a421520d8d0	test	\N	2025-04-18 12:49:08.299302	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:49:08.299302	\N	\N
db193f2f-ba45-fcc8-01c7-ba66f2f665a6	test	\N	2025-04-18 12:49:19.323453	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:49:19.323453	\N	\N
b32ce919-3386-4436-57c6-cd7f0b226871	\N	\N	2025-04-18 12:49:19.660118	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 12:49:19.660118	\N	\N
346414b9-727c-d717-0913-2f1f55a0d332	test	\N	2025-04-18 12:49:27.453573	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:49:27.453573	\N	\N
d21f7d98-1df7-8811-da8f-c52cca7e7b15	test	\N	2025-04-18 12:50:09.435624	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:50:09.435624	\N	\N
8c7bdb2e-f3e9-8812-6b12-044cc1ccea86	\N	\N	2025-04-18 12:51:55.488994	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 12:51:55.488994	\N	\N
b8315adc-0ff4-0575-a32a-48c90f63f0e4	test	\N	2025-04-18 12:52:02.831079	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:52:02.831079	\N	\N
abe8ad95-62ad-2555-7aed-cd2fdfc440db	test	\N	2025-04-18 12:52:15.207345	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:52:15.207345	\N	\N
e39e8acf-4585-607c-58d7-ccceee9c4627	aefa	\N	2025-04-18 12:53:22.105833	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:53:22.105833	\N	\N
2e6f49b8-1682-5196-3a9e-db4a145b78d8	\N	\N	2025-04-18 12:54:49.752102	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 12:54:49.752102	\N	\N
39ea6230-281f-3956-59ba-7eabcdac7f1b	vdsvd	\N	2025-04-18 12:57:24.57326	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:57:24.57326	\N	\N
ba943d25-fb93-a78c-4342-d8d96bfd54cd	dsfsd	\N	2025-04-18 12:57:33.381554	689b21fc-db42-a098-39bf-28a6a72d48f1	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 12:57:33.381554	\N	\N
3e9dc328-19ba-2bef-e9ef-c90d6efb193c	\N	\N	2025-04-18 12:59:15.781497	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 12:59:15.781497	\N	\N
b8af3272-3da6-47e4-cefc-d20a0c2db409	sdfsfd	\N	2025-04-18 13:00:28.528386	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 13:00:28.528386	\N	\N
898e8ded-f153-5712-49f4-f5294b75baae	sdfsdf	\N	2025-04-18 13:00:44.36082	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 13:00:44.36082	\N	\N
0cadffe9-ba8f-8b3f-9dda-87419b921da0	\N	\N	2025-04-18 13:01:34.98337	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 13:01:34.98337	\N	\N
4447f05d-a631-b533-e007-5333e48b03a7	\N	\N	2025-04-18 13:19:02.34083	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 13:19:02.34083	\N	\N
b9a86fdc-f177-78fe-e709-a4c24738d64f	yo	\N	2025-04-18 13:19:09.594324	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 13:19:09.594324	\N	\N
ba1dfb58-ba13-35fb-808e-b70a7889d096	yo	\N	2025-04-18 13:19:15.835522	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 13:19:15.835522	\N	\N
90163c4a-2969-7d7a-a3ad-c5eba833db29	fuck	\N	2025-04-18 13:19:22.506127	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-18 13:19:22.506127	\N	\N
daafb452-9dcd-5b2d-9194-13f37844d947	test	\N	2025-04-18 13:20:23.240152	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-18 13:20:23.240152	\N	\N
3aab48ae-5d3c-cefa-555d-15545fd69c12	yo	\N	2025-04-26 09:38:25.501099	689b21fc-db42-a098-39bf-28a6a72d48f1	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 09:38:25.501099	\N	\N
c0a5ddc8-a990-150a-3dc9-097278eb9a61	test	\N	2025-04-26 09:41:33.577751	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 09:41:33.577751	\N	\N
c2ca51b9-f0c9-9ca1-10c5-e5e020b07d5d	test2	\N	2025-04-26 10:00:42.781626	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 10:00:42.781626	\N	\N
684b9e13-e129-255c-2eda-1fae7afb5909	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) goat	\N	2025-04-26 10:01:30.012661	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-26 10:01:30.012661	\N	\N
eb45fd8f-2700-cc3a-0694-89cb3a0867aa	yo	\N	2025-04-26 10:18:05.76343	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 10:18:05.76343	\N	\N
05ccb3ad-a6c8-aced-0acc-521c430bd716	v	\N	2025-04-26 10:18:54.705971	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 10:18:54.705971	\N	\N
a6ced10b-2007-ac98-264a-007bc5fb3a42	@Mistral AI Salut beau gosse	\N	2025-04-26 10:19:03.645943	23e4dc54-0b4e-8ac4-e740-e93411bf0694	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-26 10:19:03.645943	\N	\N
acbfac49-4175-8693-35b5-166cec439114	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-26 10:19:04.091821	23e4dc54-0b4e-8ac4-e740-e93411bf0694	00000000-0000-0000-0000-000000000001	2025-04-26 10:19:04.091821	\N	\N
de0eed4e-7374-871d-00d5-b3e9828c5934	Test	\N	2025-04-26 10:30:22.276726	899845e2-2633-3c26-423f-e0ed9f114ff4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-26 10:30:22.276726	\N	\N
b1f12028-f508-90cc-501d-026ab2650a2c	caca	\N	2025-04-26 10:30:55.790875	899845e2-2633-3c26-423f-e0ed9f114ff4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-26 10:30:55.790875	\N	\N
aee47bdc-215d-e9ff-0619-05e723b3efd6	Test 	\N	2025-04-26 10:31:29.358716	899845e2-2633-3c26-423f-e0ed9f114ff4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-26 10:31:29.358716	\N	\N
f824e87c-f87c-7ef6-26f4-83f2225d2dbe	@Mistral AI salut	\N	2025-04-26 10:31:51.199496	899845e2-2633-3c26-423f-e0ed9f114ff4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-26 10:31:51.199496	\N	\N
876fd2ed-30e3-fd76-cc03-6345b1abdcd5	Salut ! Comment puis-je t'aider aujourd'hui ?	\N	2025-04-26 10:31:51.683484	899845e2-2633-3c26-423f-e0ed9f114ff4	00000000-0000-0000-0000-000000000001	2025-04-26 10:31:51.683484	\N	\N
f0f23e9a-b8fd-9c40-6530-831e370ff873	test	\N	2025-04-26 10:33:45.76005	899845e2-2633-3c26-423f-e0ed9f114ff4	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-26 10:33:45.76005	\N	\N
87438f00-4fe1-ac96-d05a-b4c8b6d6746d	Test	\N	2025-04-26 10:34:06.172124	899845e2-2633-3c26-423f-e0ed9f114ff4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-26 10:34:06.172124	\N	\N
9e50f493-6c1e-93dd-5910-b835d48fc717	caca	\N	2025-04-26 10:37:52.408048	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 10:37:52.408048	\N	\N
968a9de8-a838-cf42-f40e-29f9f9692bd8	Sesty	\N	2025-04-26 10:38:36.425518	899845e2-2633-3c26-423f-e0ed9f114ff4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-26 10:38:36.425518	\N	\N
1752cc9f-68ef-e3d4-d2b2-8cd9bd420c67	test	\N	2025-04-26 10:39:39.664008	899845e2-2633-3c26-423f-e0ed9f114ff4	a5c1b268-937f-af11-4ca2-2c96634fbe2e	2025-04-26 10:39:39.664008	\N	\N
ba99394e-367b-9ac0-080f-7104c32431e1	{"type":"file","fileUrl":"messages/files/65bfc04e-16dc-4a3a-ac95-f1b75fd37637.jpg","fileName":"IMG_6359.jpg","fileSize":9834942,"fileType":"image/jpeg","isImage":true}	\N	2025-04-26 10:48:45.442891	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 10:48:45.442891	\N	\N
08067693-461c-0673-6541-37995f769a87	{"type":"file","fileUrl":"messages/files/60e45c60-b2c2-4d8e-a25f-68f8cf993988.jpg","fileName":"IMG_6359.jpg","fileSize":9834942,"fileType":"image/jpeg","isImage":true}	\N	2025-04-26 10:49:01.953214	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 10:49:01.953214	\N	\N
56ea042b-ac91-f893-fade-3028272a4583	{"type":"file","fileUrl":"messages/files/6d51b3b4-bb60-4c5b-9775-640d3843008c.pdf","fileName":"Ordre de passage - 3ANDM (1).pdf","fileSize":534700,"fileType":"application/pdf","isImage":false}	\N	2025-04-26 10:53:50.269223	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 10:53:50.269223	\N	\N
e7d062e3-c2a4-f76a-9d28-71372484b851	{"type":"file","fileUrl":"messages/files/69827254-58a8-4fd7-9e92-a80293b8ebd5.jpg","fileName":"IMG_6359.jpg","fileSize":9834942,"fileType":"image/jpeg","isImage":true}	\N	2025-04-26 10:54:43.713	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 10:54:43.713	\N	\N
186e208b-fa8c-2899-5a42-5660c2eb1699	{"type":"file","fileUrl":"messages/files/04c289ff-6e97-4c52-8061-a246bfca901c.jpg","fileName":"IMG_6359.jpg","fileSize":9834942,"fileType":"image/jpeg","isImage":true}	\N	2025-04-26 11:03:29.594028	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 11:03:29.594028	\N	\N
166db1d3-7136-76d6-beba-d52bb775716e	{"type":"file","fileUrl":"messages/files/ca280673-9c1e-4513-af4e-04dc2dd6d389.mp4","fileName":"Enregistrement 2025-04-14 164419.mp4","fileSize":693487,"fileType":"video/mp4","isImage":false}	\N	2025-04-26 11:06:44.537703	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 11:06:44.537703	\N	\N
d03ebb35-d50b-ae9c-99ed-77f89da6b4bf	{"type":"file","fileUrl":"messages/files/e3bb0691-d914-4532-94d6-1b7f7fd64b07.pptx","fileName":"3TPMG - Manager de programme - Section 4  Les bases de nÃ©gociation et influences.pptx","fileSize":8447803,"fileType":"application/vnd.openxmlformats-officedocument.presentationml.presentation","isImage":false}	\N	2025-04-26 11:12:20.443227	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 11:12:20.443227	\N	\N
1e96119f-1691-2b39-8288-330c741ea5bf	{"type":"file","fileUrl":"messages/files/1e85451f-e074-43e3-8960-718792f8ffd2.pdf","fileName":"Ordre de passage - 3ANDM (1).pdf","fileSize":534700,"fileType":"application/pdf","isImage":false}	\N	2025-04-26 12:40:37.662778	23e4dc54-0b4e-8ac4-e740-e93411bf0694	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 12:40:37.662778	\N	\N
653ae9bc-83ca-e4dd-6e99-0c382d0a74b4	@[Rudy](d37b1d6b-aa6a-8423-d6b3-d5f22abffc63) test	\N	2025-04-26 12:54:03.668706	23e4dc54-0b4e-8ac4-e740-e93411bf0694	c8eb671d-f3b4-41f6-7364-0f292619dfdc	2025-04-26 12:54:03.668706	\N	1e96119f-1691-2b39-8288-330c741ea5bf
eabc0bf1-5cdd-6a9e-ba8b-7156a6f67fe7	{"type":"file","fileUrl":"messages/files/0c756de5-7994-447d-8310-9753d712d114.jpg","fileName":"IMG_6359.jpg","fileSize":9834942,"fileType":"image/jpeg","isImage":true}	\N	2025-04-26 13:13:39.976047	d1f24d6c-1a6e-7e47-3383-d8cd05d9b793	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	2025-04-26 13:13:39.976047	\N	\N
\.


--
-- TOC entry 4288 (class 0 OID 82345)
-- Dependencies: 228
-- Data for Name: message_fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_fichier (fk_message, fk_fichier) FROM stdin;
260d3655-ad12-6300-3390-074db4b8227d	fc0e5cb2-74b3-f93b-76c2-d2cc9d0eb00f
3160e5ee-45ca-1adf-5bcb-0c7313837885	992d0ac4-e7e6-348b-31e5-3069d68712b5
57dfcc87-aa6c-cb26-63a7-67a6fef026bb	68da03a1-4161-e306-6d91-ae629dfb51b9
ab9e23e0-597a-ba4b-3660-afd2b6ff1575	818baf7d-e191-491f-3f7f-3bd963c0f809
8a321192-6032-8a13-146c-30b8e689799a	ad9baea2-a086-421f-d5f2-e6ad358e24d2
cbf7221b-c745-4c2a-4f01-cb220744f06f	e62aa9a3-c834-260f-f965-f3e4fb140c1a
d2c05a56-8d1e-c7f2-1b4c-160f751542b8	ee864b10-c08a-51fb-d8c3-fdcd8bbf49a2
a1144c48-621d-fca7-5bc4-89edd0d74a0a	6feb76b9-5017-482c-9a19-6ec10831054a
0cbf7527-8433-113e-ef1c-8fd9f548858f	68b6940e-21c2-d126-a162-d3d7cba0d591
b32ce919-3386-4436-57c6-cd7f0b226871	467b3c50-f88e-9d5f-4675-8b1c6c9f1321
8c7bdb2e-f3e9-8812-6b12-044cc1ccea86	b07bba1c-e329-13b4-16f9-d315bf752df5
2e6f49b8-1682-5196-3a9e-db4a145b78d8	225f5a2f-6a35-2f25-1660-3b94f3dde396
3e9dc328-19ba-2bef-e9ef-c90d6efb193c	76af20d4-f606-5ba8-5fe4-4048a7b39c3b
0cadffe9-ba8f-8b3f-9dda-87419b921da0	c24bba9e-57d6-bd70-3aed-a7780617748c
4447f05d-a631-b533-e007-5333e48b03a7	7ceac805-13aa-45a4-f043-70b452dcfc3f
\.


--
-- TOC entry 4289 (class 0 OID 82360)
-- Dependencies: 229
-- Data for Name: message_hashtag; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_hashtag (fk_message, fk_hashtag) FROM stdin;
\.


--
-- TOC entry 4290 (class 0 OID 82375)
-- Dependencies: 230
-- Data for Name: message_mention; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_mention (fk_message, fk_utilisateur) FROM stdin;
\.


--
-- TOC entry 4299 (class 0 OID 229490)
-- Dependencies: 239
-- Data for Name: message_prive; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_prive (id_message_prive, contenu, date_envoi, date_lecture, fk_expediteur, fk_destinataire, pieces_jointes, date_creation, date_modification, is_deleted) FROM stdin;
8462e57f-c450-601a-2097-9ebfbec598d4		2025-04-26 13:03:15.746725	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"dd90f69a-829f-fa7b-a485-59546bc6c910\\"}]"	2025-04-26 13:03:15.746725	\N	f
8762ca2c-48b2-89c6-1e4e-c5eff23ed428		2025-04-26 13:03:17.455523	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-04-26 13:03:17.455523	\N	f
2252cb7b-11cc-9404-ab39-077238e67a25	etst	2025-04-26 11:01:15.622233	2025-04-26 11:13:56.451902	c8eb671d-f3b4-41f6-7364-0f292619dfdc	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 11:01:15.622233	\N	f
b0495543-32cc-9a6e-fcc5-345c071c85d7		2025-04-26 13:29:30.112844	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"b4876742-ae33-da97-3ff9-ae3b41d02c42\\"}]"	2025-04-26 13:29:30.112844	\N	f
bc070d8b-05af-b905-addc-8e0a89e05edd		2025-04-26 13:29:33.314019	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-04-26 13:29:33.314019	\N	f
ff3919a2-02b7-07ff-568c-7dd67811b0db	test3	2025-04-18 14:30:03.391652	2025-04-22 08:35:06.597209	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-18 14:30:03.391652	\N	f
461bdf74-484e-75c9-3d6e-682bc8edd6b1	azerty	2025-04-18 14:28:18.355426	2025-04-22 08:35:06.597563	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-18 14:28:18.355426	\N	f
96d9927e-cf02-6dcf-3c1a-945d90a4a155	test12	2025-04-22 08:51:46.848251	2025-04-22 08:57:25.2767	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 08:51:46.848251	\N	f
ab07a9aa-ded9-a709-ea5c-dddb7e2994be	test4	2025-04-18 14:42:35.05662	2025-04-22 08:35:06.776261	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-18 14:42:35.05662	\N	f
abe465a3-38bd-76e2-a612-9b66337d3af3	poiuytr	2025-04-18 14:27:56.673404	2025-04-22 08:39:22.481528	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-18 14:27:56.673404	\N	f
d122f06c-4149-18a1-ce11-8d3338e87bac	test13	2025-04-22 08:52:31.363451	2025-04-22 08:57:25.441414	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 08:52:31.363451	\N	f
7893e1ef-9a73-0943-cc56-22541384ba31	test5	2025-04-18 14:42:47.754916	2025-04-22 08:39:22.613789	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-18 14:42:47.754916	\N	f
083c1c7d-5f25-e2b4-40e0-ac33a21a5fe9	test2	2025-04-18 14:29:56.162719	2025-04-22 08:39:22.619295	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-18 14:29:56.162719	\N	f
91525088-9ec8-55b5-16fb-f96f26663609	test14	2025-04-22 08:57:40.041829	2025-04-22 09:02:37.620147	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 08:57:40.041829	\N	f
11452fdb-b62c-ffa2-2faa-31c85c2fd151	TEST6	2025-04-22 08:39:27.853557	2025-04-22 08:45:56.215564	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 08:39:27.853557	\N	f
11f7a99f-33c9-ea4e-be36-99fe39d61531	TEST6	2025-04-22 08:39:27.912493	2025-04-22 08:45:56.311906	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 08:39:27.912493	\N	f
7f14037f-bb9d-64bb-7182-94c379c9ee7e	test 15	2025-04-22 09:02:50.904966	2025-04-22 09:04:29.456638	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 09:02:50.904966	\N	f
2dfeff95-18fa-572b-2258-cc20a622f91b	test7	2025-04-22 08:39:39.853395	2025-04-22 08:46:05.96903	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 08:39:39.853395	\N	f
9e4363f6-c029-3d9e-24c2-e45580c12afc	test8	2025-04-22 08:39:53.56675	2025-04-22 08:46:05.969329	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 08:39:53.56675	\N	f
75b04492-24ff-3faa-f242-faec31be1556	test16	2025-04-22 09:11:54.941972	2025-04-22 09:22:02.919984	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 09:11:54.941972	\N	f
05ca56b0-69b5-77b1-e33d-c21a062370fe	test10	2025-04-22 08:46:01.33297	2025-04-22 08:46:06.112697	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 08:46:01.33297	\N	f
6efedd2c-e442-c7ae-2cfb-b6c6a337832f	test9	2025-04-22 08:42:31.824661	2025-04-22 08:46:06.11423	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 08:42:31.824661	\N	f
5774179e-08f0-6201-622f-fc3796ea0238	test17	2025-04-22 09:25:49.459541	2025-04-22 09:28:59.408828	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 09:25:49.459541	\N	f
254469be-30b7-c1bd-8927-d3a1de40d42d	test11	2025-04-22 08:46:10.017002	2025-04-22 08:51:28.982533	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 08:46:10.017002	\N	f
22007e1a-ec3d-71c6-7951-ab64b19e8265	test32	2025-04-26 09:24:29.611085	2025-04-26 09:29:41.724327	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:24:29.611085	\N	f
13c714c5-d596-df95-6ab2-4482f43b126a	test23	2025-04-22 11:39:44.733975	2025-04-22 11:43:45.488202	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:39:44.733975	\N	f
e73a3935-cbff-5925-2a2f-974e7bdb46bb	test19	2025-04-22 11:29:57.766648	2025-04-22 11:34:03.250698	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:29:57.766648	\N	f
b3bd1caf-969f-6c33-ca02-cfba4fd0c6d1	test18	2025-04-22 11:29:33.35313	2025-04-22 11:34:03.260532	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:29:33.35313	\N	f
be7867db-7a77-b116-4669-b713241e9cca	test18	2025-04-22 09:30:48.175369	2025-04-22 09:43:41.083184	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 09:30:48.175369	\N	f
58102ff7-f370-30b8-cbbf-eece859a890e	test16	2025-04-22 11:24:19.62875	2025-04-22 11:34:14.735525	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 11:24:19.62875	\N	f
94a0a89a-5205-09de-b2af-f0285ace2c2b	Hello !	2025-04-22 09:35:55.427998	2025-04-22 09:43:41.073118	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 09:35:55.427998	\N	f
18d8fbbe-17b3-5715-f4f5-965fd16a087e	test17	2025-04-22 11:29:04.983104	2025-04-22 11:29:35.238978	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:29:04.983104	\N	f
1b62b88c-5091-b8d5-df2a-bba7cbb7666f	test2	2025-04-26 09:19:49.241705	2025-04-26 09:20:51.398128	bb6a4d43-70d3-5e36-d943-dfdfc747491f	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-26 09:19:49.241705	\N	f
dcf72e5b-e96b-0765-912f-9bbc7bad6dfc	test25	2025-04-22 11:42:00.885113	2025-04-22 11:43:45.489784	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:42:00.885113	\N	f
72ac8468-2dd8-70bf-4987-71c809d3c09b	test24	2025-04-22 11:40:04.397201	2025-04-22 11:43:45.501036	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:40:04.397201	\N	f
2ae9c960-34e7-3e2c-4d6d-738d24d526a7	test22	2025-04-22 11:38:13.60453	2025-04-22 11:43:45.502484	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:38:13.60453	\N	f
dffabd44-8feb-9a37-197c-2cd3201d653c	test20	2025-04-22 11:34:11.573837	2025-04-22 11:37:34.223785	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 11:34:11.573837	\N	f
6868042c-618c-b038-8b0a-d13874cb0960	test2	2025-04-22 09:36:05.322192	2025-04-22 09:43:41.120888	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 09:36:05.322192	2025-04-22 09:53:16.567736	f
6e15a2d0-35b5-4536-ee22-8620e2839e9b	test	2025-04-26 09:19:14.369603	2025-04-26 09:19:27.147824	bb6a4d43-70d3-5e36-d943-dfdfc747491f	a5c1b268-937f-af11-4ca2-2c96634fbe2e	[]	2025-04-26 09:19:14.369603	\N	f
54009f46-e6a8-d99a-de98-f68ccc69a6c1	SAlut	2025-04-26 09:12:04.52057	2025-04-26 09:19:34.361993	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:12:04.52057	\N	f
cb9f59f5-4afb-b30c-2b7d-4b2d2b77911e	test34	2025-04-26 09:29:39.15294	2025-04-26 09:32:50.428476	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:29:39.15294	\N	f
8037cd13-ae11-421a-90ed-743c27857bd7	[message supprimé]	2025-04-22 09:52:03.927968	2025-04-22 09:53:29.123161	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-22 09:52:03.927968	2025-04-22 09:53:09.178956	t
bee4aabb-d27f-8bc0-94bc-d2e8f832599f	test26	2025-04-22 11:43:56.047699	2025-04-22 11:45:48.335535	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:43:56.047699	\N	f
eaccef21-a1ea-6742-9add-4f97b6f29832	test30	2025-04-22 11:52:01.713454	2025-04-26 09:19:36.14073	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:52:01.713454	\N	f
90461646-f51b-b128-d5aa-56c582572561	test21	2025-04-22 11:37:49.77968	2025-04-22 11:39:46.622595	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:37:49.77968	\N	f
7afcbd6c-35b1-e564-59d2-86959266477e	test29	2025-04-22 11:51:43.368985	2025-04-26 09:19:36.141348	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:51:43.368985	\N	f
134b5828-f007-cf9e-a794-aaa28c17341a	test27	2025-04-22 11:45:46.339025	2025-04-26 09:19:36.140306	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:45:46.339025	\N	f
5902f4cf-16e9-d9ab-7d3b-8725f65b3e20	test28	2025-04-22 11:46:04.466439	2025-04-26 09:19:36.140574	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-22 11:46:04.466439	\N	f
ed58d66d-579c-a760-e96b-3323c5ad4dae	test31	2025-04-26 09:24:14.61064	2025-04-26 09:29:41.578676	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:24:14.61064	\N	f
0b523007-1a01-ff73-8608-c46996f5aec5	test35	2025-04-26 09:30:01.498359	2025-04-26 09:35:05.754756	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:30:01.498359	\N	f
1f4b3d63-8b9e-a564-06cf-825f68f74bab	test33	2025-04-26 09:24:46.928291	2025-04-26 09:32:50.394082	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:24:46.928291	\N	f
6eb530a4-737e-104b-e18a-03d4f6c75bfe	test36	2025-04-26 09:35:03.674482	2025-04-26 09:39:15.418259	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:35:03.674482	\N	f
afeb1270-36a3-0260-8b7b-13cb7624a294	test44	2025-04-26 09:42:36.823647	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:42:36.823647	\N	f
eed802eb-bd3c-e0c2-43f3-1027bb654e8d	test43	2025-04-26 09:42:27.042888	2025-04-26 09:42:55.631867	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:42:27.042888	\N	f
cb72c0ca-715b-6393-a4b0-fc29a9b2b512	caca pourri	2025-04-26 09:20:10.903078	2025-04-26 09:46:43.399483	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:20:10.903078	\N	f
44ec729a-96fd-e857-f0a4-0dac33bd33dd	test42	2025-04-26 09:40:12.124815	2025-04-26 09:42:55.631356	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:40:12.124815	\N	f
2a8ee5bf-b595-6305-ae2f-fa6739a4d8c0	test39	2025-04-26 09:35:53.679133	2025-04-26 09:42:55.607461	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:35:53.679133	\N	f
44e38dd0-cf37-bc75-fb50-a97fed84c41c	test38	2025-04-26 09:35:39.943407	2025-04-26 09:42:55.605836	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:35:39.943407	\N	f
dfeab8e5-521b-12a1-6fee-8a36d040ec39	test51	2025-04-26 09:56:21.09246	\N	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:56:21.09246	\N	f
8e8f73b1-5b9b-ba41-03ac-e22c081f17a6	test52	2025-04-26 09:56:33.248927	\N	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:56:33.248927	\N	f
7194f7ed-d1bb-7634-1aab-debf968f204c	test54	2025-04-26 10:13:47.822288	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 10:13:47.822288	\N	f
a8784ab6-b806-63a7-7d78-a03716535d79	test41	2025-04-26 09:39:28.097778	2025-04-26 09:42:55.608814	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:39:28.097778	\N	f
50bab4b0-5928-0867-bb3e-84ff554791a0	test40	2025-04-26 09:39:12.998085	2025-04-26 09:42:55.609103	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:39:12.998085	\N	f
c09b339e-b301-669d-de3e-2bd063b44993	test37	2025-04-26 09:35:24.944289	2025-04-26 09:42:55.606031	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:35:24.944289	\N	f
24bd4be4-a39d-6ddd-d522-48ec38134430	test50	2025-04-26 10:12:54.615547	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 10:12:54.615547	\N	f
03d976a2-3be6-33c8-9736-ba5b78cc8237	TEST61	2025-04-26 10:07:13.488941	2025-04-26 10:12:57.128802	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 10:07:13.488941	\N	f
1a63edf0-2b2b-5bd1-8d6c-8fa9bdd7c95a	TEST53	2025-04-26 09:56:47.735365	\N	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:56:47.735365	\N	f
7039d5b7-e84d-07ff-e06c-694c6f28b512	test44	2025-04-26 09:47:14.827068	2025-04-26 10:14:05.418856	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:47:14.827068	\N	f
4d1d18ec-bb93-7f17-f00c-0278d1cd9574	TEST46	2025-04-26 09:43:37.861486	\N	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:43:37.861486	\N	f
26bdddbc-6747-0c70-53cd-880dc51839d4	coucou bg	2025-04-26 09:55:34.10669	2025-04-26 10:14:05.722312	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:55:34.10669	\N	f
f21816f8-9c0f-8fd4-48a8-25cc51614f0f	test60	2025-04-26 10:06:55.109021	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 10:06:55.109021	\N	f
5cefe811-7166-c601-2567-e2cb342a0abe	test45	2025-04-26 09:43:09.317512	2025-04-26 09:46:44.808489	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 09:43:09.317512	\N	f
8ab572a8-6363-d817-0ceb-5d5295669a63	test45	2025-04-26 09:47:25.554474	\N	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:47:25.554474	\N	f
c7f63d6e-bfd9-66cb-ae17-32e8a5dbe65c	test46	2025-04-26 09:47:37.968914	\N	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:47:37.968914	\N	f
043eed7e-4513-55b8-d6dc-29ff73286c44	test62	2025-04-26 10:07:26.450886	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 10:07:26.450886	\N	f
924e476a-4811-e61a-2f61-00d354c99b86	test63	2025-04-26 10:07:42.988062	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 10:07:42.988062	\N	f
0f755537-dae5-add0-f1a2-6eca65646f66	test50	2025-04-26 09:56:10.225024	\N	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 09:56:10.225024	\N	f
a8cd3e71-0418-8111-a7c4-bb03bb3cae4e	test	2025-04-26 10:01:52.562589	2025-04-26 10:33:40.867679	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 10:01:52.562589	\N	f
182f40e8-547b-635c-77f0-8619a16c6371	aa	2025-04-26 11:20:25.53357	\N	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 11:20:25.53357	\N	f
e3beced7-bd8c-0466-b172-85ded57e44d9	test	2025-04-26 13:04:42.107721	\N	a5c1b268-937f-af11-4ca2-2c96634fbe2e	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 13:04:42.107721	\N	f
e05cfd06-6a6a-440d-2c09-ca1b9a9bcb97	yo	2025-04-26 12:20:50.661155	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-04-26 12:20:50.661155	\N	f
84310e1b-2c72-7708-ff59-ea01dbc21a6b		2025-04-26 13:12:24.720857	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"21960226-90c0-69ff-33f7-d8efcac124b4\\"}]"	2025-04-26 13:12:24.720857	\N	f
88b57ba2-b53d-f4bc-6b30-29ab6aa2bbbe		2025-04-26 13:12:26.206456	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-04-26 13:12:26.206456	\N	f
d8e8a2bd-7f62-d406-2c88-eadc3f284934	test53	2025-04-26 10:13:35.951145	\N	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 10:13:35.951145	\N	f
12e76b21-d398-4d83-6995-52ccd11ecd7f	hello	2025-04-26 12:23:47.127264	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-04-26 12:23:47.127264	\N	f
371a7c35-23e5-f19b-af6e-159cbfd85a6e		2025-04-26 13:18:04.358717	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"63a865d0-3984-97a1-614f-bc263e76f6c1\\"}]"	2025-04-26 13:18:04.358717	\N	f
0b61a2ce-fa6a-5bb9-faf2-b492e51632ea		2025-04-26 13:18:06.066439	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-04-26 13:18:06.066439	\N	f
de052920-b240-6fbb-8c18-c1b2f9d2c100	test61	2025-04-26 12:58:23.162513	2025-04-26 12:58:25.274585	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 12:58:23.162513	\N	f
1ebce2bb-6f2a-d366-ed10-ef7639ae73c3		2025-04-26 13:20:15.000436	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"f18d6f97-f393-9250-e76f-0f50a08496ce\\"}]"	2025-04-26 13:20:15.000436	\N	f
9b7373d8-ffca-f161-d7b0-ce23f3f0bb5c	@Math'BigDick TEST	2025-04-26 12:58:46.292831	2025-04-26 12:59:18.013987	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 12:58:46.292831	\N	f
76a73618-3b85-080f-2359-0016673ab89f		2025-04-26 13:24:47.063117	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"246a8e16-7b61-8ea4-fe5b-8091f01073f5\\"}]"	2025-04-26 13:24:47.063117	\N	f
15caa86c-3974-3fe6-879c-df9430a30766		2025-04-26 13:24:49.121706	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-04-26 13:24:49.121706	\N	f
60e8f0c7-1246-3038-dc10-6e19db9ae817	test52	2025-04-26 10:13:13.554229	2025-04-26 10:16:19.931306	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 10:13:13.554229	\N	f
59e1b369-36cd-de88-8104-dcd155799c26	@Utilisateur MM	2025-04-26 12:59:28.248544	2025-04-26 13:03:18.740533	bb6a4d43-70d3-5e36-d943-dfdfc747491f	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	[]	2025-04-26 12:59:28.248544	\N	f
bf6aa433-aff7-31bd-cb97-50b085a7583d		2025-04-26 13:26:02.018919	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	"[{\\"id\\":\\"32ae889d-ba56-46b3-ec24-091ef07b3f9f\\"}]"	2025-04-26 13:26:02.018919	\N	f
0baf0bb3-f52c-f89e-75db-86c6ec064670		2025-04-26 13:26:03.495419	\N	d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	c8eb671d-f3b4-41f6-7364-0f292619dfdc	[]	2025-04-26 13:26:03.495419	\N	f
4c94d1b2-ef0c-419b-a2fb-1d297d59f008	test51	2025-04-26 10:13:07.18894	2025-04-26 10:14:06.65833	5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	bb6a4d43-70d3-5e36-d943-dfdfc747491f	[]	2025-04-26 10:13:07.18894	\N	f
\.


--
-- TOC entry 4292 (class 0 OID 122921)
-- Dependencies: 232
-- Data for Name: message_prive_fichier; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.message_prive_fichier (fk_message_prive, fk_fichier) FROM stdin;
8462e57f-c450-601a-2097-9ebfbec598d4	dd90f69a-829f-fa7b-a485-59546bc6c910
8762ca2c-48b2-89c6-1e4e-c5eff23ed428	dd90f69a-829f-fa7b-a485-59546bc6c910
84310e1b-2c72-7708-ff59-ea01dbc21a6b	21960226-90c0-69ff-33f7-d8efcac124b4
88b57ba2-b53d-f4bc-6b30-29ab6aa2bbbe	21960226-90c0-69ff-33f7-d8efcac124b4
371a7c35-23e5-f19b-af6e-159cbfd85a6e	63a865d0-3984-97a1-614f-bc263e76f6c1
0b61a2ce-fa6a-5bb9-faf2-b492e51632ea	63a865d0-3984-97a1-614f-bc263e76f6c1
1ebce2bb-6f2a-d366-ed10-ef7639ae73c3	f18d6f97-f393-9250-e76f-0f50a08496ce
76a73618-3b85-080f-2359-0016673ab89f	246a8e16-7b61-8ea4-fe5b-8091f01073f5
15caa86c-3974-3fe6-879c-df9430a30766	246a8e16-7b61-8ea4-fe5b-8091f01073f5
bf6aa433-aff7-31bd-cb97-50b085a7583d	32ae889d-ba56-46b3-ec24-091ef07b3f9f
0baf0bb3-f52c-f89e-75db-86c6ec064670	32ae889d-ba56-46b3-ec24-091ef07b3f9f
b0495543-32cc-9a6e-fcc5-345c071c85d7	b4876742-ae33-da97-3ff9-ae3b41d02c42
bc070d8b-05af-b905-addc-8e0a89e05edd	b4876742-ae33-da97-3ff9-ae3b41d02c42
\.


--
-- TOC entry 4296 (class 0 OID 229448)
-- Dependencies: 236
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.notifications (id, type, recipient_id, sender_id, content, reference_id, reference_type, is_read, created_at, read_at) FROM stdin;
\.


--
-- TOC entry 4284 (class 0 OID 82295)
-- Dependencies: 224
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.permission (id_permission, type_permission) FROM stdin;
\.


--
-- TOC entry 4298 (class 0 OID 229471)
-- Dependencies: 238
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.push_subscriptions (id, user_id, endpoint, auth, p256dh, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4301 (class 0 OID 245825)
-- Dependencies: 241
-- Data for Name: reaction; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.reaction (id_reaction, fk_message, fk_utilisateur, reaction_type, created_at) FROM stdin;
1	c2ca51b9-f0c9-9ca1-10c5-e5e020b07d5d	a5c1b268-937f-af11-4ca2-2c96634fbe2e	heart	2025-04-26 10:12:58.418747
\.


--
-- TOC entry 4283 (class 0 OID 82290)
-- Dependencies: 223
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role (id_role, nom_role) FROM stdin;
1	owner
2	admin
3	member
\.


--
-- TOC entry 4291 (class 0 OID 82390)
-- Dependencies: 231
-- Data for Name: role_permission; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.role_permission (fk_role, fk_permission) FROM stdin;
\.


--
-- TOC entry 4277 (class 0 OID 82219)
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
-- TOC entry 4278 (class 0 OID 82224)
-- Dependencies: 218
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.utilisateur (id_utilisateur, nom, email, mot_de_passe, photo_de_profil, date_creation, fk_statut, google_id, is_activated, validation_code, reset_password_code, reset_password_expires, date_naissance, bio) FROM stdin;
00000000-0000-0000-0000-000000000001	Mistral AI	bot@mistral.ai	dummy_password	https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp	2025-04-08 13:32:15.598295	1	\N	t	\N	\N	\N	\N	\N
c8eb671d-f3b4-41f6-7364-0f292619dfdc	Paul 2	paul.mazzon@icloud.com	$2a$10$husIr5kZtQDeVE44nNAz1eCZMM5w/74Cgu3RDzVQ8VAT4XNfnyLqi	\N	2025-04-01 12:32:20.707977	2	\N	t	\N	\N	\N	2004-01-06	
bb6a4d43-70d3-5e36-d943-dfdfc747491f	Math'BigDick	mathis.malzac@supinfo.com	$2a$10$ZQlN0LDqaRGKYlHVXj.F4eQf/CeBUuMRZDkUQZ3UYNJRyaWbCK72G	\N	2025-02-27 13:47:22.59845	1	\N	t	\N	\N	\N	2010-02-16	
d37b1d6b-aa6a-8423-d6b3-d5f22abffc63	Rudy	gault.rudy@gmail.com	$2a$10$KwpeHvkEQHur5hFUPhngEezuvRDMAB5EPMotu1xb/SE20ZL5YK0ki	\N	2025-02-27 13:11:18.704602	0	\N	t	\N	\N	\N	2010-02-27	j'aime la crotte
5ee82d1c-df2a-fe2f-ea4a-3e441b0846af	Math TEST	test@test.com	$2a$10$EsFqhD2hegX0k7jxpJkonO0woveEBvH2D0UglMuDCUniTX9YXnDQ2	\N	2025-04-18 07:37:40.668084	1	\N	t	\N	\N	\N	2010-04-15	\N
00000000-0000-0000-0000-000000000002	MistralOCR	bot-ocr@mistral.ai	dummy_password_ocr	https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp	2025-04-18 11:46:23.860732	1	\N	t	\N	\N	\N	\N	Je suis l'assistant OCR de Mistral AI.
a5c1b268-937f-af11-4ca2-2c96634fbe2e	Paul MAZZON	paul.mazzon@gmail.com	$2a$10$x0A7Vw3xf6GYahB1KJphV.QRqvWdBdUQJq0lHbMgx1oqfJqATe3MO	https://avatars.githubusercontent.com/u/63354977?v=4	2025-02-26 13:35:29.993728	1	\N	t	\N	\N	\N	2004-01-06	Salut !
\.


--
-- TOC entry 4279 (class 0 OID 82243)
-- Dependencies: 219
-- Data for Name: workspace; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace (id_workspace, nom, is_private, date_creation, banner_url, icon_url, description) FROM stdin;
3daf3712-3c74-8c8b-e24c-24cf238e3b60	Supchat	f	2025-04-18 07:20:22.421908	https://s3.fr-par.scw.cloud/s3-supchat/workspaces/banners/1744960822446-baniere_default.png	https://s3.fr-par.scw.cloud/s3-supchat/workspaces/icons/1744960822735-icon---edid-this.jpg	Serveur officiel de Supchat
4b1f1ff5-7c65-7036-31bd-4a681f4c5550	test	f	2025-04-18 08:30:38.954415	https://s3.fr-par.scw.cloud/s3-supchat/workspaces/banners/1744965039025-Paul_Mazon.jpg	https://s3.fr-par.scw.cloud/s3-supchat/workspaces/icons/1744965039333-Paul_Mazon.jpg	tet
82572ba1-92f0-7442-6f0b-5d478712b328	testrgt	f	2025-04-18 08:32:28.469364	https://s3.fr-par.scw.cloud/s3-supchat/workspaces/banners/1744965147192-Capture-dâÃ©cran-2025-04-17-132206.png	https://s3.fr-par.scw.cloud/s3-supchat/workspaces/icons/1744965147645-Capture-dâÃ©cran-2025-04-17-132206.png	
2af2bba8-2c62-cd83-1b60-871df7266f35	vbhjnk	f	2025-04-18 08:32:53.171198	\N	\N	vbhnjk
6f4ad377-912e-81f0-1424-8872504c1694	test	f	2025-04-18 09:31:00.179012	\N	\N	
7d5591bd-1f13-5097-6844-a248009820eb	test owner	f	2025-04-26 11:14:24.924034	https://s3.fr-par.scw.cloud/s3-supchat/workspaces/banners/1745666064934-3DE5920A-8942-433C-BDFE-1B161516611F.png	https://s3.fr-par.scw.cloud/s3-supchat/workspaces/icons/1745666065389-3DE5920A-8942-433C-BDFE-1B161516611F.png	test owner
\.


--
-- TOC entry 4294 (class 0 OID 229396)
-- Dependencies: 234
-- Data for Name: workspace_favoris; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_favoris (id_workspace_favoris, fk_utilisateur, fk_workspace, date_ajout) FROM stdin;
8	a5c1b268-937f-af11-4ca2-2c96634fbe2e	82572ba1-92f0-7442-6f0b-5d478712b328	2025-04-18 12:37:03.878744
9	c8eb671d-f3b4-41f6-7364-0f292619dfdc	82572ba1-92f0-7442-6f0b-5d478712b328	2025-04-18 13:23:20.940867
\.


--
-- TOC entry 4287 (class 0 OID 82327)
-- Dependencies: 227
-- Data for Name: workspace_invitations; Type: TABLE DATA; Schema: public; Owner: rootmath
--

COPY public.workspace_invitations (id_invitation, fk_workspace, email_invite, token_invitation, date_expiration, date_creation) FROM stdin;
\.


--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 235
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 237
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 240
-- Name: reaction_id_reaction_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.reaction_id_reaction_seq', 5, true);


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 233
-- Name: workspace_favoris_id_workspace_favoris_seq; Type: SEQUENCE SET; Schema: public; Owner: rootmath
--

SELECT pg_catalog.setval('public.workspace_favoris_id_workspace_favoris_seq', 9, true);


--
-- TOC entry 4050 (class 2606 OID 82258)
-- Name: canal canal_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT canal_pkey PRIMARY KEY (id_canal);


--
-- TOC entry 4054 (class 2606 OID 82289)
-- Name: fichier fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fichier_pkey PRIMARY KEY (id_fichier);


--
-- TOC entry 4060 (class 2606 OID 82306)
-- Name: hashtag hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.hashtag
    ADD CONSTRAINT hashtag_pkey PRIMARY KEY (id_hashtag);


--
-- TOC entry 4062 (class 2606 OID 82311)
-- Name: membre_workspace membre_workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT membre_workspace_pkey PRIMARY KEY (fk_utilisateur, fk_workspace);


--
-- TOC entry 4072 (class 2606 OID 82349)
-- Name: message_fichier message_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT message_fichier_pkey PRIMARY KEY (fk_message, fk_fichier);


--
-- TOC entry 4074 (class 2606 OID 82364)
-- Name: message_hashtag message_hashtag_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT message_hashtag_pkey PRIMARY KEY (fk_message, fk_hashtag);


--
-- TOC entry 4076 (class 2606 OID 82379)
-- Name: message_mention message_mention_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT message_mention_pkey PRIMARY KEY (fk_message, fk_utilisateur);


--
-- TOC entry 4052 (class 2606 OID 82270)
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id_message);


--
-- TOC entry 4080 (class 2606 OID 122925)
-- Name: message_prive_fichier message_prive_fichier_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT message_prive_fichier_pkey PRIMARY KEY (fk_message_prive, fk_fichier);


--
-- TOC entry 4100 (class 2606 OID 229501)
-- Name: message_prive message_prive_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT message_prive_pkey PRIMARY KEY (id_message_prive);


--
-- TOC entry 4088 (class 2606 OID 229457)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4058 (class 2606 OID 82300)
-- Name: permission permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id_permission);


--
-- TOC entry 4092 (class 2606 OID 229482)
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- TOC entry 4094 (class 2606 OID 229480)
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4102 (class 2606 OID 245833)
-- Name: reaction reaction_fk_message_fk_utilisateur_reaction_type_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_message_fk_utilisateur_reaction_type_key UNIQUE (fk_message, fk_utilisateur, reaction_type);


--
-- TOC entry 4104 (class 2606 OID 245831)
-- Name: reaction reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_pkey PRIMARY KEY (id_reaction);


--
-- TOC entry 4078 (class 2606 OID 82394)
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (fk_role, fk_permission);


--
-- TOC entry 4056 (class 2606 OID 82294)
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id_role);


--
-- TOC entry 4040 (class 2606 OID 82223)
-- Name: statut statut_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.statut
    ADD CONSTRAINT statut_pkey PRIMARY KEY (id_statut);


--
-- TOC entry 4042 (class 2606 OID 82235)
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);


--
-- TOC entry 4044 (class 2606 OID 82237)
-- Name: utilisateur utilisateur_google_id_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_google_id_key UNIQUE (google_id);


--
-- TOC entry 4046 (class 2606 OID 82233)
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);


--
-- TOC entry 4082 (class 2606 OID 229404)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fk_workspace_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fk_workspace_key UNIQUE (fk_utilisateur, fk_workspace);


--
-- TOC entry 4084 (class 2606 OID 229402)
-- Name: workspace_favoris workspace_favoris_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_pkey PRIMARY KEY (id_workspace_favoris);


--
-- TOC entry 4066 (class 2606 OID 82339)
-- Name: workspace_invitations workspace_invitations_fk_workspace_email_invite_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_fk_workspace_email_invite_key UNIQUE (fk_workspace, email_invite);


--
-- TOC entry 4068 (class 2606 OID 82335)
-- Name: workspace_invitations workspace_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_pkey PRIMARY KEY (id_invitation);


--
-- TOC entry 4070 (class 2606 OID 82337)
-- Name: workspace_invitations workspace_invitations_token_invitation_key; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT workspace_invitations_token_invitation_key UNIQUE (token_invitation);


--
-- TOC entry 4048 (class 2606 OID 82250)
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id_workspace);


--
-- TOC entry 4063 (class 1259 OID 82427)
-- Name: idx_invitation_email; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_email ON public.workspace_invitations USING btree (email_invite);


--
-- TOC entry 4064 (class 1259 OID 82426)
-- Name: idx_invitation_workspace; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_invitation_workspace ON public.workspace_invitations USING btree (fk_workspace);


--
-- TOC entry 4095 (class 1259 OID 229515)
-- Name: idx_message_prive_conversation; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_conversation ON public.message_prive USING btree (fk_expediteur, fk_destinataire);


--
-- TOC entry 4096 (class 1259 OID 229514)
-- Name: idx_message_prive_date_envoi; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_date_envoi ON public.message_prive USING btree (date_envoi);


--
-- TOC entry 4097 (class 1259 OID 229513)
-- Name: idx_message_prive_destinataire; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_destinataire ON public.message_prive USING btree (fk_destinataire);


--
-- TOC entry 4098 (class 1259 OID 229512)
-- Name: idx_message_prive_expediteur; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_message_prive_expediteur ON public.message_prive USING btree (fk_expediteur);


--
-- TOC entry 4085 (class 1259 OID 229469)
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- TOC entry 4086 (class 1259 OID 229468)
-- Name: idx_notifications_recipient; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_notifications_recipient ON public.notifications USING btree (recipient_id);


--
-- TOC entry 4089 (class 1259 OID 229489)
-- Name: idx_push_subscriptions_endpoint; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions USING btree (endpoint);


--
-- TOC entry 4090 (class 1259 OID 229488)
-- Name: idx_push_subscriptions_user; Type: INDEX; Schema: public; Owner: rootmath
--

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions USING btree (user_id);


--
-- TOC entry 4106 (class 2606 OID 82259)
-- Name: canal fk_canal_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.canal
    ADD CONSTRAINT fk_canal_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4110 (class 2606 OID 245852)
-- Name: fichier fk_fichier_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.fichier
    ADD CONSTRAINT fk_fichier_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4114 (class 2606 OID 82340)
-- Name: workspace_invitations fk_invitation_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_invitations
    ADD CONSTRAINT fk_invitation_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4111 (class 2606 OID 82322)
-- Name: membre_workspace fk_membre_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4112 (class 2606 OID 82312)
-- Name: membre_workspace fk_membre_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4113 (class 2606 OID 82317)
-- Name: membre_workspace fk_membre_workspace; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.membre_workspace
    ADD CONSTRAINT fk_membre_workspace FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace);


--
-- TOC entry 4107 (class 2606 OID 82271)
-- Name: message fk_message_canal; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_canal FOREIGN KEY (fk_canal) REFERENCES public.canal(id_canal);


--
-- TOC entry 4129 (class 2606 OID 229507)
-- Name: message_prive fk_message_prive_destinataire; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_destinataire FOREIGN KEY (fk_destinataire) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4130 (class 2606 OID 229502)
-- Name: message_prive fk_message_prive_expediteur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive
    ADD CONSTRAINT fk_message_prive_expediteur FOREIGN KEY (fk_expediteur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4108 (class 2606 OID 82276)
-- Name: message fk_message_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT fk_message_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4115 (class 2606 OID 82355)
-- Name: message_fichier fk_messagefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier);


--
-- TOC entry 4116 (class 2606 OID 82350)
-- Name: message_fichier fk_messagefichier_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_fichier
    ADD CONSTRAINT fk_messagefichier_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4117 (class 2606 OID 82370)
-- Name: message_hashtag fk_messagehashtag_hashtag; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_hashtag FOREIGN KEY (fk_hashtag) REFERENCES public.hashtag(id_hashtag);


--
-- TOC entry 4118 (class 2606 OID 82365)
-- Name: message_hashtag fk_messagehashtag_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_hashtag
    ADD CONSTRAINT fk_messagehashtag_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4119 (class 2606 OID 82380)
-- Name: message_mention fk_messagemention_message; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_message FOREIGN KEY (fk_message) REFERENCES public.message(id_message);


--
-- TOC entry 4120 (class 2606 OID 82385)
-- Name: message_mention fk_messagemention_utilisateur; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_mention
    ADD CONSTRAINT fk_messagemention_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur);


--
-- TOC entry 4123 (class 2606 OID 122931)
-- Name: message_prive_fichier fk_messageprivefichier_fichier; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message_prive_fichier
    ADD CONSTRAINT fk_messageprivefichier_fichier FOREIGN KEY (fk_fichier) REFERENCES public.fichier(id_fichier) ON DELETE CASCADE;


--
-- TOC entry 4121 (class 2606 OID 82400)
-- Name: role_permission fk_rolepermission_permission; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_permission FOREIGN KEY (fk_permission) REFERENCES public.permission(id_permission);


--
-- TOC entry 4122 (class 2606 OID 82395)
-- Name: role_permission fk_rolepermission_role; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT fk_rolepermission_role FOREIGN KEY (fk_role) REFERENCES public.role(id_role);


--
-- TOC entry 4105 (class 2606 OID 82238)
-- Name: utilisateur fk_utilisateur_statut; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT fk_utilisateur_statut FOREIGN KEY (fk_statut) REFERENCES public.statut(id_statut);


--
-- TOC entry 4109 (class 2606 OID 188437)
-- Name: message message_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.message(id_message) ON DELETE SET NULL;


--
-- TOC entry 4126 (class 2606 OID 229458)
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4127 (class 2606 OID 229463)
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.utilisateur(id_utilisateur) ON DELETE SET NULL;


--
-- TOC entry 4128 (class 2606 OID 229483)
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4131 (class 2606 OID 245834)
-- Name: reaction reaction_fk_message_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_message_fkey FOREIGN KEY (fk_message) REFERENCES public.message(id_message) ON DELETE CASCADE;


--
-- TOC entry 4132 (class 2606 OID 245839)
-- Name: reaction reaction_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.reaction
    ADD CONSTRAINT reaction_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4124 (class 2606 OID 229405)
-- Name: workspace_favoris workspace_favoris_fk_utilisateur_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_utilisateur_fkey FOREIGN KEY (fk_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;


--
-- TOC entry 4125 (class 2606 OID 229410)
-- Name: workspace_favoris workspace_favoris_fk_workspace_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rootmath
--

ALTER TABLE ONLY public.workspace_favoris
    ADD CONSTRAINT workspace_favoris_fk_workspace_fkey FOREIGN KEY (fk_workspace) REFERENCES public.workspace(id_workspace) ON DELETE CASCADE;


--
-- TOC entry 4309 (class 0 OID 0)
-- Dependencies: 4307
-- Name: DATABASE postgres; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON DATABASE postgres TO "paul.mazzon@supinfo.com";
GRANT ALL ON DATABASE postgres TO "rudy.gault@supinfo.com";
GRANT ALL ON DATABASE postgres TO "mathis.malzac@supinfo.com";
GRANT ALL ON DATABASE postgres TO "REDACTED";


--
-- TOC entry 4311 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: azure_pg_admin
--

GRANT ALL ON SCHEMA public TO "rudy.gault@supinfo.com";
GRANT ALL ON SCHEMA public TO "paul.mazzon@supinfo.com";
GRANT ALL ON SCHEMA public TO "REDACTED";


--
-- TOC entry 4312 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE canal; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.canal TO "REDACTED";


--
-- TOC entry 4313 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fichier TO "REDACTED";


--
-- TOC entry 4314 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.hashtag TO "REDACTED";


--
-- TOC entry 4315 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE membre_workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.membre_workspace TO "REDACTED";


--
-- TOC entry 4316 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE message; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message TO "REDACTED";


--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE message_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_fichier TO "REDACTED";


--
-- TOC entry 4318 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE message_hashtag; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_hashtag TO "REDACTED";


--
-- TOC entry 4319 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE message_mention; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_mention TO "REDACTED";


--
-- TOC entry 4321 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE message_prive; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive TO "REDACTED";


--
-- TOC entry 4322 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE message_prive_fichier; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_prive_fichier TO "REDACTED";


--
-- TOC entry 4323 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE message_with_alias; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.message_with_alias TO "REDACTED";


--
-- TOC entry 4324 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notifications TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notifications TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notifications TO "REDACTED";


--
-- TOC entry 4326 (class 0 OID 0)
-- Dependencies: 235
-- Name: SEQUENCE notifications_id_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.notifications_id_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.notifications_id_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.notifications_id_seq TO "REDACTED";


--
-- TOC entry 4327 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permission TO "REDACTED";


--
-- TOC entry 4328 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.push_subscriptions TO "REDACTED";


--
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 237
-- Name: SEQUENCE push_subscriptions_id_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO "REDACTED";


--
-- TOC entry 4331 (class 0 OID 0)
-- Dependencies: 241
-- Name: TABLE reaction; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.reaction TO "REDACTED";


--
-- TOC entry 4333 (class 0 OID 0)
-- Dependencies: 240
-- Name: SEQUENCE reaction_id_reaction_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.reaction_id_reaction_seq TO "REDACTED";


--
-- TOC entry 4334 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE role; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role TO "REDACTED";


--
-- TOC entry 4335 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE role_permission; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permission TO "REDACTED";


--
-- TOC entry 4336 (class 0 OID 0)
-- Dependencies: 217
-- Name: TABLE statut; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.statut TO "REDACTED";


--
-- TOC entry 4337 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE utilisateur; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.utilisateur TO "REDACTED";


--
-- TOC entry 4338 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE workspace; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace TO "REDACTED";


--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE workspace_favoris; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_favoris TO "REDACTED";


--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 233
-- Name: SEQUENCE workspace_favoris_id_workspace_favoris_seq; Type: ACL; Schema: public; Owner: rootmath
--

GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "paul.mazzon@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "rudy.gault@supinfo.com";
GRANT ALL ON SEQUENCE public.workspace_favoris_id_workspace_favoris_seq TO "REDACTED";


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE workspace_invitations; Type: ACL; Schema: public; Owner: rootmath
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "paul.mazzon@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "rudy.gault@supinfo.com";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workspace_invitations TO "REDACTED";


--
-- TOC entry 2145 (class 826 OID 65747)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT ALL ON SEQUENCES TO "REDACTED";


--
-- TOC entry 2144 (class 826 OID 65746)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: rootmath
--

ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "paul.mazzon@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "rudy.gault@supinfo.com";
ALTER DEFAULT PRIVILEGES FOR ROLE rootmath IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "REDACTED";


-- Completed on 2025-04-26 15:37:35

--
-- PostgreSQL database dump complete
--

