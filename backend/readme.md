PostgreSQL & pgAdmin with Docker 🚀

Ce README vous guide pour configurer, lancer et accéder à PostgreSQL et pgAdmin via Docker avec un docker-compose.yml.

Prérequis 🛠️
• Docker doit être installé sur votre machine.
Télécharger Docker.

Configuration ⚙️

Créez un fichier nommé docker-compose.yml avec le contenu suivant :

```
version: '3.8'

services:
  postgres:
    container_name: container-pg
    image: postgres


    hostname: 192.168.1.127

ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: root
      POSTGRES_DB: test_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  pgadmin:
    container_name: container-pgadmin
    image: dpage/pgadmin4
    depends_on:
      - postgres
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: root
    restart: unless-stopped

volumes:
  postgres-data:

```

🚀 Lancer les conteneurs 1. Naviguez dans le répertoire contenant le docker-compose.yml.

```
cd /chemin/vers/votre/docker-compose.yml
```

    2.	Lancez les conteneurs avec Docker Compose :

```
docker-compose up -d
```

📊 Accéder à pgAdmin 1. Ouvrez votre navigateur et accédez à : http://192.168.1.127:5050

    2.	Connectez-vous avec les identifiants définis dans le docker-compose.yml :
    •	Email : admin@admin.com
    •	Mot de passe : root

📊 Accéder à pgAdmin 1. Ouvrez votre navigateur et accédez à : http://192.168.1.127:5050

    2.	Connectez-vous avec les identifiants définis dans le docker-compose.yml :
    •	Email : admin@admin.com
    •	Mot de passe : root

    3.	Ajoutez un serveur pour connecter PostgreSQL :
    •	Hostname : ip de la machine
    •	Port : 5432
    •	Maintenance database : postgres
    •	Username : admin
    •	Password : root

🛑 Vérification

Vérifiez que vos conteneurs tournent avec :

```
docker ps
```

🔄 Arrêter les services

Pour arrêter vos conteneurs :

```
docker-compose down
```

Pour les redémarrer après des changements :

```
docker-compose up -d
```

```
📌 Variables utilisées
	•	POSTGRES_USER : Nom d’utilisateur par défaut pour PostgreSQL (admin).
	•	POSTGRES_PASSWORD : Mot de passe par défaut pour PostgreSQL (root).
	•	POSTGRES_DB : Base de données par défaut créée au lancement (test_db).
	•	PGADMIN_DEFAULT_EMAIL & PGADMIN_DEFAULT_PASSWORD : Identifiants pour se connecter à pgAdmin.
```

🗂️ Volumes

Les données PostgreSQL sont sauvegardées de manière persistante grâce au volume :

volumes:
postgres-data:

Voilà ! Vous avez PostgreSQL et pgAdmin configurés et prêts à être utilisés dans vos projets avec Docker. 🚀
