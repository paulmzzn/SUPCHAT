#!/bin/bash

# =====================================
# SCRIPT DE FIX DOCKER-COMPOSE
# =====================================

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

echo "=== FIX DOCKER-COMPOSE ==="

# Vérifier si docker-compose existe
if command -v docker-compose &> /dev/null; then
    log_success "docker-compose déjà installé"
    docker-compose --version
    exit 0
fi

log_info "Installation de docker-compose standalone..."

# Télécharger et installer docker-compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Rendre exécutable
chmod +x /usr/local/bin/docker-compose

# Créer un lien symbolique dans /usr/bin pour être sûr
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Vérifier l'installation
if command -v docker-compose &> /dev/null; then
    log_success "docker-compose installé avec succès"
    docker-compose --version
else
    echo "Erreur: docker-compose toujours non trouvé"
    exit 1
fi
