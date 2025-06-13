import React, { useState } from 'react';
import { View, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../../config/env';

const FileUploader = ({ 
  onFileSelected, 
  onUploadProgress, 
  onUploadComplete, 
  onUploadError,
  uploadType = 'private-message', // 'private-message', 'workspace', ou 'workspace-message'
  recipientId = null,
  workspaceId = null,
  channelId = null, // Ajouté pour les uploads dans les workspaces
  iconSize = 24,
  iconColor = '#666',
  disabled = false,
  style = {}
}) => {
  const [uploading, setUploading] = useState(false);

  const showPickerOptions = () => {
    if (disabled || uploading) return;

    Alert.alert(
      "Sélectionner un fichier",
      "Choisissez le type de fichier à uploader",
      [
        {
          text: "Photo/Vidéo",
          onPress: handleImagePicker
        },
        {
          text: "Document",
          onPress: handleDocumentPicker
        },
        {
          text: "Annuler",
          style: "cancel"
        }
      ]
    );
  };

  const handleImagePicker = async () => {
    try {
      // Demander les permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "Vous devez autoriser l'accès à la galerie pour sélectionner une image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false, // Pas d'édition forcée
        quality: 0.8, // Qualité réduite pour optimiser la taille
        allowsMultipleSelection: false, // Une seule sélection à la fois
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadFile({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la sélection de l'image.");
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la sélection du document.");
    }
  };

  const uploadFile = async (file) => {
    if (!file || !file.uri) {
      Alert.alert("Erreur", "Fichier invalide.");
      return;
    }

    setUploading(true);
    
    try {
      onUploadProgress?.(true);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      // LOGS DE DEBUG DÉTAILLÉS
      console.log('=== DEBUG UPLOAD START ===');
      console.log('uploadType reçu:', uploadType);
      console.log('recipientId reçu:', recipientId);
      console.log('workspaceId reçu:', workspaceId);
      console.log('channelId reçu:', channelId);
      console.log('===========================');

      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type
      });

      // Déterminer l'endpoint et les paramètres selon le type d'upload
      let endpoint;
      
      if (uploadType === 'private-message') {
        console.log('Entrant dans la condition private-message');
        endpoint = `${env.API_URL}/api/private-messages/upload`;
        // Vérifier si recipientId est défini pour les messages privés
        if (recipientId) {
          console.log('recipientId trouvé:', recipientId, 'Type:', typeof recipientId);
          formData.append('recipientId', String(recipientId)); // Conversion explicite en string
          console.log('recipientId ajouté au FormData');
        } else {
          console.log('recipientId manquant! Valeur reçue:', recipientId);
          throw new Error("recipientId manquant pour l'upload de message privé");
        }
      } else if (uploadType === 'workspace' || uploadType === 'workspace-message') {
        console.log('Entrant dans la condition workspace/workspace-message');
        endpoint = `${env.API_URL}/api/messages/upload`;
        // Vérifier les paramètres nécessaires pour les workspaces
        if (workspaceId) {
          console.log('workspaceId trouvé:', workspaceId);
          formData.append('workspaceId', workspaceId);
        } else {
          console.log('workspaceId manquant! Valeur reçue:', workspaceId);
          throw new Error("workspaceId manquant pour l'upload de workspace");
        }
        
        if (channelId) {
          console.log('channelId trouvé:', channelId);
          formData.append('canalId', channelId);
        } else {
          console.log('channelId manquant! Valeur reçue:', channelId);
          throw new Error("channelId manquant pour l'upload de workspace");
        }
      } else {
        console.log('Aucune condition matched! uploadType:', uploadType);
        throw new Error("Type d'upload non supporté");
      }

      console.log('Upload vers:', endpoint);
      console.log('Fichier:', { name: file.name, type: file.type });
      console.log('Type d\'upload:', uploadType);
      console.log('Paramètres:', uploadType === 'workspace' || uploadType === 'workspace-message' ? 
        { workspaceId, channelId } : { recipientId });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('Réponse brute du serveur:', responseText);

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('Upload réussi:', result);

      // Notifier le composant parent
      onFileSelected?.(file);
      onUploadComplete?.(result);

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      Alert.alert("Erreur d'upload", error.message || "Une erreur s'est produite lors de l'upload.");
      onUploadError?.(error);
    } finally {
      setUploading(false);
      onUploadProgress?.(false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={showPickerOptions}
      disabled={disabled || uploading}
      style={[
        {
          opacity: (disabled || uploading) ? 0.5 : 1,
          padding: 8,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style
      ]}
    >
      <Ionicons 
        name={uploading ? "cloud-upload" : "attach"} 
        size={iconSize} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
};

export default FileUploader;