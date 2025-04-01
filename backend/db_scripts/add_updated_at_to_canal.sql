-- Ajouter seulement une colonne updated_at si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='canal' AND column_name='updated_at'
    ) THEN
        ALTER TABLE canal ADD COLUMN updated_at TIMESTAMP;
        RAISE NOTICE 'Colonne "updated_at" ajoutée à la table "canal"';
    ELSE
        RAISE NOTICE 'La colonne "updated_at" existe déjà dans la table "canal"';
    END IF;
END $$;
