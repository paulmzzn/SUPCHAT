#!/bin/bash

# =====================================
# SCRIPT POST-DÉPLOIEMENT SUPCHAT
# =====================================
# Configuration SSL, optimisations et sécurité

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration par défaut
PROJECT_DIR="/opt/supchat"
DOMAIN=""
EMAIL=""

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${PURPLE}=== $1 ===${NC}"; }

confirm() {
    read -p "$(echo -e ${YELLOW}$1 [y/N]:${NC} )" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# =====================================
# CONFIGURATION SSL AVEC CERTBOT
# =====================================

install_certbot() {
    log_step "Installation de Certbot pour SSL"
    
    # Installation de Certbot
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    
    log_success "Certbot installé"
}

setup_ssl() {
    log_step "Configuration SSL avec Let's Encrypt"
    
    if [[ -z "$DOMAIN" ]]; then
        read -p "Entrez votre nom de domaine (ex: example.com): " DOMAIN
    fi
    
    if [[ -z "$EMAIL" ]]; then
        read -p "Entrez votre email pour Let's Encrypt: " EMAIL
    fi
    
    # Vérifier que le domaine pointe vers ce serveur
    local server_ip=$(curl -s ifconfig.me)
    local domain_ip=$(dig +short "$DOMAIN" | tail -n1)
    
    if [[ "$server_ip" != "$domain_ip" ]]; then
        log_warning "Le domaine $DOMAIN ne pointe pas vers ce serveur ($server_ip vs $domain_ip)"
        if ! confirm "Continuer quand même ?"; then
            return 1
        fi
    fi
    
    # Obtenir le certificat SSL
    sudo certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
    
    # Configurer le renouvellement automatique
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log_success "SSL configuré pour $DOMAIN"
}

# =====================================
# CONFIGURATION NGINX AVANCÉE
# =====================================

setup_nginx_config() {
    log_step "Configuration avancée de Nginx"
    
    # Créer une configuration Nginx optimisée
    cat > "/tmp/nginx-supchat.conf" << EOF
# Configuration Nginx optimisée pour SUPCHAT
upstream backend {
    server 185.98.137.166:3000;
    keepalive 32;
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# Configuration HTTPS principale
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # Certificats SSL (gérés par Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gestion des fichiers statiques
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy vers le backend API
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket pour Socket.IO
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Frontend React
    location / {
        proxy_pass http://185.98.137.166:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Logs
    access_log /var/log/nginx/supchat_access.log;
    error_log /var/log/nginx/supchat_error.log;
}
EOF

    # Installer la configuration
    sudo mv "/tmp/nginx-supchat.conf" "/etc/nginx/sites-available/supchat"
    sudo ln -sf "/etc/nginx/sites-available/supchat" "/etc/nginx/sites-enabled/"
    
    # Supprimer la configuration par défaut
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Tester et recharger Nginx
    sudo nginx -t && sudo systemctl reload nginx
    
    log_success "Configuration Nginx mise à jour"
}

# =====================================
# OPTIMISATIONS SYSTÈME
# =====================================

optimize_system() {
    log_step "Optimisations système"
    
    # Augmenter les limites de fichiers
    cat >> /etc/security/limits.conf << EOF
# Limites pour SUPCHAT
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

    # Optimisations réseau
    cat >> /etc/sysctl.conf << EOF
# Optimisations réseau pour SUPCHAT
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 1024
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 3
EOF

    sudo sysctl -p
    
    log_success "Optimisations système appliquées"
}

# =====================================
# MONITORING AVANCÉ
# =====================================

setup_advanced_monitoring() {
    log_step "Configuration du monitoring avancé"
    
    # Créer un script de monitoring détaillé
    cat > "$PROJECT_DIR/advanced-monitor.sh" << 'EOF'
#!/bin/bash

LOGFILE="/opt/supchat/logs/monitoring.log"
ALERT_EMAIL="admin@example.com"

log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"
}

check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $usage -gt 90 ]]; then
        log_with_timestamp "ALERT: Espace disque critique: ${usage}%"
        return 1
    fi
    return 0
}

