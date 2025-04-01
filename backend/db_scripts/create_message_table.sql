-- Création de la table message si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS message (
  id_message SERIAL PRIMARY KEY,
  contenu TEXT NOT NULL,
  fk_canal INTEGER NOT NULL,
  fk_utilisateur INTEGER NOT NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (fk_canal) REFERENCES canal(id_canal) ON DELETE CASCADE,
  FOREIGN KEY (fk_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- Ajout d'un index pour améliorer les performances des recherches par canal
CREATE INDEX IF NOT EXISTS idx_message_canal ON message(fk_canal);
