#!/bin/bash

# =====================================
# SCRIPT DE TRANSFERT VERS VPS
# =====================================

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
VPS_IP=""
VPS_USER="root"
VPS_PASSWORD="SWXTnNoBPlh"
PROJECT_NAME="supchat"

echo -e "${BLUE}"
echo "================================="
echo "   TRANSFERT VERS VPS SUPCHAT"
echo "================================="
echo -e "${NC}"

# Demander l'IP du VPS
if [[ -z "$VPS_IP" ]]; then
    read -p "Entrez l'IP de votre VPS: " VPS_IP
fi

# Demander confirmation
echo ""
echo "Configuration:"
echo "• IP VPS: $VPS_IP"
echo "• Utilisateur: $VPS_USER"
echo "• Projet: $PROJECT_NAME"
echo ""

read -p "Continuer avec cette configuration ? [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Annulé."
    exit 1
fi

log_info "Préparation des fichiers pour le transfert..."

# Créer un archive avec tous les fichiers nécessaires
tar -czf supchat-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='uploads' \
    --exclude='.env' \
    .

log_success "Archive créée: supchat-deploy.tar.gz"

log_info "Transfert de l'archive vers le VPS..."

# Transférer l'archive
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no supchat-deploy.tar.gz $VPS_USER@$VPS_IP:/tmp/

log_success "Archive transférée"

log_info "Connexion au VPS et extraction..."

# Commandes à exécuter sur le VPS
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "=== Extraction du projet sur le VPS ==="
    cd /tmp
    tar -xzf supchat-deploy.tar.gz
    
    # Créer le répertoire de destination
    mkdir -p /opt/supchat
    
    # Copier les fichiers
    cp -r . /opt/supchat/
    
    # Supprimer l'archive temporaire
    rm -f supchat-deploy.tar.gz
    
    # Aller dans le répertoire du projet
    cd /opt/supchat
    
    # Rendre les scripts exécutables
    chmod +x *.sh
    
    echo "=== Fichiers extraits dans /opt/supchat ==="
    ls -la /opt/supchat/
EOF

# Nettoyer localement
rm -f supchat-deploy.tar.gz

log_success "Transfert terminé !"

echo ""
echo -e "${GREEN}🎉 Projet transféré avec succès !${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo "1. Connectez-vous au VPS:"
echo "   ssh $VPS_USER@$VPS_IP"
echo ""
echo "2. Allez dans le répertoire du projet:"
echo "   cd /opt/supchat"
echo ""
echo "3. Configurez vos secrets si nécessaire:"
echo "   nano secrets/db_user.txt"
echo "   nano secrets/db_password.txt"
echo "   # etc..."
echo ""
echo "4. Exécutez le déploiement:"
echo "   ./deploy-vps.sh"
echo ""
echo "Ou directement en une commande:"
echo "sshpass -p '$VPS_PASSWORD' ssh $VPS_USER@$VPS_IP 'cd /opt/supchat && ./deploy-vps.sh'"
