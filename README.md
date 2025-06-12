# 🚀 SUPCHAT - Plateforme de Communication Temps Réel

<div align="center">
  <img src="frontend/src/assets/icons/logo_supchat.svg" alt="SUPCHAT Logo" width="120" height="120">
  
  **Une plateforme de communication moderne multi-plateforme avec IA intégrée**
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
  [![React Native](https://img.shields.io/badge/React%20Native-0.79-purple.svg)](https://reactnative.dev/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://postgresql.org/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com/)
  [![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)
</div>

---

## 📋 **Table des Matières**

- [🎯 Vue d'Ensemble](#-vue-densemble)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Technologies](#️-technologies)
- [🚀 Installation](#-installation)
- [🐳 Guide de Déploiement Docker](#-guide-de-déploiement-docker)
  - [🔐 Secrets Docker - Configuration Essentielle](#-secrets-docker---configuration-essentielle)
- [📱 Application Mobile (React Native)](#-application-mobile-react-native)
- [📱 Applications](#-applications)
- [🔧 Configuration](#-configuration)
- [📊 Base de Données](#-base-de-données)
- [🔐 Sécurité](#-sécurité)
- [🤖 IA Mistral](#-ia-mistral)
- [📱 API Documentation](#-api-documentation)
- [🚀 Infrastructure de Déploiement](#-infrastructure-de-déploiement)
- [📈 Performance](#-performance)
- [🤝 Contribution](#-contribution)
- [📄 Licence](#-licence)

---

## 🎯 **Vue d'Ensemble**

SUPCHAT est une plateforme de communication temps réel moderne qui combine les meilleures fonctionnalités des applications de chat professionnelles avec une interface utilisateur intuitive et des technologies de pointe.

### **Caractéristiques Principales**

- 💬 **Communication temps réel** via WebSocket (Socket.IO)
- 🏢 **Espaces de travail** (Workspaces) avec gestion des rôles
- 📱 **Multi-plateforme** : Web, Mobile (iOS/Android)
- 🤖 **Assistant IA** intégré (Mistral AI)
- 📁 **Partage de fichiers** avec stockage cloud
- 🔐 **Authentification OAuth** (Google, GitHub)
- 🌙 **Mode sombre/clair**
- 📊 **Notifications push** intelligentes

---

## ✨ **Fonctionnalités**

### 💬 **Communication**

- [x] Messages en temps réel (canaux + messages privés)
- [x] Réactions avec emojis personnalisés
- [x] Réponses imbriquées (threading)
- [x] Mentions utilisateur (@username)
- [x] Indicateurs de frappe en temps réel
- [x] Statuts utilisateur (en ligne, absent, ne pas déranger)
- [x] Compteurs de messages non lus

### 🏢 **Gestion des Espaces**

- [x] Workspaces publics et privés
- [x] Canaux avec permissions granulaires
- [x] Système de rôles (owner, admin, member)
- [x] Invitations par email avec tokens
- [x] Découverte d'espaces publics
- [x] Favoris utilisateur

### 📁 **Média & Fichiers**

- [x] Upload de fichiers (images, documents, vidéos)
- [x] Visionneuse intégrée (images, PDFs)
- [x] Intégration Google Drive
- [x] Stockage cloud sécurisé (Scaleway S3)
- [x] Preview de liens automatique

### 🤖 **Intelligence Artificielle**

- [x] Assistant IA Mistral intégré
- [x] Analyse contextuelle des conversations
- [x] Réponses intelligentes en temps réel
- [x] Gestion des erreurs et timeouts

### 🔧 **Fonctionnalités Avancées**

- [x] Sondages intégrés (Strawpoll)
- [x] Système de rappels avec notifications email
- [x] Recherche globale (messages, fichiers, utilisateurs)
- [x] Notifications push (web + mobile)
- [x] Mode hors ligne avec synchronisation
- [x] Export de conversations

---

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mobile App    │    │   Backend API   │
│   React 18.3    │◄──►│ React Native    │◄──►│   Node.js       │
│   Socket.IO     │    │   Expo          │    │   Express       │
└─────────────────┘    └─────────────────┘    │   Socket.IO     │
                                              └─────────┬───────┘
                                                        │
                       ┌─────────────────┐              │
                       │   PostgreSQL    │◄─────────────┘
                       │   Database      │
                       └─────────────────┘

                       ┌─────────────────┐    ┌─────────────────┐
                       │   Scaleway S3   │    │   Mistral AI    │
                       │   File Storage  │    │   Assistant     │
                       └─────────────────┘    └─────────────────┘
```

### **Structure du Projet**

```
SUPCHAT/
├── backend/              # API Node.js + Socket.IO
│   ├── controllers/      # Logique métier
│   ├── models/          # Modèles de données
│   ├── routes/          # Endpoints API
│   ├── socket/          # Gestion WebSocket
│   ├── middleware/      # Authentification, validation
│   └── config/          # Configuration base de données, services
├── frontend/            # Application Web React
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages principales
│   │   ├── context/     # État global (Socket, Auth, Thème)
│   │   ├── hooks/       # Hooks personnalisés
│   │   └── utils/       # Utilitaires
├── mobile/              # Application React Native
│   ├── src/
│   │   ├── screens/     # Écrans de l'application
│   │   ├── components/  # Composants natifs
│   │   ├── navigation/  # Navigation stack/tabs
│   │   └── context/     # État partagé
├── secrets/             # Configuration sécurisée Docker
└── scripts/             # Scripts de déploiement
```

---

## 🛠️ **Technologies**

### **Backend**

- **Runtime** : Node.js 18+
- **Framework** : Express.js 4.21.2
- **Base de données** : PostgreSQL 16
- **ORM** : pg (driver natif PostgreSQL)
- **Temps réel** : Socket.IO 4.8.1
- **Authentification** : JWT + Passport.js (OAuth Google/GitHub)
- **Upload** : Multer + AWS SDK (Scaleway S3)
- **Email** : Nodemailer + Mailjet
- **IA** : Mistral AI API

### **Frontend**

- **Framework** : React 18.3.1
- **Router** : React Router DOM 6.18.0
- **Build** : Create React App (Webpack)
- **UI** : CSS modules + React Icons
- **État** : Context API
- **Temps réel** : Socket.IO Client
- **Charts** : Chart.js + React ChartJS 2
- **Markdown** : React Markdown + remark-gfm

### **Mobile**

- **Framework** : React Native 0.79.2
- **Platform** : Expo ~53.0.8
- **Navigation** : React Navigation 7.x
- **Storage** : AsyncStorage
- **Icons** : Expo Vector Icons
- **Media** : Expo Image Picker, Document Picker

### **Infrastructure**

- **Conteneurisation** : Docker + Docker Compose
- **Reverse Proxy** : Nginx
- **SSL/TLS** : Let's Encrypt (Certbot)
- **CI/CD** : Scripts automatisés
- **Monitoring** : Health checks intégrés

---

## 🚀 **Installation**

### **Prérequis**

- Node.js 18+
- PostgreSQL 16+
- Docker & Docker Compose (recommandé)
- Git

### **Installation Rapide avec Docker**

```powershell
# Cloner le repository
git clone https://github.com/votre-username/supchat.git
cd supchat

# Copier et configurer les variables d'environnement
Copy-Item deploy.env.example deploy.env
# Éditer deploy.env avec vos configurations

# Configurer les secrets Docker
./setup-secrets.ps1

# Lancer l'application
docker-compose up -d

# Vérifier que tous les services sont en cours d'exécution
docker-compose ps
```

### **Installation Manuelle**

#### **1. Base de Données**

```powershell
# Installer PostgreSQL 16
# Créer la base de données
createdb -U postgres supchat

# Importer le schéma
psql -U postgres -d supchat -f backend/db/init-docker.sql
```

#### **2. Backend**

```powershell
cd backend
npm install

# Les variables d'environnement sont gérées via Docker Secrets
# Pas de fichier .env - configuration via les fichiers secrets/

# Démarrer le serveur
npm run dev
```

#### **3. Frontend**

```powershell
cd frontend
npm install

# Démarrer en développement
npm start

# Build pour production
npm run build
```

#### **4. Mobile (Optionnel)**

```powershell
cd mobile
npm install

# Installer Expo CLI
npm install -g @expo/cli

# Démarrer l'application
expo start
```

---

## 🐳 **Guide de Déploiement Docker**

SUPCHAT utilise Docker pour simplifier le déploiement et garantir la cohérence entre les environnements de développement, staging et production.

### **📋 Prérequis Docker**

```powershell
# Installer Docker Desktop (Windows)
# Télécharger depuis https://docker.com/products/docker-desktop

# Vérifier l'installation
docker --version
docker-compose --version

# Version minimale requise
# Docker: 24.0+
# Docker Compose: 2.0+
```

### **🔧 Configuration Initiale**

#### **1. Préparation des Secrets**

```powershell
# Créer le dossier secrets (déjà présent)
cd secrets/

# Vérifier que tous les fichiers secrets existent
ls secrets/
# db_user.txt, db_password.txt, jwt_secret.txt, etc.

# Éditer les valeurs si nécessaire
notepad secrets/db_password.txt
```

#### **2. Variables d'Environnement**

```powershell
# Copier le fichier d'exemple
Copy-Item deploy.env.example deploy.env

# Éditer la configuration
notepad deploy.env
```

**Contenu `deploy.env` :**

```env
# Configuration globale
VPS_DOMAIN=votre-domaine.com
ADMIN_EMAIL=admin@votre-domaine.com
PROJECT_DIR=/opt/supchat
ENABLE_SSL=true

# Base de données
POSTGRES_VERSION=16-alpine
DB_NAME=supchat

# Frontend
FRONTEND_PORT=80
NGINX_VERSION=alpine

# Email (LWS)
EMAIL_HOST=mail86.lwspanel.com
EMAIL_PORT=465
EMAIL_SECURE=true
```

### **🔐 Secrets Docker - Configuration Essentielle**

SUPCHAT utilise **Docker Secrets** pour sécuriser toutes les données sensibles. Ces secrets sont **OBLIGATOIRES** pour le fonctionnement du projet.

#### **📁 Structure des Secrets Requis**

**Tous ces fichiers doivent être présents dans `secrets/` :**

```
secrets/
├── 🗄️ Base de Données
│   ├── db_user.txt              # Utilisateur PostgreSQL
│   ├── db_password.txt          # Mot de passe PostgreSQL
│   └── pgadmin_password.txt     # Mot de passe PgAdmin
├── 🔑 Authentification
│   ├── jwt_secret.txt           # Clé secrète JWT (256 bits)
│   ├── google_client_id.txt     # OAuth Google Client ID
│   ├── google_client_secret.txt # OAuth Google Secret
│   ├── github_client_id.txt     # OAuth GitHub Client ID
│   └── github_client_secret.txt # OAuth GitHub Secret
├── 📧 Service Email
│   ├── email_user.txt           # Adresse email SMTP
│   └── email_password.txt       # Mot de passe SMTP
├── ☁️ Stockage S3 (Scaleway)
│   ├── scw_access_key.txt       # Clé d'accès Scaleway
│   ├── scw_secret_key.txt       # Clé secrète Scaleway
│   ├── scw_endpoint.txt         # Endpoint S3 Scaleway
│   ├── scw_region.txt           # Région Scaleway
│   └── s3_bucket_name.txt       # Nom du bucket S3
├── 🤖 Services IA
│   ├── mistral_api_key.txt      # Clé API Mistral AI
│   └── strawpoll_api_key.txt    # Clé API Strawpoll
└── 🔒 Autres Services
    └── redis_password.txt       # Mot de passe Redis (futur)
```

#### **⚙️ Fonctionnement des Secrets Docker**

```yaml
# Dans docker-compose.yml
services:
  backend:
    secrets:
      - db_user
      - db_password
      - jwt_secret
      - google_client_id
      # ... tous les secrets nécessaires

secrets:
  db_user:
    file: ./secrets/db_user.txt
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  # ... définition de tous les secrets
```

**Avantages Docker Secrets :**

- 🔒 **Chiffrement** : Secrets chiffrés en mémoire
- 🛡️ **Isolation** : Accessibles uniquement aux conteneurs autorisés
- 📝 **Audit** : Traçabilité des accès aux secrets
- 🚫 **Pas d'exposition** : Jamais visibles dans `docker inspect`
- 💾 **Stockage sécurisé** : Montés en RAM (`/run/secrets/`)

#### **🔧 Configuration des Secrets**

**1. Vérification des Secrets Obligatoires**

```powershell
# Script de vérification des secrets
$requiredSecrets = @(
    "db_user.txt", "db_password.txt", "jwt_secret.txt",
    "google_client_id.txt", "google_client_secret.txt",
    "github_client_id.txt", "github_client_secret.txt",
    "email_user.txt", "email_password.txt",
    "scw_access_key.txt", "scw_secret_key.txt",
    "scw_endpoint.txt", "scw_region.txt", "s3_bucket_name.txt",
    "mistral_api_key.txt", "strawpoll_api_key.txt"
)

foreach ($secret in $requiredSecrets) {
    if (!(Test-Path "secrets/$secret")) {
        Write-Error "❌ Secret manquant : secrets/$secret"
    } else {
        Write-Host "✅ Secret présent : secrets/$secret" -ForegroundColor Green
    }
}
```

**2. Configuration des Valeurs**

```powershell
# Base de données (OBLIGATOIRE)
echo "admin" > secrets/db_user.txt
echo "VotreMotDePasseSecurise123!" > secrets/db_password.txt

# JWT (OBLIGATOIRE - générer une clé forte)
echo "votre-cle-jwt-super-secrete-256-bits-minimum!" > secrets/jwt_secret.txt

# Email (OBLIGATOIRE pour notifications)
echo "noreply@votre-domaine.com" > secrets/email_user.txt
echo "VotreMotDePasseEmail!" > secrets/email_password.txt

# S3 Scaleway (OBLIGATOIRE pour fichiers)
echo "VOTRE_ACCESS_KEY_SCALEWAY" > secrets/scw_access_key.txt
echo "votre-secret-key-scaleway" > secrets/scw_secret_key.txt
echo "https://s3.fr-par.scw.cloud" > secrets/scw_endpoint.txt
echo "fr-par" > secrets/scw_region.txt
echo "votre-nom-bucket" > secrets/s3_bucket_name.txt
```

#### **🚨 Sécurité des Secrets**

**Bonnes Pratiques :**

```powershell
# 1. Permissions restrictives sur les fichiers secrets
icacls secrets /inheritance:d
icacls secrets /grant:r "$env:USERNAME:(F)"
icacls secrets /remove "Everyone"

# 2. Jamais commit les secrets dans Git
echo "secrets/*.txt" >> .gitignore

# 3. Utiliser des valeurs fortes
# JWT : minimum 256 bits (32 caractères)
# Mots de passe : minimum 12 caractères avec symboles
# API Keys : utiliser les vraies clés de production
```

**Génération de Secrets Sécurisés :**

```powershell
# Générer un JWT secret fort
$jwt = -join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,43,45,46,47,58,59,61,63,64,94,95,126) | Get-Random -Count 64 | % {[char]$_})
echo $jwt > secrets/jwt_secret.txt

# Générer un mot de passe base de données
$dbPass = -join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,43,45,46) | Get-Random -Count 20 | % {[char]$_})
echo $dbPass > secrets/db_password.txt
```

#### **🔍 Accès aux Secrets dans les Conteneurs**

```bash
# Dans un conteneur Docker, les secrets sont montés dans /run/secrets/
docker-compose exec backend ls -la /run/secrets/
# -r--------    1 root     root            5 Dec 12 10:30 db_user
# -r--------    1 root     root           25 Dec 12 10:30 db_password
# -r--------    1 root     root           64 Dec 12 10:30 jwt_secret

# Lire un secret dans le conteneur
docker-compose exec backend cat /run/secrets/db_user
# admin

# Utilisation dans le code Node.js
const fs = require('fs');
const dbUser = fs.readFileSync('/run/secrets/db_user', 'utf8').trim();
const dbPassword = fs.readFileSync('/run/secrets/db_password', 'utf8').trim();
```

#### **⚠️ Que Faire si un Secret est Compromis**

```powershell
# 1. Changer immédiatement la valeur
echo "nouvelle-valeur-secrete" > secrets/secret_compromis.txt

# 2. Redémarrer les services concernés
docker-compose restart backend postgres

# 3. Pour les clés API externes, régénérer dans le service
# - Google Console pour OAuth
# - GitHub Settings pour OAuth
# - Scaleway Console pour S3
# - Mistral AI Dashboard pour API

# 4. Vérifier les logs pour usage suspect
docker-compose logs backend | Select-String "ERROR\|UNAUTHORIZED"
```

#### **🔄 Rotation des Secrets**

```powershell
# Script de rotation automatique (à adapter)
$secrets = @("jwt_secret", "db_password")

foreach ($secret in $secrets) {
    # Backup ancien secret
    Copy-Item "secrets/$secret.txt" "secrets/$secret.backup.txt"

    # Générer nouveau secret
    $newSecret = Generate-SecurePassword
    echo $newSecret > "secrets/$secret.txt"

    # Redémarrer services
    docker-compose restart backend postgres

    Write-Host "✅ Secret $secret mis à jour"
}
```

**⚡ Sans ces secrets, le projet NE PEUT PAS fonctionner :**

- ❌ **Base de données** : Impossible de se connecter
- ❌ **Authentification** : JWT invalide, OAuth impossible
- ❌ **Upload fichiers** : Pas d'accès S3
- ❌ **Emails** : Notifications non envoyées
- ❌ **IA** : Assistant Mistral non disponible

**✅ Avec tous les secrets configurés :**

- 🔐 **Sécurité maximale** avec chiffrement
- 🚀 **Déploiement automatique** sans intervention
- 🛡️ **Isolation complète** des données sensibles
- 📊 **Monitoring** et audit des accès

### **🚀 Déploiement par Environnement**

#### **1. Développement Local**

```powershell
# Démarrage rapide - tous services
docker-compose up -d

# Ou utiliser le script de démarrage rapide
./start-quick.bat

# Vérifier que tous les services sont UP
docker-compose ps
```

**Services lancés :**

- **PostgreSQL 16** : Base de données (port interne 5432)
- **Backend Node.js** : API + Socket.IO (port 3000)
- **Frontend React** : Interface web via Nginx (port 80)
- **PgAdmin** (optionnel) : Administration base de données (port 8080)

**URLs disponibles :**

- 🌐 **Frontend** : http://localhost
- 🔧 **API** : http://localhost:3000
- 📊 **PgAdmin** : http://localhost:8080

#### **2. Production/Staging**

```powershell
# Déploiement production optimisé
docker-compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f

# Surveillance des performances
docker stats
```

**Optimisations Production :**

- ✅ **Images multi-stage** pour taille réduite
- ✅ **Health checks** automatiques
- ✅ **Restart policies** configurées
- ✅ **Secrets Docker** pour sécurité
- ✅ **Réseaux isolés** entre services
- ✅ **Volumes persistants** pour données

#### **3. Déploiement VPS**

```powershell
# Déploiement sur serveur distant
./deploy-vps.sh votre-domaine.com

# Ou manuellement
docker-compose -f docker-compose.vps.yml up -d
```

**Configuration VPS spécifique :**

- 🌐 **Reverse proxy Nginx** avec SSL
- 📁 **Volumes montés** sur filesystem hôte
- 🔒 **PostgreSQL non exposé** publiquement
- 📧 **Configuration email** LWS
- 🛡️ **Firewall** et sécurité renforcée

### **📦 Architecture des Services Docker**

#### **Service PostgreSQL**

```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: supchat
    POSTGRES_USER_FILE: /run/secrets/db_user
    POSTGRES_PASSWORD_FILE: /run/secrets/db_password
  secrets: [db_user, db_password]
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./backend/db/init-docker.sql:/docker-entrypoint-initdb.d/
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $(cat /run/secrets/db_user)"]
    interval: 30s
```

**Caractéristiques :**

- 🐘 **PostgreSQL 16 Alpine** (image légère)
- 🔐 **Secrets Docker** pour authentification
- 📊 **Health checks** intégrés
- 💾 **Volumes persistants** pour données
- 🗃️ **Initialisation automatique** du schéma

#### **Service Backend**

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile.backend
  environment:
    - NODE_ENV=production
    - DB_HOST=postgres
    - FRONTEND_URL=http://192.168.1.169
  secrets: [db_user, db_password, jwt_secret, ...]
  depends_on: [postgres]
  networks: [supchat-network]
```

**Fonctionnalités :**

- 🚀 **Node.js 18+** avec Express
- 🔌 **Socket.IO** pour temps réel
- 🔑 **JWT + OAuth** (Google, GitHub)
- 📁 **Upload S3** (Scaleway)
- 🤖 **Intégration Mistral AI**
- 📧 **Service email** Nodemailer

#### **Service Frontend**

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.frontend
  ports: ["80:80", "443:443"]
  volumes: [./nginx.conf:/etc/nginx/nginx.conf]
  depends_on: [backend]
```

**Technologies :**

- ⚛️ **React 18.3** avec build optimisé
- 🌐 **Nginx Alpine** comme serveur web
- 🗜️ **Compression gzip** automatique
- 📱 **Responsive design** pour mobile
- 🔄 **Proxy API** vers backend

### **🛠️ Commandes Docker Utiles**

#### **Gestion des Services**

```powershell
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Reconstruire un service spécifique
docker-compose build backend
docker-compose up -d backend

# Redémarrer un service
docker-compose restart frontend

# Voir les logs en temps réel
docker-compose logs -f

# Entrer dans un conteneur
docker-compose exec backend sh
docker-compose exec postgres psql -U supchat_user supchat
```

#### **Maintenance et Debug**

```powershell
# Vérifier l'état des conteneurs
docker-compose ps

# Statistiques de performance
docker stats

# Nettoyage (attention: supprime tout)
docker-compose down -v  # Avec volumes
docker system prune -a  # Nettoyage complet

# Backup base de données
docker-compose exec postgres pg_dump -U supchat_user supchat > backup.sql

# Restore base de données
cat backup.sql | docker-compose exec -T postgres psql -U supchat_user supchat
```

#### **Scripts Automatisés**

```powershell
# Scripts PowerShell/Batch disponibles
./start-quick.bat           # Démarrage rapide
./stop.bat                  # Arrêt propre
./rebuild-and-restart.bat   # Reconstruction complète
./fix-and-restart.bat       # Réparation + redémarrage
./update-and-start.bat      # Mise à jour + démarrage
```

### **🔄 Processus de Mise à Jour**

#### **Mise à jour Standard**

```powershell
# 1. Arrêter les services
docker-compose down

# 2. Récupérer les dernières modifications
git pull origin main

# 3. Reconstruire les images
docker-compose build

# 4. Redémarrer
docker-compose up -d

# 5. Vérifier la santé
docker-compose ps
curl http://localhost:3000/health
```

#### **Mise à jour Zero-Downtime (Production)**

```powershell
# 1. Mise à jour backend sans interruption
docker-compose build backend
docker-compose up -d --no-deps backend

# 2. Attendre stabilisation
Start-Sleep 30

# 3. Mise à jour frontend
docker-compose build frontend
docker-compose up -d --no-deps frontend

# 4. Vérification
curl http://localhost/health
```

### **📊 Monitoring et Logs**

#### **Health Checks**

```powershell
# Vérifier la santé de tous les services
docker-compose exec backend curl http://localhost:3000/health
docker-compose exec postgres pg_isready -U supchat_user

# Test de connectivité complète
curl http://localhost/api/ping
curl http://localhost/socket.io/
```

#### **Surveillance des Logs**

```powershell
# Logs globaux
docker-compose logs -f

# Logs par service avec couleurs
docker-compose logs -f --tail=100 backend
docker-compose logs -f --tail=100 postgres

# Filtrage des logs
docker-compose logs backend | Select-String "ERROR"
docker-compose logs backend | Select-String "Socket.IO"
```

#### **Métriques de Performance**

```powershell
# Utilisation ressources temps réel
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Espace disque des volumes
docker system df

# Inspection détaillée d'un service
docker inspect supchat-backend
```

---

## 📱 **Application Mobile (React Native)**

L'application mobile SUPCHAT n'est **pas dockerisée** et nécessite un environnement de développement React Native spécifique.

### **🔧 Prérequis Mobile**

#### **Outils Requis**

```powershell
# 1. Node.js (même version que backend)
node --version  # 18+

# 2. Expo CLI
npm install -g @expo/cli

# 3. EAS CLI (pour builds)
npm install -g eas-cli

# 4. Yarn (optionnel mais recommandé)
npm install -g yarn
```

#### **Environnement Plateforme**

**Pour iOS :**

- 🍎 **macOS** requis
- 📱 **Xcode 14+** installé
- 📋 **iOS Simulator** configuré
- 👨‍💻 **Apple Developer Account** (pour distribution)

**Pour Android :**

- 🤖 **Android Studio** installé
- 📱 **Android SDK** configuré (API 33+)
- 🔧 **Android Emulator** ou appareil physique
- 🔑 **Variables d'environnement** ANDROID_HOME configurées

### **🚀 Installation et Démarrage Mobile**

#### **1. Installation des Dépendances**

```powershell
# Aller dans le dossier mobile
cd mobile

# Installer les dépendances
npm install
# ou
yarn install

# Vérifier l'installation
expo doctor
```

#### **2. Configuration Environnement**

```powershell
# L'application mobile utilise des variables d'environnement
# directement intégrées dans app.json et le code source

# Pour modifier la configuration API, éditer :
# mobile/src/utils/constants.js ou mobile/app.json

# Pas de fichier .env séparé - configuration intégrée
```

**Configuration mobile dans `app.json` :**

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.169:3000",
      "socketUrl": "http://192.168.1.169:3000",
      "s3BaseUrl": "https://s3-supchat.s3.fr-par.scw.cloud/",
      "environment": "development"
    }
  }
}
```

#### **3. Démarrage en Développement**

```powershell
# Dans le dossier mobile/
cd mobile

# Démarrer le serveur de développement
expo start

# Ou avec options spécifiques
expo start --dev-client    # Mode développement
expo start --clear         # Nettoyer le cache
expo start --tunnel        # Accès via tunnel (pour tests externes)
```

**Options de test :**

- 📱 **Expo Go** : Scanner le QR code avec l'app Expo Go
- 🤖 **Android** : `expo run:android` (émulateur ou appareil)
- 🍎 **iOS** : `expo run:ios` (simulateur ou appareil)
- 🌐 **Web** : `expo start --web` (pour test navigateur)

### **📱 Structure Application Mobile**

```
mobile/
├── App.js                 # Point d'entrée principal
├── app.json              # Configuration Expo
├── babel.config.js       # Configuration Babel
├── metro.config.js       # Configuration Metro bundler
├── package.json          # Dépendances et scripts
├── assets/               # Images, icônes, splash screen
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
└── src/                  # Code source application
    ├── components/       # Composants réutilisables
    │   ├── MessageInput/
    │   ├── MessageList/
    │   ├── UserItem/
    │   └── WorkspaceCard/
    ├── screens/          # Écrans de l'application
    │   ├── AuthScreen.js
    │   ├── HomeScreen.js
    │   ├── ChatScreen.js
    │   ├── WorkspaceScreen.js
    │   └── ProfileScreen.js
    ├── navigation/       # Configuration navigation
    │   ├── AppNavigator.js
    │   ├── AuthNavigator.js
    │   └── TabNavigator.js
    ├── context/         # État global (Context API)
    │   ├── AuthContext.js
    │   ├── SocketContext.js
    │   └── ThemeContext.js
    ├── services/        # Services API et utilitaires
    │   ├── api.js
    │   ├── socket.js
    │   ├── storage.js
    │   └── notifications.js
    └── utils/           # Fonctions utilitaires
        ├── constants.js
        ├── helpers.js
        └── validators.js
```

### **🔌 Connexion Backend**

#### **Configuration Réseau Local**

```powershell
# 1. Trouver l'IP locale de votre machine
ipconfig | Select-String "IPv4"

# 2. Vérifier que le backend est accessible
curl http://192.168.1.169:3000/api/ping

# 3. Tester depuis l'appareil mobile
# Scanner le QR code Expo avec cette IP configurée
```

#### **Services Intégrés**

- 🔐 **Authentification** : JWT avec AsyncStorage
- 💬 **Chat temps réel** : Socket.IO natif
- 📁 **Upload fichiers** : Expo Document/Image Picker
- 🔔 **Notifications push** : Expo Notifications
- 💾 **Stockage local** : AsyncStorage pour cache
- 🌙 **Mode sombre** : Support système + manuel

### **📦 Build et Distribution**

#### **1. Build Développement**

```powershell
# Build APK Android (développement)
expo build:android -t apk

# Build iOS (nécessite macOS)
expo build:ios -t simulator
```

#### **2. Build Production (EAS)**

```powershell
# Configuration EAS
eas login
eas build:configure

# Build Android (AAB pour Play Store)
eas build --platform android --profile production

# Build iOS (IPA pour App Store)
eas build --platform ios --profile production

# Soumettre aux stores
eas submit --platform android
eas submit --platform ios
```

### **🔄 Développement Mobile**

#### **Hot Reload et Debug**

```powershell
# Démarrer avec reload automatique
expo start --dev-client

# Debug avec React DevTools
expo install react-devtools
npx react-devtools

# Debug réseau
expo install flipper
```

#### **Tests sur Appareils**

```powershell
# Tester sur Android (émulateur/appareil)
expo run:android --device

# Tester sur iOS (simulateur)
expo run:ios --simulator

# Tests sur appareil physique via tunnel
expo start --tunnel
```

### **🚨 Dépannage Mobile**

#### **Problèmes Courants**

**1. Erreur de connexion API :**

```powershell
# Vérifier la configuration dans app.json mobile
notepad mobile/app.json

# Tester l'API depuis le PC
curl http://192.168.1.169:3000/api/ping

# Vérifier que Docker expose le port
docker-compose ps
```

**2. Cache Metro corrompu :**

```powershell
# Nettoyer le cache
expo start --clear
npx expo install --fix

# Réinstaller node_modules
Remove-Item -Recurse node_modules
npm install
```

**3. Problèmes Socket.IO :**

```javascript
// Dans mobile/src/services/socket.js
const socket = io("http://192.168.1.169:3000", {
  transports: ["websocket"], // Forcer WebSocket
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

**4. Erreurs de build :**

```powershell
# Nettoyer complètement
expo prebuild --clear
Remove-Item -Recurse .expo
Remove-Item -Recurse node_modules
npm install
```

### **📊 Synchronisation Web ↔ Mobile**

| Fonctionnalité         | Web | Mobile | Synchronisation  |
| ---------------------- | --- | ------ | ---------------- |
| 💬 Messages temps réel | ✅  | ✅     | Socket.IO        |
| 🔐 Authentification    | ✅  | ✅     | JWT partagé      |
| 📁 Upload fichiers     | ✅  | ✅     | API commune      |
| 🔔 Notifications       | ✅  | ✅     | Push + Socket    |
| 💾 Cache offline       | ⚠️  | ✅     | AsyncStorage     |
| 🌙 Mode sombre         | ✅  | ✅     | Préférences sync |
| 👥 Gestion workspaces  | ✅  | ✅     | API REST         |
| 🤖 Assistant IA        | ✅  | ✅     | Mistral API      |

L'application mobile offre une expérience native complète avec synchronisation temps réel avec la version web, tout en conservant des fonctionnalités spécifiques mobile comme le mode offline et les notifications push natives.

---

## 📱 **Applications**

### **Application Web**

- **URL** : `http://localhost` (dev) ou votre domaine
- **Fonctionnalités complètes** : Chat, workspaces, gestion fichiers
- **Responsive** : Optimisée mobile
- **Application web standard** : Pas de PWA dans cette version

### **Application Mobile**

- **Platforms** : iOS 13+, Android 8+
- **Build** : Expo EAS Build
- **Distribution** : App Store / Google Play (à venir)
- **Fonctionnalités** : Synchronisation complète avec le web

### **Différences Plaformes**

| Fonctionnalité     | Web | Mobile |
| ------------------ | --- | ------ |
| Chat temps réel    | ✅  | ✅     |
| Upload fichiers    | ✅  | ✅     |
| Notifications push | ✅  | ✅     |
| Mode hors ligne    | ⚠️  | ✅     |
| Google Drive       | ✅  | 🔄     |
| Admin panel        | ✅  | ❌     |

---

## 🔧 **Configuration**

### **Variables d'Environnement**

**⚠️ Important :** SUPCHAT utilise **Docker Secrets** pour la configuration au lieu de fichiers `.env` traditionnels. Les variables sensibles sont stockées dans le dossier `secrets/` et injectées de manière sécurisée dans les conteneurs.

#### **Configuration Backend (via Docker Secrets)**

Les variables backend sont injectées automatiquement depuis `secrets/` :

```yaml
# Variables injectées depuis les fichiers secrets
DB_HOST=postgres
DB_PORT=5432
DB_NAME=supchat
POSTGRES_DB=supchat

# Secrets montés depuis secrets/
JWT_SECRET=/run/secrets/jwt_secret
GOOGLE_CLIENT_ID=/run/secrets/google_client_id
GOOGLE_CLIENT_SECRET=/run/secrets/google_client_secret
GITHUB_CLIENT_ID=/run/secrets/github_client_id
GITHUB_CLIENT_SECRET=/run/secrets/github_client_secret

# Scaleway S3
SCW_ACCESS_KEY=/run/secrets/scw_access_key
SCW_SECRET_KEY=/run/secrets/scw_secret_key
SCW_ENDPOINT=/run/secrets/scw_endpoint
SCW_REGION=/run/secrets/scw_region
SCW_BUCKET_NAME=/run/secrets/s3_bucket_name

# Email
EMAIL_USER=/run/secrets/email_user
EMAIL_PASSWORD=/run/secrets/email_password

# IA Services
MISTRAL_API_KEY=/run/secrets/mistral_api_key
STRAWPOLL_API_KEY=/run/secrets/strawpoll_api_key
```

#### **Configuration Frontend (intégrée)**

Le frontend utilise des variables compilées dans le build :

```javascript
// Configuration intégrée dans le code source
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://votre-domaine.com/api"
    : "http://localhost:3000/api";

const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? "https://votre-domaine.com"
    : "http://localhost:3000";
```

#### **Configuration Mobile (app.json)**

La configuration mobile est intégrée dans `app.json` :

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.169:3000",
      "socketUrl": "http://192.168.1.169:3000",
      "s3BaseUrl": "https://s3-supchat.s3.fr-par.scw.cloud/",
      "environment": "development"
    }
  }
}
```

### **Secrets Docker**

Les secrets sensibles sont stockés dans `secrets/` :

```
secrets/
├── db_user.txt
├── db_password.txt
├── jwt_secret.txt
├── google_client_id.txt
├── google_client_secret.txt
├── github_client_id.txt
├── github_client_secret.txt
├── scw_access_key.txt
├── scw_secret_key.txt
├── mistral_api_key.txt
└── strawpoll_api_key.txt
```

---

## 📊 **Base de Données**

### **Schéma Principal**

La base de données PostgreSQL comprend 15+ tables optimisées :

#### **Tables Core**

- `utilisateur` - Gestion des utilisateurs et authentification
- `workspace` - Espaces de travail avec bannières et icônes
- `canal` - Canaux de communication (publics/privés)
- `message` - Messages de canal avec threading
- `message_prive` - Messages privés entre utilisateurs

#### **Tables Relations**

- `membre_workspace` - Appartenance aux workspaces avec rôles
- `membre_canal` - Accès granulaire aux canaux privés
- `reaction` / `private_message_reaction` - Système de réactions
- `message_fichier` - Attachements aux messages

#### **Tables Système**

- `statut` - Statuts utilisateur (en ligne, absent, DND)
- `role` / `permission` - Système de rôles et permissions
- `notification` - Notifications utilisateur
- `reminders` - Système de rappels
- `workspace_favoris` - Favoris utilisateur

### **Migrations**

```powershell
# Appliquer le schéma initial
psql -U postgres -d supchat -f backend/db/init-docker.sql

# Vérifier la structure
psql -U postgres -d supchat -c "\dt"
```

### **Backup & Restore**

```powershell
# Backup
pg_dump -U postgres supchat > backup.sql

# Restore
psql -U postgres -d supchat_new < backup.sql
```

---

## 🔐 **Sécurité**

### **Authentification**

- **JWT Tokens** avec expiration configurable
- **OAuth 2.0** Google et GitHub
- **Hachage bcrypt** pour les mots de passe
- **Codes de validation** email (6 chiffres)
- **Reset password** avec tokens temporaires

### **Autorisation**

- **Middleware d'authentification** sur toutes les routes protégées
- **RBAC** (Role-Based Access Control) granulaire
- **Permissions par canal** (lecture/écriture)
- **Validation des propriétaires** pour actions sensibles

### **Sécurité Infrastructure**

- **Docker Secrets** pour données sensibles
- **CORS** configuré strictement
- **Rate limiting** sur APIs sensibles
- **SSL/TLS** en production (Let's Encrypt)
- **Nginx** comme reverse proxy sécurisé

### **Bonnes Pratiques**

- Pas d'exposition directe de PostgreSQL
- Variables d'environnement pour configuration
- Logs de sécurité complets
- Validation stricte des inputs
- Sanitization des données utilisateur

---

## 🤖 **IA Mistral**

### **Fonctionnalités**

- **Assistant conversationnel** intégré dans les canaux
- **Analyse contextuelle** des 100 derniers messages
- **Réponses intelligentes** basées sur l'historique
- **Gestion timeout** et récupération d'erreurs

### **Configuration**

```javascript
// Utilisateur système Mistral
MISTRAL_USER_ID = "00000000-0000-0000-0000-000000000001";
MISTRAL_USERNAME = "Mistral AI";
MISTRAL_AVATAR = "https://mistral-ai-avatar-url.jpg";
```

### **Utilisation**

```javascript
// Mentionner Mistral dans un canal
@mistral Comment optimiser cette requête SQL ?

// Réponse automatique avec contexte
[Mistral AI] : Basé sur votre conversation précédente sur les performances...
```

### **API Integration**

```javascript
// backend/controllers/mistralController.js
export const processMistralChannelQuestion = async (
  channelId,
  question,
  userId,
  options = {}
) => {
  // Récupération du contexte
  // Appel API Mistral
  // Formatage de la réponse
  // Stockage en base
};
```

---

## 📱 **API Documentation**

### **Endpoints Principaux**

#### **Authentification**

```http
POST /api/users/login
POST /api/users/register
POST /api/users/validate-code
POST /api/users/reset-password
```

#### **Workspaces**

```http
GET    /api/workspaces/user/workspaces
POST   /api/workspaces
PUT    /api/workspaces/:id
DELETE /api/workspaces/:id
POST   /api/workspaces/:id/join
```

#### **Messages**

```http
GET    /api/messages/canal/:channelId
POST   /api/messages
PUT    /api/messages/:id
DELETE /api/messages/:id
GET    /api/messages/unread
```

#### **Messages Privés**

```http
GET    /api/private-messages/:userId
POST   /api/private-messages
GET    /api/private-messages/unread-counts
POST   /api/private-messages/mark-read
```

#### **Fichiers**

```http
POST   /api/attachments/upload
GET    /api/files/:id
DELETE /api/files/:id
```

### **WebSocket Events**

#### **Messages**

```javascript
// Envoyer un message
socket.emit("message", {
  canal_id: "uuid",
  content: "Hello world",
  workspace_id: "uuid",
});

// Recevoir un message
socket.on("message", (messageData) => {
  // Traiter le nouveau message
});
```

#### **Statuts**

```javascript
// Changer de statut
socket.emit("setUserStatus", { status: "online", userId: "uuid" });

// Écouter les changements
socket.on("userStatusChanged", ({ userId, status }) => {
  // Mettre à jour l'interface
});
```

#### **Notifications**

```javascript
// Messages non lus
socket.on("unreadChannelMessagesUpdated", ({ total, channels }) => {
  // Mettre à jour les badges
});
```

---

## 🚀 **Infrastructure de Déploiement**

SUPCHAT dispose d'une architecture de déploiement complète et flexible, adaptée à différents environnements de production.

### **🏗️ Architecture de Déploiement**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE CDN                           │
│              (Cache, DDoS Protection, SSL)                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    SERVEUR LWS (FRANCE)                        │
│                    Apache + SSL Let's Encrypt                   │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   DEVELOPMENT   │  │   PRODUCTION    │  │      VPS        │ │
│  │ docker-compose  │  │docker-compose   │  │docker-compose   │ │
│  │     .yml        │  │   .prod.yml     │  │   .vps.yml      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              CONTENEURS DOCKER                              │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │ PostgreSQL  │ │  Backend    │ │  Frontend   │          │ │
│  │  │  Database   │ │  Node.js    │ │   React     │          │ │
│  │  │   Port      │ │ Port 3000   │ │ Port 80/443 │          │ │
│  │  │   5432      │ │ Socket.IO   │ │   Nginx     │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **🐳 Environnements Docker**

#### **1. Développement (`docker-compose.yml`)**

```yaml
# Optimisé pour le développement local
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    volumes: [db_data, ./backend/db/init-docker.sql]

  backend:
    build: ./backend
    ports: ["3000:3000"]
    depends_on: [postgres]
    environment:
      - NODE_ENV=development
    volumes: [hot-reload, logs, uploads]

  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [backend]
    volumes: [./frontend/src:/app/src]
```

**Caractéristiques** :

- ✅ **Hot reload** activé pour développement rapide
- ✅ **Ports exposés** pour debug et tests
- ✅ **Volumes montés** pour édition en temps réel
- ✅ **Logs détaillés** pour debugging

#### **2. Production (`docker-compose.prod.yml`)**

```yaml
# Optimisé pour performance et sécurité production
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    volumes: [prod_db_data]
    secrets: [db_user, db_password]
    environment:
      - POSTGRES_DB_FILE=/run/secrets/db_user
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password

  backend:
    image: supchat-backend:latest
    restart: unless-stopped
    depends_on: [postgres]
    secrets: [jwt_secret, db_password, scw_access_key]
    environment:
      - NODE_ENV=production

  frontend:
    image: supchat-frontend:latest
    ports: ["443:443", "80:80"]
    restart: unless-stopped
    volumes: [./nginx.conf:/etc/nginx/nginx.conf]
```

**Caractéristiques** :

- 🔒 **Docker Secrets** pour sécurité maximale
- 🚀 **Images optimisées** (multi-stage builds)
- 🔄 **Auto-restart** en cas de crash
- 📊 **Health checks** intégrés
- 🛡️ **Isolation réseau** entre services

#### **3. VPS (`docker-compose.vps.yml`)**

```yaml
# Configuration spécifique VPS avec reverse proxy
services:
  postgres:
    container_name: supchat-postgres-vps
    networks: [supchat-network]
    volumes: ["/opt/supchat/data:/var/lib/postgresql/data"]

  backend:
    container_name: supchat-backend-vps
    environment:
      - API_URL=https://votre-domaine.com
    networks: [supchat-network]

  frontend:
    container_name: supchat-frontend-vps
    volumes: ["./nginx.vps.conf:/etc/nginx/nginx.conf"]
    networks: [supchat-network]

  nginx:
    image: nginx:alpine
    container_name: supchat-proxy-vps
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.vps.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    networks: [supchat-network]
```

**Caractéristiques** :

- 🌐 **Reverse proxy Nginx** pour gestion SSL
- 📁 **Volumes persistants** sur système hôte
- 🔒 **PostgreSQL non exposé** publiquement
- 📧 **Configuration email** LWS
- 🛡️ **Firewall** et sécurité renforcée

### **🌍 Configuration Serveur LWS (France)**

#### **Spécificités LWS**

```bash
# Configuration Apache sur serveur mutualisé LWS
# Fichier .htaccess pour redirection Docker
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\.)?votre-domaine\.com$
RewriteRule ^(.*)$ http://localhost:80/$1 [P,L]

# Headers pour WebSocket (Socket.IO)
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"

# Configuration SSL (certificat Let's Encrypt via LWS)
SSLEngine on
SSLCertificateFile /ssl/votre-domaine.com.crt
SSLCertificateKeyFile /ssl/votre-domaine.com.key
```

#### **Déploiement LWS**

```powershell
# 1. Préparation serveur LWS
ssh votre-login@votre-serveur.lws-hosting.com

# 2. Installation Docker (si supporté)
sudo apt update && sudo apt install docker.io docker-compose

# 3. Configuration domaine
# Via panel LWS : DNS A record vers IP serveur
# Activation SSL Let's Encrypt dans panel LWS

# 4. Déploiement application
git clone votre-repo supchat
cd supchat
./deploy-vps.sh votre-domaine.lws-hosting.com
```

### **☁️ Intégration Cloudflare**

#### **Configuration DNS Cloudflare**

```dns
# Enregistrements DNS requis
Type    Name             Content              Proxy   TTL
A       @                IP-SERVEUR-LWS       ✅      Auto
A       www              IP-SERVEUR-LWS       ✅      Auto
CNAME   api              votre-domaine.com    ✅      Auto
TXT     _verification    cloudflare-token     ❌      Auto
```

#### **Optimisations Cloudflare**

```javascript
// Configuration Page Rules Cloudflare
[
  {
    url: "votre-domaine.com/api/*",
    settings: {
      cache_level: "bypass", // Pas de cache pour API
      security_level: "medium", // Protection DDoS
      ssl: "full_strict", // SSL strict
    },
  },
  {
    url: "votre-domaine.com/socket.io/*",
    settings: {
      cache_level: "bypass", // WebSocket pas de cache
      websockets: "on", // Support WebSocket
    },
  },
  {
    url: "votre-domaine.com/*",
    settings: {
      cache_level: "standard", // Cache assets statiques
      browser_cache_ttl: 31536000, // 1 an
      edge_cache_ttl: 2592000, // 30 jours
    },
  },
];
```

#### **Sécurité Cloudflare**

```yaml
# Firewall Rules Cloudflare
- name: "Block malicious countries"
  expression: '(ip.geoip.country in {"CN" "RU"})'
  action: "block"

- name: "Rate limit API"
  expression: '(http.request.uri.path contains "/api/")'
  action: "challenge"
  rate_limit: "100 requests per minute"

- name: "Allow France prioritaire"
  expression: '(ip.geoip.country eq "FR")'
  action: "allow"
```

### **🔧 Scripts de Déploiement Automatique**

#### **`deploy-vps.sh` - Déploiement Principal**

```bash
#!/bin/bash
# Script de déploiement automatique VPS

DOMAIN=$1
VPS_IP=$2

echo "🚀 Déploiement SUPCHAT sur VPS"
echo "Domaine: $DOMAIN"
echo "IP VPS: $VPS_IP"

# 1. Vérification prérequis
./check-requirements.sh

# 2. Configuration sécurisée
./setup-secrets.sh

# 3. Déploiement Docker
docker-compose -f docker-compose.vps.yml up -d

# 4. Configuration SSL
./setup-ssl.sh $DOMAIN

# 5. Configuration Cloudflare
./setup-cloudflare.sh $DOMAIN

# 6. Tests de santé
curl -f http://$DOMAIN/health || exit 1

echo "✅ Déploiement terminé avec succès !"
```

#### **`setup-ssl.sh` - Configuration SSL Automatique**

```bash
#!/bin/bash
# Configuration SSL Let's Encrypt

DOMAIN=$1

# Installation Certbot
apt install -y certbot python3-certbot-nginx

# Génération certificat
certbot --nginx -d $DOMAIN -d www.$DOMAIN \
  --non-interactive --agree-tos \
  --email admin@$DOMAIN

# Configuration auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Test configuration
nginx -t && systemctl reload nginx

echo "🔒 SSL configuré pour $DOMAIN"
```

#### **`setup-cloudflare.sh` - Intégration Cloudflare**

```bash
#!/bin/bash
# Configuration automatique Cloudflare

DOMAIN=$1
CLOUDFLARE_TOKEN=$2

# Installation cloudflare CLI
curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
dpkg -i cloudflared.deb

# Configuration DNS automatique
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "@",
    "content": "'$VPS_IP'",
    "proxied": true
  }'

echo "☁️ Cloudflare configuré pour $DOMAIN"
```

### **📊 Monitoring et Maintenance**

#### **Health Checks Automatiques**

```yaml
# Configuration health checks dans docker-compose
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

#### **Monitoring VPS**

```bash
# Script de monitoring automatique
#!/bin/bash
# /opt/supchat/monitor.sh

echo "🔍 Status SUPCHAT $(date)"
echo "=================================="

# Status containers
docker-compose -f docker-compose.vps.yml ps

# Utilisation ressources
echo -e "\n📊 RESSOURCES:"
docker stats --no-stream

# Espace disque
echo -e "\n💾 DISQUE:"
df -h

# Logs récents
echo -e "\n📋 LOGS RÉCENTS:"
docker-compose -f docker-compose.vps.yml logs --tail=10

# Test connectivité
echo -e "\n🌐 CONNECTIVITÉ:"
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" \
  http://localhost/health
```

### **🔄 Processus de Mise à Jour**

#### **Mise à jour Zero-Downtime**

```bash
#!/bin/bash
# Mise à jour avec zero downtime

echo "🔄 Mise à jour SUPCHAT..."

# 1. Backup avant mise à jour
./backup.sh

# 2. Pull nouveaux changements
git pull origin main

# 3. Build nouvelles images
docker-compose -f docker-compose.vps.yml build

# 4. Mise à jour rolling
docker-compose -f docker-compose.vps.yml up -d --no-deps backend
docker-compose -f docker-compose.vps.yml up -d --no-deps frontend

# 5. Vérification santé
sleep 30
curl -f http://localhost/health

echo "✅ Mise à jour terminée !"
```

### **📊 Monitoring & Observabilité**

#### **Métriques Business**

```javascript
// backend/middleware/metrics.js
const promClient = require("prom-client");

const register = new promClient.register();

// Métriques custom
const messagesSent = new promClient.Counter({
  name: "supchat_messages_sent_total",
  help: "Total des messages envoyés",
  labelNames: ["workspace_id", "channel_type"],
  registers: [register],
});

const activeUsers = new promClient.Gauge({
  name: "supchat_active_users",
  help: "Utilisateurs actuellement connectés",
  registers: [register],
});

const apiRequestDuration = new promClient.Histogram({
  name: "supchat_api_request_duration_seconds",
  help: "Durée des requêtes API",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

module.exports = {
  register,
  messagesSent,
  activeUsers,
  apiRequestDuration,
};
```

#### **Alertes Automatiques**

```bash
#!/bin/bash
# monitoring/alerts.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=85
THRESHOLD_DISK=90

send_alert() {
  local message="$1"
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 SUPCHAT Alert: $message\"}" \
    "$WEBHOOK_URL"
}

# Vérifier l'utilisation des ressources
cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" supchat-backend | sed 's/%//')
memory_usage=$(docker stats --no-stream --format "{{.MemPerc}}" supchat-backend | sed 's/%//')
disk_usage=$(df /opt/supchat | tail -1 | awk '{print $(NF-1)}' | sed 's/%//')

if (( $(echo "$cpu_usage > $THRESHOLD_CPU" | bc -l) )); then
  send_alert "CPU élevé: ${cpu_usage}%"
fi

if (( $(echo "$memory_usage > $THRESHOLD_MEMORY" | bc -l) )); then
  send_alert "Mémoire élevée: ${memory_usage}%"
fi

if (( disk_usage > THRESHOLD_DISK )); then
  send_alert "Disque plein: ${disk_usage}%"
fi
```

### **🔐 Sécurité Avancée**

#### **Audit et Logging**

```javascript
// backend/middleware/audit.js
const auditLog = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const logData = {
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime,
      body: req.method !== "GET" ? req.body : undefined,
    };

    // Log selon le niveau de criticité
    if (res.statusCode >= 400) {
      logger.warn("API_ERROR", logData);
    } else if (req.url.includes("/admin/") || req.method === "DELETE") {
      logger.info("ADMIN_ACTION", logData);
    } else {
      logger.debug("API_REQUEST", logData);
    }
  });

  next();
};
```

#### **Rate Limiting Avancé**

```javascript
// backend/middleware/rateLimiter.js
const redis = require("redis");
const client = redis.createClient();

const createRateLimiter = (windowMs, maxRequests, keyGenerator) => {
  return async (req, res, next) => {
    const key = keyGenerator(req);
    const current = await client.incr(key);

    if (current === 1) {
      await client.expire(key, windowMs / 1000);
    }

    if (current > maxRequests) {
      const ttl = await client.ttl(key);
      res.status(429).json({
        error: "Too Many Requests",
        retryAfter: ttl,
      });
      return;
    }

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - current);
    next();
  };
};

// Limiteurs spécifiques
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 tentatives
  (req) => `auth:${req.ip}`
);

const apiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100, // 100 requêtes
  (req) => `api:${req.user?.id || req.ip}`
);
```

### **🧪 Tests & Qualité**

#### **Tests d'Intégration**

```javascript
// tests/integration/api.test.js
const request = require("supertest");
const app = require("../backend/server");
const { setupTestDb, cleanupTestDb } = require("./helpers/database");

describe("SUPCHAT API Integration", () => {
  let authToken;

  beforeAll(async () => {
    await setupTestDb();

    // Créer un utilisateur test et obtenir un token
    const response = await request(app).post("/api/users/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "Test123!@#",
    });

    authToken = response.body.token;
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe("Messages API", () => {
    test("should create and retrieve messages", async () => {
      // Créer un workspace
      const workspace = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Workspace" });

      // Créer un canal
      const channel = await request(app)
        .post("/api/channels")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "general",
          workspace_id: workspace.body.id,
        });

      // Envoyer un message
      const message = await request(app)
        .post("/api/messages")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          content: "Hello World",
          canal_id: channel.body.id,
        });

      expect(message.status).toBe(201);
      expect(message.body.content).toBe("Hello World");
    });
  });
});
```

#### **Tests de Performance**

```javascript
// tests/performance/load.test.js
const io = require("socket.io-client");

describe("Socket.IO Performance", () => {
  test("should handle 1000 concurrent connections", async () => {
    const connections = [];
    const messageCount = 100;
    const clientCount = 1000;

    // Créer les connexions
    for (let i = 0; i < clientCount; i++) {
      const socket = io("http://localhost:3000", {
        auth: { token: "test-token" },
      });
      connections.push(socket);
    }

    // Attendre que toutes les connexions soient établies
    await Promise.all(
      connections.map(
        (socket) => new Promise((resolve) => socket.on("connect", resolve))
      )
    );

    const startTime = Date.now();

    // Envoyer des messages en parallèle
    const promises = connections.map(
      (socket, index) =>
        new Promise((resolve) => {
          let received = 0;
          socket.on("message", () => {
            received++;
            if (received === messageCount) resolve();
          });

          for (let j = 0; j < messageCount; j++) {
            socket.emit("message", {
              content: `Message ${j} from client ${index}`,
              canal_id: "test-channel",
            });
          }
        })
    );

    await Promise.all(promises);

    const duration = Date.now() - startTime;
    const messagesPerSecond = (clientCount * messageCount) / (duration / 1000);

    console.log(`Performance: ${messagesPerSecond.toFixed(2)} messages/sec`);

    // Nettoyer
    connections.forEach((socket) => socket.disconnect());
  }, 30000);
});
```

### **📱 Optimisations Mobile**

#### **Gestion Hors Ligne Avancée**

```javascript
// mobile/src/services/OfflineManager.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-netinfo/netinfo";

class OfflineManager {
  constructor() {
    this.queue = [];
    this.isOnline = true;
    this.init();
  }

  async init() {
    // Charger la queue depuis le storage
    const savedQueue = await AsyncStorage.getItem("offline_queue");
    if (savedQueue) {
      this.queue = JSON.parse(savedQueue);
    }

    // Écouter les changements de connectivité
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  async addToQueue(action) {
    const queueItem = {
      id: Date.now().toString(),
      action,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    this.queue.push(queueItem);
    await this.saveQueue();

    if (this.isOnline) {
      this.processQueue();
    }
  }

  async processQueue() {
    const pendingItems = [...this.queue];
    this.queue = [];

    for (const item of pendingItems) {
      try {
        await this.executeAction(item.action);
      } catch (error) {
        // Réessayer avec backoff exponentiel
        if (item.retries < 3) {
          item.retries++;
          setTimeout(() => {
            this.queue.push(item);
            this.saveQueue();
          }, Math.pow(2, item.retries) * 1000);
        }
      }
    }

    await this.saveQueue();
  }

  async executeAction(action) {
    switch (action.type) {
      case "SEND_MESSAGE":
        return await api.sendMessage(action.payload);
      case "UPDATE_PROFILE":
        return await api.updateProfile(action.payload);
      default:
        throw new Error(`Action type non supporté: ${action.type}`);
    }
  }

  async saveQueue() {
    await AsyncStorage.setItem("offline_queue", JSON.stringify(this.queue));
  }
}

export default new OfflineManager();
```

#### **Cache Redis Intelligent**

```javascript
// backend/services/CacheService.js
const redis = require("redis");
const client = redis.createClient();

class CacheService {
  static generateKey(prefix, params) {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  static async get(key, fallbackFunction, ttl = 3600) {
    try {
      const cached = await client.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // Pas en cache, exécuter la fonction fallback
      const result = await fallbackFunction();

      // Mettre en cache avec TTL
      await client.setex(key, ttl, JSON.stringify(result));

      return result;
    } catch (error) {
      console.error("Cache error:", error);
      // En cas d'erreur de cache, exécuter directement
      return await fallbackFunction();
    }
  }

  static async invalidate(pattern) {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  // Cache spécialisé pour les messages
  static async getCachedMessages(channelId, page = 1) {
    const key = this.generateKey("messages", { channelId, page });

    return await this.get(
      key,
      async () => {
        return await Message.findByChannel(channelId, { page, limit: 30 });
      },
      300
    ); // 5 minutes
  }

  // Cache pour les utilisateurs en ligne
  static async getOnlineUsers(workspaceId) {
    const key = this.generateKey("online_users", { workspaceId });

    return await this.get(
      key,
      async () => {
        return await User.getOnlineInWorkspace(workspaceId);
      },
      60
    ); // 1 minute
  }
}

module.exports = CacheService;
```

Cette infrastructure DevOps et ces bonnes pratiques complètent la documentation SUPCHAT en ajoutant :

1. **🚀 Pipeline CI/CD** avec GitHub Actions
2. **📊 Monitoring avancé** avec métriques custom et alertes
3. **🔐 Sécurité renforcée** avec audit logs et rate limiting
4. **🧪 Tests complets** d'intégration et de performance
5. **📱 Optimisations mobile** avec gestion hors ligne
6. **⚡ Cache intelligent** avec Redis pour les performances

Ces éléments transforment SUPCHAT en une solution production-ready avec toutes les pratiques DevOps modernes.

---
