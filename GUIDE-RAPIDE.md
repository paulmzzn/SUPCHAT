# 🚀 Guide Rapide de Déploiement VPS

## 📋 Prérequis

Vous avez besoin de :
- Votre VPS avec Ubuntu
- L'IP de votre VPS 
- Accès root avec le mot de passe : `SWXTnNoBPlh`
- `sshpass` installé sur votre Mac

## 🔧 Installation de sshpass (sur votre Mac)

```bash
# Si vous avez Homebrew
brew install hudochenkov/sshpass/sshpass

# Sinon, installez Homebrew d'abord :
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 🚀 Déploiement en 1 commande

```bash
# Depuis votre répertoire SUPCHAT local
./deploy-remote.sh
```

Le script va :
1. ✅ Vérifier que tout est prêt
2. ✅ Vous demander l'IP de votre VPS
3. ✅ Transférer tous les fichiers
4. ✅ Déployer automatiquement Docker sur le VPS
5. ✅ Lancer votre application

## 🎯 Étapes détaillées

### Option 1 : Déploiement automatique (recommandé)
```bash
./deploy-remote.sh
# Choisir option 1
# Entrer l'IP de votre VPS
# Attendre la fin du déploiement
```

### Option 2 : Étape par étape
```bash
# 1. Transférer les fichiers
./transfer-to-vps.sh

# 2. Se connecter au VPS
ssh root@VOTRE_IP_VPS

# 3. Sur le VPS, aller dans le dossier
cd /opt/supchat

# 4. Déployer
./deploy-vps.sh
```

## 🌐 Accès à votre application

Une fois le déploiement terminé :

- **Frontend** : `http://VOTRE_IP_VPS`
- **API Backend** : `http://VOTRE_IP_VPS:3000`
- **PgAdmin** : `http://VOTRE_IP_VPS:8080`

## 🔒 Sécurisation (recommandé)

Après le déploiement, sécurisez votre VPS :

```bash
# Se connecter au VPS
ssh root@VOTRE_IP_VPS

# Aller dans le dossier
cd /opt/supchat

# Exécuter la sécurisation
./post-deploy.sh

# Choisir option 5 (Configuration complète)
```

Cela configurera :
- 🔒 SSL automatique avec Let's Encrypt
- 🛡️ Pare-feu optimisé
- 📊 Monitoring avancé
- ⚡ Optimisations système

## 🔧 Commandes utiles

### Surveillance
```bash
# Voir le statut
ssh root@VOTRE_IP_VPS "/opt/supchat/monitor.sh"

# Voir les logs en temps réel
ssh root@VOTRE_IP_VPS "cd /opt/supchat && docker-compose -f docker-compose.vps.yml logs -f"
```

### Gestion
```bash
# Redémarrer les services
ssh root@VOTRE_IP_VPS "cd /opt/supchat && docker-compose -f docker-compose.vps.yml restart"

# Arrêter les services
ssh root@VOTRE_IP_VPS "cd /opt/supchat && docker-compose -f docker-compose.vps.yml down"

# Démarrer les services
ssh root@VOTRE_IP_VPS "cd /opt/supchat && docker-compose -f docker-compose.vps.yml up -d"
```

## 🐛 Problèmes courants

### "sshpass command not found"
```bash
brew install hudochenkov/sshpass/sshpass
```

### "Permission denied"
Vérifiez que vous utilisez le bon mot de passe : `SWXTnNoBPlh`

### "Connection refused"
Vérifiez l'IP de votre VPS

### Services qui ne démarrent pas
```bash
# Se connecter au VPS et vérifier
ssh root@VOTRE_IP_VPS
cd /opt/supchat
docker-compose -f docker-compose.vps.yml logs
```

## 📞 Support

Si vous avez des problèmes :

1. Vérifiez les logs : `./deploy-remote.sh` → option 5
2. Testez la connexion : `./deploy-remote.sh` → option 4
3. Redéployez si nécessaire : `./deploy-remote.sh` → option 1

---

## ✨ C'est tout !

Votre application SUPCHAT devrait maintenant fonctionner sur votre VPS ! 🎉
