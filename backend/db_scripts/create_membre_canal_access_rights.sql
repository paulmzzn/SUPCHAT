-- Script pour créer la table membre_canal qui gère les droits d'accès aux canaux privés
-- Un canal privé est accessible par les admins et owners du workspace par défaut
-- Cette table permet d'accorder des droits d'accès spécifiques à certains membres

-- Vérifier si la table existe déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'canal_access_type') THEN
        -- Type enum pour les droits d'accès
        CREATE TYPE canal_access_type AS ENUM ('lecture', 'lecture_ecriture');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Type canal_access_type déjà existant';
END$$;

-- Créer la table membre_canal si elle n'existe pas
CREATE TABLE IF NOT EXISTS membre_canal (
    id_membre_canal SERIAL PRIMARY KEY,
    fk_canal UUID NOT NULL,
    fk_utilisateur UUID NOT NULL,
    droit_acces canal_access_type NOT NULL DEFAULT 'lecture',
    date_ajout TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_membre_canal UNIQUE (fk_canal, fk_utilisateur),
    CONSTRAINT fk_canal_membre_canal FOREIGN KEY (fk_canal) 
        REFERENCES canal (id_canal) ON DELETE CASCADE,
    CONSTRAINT fk_user_membre_canal FOREIGN KEY (fk_utilisateur)
        REFERENCES utilisateur (id_utilisateur) ON DELETE CASCADE
);

-- Créer un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_membre_canal_user ON membre_canal (fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_membre_canal_canal ON membre_canal (fk_canal);

COMMENT ON TABLE membre_canal IS 'Stocke les droits d''accès des membres aux canaux privés';
COMMENT ON COLUMN membre_canal.droit_acces IS 'Type d''accès: lecture (read-only) ou lecture_ecriture (read-write)';