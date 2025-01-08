/*

 */
-- CREATE : Insérer un statut

INSERT INTO statut (label) VALUES ('en ligne') RETURNING id_statut;
INSERT INTO statut (label) VALUES ('hors ligne');
INSERT INTO statut (label) VALUES ('occupé');

-- READ : Lire tous les statuts
SELECT * FROM statut;

-- UPDATE : Modifier un statut (par exemple, renommer "en ligne" en "disponible")
UPDATE statut
SET label = 'disponible'
WHERE id_statut = 'uuid_en_ligne';

-- DELETE : Supprimer un statut (si non référencé)
DELETE FROM statut
WHERE id_statut = 'uuid_hors_ligne';


-- CREATE : Créer un utilisateur avec un statut par défaut (supposons qu’on ait un id_statut connu pour "hors ligne")
INSERT INTO utilisateur (nom, email, mot_de_passe, fk_statut)
VALUES ('John Doe', 'john@example.com', 'motdepassehash', 'uuid_du_statut_hors_ligne')
RETURNING id_utilisateur;

-- READ : Sélectionner tous les utilisateurs avec leur statut
SELECT u.*, s.label AS statut_label
FROM utilisateur u
JOIN statut s ON u.fk_statut = s.id_statut;

-- READ : Sélectionner un utilisateur par email
SELECT * FROM utilisateur
WHERE email = 'john@example.com';

-- UPDATE : Mettre à jour le statut d’un utilisateur (passer en "en ligne")
UPDATE utilisateur
SET fk_statut = 'uuid_en_ligne'
WHERE id_utilisateur = 'uuid_john_doe';

-- DELETE : Supprimer un utilisateur
DELETE FROM utilisateur
WHERE id_utilisateur = 'uuid_john_doe';

-- CREATE : Créer un workspace privé
INSERT INTO workspace (nom, is_private)
VALUES ('Projet Alpha', true)
RETURNING id_workspace;

-- READ : Tous les workspaces et leur date de création
SELECT * FROM workspace;

-- UPDATE : Rendre un workspace public
UPDATE workspace
SET is_private = false
WHERE id_workspace = 'uuid_projet_alpha';

--DELETE : Supprimer un workspace (ATTENTION: vérifier contraintes FK)
DELETE FROM workspace
WHERE id_workspace = 'uuid_projet_alpha';

-- CREATE : Créer un canal "discussion générale" dans un workspace
INSERT INTO canal (nom, fk_workspace)
VALUES ('Général', 'uuid_du_workspace')
RETURNING id_canal;

-- READ : Tous les canaux d’un workspace
SELECT c.*
FROM canal c
WHERE c.fk_workspace = 'uuid_du_workspace';

-- UPDATE : Renommer un canal
UPDATE canal
SET nom = 'Discussions Générales'
WHERE id_canal = 'uuid_du_canal';

-- DELETE : Supprimer un canal
DELETE FROM canal
WHERE id_canal = 'uuid_du_canal';

-- CREATE : Poster un message
INSERT INTO message (contenu, type_message, fk_canal, fk_utilisateur)
VALUES ('Hello, team!', 'texte', 'uuid_du_canal', 'uuid_john_doe')
RETURNING id_message;

-- READ : Tous les messages d’un canal, avec l’auteur
SELECT m.id_message, m.contenu, m.date_envoi, u.nom AS auteur
FROM message m
JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
WHERE m.fk_canal = 'uuid_du_canal'
ORDER BY m.date_envoi;

-- UPDATE : Modifier le contenu d’un message 
UPDATE message
SET contenu = 'Hello, team! Comment allez-vous?'
WHERE id_message = 'uuid_du_message';

-- DELETE : Supprimer un message
DELETE FROM message
WHERE id_message = 'uuid_du_message';

-- CREATE : Ajouter un fichier a voir avec filestore
INSERT INTO fichier (nom_fichier, url, type)
VALUES ('rapport.pdf', 'https://exemple.com/rapport.pdf', 'pdf')
RETURNING id_fichier;

-- READ : Tous les fichiers
SELECT * FROM fichier;

-- UPDATE : Changer le nom d’un fichier 
UPDATE fichier
SET nom_fichier = 'rapport_final.pdf'
WHERE id_fichier = 'uuid_du_fichier';

-- DELETE : Supprimer un fichier
DELETE FROM fichier
WHERE id_fichier = 'uuid_du_fichier';


-- CREATE : Créer un rôle admin
INSERT INTO role (nom_role) VALUES ('admin') RETURNING id_role;
INSERT INTO role (nom_role) VALUES ('membre');
INSERT INTO role (nom_role) VALUES ('invité');

-- READ : Tous les rôles
SELECT * FROM role;

-- UPDATE : Renommer un rôle
UPDATE role
SET nom_role = 'superadmin'
WHERE id_role = 'uuid_admin';


-- DELETE : Supprimer un rôle (si plus utilisé)
DELETE FROM role
WHERE id_role = 'uuid_membre';

-- CREATE : Créer une permission
INSERT INTO permission (type_permission) VALUES ('publier');
INSERT INTO permission (type_permission) VALUES ('modérer');
INSERT INTO permission (type_permission) VALUES ('gérer_membres');

