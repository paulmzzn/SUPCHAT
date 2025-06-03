import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './CreateWorkspaceScreen.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../../config/env';

const CreateWorkspaceScreen = ({ navigation }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);
  const [iconImage, setIconImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin de votre permission pour accéder à votre galerie photo.'
      );
      return false;
    }
    return true;
  };

  const selectImage = async (type) => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Sélectionner une image',
      'Choisissez comment vous voulez ajouter votre image',
      [
        { text: 'Galerie', onPress: () => pickImage(type, 'library') },
        { text: 'Appareil photo', onPress: () => pickImage(type, 'camera') },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const pickImage = async (type, source) => {
    try {
      let result;
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      };

      // Seulement l'icône utilise l'éditeur avec format carré
      if (type === 'icon') {
        options.allowsEditing = true;
        options.aspect = [1, 1];
      }
      // La bannière n'utilise pas l'éditeur pour éviter les contraintes

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', 'Permission d\'accès à l\'appareil photo refusée');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        if (type === 'icon') {
          setIconImage(result.assets[0]);
        } else {
          setBannerImage(result.assets[0]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removeImage = (type) => {
    if (type === 'icon') {
      setIconImage(null);
    } else {
      setBannerImage(null);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom du workspace est requis');
      return false;
    }
    if (formData.name.trim().length < 3) {
      Alert.alert('Erreur', 'Le nom du workspace doit contenir au moins 3 caractères');
      return false;
    }
    if (formData.name.trim().length > 50) {
      Alert.alert('Erreur', 'Le nom du workspace ne peut pas dépasser 50 caractères');
      return false;
    }
    return true;
  };

  const handleCreateWorkspace = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour créer un workspace');
        return;
      }

      // Créer d'abord le workspace sans les images
      const response = await fetch(`${env.API_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: formData.name.trim(),
          description: formData.description.trim() || null,
          is_private: formData.isPrivate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Impossible de créer le workspace');
        return;
      }

      const newWorkspace = await response.json();

      // Upload des images si présentes (comme dans la version web)
      if (iconImage || bannerImage) {
        try {
          const imageFormData = new FormData();

          if (bannerImage) {
            setUploadingBanner(true);
            imageFormData.append('banner', {
              uri: bannerImage.uri,
              type: bannerImage.type || 'image/jpeg',
              name: bannerImage.fileName || 'banner.jpg',
            });
          }

          if (iconImage) {
            setUploadingIcon(true);
            imageFormData.append('icon', {
              uri: iconImage.uri,
              type: iconImage.type || 'image/jpeg',
              name: iconImage.fileName || 'icon.jpg',
            });
          }

          const imageResponse = await fetch(
            `${env.API_URL}/api/workspaces/${newWorkspace.id_workspace}/images`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
              body: imageFormData,
            }
          );

          if (!imageResponse.ok) {
            console.warn('Workspace créé mais les images n\'ont pas pu être uploadées');
          }
        } catch (imageError) {
          console.error('Error uploading images:', imageError);
          // Ne pas bloquer la création du workspace si l'upload des images échoue
        } finally {
          setUploadingIcon(false);
          setUploadingBanner(false);
        }
      }

      Alert.alert(
        'Succès',
        'Workspace créé avec succès !',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              // Optionnel : naviguer directement vers le nouveau workspace
              // navigation.navigate('WorkspaceChannels', { workspaceId: newWorkspace.id_workspace });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating workspace:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la création du workspace');
    } finally {
      setLoading(false);
      setUploadingIcon(false);
      setUploadingBanner(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un workspace</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations de base</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom du workspace *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Entrez le nom du workspace"
              placeholderTextColor={themeColors.textPlaceholder}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              maxLength={50}
            />
            <Text style={styles.inputHint}>
              {formData.name.length}/50 caractères
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (optionnel)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Décrivez brièvement votre workspace"
              placeholderTextColor={themeColors.textPlaceholder}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.inputHint}>
              {formData.description.length}/200 caractères
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personnalisation</Text>
          
          {/* Section Icône */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Icône du workspace</Text>
            <View style={styles.imageUploadContainer}>
              {iconImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: iconImage.uri }} style={styles.iconPreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage('icon')}
                  >
                    <MaterialIcons name="close" size={16} color={themeColors.textOnAccent} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.imageUploadButton}
                  onPress={() => selectImage('icon')}
                  disabled={uploadingIcon}
                >
                  {uploadingIcon ? (
                    <ActivityIndicator size="small" color={themeColors.accentPrimary} />
                  ) : (
                    <>
                      <MaterialIcons name="add-photo-alternate" size={32} color={themeColors.accentPrimary} />
                      <Text style={styles.imageUploadText}>Ajouter une icône</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.inputHint}>Format carré recommandé (1:1)</Text>
          </View>

          {/* Section Bannière */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bannière du workspace</Text>
            <View style={styles.imageUploadContainer}>
              {bannerImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: bannerImage.uri }} style={styles.bannerPreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage('banner')}
                  >
                    <MaterialIcons name="close" size={16} color={themeColors.textOnAccent} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.imageUploadButton, styles.bannerUploadButton]}
                  onPress={() => selectImage('banner')}
                  disabled={uploadingBanner}
                >
                  {uploadingBanner ? (
                    <ActivityIndicator size="small" color={themeColors.accentPrimary} />
                  ) : (
                    <>
                      <MaterialIcons name="add-photo-alternate" size={32} color={themeColors.accentPrimary} />
                      <Text style={styles.imageUploadText}>Ajouter une bannière</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.inputHint}>Format libre - l'image sera utilisée telle quelle</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Workspace privé</Text>
              <Text style={styles.switchDescription}>
                {formData.isPrivate 
                  ? 'Seules les personnes invitées peuvent rejoindre ce workspace'
                  : 'Tout le monde peut découvrir et rejoindre ce workspace'
                }
              </Text>
            </View>
            <Switch
              value={formData.isPrivate}
              onValueChange={(value) => handleInputChange('isPrivate', value)}
              trackColor={{ false: themeColors.switchTrackFalse, true: themeColors.accentPrimary }}
              thumbColor={formData.isPrivate ? themeColors.switchThumbTrue : themeColors.switchThumbFalse}
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color={themeColors.accentPrimary} />
            <Text style={styles.infoText}>
              Après création, vous pourrez ajouter des canaux, inviter des membres et personnaliser votre workspace.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.createButton,
            !formData.name.trim() && styles.createButtonDisabled,
            loading && styles.createButtonDisabled
          ]}
          onPress={handleCreateWorkspace}
          disabled={!formData.name.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={themeColors.textOnAccent} />
          ) : (
            <>
              <MaterialIcons name="add" size={20} color={themeColors.textOnAccent} />
              <Text style={styles.createButtonText}>Créer le workspace</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateWorkspaceScreen;