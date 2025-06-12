#!/bin/bash

# =====================================
# SCRIPT DE DÉPLOIEMENT AUTO VPS
# =====================================
# Version optimisée pour exécution automatique

set -euo pipefail

# Configuration de l'environnement
export TERM=xterm
export DEBIAN_FRONTEND=noninteractive

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration par défaut
PROJECT_DIR="/opt/supchat"
COMPOSE_FILE="docker-compose.vps.yml"

# Fonctions utilitaires
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${PURPLE}=== $1 ===${NC}"; }

# Vérifier que le script est exécuté en tant que root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Ce script doit être exécuté en tant que root"
        exit 1
    fi
}

# Vérifier les prérequis
check_prerequisites() {
    log_step "Vérification des prérequis"
    
    # Vérifier les fichiers du projet
    if [[ ! -f "$PROJECT_DIR/$COMPOSE_FILE" ]]; then
        log_error "Fichier Docker Compose non trouvé: $PROJECT_DIR/$COMPOSE_FILE"
        exit 1
    fi
    
    log_success "Fichiers du projet OK"
}

# Installation de Docker
install_docker() {
    log_step "Installation de Docker"
    
    if command -v docker &> /dev/null; then
        log_info "Docker déjà installé"
        return 0
    fi
    
    log_info "Mise à jour du système..."
    apt update -qq
    
    log_info "Installation des dépendances..."
    apt install -y -qq \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    log_info "Ajout du repository Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    log_info "Installation de Docker..."
    apt update -qq
    apt install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    log_info "Installation de Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Démarrer Docker
    systemctl enable docker
    systemctl start docker
    
    log_success "Docker installé et démarré"
}

# Configuration du pare-feu
setup_firewall() {
    log_step "Configuration du pare-feu"
    
    if ! command -v ufw &> /dev/null; then
        log_info "Installation d'UFW..."
        apt install -y -qq ufw
    fi
    
    # Configuration UFW
    ufw --force reset > /dev/null
    ufw default deny incoming > /dev/null
    ufw default allow outgoing > /dev/null
    
    # Autoriser les ports nécessaires
    ufw allow ssh > /dev/null
    ufw allow 22/tcp > /dev/null
    ufw allow 80/tcp > /dev/null
    ufw allow 443/tcp > /dev/null
    ufw allow 3000/tcp > /dev/null
    
    # Activer le firewall
    echo "y" | ufw enable > /dev/null
    
    log_success "Pare-feu configuré"
}

