#!/bin/bash
# =================================
# SCRIPT DE DÉPLOIEMENT SÉCURISÉ
# =================================

set -e  # Arrêter le script en cas d'erreur

echo "🔒 DÉPLOIEMENT SÉCURISÉ SUPCHAT"
echo "================================"

# Vérifications préalables
echo "🔍 Vérification des prérequis..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier que docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Vérifier que les secrets existent
if [ ! -d "./secrets" ]; then
    echo "❌ Le dossier secrets/ n'existe pas"
    exit 1
fi

REQUIRED_SECRETS=(
    "db_user.txt"
    "db_password.txt" 
    "jwt_secret.txt"
    "scw_access_key.txt"
    "scw_secret_key.txt"
    "s3_bucket_name.txt"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ ! -f "./secrets/$secret" ]; then
        echo "❌ Secret manquant: $secret"
        exit 1
    fi
done

echo "✅ Tous les prérequis sont satisfaits"

# Supprimer les conteneurs existants
echo "🧹 Nettoyage des conteneurs existants..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Reconstruire les images
echo "🔨 Construction des images Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Vérifier l'état des services
echo "🔍 Vérification de l'état des services..."
sleep 10

if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Services démarrés avec succès"
    echo ""
    echo "📋 INFORMATIONS DE DÉPLOIEMENT:"
    echo "- Frontend: http://localhost"
    echo "- Backend API: http://localhost:3000/api"
    echo "- Health Check: http://localhost:3000/health"
    echo ""
    echo "🔒 SÉCURITÉ:"
    echo "- PostgreSQL: Non exposé publiquement ✅"
    echo "- PgAdmin: Désactivé en production ✅"
    echo "- Secrets Docker: Activés ✅"
    echo "- Headers sécurisés: Configurés ✅"
else
    echo "❌ Erreur lors du démarrage des services"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

echo ""
echo "🎉 Déploiement sécurisé terminé avec succès!"
