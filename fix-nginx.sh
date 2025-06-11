#!/bin/bash

# =====================================
# SCRIPT DE FIX NGINX FRONTEND
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
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

echo "=== FIX NGINX CONFIGURATION ==="

cd /opt/supchat

# Vérifier le statut des conteneurs
log_info "État actuel des conteneurs:"
docker compose -f docker-compose.vps.yml ps

echo ""
log_info "Diagnostic du problème:"

# Vérifier quel nom de conteneur est utilisé pour le backend
BACKEND_CONTAINER=$(docker ps --filter "name=backend" --format "{{.Names}}" | head -n1)

if [[ -n "$BACKEND_CONTAINER" ]]; then
    log_success "Conteneur backend trouvé: $BACKEND_CONTAINER"
else
    log_error "Aucun conteneur backend trouvé"
    exit 1
fi

# Vérifier si le frontend peut résoudre le nom
log_info "Test de résolution DNS dans le réseau Docker:"
docker exec supchat-frontend-vps nslookup backend 2>/dev/null || log_warning "Impossible de résoudre 'backend'"
docker exec supchat-frontend-vps nslookup supchat-backend-vps 2>/dev/null || log_warning "Impossible de résoudre 'supchat-backend-vps'"

# Vérifier la configuration Nginx actuelle
log_info "Configuration Nginx actuelle:"
docker exec supchat-frontend-vps cat /etc/nginx/nginx.conf | grep -A 5 -B 5 upstream || log_warning "Pas d'upstream trouvé"

# Proposer une solution
echo ""
log_info "Solutions possibles:"
echo "1. Reconstruire le frontend avec la bonne configuration"
echo "2. Modifier la configuration Nginx à la volée"

read -p "Voulez-vous reconstruire le frontend ? [y/N]: " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Reconstruction du frontend..."
    
    # Arrêter le frontend
    docker compose -f docker-compose.vps.yml stop frontend
    
    # Supprimer le conteneur frontend
    docker compose -f docker-compose.vps.yml rm -f frontend
    
    # Reconstruire et redémarrer le frontend
    docker compose -f docker-compose.vps.yml up -d --build frontend
    
    log_success "Frontend reconstruit"
    
    # Attendre un peu
    sleep 10
    
    # Vérifier les logs
    echo ""
    log_info "Nouveaux logs du frontend:"
    docker logs supchat-frontend-vps --tail=10
    
else
    log_info "Reconstruction annulée"
fi

echo ""
log_info "Pour diagnostiquer plus en détail:"
echo "• Logs backend: docker logs supchat-backend-vps --tail=20"
echo "• Logs frontend: docker logs supchat-frontend-vps --tail=20"
echo "• État réseau: docker network ls"
echo "• Conteneurs dans le réseau: docker network inspect supchat_REDACTED"
