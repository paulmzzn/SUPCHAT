#!/bin/bash

# =====================================
# CONFIGURATION SANS SSL (IP SEULEMENT)
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

echo -e "${BLUE}"
echo "================================="
echo "   CONFIGURATION SUPCHAT (HTTP)"
echo "================================="
echo -e "${NC}"

# Vérifier si nous sommes sur le VPS
if [[ -d "/opt/supchat" ]]; then
    log_info "Exécution sur le VPS détectée"
    PROJECT_DIR="/opt/supchat"
    cd "$PROJECT_DIR"
else
    log_error "Ce script doit être exécuté sur le VPS dans /opt/supchat"
    exit 1
fi

# Détecter docker-compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

log_warning "Configuration sans SSL (domaine non configuré)"
log_info "Pour SSL, configurez d'abord votre DNS supchat.fr → 185.98.137.166"

# Utiliser la configuration nginx standard (sans SSL)
log_info "Utilisation de nginx.conf au lieu de nginx.vps.conf..."

# Redémarrer les conteneurs
log_info "Redémarrage des conteneurs..."
$DOCKER_COMPOSE -f docker-compose.vps.yml down
$DOCKER_COMPOSE -f docker-compose.vps.yml up -d

log_success "Application redémarrée en HTTP"

# Test de l'installation
log_info "Test de la configuration..."
sleep 10

echo ""
log_info "Test de connectivité:"
echo "• Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://185.98.137.166 || echo "ERREUR")"
echo "• Backend: $(curl -s -o /dev/null -w "%{http_code}" http://185.98.137.166:3000/health || echo "ERREUR")"

echo ""
log_success "Configuration HTTP terminée !"
echo ""
echo -e "${YELLOW}🌐 Votre application est accessible sur:${NC}"
echo "• Frontend: http://185.98.137.166"
echo "• API Backend: http://185.98.137.166:3000"
echo ""
echo -e "${YELLOW}🔧 Pour activer SSL plus tard:${NC}"
echo "1. Configurez DNS: supchat.fr → 185.98.137.166"
echo "2. Attendez la propagation DNS (quelques heures)"
echo "3. Relancez: ./setup-ssl-domain.sh"
