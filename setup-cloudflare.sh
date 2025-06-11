#!/bin/bash

# =====================================
# CONFIGURATION CLOUDFLARE SUPCHAT
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

DOMAIN="supchat.fr"

echo -e "${BLUE}"
echo "================================="
echo "   CONFIGURATION CLOUDFLARE"
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

log_info "Configuration pour domaine: $DOMAIN via Cloudflare"

# Redémarrer les conteneurs avec la nouvelle configuration
log_info "Redémarrage des conteneurs avec configuration Cloudflare..."
$DOCKER_COMPOSE -f docker-compose.vps.yml down
$DOCKER_COMPOSE -f docker-compose.vps.yml up -d --build

log_success "Conteneurs redémarrés"

# Attendre que les services démarrent
log_info "Attente du démarrage des services..."
sleep 20

# Test de connectivité
echo ""
log_info "Test de connectivité:"
echo "• HTTP local: $(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "ERREUR")"
echo "• Backend direct: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "ERREUR")"

echo ""
log_success "Configuration Cloudflare terminée !"
echo ""
echo -e "${YELLOW}🔒 Configuration:${NC}"
echo "• Frontend: HTTP sur port 80 (Cloudflare gère HTTPS)"
echo "• Backend: HTTP sur port 3000"
echo "• WebSocket: Passe par Cloudflare"
echo ""
echo -e "${YELLOW}🌐 Accès:${NC}"
echo "• Public via Cloudflare: https://$DOMAIN"
echo "• Direct IP: http://185.98.137.166"
echo ""
echo -e "${YELLOW}⚙️ Configuration Cloudflare requise:${NC}"
echo "• SSL: Full (strict) ou Flexible"
echo "• Proxy: Activé (nuage orange)"
echo "• WebSocket: Activé"
