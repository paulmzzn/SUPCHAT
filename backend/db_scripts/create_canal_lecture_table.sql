-- Script pour créer la table canal_lecture
-- Cette table stocke les informations de lecture des canaux par utilisateur

CREATE TABLE IF NOT EXISTS canal_lecture (
  id_canal_lecture SERIAL PRIMARY KEY,
  fk_utilisateur UUID NOT NULL,  -- Modifié de INTEGER à UUID pour correspondre au type de id_utilisateur
  fk_canal UUID NOT NULL,  -- Modifié de INTEGER à UUID pour correspondre au type de id_canal
  derniere_lecture TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contraintes de clé étrangère
  FOREIGN KEY (fk_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (fk_canal) REFERENCES canal(id_canal) ON DELETE CASCADE,
  
  -- Contrainte d'unicité pour éviter les doublons
  UNIQUE (fk_utilisateur, fk_canal)
);

-- Index pour améliorer les performances des requêtes courantes
CREATE INDEX IF NOT EXISTS idx_canal_lecture_utilisateur ON canal_lecture(fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_canal_lecture_canal ON canal_lecture(fk_canal);
CREATE INDEX IF NOT EXISTS idx_canal_lecture_derniere_lecture ON canal_lecture(derniere_lecture);

-- Commentaires sur la table et ses colonnes
COMMENT ON TABLE canal_lecture IS 'Enregistre quand un utilisateur a lu un canal pour la dernière fois';
COMMENT ON COLUMN canal_lecture.id_canal_lecture IS 'Identifiant unique de l''enregistrement de lecture';
COMMENT ON COLUMN canal_lecture.fk_utilisateur IS 'Identifiant de l''utilisateur qui a lu le canal';
COMMENT ON COLUMN canal_lecture.fk_canal IS 'Identifiant du canal qui a été lu';
COMMENT ON COLUMN canal_lecture.derniere_lecture IS 'Date et heure de la dernière lecture du canal par l''utilisateur';