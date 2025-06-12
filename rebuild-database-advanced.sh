#!/bin/bash

# =====================================
# SCRIPT DE RECONSTRUCTION AVANCÉE DB
# avec sauvegarde optionnelle
# =====================================

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }
log_backup() { echo -e "${CYAN}[BACKUP]${NC} $1"; }

show_help() {
    echo -e "${CYAN}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo "Options:"
    echo "  -h, --help              Afficher cette aide"
    echo "  -b, --backup            Créer une sauvegarde avant suppression"
    echo "  -f, --force             Ne pas demander de confirmation"
    echo "  --backup-only           Créer uniquement une sauvegarde (sans reconstruction)"
    echo "  --restore <file>        Restaurer depuis une sauvegarde"
    echo ""
    echo "Exemples:"
    echo "  $0                      Reconstruction normale avec confirmation"
    echo "  $0 -b                   Reconstruction avec sauvegarde préalable"
    echo "  $0 -f                   Reconstruction forcée sans confirmation"
    echo "  $0 --backup-only        Créer seulement une sauvegarde"
    echo "  $0 --restore backup.sql Restaurer depuis une sauvegarde"
}

# Variables par défaut
CREATE_BACKUP=false
FORCE_MODE=false
BACKUP_ONLY=false
RESTORE_FILE=""

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -b|--backup)
            CREATE_BACKUP=true
            shift
            ;;
        -f|--force)
            FORCE_MODE=true
            shift
            ;;
        --backup-only)
            BACKUP_ONLY=true
            CREATE_BACKUP=true
            shift
            ;;
        --restore)
            RESTORE_FILE="$2"
            shift 2
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${PURPLE}"
echo "======================================="
echo "   GESTION AVANCÉE BASE DE DONNÉES"
echo "         SUPCHAT"
echo "======================================="
echo -e "${NC}"

# Détection de l'environnement
if [[ -d "/opt/supchat" ]]; then
    log_info "Exécution sur le VPS détectée"
    PROJECT_DIR="/opt/supchat"
    cd "$PROJECT_DIR"
    COMPOSE_FILE="docker-compose.vps.yml"
    BACKUP_DIR="/opt/supchat/backups"
else
    log_info "Exécution en local détectée"
    PROJECT_DIR="$(pwd)"
    cd "$PROJECT_DIR"
    COMPOSE_FILE="docker-compose.yml"
    BACKUP_DIR="./backups"
fi

# Créer le dossier de sauvegarde
mkdir -p "$BACKUP_DIR"

# Détecter docker-compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Fonction de sauvegarde
create_backup() {
    local backup_filename="supchat_backup_$(date +%Y%m%d_%H%M%S).sql"
    local backup_path="$BACKUP_DIR/$backup_filename"
    
    log_backup "Création de la sauvegarde : $backup_filename"
    
    # Vérifier que PostgreSQL est accessible
    if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec postgres pg_isready -U postgres &>/dev/null; then
        log_error "PostgreSQL n'est pas accessible pour la sauvegarde"
        return 1
    fi
    
    # Créer la sauvegarde
    if $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres -d supchat --clean --if-exists > "$backup_path"; then
        log_success "Sauvegarde créée : $backup_path"
        
        # Compresser la sauvegarde
        gzip "$backup_path"
        log_success "Sauvegarde compressée : ${backup_path}.gz"
        
        # Lister les sauvegardes existantes
        log_info "Sauvegardes disponibles :"
        ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null || log_info "Aucune sauvegarde précédente"
        
        return 0
    else
        log_error "Échec de la création de la sauvegarde"
        return 1
    fi
}

# Fonction de restauration
restore_backup() {
    local restore_file="$1"
    
    if [[ ! -f "$restore_file" ]]; then
        log_error "Fichier de sauvegarde introuvable : $restore_file"
        exit 1
    fi
    
    log_step "Restauration depuis : $restore_file"
    
    # Décompresser si nécessaire
    if [[ "$restore_file" == *.gz ]]; then
        log_info "Décompression de la sauvegarde..."
        local temp_file="/tmp/restore_temp.sql"
        gunzip -c "$restore_file" > "$temp_file"
        restore_file="$temp_file"
    fi
    
    # Restaurer
    if $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d supchat < "$restore_file"; then
        log_success "Restauration terminée avec succès"
        
        # Nettoyer le fichier temporaire
        [[ -f "/tmp/restore_temp.sql" ]] && rm "/tmp/restore_temp.sql"
    else
        log_error "Échec de la restauration"
        exit 1
    fi
}

