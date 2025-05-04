-- Créer une table pour les réactions aux messages privés
CREATE TABLE IF NOT EXISTS private_message_reaction (
    id_reaction SERIAL PRIMARY KEY,
    fk_message_prive UUID NOT NULL REFERENCES message_prive(id_message_prive) ON DELETE CASCADE,
    fk_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fk_message_prive, fk_utilisateur, reaction_type) -- Empêche les doublons de réactions
);

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_private_message_reaction_message
ON private_message_reaction(fk_message_prive);

-- Ajout d'une colonne parent_id aux messages privés s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='message_prive' AND column_name='parent_id'
    ) THEN
        ALTER TABLE message_prive ADD COLUMN parent_id UUID REFERENCES message_prive(id_message_prive) ON DELETE SET NULL;
        RAISE NOTICE 'Colonne parent_id ajoutée à la table message_prive';
    ELSE
        RAISE NOTICE 'La colonne parent_id existe déjà dans la table message_prive';
    END IF;
END $$;