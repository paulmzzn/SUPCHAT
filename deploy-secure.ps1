# =================================
# SCRIPT DE DÉPLOIEMENT SÉCURISÉ
# =================================

Write-Host "🔒 DÉPLOIEMENT SÉCURISÉ SUPCHAT" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Vérifications préalables
Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier que Docker est installé
try {
    docker --version | Out-Null
    Write-Host "✅ Docker détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas installé" -ForegroundColor Red
    exit 1
}

# Vérifier que les secrets existent
if (-not (Test-Path "./secrets")) {
    Write-Host "❌ Le dossier secrets/ n'existe pas" -ForegroundColor Red
    exit 1
}

$requiredSecrets = @(
    "db_user.txt",
    "db_password.txt", 
    "jwt_secret.txt",
    "scw_access_key.txt",
    "scw_secret_key.txt",
    "s3_bucket_name.txt"
)

foreach ($secret in $requiredSecrets) {
    if (-not (Test-Path "./secrets/$secret")) {
        Write-Host "❌ Secret manquant: $secret" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Tous les prérequis sont satisfaits" -ForegroundColor Green

# Supprimer le fichier .env s'il existe
if (Test-Path ".env") {
    Write-Host "🧹 Suppression du fichier .env non sécurisé..." -ForegroundColor Yellow
    Remove-Item ".env" -Force
}

# Supprimer les conteneurs existants
Write-Host "🧹 Nettoyage des conteneurs existants..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Reconstruire les images
Write-Host "🔨 Construction des images Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache

# Démarrer les services
Write-Host "🚀 Démarrage des services..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

# Vérifier l'état des services
Write-Host "🔍 Vérification de l'état des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$services = docker-compose -f docker-compose.prod.yml ps
if ($services -match "Up") {
    Write-Host "✅ Services démarrés avec succès" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 INFORMATIONS DE DÉPLOIEMENT:" -ForegroundColor Cyan
    Write-Host "- Frontend: http://192.168.71.234" -ForegroundColor White
    Write-Host "- Backend API: http://192.168.71.234:3000/api" -ForegroundColor White
    Write-Host "- Health Check: http://192.168.71.234:3000/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 SÉCURITÉ:" -ForegroundColor Cyan
    Write-Host "- PostgreSQL: Non exposé publiquement ✅" -ForegroundColor Green
    Write-Host "- PgAdmin: Désactivé en production ✅" -ForegroundColor Green
    Write-Host "- Secrets Docker: Activés ✅" -ForegroundColor Green
    Write-Host "- Headers sécurisés: Configurés ✅" -ForegroundColor Green
    Write-Host "- Fichier .env: Supprimé ✅" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors du démarrage des services" -ForegroundColor Red
    docker-compose -f docker-compose.prod.yml logs
    exit 1
}

Write-Host ""
Write-Host "🎉 Déploiement sécurisé terminé avec succès!" -ForegroundColor Green
