@echo off
echo 🛑 Arrêt des conteneurs en cours...
docker-compose down

echo 🔨 Reconstruction des images...
docker-compose build backend
if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors de la reconstruction du backend
    pause
    exit /b 1
)

echo 🚀 Démarrage des conteneurs...
docker-compose up -d
if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors du démarrage des conteneurs
    pause
    exit /b 1
)

echo ⏳ Attente du démarrage...
timeout /t 5 /nobreak >nul

echo 📊 État des conteneurs:
docker-compose ps

echo.
echo 📋 Affichage des logs du backend...
docker-compose logs -f backend
