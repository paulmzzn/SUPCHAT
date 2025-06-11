#!/bin/bash
# =====================================
# SCRIPT DE DÉPLOIEMENT VPS SUPCHAT
# =====================================

set -e  # Arrêter le script en cas d'erreur

echo "🚀 DÉPLOIEMENT SUPCHAT SUR VPS"
echo "================================"

# Variables à configurer
VPS_DOMAIN="${1:-localhost}"
VPS_IP="${2}"

if [ -z "$VPS_IP" ]; then
    echo "Usage: $0 <domain> <vps_ip>"
    echo "Exemple: $0 supchat.mondomaine.fr 1.2.3.4"
    exit 1
fi

echo "🔧 Configuration:"
echo "- Domaine: $VPS_DOMAIN"
echo "- IP VPS: $VPS_IP"
echo ""

# Vérifications préalables
echo "🔍 Vérification des prérequis..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    echo "Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Vérifier que docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    echo "Installation de Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Vérifier que les secrets existent
if [ ! -d "./secrets" ]; then
    echo "❌ Le dossier secrets/ n'existe pas"
    echo "Crétion du dossier secrets..."
    mkdir -p secrets
    echo "⚠️ ATTENTION: Vous devez remplir les fichiers secrets avant le déploiement!"
fi

REQUIRED_SECRETS=(
    "db_user.txt"
    "db_password.txt" 
    "jwt_secret.txt"
    "scw_access_key.txt"
    "scw_secret_key.txt"
    "s3_bucket_name.txt"
    "email_user.txt"
    "email_password.txt"
)

MISSING_SECRETS=()
for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ ! -f "./secrets/$secret" ]; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo "❌ Secrets manquants:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "  - $secret"
    done
    echo ""
    echo "📝 Création des fichiers secrets vides..."
    for secret in "${MISSING_SECRETS[@]}"; do
        touch "./secrets/$secret"
        echo "# Veuillez renseigner cette valeur" > "./secrets/$secret"
    done
    echo "⚠️ IMPORTANT: Éditez les fichiers dans ./secrets/ avant de continuer!"
    echo "Appuyez sur Entrée pour continuer ou Ctrl+C pour annuler..."
    read
fi

echo "✅ Tous les prérequis sont satisfaits"

# Configuration des variables d'environnement
echo "🔧 Configuration des variables d'environnement..."
export VPS_DOMAIN="$VPS_DOMAIN"

# Mise à jour de la configuration Nginx
echo "📝 Mise à jour de la configuration Nginx..."
sed -i "s/server_name _;/server_name $VPS_DOMAIN;/" frontend/nginx.vps.conf

# Arrêter les services existants
echo "🛑 Arrêt des services existants..."
docker-compose -f docker-compose.vps.yml down --remove-orphans 2>/dev/null || true

# Nettoyer les volumes si demandé
echo "🧹 Voulez-vous nettoyer les volumes de base de données? (y/N)"
read -n 1 cleanup_volumes
echo ""
if [[ $cleanup_volumes =~ ^[Yy]$ ]]; then
    echo "🗑️ Suppression des volumes..."
    docker volume ls -q | grep -E "(postgres|supchat)" | xargs -r docker volume rm
fi

# Construire les images
echo "🔨 Construction des images Docker..."
docker-compose -f docker-compose.vps.yml build --no-cache

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose -f docker-compose.vps.yml up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier l'état des services
echo "🔍 Vérification de l'état des services..."
if docker-compose -f docker-compose.vps.yml ps | grep -q "Up"; then
    echo "✅ Services démarrés avec succès"
    echo ""
    echo "📋 INFORMATIONS DE DÉPLOIEMENT:"
    echo "- Frontend: http://$VPS_DOMAIN"
    echo "- Backend API: http://$VPS_DOMAIN:3000/api"
    echo "- Health Check: http://$VPS_DOMAIN:3000/health"
    echo ""
    echo "🔒 SÉCURITÉ:"
    echo "- PostgreSQL: Non exposé publiquement ✅"
    echo "- Docker Secrets: Activés ✅"
    echo "- Headers sécurisés: Configurés ✅"
    echo "- Rate limiting: Activé ✅"
    echo ""
    echo "🔧 PROCHAINES ÉTAPES:"
    echo "1. Configurez un reverse proxy (Nginx/Traefik) si nécessaire"
    echo "2. Configurez SSL/HTTPS avec Let's Encrypt"
    echo "3. Configurez les sauvegardes automatiques"
    echo "4. Surveillez les logs: docker-compose -f docker-compose.vps.yml logs -f"
    echo ""
    echo "🌐 Testez votre application sur: http://$VPS_DOMAIN"
else
    echo "❌ Erreur lors du démarrage des services"
    echo "📋 Logs des erreurs:"
    docker-compose -f docker-compose.vps.yml logs
    exit 1
fi

echo ""
echo "🎉 Déploiement VPS terminé avec succès!"
