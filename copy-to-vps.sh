#!/bin/bash

# =====================================
# SCRIPT DE COPIE SIMPLE VERS VPS
# =====================================
# Évite les problèmes d'attributs étendus macOS

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

# Configuration par défaut
VPS_IP="192.168.1.29"
VPS_USER="root"
VPS_PASSWORD="SWXTnNoBPlh"

echo -e "${BLUE}"
echo "================================="
echo "   COPIE SIMPLE VERS VPS"
echo "================================="
echo -e "${NC}"

# Demander l'IP du VPS si pas définie
if [[ -z "$VPS_IP" ]]; then
    read -p "Entrez l'IP de votre VPS: " VPS_IP
fi

echo ""
echo "Configuration:"
echo "• IP VPS: $VPS_IP"
echo "• Utilisateur: $VPS_USER"
echo ""

read -p "Continuer ? [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Annulé."
    exit 1
fi

log_info "Nettoyage des attributs macOS..."

# Supprimer les fichiers .DS_Store
find . -name ".DS_Store" -delete 2>/dev/null || true

# Nettoyer les attributs étendus de manière plus efficace
log_info "Suppression des attributs étendus (peut prendre un moment)..."
find . -type f -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.txt" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sh" | head -1000 | xargs -I {} xattr -c {} 2>/dev/null || true

log_info "Création de l'archive sans attributs étendus..."

# Utiliser gtar si disponible (GNU tar), sinon tar avec options pour éviter les attributs étendus
if command -v gtar &> /dev/null; then
    TAR_CMD="gtar"
else
    TAR_CMD="tar"
fi

# Créer l'archive en excluant les attributs étendus et les fichiers problématiques
export COPYFILE_DISABLE=1
export TAR_OPTIONS="--no-xattrs"

$TAR_CMD \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='uploads' \
    --exclude='.env' \
    --exclude='.DS_Store' \
    --exclude='._*' \
    --exclude='supchat-*.tar.gz' \
    --no-xattrs \
    --no-acls \
    --no-fflags \
    -czf supchat-simple.tar.gz . 2>/dev/null || {
        log_warning "Erreur avec les options avancées, tentative avec tar basique..."
        $TAR_CMD \
            --exclude='node_modules' \
            --exclude='.git' \
            --exclude='*.log' \
            --exclude='uploads' \
            --exclude='.env' \
            --exclude='.DS_Store' \
            --exclude='._*' \
            --exclude='supchat-*.tar.gz' \
            -czf supchat-simple.tar.gz .
    }

log_success "Archive créée: supchat-simple.tar.gz"

log_info "Test de connexion au VPS..."

# Test de connexion
if ! sshpass -p "$VPS_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "echo 'OK'" &> /dev/null; then
    log_error "Impossible de se connecter au VPS"
    log_info "Vérifiez l'IP et le mot de passe"
    rm -f supchat-simple.tar.gz
    exit 1
fi

log_success "Connexion VPS OK"

log_info "Transfert de l'archive..."

# Transférer l'archive
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no supchat-simple.tar.gz $VPS_USER@$VPS_IP:/tmp/

log_success "Archive transférée"

log_info "Extraction sur le VPS..."

# Extraire sur le VPS
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    # Aller dans /tmp
    cd /tmp
    
    # Créer le répertoire de destination
    mkdir -p /opt/supchat
    
    # Sauvegarder les secrets existants s'ils existent
    if [[ -d /opt/supchat/secrets ]]; then
        echo "Sauvegarde des secrets existants..."
        cp -r /opt/supchat/secrets /tmp/secrets-backup
    fi
    
    # Extraire l'archive
    tar -xzf supchat-simple.tar.gz
    
    # Copier vers le répertoire final
    cp -r . /opt/supchat/
    
    # Restaurer les secrets s'ils existaient
    if [[ -d /tmp/secrets-backup ]]; then
        echo "Restauration des secrets..."
        cp -r /tmp/secrets-backup/* /opt/supchat/secrets/
        rm -rf /tmp/secrets-backup
    fi
    
    # Nettoyer
    rm -f /tmp/supchat-simple.tar.gz
    
    # Aller dans le répertoire du projet
    cd /opt/supchat
    
    # Rendre les scripts exécutables
    chmod +x *.sh 2>/dev/null || true
    
    # Créer les répertoires nécessaires
    mkdir -p logs backups uploads
    
    echo "=== Fichiers copiés dans /opt/supchat ==="
    ls -la
    
    echo ""
    echo "=== Scripts disponibles ==="
    ls -la *.sh 2>/dev/null || echo "Aucun script .sh trouvé"
EOF

# Nettoyer localement
rm -f supchat-simple.tar.gz

log_success "Copie terminée !"

echo ""
echo -e "${GREEN}🎉 Fichiers copiés avec succès sur le VPS !${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo ""
echo "1. Se connecter au VPS:"
echo "   ssh $VPS_USER@$VPS_IP"
echo ""
echo "2. Aller dans le répertoire:"
echo "   cd /opt/supchat"
echo ""
echo "3. Vérifier les fichiers secrets (si nécessaire):"
echo "   ls -la secrets/"
echo ""
echo "4. Lancer le déploiement:"
echo "   ./deploy-vps.sh"
echo ""
echo -e "${BLUE}Ou en une seule commande:${NC}"
echo "sshpass -p '$VPS_PASSWORD' ssh $VPS_USER@$VPS_IP 'cd /opt/supchat && ./deploy-vps.sh'"
echo ""
echo -e "${YELLOW}Note:${NC} Les fichiers ont été copiés sans les attributs macOS problématiques."
