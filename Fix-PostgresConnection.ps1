# Script PowerShell pour réparer le problème d'authentification PostgreSQL

function Write-ColorOutput {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$true)]
        [string]$Color
    )
    
    $originalColor = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $Color
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $originalColor
}

# Définir le chemin du projet
$projectPath = "c:\Users\gault\Documents\supinfo code\SUPCHAT"
$secretsPath = Join-Path -Path $projectPath -ChildPath "secrets"

Write-ColorOutput "=== RÉPARATION DE LA CONNEXION POSTGRESQL ===" "Yellow"

# 1. Vérifier les fichiers de secrets
Write-Output ""
Write-ColorOutput "1. Vérification des fichiers de secrets..." "Yellow"

$dbUserPath = Join-Path -Path $secretsPath -ChildPath "db_user.txt"
$dbPasswordPath = Join-Path -Path $secretsPath -ChildPath "db_password.txt"

if (Test-Path $dbUserPath) {
    $dbUser = Get-Content -Path $dbUserPath -Raw
    $dbUser = $dbUser.Trim()
    Write-ColorOutput "✅ Fichier db_user.txt trouvé: $dbUser" "Green"
} else {
    Write-ColorOutput "❌ Fichier db_user.txt introuvable" "Red"
}

if (Test-Path $dbPasswordPath) {
    $dbPassword = Get-Content -Path $dbPasswordPath -Raw
    $dbPassword = $dbPassword.Trim()
    $maskedPassword = $dbPassword.Substring(0, [Math]::Min(3, $dbPassword.Length)) + "..."
    Write-ColorOutput "✅ Fichier db_password.txt trouvé: $maskedPassword" "Green"
} else {
    Write-ColorOutput "❌ Fichier db_password.txt introuvable" "Red"
}

# 2. Recréer les fichiers de secrets avec le bon encodage
Write-Output ""
Write-ColorOutput "2. Recréation des fichiers de secrets avec le bon encodage..." "Yellow"

# Demander confirmation
$confirmation = Read-Host "Voulez-vous recréer les fichiers de secrets? (O/N)"
if ($confirmation -eq "O" -or $confirmation -eq "o") {
    # Vérifier/créer le répertoire secrets
    if (-not (Test-Path $secretsPath)) {
        New-Item -Path $secretsPath -ItemType Directory -Force | Out-Null
        Write-ColorOutput "✅ Répertoire secrets créé" "Green"
    }
    
    # Recréer db_user.txt
    "admin" | Out-File -FilePath $dbUserPath -Encoding utf8 -NoNewline
    Write-ColorOutput "✅ Fichier db_user.txt recréé" "Green"
    
    # Recréer db_password.txt
    "SuperSecretPassword2024!" | Out-File -FilePath $dbPasswordPath -Encoding utf8 -NoNewline
    Write-ColorOutput "✅ Fichier db_password.txt recréé" "Green"
} else {
    Write-ColorOutput "⏭️ Étape ignorée" "Yellow"
}

# 3. Mettre à jour le fichier .env
Write-Output ""
Write-ColorOutput "3. Vérification du fichier .env..." "Yellow"

$envPath = Join-Path -Path $projectPath -ChildPath ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content -Path $envPath -Raw
    
    # Vérifier les valeurs PostgreSQL
    if ($envContent -match "POSTGRES_USER=admin" -and $envContent -match "POSTGRES_PASSWORD=SuperSecretPassword2024!") {
        Write-ColorOutput "✅ Fichier .env contient les bonnes informations d'identification" "Green"
    } else {
        Write-ColorOutput "⚠️ Fichier .env pourrait contenir des informations d'identification incorrectes" "Yellow"
        
        # Demander confirmation pour mettre à jour
        $confirmation = Read-Host "Voulez-vous mettre à jour le fichier .env? (O/N)"
        if ($confirmation -eq "O" -or $confirmation -eq "o") {
            $envContent = $envContent -replace "POSTGRES_USER=.*", "POSTGRES_USER=admin"
            $envContent = $envContent -replace "POSTGRES_PASSWORD=.*", "POSTGRES_PASSWORD=SuperSecretPassword2024!"
            $envContent | Out-File -FilePath $envPath -Encoding utf8
            Write-ColorOutput "✅ Fichier .env mis à jour" "Green"
        } else {
            Write-ColorOutput "⏭️ Étape ignorée" "Yellow"
        }
    }
} else {
    Write-ColorOutput "❌ Fichier .env introuvable" "Red"
}

# 4. Créer un fichier docker-compose spécial pour tester
Write-Output ""
Write-ColorOutput "4. Création d'un fichier docker-compose simplifié pour test..." "Yellow"

$testComposeContent = @"
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: supchat-postgres-test
    environment:
      POSTGRES_DB: supchat
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: SuperSecretPassword2024!
    ports:
      - "5432:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    networks:
      - supchat-test-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.backend
    container_name: supchat-backend-test
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=supchat
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=SuperSecretPassword2024!
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    networks:
      - supchat-test-network

networks:
  supchat-test-network:
    driver: bridge

volumes:
  postgres_test_data:
    driver: local
"@

$testComposePath = Join-Path -Path $projectPath -ChildPath "docker-compose.test.yml"
$testComposeContent | Out-File -FilePath $testComposePath -Encoding utf8

Write-ColorOutput "✅ Fichier docker-compose.test.yml créé" "Green"
Write-ColorOutput "Pour tester avec cette configuration simplifiée, exécutez:" "Yellow"
Write-ColorOutput "cd '$projectPath' && docker-compose -f docker-compose.test.yml up -d" "Cyan"

# 5. Instructions finales
Write-Output ""
Write-ColorOutput "=== INSTRUCTIONS FINALES ===" "Yellow"
Write-Output ""
Write-ColorOutput "1. Arrêtez tous les conteneurs en cours d'exécution:" "White"
Write-ColorOutput "   docker-compose -f docker-compose.secure.yml down" "Cyan"
Write-Output ""
Write-ColorOutput "2. Supprimez les volumes pour repartir de zéro (facultatif):" "White"
Write-ColorOutput "   docker volume rm supchat_postgres_data supchat_pgadmin_data supchat_redis_data" "Cyan"
Write-Output ""
Write-ColorOutput "3. Redémarrez les conteneurs:" "White"
Write-ColorOutput "   docker-compose -f docker-compose.secure.yml up -d" "Cyan"
Write-Output ""
Write-ColorOutput "4. Vérifiez les logs des conteneurs:" "White"
Write-ColorOutput "   docker logs supchat-backend" "Cyan"
Write-ColorOutput "   docker logs supchat-postgres" "Cyan"
Write-Output ""
Write-ColorOutput "5. Pour exécuter le script de test:" "White"
Write-ColorOutput "   .\Test-DockerConnection.ps1" "Cyan"
Write-Output ""

Write-ColorOutput "=== FIN DU SCRIPT DE RÉPARATION ===" "Yellow"
