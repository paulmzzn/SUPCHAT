# 📢 SUPCHAT

## 🏢 Contexte du projet
La société "La confiance règne" souhaite améliorer la communication interne et la collaboration entre ses équipes. Elle a pour cela lancé un appel d'offres pour confier le projet SUPCHAT à un sous-traitant. Votre équipe est ainsi en compétition pour remporter ce contrat. Vous devrez développer une application web et une application mobile afin de satisfaire les deux types de publics. La charte graphique est également à définir.

## 📝 Description du projet

### 🎯 Généralités
Le but principal de SUPCHAT est de permettre aux équipes de l’entreprise de communiquer, collaborer et partager des informations au sein de canaux dédiés. Chaque utilisateur dispose de son compte personnel et peut rejoindre plusieurs espaces de travail (workspaces). Chaque espace de travail comprend plusieurs canaux (publics ou privés) et une messagerie privée. Les utilisateurs peuvent partager des messages, des fichiers, et réagir aux publications. L'accent est mis sur la simplicité, la sécurité des échanges et la gestion flexible des permissions.

### 📋 Fonctionnalités de l'application à implémenter

#### 🔐 Connexion
- Un utilisateur pourra se connecter à l'application via un compte créé spécifiquement ou en utilisant un compte Facebook ou Google.

#### 🏢 Espaces de travail (Workspaces)
- Les utilisateurs peuvent créer des espaces de travail et inviter des membres via e-mail ou lien d'invitation.
- Les espaces de travail peuvent être publics (ouverts à tous) ou privés (sur invitation uniquement).
- Un tableau de bord dédié permet de visualiser et gérer les espaces de travail auxquels l'utilisateur appartient.

#### 📢 Canaux
- Chaque espace de travail peut avoir plusieurs canaux :
  - Canaux publics : accessibles à tous les membres de l'espace.
  - Canaux privés : accessibles uniquement aux membres invités.
- Les canaux sont organisés dans un menu avec une barre de recherche.

