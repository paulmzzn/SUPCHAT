# Test de connexion à la base de données PostgreSQL
# Ce script doit être exécuté après le démarrage des conteneurs Docker

# Variables pour le code couleur
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== TEST DE CONFIGURATION DOCKER COMPOSE ===${NC}"

# Vérifier que les conteneurs sont en cours d'exécution
echo -e "\n${YELLOW}Vérification des conteneurs en cours d'exécution...${NC}"
POSTGRES_RUNNING=$(docker ps --filter "name=supchat-postgres" --format "{{.Names}}")
BACKEND_RUNNING=$(docker ps --filter "name=supchat-backend" --format "{{.Names}}")

if [ -z "$POSTGRES_RUNNING" ]; then
  echo -e "${RED}❌ Le conteneur PostgreSQL n'est pas en cours d'exécution${NC}"
else
  echo -e "${GREEN}✅ Le conteneur PostgreSQL est en cours d'exécution${NC}"
fi

if [ -z "$BACKEND_RUNNING" ]; then
  echo -e "${RED}❌ Le conteneur Backend n'est pas en cours d'exécution${NC}"
else
  echo -e "${GREEN}✅ Le conteneur Backend est en cours d'exécution${NC}"
fi

# Vérifier les logs de PostgreSQL pour détecter les erreurs
echo -e "\n${YELLOW}Recherche d'erreurs dans les logs PostgreSQL...${NC}"
POSTGRES_ERRORS=$(docker logs supchat-postgres 2>&1 | grep -i "error" | wc -l)
if [ $POSTGRES_ERRORS -gt 0 ]; then
  echo -e "${RED}⚠️ $POSTGRES_ERRORS erreurs trouvées dans les logs PostgreSQL${NC}"
  docker logs supchat-postgres 2>&1 | grep -i "error" | head -5
else
  echo -e "${GREEN}✅ Aucune erreur trouvée dans les logs PostgreSQL${NC}"
fi

# Vérifier les logs du Backend pour détecter les erreurs de connexion à la base de données
echo -e "\n${YELLOW}Recherche d'erreurs de connexion dans les logs Backend...${NC}"
DB_CONNECTION_ERRORS=$(docker logs supchat-backend 2>&1 | grep -i "connexion à PostgreSQL" | grep -i "erreur" | wc -l)
if [ $DB_CONNECTION_ERRORS -gt 0 ]; then
  echo -e "${RED}⚠️ Erreurs de connexion à la base de données détectées${NC}"
  docker logs supchat-backend 2>&1 | grep -i "connexion à PostgreSQL" | grep -i "erreur"
else
  echo -e "${GREEN}✅ Pas d'erreurs de connexion à la base de données détectées${NC}"
fi

# Exécuter le script de test de connexion à la base de données dans le conteneur backend
echo -e "\n${YELLOW}Exécution du script de test de connexion à la base de données...${NC}"
docker exec -it supchat-backend bash -c "chmod +x /app/test-db-connection.sh && /app/test-db-connection.sh"

# Vérifier la configuration réseau
echo -e "\n${YELLOW}Vérification de la configuration réseau...${NC}"
echo -e "Liste des réseaux Docker:"
docker network ls | grep supchat

echo -e "\nInspection du réseau supchat-network:"
docker network inspect supchat-network

echo -e "\n${YELLOW}=== FIN DES TESTS ===${NC}"
