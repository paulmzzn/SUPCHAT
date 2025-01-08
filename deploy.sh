#!/bin/sh
# @author GAULT Rudy
# @company Cloud Temple
# @created_at 2025-01-08 13:49:49
# @updated_by GAULT Rudy
# @updated_at 2025-01-08 13:49:52

#!/bin/bash

# Supprimer le namespace existant (si présent)
kubectl delete namespace supchat --ignore-not-found

# Créer un nouveau namespace
kubectl create namespace supchat

# Appliquer les configurations
kubectl apply -f K8s-manifests/db-configmap.yml -n supchat
kubectl apply -f K8s-manifests/postgres.yml -n supchat
kubectl apply -f K8s-manifests/nodejs.yml -n supchat
kubectl apply -f K8s-manifests/nginx.yml -n supchat
kubectl apply -f K8s-manifests/init-job.yml -n supchat
kubectl apply -f K8s-manifests/pgadmin.yml -n supchat

# Vérifier l'état des pods et services
echo "Liste des pods :"
kubectl get pods -n supchat

echo "Liste des services :"
kubectl get services -n supchat

echo "Déploiement terminé avec succès."
