#!/bin/bash

# =====================================
# SCRIPT DE CORRECTION COMPLÈTE
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
echo "   CORRECTION COMPLÈTE SUPCHAT"
echo "================================="
echo -e "${NC}"

# Vérifier si nous sommes sur le VPS
if [[ -d "/opt/supchat" ]]; then
    log_info "Exécution sur le VPS détectée"
    PROJECT_DIR="/opt/supchat"
    cd "$PROJECT_DIR"
else
    log_error "Ce script doit être exécuté sur le VPS dans /opt/supchat"
    echo "Copiez d'abord les fichiers corrigés avec: ./copy-to-vps.sh"
    exit 1
fi

# Détecter docker-compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

log_info "État actuel des conteneurs:"
$DOCKER_COMPOSE -f docker-compose.vps.yml ps

echo ""
log_info "Arrêt de tous les conteneurs..."
$DOCKER_COMPOSE -f docker-compose.vps.yml down

log_success "Conteneurs arrêtés"

echo ""
log_info "Suppression des conteneurs et images pour forcer la reconstruction..."
# Supprimer les conteneurs
$DOCKER_COMPOSE -f docker-compose.vps.yml rm -f

# Supprimer les images pour forcer la reconstruction
docker rmi supchat-frontend:latest 2>/dev/null || true
docker rmi supchat-backend:latest 2>/dev/null || true

log_success "Nettoyage terminé"

echo ""
log_info "Reconstruction complète (cela va prendre plusieurs minutes)..."
$DOCKER_COMPOSE -f docker-compose.vps.yml up -d --build

log_success "Reconstruction terminée"

echo ""
log_info "Attente du démarrage des services..."
sleep 30

echo ""
log_info "Vérification des logs backend (dernières 10 lignes):"
docker logs supchat-backend-vps --tail=10

echo ""
log_info "Vérification des logs frontend (dernières 10 lignes):"
docker logs supchat-frontend-vps --tail=10

echo ""
log_info "État final des conteneurs:"
$DOCKER_COMPOSE -f docker-compose.vps.yml ps

echo ""
log_info "Test de connectivité:"
echo "• Backend health: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "ERREUR")"
echo "• Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "ERREUR")"

echo ""
log_success "Correction complète terminée !"
echo ""
echo -e "${YELLOW}🌐 Votre application est accessible sur:${NC}"
echo "• Frontend: http://185.98.137.166"
echo "• API Backend: http://185.98.137.166:3000"
echo ""
echo -e "${YELLOW}🔧 Commandes utiles:${NC}"
echo "• Logs en temps réel: $DOCKER_COMPOSE -f docker-compose.vps.yml logs -f"
echo "• Monitoring: ./monitor.sh"
echo "• Redémarrer: $DOCKER_COMPOSE -f docker-compose.vps.yml restart"
