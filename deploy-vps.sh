#!/bin/bash

# =====================================
# SCRIPT DE DÉPLOIEMENT VPS SUPCHAT
# =====================================
# Version: 2.0
# Auteur: Assistant IA
# Date: $(date +%Y-%m-%d)

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =====================================
# CONFIGURATION
# =====================================

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration par défaut
DEFAULT_DOMAIN="192.168.1.169"
DEFAULT_EMAIL="admin@example.com"
DEFAULT_PROJECT_DIR="/opt/supchat"
DEFAULT_COMPOSE_FILE="docker-compose.vps.yml"

# Variables d'environnement
VPS_DOMAIN="${VPS_DOMAIN:-$DEFAULT_DOMAIN}"
ADMIN_EMAIL="${ADMIN_EMAIL:-$DEFAULT_EMAIL}"
PROJECT_DIR="${PROJECT_DIR:-$DEFAULT_PROJECT_DIR}"
COMPOSE_FILE="${COMPOSE_FILE:-$DEFAULT_COMPOSE_FILE}"
SUDO_CMD="sudo"  # Sera modifié dans check_root() si nécessaire

# =====================================
# FONCTIONS UTILITAIRES
# =====================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${PURPLE}=== $1 ===${NC}"
}

confirm() {
    read -p "$(echo -e ${YELLOW}$1 [y/N]:${NC} )" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "Script exécuté en tant que root."
        log_info "Désactivation des commandes sudo pour cette session."
        SUDO_CMD=""
    else
        SUDO_CMD="sudo"
        # Vérifier si l'utilisateur peut utiliser sudo
        if ! sudo -n true 2>/dev/null; then
            log_info "Ce script nécessite des privilèges administrateur."
            log_info "Vous devrez peut-être entrer votre mot de passe."
        fi
    fi
}

check_prerequisites() {
    log_step "Vérification des prérequis"
    
    # Vérifier si Docker est installé
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        return 1
    fi
    
    # Vérifier si Docker Compose est installé
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        return 1
    fi
    
    # Vérifier les permissions Docker
    if ! docker ps &> /dev/null; then
        log_error "Permissions Docker insuffisantes. Ajoutez votre utilisateur au groupe docker:"
        log_info "sudo usermod -aG docker \$USER && newgrp docker"
        return 1
    fi
    
    log_success "Tous les prérequis sont satisfaits"
}

install_docker() {
    log_step "Installation de Docker et Docker Compose"
    
    if command -v docker &> /dev/null; then
        log_info "Docker est déjà installé"
        return 0
    fi
    
    log_info "Installation de Docker..."
    
    # Mise à jour du système
    $SUDO_CMD apt update
    
    # Installation des dépendances
    $SUDO_CMD apt install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Ajout de la clé GPG Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO_CMD gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Ajout du repository Docker
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | $SUDO_CMD tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Installation de Docker
    $SUDO_CMD apt update
    $SUDO_CMD apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Installation de Docker Compose standalone
    $SUDO_CMD curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    $SUDO_CMD chmod +x /usr/local/bin/docker-compose
    
    # Ajout de l'utilisateur au groupe docker (seulement si pas root)
    if [[ $EUID -ne 0 ]]; then
        $SUDO_CMD usermod -aG docker $USER
        log_warning "Veuillez vous reconnecter pour appliquer les permissions Docker"
    fi
    
    log_success "Docker et Docker Compose installés avec succès"
}

setup_firewall() {
    log_step "Configuration du pare-feu"
    
    if ! command -v ufw &> /dev/null; then
        log_info "Installation d'UFW..."
        $SUDO_CMD apt install -y ufw
    fi
    
    # Configuration des règles UFW
    $SUDO_CMD ufw --force reset
    $SUDO_CMD ufw default deny incoming
    $SUDO_CMD ufw default allow outgoing
    
    # Autoriser SSH (attention à ne pas se couper!)
    $SUDO_CMD ufw allow ssh
    $SUDO_CMD ufw allow 22/tcp
    
    # Autoriser HTTP et HTTPS
    $SUDO_CMD ufw allow 80/tcp
    $SUDO_CMD ufw allow 443/tcp
    
    # Autoriser les ports de l'application
    $SUDO_CMD ufw allow 3000/tcp  # API Backend
    
    # Activer le firewall
    $SUDO_CMD ufw --force enable
    
    log_success "Pare-feu configuré avec succès"
}

