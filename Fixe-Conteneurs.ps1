# Script PowerShell pour nettoyer et réinitialiser l'environnement Docker

Write-Host "=== NETTOYAGE COMPLET DE L'ENVIRONNEMENT DOCKER ===" -ForegroundColor Yellow

# Arrêter tous les conteneurs
Write-Host "1. Arrêt de tous les conteneurs..." -ForegroundColor Cyan
docker stop $(docker ps -aq)

# Supprimer tous les conteneurs
Write-Host "2. Suppression de tous les conteneurs..." -ForegroundColor Cyan
docker rm $(docker ps -aq)

# Supprimer les volumes non utilisés
Write-Host "3. Suppression des volumes..." -ForegroundColor Cyan
docker volume prune -f

# Supprimer les réseaux non utilisés
Write-Host "4. Suppression des réseaux non utilisés..." -ForegroundColor Cyan
docker network prune -f

# Recréer le dossier secrets
Write-Host "5. Recréation des fichiers de secrets..." -ForegroundColor Cyan
$secretsPath = Join-Path -Path $PSScriptRoot -ChildPath "secrets"

if (-not (Test-Path $secretsPath)) {
    New-Item -Path $secretsPath -ItemType Directory -Force | Out-Null
}

# Recréer les fichiers de secrets
@{
    "db_user.txt" = "admin"
    "db_password.txt" = "SuperSecretPassword2024!"
    "jwt_secret.txt" = "super-secret-jwt-key-change-this-in-production-environment-2024"
    "redis_password.txt" = "RedisPassword2024!"
    "pgadmin_password.txt" = "AdminPassword2024!"
} | ForEach-Object {
    $filePath = Join-Path -Path $secretsPath -ChildPath $_.Key
    $_.Value | Out-File -FilePath $filePath -Encoding utf8 -NoNewline
    Write-Host "   Créé: $($_.Key)" -ForegroundColor Green
}

# Créer un docker-compose de test simple
Write-Host "6. Création d'un docker-compose de test simple..." -ForegroundColor Cyan
$testComposePath = Join-Path -Path $PSScriptRoot -ChildPath "docker-compose.simple.yml"

$testComposeContent = @"
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-simple
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=SuperSecretPassword2024!
      - POSTGRES_DB=supchat
    ports:
      - "5432:5432"
    volumes:
      - postgres_simple_data:/var/lib/postgresql/data
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_simple_data:
"@

$testComposeContent | Out-File -FilePath $testComposePath -Encoding utf8

# Lancer le conteneur PostgreSQL simple
Write-Host "7. Lancement du conteneur PostgreSQL simple..." -ForegroundColor Cyan
docker-compose -f $testComposePath up -d

# Attendre que PostgreSQL soit prêt
Write-Host "8. Attente que PostgreSQL soit prêt..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Tester la connexion
Write-Host "9. Test de connexion à PostgreSQL..." -ForegroundColor Cyan
docker exec postgres-simple pg_isready -U admin

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL est opérationnel et accessible!" -ForegroundColor Green
    
    # Tester une requête SQL
    Write-Host "10. Test d'une requête SQL..." -ForegroundColor Cyan
    docker exec postgres-simple psql -U admin -d supchat -c "SELECT version();"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Requête SQL exécutée avec succès!" -ForegroundColor Green
        Write-Host @"

=== RECOMMANDATIONS ===
1. Vous pouvez maintenant lancer votre application avec:
   docker-compose -f docker-compose.hybrid.yml up -d

2. Pour vérifier les journaux:
   docker logs supchat-backend

3. Pour tester la connexion depuis votre backend:
   docker exec -it supchat-backend node /app/simple-db-test.js

"@ -ForegroundColor Yellow
    } else {
        Write-Host "❌ Échec de l'exécution de la requête SQL" -ForegroundColor Red
    }
} else {
    Write-Host "❌ PostgreSQL n'est pas accessible" -ForegroundColor Red
}

Write-Host "=== FIN DU SCRIPT ===" -ForegroundColor Yellow
