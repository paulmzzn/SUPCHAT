#!/bin/bash
# Script de déploiement Docker pour SUPCHAT
# Ce script configure et lance l'environnement Docker complet

set -e

echo "🚀 Démarrage du déploiement Docker SUPCHAT..."

# Vérification des prérequis
echo "📋 Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"

# Vérification des secrets
echo "🔐 Vérification des secrets..."
SECRETS_DIR="./secrets"
REQUIRED_SECRETS=(
    "db_user.txt"
    "db_password.txt" 
    "jwt_secret.txt"
    "google_client_id.txt"
    "google_client_secret.txt"
    "github_client_id.txt"
    "github_client_secret.txt"
    "scw_access_key.txt"
    "scw_secret_key.txt"
    "email_user.txt"
    "email_password.txt"
    "strawpoll_api_key.txt"
    "mistral_api_key.txt"
    "redis_password.txt"
    "pgadmin_password.txt"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ ! -f "$SECRETS_DIR/$secret" ]; then
        echo "❌ Secret manquant: $secret"
        echo "Veuillez créer le fichier $SECRETS_DIR/$secret avec la valeur appropriée"
        exit 1
    fi
done

echo "✅ Tous les secrets sont présents"

# Vérification du fichier .env
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env manquant"
    echo "Copiez .env.example vers .env et configurez les variables"
    exit 1
fi

echo "✅ Fichier .env présent"

# Arrêt des conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose -f docker-compose.secure.yml down --remove-orphans

# Nettoyage des images anciennes (optionnel)
read -p "Voulez-vous nettoyer les images Docker anciennes ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Nettoyage des images..."
    docker system prune -af
fi

# Construction des images
echo "🔨 Construction des images Docker..."
docker-compose -f docker-compose.secure.yml build --no-cache

# Lancement des services
echo "🚀 Lancement des services..."
docker-compose -f docker-compose.secure.yml up -d

# Attente que les services démarrent
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérification du statut des services
echo "📊 Vérification du statut des services..."
docker-compose -f docker-compose.secure.yml ps

# Tests de santé
echo "🏥 Tests de santé des services..."

# Test backend
echo "Testing backend health..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend: OK"
else
    echo "⚠️ Backend: En cours de démarrage..."
fi

# Test frontend  
echo "Testing frontend health..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend: OK"
else
    echo "⚠️ Frontend: En cours de démarrage..."
fi

# Test base de données
echo "Testing database health..."
if docker-compose -f docker-compose.secure.yml exec -T postgres pg_isready -h postgres -p 5432 > /dev/null 2>&1; then
    echo "✅ Base de données: OK"
else
    echo "⚠️ Base de données: En cours de démarrage..."
fi

echo ""
echo "🎉 Déploiement terminé !"
echo ""
echo "📱 Accès aux services:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3000"
echo "   pgAdmin: http://localhost:8080"
echo ""
echo "📋 Commandes utiles:"
echo "   Voir les logs: docker-compose -f docker-compose.secure.yml logs -f"
echo "   Arrêter: docker-compose -f docker-compose.secure.yml down"
echo "   Redémarrer: docker-compose -f docker-compose.secure.yml restart"
echo ""
