-- Vérifier si la colonne "bio" existe déjà dans la table "utilisateur"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'utilisateur' AND column_name = 'bio'
    ) THEN
        -- Ajouter la colonne si elle n'existe pas
        ALTER TABLE utilisateur ADD COLUMN bio TEXT;
        RAISE NOTICE 'Colonne "bio" ajoutée à la table "utilisateur"';
    ELSE
        RAISE NOTICE 'La colonne "bio" existe déjà dans la table "utilisateur"';
    END IF;
END $$;

-- Vérification après ajout
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'utilisateur' AND column_name = 'bio';