# Mode restauration
if [[ -n "$RESTORE_FILE" ]]; then
    log_step "Mode restauration activé"
    restore_backup "$RESTORE_FILE"
    exit 0
fi

# Mode sauvegarde uniquement
if [[ "$BACKUP_ONLY" == "true" ]]; then
    log_step "Mode sauvegarde uniquement"
    create_backup
    exit 0
fi

# Sauvegarde préalable si demandée
if [[ "$CREATE_BACKUP" == "true" ]]; then
    log_step "Création d'une sauvegarde avant suppression..."
    create_backup || log_warning "Échec de la sauvegarde, mais on continue..."
fi

# Demander confirmation si pas en mode force
if [[ "$FORCE_MODE" == "false" ]]; then
    echo ""
    log_warning "⚠️  ATTENTION: Cette opération va SUPPRIMER DÉFINITIVEMENT toutes les données !"
    log_warning "⚠️  Tous les utilisateurs, messages, workspaces, etc. seront perdus !"
    echo ""
    read -p "Êtes-vous sûr de vouloir continuer ? (tapez 'CONFIRMER' pour continuer): " confirmation
    
    if [[ "$confirmation" != "CONFIRMER" ]]; then
        log_error "Opération annulée par l'utilisateur"
        exit 1
    fi
fi

echo ""
log_step "1. Arrêt de tous les conteneurs..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" down

log_success "Conteneurs arrêtés"

echo ""
log_step "2. Suppression du volume de données PostgreSQL..."
# Trouver et supprimer le volume PostgreSQL
POSTGRES_VOLUME=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" config --volumes | grep postgres || echo "postgres_data")

docker volume rm "${PROJECT_DIR##*/}_${POSTGRES_VOLUME}" 2>/dev/null || \
docker volume rm "${POSTGRES_VOLUME}" 2>/dev/null || \
docker volume rm "supchat_postgres_data" 2>/dev/null || \
log_warning "Volume PostgreSQL introuvable ou déjà supprimé"

log_success "Volume PostgreSQL supprimé"

echo ""
log_step "3. Suppression des conteneurs et images PostgreSQL..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" rm -f postgres
docker rmi postgres:16-alpine 2>/dev/null || true

log_success "Conteneurs et images PostgreSQL supprimés"

echo ""
log_step "4. Vérification du fichier d'initialisation..."
if [[ -f "./backend/db/init-docker.sql" ]]; then
    log_info "✓ Fichier init-docker.sql trouvé ($(wc -l < ./backend/db/init-docker.sql) lignes)"
else
    log_error "❌ Fichier init-docker.sql introuvable !"
    exit 1
fi

echo ""
log_step "5. Reconstruction du conteneur PostgreSQL..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d postgres

echo ""
log_step "6. Attente de l'initialisation..."
RETRY_COUNT=0
MAX_RETRIES=30

while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
    if $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec postgres pg_isready -U postgres &>/dev/null; then
        log_success "PostgreSQL est prêt !"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [[ $RETRY_COUNT -eq $MAX_RETRIES ]]; then
    log_error "Timeout : PostgreSQL n'est pas prêt"
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" logs postgres
    exit 1
fi

echo ""
log_step "7. Vérification de l'initialisation..."
sleep 5

TABLES_COUNT=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d supchat -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n' || echo "0")

if [[ "$TABLES_COUNT" -gt "0" ]]; then
    log_success "✓ $TABLES_COUNT tables créées avec succès"
else
    log_warning "⚠️  Aucune table détectée"
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" logs postgres | tail -20
fi

echo ""
log_step "8. Redémarrage des services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d

echo ""
log_success "🎉 RECONSTRUCTION TERMINÉE !"
echo ""
echo -e "${YELLOW}📊 Résumé :${NC}"
echo "• Base de données complètement reconstruite"
echo "• $TABLES_COUNT tables créées"
if [[ "$CREATE_BACKUP" == "true" ]]; then
    echo "• Sauvegarde créée dans $BACKUP_DIR"
fi
echo ""
echo -e "${YELLOW}🔧 Commandes utiles :${NC}"
echo "• Sauvegarde seule : $0 --backup-only"
echo "• Restaurer : $0 --restore <fichier.sql.gz>"
echo "• Force (sans confirmation) : $0 -f"