check_memory() {
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $usage -gt 90 ]]; then
        log_with_timestamp "ALERT: Mémoire critique: ${usage}%"
        return 1
    fi
    return 0
}

check_containers() {
    local containers=$(docker ps -q | wc -l)
    local expected=3  # postgres, backend, frontend
    
    if [[ $containers -lt $expected ]]; then
        log_with_timestamp "ALERT: Conteneurs manquants: $containers/$expected"
        return 1
    fi
    return 0
}

check_services() {
    local backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://185.98.137.166:3000/health)
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://185.98.137.166:80)
    
    if [[ $backend_status != "200" ]]; then
        log_with_timestamp "ALERT: Backend non accessible (HTTP $backend_status)"
        return 1
    fi
    
    if [[ $frontend_status != "200" ]]; then
        log_with_timestamp "ALERT: Frontend non accessible (HTTP $frontend_status)"
        return 1
    fi
    
    return 0
}

# Exécuter les vérifications
alerts=0

check_disk_space || ((alerts++))
check_memory || ((alerts++))
check_containers || ((alerts++))
check_services || ((alerts++))

if [[ $alerts -eq 0 ]]; then
    log_with_timestamp "Tous les services fonctionnent normalement"
else
    log_with_timestamp "ATTENTION: $alerts alertes détectées"
fi
EOF

    chmod +x "$PROJECT_DIR/advanced-monitor.sh"
    
    # Programmer le monitoring toutes les minutes
    (crontab -l 2>/dev/null; echo "* * * * * $PROJECT_DIR/advanced-monitor.sh") | crontab -
    
    log_success "Monitoring avancé configuré"
}

# =====================================
# SÉCURITÉ AVANCÉE
# =====================================

harden_security() {
    log_step "Durcissement de la sécurité"
    
    # Installer fail2ban
    sudo apt install -y fail2ban
    
    # Configuration fail2ban pour Nginx
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
EOF

    sudo systemctl enable fail2ban
    sudo systemctl restart fail2ban
    
    # Désactiver les services inutiles
    sudo systemctl disable bluetooth || true
    sudo systemctl disable cups || true
    
    # Configuration SSH sécurisée
    sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Désactiver la connexion root par SSH
    sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    
    # Autres configurations SSH sécurisées
    echo "Protocol 2" | sudo tee -a /etc/ssh/sshd_config
    echo "MaxAuthTries 3" | sudo tee -a /etc/ssh/sshd_config
    echo "ClientAliveInterval 300" | sudo tee -a /etc/ssh/sshd_config
    echo "ClientAliveCountMax 2" | sudo tee -a /etc/ssh/sshd_config
    
    sudo systemctl restart sshd
    
    log_success "Sécurité durcie"
}

# =====================================
# MENU PRINCIPAL
# =====================================

show_menu() {
    clear
    echo -e "${PURPLE}"
    echo "================================="
    echo "   POST-DÉPLOIEMENT SUPCHAT"
    echo "================================="
    echo -e "${NC}"
    echo ""
    echo "1) Configuration SSL complète"
    echo "2) Optimisations système"
    echo "3) Monitoring avancé"
    echo "4) Durcissement sécurité"
    echo "5) Configuration complète (tout)"
    echo "6) Quitter"
    echo ""
    read -p "Choisissez une option [1-6]: " choice
}

main() {
    # Charger les variables d'environnement si elles existent
    if [[ -f "$PROJECT_DIR/.env" ]]; then
        source "$PROJECT_DIR/.env"
    fi
    
    while true; do
        show_menu
        case $choice in
            1)
                install_certbot
                setup_ssl
                setup_nginx_config
                ;;
            2)
                optimize_system
                ;;
            3)
                setup_advanced_monitoring
                ;;
            4)
                harden_security
                ;;
            5)
                install_certbot
                setup_ssl
                setup_nginx_config
                optimize_system
                setup_advanced_monitoring
                harden_security
                log_success "Configuration complète terminée!"
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
        
        echo ""
        read -p "Appuyez sur Entrée pour continuer..."
    done
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
