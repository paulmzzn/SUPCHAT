-- Vérifier si la table reaction existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'reaction'
    ) THEN
        CREATE TABLE reaction (
            id_reaction SERIAL PRIMARY KEY,
            fk_message INTEGER NOT NULL REFERENCES message(id_message) ON DELETE CASCADE,
            fk_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
            reaction_type VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(fk_message, fk_utilisateur, reaction_type)
        );
        
        CREATE INDEX idx_reaction_message ON reaction(fk_message);
        
        RAISE NOTICE 'Table reaction créée avec succès.';
    ELSE
        -- Vérifier si la colonne reaction_type existe
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'reaction' 
            AND column_name = 'reaction_type'
        ) THEN
            -- Ajouter la colonne manquante
            ALTER TABLE reaction ADD COLUMN reaction_type VARCHAR(50) NOT NULL DEFAULT 'thumbsUp';
            RAISE NOTICE 'Colonne reaction_type ajoutée à la table reaction.';
        ELSE
            RAISE NOTICE 'La colonne reaction_type existe déjà.';
        END IF;
    END IF;
END $$;

-- Afficher la structure actuelle de la table reaction
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reaction'
ORDER BY ordinal_position;
