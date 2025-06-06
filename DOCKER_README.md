# SUPCHAT - Déploiement Docker

Cette documentation explique comment déployer SUPCHAT avec Docker et Docker Compose de manière sécurisée.

## 🚀 Déploiement Rapide

### Prérequis

- Docker et Docker Compose installés
- PowerShell (Windows) ou Bash (Linux/macOS)

### 1. Configuration des Secrets

Créez les fichiers de secrets dans le dossier `secrets/` :

```bash
# Secrets de base de données
echo "supchat_user" > secrets/db_user.txt
echo "votre_mot_de_passe_fort" > secrets/db_password.txt

# Secret JWT
echo "votre_secret_jwt_tres_long_et_aleatoire" > secrets/jwt_secret.txt

# OAuth Google
echo "votre_google_client_id" > secrets/google_client_id.txt
echo "votre_google_client_secret" > secrets/google_client_secret.txt

# OAuth GitHub
echo "votre_github_client_id" > secrets/github_client_id.txt
echo "votre_github_client_secret" > secrets/github_client_secret.txt

# Scaleway S3
echo "votre_scw_access_key" > secrets/scw_access_key.txt
echo "votre_scw_secret_key" > secrets/scw_secret_key.txt

# Email
echo "votre_email@domaine.com" > secrets/email_user.txt
echo "votre_mot_de_passe_email" > secrets/email_password.txt

# APIs externes
echo "votre_api_key_strawpoll" > secrets/strawpoll_api_key.txt
echo "votre_api_key_mistral" > secrets/mistral_api_key.txt

# Redis et pgAdmin
echo "redis_password_fort" > secrets/redis_password.txt
echo "pgadmin_password_fort" > secrets/pgadmin_password.txt
```

### 2. Configuration de l'environnement

Copiez et modifiez le fichier d'environnement :

```bash
cp .env.example .env
```

Éditez `.env` avec vos valeurs spécifiques.

### 3. Déploiement

#### Windows (PowerShell)

```powershell
.\deploy.ps1
```

#### Linux/macOS (Bash)

```bash
chmod +x deploy.sh
./deploy.sh
```

## 📋 Services Déployés

| Service    | Port | URL                   | Description       |
| ---------- | ---- | --------------------- | ----------------- |
| Frontend   | 80   | http://localhost      | Interface React   |
| Backend    | 3000 | http://localhost:3000 | API Node.js       |
| PostgreSQL | 5432 | -                     | Base de données   |
| Redis      | 6379 | -                     | Cache et sessions |
| pgAdmin    | 8080 | http://localhost:8080 | Interface DB      |

## 🔧 Commandes Utiles

### Gestion des conteneurs

```bash
# Voir les logs
docker-compose -f docker-compose.secure.yml logs -f

# Redémarrer un service
docker-compose -f docker-compose.secure.yml restart backend

# Arrêter tous les services
docker-compose -f docker-compose.secure.yml down

# Reconstruire les images
docker-compose -f docker-compose.secure.yml build --no-cache
```

### Tests de santé

```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost/

# Base de données
docker-compose -f docker-compose.secure.yml exec postgres pg_isready
```

## 🔒 Sécurité

### Docker Secrets

Les secrets sensibles sont gérés via Docker Secrets :

- Montés dans `/run/secrets/` dans les conteneurs
- Non visibles dans les logs ou variables d'environnement
- Chiffrés au repos et en transit

### Réseau

- Réseau Docker isolé `supchat-network`
- Ports internes non exposés sauf nécessaire
- Communication inter-services sécurisée

### Volumes

- Données PostgreSQL persistantes
- Logs centralisés
- Uploads stockés sur S3 (Scaleway)

## 🐛 Dépannage

### Problème de connexion base de données

```bash
# Vérifier les logs PostgreSQL
docker-compose -f docker-compose.secure.yml logs postgres

# Tester la connexion
docker-compose -f docker-compose.secure.yml exec backend node -e "
const pool = require('./config/dbConnection.js').default;
pool.query('SELECT 1').then(() => console.log('DB OK')).catch(console.error);
"
```

### Problème de secrets

```bash
# Vérifier que tous les secrets existent
ls -la secrets/

# Tester la lecture des secrets
docker-compose -f docker-compose.secure.yml exec backend node -e "
const { getSecret } = require('./config/secrets.js');
console.log('JWT Secret exists:', !!getSecret('jwt_secret'));
"
```

### Réinitialisation complète

```bash
# Arrêter et supprimer tout
docker-compose -f docker-compose.secure.yml down -v --remove-orphans

# Supprimer les images
docker rmi $(docker images -q supchat*)

# Nettoyer le système
docker system prune -af

# Redéployer
./deploy.ps1  # ou ./deploy.sh
```

## 📊 Monitoring

### Health Checks

Les services incluent des health checks automatiques :

- Backend : `GET /health`
- Base de données : `pg_isready`
- Redis : `redis-cli ping`

### Logs

```bash
# Logs en temps réel
docker-compose -f docker-compose.secure.yml logs -f

# Logs d'un service spécifique
docker-compose -f docker-compose.secure.yml logs -f backend

# Logs avec timestamp
docker-compose -f docker-compose.secure.yml logs -f -t
```

## 🚀 Production

Pour un déploiement en production :

1. **SSL/TLS** : Configurez un reverse proxy (nginx/Traefik) avec HTTPS
2. **Sauvegarde** : Programmez des sauvegardes PostgreSQL automatiques
3. **Monitoring** : Ajoutez Prometheus/Grafana pour le monitoring
4. **Logs** : Centralisez avec ELK Stack ou équivalent
5. **Secrets** : Utilisez un gestionnaire de secrets (HashiCorp Vault)

### Exemple nginx pour production

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs : `docker-compose logs -f`
2. Consultez cette documentation
3. Vérifiez que tous les secrets sont configurés
4. Testez les endpoints de santé

---

**SUPCHAT** - Plateforme de communication collaborative sécurisée
