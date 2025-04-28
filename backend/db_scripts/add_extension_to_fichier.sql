-- Ajouter les colonnes manquantes à la table fichier
DO $$
BEGIN
  -- Vérifier et ajouter la colonne extension
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'fichier' AND column_name = 'extension'
  ) THEN
    ALTER TABLE fichier ADD COLUMN extension VARCHAR(50);
    RAISE NOTICE 'Colonne extension ajoutée à la table fichier';
  ELSE
    RAISE NOTICE 'La colonne extension existe déjà dans la table fichier';
  END IF;
  
  -- Vérifier et ajouter la colonne mime_type
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'fichier' AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE fichier ADD COLUMN mime_type VARCHAR(100);
    RAISE NOTICE 'Colonne mime_type ajoutée à la table fichier';
  ELSE
    RAISE NOTICE 'La colonne mime_type existe déjà dans la table fichier';
  END IF;
  
  -- Vérifier et ajouter la colonne taille_fichier si elle n'existe pas
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'fichier' AND column_name = 'taille_fichier'
  ) THEN
    ALTER TABLE fichier ADD COLUMN taille_fichier BIGINT;
    RAISE NOTICE 'Colonne taille_fichier ajoutée à la table fichier';
  ELSE
    RAISE NOTICE 'La colonne taille_fichier existe déjà dans la table fichier';
  END IF;
  
  -- Vérifier et ajouter la colonne fk_utilisateur
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'fichier' AND column_name = 'fk_utilisateur'
  ) THEN
    ALTER TABLE fichier ADD COLUMN fk_utilisateur UUID;
    -- Ajouter une contrainte de clé étrangère 
    ALTER TABLE fichier ADD CONSTRAINT fk_fichier_utilisateur FOREIGN KEY (fk_utilisateur) REFERENCES utilisateur(id_utilisateur);
    RAISE NOTICE 'Colonne fk_utilisateur ajoutée à la table fichier avec contrainte de clé étrangère';
  ELSE
    RAISE NOTICE 'La colonne fk_utilisateur existe déjà dans la table fichier';
  END IF;

  -- Afficher toutes les colonnes existantes de la table fichier pour faciliter le débogage
  RAISE NOTICE 'Vérification des colonnes actuelles de la table fichier:';
  FOR column_info IN 
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns 
    WHERE table_name = 'fichier'
  LOOP
    RAISE NOTICE 'Colonne: %, Type: %, Longueur max: %', 
      column_info.column_name, 
      column_info.data_type,
      column_info.character_maximum_length;
  END LOOP;
END $$;
