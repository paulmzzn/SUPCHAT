-- Vérifier la structure actuelle de la table statut
SELECT * FROM statut;

-- Corriger la syntaxe de l'insertion si nécessaire
DELETE FROM statut WHERE id_statut = 4;
INSERT INTO statut (id_statut, label) VALUES (4, 'invisible');

-- Mettre à jour les labels pour correspondre à ceux attendus par le frontend
UPDATE statut SET label = 'online' WHERE id_statut = 1;
UPDATE statut SET label = 'away' WHERE id_statut = 2;
UPDATE statut SET label = 'dnd' WHERE id_statut = 3;
UPDATE statut SET label = 'invisible' WHERE id_statut = 4;

-- Vérifier la nouvelle structure
SELECT * FROM statut;

-- Afficher les utilisateurs et leurs statuts actuels
SELECT u.id_utilisateur, u.nom, u.email, u.fk_statut, s.label
FROM utilisateur u
LEFT JOIN statut s ON u.fk_statut = s.id_statut
ORDER BY u.nom;
