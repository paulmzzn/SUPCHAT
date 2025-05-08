-- Script pour créer la table canal_lecture
-- Cette table stocke les informations de lecture des canaux par utilisateur

-- Vérifier d'abord les types des colonnes dans les tables existantes
DO $$
DECLARE
    utilisateur_type TEXT;
    canal_type TEXT;
BEGIN
    -- Récupérer le type de données de la colonne id_utilisateur
    SELECT data_type INTO utilisateur_type
    FROM information_schema.columns 
    WHERE table_name = 'utilisateur' AND column_name = 'id_utilisateur';
    
    -- Récupérer le type de données de la colonne id_canal
    SELECT data_type INTO canal_type
    FROM information_schema.columns 
    WHERE table_name = 'canal' AND column_name = 'id_canal';
    
    -- Afficher les types pour information
    RAISE NOTICE 'Type de id_utilisateur: %', utilisateur_type;
    RAISE NOTICE 'Type de id_canal: %', canal_type;
    
    -- Créer la table avec les types correspondants
    IF canal_type = 'uuid' THEN
        -- Si id_canal est de type UUID
        EXECUTE 'CREATE TABLE IF NOT EXISTS canal_lecture (
            id_canal_lecture SERIAL PRIMARY KEY,
            fk_utilisateur ' || utilisateur_type || ' NOT NULL,
            fk_canal UUID NOT NULL,
            derniere_lecture TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (fk_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
            FOREIGN KEY (fk_canal) REFERENCES canal(id_canal) ON DELETE CASCADE,
            UNIQUE (fk_utilisateur, fk_canal)
        )';
    ELSIF canal_type = 'integer' THEN
        -- Si id_canal est de type INTEGER
        EXECUTE 'CREATE TABLE IF NOT EXISTS canal_lecture (
            id_canal_lecture SERIAL PRIMARY KEY,
            fk_utilisateur ' || utilisateur_type || ' NOT NULL,
            fk_canal INTEGER NOT NULL,
            derniere_lecture TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            FOREIGN KEY (fk_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
            FOREIGN KEY (fk_canal) REFERENCES canal(id_canal) ON DELETE CASCADE,
            UNIQUE (fk_utilisateur, fk_canal)
        )';
    ELSE
        -- Autre type
        RAISE EXCEPTION 'Type de id_canal non supporté: %', canal_type;
    END IF;
END$$;

-- Création des index (ne dépendent pas du type de données)
CREATE INDEX IF NOT EXISTS idx_canal_lecture_utilisateur ON canal_lecture(fk_utilisateur);
CREATE INDEX IF NOT EXISTS idx_canal_lecture_canal ON canal_lecture(fk_canal);
CREATE INDEX IF NOT EXISTS idx_canal_lecture_derniere_lecture ON canal_lecture(derniere_lecture);

-- Commentaires sur la table et ses colonnes
COMMENT ON TABLE canal_lecture IS 'Enregistre quand un utilisateur a lu un canal pour la dernière fois';
COMMENT ON COLUMN canal_lecture.id_canal_lecture IS 'Identifiant unique de l''enregistrement de lecture';
COMMENT ON COLUMN canal_lecture.fk_utilisateur IS 'Identifiant de l''utilisateur qui a lu le canal';
COMMENT ON COLUMN canal_lecture.fk_canal IS 'Identifiant du canal qui a été lu';
COMMENT ON COLUMN canal_lecture.derniere_lecture IS 'Date et heure de la dernière lecture du canal par l''utilisateur';