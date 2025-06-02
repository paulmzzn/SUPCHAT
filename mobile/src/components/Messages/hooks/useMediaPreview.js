import { useState, useCallback } from "react";
import { Alert } from "react-native";

export const useMediaPreview = () => {
  const [mediaPreview, setMediaPreview] = useState({
    visible: false,
    media: null,
  });

  const openAttachment = useCallback((attachment) => {
    try {
      const fileUrl = attachment.url || attachment.presignedUrl;
      const getFileURL = (url) => {
        if (!url) return null;
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        if (url.startsWith("private-messages/files/") || url.startsWith("private-messages/")) {
          return `https://s3-supchat.s3.fr-par.scw.cloud/${url}`;
        }
        if (url.startsWith("/api/files/")) return `${process.env.EXPO_PUBLIC_API_URL}${url}`;
        return `${process.env.EXPO_PUBLIC_API_URL}/api/files/${url}`;
      };
      const fullFileUrl = getFileURL(fileUrl);

      setMediaPreview({
        visible: true,
        media: {
          fileUrl: fullFileUrl,
          fileName: attachment.nom_fichier || "Fichier",
          fileType: attachment.type || "application/octet-stream",
        },
      });
    } catch (error) {
      console.error("Error opening attachment:", error);
      Alert.alert("Erreur", "Impossible d'ouvrir cette pièce jointe.");
    }
  }, []);

  const closePreview = useCallback(() => {
    setMediaPreview({
      visible: false,
      media: null,
    });
  }, []);

  return {
    mediaPreview,
    openAttachment,
    closePreview,
  };
};
