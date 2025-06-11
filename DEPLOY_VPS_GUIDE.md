# =====================================

# GUIDE DE DÉPLOIEMENT VPS SUPCHAT

# =====================================

## 📋 Prérequis

### Serveur VPS

- Ubuntu 20.04 LTS ou plus récent (recommandé)
- 2 CPU, 4GB RAM minimum (4GB+ RAM recommandé pour la production)
- 20GB d'espace disque minimum
- Accès root ou sudo
- Connexion Internet stable

### Domaine et DNS

- Nom de domaine pointant vers l'IP du VPS
- Enregistrements DNS configurés (A record)

## 🚀 Instructions de Déploiement

### 1. Préparation du VPS

```bash
# Connexion au VPS
ssh root@votre-ip-vps

# Mise à jour du système
apt update && apt upgrade -y

# Installation des dépendances de base
apt install -y curl wget git unzip htop

# Configuration du firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable

# Création d'un utilisateur dédié (optionnel mais recommandé)
adduser supchat
usermod -aG sudo supchat
su - supchat
```

### 2. Transfert du Projet

```bash
# Clone du projet (ou upload via SCP/SFTP)
git clone https://github.com/votre-repo/SUPCHAT.git
cd SUPCHAT

# Ou si vous uploadez les fichiers:
# scp -r ./SUPCHAT user@vps-ip:/home/user/
```

### 3. Configuration des Secrets

```bash
# Édition des fichiers secrets
cd secrets/

# Secrets obligatoires à configurer:
echo "supchat_user" > db_user.txt
echo "VotreMotDePasseSecurise123!" > db_password.txt
echo "VotreCleJWTSecurise256bits!" > jwt_secret.txt

# Configuration S3/Scaleway
echo "YOUR_SCW_ACCESS_KEY" > scw_access_key.txt
echo "YOUR_SCW_SECRET_KEY" > scw_secret_key.txt
echo "https://s3.fr-par.scw.cloud" > scw_endpoint.txt
echo "fr-par" > scw_region.txt
echo "votre-bucket-name" > s3_bucket_name.txt

# Configuration email
echo "votre-email@domain.com" > email_user.txt
echo "votre-mot-de-passe-email" > email_password.txt

# Configuration OAuth (optionnel)
echo "GOOGLE_CLIENT_ID" > google_client_id.txt
echo "GOOGLE_CLIENT_SECRET" > google_client_secret.txt
echo "GITHUB_CLIENT_ID" > github_client_id.txt
echo "GITHUB_CLIENT_SECRET" > github_client_secret.txt

# APIs externes (optionnel)
echo "STRAWPOLL_API_KEY" > strawpoll_api_key.txt
echo "MISTRAL_API_KEY" > mistral_api_key.txt
```

### 4. Déploiement

```bash
# Rendre le script exécutable
chmod +x deploy-vps.sh

# Lancer le déploiement
./deploy-vps.sh votre-domaine.com ip-du-vps

# Exemple:
./deploy-vps.sh supchat.mondomaine.fr 192.168.1.100
```

### 5. Configuration Post-Déploiement

#### A. Vérification des Services

```bash
# Vérifier l'état des conteneurs
docker-compose -f docker-compose.vps.yml ps

# Vérifier les logs
docker-compose -f docker-compose.vps.yml logs -f

# Test de santé
curl http://votre-domaine.com:3000/health
```

#### B. Configuration SSL avec Let's Encrypt

```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-nginx

# Génération du certificat
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique
sudo crontab -e
# Ajouter: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### C. Configuration Backup Automatique

```bash
# Script de sauvegarde
cat > backup-supchat.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/supchat/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
docker-compose -f docker-compose.vps.yml exec -T postgres pg_dump -U supchat_user supchat > $BACKUP_DIR/db_backup_$DATE.sql

# Sauvegarde des uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz backend/uploads/

# Sauvegarde des secrets
tar -czf $BACKUP_DIR/secrets_backup_$DATE.tar.gz secrets/

# Nettoyage (garder seulement 7 jours)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Sauvegarde terminée: $DATE"
EOF

chmod +x backup-supchat.sh

# Programmation quotidienne
crontab -e
# Ajouter: 0 2 * * * /home/supchat/SUPCHAT/backup-supchat.sh
```

## 🔧 Configuration Avancée

### Monitoring avec Portainer (optionnel)

```bash
# Installation de Portainer
docker volume create portainer_data
docker run -d -p 9000:9000 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce

# Accès: http://votre-domaine.com:9000
```

### Reverse Proxy Nginx (si plusieurs services)

```bash
# Installation Nginx système
sudo apt install nginx

# Configuration du virtual host
sudo nano /etc/nginx/sites-available/supchat

# Contenu:
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Activation
sudo ln -s /etc/nginx/sites-available/supchat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🐛 Dépannage

### Problèmes Courants

1. **Conteneurs qui ne démarrent pas** :

   ```bash
   docker-compose -f docker-compose.vps.yml logs
   docker system prune -a
   ```

2. **Problèmes de connexion base de données** :

   ```bash
   # Vérifier les secrets
   docker-compose -f docker-compose.vps.yml exec backend cat /run/secrets/db_user

   # Accès direct à PostgreSQL
   docker-compose -f docker-compose.vps.yml exec postgres psql -U supchat_user -d supchat
   ```

3. **Problèmes de performance** :

   ```bash
   # Monitoring des ressources
   htop
   docker stats

   # Optimisation mémoire
   echo 'vm.swappiness=10' >> /etc/sysctl.conf
   sysctl -p
   ```

4. **Problèmes réseau** :

   ```bash
   # Vérifier les ports
   netstat -tulpn | grep -E "(80|443|3000)"

   # Vérifier le firewall
   ufw status
   ```

## 📊 Surveillance

### Logs à surveiller

```bash
# Logs application
docker-compose -f docker-compose.vps.yml logs -f backend

# Logs système
tail -f /var/log/nginx/error.log
journalctl -u docker -f

# Monitoring ressources
watch 'docker stats --no-stream'
```

### Métriques importantes

- CPU/RAM des conteneurs
- Espace disque
- Temps de réponse API
- Erreurs 5xx dans Nginx
- Connexions base de données

## 🔒 Sécurité Production

1. **Changement des mots de passe par défaut**
2. **Configuration fail2ban** pour SSH
3. **Mise à jour régulière** des images Docker
4. **Surveillance des logs** d'accès
5. **Backup chiffré** des données sensibles

---

🎉 **Votre application SUPCHAT est maintenant prête pour la production !**
