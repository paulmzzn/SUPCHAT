#!/bin/bash

# =====================================
# SCRIPT DE DÉPLOIEMENT DISTANT VPS
# =====================================
# Ce script transfert et déploie automatiquement sur le VPS

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${PURPLE}=== $1 ===${NC}"; }

# Configuration VPS
VPS_IP=""
VPS_USER="root"
VPS_PASSWORD="SWXTnNoBPlh"
VPS_DOMAIN=""

# Fonction pour vérifier les prérequis locaux
check_local_prerequisites() {
    log_step "Vérification des prérequis locaux"
    
    # Vérifier sshpass
    if ! command -v sshpass &> /dev/null; then
        log_error "sshpass n'est pas installé"
        echo "Installation sur macOS: brew install hudochenkov/sshpass/sshpass"
        echo "Installation sur Ubuntu: sudo apt install sshpass"
        exit 1
    fi
    
    # Vérifier les fichiers requis
    local required_files=(
        "docker-compose.vps.yml"
        "deploy-vps.sh"
        "secrets/db_user.txt"
        "secrets/db_password.txt"
        "secrets/jwt_secret.txt"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Fichier manquant: $file"
            exit 1
        fi
    done
    
    log_success "Prérequis locaux OK"
}

# Configuration interactive
configure() {
    echo -e "${PURPLE}"
    echo "================================="
    echo "   CONFIGURATION DÉPLOIEMENT VPS"
    echo "================================="
    echo -e "${NC}"
    
    if [[ -z "$VPS_IP" ]]; then
        read -p "IP de votre VPS: " VPS_IP
    fi
    
    if [[ -z "$VPS_DOMAIN" ]]; then
        read -p "Nom de domaine (ex: monsite.com) [optionnel]: " VPS_DOMAIN
        if [[ -z "$VPS_DOMAIN" ]]; then
            VPS_DOMAIN="$VPS_IP"
        fi
    fi
    
    echo ""
    echo "Configuration:"
    echo "• IP VPS: $VPS_IP"
    echo "• Utilisateur: $VPS_USER"
    echo "• Domaine: $VPS_DOMAIN"
    echo ""
    
    if ! read -p "Continuer ? [y/N]: " -n 1 -r || [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\nAnnulé."
        exit 1
    fi
    echo
}

# Test de connexion VPS
test_vps_connection() {
    log_step "Test de connexion au VPS"
    
    if sshpass -p "$VPS_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "echo 'Connexion OK'" &> /dev/null; then
        log_success "Connexion au VPS réussie"
    else
        log_error "Impossible de se connecter au VPS"
        log_info "Vérifiez l'IP, le nom d'utilisateur et le mot de passe"
        exit 1
    fi
}

# Transfert des fichiers
transfer_files() {
    log_step "Transfert des fichiers vers le VPS"
    
    # Créer l'archive
    log_info "Création de l'archive..."
    tar -czf supchat-deploy.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='uploads' \
        --exclude='.env' \
        --exclude='supchat-deploy.tar.gz' \
        .
    
    # Transférer
    log_info "Transfert vers le VPS..."
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no supchat-deploy.tar.gz $VPS_USER@$VPS_IP:/tmp/
    
    # Nettoyer localement
    rm -f supchat-deploy.tar.gz
    
    log_success "Fichiers transférés"
}

# Déploiement sur le VPS
deploy_on_vps() {
    log_step "Déploiement sur le VPS"
    
    log_info "Extraction et déploiement..."
    
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << EOF
        set -e
        
        echo "=== Extraction du projet ==="
        cd /tmp
        tar -xzf supchat-deploy.tar.gz
        
        # Créer le répertoire de destination
        mkdir -p /opt/supchat
        
        # Copier les fichiers (préserver les secrets existants)
        if [[ -d /opt/supchat/secrets ]]; then
            echo "Sauvegarde des secrets existants..."
            cp -r /opt/supchat/secrets /tmp/secrets-backup
        fi
        
        # Copier tout le projet
        cp -r . /opt/supchat/
        
        # Restaurer les secrets s'ils existaient
        if [[ -d /tmp/secrets-backup ]]; then
            echo "Restauration des secrets..."
            cp -r /tmp/secrets-backup/* /opt/supchat/secrets/
            rm -rf /tmp/secrets-backup
        fi
        
        # Nettoyer
        rm -f /tmp/supchat-deploy.tar.gz
        
        # Aller dans le répertoire du projet
        cd /opt/supchat
        
        # Rendre les scripts exécutables
        chmod +x *.sh
        
        # Créer le fichier .env avec la configuration
        cat > .env << ENVEOF
VPS_DOMAIN=$VPS_DOMAIN
ADMIN_EMAIL=admin@$VPS_DOMAIN
PROJECT_DIR=/opt/supchat
COMPOSE_FILE=docker-compose.vps.yml
ENVEOF
        
        echo "=== Lancement du déploiement automatique ==="
        # Exécuter le déploiement (option 1 = installation complète)
        echo "1" | ./deploy-vps.sh
EOF
    
    log_success "Déploiement terminé !"
}

# Afficher les informations finales
show_final_info() {
    log_step "Informations de déploiement"
    
    echo -e "${GREEN}🎉 Déploiement terminé avec succès !${NC}"
    echo ""
    echo -e "${YELLOW}📋 Accès à votre application:${NC}"
    echo "• Frontend: http://$VPS_DOMAIN"
    echo "• API Backend: http://$VPS_DOMAIN:3000"
    echo "• PgAdmin: http://$VPS_DOMAIN:8080"
    echo ""
    echo -e "${YELLOW}🔧 Commandes utiles sur le VPS:${NC}"
    echo "• Se connecter: ssh $VPS_USER@$VPS_IP"
    echo "• Voir les logs: docker-compose -f /opt/supchat/docker-compose.vps.yml logs -f"
    echo "• Monitoring: /opt/supchat/monitor.sh"
    echo "• Redémarrer: cd /opt/supchat && docker-compose -f docker-compose.vps.yml restart"
    echo ""
    echo -e "${YELLOW}🔒 Sécurisation recommandée:${NC}"
    echo "• Exécuter: ssh $VPS_USER@$VPS_IP 'cd /opt/supchat && ./post-deploy.sh'"
    echo "• Configurer SSL et optimisations"
}

# Menu principal
show_menu() {
    clear
    echo -e "${PURPLE}"
    echo "================================="
    echo "   DÉPLOIEMENT DISTANT VPS"
    echo "================================="
    echo -e "${NC}"
    echo ""
    echo "1) Déploiement complet (transfert + déploiement)"
    echo "2) Transfert des fichiers uniquement"
    echo "3) Déploiement uniquement (fichiers déjà sur VPS)"
    echo "4) Test de connexion VPS"
    echo "5) Afficher le statut des services"
    echo "6) Quitter"
    echo ""
    read -p "Choisissez une option [1-6]: " choice
}

# Fonction principale
main() {
    check_local_prerequisites
    
    while true; do
        show_menu
        case $choice in
            1)
                configure
                test_vps_connection
                transfer_files
                deploy_on_vps
                show_final_info
                break
                ;;
            2)
                configure
                test_vps_connection
                transfer_files
                log_success "Fichiers transférés. Connectez-vous au VPS pour déployer."
                ;;
            3)
                configure
                test_vps_connection
                deploy_on_vps
                show_final_info
                ;;
            4)
                configure
                test_vps_connection
                ;;
            5)
                configure
                test_vps_connection
                log_info "Statut des services sur le VPS:"
                sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "cd /opt/supchat && ./monitor.sh 2>/dev/null || echo 'Monitoring non configuré'"
                read -p "Appuyez sur Entrée pour continuer..."
                ;;
            6)
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

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
