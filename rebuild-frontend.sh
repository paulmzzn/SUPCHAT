#!/bin/bash

# =====================================
# SCRIPT DE RECONSTRUCTION FRONTEND
# =====================================

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}"
echo "================================="
echo "   RECONSTRUCTION FRONTEND"
echo "================================="
echo -e "${NC}"

# Aller dans le répertoire du projet
cd /opt/supchat

log_info "État actuel des conteneurs:"
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

$DOCKER_COMPOSE -f docker-compose.vps.yml ps

echo ""
log_info "Arrêt et suppression du conteneur frontend..."

# Arrêter le frontend
$DOCKER_COMPOSE -f docker-compose.vps.yml stop frontend

# Supprimer le conteneur frontend
$DOCKER_COMPOSE -f docker-compose.vps.yml rm -f frontend

log_success "Conteneur frontend supprimé"

log_info "Reconstruction du frontend avec la nouvelle configuration..."

# Reconstruire et redémarrer le frontend
$DOCKER_COMPOSE -f docker-compose.vps.yml up -d --build frontend

log_success "Frontend reconstruit et redémarré"

echo ""
log_info "Attente du démarrage du frontend..."
sleep 15

echo ""
log_info "Vérification des nouveaux logs:"
docker logs supchat-frontend-vps --tail=10

echo ""
log_info "État final des conteneurs:"
$DOCKER_COMPOSE -f docker-compose.vps.yml ps

echo ""
log_success "Reconstruction terminée !"
echo ""
echo -e "${YELLOW}Tests à effectuer:${NC}"
echo "• Frontend: curl -I http://185.98.137.166"
echo "• API: curl -I http://185.98.137.166:3000/health"
echo "• Logs frontend: docker logs supchat-frontend-vps -f"
