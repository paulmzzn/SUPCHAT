-- Vérifier la structure actuelle de la table reaction
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reaction'
ORDER BY ordinal_position;

-- Vérifier les contraintes d'unicité existantes
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'reaction'::regclass AND contype = 'u';

-- Si la colonne reaction_type n'existe pas et emoji_unicode existe, créer la colonne reaction_type
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'reaction' AND column_name = 'emoji_unicode'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'reaction' AND column_name = 'reaction_type'
    ) THEN
        ALTER TABLE reaction ADD COLUMN reaction_type VARCHAR(50);
        RAISE NOTICE 'Colonne reaction_type ajoutée à la table reaction';
        
        -- Mettre à jour reaction_type basé sur emoji_unicode
        UPDATE reaction 
        SET reaction_type = 
            CASE 
                WHEN emoji_unicode = '{"👍"}' THEN 'thumbsUp'
                WHEN emoji_unicode = '{"❤️"}' THEN 'heart'
                WHEN emoji_unicode = '{"😂"}' THEN 'laugh'
                WHEN emoji_unicode = '{"😮"}' THEN 'surprise'
                WHEN emoji_unicode = '{"😢"}' THEN 'sad'
                WHEN emoji_unicode = '{"😠"}' THEN 'angry'
                WHEN emoji_unicode = '{"❔"}' THEN 'surprise'
                ELSE 'thumbsUp'
            END;
    ELSE
        RAISE NOTICE 'Pas besoin d''ajouter la colonne reaction_type';
    END IF;
END $$;
