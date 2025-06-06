# Script de déploiement PowerShell pour SUPCHAT
# Ce script configure et lance l'environnement Docker complet

param(
    [switch]$CleanImages = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host "Usage: .\deploy.ps1 [-CleanImages] [-Help]"
    Write-Host "  -CleanImages: Nettoie les images Docker avant le déploiement"
    Write-Host "  -Help: Affiche cette aide"
    exit 0
}

Write-Host "🚀 Démarrage du déploiement Docker SUPCHAT..." -ForegroundColor Green

# Vérification des prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker et Docker Compose sont installés" -ForegroundColor Green

# Vérification des secrets
Write-Host "🔐 Vérification des secrets..." -ForegroundColor Yellow
$SecretsDir = ".\secrets"
$RequiredSecrets = @(
    "db_user.txt",
    "db_password.txt", 
    "jwt_secret.txt",
    "google_client_id.txt",
    "google_client_secret.txt",
    "github_client_id.txt",
    "github_client_secret.txt",
    "scw_access_key.txt",
    "scw_secret_key.txt",
    "email_user.txt",
    "email_password.txt",
    "strawpoll_api_key.txt",
    "mistral_api_key.txt",
    "redis_password.txt",
    "pgadmin_password.txt"
)

$MissingSecrets = @()
foreach ($secret in $RequiredSecrets) {
    $secretPath = Join-Path $SecretsDir $secret
    if (!(Test-Path $secretPath)) {
        $MissingSecrets += $secret
    }
}

if ($MissingSecrets.Count -gt 0) {
    Write-Host "❌ Secrets manquants:" -ForegroundColor Red
    foreach ($secret in $MissingSecrets) {
        Write-Host "   - $secret" -ForegroundColor Red
    }
    Write-Host "Veuillez créer ces fichiers dans le dossier secrets\ avec les valeurs appropriées" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tous les secrets sont présents" -ForegroundColor Green

# Vérification du fichier .env
if (!(Test-Path ".env")) {
    Write-Host "❌ Fichier .env manquant" -ForegroundColor Red
    Write-Host "Copiez .env.example vers .env et configurez les variables" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichier .env présent" -ForegroundColor Green

# Arrêt des conteneurs existants
Write-Host "🛑 Arrêt des conteneurs existants..." -ForegroundColor Yellow
docker-compose -f docker-compose.secure.yml down --remove-orphans

# Nettoyage des images anciennes (optionnel)
if ($CleanImages) {
    Write-Host "🧹 Nettoyage des images..." -ForegroundColor Yellow
    docker system prune -af
}

# Construction des images
Write-Host "🔨 Construction des images Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose.secure.yml build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la construction des images" -ForegroundColor Red
    exit 1
}

# Lancement des services
Write-Host "🚀 Lancement des services..." -ForegroundColor Yellow
docker-compose -f docker-compose.secure.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du lancement des services" -ForegroundColor Red
    exit 1
}

# Attente que les services démarrent
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Vérification du statut des services
Write-Host "📊 Vérification du statut des services..." -ForegroundColor Yellow
docker-compose -f docker-compose.secure.yml ps

# Tests de santé
Write-Host "🏥 Tests de santé des services..." -ForegroundColor Yellow

# Test backend
Write-Host "Testing backend health..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend: OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend: En cours de démarrage ou erreur" -ForegroundColor Yellow
}

# Test frontend  
Write-Host "Testing frontend health..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend: OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend: En cours de démarrage ou erreur" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Déploiement terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Accès aux services:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost" -ForegroundColor White
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "   pgAdmin: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "📋 Commandes utiles:" -ForegroundColor Cyan
Write-Host "   Voir les logs: docker-compose -f docker-compose.secure.yml logs -f" -ForegroundColor White
Write-Host "   Arrêter: docker-compose -f docker-compose.secure.yml down" -ForegroundColor White
Write-Host "   Redémarrer: docker-compose -f docker-compose.secure.yml restart" -ForegroundColor White
Write-Host ""
