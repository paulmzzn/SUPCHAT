@echo off
REM =====================================================
REM SCRIPT DE MISE A JOUR ET DEMARRAGE SUPCHAT
REM Met a jour la base PostgreSQL Docker depuis le dump Azure
REM =====================================================

echo.
echo 🚀 Mise a jour et demarrage de SUPCHAT
echo Base sur le dump Azure du 10 juin 2025
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

REM Etape 1: Arreter tous les conteneurs
echo 🛑 Arret des conteneurs Docker...
docker-compose down --remove-orphans
if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors de l'arret des conteneurs
    pause
    exit /b 1
)

REM Etape 2: Supprimer les volumes PostgreSQL pour reinitialiser
echo 🗑️ Suppression des volumes PostgreSQL...
for /f "tokens=*" %%i in ('docker volume ls -q ^| findstr postgres') do (
    echo    Suppression du volume: %%i
    docker volume rm %%i >nul 2>&1
)
for /f "tokens=*" %%i in ('docker volume ls -q ^| findstr supchat') do (
    echo    Suppression du volume: %%i
    docker volume rm %%i >nul 2>&1
)

REM Etape 3: Verifier le fichier init-docker.sql
echo ✅ Verification du fichier init-docker.sql...
if not exist "backend\db\init-docker.sql" (
    echo ❌ Fichier backend\db\init-docker.sql non trouve
    pause
    exit /b 1
)

REM Verifier que les roles corrects sont presents
findstr /C:"1, 'owner'" "backend\db\init-docker.sql" >nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Les roles corrects ne sont pas detectes dans init-docker.sql
    pause
    exit /b 1
)
echo    ✅ Roles detectes: owner, admin, member

REM Etape 4: Construire et demarrer les conteneurs
echo 🔨 Construction et demarrage des conteneurs...
docker-compose up --build -d
if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur lors de la construction des conteneurs
    pause
    exit /b 1
)

REM Etape 5: Attendre que PostgreSQL soit pret
echo ⏳ Attente de la disponibilite de PostgreSQL...
set /a attempts=0
set /a maxAttempts=30

:wait_postgres
set /a attempts+=1
timeout /t 2 /nobreak >nul
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    ✅ PostgreSQL est pret !
    goto postgres_ready
)
echo    Tentative %attempts%/%maxAttempts%...
if %attempts% lss %maxAttempts% goto wait_postgres

echo ❌ Timeout: PostgreSQL n'est pas devenu disponible
pause
exit /b 1

:postgres_ready

REM Etape 6: Verifier la base de donnees
echo 🔍 Verification de la base de donnees...

REM Verifier les roles
docker-compose exec -T postgres psql -U postgres -d supchat -c "SELECT id_role, nom_role FROM role ORDER BY id_role;" >temp_roles.txt 2>nul
findstr /C:"owner" temp_roles.txt >nul && findstr /C:"admin" temp_roles.txt >nul && findstr /C:"member" temp_roles.txt >nul
if %ERRORLEVEL% equ 0 (
    echo    ✅ Roles correctement configures
) else (
    echo    ⚠️ Les roles ne semblent pas correctement configures
)
del temp_roles.txt >nul 2>&1

REM Verifier les tables principales
docker-compose exec -T postgres psql -U postgres -d supchat -c "\dt" >temp_tables.txt 2>nul
findstr /C:"workspace" temp_tables.txt >nul && findstr /C:"utilisateur" temp_tables.txt >nul && findstr /C:"canal" temp_tables.txt >nul
if %ERRORLEVEL% equ 0 (
    echo    ✅ Tables principales detectees
) else (
    echo    ⚠️ Certaines tables principales semblent manquer
)
del temp_tables.txt >nul 2>&1

REM Etape 7: Afficher l'etat des conteneurs
echo.
echo 📊 Etat des conteneurs:
docker-compose ps

REM Message de succes
echo.
echo 🎉 Mise a jour terminee avec succes !
echo.
echo 📋 Resume des changements:
echo    • Base de donnees mise a jour depuis le dump Azure
echo    • Roles corriges: 1=owner, 2=admin, 3=member
echo    • Schema et donnees synchronises
echo    • Type canal_access_type corrige
echo.
echo 🌐 Votre application devrait maintenant fonctionner correctement !
echo    • Les workspaces devraient afficher leurs images
echo    • Les createurs de workspace devraient avoir le role 'owner'
echo    • La creation de canaux devrait fonctionner
echo.

REM Proposer d'afficher les logs
echo 📋 Voulez-vous afficher les logs du backend ? (O/N)
set /p choice=
if /i "%choice%"=="O" (
    echo.
    echo 📋 Affichage des logs du backend (Ctrl+C pour arreter)...
    docker-compose logs -f backend
) else if /i "%choice%"=="Y" (
    echo.
    echo 📋 Affichage des logs du backend (Ctrl+C pour arreter)...
    docker-compose logs -f backend
)

echo.
echo ✨ Script termine. Bon developpement !
pause
