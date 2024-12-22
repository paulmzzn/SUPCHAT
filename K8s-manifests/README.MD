# README - Kubernetes Cluster Setup

## Introduction

Ce projet contient des manifests Kubernetes pour configurer un cluster local Minikube avec les services suivants :

1. **Nginx** : Serveur web.
2. **PostgreSQL** : Base de données relationnelle.
3. **Node.js** : Serveur applicatif.

Les fichiers de configuration Kubernetes se trouvent dans le dossier `k8s-manifests`.

---

## Prérequis

Avant de commencer, assurez-vous que les éléments suivants sont installés sur votre machine :

1. **Minikube** : [Guide d'installation](https://minikube.sigs.k8s.io/docs/start/)
2. **kubectl** : [Guide d'installation](https://kubernetes.io/docs/tasks/tools/)
3. **Docker** (facultatif pour tester les images locales) : [Guide d'installation](https://docs.docker.com/get-docker/)
4. **VSCode** avec les extensions suivantes :
   - [Kubernetes](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools)
   - [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)

---

## Étapes pour lancer les manifests

### 1. Démarrer Minikube

Assurez-vous que Minikube est démarré :

```bash
minikube start --driver=docker --memory=2000 --cpus=2
```

Vérifiez que le cluster est actif :

```bash
kubectl get nodes
```

### 2. Déployer les services Kubernetes

1. Naviguez vers le dossier contenant les fichiers de configuration :

   ```bash
   cd k8s-manifests
   ```

2. Appliquez les manifests pour chaque service :

   - **Nginx** :

     ```bash
     kubectl apply -f nginx.yaml
     ```

   - **PostgreSQL** :

     ```bash
     kubectl apply -f postgres.yaml
     ```

   - **Node.js** :
     ```bash
     kubectl apply -f nodejs.yaml
     ```

3. Vérifiez que tous les pods et services sont en cours d'exécution :

   ```bash
   kubectl get pods
   kubectl get services
   ```

### 3. Accéder aux services

1. **Nginx** :

   ```bash
   minikube service nginx-service
   ```

2. **Node.js** :

   ```bash
   minikube service nodejs-service
   ```

3. **PostgreSQL** :
   Le service PostgreSQL est accessible via son nom DNS dans le cluster : `postgres-service`.

   Exemple de configuration pour une application Node.js :

   ```javascript
   const { Client } = require("pg");

   const client = new Client({
     user: "user",
     host: "postgres-service",
     database: "mydb",
     password: "password",
     port: 5432,
   });

   client.connect();
   ```

### 4. (Optionnel) Vérifier via le tableau de bord Minikube

Lancez le tableau de bord Kubernetes :

```bash
minikube dashboard
```

---

## Nettoyer les ressources

Pour supprimer les services et déploiements, exécutez :

```bash
kubectl delete -f nginx.yaml
kubectl delete -f postgres.yaml
kubectl delete -f nodejs.yaml
```

---

## Structure des fichiers

Le dossier `k8s-manifests` contient les fichiers suivants :

- `nginx.yaml` : Configuration pour le déploiement et le service Nginx.
- `postgres.yaml` : Configuration pour le déploiement et le service PostgreSQL.
- `nodejs.yaml` : Configuration pour le déploiement et le service Node.js.

---

## Ressources utiles

- [Documentation Minikube](https://minikube.sigs.k8s.io/docs/)
- [Documentation Kubernetes](https://kubernetes.io/docs/home/)
- [Extension Kubernetes pour VSCode](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools)
