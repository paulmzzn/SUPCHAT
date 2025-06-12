# 🚀 Guide de Déploiement VPS SUPCHAT

## 📋 Vue d'ensemble

Ce guide vous permettra de déployer votre application SUPCHAT sur un VPS de manière sécurisée et optimisée.

## 🎯 Prérequis

### Serveur VPS
- **OS**: Ubuntu 20.04 LTS ou plus récent
- **RAM**: 4GB minimum (recommandé pour la production)
- **CPU**: 2 cœurs minimum
- **Stockage**: 20GB minimum
- **Accès**: SSH avec privilèges sudo

### Domaine
- Nom de domaine configuré
- Enregistrements DNS pointant vers votre VPS

## 🛠️ Installation Rapide

### 1. Préparation du serveur

```bash
# Connexion au VPS
ssh votre-utilisateur@votre-ip

# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des outils de base
sudo apt install -y curl wget git unzip
```

### 2. Téléchargement du projet

```bash
# Cloner ou télécharger votre projet
git clone your-repo-url supchat
cd supchat

# Ou si vous uploadez les fichiers manuellement
scp -r ./SUPCHAT votre-utilisateur@votre-ip:~/supchat
```

### 3. Configuration des secrets

```bash
# Copier le fichier d'exemple
cp deploy.env.example .env

# Éditer la configuration
nano .env

# Vérifier que tous les fichiers secrets existent dans ./secrets/
ls -la secrets/
```

### 4. Déploiement automatique

```bash
# Rendre le script exécutable
chmod +x deploy-vps.sh

# Lancer le déploiement complet
./deploy-vps.sh
```

### 5. Configuration post-déploiement (optionnel)

```bash
# Pour SSL et optimisations avancées
chmod +x post-deploy.sh
./post-deploy.sh
```

## 📂 Structure des Scripts

### `deploy-vps.sh`
Script principal de déploiement avec menu interactif :
- ✅ Installation automatique de Docker
- ✅ Configuration du pare-feu
- ✅ Déploiement des conteneurs
- ✅ Configuration du monitoring
- ✅ Mise en place des sauvegardes

### `post-deploy.sh`
Script d'optimisation post-déploiement :
- 🔒 Configuration SSL avec Let's Encrypt
- ⚡ Optimisations système
- 📊 Monitoring avancé
- 🛡️ Durcissement de la sécurité

### `deploy.env.example`
Fichier de configuration des variables d'environnement.

## 🔧 Configuration Avancée

### Variables d'environnement importantes

```bash
# Dans .env
VPS_DOMAIN=votre-domaine.com
ADMIN_EMAIL=admin@votre-domaine.com
PROJECT_DIR=/opt/supchat
ENABLE_SSL=true
```

### Ports utilisés

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80/443 | Interface web |
| Backend API | 3000 | API REST |
| PostgreSQL | 5432 | Base de données (interne) |
| PgAdmin | 8080 | Administration DB |

## 📊 Monitoring et Maintenance

### Scripts de monitoring

```bash
# Vérification rapide du statut
/opt/supchat/monitor.sh

# Monitoring détaillé
/opt/supchat/advanced-monitor.sh

# Logs en temps réel
docker-compose -f /opt/supchat/docker-compose.vps.yml logs -f
```

### Sauvegardes

```bash
# Sauvegarde manuelle
/opt/supchat/backup.sh

# Les sauvegardes automatiques sont programmées quotidiennement à 2h
# Localisation : /opt/supchat/backups/
```

### Commandes Docker utiles

```bash
cd /opt/supchat

# Redémarrer tous les services
docker-compose -f docker-compose.vps.yml restart

# Reconstruire et redémarrer
docker-compose -f docker-compose.vps.yml down
docker-compose -f docker-compose.vps.yml up -d --build

# Voir les logs
docker-compose -f docker-compose.vps.yml logs -f [service_name]

# Exécuter des commandes dans un conteneur
docker exec -it supchat-backend-vps bash
docker exec -it supchat-postgres-vps psql -U [user] -d supchat
```

## 🔒 Sécurité

### Pare-feu automatique
Le script configure automatiquement UFW avec les règles suivantes :
- ✅ SSH (port 22)
- ✅ HTTP (port 80)
- ✅ HTTPS (port 443)
- ✅ API Backend (port 3000)

### SSL/TLS
Le script `post-deploy.sh` configure automatiquement :
- 📜 Certificats Let's Encrypt
- 🔄 Renouvellement automatique
- 🔒 Configuration Nginx sécurisée

### Bonnes pratiques appliquées
- 🚫 PostgreSQL non exposé publiquement
- 🔐 Secrets Docker pour les données sensibles
- 🛡️ Headers de sécurité HTTP
- 🚨 Fail2ban pour protection contre les attaques
- 🔑 Désactivation de la connexion root SSH

## 🐛 Dépannage

### Problèmes courants

#### Conteneurs qui ne démarrent pas
```bash
# Vérifier les logs
docker-compose logs

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h
```

#### Problèmes de connectivité
```bash
# Vérifier les ports ouverts
netstat -tlnp

# Vérifier le pare-feu
sudo ufw status

# Tester la connectivité
curl -I http://192.168.71.234:3000/health
```

#### Base de données
```bash
# Se connecter à PostgreSQL
docker exec -it supchat-postgres-vps psql -U $(cat secrets/db_user.txt) -d supchat

# Vérifier les connexions
docker exec supchat-postgres-vps pg_isready
```

### Logs importants

```bash
# Logs de l'application
tail -f /opt/supchat/logs/*.log

# Logs système
journalctl -u docker -f

# Logs Nginx (si SSL configuré)
tail -f /var/log/nginx/supchat_error.log
```

## 📞 Support

### Fichiers de configuration
- `docker-compose.vps.yml` : Configuration Docker pour VPS
- `nginx.vps.conf` : Configuration Nginx pour VPS
- `secrets/` : Dossier contenant tous les secrets

### Commandes de diagnostic
```bash
# État complet du système
./deploy-vps.sh  # Option 6 : Afficher le statut

# Test de santé des services
curl http://192.168.71.234:3000/health
curl http://192.168.71.234/
```

## 🔄 Mise à jour

### Mise à jour de l'application
```bash
cd /opt/supchat

# Arrêter les services
docker-compose -f docker-compose.vps.yml down

# Récupérer les dernières modifications
git pull origin main  # ou votre méthode de mise à jour

# Reconstruire et redémarrer
docker-compose -f docker-compose.vps.yml up -d --build
```

### Mise à jour des secrets
```bash
# Modifier les fichiers dans secrets/
nano secrets/[nom_du_secret].txt

# Redémarrer les services concernés
docker-compose -f docker-compose.vps.yml restart
```

---

## 🎉 Félicitations !

Votre application SUPCHAT est maintenant déployée et sécurisée sur votre VPS !

**Accès à votre application :**
- 🌐 Frontend : `http://votre-domaine.com`
- 🔧 API : `http://votre-domaine.com:3000`
- 📊 PgAdmin : `http://votre-domaine.com:8080`

N'oubliez pas de :
- ✅ Configurer votre DNS
- ✅ Activer SSL avec le script post-deploy
- ✅ Surveiller les logs régulièrement
- ✅ Tester les sauvegardes
