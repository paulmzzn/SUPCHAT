import { useState, useCallback } from "react";
import { Alert, Linking } from "react-native";
import env from "../../../config/env";

const API_URL = env.API_URL;

export const useMediaPreview = () => {
  const [previewMedia, setPreviewMedia] = useState({
    visible: false,
    media: null,
  });

  const getFileURL = useCallback((url) => {
    if (!url) return null;

    if (url.startsWith("http://") || url.startsWith("https://")) return url;

    if (url.startsWith("private-messages/files/") || url.startsWith("private-messages/")) {
      return `${env.S3_BASE_URL}${url}`;
    }

    if (url.startsWith("/api/files/")) return `${API_URL}${url}`;

    return `${API_URL}/api/files/${url}`;
  }, []);

  const openAttachment = useCallback((attachment) => {
    try {
      const fileUrl = attachment.url || attachment.presignedUrl;
      const fullFileUrl = getFileURL(fileUrl);

      setPreviewMedia({
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
    setPreviewMedia({
      visible: false,
      media: null,
    });
  }, []);

  return {
    mediaPreview: previewMedia, // Corriger le nom pour correspondre à l'utilisation
    openAttachment,
    closePreview,
  };
};
