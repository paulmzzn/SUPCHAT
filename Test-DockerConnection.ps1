# Script PowerShell pour tester la connexion à la base de données PostgreSQL dans Docker
# Ce script doit être exécuté après le démarrage des conteneurs Docker

# Fonction pour afficher des messages colorés
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

Write-ColorOutput "=== TEST DE CONFIGURATION DOCKER COMPOSE ===" "Yellow"

# Vérifier que les conteneurs sont en cours d'exécution
Write-Output ""
Write-ColorOutput "Vérification des conteneurs en cours d'exécution..." "Yellow"
$postgresRunning = docker ps --filter "name=supchat-postgres" --format "{{.Names}}"
$backendRunning = docker ps --filter "name=supchat-backend" --format "{{.Names}}"

if ([string]::IsNullOrEmpty($postgresRunning)) {
    Write-ColorOutput "❌ Le conteneur PostgreSQL n'est pas en cours d'exécution" "Red"
} else {
    Write-ColorOutput "✅ Le conteneur PostgreSQL est en cours d'exécution" "Green"
}

if ([string]::IsNullOrEmpty($backendRunning)) {
    Write-ColorOutput "❌ Le conteneur Backend n'est pas en cours d'exécution" "Red"
} else {
    Write-ColorOutput "✅ Le conteneur Backend est en cours d'exécution" "Green"
}

# Vérifier les logs de PostgreSQL pour détecter les erreurs
Write-Output ""
Write-ColorOutput "Recherche d'erreurs dans les logs PostgreSQL..." "Yellow"
$postgresErrors = docker logs supchat-postgres 2>&1 | Select-String -Pattern "error" | Measure-Object | Select-Object -ExpandProperty Count
if ($postgresErrors -gt 0) {
    Write-ColorOutput "⚠️ $postgresErrors erreurs trouvées dans les logs PostgreSQL" "Red"
    docker logs supchat-postgres 2>&1 | Select-String -Pattern "error" | Select-Object -First 5
} else {
    Write-ColorOutput "✅ Aucune erreur trouvée dans les logs PostgreSQL" "Green"
}

# Vérifier les logs du Backend pour détecter les erreurs de connexion à la base de données
Write-Output ""
Write-ColorOutput "Recherche d'erreurs de connexion dans les logs Backend..." "Yellow"
$dbConnectionErrors = docker logs supchat-backend 2>&1 | Select-String -Pattern "connexion à PostgreSQL" | Select-String -Pattern "erreur" | Measure-Object | Select-Object -ExpandProperty Count
if ($dbConnectionErrors -gt 0) {
    Write-ColorOutput "⚠️ Erreurs de connexion à la base de données détectées" "Red"
    docker logs supchat-backend 2>&1 | Select-String -Pattern "connexion à PostgreSQL" | Select-String -Pattern "erreur"
} else {
    Write-ColorOutput "✅ Pas d'erreurs de connexion à la base de données détectées" "Green"
}

# Exécuter le script de test de connexion à la base de données dans le conteneur backend
Write-Output ""
Write-ColorOutput "Création d'un script de test temporaire pour le conteneur..." "Yellow"
$testScriptContent = @"
#!/bin/sh
echo "=== TEST DE CONNEXION POSTGRESQL ==="
echo "Vérification de l'accès aux secrets..."

# Vérifier l'existence du dossier /run/secrets
if [ -d "/run/secrets" ]; then
  echo "✅ Dossier /run/secrets trouvé"
  
  # Lister les secrets disponibles
  echo "Liste des secrets disponibles:"
  ls -la /run/secrets/
  
  # Vérifier db_user
  if [ -f "/run/secrets/db_user" ]; then
    DB_USER=\$(cat /run/secrets/db_user)
    echo "✅ Secret db_user trouvé: \${DB_USER}"
  else
    echo "❌ Secret db_user INTROUVABLE"
  fi
  
  # Vérifier db_password (ne pas afficher le mot de passe complet)
  if [ -f "/run/secrets/db_password" ]; then
    DB_PASS=\$(cat /run/secrets/db_password)
    echo "✅ Secret db_password trouvé: \${DB_PASS:0:3}..."
  else
    echo "❌ Secret db_password INTROUVABLE"
  fi
else
  echo "❌ Dossier /run/secrets INTROUVABLE"
fi

echo "=== VARIABLES D'ENVIRONNEMENT ==="
echo "DB_HOST: \$DB_HOST"
echo "DB_PORT: \$DB_PORT"
echo "POSTGRES_DB: \$POSTGRES_DB"
echo "POSTGRES_USER: \$POSTGRES_USER"
echo "POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:0:3}..."

echo "=== TEST DE CONNEXION AVEC PING ==="
# Tester la connectivité réseau avec ping
echo "Tentative de ping vers postgres:5432..."
ping -c 3 postgres

echo "=== FIN DES TESTS ==="
"@

# Créer le script dans le conteneur
$testScriptContent | docker exec -i supchat-backend sh -c "cat > /app/temp-test.sh && chmod +x /app/temp-test.sh"

# Exécuter le script dans le conteneur
Write-ColorOutput "Exécution du script de test dans le conteneur backend..." "Yellow"
docker exec -it supchat-backend sh -c "/app/temp-test.sh"

# Vérifier la configuration réseau
Write-Output ""
Write-ColorOutput "Vérification de la configuration réseau..." "Yellow"
Write-Output "Liste des réseaux Docker:"
docker network ls | Select-String -Pattern "supchat"

Write-Output ""
Write-Output "Inspection du réseau supchat-network:"
docker network inspect supchat-network

Write-ColorOutput "=== TEST DE CONNECTION DIRECTE DEPUIS LE BACKEND ===" "Yellow"
Write-Output ""
Write-ColorOutput "Exécution du script check-db-connection.js..." "Yellow"
docker exec -it supchat-backend sh -c "cd /app && node check-db-connection.js"

Write-ColorOutput "=== FIN DES TESTS ===" "Yellow"
