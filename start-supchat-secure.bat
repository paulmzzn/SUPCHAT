@echo off
echo ===========================================
echo SUPCHAT - Démarrage sécurisé avec Docker
echo ===========================================
echo.

echo [1/6] Préparation de l'environnement...
mkdir -p ./backend/tmp/debug 2>nul
mkdir -p ./backend/tmp/secrets 2>nul

echo [2/6] Copie des secrets pour le débogage...
copy .\secrets\db_user.txt .\backend\tmp\secrets\db_user 2>nul
copy .\secrets\db_password.txt .\backend\tmp\secrets\db_password 2>nul
copy .\secrets\jwt_secret.txt .\backend\tmp\secrets\jwt_secret 2>nul

echo [3/6] Copie du correctif de secrets...
copy .\backend\config\secrets-fix.js .\backend\config\secrets.js
if %errorlevel% neq 0 (
  echo Erreur lors de la copie du correctif de secrets.
  echo Vérifiez que le fichier secrets-fix.js existe.
  exit /b 1
)

echo [4/6] Arrêt des conteneurs en cours d'exécution...
docker-compose down

echo [5/6] Démarrage des conteneurs avec les secrets...
docker-compose up --build -d

echo [6/6] Vérification de l'état des conteneurs...
timeout /t 5 /nobreak > nul
docker-compose ps

echo.
echo ===========================================
echo Pour tester l'accès aux secrets, exécutez:
echo docker-compose exec backend node test-docker-secrets.js
echo ===========================================

echo.
echo Pour voir les logs du backend:
echo docker-compose logs -f backend
echo ===========================================
