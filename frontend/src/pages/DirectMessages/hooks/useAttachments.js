// Hook personnalisé pour gérer les pièces jointes
import { useState, useCallback, useRef } from "react";
import { getCompleteFileUrl } from "../utils/fileUtils";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.83:3000";

/**
 * Hook pour gérer les pièces jointes des messages
 * @returns {Object} - États et fonctions liés aux pièces jointes
 */
export const useAttachments = () => {
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Gère la sélection d'un fichier
   * @param {Event} e - Événement de changement de fichier
   */
  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFile(true);

    try {
      const token = localStorage.getItem("token");
      const uploads = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${API_URL}/api/files/private-message-attachment`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur lors de l'upload du fichier ${file.name}`);
        }

        const data = await response.json();
        uploads.push({
          id_fichier: data.id_fichier,
          nom_fichier: data.nom_fichier || file.name,
          type: file.type,
          taille_fichier: file.size,
          url: data.url,
        });
      }

      setAttachments((prev) => [...prev, ...uploads]);
      // Réinitialiser le champ file input
      e.target.value = "";
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Une erreur est survenue lors de l'upload du fichier");
    } finally {
      setUploadingFile(false);
    }
  }, []);

  /**
   * Déclenche le sélecteur de fichier
   */
  const handleAttachmentClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  /**
   * Télécharge un fichier
   * @param {string} fileUrl - URL du fichier
   * @param {string} fileName - Nom du fichier
   */
  const handleDownloadFile = useCallback((fileUrl, fileName) => {
    const completeUrl = getCompleteFileUrl(fileUrl);

    const a = document.createElement("a");
    a.href = completeUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  /**
   * Supprime une pièce jointe
   * @param {number} index - Index de la pièce jointe à supprimer
   */
  const removeAttachment = useCallback((index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Récupère les pièces jointes d'un message
   * @param {string} messageId - ID du message
   * @returns {Array} - Liste des pièces jointes
   */
  const fetchMessageAttachments = useCallback(async (messageId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/private-messages/${messageId}/attachments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des pièces jointes");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur:", error);
      return [];
    }
  }, []);

  /**
   * Réinitialise les pièces jointes
   */
  const resetAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return {
    attachments,
    setAttachments,
    uploadingFile,
    fileInputRef,
    handleFileSelect,
    handleAttachmentClick,
    handleDownloadFile,
    removeAttachment,
    fetchMessageAttachments,
    resetAttachments,
  };
};