-- READ : Toutes les permissions
SELECT * FROM permission;

-- UPDATE : Renommer une permission
UPDATE permission
SET type_permission = 'gerer_membres'
WHERE id_permission = 'uuid_permission';

-- DELETE : Supprimer une permission
DELETE FROM permission
WHERE id_permission = 'uuid_permission';

-- CREATE : Créer un hashtag
INSERT INTO hashtag (label) VALUES ('#projetX') RETURNING id_hashtag;

-- READ : Tous les hashtags
SELECT * FROM hashtag;

-- UPDATE : Changer le label d’un hashtag
UPDATE hashtag
SET label = '#projetY'
WHERE id_hashtag = 'uuid_hashtag_projetX';

-- DELETE : Supprimer un hashtag
DELETE FROM hashtag
WHERE id_hashtag = 'uuid_hashtag_projetX';

-- CREATE : Ajouter un utilisateur dans un workspace avec un rôle
INSERT INTO membre_workspace (fk_utilisateur, fk_workspace, fk_role)
VALUES ('uuid_john_doe', 'uuid_workspace_alpha', 'uuid_role_membre');

-- READ : Tous les membres d’un workspace et leur rôle
SELECT u.nom, w.nom AS workspace_nom, r.nom_role
FROM membre_workspace mw
JOIN utilisateur u ON mw.fk_utilisateur = u.id_utilisateur
JOIN workspace w ON mw.fk_workspace = w.id_workspace
JOIN role r ON mw.fk_role = r.id_role
WHERE w.id_workspace = 'uuid_workspace_alpha';

-- UPDATE : Changer le rôle d’un membre dans un workspace
UPDATE membre_workspace
SET fk_role = 'uuid_role_admin'
WHERE fk_utilisateur = 'uuid_john_doe'
AND fk_workspace = 'uuid_workspace_alpha';

-- DELETE : Retirer un utilisateur d’un workspace
DELETE FROM membre_workspace
WHERE fk_utilisateur = 'uuid_john_doe'
AND fk_workspace = 'uuid_workspace_alpha';

-- CREATE : Associer un fichier à un message
INSERT INTO message_fichier (fk_message, fk_fichier)
VALUES ('uuid_message_hello', 'uuid_fichier_rapport');

-- READ : Tous les fichiers liés à un message
SELECT f.*
FROM message_fichier mf
JOIN fichier f ON mf.fk_fichier = f.id_fichier
WHERE mf.fk_message = 'uuid_message_hello';

-- DELETE : Retirer un fichier d’un message
DELETE FROM message_fichier
WHERE fk_message = 'uuid_message_hello'
AND fk_fichier = 'uuid_fichier_rapport';

-- CREATE : Associer un hashtag à un message
INSERT INTO message_hashtag (fk_message, fk_hashtag)
VALUES ('uuid_message_hello', 'uuid_hashtag_projetX');

-- READ : Tous les messages contenant un hashtag
SELECT m.contenu, h.label
FROM message_hashtag mh
JOIN message m ON mh.fk_message = m.id_message
JOIN hashtag h ON mh.fk_hashtag = h.id_hashtag
WHERE h.label = '#projetX';

-- DELETE : Retirer un hashtag d’un message
DELETE FROM message_hashtag
WHERE fk_message = 'uuid_message_hello'
AND fk_hashtag = 'uuid_hashtag_projetX';

-- CREATE : Mentionner un utilisateur dans un message
INSERT INTO message_mention (fk_message, fk_utilisateur)
VALUES ('uuid_message_hello', 'uuid_jane_doe');

-- READ : Tous les utilisateurs mentionnés dans un message
SELECT u.nom, m.contenu
FROM message_mention mm
JOIN utilisateur u ON mm.fk_utilisateur = u.id_utilisateur
JOIN message m ON mm.fk_message = m.id_message
WHERE m.id_message = 'uuid_message_hello';

-- DELETE : Retirer une mention
DELETE FROM message_mention
WHERE fk_message = 'uuid_message_hello'
AND fk_utilisateur = 'uuid_jane_doe';




-- Messages d'un canal avec auteur et fichiers attachés
SELECT m.id_message, m.contenu, u.nom AS auteur, 
       array_agg(f.url) AS fichiers
FROM message m
JOIN utilisateur u ON m.fk_utilisateur = u.id_utilisateur
LEFT JOIN message_fichier mf ON m.id_message = mf.fk_message
LEFT JOIN fichier f ON mf.fk_fichier = f.id_fichier
WHERE m.fk_canal = 'uuid_canal'
GROUP BY m.id_message, u.nom;

-- Liste des workspaces d’un utilisateur, ses canaux, et son rôle dans chaque workspace
SELECT w.nom AS workspace, c.nom AS canal, r.nom_role
FROM membre_workspace mw
JOIN workspace w ON mw.fk_workspace = w.id_workspace
JOIN role r ON mw.fk_role = r.id_role
LEFT JOIN canal c ON c.fk_workspace = w.id_workspace
WHERE mw.fk_utilisateur = 'uuid_john_doe';
