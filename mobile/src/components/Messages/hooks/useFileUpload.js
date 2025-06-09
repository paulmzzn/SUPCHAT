import { useState, useCallback } from "react";

export const useFileUpload = ({ 
  currentUserId, 
  userId, 
  setMessages, 
  addAnimatingMessage, 
  scrollToBottom, 
  saveConversationTimestamp 
}) => {
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileSelected = useCallback((file) => {
    console.log('Fichier sélectionné:', file);
  }, []);

  const handleUploadProgress = useCallback((isUploading) => {
    setUploadingFile(isUploading);
  }, []);

  const handleUploadComplete = useCallback((result) => {
    console.log('Upload terminé:', result);
    
    if (result.message_prive && result.fichier) {
      const optimisticMessageWithAttachment = {
        id_message_prive: `temp-upload-${Date.now()}`,
        contenu: result.message_prive.contenu || "",
        fk_expediteur: currentUserId,
        fk_destinataire: userId,
        date_envoi: new Date().toISOString(),
        isOptimistic: true,
        isFileUpload: true,
        attachments: [{
          id_fichier: result.fichier.id_fichier,
          nom_fichier: result.fichier.nom_fichier,
          type: result.fichier.type || result.fichier.mime_type,
          taille_fichier: result.fichier.taille_fichier,
          url: result.fichier.url,
          presignedUrl: result.fichier.presignedUrl
        }]
      };

      setMessages((prev) => [...prev, optimisticMessageWithAttachment]);

      const messageId = optimisticMessageWithAttachment.id_message_prive;
      addAnimatingMessage(messageId);
    }
    
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
    
    saveConversationTimestamp(userId);
  }, [currentUserId, userId, setMessages, addAnimatingMessage, scrollToBottom, saveConversationTimestamp]);

  const handleUploadError = useCallback((error) => {
    console.error('Erreur d\'upload:', error);
  }, []);

  return {
    uploadingFile,
    handleFileSelected,
    handleUploadProgress,
    handleUploadComplete,
    handleUploadError,
  };
};
