@echo off
REM =====================================================
REM SCRIPT DE NETTOYAGE COMPLET ET REDEMARRAGE
REM Corrige l'erreur PostgreSQL transaction_timeout
REM =====================================================

echo.
echo 🧹 Nettoyage complet et redemarrage de SUPCHAT
echo Correction de l'erreur PostgreSQL
echo.

REM Verifier que nous sommes dans le bon repertoire
if not exist "docker-compose.yml" (
    echo ❌ Erreur: docker-compose.yml non trouve.
    pause
    exit /b 1
)

echo 📍 Repertoire de travail: %CD%
echo.

REM Etape 1: Arreter tous les conteneurs
echo 🛑 Arret de tous les conteneurs...
docker-compose down --remove-orphans -v
if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors de l'arret des conteneurs
    pause
    exit /b 1
)

REM Etape 2: Supprimer les volumes PostgreSQL contamines
echo 🗑️ Suppression des volumes PostgreSQL contamines...
for /f "tokens=*" %%i in ('docker volume ls -q ^| findstr supchat') do (
    echo    Suppression du volume: %%i
    docker volume rm %%i >nul 2>&1
)

REM Etape 3: Nettoyer les conteneurs arretes et images non utilisees
echo 🧹 Nettoyage des ressources Docker...
docker container prune -f >nul 2>&1
docker image prune -f >nul 2>&1

REM Etape 4: Verifier que le fichier init-docker.sql est corrige
echo ✅ Verification du fichier init-docker.sql corrige...
findstr /C:"transaction_timeout" "backend\db\init-docker.sql" >nul
if %ERRORLEVEL% equ 0 (
    echo ❌ Le fichier contient encore transaction_timeout - erreur de correction
    pause
    exit /b 1
)
echo    ✅ Fichier SQL corrige

REM Etape 5: Reconstruire et demarrer
echo 🔨 Reconstruction complete et demarrage...
docker-compose up --build -d
if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors de la reconstruction
    pause
    exit /b 1
)

REM Etape 6: Attendre que PostgreSQL soit pret
echo ⏳ Attente de PostgreSQL...
set /a attempts=0
set /a maxAttempts=30

:wait_postgres
set /a attempts+=1
timeout /t 3 /nobreak >nul
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    ✅ PostgreSQL est pret !
    goto postgres_ready
)
echo    Tentative %attempts%/%maxAttempts%...
if %attempts% lss %maxAttempts% goto wait_postgres

echo ❌ Timeout: PostgreSQL n'est pas devenu disponible
echo 📋 Affichage des logs PostgreSQL pour diagnostic:
docker-compose logs postgres
pause
exit /b 1

:postgres_ready

REM Etape 7: Verifier l'absence d'erreurs dans les logs PostgreSQL
echo 🔍 Verification des logs PostgreSQL...
docker-compose logs postgres | findstr /C:"ERROR" >temp_errors.txt 2>nul
for %%A in (temp_errors.txt) do if %%~zA gtr 0 (
    echo ❌ Des erreurs sont detectees dans PostgreSQL:
    type temp_errors.txt
    del temp_errors.txt >nul 2>&1
    pause
    exit /b 1
)
del temp_errors.txt >nul 2>&1
echo    ✅ Aucune erreur detectee dans PostgreSQL

REM Etape 8: Verifier la base de donnees
echo 🔍 Verification de la base de donnees...
docker-compose exec -T postgres psql -U postgres -d supchat -c "SELECT version();" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    ✅ Base de donnees accessible
) else (
    echo    ❌ Probleme d'acces a la base de donnees
)

REM Etape 9: Afficher l'etat final
echo.
echo 📊 Etat des conteneurs:
docker-compose ps

echo.
echo 🎉 Redemarrage termine avec succes !
echo.
echo 🌐 URLs de l'application:
echo    Frontend: http://192.168.1.169:3000
echo    Backend:  http://192.168.1.169:5000
echo    PgAdmin:  http://192.168.1.169:8080
echo.

REM Proposer d'afficher les logs
echo 📋 Voulez-vous afficher les logs pour verification ? (O/N)
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
echo ✨ Correction terminee. L'application devrait maintenant fonctionner !
pause