create_project_structure() {
    log_step "Création de la structure du projet"
    
    # Créer le répertoire du projet
    if [[ $EUID -eq 0 ]]; then
        # Si root, créer directement
        mkdir -p "$PROJECT_DIR"
        chown -R root:root "$PROJECT_DIR"
    else
        # Si utilisateur normal, utiliser sudo
        $SUDO_CMD mkdir -p "$PROJECT_DIR"
        $SUDO_CMD chown -R $USER:$USER "$PROJECT_DIR"
    fi
    
    # Créer les répertoires nécessaires
    mkdir -p "$PROJECT_DIR"/{logs,backups,uploads}
    
    log_success "Structure du projet créée dans $PROJECT_DIR"
}

copy_project_files() {
    log_step "Copie des fichiers du projet"
    
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Fichier Docker Compose non trouvé: $COMPOSE_FILE"
        exit 1
    fi
    
    # Vérifier si on est déjà dans le bon répertoire
    if [[ "$(pwd)" == "$PROJECT_DIR" ]]; then
        log_info "Déjà dans le répertoire du projet: $PROJECT_DIR"
        log_info "Pas besoin de copier les fichiers"
    else
        # Copier les fichiers nécessaires
        cp -r . "$PROJECT_DIR/"
        
        # Définir les bonnes permissions
        if [[ $EUID -eq 0 ]]; then
            chown -R root:root "$PROJECT_DIR"
        else
            $SUDO_CMD chown -R $USER:$USER "$PROJECT_DIR"
        fi
    fi
    
    # Rendre les scripts exécutables
    chmod +x "$PROJECT_DIR"/*.sh 2>/dev/null || true
    
    log_success "Fichiers du projet prêts"
}

validate_secrets() {
    log_step "Validation des fichiers secrets"
    
    local secrets_dir="$PROJECT_DIR/secrets"
    local missing_secrets=()
    
    # Liste des secrets requis
    local required_secrets=(
        "db_user.txt"
        "db_password.txt"
        "jwt_secret.txt"
        "email_user.txt"
        "email_password.txt"
    )
    
    # Vérifier chaque secret
    for secret in "${required_secrets[@]}"; do
        if [[ ! -f "$secrets_dir/$secret" ]]; then
            missing_secrets+=("$secret")
        fi
    done
    
    if [[ ${#missing_secrets[@]} -gt 0 ]]; then
        log_error "Fichiers secrets manquants:"
        printf '%s\n' "${missing_secrets[@]}"
        log_info "Créez ces fichiers dans $secrets_dir/"
        exit 1
    fi
    
    log_success "Tous les fichiers secrets sont présents"
}

build_images() {
    log_step "Construction des images Docker"
    
    cd "$PROJECT_DIR"
    
    # Arrêter les conteneurs existants
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true
    
    # Supprimer les anciennes images
    docker system prune -f
    
    # Construire les nouvelles images
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    log_success "Images Docker construites avec succès"
}

deploy_containers() {
    log_step "Déploiement des conteneurs"
    
    cd "$PROJECT_DIR"
    
    # Définir les variables d'environnement
    export VPS_DOMAIN="$VPS_DOMAIN"
    export ADMIN_EMAIL="$ADMIN_EMAIL"
    
    # Démarrer les services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Attendre que les services soient prêts
    log_info "Attente du démarrage des services..."
    sleep 30
    
    # Vérifier le statut des conteneurs
    docker-compose -f "$COMPOSE_FILE" ps
    
    log_success "Conteneurs déployés avec succès"
}

setup_monitoring() {
    log_step "Configuration du monitoring"
    
    # Créer un script de monitoring
    cat > "$PROJECT_DIR/monitor.sh" << 'EOF'
#!/bin/bash
# Script de monitoring simple

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

# Vérifier Docker
if systemctl is-active --quiet docker; then
    echo "✅ Docker: OK"
else
    echo "❌ Docker: ERREUR"
fi

# Vérifier les conteneurs
echo ""
echo "=== Conteneurs Docker ==="
docker-compose ps

# Vérifier les services
echo ""
echo "=== Services ==="
check_service "Backend API" 3000
check_service "Frontend" 80

# Vérifier l'utilisation des ressources
echo ""
echo "=== Ressources système ==="
echo "Mémoire: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disque: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " utilisé)"}')"
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
EOF

    chmod +x "$PROJECT_DIR/monitor.sh"
    
    # Créer une tâche cron pour le monitoring
    (crontab -l 2>/dev/null; echo "*/5 * * * * $PROJECT_DIR/monitor.sh >> $PROJECT_DIR/logs/monitor.log 2>&1") | crontab -
    
    log_success "Monitoring configuré"
}

