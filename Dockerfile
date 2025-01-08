# Étape 1 : Utiliser une image officielle Node.js (version LTS avec Alpine)
FROM node:lts-alpine

RUN apk add --no-cache python3 make g++ 

# Étape 2 : Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Étape 3 : Copier les fichiers package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Étape 4 : Installer les dépendances
RUN npm install --production

# Étape 5 : Copier tout le reste du code source dans le conteneur
COPY . .

# Étape 6 : Exposer le port sur lequel l'application s'exécute
EXPOSE 4000

# Étape 7 : Démarrer le serveur Node.js
CMD ["node", "server.js"]


