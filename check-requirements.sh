#!/bin/bash

# =====================================
# VÉRIFICATION DES PRÉREQUIS DÉPLOIEMENT
# =====================================

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Variables
ERRORS=0
WARNINGS=0

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; ((WARNINGS++)); }
log_error() { echo -e "${RED}[✗]${NC} $1"; ((ERRORS++)); }
log_step() { echo -e "\n${PURPLE}=== $1 ===${NC}"; }

# =====================================
# VÉRIFICATIONS SYSTÈME
# =====================================

check_os() {
    log_step "Vérification du système d'exploitation"
    
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        log_info "OS détecté: $NAME $VERSION"
        
        if [[ "$ID" == "ubuntu" ]]; then
            local version_num=$(echo $VERSION_ID | cut -d. -f1)
            if [[ $version_num -ge 20 ]]; then
                log_success "Ubuntu $VERSION_ID supporté"
            else
                log_warning "Ubuntu $VERSION_ID peut ne pas être optimal (recommandé: 20.04+)"
            fi
        else
            log_warning "OS non testé: $NAME (recommandé: Ubuntu 20.04+)"
        fi
    else
        log_error "Impossible de déterminer l'OS"
    fi
}

check_resources() {
    log_step "Vérification des ressources système"
    
    # Mémoire RAM
    local ram_gb=$(free -g | awk 'NR==2{print $2}')
    if [[ $ram_gb -ge 4 ]]; then
        log_success "RAM: ${ram_gb}GB (suffisant)"
    elif [[ $ram_gb -ge 2 ]]; then
        log_warning "RAM: ${ram_gb}GB (minimum requis, 4GB+ recommandé)"
    else
        log_error "RAM: ${ram_gb}GB (insuffisant, minimum 2GB)"
    fi
    
    # Espace disque
    local disk_gb=$(df / | awk 'NR==2 {print int($4/1024/1024)}')
    if [[ $disk_gb -ge 20 ]]; then
        log_success "Espace disque: ${disk_gb}GB disponible"
    elif [[ $disk_gb -ge 10 ]]; then
        log_warning "Espace disque: ${disk_gb}GB (minimum requis, 20GB+ recommandé)"
    else
        log_error "Espace disque: ${disk_gb}GB (insuffisant, minimum 10GB)"
    fi
    
    # CPU
    local cpu_cores=$(nproc)
    if [[ $cpu_cores -ge 2 ]]; then
        log_success "CPU: ${cpu_cores} cœurs"
    else
        log_warning "CPU: ${cpu_cores} cœur (2+ recommandé)"
    fi
}

check_network() {
    log_step "Vérification de la connectivité réseau"
    
    # Test de connectivité Internet
    if ping -c 3 8.8.8.8 &> /dev/null; then
        log_success "Connectivité Internet OK"
    else
        log_error "Pas de connectivité Internet"
    fi
    
    # Test des ports
    local ports=(22 80 443 3000)
    for port in "${ports[@]}"; do
        if command -v netstat &> /dev/null; then
            if netstat -ln | grep ":$port " &> /dev/null; then
                log_warning "Port $port déjà utilisé"
            else
                log_success "Port $port disponible"
            fi
        fi
    done
}

# =====================================
# VÉRIFICATIONS LOGICIELS
# =====================================

check_software() {
    log_step "Vérification des logiciels"
    
    # Curl
    if command -v curl &> /dev/null; then
        log_success "curl installé"
    else
        log_error "curl non installé"
    fi
    
    # Git
    if command -v git &> /dev/null; then
        log_success "git installé"
    else
        log_warning "git non installé (recommandé pour les mises à jour)"
    fi
    
    # Docker
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker $docker_version installé"
        
        # Vérifier les permissions Docker
        if docker ps &> /dev/null; then
            log_success "Permissions Docker OK"
        else
            log_error "Permissions Docker insuffisantes"
        fi
    else
        log_info "Docker non installé (sera installé automatiquement)"
    fi
    
    # Docker Compose
    if command -v docker-compose &> /dev/null; then
        local compose_version=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker Compose $compose_version installé"
    else
        log_info "Docker Compose non installé (sera installé automatiquement)"
    fi
}

# =====================================
# VÉRIFICATIONS FICHIERS
# =====================================

check_project_files() {
    log_step "Vérification des fichiers du projet"
    
    # Fichiers Docker Compose
    local compose_files=("docker-compose.yml" "docker-compose.vps.yml")
    for file in "${compose_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "$file trouvé"
        else
            log_error "$file manquant"
        fi
    done
    
    # Scripts de déploiement
    local scripts=("deploy-vps.sh" "post-deploy.sh")
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            log_success "$script trouvé"
            if [[ -x "$script" ]]; then
                log_success "$script exécutable"
            else
                log_warning "$script non exécutable (chmod +x $script)"
            fi
        else
            log_error "$script manquant"
        fi
    done
    
    # Dockerfiles
    local dockerfiles=("backend/Dockerfile.backend" "frontend/Dockerfile.frontend")
    for dockerfile in "${dockerfiles[@]}"; do
        if [[ -f "$dockerfile" ]]; then
            log_success "$dockerfile trouvé"
        else
            log_error "$dockerfile manquant"
        fi
    done
}

