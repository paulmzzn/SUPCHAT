# =====================================================
# SCRIPT DE MISE A JOUR BASE DE DONNEES DOCKER
# Met a jour la base PostgreSQL Docker depuis le dump Azure
# =====================================================

Write-Host "🚀 Mise a jour de la base de donnees Docker SUPCHAT" -ForegroundColor Green
Write-Host "Base sur le dump Azure du 10 juin 2025" -ForegroundColor Yellow
Write-Host ""

# Verifier que nous sommes dans le bon repertoire
$currentPath = Get-Location
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Erreur: docker-compose.yml non trouve. Veuillez executer ce script depuis le repertoire racine du projet." -ForegroundColor Red
    exit 1
}

Write-Host "📍 Repertoire de travail: $currentPath" -ForegroundColor Cyan

try {
    # Etape 1: Arreter tous les conteneurs
    Write-Host "🛑 Arret des conteneurs Docker..." -ForegroundColor Yellow
    docker-compose down --remove-orphans
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur lors de l'arret des conteneurs"
    }

    # Etape 2: Supprimer les volumes de donnees (pour une reinitialisation complete)
    Write-Host "🗑️  Suppression des volumes PostgreSQL..." -ForegroundColor Yellow
    docker volume ls --format "table {{.Name}}" | Where-Object { $_ -match "postgres" -or $_ -match "supchat" } | ForEach-Object {
        Write-Host "   Suppression du volume: $_" -ForegroundColor Gray
        docker volume rm $_ 2>$null
    }

    # Etape 3: Supprimer les images pour forcer la reconstruction
    Write-Host "📦 Suppression des images pour forcer la reconstruction..." -ForegroundColor Yellow
    docker images --format "table {{.Repository}}:{{.Tag}}" | Where-Object { $_ -match "supchat" -or $_ -match "postgres" } | ForEach-Object {
        Write-Host "   Suppression de l'image: $_" -ForegroundColor Gray
        docker rmi $_ 2>$null
    }

    # Etape 4: Verifier que le fichier init-docker.sql est correct
    Write-Host "✅ Verification du fichier init-docker.sql..." -ForegroundColor Yellow
    $initFile = "backend/db/init-docker.sql"
    if (-not (Test-Path $initFile)) {
        throw "Fichier $initFile non trouve"
    }
    
    $fileSize = (Get-Item $initFile).Length
    Write-Host "   Taille du fichier: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor Gray
    
    # Verifier que le fichier contient les bonnes donnees
    $content = Get-Content $initFile -Raw
    if ($content -match "1, 'owner'" -and $content -match "2, 'admin'" -and $content -match "3, 'member'") {
        Write-Host "   ✅ Roles detectes: owner, admin, member" -ForegroundColor Green
    } else {
        throw "Les roles corrects ne sont pas detectes dans le fichier init-docker.sql"
    }

    # Etape 5: Construire et demarrer les conteneurs
    Write-Host "🔨 Construction et demarrage des conteneurs..." -ForegroundColor Yellow
    docker-compose up --build -d
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur lors de la construction des conteneurs"
    }

    # Etape 6: Attendre que PostgreSQL soit pret
    Write-Host "⏳ Attente de la disponibilite de PostgreSQL..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempts = 0
    
    do {
        $attempts++
        Start-Sleep -Seconds 2
        $pgReady = docker-compose exec -T postgres pg_isready -U postgres 2>$null
        if ($pgReady -match "accepting connections") {
            Write-Host "   ✅ PostgreSQL est pret !" -ForegroundColor Green
            break
        }
        Write-Host "   Tentative $attempts/$maxAttempts..." -ForegroundColor Gray
    } while ($attempts -lt $maxAttempts)

    if ($attempts -eq $maxAttempts) {
        throw "Timeout: PostgreSQL n'est pas devenu disponible"
    }

    # Etape 7: Verifier que la base de donnees est correctement initialisee
    Write-Host "🔍 Verification de la base de donnees..." -ForegroundColor Yellow
    
    # Verifier les roles
    $roleCheck = docker-compose exec -T postgres psql -U postgres -d supchat -c "SELECT id_role, nom_role FROM role ORDER BY id_role;" 2>$null
    if ($roleCheck -match "owner" -and $roleCheck -match "admin" -and $roleCheck -match "member") {
        Write-Host "   ✅ Roles correctement configures" -ForegroundColor Green
    } else {
        Write-Warning "Les roles ne semblent pas correctement configures"
    }

    # Verifier les tables principales
    $tableCheck = docker-compose exec -T postgres psql -U postgres -d supchat -c "\dt" 2>$null
    if ($tableCheck -match "workspace" -and $tableCheck -match "utilisateur" -and $tableCheck -match "canal") {
        Write-Host "   ✅ Tables principales detectees" -ForegroundColor Green
    } else {
        Write-Warning "Certaines tables principales semblent manquer"
    }

    # Etape 8: Afficher l'etat des conteneurs
    Write-Host "📊 Etat des conteneurs:" -ForegroundColor Yellow
    docker-compose ps

    # Message de succes
    Write-Host ""
    Write-Host "🎉 Mise a jour terminee avec succes !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Resume des changements:" -ForegroundColor Cyan
    Write-Host "   • Base de donnees mise a jour depuis le dump Azure" -ForegroundColor White
    Write-Host "   • Roles corriges: 1=owner, 2=admin, 3=member" -ForegroundColor White
    Write-Host "   • Schema et donnees synchronises" -ForegroundColor White
    Write-Host "   • Type canal_access_type corrige" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Votre application devrait maintenant fonctionner correctement !" -ForegroundColor Green
    Write-Host "   • Les workspaces devraient afficher leurs images" -ForegroundColor White
    Write-Host "   • Les createurs de workspace devraient avoir le role 'owner'" -ForegroundColor White
    Write-Host "   • La creation de canaux devrait fonctionner" -ForegroundColor White

} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de la mise a jour:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Pour diagnostiquer:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs postgres" -ForegroundColor Gray
    Write-Host "   docker-compose logs backend" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "✨ Script termine. Bon developpement !" -ForegroundColor Magenta