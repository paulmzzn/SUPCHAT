import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../theme/ThemeContext';
import { getStyles } from './ManageWorkspaceModal.styles';
import env from '../../../config/env';

const API_URL = env.API_URL;
const S3_BASE_URL = env.S3_BASE_URL;

// Fonction pour construire l'URL complète d'une image
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // URL complète
  if (imagePath.startsWith('file://') || imagePath.startsWith('content://')) return imagePath; // URI locale
  return `${S3_BASE_URL}${imagePath}`; // Ajouter la base URL S3
};

const ManageWorkspaceModal = ({ 
  visible, 
  onClose, 
  workspaceId, 
  workspaceName,
  description,
  isPrivate,
  iconUrl,
  bannerUrl,
  onWorkspaceUpdated
}) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const [name, setName] = useState(workspaceName || '');
  const [workspaceDescription, setWorkspaceDescription] = useState(description || '');
  const [visibility, setVisibility] = useState(isPrivate ? 'private' : 'public');
  const [icon, setIcon] = useState(iconUrl);
  const [banner, setBanner] = useState(bannerUrl);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Vérifier s'il y a des changements
  useEffect(() => {
    const changes = 
      name !== workspaceName ||
      workspaceDescription !== description ||
      visibility !== (isPrivate ? 'private' : 'public') ||
      icon !== iconUrl ||
      banner !== bannerUrl;
    setHasChanges(changes);
  }, [name, workspaceDescription, visibility, icon, banner, workspaceName, description, isPrivate, iconUrl, bannerUrl]);

  // Réinitialiser les valeurs quand la modal s'ouvre
  useEffect(() => {
    if (visible) {
      setName(workspaceName || '');
      setWorkspaceDescription(description || '');
      setVisibility(isPrivate ? 'private' : 'public');
      setIcon(iconUrl);
      setBanner(bannerUrl);
    }
  }, [visible, workspaceName, description, isPrivate, iconUrl, bannerUrl]);

  // Sélectionner une image
  const selectImage = async (type) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission requise', 'L\'accès à la galerie photo est requis pour changer l\'image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'icon' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'icon') {
          setIcon(result.assets[0].uri);
        } else {
          setBanner(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sélectionner l\'image'
      });
    }
  };

  // Supprimer une image
  const removeImage = (type) => {
    if (type === 'icon') {
      setIcon(null);
    } else {
      setBanner(null);
    }
  };

  // Sauvegarder les modifications
  const saveChanges = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Le nom du workspace est requis'
      });
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      // Déterminer si on a des images à envoyer
      const hasNewImages = (icon && icon.startsWith('file://')) || (banner && banner.startsWith('file://'));

      // D'abord, mettre à jour les données textuelles
      const updateData = {
        nom: name.trim(),
        description: workspaceDescription.trim(),
        is_private: visibility === 'private'
      };

      // Gestion de la suppression d'images (seulement si pas de nouvelles images)
      if (!hasNewImages) {
        if (!icon && iconUrl) {
          updateData.remove_icon = true;
        }
        if (!banner && bannerUrl) {
          updateData.remove_banner = true;
        }
      }

      console.log('Sending JSON data for workspace update:', updateData);

      // Mettre à jour les données textuelles avec PUT
      let response = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Text update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error('Impossible de mettre à jour les informations du workspace');
      }

      let updatedWorkspace = await response.json();

      // Si on a des nouvelles images, les envoyer séparément
      if (hasNewImages) {
        const formData = new FormData();

        // Ajouter les images si elles ont changé
        if (icon && icon !== iconUrl && icon.startsWith('file://')) {
          const filename = icon.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
          
          formData.append('icon', {
            uri: icon,
            type: type,
            name: `icon.${match ? match[1] : 'jpg'}`,
          });
        }

        if (banner && banner !== bannerUrl && banner.startsWith('file://')) {
          const filename = banner.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
          
          formData.append('banner', {
            uri: banner,
            type: type,
            name: `banner.${match ? match[1] : 'jpg'}`,
          });
        }

        console.log('Sending images for workspace update...');

        // Utiliser l'endpoint spécifique pour les images
        const imageResponse = await fetch(`${API_URL}/api/workspaces/${workspaceId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        console.log('Image update response status:', imageResponse.status);

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          console.log('Image error response:', errorText);
          throw new Error('Impossible de mettre à jour les images du workspace');
        }

        const imageResult = await imageResponse.json();
        // Fusionner les résultats
        updatedWorkspace = { ...updatedWorkspace, ...imageResult };
      }

      // Gérer la suppression d'images si nécessaire
      if (!hasNewImages) {
        if ((!icon && iconUrl) || (!banner && bannerUrl)) {
          // Les suppressions sont déjà gérées dans l'update JSON ci-dessus
          console.log('Image removals handled in text update');
        }
      }

      console.log('Final updated workspace:', updatedWorkspace);

      Toast.show({
        type: 'success',
        text1: 'Workspace modifié',
        text2: 'Les modifications ont été sauvegardées'
      });

      // Notifier le parent que le workspace a été mis à jour
      if (onWorkspaceUpdated) {
        onWorkspaceUpdated(updatedWorkspace);
      }

      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification du workspace:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de modifier le workspace'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Modifications non sauvegardées',
        'Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?',
        [
          { text: 'Continuer à modifier', style: 'cancel' },
          { text: 'Fermer sans sauvegarder', style: 'destructive', onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* En-tête */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Modifier le workspace</Text>
            <TouchableOpacity
              style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
              onPress={saveChanges}
              disabled={loading || !hasChanges}
            >
              {loading ? (
                <ActivityIndicator size="small" color={themeColors.textOnAccent} />
              ) : (
                <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
                  Sauvegarder
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Nom du workspace */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nom du workspace</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Nom du workspace"
                placeholderTextColor={themeColors.textSecondary}
                maxLength={50}
              />
              <Text style={styles.characterCount}>{name.length}/50</Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={workspaceDescription}
                onChangeText={setWorkspaceDescription}
                placeholder="Description du workspace (optionnel)"
                placeholderTextColor={themeColors.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
              <Text style={styles.characterCount}>{workspaceDescription.length}/200</Text>
            </View>

            {/* Icône du workspace */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Icône du workspace</Text>
              <View style={styles.imageContainer}>
                {icon ? (
                  <View style={styles.imagePreview}>
                    <Image 
                      source={{ uri: getImageUrl(icon) }} 
                      style={styles.iconImage}
                      onError={(error) => {
                        console.log('Error loading icon in modal:', error.nativeEvent.error);
                        console.log('Attempted to load icon URL:', getImageUrl(icon));
                      }}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage('icon')}
                    >
                      <Ionicons name="close-circle" size={24} color={themeColors.danger} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.imagePlaceholder, styles.iconPlaceholder]}>
                    <Ionicons name="image-outline" size={32} color={themeColors.textMuted} />
                    <Text style={styles.placeholderText}>Aucune icône</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.selectImageButton}
                  onPress={() => selectImage('icon')}
                >
                  <Ionicons name="camera" size={18} color={themeColors.textOnAccent} />
                  <Text style={styles.selectImageText}>
                    {icon ? 'Changer l\'icône' : 'Ajouter une icône'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bannière du workspace */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bannière du workspace</Text>
              <View style={styles.imageContainer}>
                {banner ? (
                  <View style={styles.imagePreview}>
                    <Image 
                      source={{ uri: getImageUrl(banner) }} 
                      style={styles.bannerImage}
                      onError={(error) => {
                        console.log('Error loading banner in modal:', error.nativeEvent.error);
                        console.log('Attempted to load banner URL:', getImageUrl(banner));
                      }}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage('banner')}
                    >
                      <Ionicons name="close-circle" size={24} color={themeColors.danger} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.imagePlaceholder, styles.bannerPlaceholder]}>
                    <Ionicons name="image-outline" size={32} color={themeColors.textMuted} />
                    <Text style={styles.placeholderText}>Aucune bannière</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.selectImageButton}
                  onPress={() => selectImage('banner')}
                >
                  <Ionicons name="camera" size={18} color={themeColors.textOnAccent} />
                  <Text style={styles.selectImageText}>
                    {banner ? 'Changer la bannière' : 'Ajouter une bannière'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.imageHint}>
                Recommandé: 800x450px ou ratio 16:9
              </Text>
            </View>

            {/* Visibilité */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Visibilité</Text>
              <View style={styles.visibilityContainer}>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === 'public' && styles.visibilityOptionSelected
                  ]}
                  onPress={() => setVisibility('public')}
                >
                  <View style={styles.visibilityIcon}>
                    <Ionicons 
                      name="globe" 
                      size={20} 
                      color={visibility === 'public' ? themeColors.textOnAccent : themeColors.textSecondary} 
                    />
                  </View>
                  <View style={styles.visibilityContent}>
                    <Text style={[
                      styles.visibilityTitle,
                      visibility === 'public' && styles.visibilityTitleSelected
                    ]}>
                      Public
                    </Text>
                    <Text style={styles.visibilityDescription}>
                      Tout le monde peut voir et rejoindre ce workspace
                    </Text>
                  </View>
                  {visibility === 'public' && (
                    <Ionicons name="checkmark-circle" size={20} color={themeColors.accentPrimary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === 'private' && styles.visibilityOptionSelected
                  ]}
                  onPress={() => setVisibility('private')}
                >
                  <View style={styles.visibilityIcon}>
                    <Ionicons 
                      name="lock-closed" 
                      size={20} 
                      color={visibility === 'private' ? themeColors.textOnAccent : themeColors.textSecondary} 
                    />
                  </View>
                  <View style={styles.visibilityContent}>
                    <Text style={[
                      styles.visibilityTitle,
                      visibility === 'private' && styles.visibilityTitleSelected
                    ]}>
                      Privé
                    </Text>
                    <Text style={styles.visibilityDescription}>
                      Seules les personnes invitées peuvent voir ce workspace
                    </Text>
                  </View>
                  {visibility === 'private' && (
                    <Ionicons name="checkmark-circle" size={20} color={themeColors.accentPrimary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default ManageWorkspaceModal;