check_secrets() {
    log_step "Vérification des fichiers secrets"
    
    if [[ ! -d "secrets" ]]; then
        log_error "Dossier secrets/ manquant"
        return
    fi
    
    # Secrets requis
    local required_secrets=(
        "db_user.txt"
        "db_password.txt"
        "jwt_secret.txt"
        "email_user.txt"
        "email_password.txt"
    )
    
    # Secrets optionnels
    local optional_secrets=(
        "google_client_id.txt"
        "google_client_secret.txt"
        "github_client_id.txt"
        "github_client_secret.txt"
        "mistral_api_key.txt"
        "strawpoll_api_key.txt"
    )
    
    for secret in "${required_secrets[@]}"; do
        if [[ -f "secrets/$secret" ]]; then
            if [[ -s "secrets/$secret" ]]; then
                log_success "$secret présent et non vide"
            else
                log_error "$secret présent mais vide"
            fi
        else
            log_error "$secret manquant"
        fi
    done
    
    for secret in "${optional_secrets[@]}"; do
        if [[ -f "secrets/$secret" ]]; then
            if [[ -s "secrets/$secret" ]]; then
                log_success "$secret présent"
            else
                log_warning "$secret présent mais vide"
            fi
        else
            log_info "$secret non configuré (optionnel)"
        fi
    done
}

# =====================================
# VÉRIFICATIONS CONFIGURATION
# =====================================

check_configuration() {
    log_step "Vérification de la configuration"
    
    # Fichier de configuration
    if [[ -f ".env" ]]; then
        log_success "Fichier .env trouvé"
        source .env
        
        if [[ -n "${VPS_DOMAIN:-}" ]]; then
            log_success "VPS_DOMAIN configuré: $VPS_DOMAIN"
        else
            log_warning "VPS_DOMAIN non configuré"
        fi
        
        if [[ -n "${ADMIN_EMAIL:-}" ]]; then
            log_success "ADMIN_EMAIL configuré: $ADMIN_EMAIL"
        else
            log_warning "ADMIN_EMAIL non configuré"
        fi
        
    elif [[ -f "deploy.env.example" ]]; then
        log_warning "Fichier .env manquant (copiez deploy.env.example vers .env)"
    else
        log_error "Aucun fichier de configuration trouvé"
    fi
}

# =====================================
# RECOMMANDATIONS
# =====================================

show_recommendations() {
    log_step "Recommandations"
    
    echo -e "${CYAN}📋 Actions recommandées avant le déploiement:${NC}"
    echo "• Configurez votre DNS pour pointer vers ce serveur"
    echo "• Vérifiez que tous les secrets sont correctement configurés"
    echo "• Assurez-vous d'avoir une sauvegarde de vos données"
    echo "• Testez d'abord le déploiement en local"
    echo ""
    
    echo -e "${CYAN}🔧 Après le déploiement:${NC}"
    echo "• Exécutez post-deploy.sh pour SSL et optimisations"
    echo "• Configurez le monitoring avec des alertes email"
    echo "• Planifiez des sauvegardes régulières"
    echo "• Surveillez les logs d'application"
}

# =====================================
# RAPPORT FINAL
# =====================================

show_summary() {
    log_step "Résumé de la vérification"
    
    echo -e "${GREEN}✓ Vérifications réussies${NC}"
    echo -e "${YELLOW}⚠ Avertissements: $WARNINGS${NC}"
    echo -e "${RED}✗ Erreurs: $ERRORS${NC}"
    echo ""
    
    if [[ $ERRORS -eq 0 ]]; then
        if [[ $WARNINGS -eq 0 ]]; then
            echo -e "${GREEN}🎉 Tout est prêt pour le déploiement !${NC}"
        else
            echo -e "${YELLOW}✅ Déploiement possible avec quelques avertissements${NC}"
        fi
        echo ""
        echo -e "${BLUE}Pour déployer:${NC}"
        echo "  ./deploy-vps.sh"
    else
        echo -e "${RED}❌ Veuillez corriger les erreurs avant le déploiement${NC}"
        exit 1
    fi
}

# =====================================
# SCRIPT PRINCIPAL
# =====================================

main() {
    clear
    echo -e "${PURPLE}"
    echo "================================="
    echo "   VÉRIFICATION PRÉREQUIS VPS"
    echo "================================="
    echo -e "${NC}"
    
    check_os
    check_resources
    check_network
    check_software
    check_project_files
    check_secrets
    check_configuration
    show_recommendations
    show_summary
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
