@echo off
REM =====================================================
REM SCRIPT DE DEMARRAGE RAPIDE SUPCHAT
REM Demarre les conteneurs existants
REM =====================================================

echo.
echo 🚀 Demarrage rapide de SUPCHAT
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

REM Demarrer les conteneurs
echo 🚀 Demarrage des conteneurs...
docker-compose up -d
if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors du demarrage des conteneurs
    pause
    exit /b 1
)

REM Attendre un peu pour que tout demarre
echo ⏳ Attente du demarrage...
timeout /t 3 /nobreak >nul

REM Afficher l'etat des conteneurs
echo 📊 Etat des conteneurs:
docker-compose ps

echo.
echo ✅ SUPCHAT est maintenant en cours d'execution !
echo.
echo 🌐 URLs de l'application:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    PgAdmin:  http://localhost:8080
echo.

REM Proposer d'afficher les logs
echo 📋 Voulez-vous afficher les logs ? (O/N)
set /p choice=
if /i "%choice%"=="O" (
    echo.
    echo 📋 Affichage des logs (Ctrl+C pour arreter)...
    docker-compose logs -f
) else if /i "%choice%"=="Y" (
    echo.
    echo 📋 Affichage des logs (Ctrl+C pour arreter)...
    docker-compose logs -f
)

echo.
echo ✨ Script termine. Bon developpement !
pause
