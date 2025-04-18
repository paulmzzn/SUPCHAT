import axios from "axios";

// Utilisez une fonction pour obtenir l'URL API dynamiquement
const getApiUrl = () => {
  // Vérifiez si le backend est sur un port différent en développement
  const backendPort = 3000; // Vous pouvez le configurer à partir d'une variable d'environnement frontend
  return `http://localhost:${backendPort}/api/upload`;
};

const uploadService = {
  // Uploader une image générique
  uploadImage: async (file) => {
    try {
      console.log("Préparation de l'upload de l'image:", file.name);
      const formData = new FormData();
      formData.append("image", file);

      const API_URL = getApiUrl();
      console.log("Envoi de la requête à:", `${API_URL}/image`);

      const response = await axios.post(`${API_URL}/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Réponse du serveur:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur détaillée lors de l'upload d'image:", error);
      if (error.response) {
        console.error("Données d'erreur:", error.response.data);
        console.error("Status d'erreur:", error.response.status);
      } else if (error.request) {
        console.error("Pas de réponse reçue:", error.request);
      }
      throw error;
    }
  },

  // Uploader un avatar d'utilisateur
  uploadAvatar: async (userId, file) => {
    try {
      console.log(
        `Préparation de l'upload d'avatar pour l'utilisateur ${userId}:`,
        file.name
      );
      const formData = new FormData();
      formData.append("avatar", file);

      const API_URL = getApiUrl();
      console.log("Envoi de la requête à:", `${API_URL}/avatar/${userId}`);

      const response = await axios.post(
        `${API_URL}/avatar/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Réponse du serveur:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur détaillée lors de l'upload d'avatar:", error);
      if (error.response) {
        console.error("Données d'erreur:", error.response.data);
        console.error("Status d'erreur:", error.response.status);
      } else if (error.request) {
        console.error("Pas de réponse reçue:", error.request);
      }
      throw error;
    }
  },
};

export default uploadService;
