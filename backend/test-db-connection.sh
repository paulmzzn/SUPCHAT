#!/bin/bash

# Fichier à placer dans votre dossier backend et à exécuter dans le conteneur

echo "=== TEST DE CONNEXION POSTGRESQL ==="
echo "Vérification de l'accès aux secrets..."

# Vérifier l'existence du dossier /run/secrets
if [ -d "/run/secrets" ]; then
  echo "✅ Dossier /run/secrets trouvé"
  
  # Lister les secrets disponibles
  echo "Liste des secrets disponibles:"
  ls -la /run/secrets/
  
  # Vérifier db_user
  if [ -f "/run/secrets/db_user" ]; then
    DB_USER=$(cat /run/secrets/db_user)
    echo "✅ Secret db_user trouvé: ${DB_USER}"
  else
    echo "❌ Secret db_user INTROUVABLE"
  fi
  
  # Vérifier db_password (ne pas afficher le mot de passe complet)
  if [ -f "/run/secrets/db_password" ]; then
    DB_PASS=$(cat /run/secrets/db_password)
    echo "✅ Secret db_password trouvé: ${DB_PASS:0:3}..."
  else
    echo "❌ Secret db_password INTROUVABLE"
  fi
else
  echo "❌ Dossier /run/secrets INTROUVABLE"
fi

echo "=== VARIABLES D'ENVIRONNEMENT ==="
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "POSTGRES_DB: $POSTGRES_DB"

echo "=== TEST DE CONNEXION AVEC PSQL ==="
# Tenter une connexion avec les identifiants des secrets
if [ -f "/run/secrets/db_user" ] && [ -f "/run/secrets/db_password" ]; then
  DB_USER=$(cat /run/secrets/db_user)
  DB_PASS=$(cat /run/secrets/db_password)
  
  echo "Tentative de connexion à postgres:5432/${POSTGRES_DB:-supchat} avec l'utilisateur ${DB_USER}..."
  PGPASSWORD="${DB_PASS}" psql -h postgres -p 5432 -U "${DB_USER}" -d "${POSTGRES_DB:-supchat}" -c "SELECT version();"
  
  if [ $? -eq 0 ]; then
    echo "✅ CONNEXION RÉUSSIE!"
  else
    echo "❌ ÉCHEC DE CONNEXION"
  fi
else
  echo "❌ Impossible de tester la connexion: secrets manquants"
fi

echo "=== TEST RÉSEAU ==="
echo "Ping de postgres..."
ping -c 3 postgres

echo "=== FIN DES TESTS ==="
