@echo off
REM =====================================================
REM SCRIPT D'ARRET SUPCHAT
REM Arrete tous les conteneurs proprement
REM =====================================================

echo.
echo 🛑 Arret de SUPCHAT
echo.

REM Verifier que nous sommes dans le bon repertoire
if not exist "docker-compose.yml" (
    echo ❌ Erreur: docker-compose.yml non trouve.
    echo Veuillez executer ce script depuis le repertoire racine du projet.
    pause
    exit /b 1
)

echo 📍 Repertoire de travail: %CD%
echo.

REM Arreter les conteneurs
echo 🛑 Arret des conteneurs...
docker-compose down --remove-orphans
if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors de l'arret des conteneurs
    pause
    exit /b 1
)

echo.
echo ✅ Tous les conteneurs ont ete arretes !
echo.

REM Afficher les conteneurs restants
echo 📊 Verification - conteneurs Docker actifs:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ✨ Arret termine.
pause