# Validation des secrets
validate_secrets() {
    log_step "Validation des secrets"
    
    local secrets_dir="$PROJECT_DIR/secrets"
    local missing_secrets=()
    
    local required_secrets=(
        "db_user.txt"
        "db_password.txt"
        "jwt_secret.txt"
    )
    
    for secret in "${required_secrets[@]}"; do
        if [[ ! -f "$secrets_dir/$secret" ]]; then
            missing_secrets+=("$secret")
        fi
    done
    
    if [[ ${#missing_secrets[@]} -gt 0 ]]; then
        log_error "Fichiers secrets manquants:"
        printf '%s\n' "${missing_secrets[@]}"
        
        # Créer les secrets manquants avec des valeurs par défaut
        log_info "Création des secrets avec des valeurs par défaut..."
        mkdir -p "$secrets_dir"
        
        [[ ! -f "$secrets_dir/db_user.txt" ]] && echo "supchat_user" > "$secrets_dir/db_user.txt"
        [[ ! -f "$secrets_dir/db_password.txt" ]] && echo "$(openssl rand -base64 32)" > "$secrets_dir/db_password.txt"
        [[ ! -f "$secrets_dir/jwt_secret.txt" ]] && echo "$(openssl rand -base64 64)" > "$secrets_dir/jwt_secret.txt"
        [[ ! -f "$secrets_dir/email_user.txt" ]] && echo "admin@example.com" > "$secrets_dir/email_user.txt"
        [[ ! -f "$secrets_dir/email_password.txt" ]] && echo "changeme" > "$secrets_dir/email_password.txt"
        
        log_warning "Secrets créés avec des valeurs par défaut. Modifiez-les si nécessaire."
    fi
    
    log_success "Secrets validés"
}

# Construction des images
build_images() {
    log_step "Construction des images Docker"
    
    cd "$PROJECT_DIR"
    
    # Utiliser docker compose ou docker-compose selon ce qui est disponible
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        DOCKER_COMPOSE="docker compose"
    fi
    
    # Arrêter les conteneurs existants
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    
    # Nettoyer le système Docker
    docker system prune -f > /dev/null
    
    # Construire les images
    log_info "Construction des images (cela peut prendre plusieurs minutes)..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" build --no-cache
    
    log_success "Images construites"
}

# Déploiement des conteneurs
deploy_containers() {
    log_step "Déploiement des conteneurs"
    
    cd "$PROJECT_DIR"
    
    # Utiliser docker compose ou docker-compose selon ce qui est disponible
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        DOCKER_COMPOSE="docker compose"
    fi
    
    # Variables d'environnement
    export VPS_DOMAIN="${VPS_DOMAIN:-192.168.1.169}"
    export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@192.168.1.169}"
    
    # Démarrer les services
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d
    
    # Attendre le démarrage
    log_info "Attente du démarrage des services..."
    sleep 30
    
    # Vérifier le statut
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps
    
    log_success "Conteneurs déployés"
}

# Configuration du monitoring
setup_monitoring() {
    log_step "Configuration du monitoring"
    
    cat > "$PROJECT_DIR/monitor.sh" << 'EOF'
#!/bin/bash
check_service() {
    local service_name=$1
    local port=$2
    if curl -f -s "http://192.168.1.169:$port/health" > /dev/null 2>&1; then
        echo "✅ $service_name: OK"
    else
        echo "❌ $service_name: ERREUR"
    fi
}

echo "=== État des services SUPCHAT ==="
echo "Date: $(date)"
echo ""

if systemctl is-active --quiet docker; then
    echo "✅ Docker: OK"
else
    echo "❌ Docker: ERREUR"
fi

echo ""
echo "=== Conteneurs ==="
if command -v docker-compose &> /dev/null; then
    docker-compose -f /opt/supchat/docker-compose.vps.yml ps 2>/dev/null || echo "Erreur conteneurs"
else
    docker compose -f /opt/supchat/docker-compose.vps.yml ps 2>/dev/null || echo "Erreur conteneurs"
fi

echo ""
echo "=== Services ==="
check_service "Backend API" 3000
check_service "Frontend" 80

echo ""
echo "=== Ressources ==="
echo "Mémoire: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disque: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " utilisé)"}')"
EOF

    chmod +x "$PROJECT_DIR/monitor.sh"
    
    # Programmer le monitoring
    (crontab -l 2>/dev/null; echo "*/5 * * * * $PROJECT_DIR/monitor.sh >> $PROJECT_DIR/logs/monitor.log 2>&1") | crontab - 2>/dev/null || true
    
    log_success "Monitoring configuré"
}

# Configuration des sauvegardes
setup_backup() {
    log_step "Configuration des sauvegardes"
    
    cat > "$PROJECT_DIR/backup.sh" << EOF
#!/bin/bash
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_BACKUP="\$BACKUP_DIR/db_backup_\$DATE.sql"

mkdir -p "\$BACKUP_DIR"

if docker ps | grep supchat-postgres-vps > /dev/null; then
    docker exec supchat-postgres-vps pg_dumpall -U \$(cat $PROJECT_DIR/secrets/db_user.txt) > "\$DB_BACKUP" 2>/dev/null
    gzip "\$DB_BACKUP"
    find "\$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
    echo "Sauvegarde terminée: \$DB_BACKUP.gz"
else
    echo "Erreur: conteneur PostgreSQL non trouvé"
fi
EOF

    chmod +x "$PROJECT_DIR/backup.sh"
    
    # Programmer les sauvegardes
    (crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_DIR/backup.sh >> $PROJECT_DIR/logs/backup.log 2>&1") | crontab - 2>/dev/null || true
    
    log_success "Sauvegardes programmées"
}

# Affichage des informations finales
show_deployment_info() {
    log_step "Déploiement terminé"
    
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "IP_INCONNUE")
    
    echo -e "${GREEN}🎉 Déploiement réussi !${NC}"
    echo ""
    echo -e "${YELLOW}📋 Accès aux services:${NC}"
    echo "• Frontend: http://$server_ip"
    echo "• API Backend: http://$server_ip:3000"
    echo "• PgAdmin: http://$server_ip:8080"
    echo ""
    echo -e "${YELLOW}🔧 Commandes utiles:${NC}"
    echo "• Monitoring: $PROJECT_DIR/monitor.sh"
    echo "• Logs: docker-compose -f $PROJECT_DIR/$COMPOSE_FILE logs -f"
    echo "• Redémarrer: docker-compose -f $PROJECT_DIR/$COMPOSE_FILE restart"
    echo ""
    echo -e "${YELLOW}📁 Fichiers:${NC}"
    echo "• Projet: $PROJECT_DIR"
    echo "• Logs: $PROJECT_DIR/logs"
    echo "• Sauvegardes: $PROJECT_DIR/backups"
}

# Fonction principale
main() {
    echo -e "${PURPLE}"
    echo "================================="
    echo "   DÉPLOIEMENT AUTO SUPCHAT VPS"
    echo "================================="
    echo -e "${NC}"
    
    check_root
    check_prerequisites
    install_docker
    setup_firewall
    validate_secrets
    build_images
    deploy_containers
    setup_monitoring
    setup_backup
    show_deployment_info
}

# Exécution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
