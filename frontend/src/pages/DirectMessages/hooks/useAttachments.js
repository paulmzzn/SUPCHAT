// Hook personnalisé pour gérer les pièces jointes
import { useState, useCallback, useRef } from "react";
import { getCompleteFileUrl } from "../utils/fileUtils";

const API_URL = process.env.REACT_APP_API_URL || "http://192.168.1.68:3000";

/**
 * Hook pour gérer les pièces jointes des messages (DM ou channel)
 * @param {Object} options - { mode: 'dm' | 'channel', canalId, workspaceId, recipientId, socket }
 * @returns {Object}
 */
export const useAttachments = (options = {}) => {
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const {
    mode = "dm",
    canalId,
    workspaceId,
    recipientId,
    socket,
    setMessages = () => {},
    setNewMessage = () => {},
    setReplyingTo = () => {},
  } = options;

  /**
   * Gère la sélection d'un fichier (upload DM ou channel)
   * @param {Event} e - Événement de changement de fichier
   */
  const handleFileSelect = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      console.log("[useAttachments] Fichiers sélectionnés:", files);
      if (files.length === 0) return;

      setUploadingFile(true);

      try {
        const token = localStorage.getItem("token");
        const uploads = [];
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          let uploadUrl = "";
          if (mode === "channel" && canalId && workspaceId) {
            uploadUrl = `${API_URL}/api/messages/upload`;
            formData.append("canalId", canalId);
            formData.append("workspaceId", workspaceId);
            console.log(
              "[useAttachments] Mode channel, url:",
              uploadUrl,
              "canalId:",
              canalId,
              "workspaceId:",
              workspaceId
            );
          } else {
            uploadUrl = `${API_URL}/api/private-messages/upload`;
            formData.append("recipientId", recipientId);
            // Optionnel: formData.append("message", "");
            console.log(
              "[useAttachments] Mode DM, url:",
              uploadUrl,
              "recipientId:",
              recipientId
            );
          }
          for (let pair of formData.entries()) {
            console.log("[useAttachments] FormData:", pair[0], pair[1]);
          }
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
          console.log(
            "[useAttachments] Status de la réponse:",
            response.status
          );
          if (!response.ok) {
            let errText = await response.text();
            console.error(
              "[useAttachments] Erreur HTTP:",
              response.status,
              errText
            );
            throw new Error(
              `Erreur lors de l'upload du fichier ${file.name}: ${errText}`
            );
          }
          const data = await response.json();
          if (data.message_prive) {
            let attachments = [];
            try {
              attachments = await fetchMessageAttachments(
                data.message_prive.id_message_prive
              );
            } catch (err) {
              attachments = [];
            }
            setMessages((prev) => [
              ...prev,
              { ...data.message_prive, attachments },
            ]);
            setNewMessage("");
            setReplyingTo(null);
            setAttachments([]);
            return;
          }
          console.log("[useAttachments] Réponse JSON:", data);

          // Debug: analyser la structure de la réponse
          console.log("[useAttachments] Debug structure réponse:", {
            hasUrl: !!data.url,
            url: data.url,
            hasFichier: !!data.fichier,
            fichierUrl: data.fichier?.url,
            presignedUrl: data.presignedUrl || data.fichier?.presignedUrl,
            completeData: data,
          });

          // Ajouter le fichier uploadé à la liste des uploads
          uploads.push({
            id_fichier:
              data.id_fichier || (data.fichier && data.fichier.id_fichier),
            nom_fichier:
              data.nom_fichier ||
              (data.fichier && data.fichier.nom_fichier) ||
              file.name,
            type: file.type,
            taille_fichier: file.size,
            url: data.url || (data.fichier && data.fichier.url),
            presignedUrl:
              data.presignedUrl || (data.fichier && data.fichier.presignedUrl),
          });
        } // Après l'upload de tous les fichiers, envoyer DIRECTEMENT le message par socket
        if (socket && uploads.length > 0 && recipientId) {
          console.log("[useAttachments] Envoi direct via WebSocket:", {
            socket: !!socket,
            uploads,
            recipientId,
          });

          // Envoyer un message vide avec les pièces jointes
          socket.emit("privateMessage", {
            destinataireId: recipientId,
            contenu: "", // Message vide
            attachments: uploads.map((a) => a.id_fichier),
          });

          // Ne pas mettre à jour l'état local des attachments puisqu'ils sont déjà envoyés
        } else {
          console.warn(
            "[useAttachments] Impossible d'envoyer directement via socket:",
            {
              socketPresent: !!socket,
              uploadsCount: uploads.length,
              recipientId,
            }
          );
          // Si pas de socket ou pas de destinataire, on met quand même à jour l'état
          setAttachments((prev) => [...prev, ...uploads]);
        }

        // Réinitialiser le champ file input
        e.target.value = "";
        console.log(
          "[useAttachments] Upload terminé, pièces jointes:",
          uploads
        );
      } catch (error) {
        console.error("[useAttachments] Erreur lors de l'upload:", error);
        alert(
          "Une erreur est survenue lors de l'upload du fichier : " +
            error.message
        );
      } finally {
        setUploadingFile(false);
        console.log("[useAttachments] Fin de handleFileSelect");
      }
    },
    [mode, canalId, workspaceId, recipientId, socket]
  );

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
   * Déclenche le sélecteur de fichier local
   */
  const handleLocalFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  /**
   * DEPRECATED: Utilisez handleLocalFileSelect ou handleGoogleDriveFiles
   * Maintenu pour compatibilité, mais déclenche maintenant la sélection de source
   */
  const handleAttachmentClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  /**
   * Télécharge un fichier (via l'API sécurisée backend)
   * @param {string} fileUrl - URL du fichier (S3 ou relative)
   * @param {string} fileName - Nom du fichier
   */ const handleDownloadFile = useCallback(async (fileUrl, fileName) => {
    if (!fileUrl) {
      console.error("[useAttachments] Erreur: URL de fichier manquante");
      alert("Erreur: URL de fichier manquante");
      return;
    }

    // Log pour debug
    console.log("[useAttachments] Téléchargement de fichier demandé:", {
      fileUrl,
      fileName,
    }); // Gestion spéciale pour les chemins de fichiers des messages privés
    let filePath = fileUrl;

    // Détection et extraction du chemin pour les messages privés
    if (fileUrl && fileUrl.includes("private-messages/files/")) {
      const privateMessageMatch = fileUrl.match(
        /private-messages\/files\/([^\/]+)$/
      );
      if (privateMessageMatch) {
        filePath = `private-messages/files/${privateMessageMatch[1]}`;
        console.log("[useAttachments] Chemin message privé extrait:", filePath);
      }
    }
    // Extraction pour les URLs S3 standard
    else if (fileUrl && fileUrl.includes("s3-supchat")) {
      // Plusieurs tentatives d'extraction de chemins S3
      const s3CloudMatch = fileUrl.match(
        /s3-supchat\.s3\.fr-par\.scw\.cloud\/(.+)$/
      );
      const s3Match = fileUrl.match(/s3-supchat\/(.+)$/);

      if (s3CloudMatch) {
        filePath = s3CloudMatch[1];
        console.log("[useAttachments] Chemin S3 cloud extrait:", filePath);
      } else if (s3Match) {
        filePath = s3Match[1];
        console.log("[useAttachments] Chemin S3 simple extrait:", filePath);
      } else {
        // Si aucun pattern ne correspond, utiliser simplement "s3-supchat/" + le nom du fichier
        filePath = `s3-supchat/private-messages/files/${fileName}`;
        console.log(
          "[useAttachments] Utilisation du chemin construit:",
          filePath
        );
      }
    }

    console.log("[useAttachments] URL originale:", fileUrl);
    console.log("[useAttachments] URL transformée:", filePath);

    // Appel API backend sécurisé avec la méthode de WorkspaceDetails
    const token = localStorage.getItem("token");
    if (!token) {
      console.error(
        "[useAttachments] Erreur: Token d'authentification manquant"
      );
      alert("Erreur: Vous devez être connecté pour télécharger des fichiers");
      return;
    }
    const downloadUrl = `${API_URL}/api/files/download/${encodeURIComponent(
      filePath
    )}`;
    console.log("[useAttachments] URL de téléchargement:", downloadUrl);

    try {
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[useAttachments] Erreur HTTP ${response.status}:`,
          errorText
        );
        throw new Error(
          `Erreur de téléchargement (${response.status}): ${errorText}`
        );
      }

      const blob = await response.blob();
      console.log("[useAttachments] Blob reçu:", blob.type, blob.size);

      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);

      console.log("[useAttachments] Téléchargement initié avec succès");
    } catch (error) {
      console.error("[useAttachments] Erreur lors du téléchargement:", error);
      alert(
        "Impossible de télécharger le fichier. Veuillez réessayer: " +
          error.message
      );
    }
  }, []);
  /**
   * Supprime une pièce jointe
   * @param {number} index - Index de la pièce jointe à supprimer
   */
  const removeAttachment = useCallback((index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
    handleLocalFileSelect,
    handleDownloadFile,
    removeAttachment,
    fetchMessageAttachments,
    resetAttachments,
  };
};
