-- Ajouter une colonne parent_id aux messages pour les réponses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='message' AND column_name='parent_id'
    ) THEN
        ALTER TABLE message ADD COLUMN parent_id INTEGER REFERENCES message(id_message) ON DELETE SET NULL;
        RAISE NOTICE 'Colonne parent_id ajoutée à la table message';
    ELSE
        RAISE NOTICE 'La colonne parent_id existe déjà dans la table message';
    END IF;
END $$;

-- Créer une table pour les réactions
CREATE TABLE IF NOT EXISTS reaction (
    id_reaction SERIAL PRIMARY KEY,
    fk_message INTEGER NOT NULL REFERENCES message(id_message) ON DELETE CASCADE,
    fk_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fk_message, fk_utilisateur, reaction_type) -- Empêche les doublons de réactions
);

-- Créer un index pour optimiser les requêtes sur les réactions par message
CREATE INDEX IF NOT EXISTS idx_reaction_message ON reaction(fk_message);