#### 🗨️ Messagerie instantanée
- Messagerie en temps réel avec mise à jour automatique des messages.
- Possibilité d’envoyer :
  - Messages textuels.
  - Réactions (emoji).
  - Fichiers (images, vidéos, PDF, etc.).
  - Prise en charge des mentions (@utilisateur) et des hashtags (#canal).
- Recherche dans les messages par mots-clés.

#### 🔐 Gestion des permissions
- Créateurs de canaux/espaces de travail :
  - Peuvent attribuer des rôles (admin, membre, invité).
  - Peuvent définir les permissions : publier, modérer, gérer les membres.
- Gestion granulaire des droits : par utilisateur ou par groupe.

#### 🔔 Notifications
- Notifications en temps réel :
  - Mention d'utilisateur.
  - Nouveaux messages dans un canal ou un espace.
- Options de personnalisation des notifications :
  - Par canal.
  - Notifications push ou e-mails.

#### 🔗 Intégrations et automatisations
- Intégration avec des outils tiers :
  - Google Drive, Microsoft Teams, GitHub.
- Automatisation via des bots :
  - Rappels, sondages, intégrations API tierces.

#### 🔍 Recherche
- Recherche unifiée permettant de trouver :
  - Messages (avec aperçu du contexte).
  - Fichiers partagés.
  - Canaux et utilisateurs.

#### ⚙️ Paramètres utilisateurs
- Gestion de compte : modification des informations personnelles, ajout/suppression d’OAuth2.
- Choix des préférences :
  - Thème clair/sombre.
  - Statut personnalisé (en ligne, occupé, hors ligne).
- Exportation des données personnelles (conforme RGPD).

## 🚀 Déploiement

### 🏗️ Architecture
Votre application doit comporter trois briques distinctes :
- Un serveur, devant être une API REST ou GraphQL et devant implémenter l'ensemble des fonctionnalités précédemment énoncées.
- Deux clients (web et mobile distincts) devant uniquement interagir avec le serveur.
- Une base de données (choix libre).
Aucune logique ne doit avoir lieu sur les clients qui ne servent que d'interfaces et redirigent les différentes requêtes vers le serveur.

### 🐳 Containérisation
Le projet doit comporter un fichier `docker-compose.yml` à la racine du projet permettant de déployer au moins 3 services Docker distincts, respectivement pour le serveur, le client web et la base de données. L'application doit pouvoir être lancée intégralement via docker compose et être fonctionnelle.

## 📂 Structure du projet

## 📂 Structure du projet
SUPCHAT/
│
├── server/                       # Serveur API (REST ou GraphQL)
│   ├── controllers/             # Logique métier
│   │   ├── authController.js
│   │   ├── spaceController.js
│   │   ├── channelController.js
│   │   └── messageController.js
│   │
│   ├── models/                  # Modèles de données (MongoDB avec Mongoose ou autre)
│   │   ├── User.js
│   │   ├── Workspace.js
│   │   ├── Channel.js
│   │   └── Message.js
│   │
│   ├── routes/                  # Routes pour l'API
│   │   ├── authRoutes.js
│   │   ├── workspaceRoutes.js
│   │   ├── channelRoutes.js
│   │   └── messageRoutes.js
│   │
│   ├── middlewares/             # Middlewares pour la sécurité
│   │   ├── authMiddleware.js
│   │   └── permissionMiddleware.js
│   │
│   ├── config/                  # Configuration de la base de données, JWT, etc.
│   │   └── dbConnection.js
│   │
│   ├── utils/                   # Fonctions utilitaires
│   │   └── tokenUtils.js
│   │
│   └── server.js                # Point d'entrée du serveur
│
├── web-client/                   # Application Client Web
│   ├── public/                   # Fichiers statiques (images, icônes, etc.)
│   ├── src/
│   │   ├── components/           # Composants React
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Chat/
│   │   │   └── Notifications/
│   │   │
│   │   ├── services/             # Services pour les appels API
│   │   │   └── api.js
│   │   │
│   │   ├── routes/               # Routes avec React Router
│   │   │   └── App.js
│   │   │
│   │   └── index.js              # Point d'entrée principal
│   │
│   └── Dockerfile                # Dockerfile pour le client web
│
├── mobile-client/                # Application Client Mobile (React Native ou autre)
│   ├── src/
│   │   ├── components/           # Composants pour mobile
│   │   │   ├── Auth/
│   │   │   └── Chat/
│   │
│   └── Dockerfile                # Dockerfile pour le client mobile
│
├── database/                      # Configuration base de données
│   └── init-data/                # Fichiers d'initialisation pour la base MongoDB si nécessaire
│
├── docker-compose.yml             # Fichier pour démarrer l'ensemble avec Docker Compose
│
├── .env                            # Fichier pour stocker les secrets (exclure de la version publique)
│
├── README.md                       # Documentation principale du projet
├── docs/                           # Documentation technique et manuels
│   ├── technical_guide.md
│   ├── user_guide.md
│   └── architecture_diagram.png
│
└── package.json                    # Dépendances de tout le projet

## 🛠️ Technologies Utilisées

### 🚀 Serveur
- **Node.js / Express.js** : Pour construire l’API REST.

### 📊 Base de Données
- **MongoDB avec Mongoose** : Base de données NoSQL utilisée pour stocker les informations utilisateurs, messages, canaux, permissions, etc.
- **Redis (optionnel)** : Utilisé pour le cache, notamment pour les sessions utilisateur ou les systèmes de notifications.

### 🔒 Authentification
- **JWT (JSON Web Token)** : Gestion de l’authentification sécurisée.
- **OAuth 2.0 (Facebook/Google)** : Authentification par comptes sociaux.

### 💬 Messagerie en Temps Réel
- **Socket.IO** : Permet la messagerie en temps réel.

### 💻 Client Web
- **React.js** : Interface utilisateur réactive, rapide, et maintenue par la communauté.
- **Redux ou Context API** : Gestion de l’état global pour la connexion, les canaux, l’authentification.
- **CSS / SASS / TailwindCSS** : Pour un style responsive et ergonomique.
- **React Router** : Gestion de la navigation côté client.

### 📱 Client Mobile
- **React Native** : Développement d’applications mobiles pour iOS/Android avec une base de code unique.
- **Expo ou React Navigation** : Outils facilitant le développement mobile.

### 🐳 Conteneurisation avec Docker
- **Docker Compose** : Orchestration de plusieurs services.
  - **Node.js + Express / MongoDB** dans un conteneur.
  - **React Web App** dans son propre conteneur.
  - **MongoDB** comme conteneur pour la base de données.

### 🌟 Pourquoi ces choix technologiques ?
Chaque technologie a été choisie pour répondre aux besoins suivants :
- **Scalabilité et rapidité** avec MongoDB.
- **Sécurité renforcée** grâce à JWT & OAuth.
- **Expérience utilisateur fluide et rapide** avec React.js.
- **Développement multi-plateforme simplifié** avec React Native.

## 📄 Documentation

### 📊 Diagramme et Structure

#### Architecture MVC
- Séparation logique du serveur en :
  - Models : Définition des schémas de données.
  - Views : Représentation des données pour l’utilisateur.
  - Controllers : Logique métier et gestion des requêtes.

#### Schéma de la base de données MongoDB
La base de données MongoDB est organisée autour des schémas suivants :
- **Utilisateurs** : User Schema
- **Espaces de travail** : Workspace Schema
- **Canaux** : Channel Schema
- **Messages** : Message Schema

### 📚 Documentation Attendue

#### Documentation technique
- Architecture choisie.
- Diagrammes UML.
- Guide de déploiement avec Docker.
- Choix technologiques.

#### Manuel Utilisateur
- Fonctionnement pour les utilisateurs.
- Guide d’utilisation de chaque fonctionnalité.

#### Sécurité
- Sécurisation avec JWT, permissions et API sécurisées.

## 🎯 Objectifs du Projet
Avec cette structure et ces technologies, l’objectif est de couvrir l’entièreté du projet SUPCHAT tout en assurant :
- ✅ Modularité
- ✅ Sécurité renforcée
- ✅ Maintenabilité
- ✅ Interopérabilité entre le serveur, le client web et mobile