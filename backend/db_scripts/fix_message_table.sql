-- Script pour vérifier et adapter la structure de la table message

-- Vérifier les colonnes actuelles de la table message
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'message';

-- Si la table n'a pas de colonne created_at mais a une colonne date_creation, renommer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'message' AND column_name = 'date_creation'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'message' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE message RENAME COLUMN date_creation TO created_at;
        RAISE NOTICE 'Colonne date_creation renommée en created_at';
    END IF;
END $$;

-- Si la table n'a pas de colonne created_at du tout, la créer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'message' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE message ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Colonne created_at ajoutée à la table message';
    END IF;
END $$;

-- Confirmer la structure finale
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'message'
ORDER BY ordinal_position;