setup_backup() {
    log_step "Configuration des sauvegardes"
    
    # Créer un script de sauvegarde
    cat > "$PROJECT_DIR/backup.sh" << EOF
#!/bin/bash
# Script de sauvegarde automatique

BACKUP_DIR="$PROJECT_DIR/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_BACKUP="\$BACKUP_DIR/db_backup_\$DATE.sql"

# Créer le répertoire de sauvegarde
mkdir -p "\$BACKUP_DIR"

# Sauvegarde de la base de données
docker exec supchat-postgres-vps pg_dumpall -U \$(cat $PROJECT_DIR/secrets/db_user.txt) > "\$DB_BACKUP"

# Compresser la sauvegarde
gzip "\$DB_BACKUP"

# Garder seulement les 7 dernières sauvegardes
find "\$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Sauvegarde terminée: \$DB_BACKUP.gz"
EOF

    chmod +x "$PROJECT_DIR/backup.sh"
    
    # Programmer la sauvegarde quotidienne à 2h du matin
    (crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_DIR/backup.sh >> $PROJECT_DIR/logs/backup.log 2>&1") | crontab -
    
    log_success "Sauvegardes programmées quotidiennement à 2h"
}

show_deployment_info() {
    log_step "Informations de déploiement"
    
    echo -e "${GREEN}"
    echo "🎉 Déploiement terminé avec succès !"
    echo -e "${NC}"
    
    echo -e "${CYAN}📋 Informations importantes:${NC}"
    echo "• Domaine: $VPS_DOMAIN"
    echo "• Répertoire du projet: $PROJECT_DIR"
    echo "• Fichier Docker Compose: $COMPOSE_FILE"
    echo ""
    
    echo -e "${CYAN}🌐 Accès aux services:${NC}"
    echo "• Frontend: http://$VPS_DOMAIN"
    echo "• API Backend: http://$VPS_DOMAIN:3000"
    echo ""
    
    echo -e "${CYAN}🔧 Commandes utiles:${NC}"
    echo "• Voir les logs: docker-compose -f $PROJECT_DIR/$COMPOSE_FILE logs -f"
    echo "• Redémarrer: docker-compose -f $PROJECT_DIR/$COMPOSE_FILE restart"
    echo "• Monitoring: $PROJECT_DIR/monitor.sh"
    echo "• Sauvegarde manuelle: $PROJECT_DIR/backup.sh"
    echo ""
    
    echo -e "${YELLOW}⚠️  Notes importantes:${NC}"
    echo "• Configurez votre DNS pour pointer vers ce serveur"
    echo "• Considérez l'installation d'un certificat SSL (Let's Encrypt)"
    echo "• Surveillez les logs régulièrement"
    echo "• Les sauvegardes sont programmées quotidiennement à 2h"
}

# =====================================
# MENU PRINCIPAL
# =====================================

show_menu() {
    clear
    echo -e "${PURPLE}"
    echo "================================="
    echo "   DÉPLOIEMENT VPS SUPCHAT"
    echo "================================="
    echo -e "${NC}"
    echo ""
    echo "1) Installation complète (recommandé)"
    echo "2) Installer Docker uniquement"
    echo "3) Déployer l'application uniquement"
    echo "4) Configurer le monitoring"
    echo "5) Configurer les sauvegardes"
    echo "6) Afficher le statut"
    echo "7) Quitter"
    echo ""
    read -p "Choisissez une option [1-7]: " choice
}

# =====================================
# SCRIPT PRINCIPAL
# =====================================

main() {
    log_step "Démarrage du script de déploiement SUPCHAT"
    
    # Vérification initiale
    check_root
    
    while true; do
        show_menu
        case $choice in
            1)
                log_info "Installation complète sélectionnée"
                install_docker
                setup_firewall
                create_project_structure
                copy_project_files
                validate_secrets
                build_images
                deploy_containers
                setup_monitoring
                setup_backup
                show_deployment_info
                break
                ;;
            2)
                install_docker
                ;;
            3)
                check_prerequisites
                create_project_structure
                copy_project_files
                validate_secrets
                build_images
                deploy_containers
                show_deployment_info
                ;;
            4)
                setup_monitoring
                ;;
            5)
                setup_backup
                ;;
            6)
                if [[ -f "$PROJECT_DIR/monitor.sh" ]]; then
                    "$PROJECT_DIR/monitor.sh"
                else
                    log_error "Script de monitoring non trouvé"
                fi
                read -p "Appuyez sur Entrée pour continuer..."
                ;;
            7)
                log_info "Au revoir !"
                exit 0
                ;;
            *)
                log_error "Option invalide"
                sleep 2
                ;;
        esac
    done
}

# Vérifier si le script est exécuté directement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
