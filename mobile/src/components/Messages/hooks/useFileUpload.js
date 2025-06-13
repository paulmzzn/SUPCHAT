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
    
    // LOGIQUE SIMPLIFIÉE: Le backend a déjà créé le message privé avec la pièce jointe
    // et l'a envoyé via WebSocket. Pas besoin d'envoyer un autre message.
    
    console.log('Upload terminé, le message avec pièce jointe sera reçu via WebSocket depuis le backend');
    
    // Le message complet avec pièce jointe sera reçu automatiquement via WebSocket
    // grâce à la logique backend qui émet le message après création
    
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
    
    saveConversationTimestamp(userId);
  }, [userId, scrollToBottom, saveConversationTimestamp]);

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
