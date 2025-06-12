#!/bin/bash

# =====================================
# CONFIGURATION SSL AUTOMATIQUE
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
EMAIL="noreply@supchat.fr"

# Configuration pour Cloudflare
USE_CLOUDFLARE="true"

echo -e "${BLUE}"
echo "================================="
echo "   CONFIGURATION SSL SUPCHAT"
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

log_info "Configuration SSL pour le domaine: $DOMAIN avec Cloudflare"

if [ "$USE_CLOUDFLARE" = "true" ]; then
    log_info "Mode Cloudflare détecté - Configuration SSL simplifiée"
    
    # Pas besoin de Certbot avec Cloudflare
    log_info "Cloudflare gère le SSL externe, configuration interne HTTP uniquement"
    
    # Créer un certificat auto-signé pour la communication interne Cloudflare->VPS
    log_info "Création d'un certificat auto-signé pour la communication interne..."
    sudo mkdir -p /opt/supchat/ssl
    
    # Générer le certificat auto-signé
    sudo openssl req -x509 -newkey rsa:4096 -keyout /opt/supchat/ssl/privkey.pem -out /opt/supchat/ssl/fullchain.pem -days 365 -nodes -subj "/C=FR/ST=France/L=Paris/O=Supchat/OU=IT/CN=supchat.fr"
    
    sudo chmod 644 /opt/supchat/ssl/fullchain.pem
    sudo chmod 600 /opt/supchat/ssl/privkey.pem
    
    log_success "Certificat auto-signé créé pour Cloudflare"
    log_success "Certificat auto-signé créé pour Cloudflare"
fi

# Redémarrer les conteneurs
log_info "Redémarrage des conteneurs avec SSL..."
$DOCKER_COMPOSE -f docker-compose.vps.yml up -d

# Test de l'installation
log_info "Test de la configuration..."
sleep 10

echo ""
log_info "Test de connectivité:"
echo "• HTTPS via Cloudflare: $(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN || echo "ERREUR")"
echo "• HTTP direct: $(curl -s -o /dev/null -w "%{http_code}" http://192.168.71.234 || echo "ERREUR")"

echo ""
log_success "Configuration SSL terminée !"
echo ""
echo -e "${YELLOW}🔒 Votre application est accessible en HTTPS via Cloudflare:${NC}"
echo "• HTTPS: https://$DOMAIN"
echo "• API Backend: https://$DOMAIN/api"
echo ""
echo -e "${YELLOW}🔧 Configuration:${NC}"
echo "• SSL externe: Géré par Cloudflare"
echo "• SSL interne: Certificat auto-signé"
echo "• Mode: Cloudflare -> VPS (HTTP/HTTPS flexible)"
