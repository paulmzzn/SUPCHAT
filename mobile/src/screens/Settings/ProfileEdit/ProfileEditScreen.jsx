import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme/ThemeContext';
import { getStyles } from './ProfileEditScreen.styles';
import env from '../../../config/env';

const ProfileEditScreen = ({ navigation }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${env.API_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setName(data.nom || data.name || '');
        setEmail(data.email || '');
        setBio(data.bio || '');
        setAvatarUrl(data.photo_url || null);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch profile:', response.status, errorData.message);
        Alert.alert("Erreur", "Impossible de récupérer les informations du profil.");
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert("Erreur", "Impossible de charger les informations du profil.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "Vous devez autoriser l'accès à votre galerie photos pour changer votre photo de profil.");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
        setImageFile({
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile-image.jpg',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la sélection de l'image.");
    }
  };

  const handleSubmit = async () => {
    if (name.trim() === '') {
      Alert.alert("Erreur", "Le nom ne peut pas être vide.");
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour effectuer cette action.");
        setSaving(false);
        return;
      }

      // Pour le moment, nous n'utilisons pas FormData pour éviter les problèmes avec l'image
      // En attendant, nous envoyons directement un JSON
      const response = await fetch(`${env.API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: name, // Correction du nom du champ (nom au lieu de name)
          bio: bio
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Succès", 
          "Profil mis à jour avec succès !",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        const errorData = await response.json();
        console.error('Erreur mise à jour profil:', response.status, errorData);
        Alert.alert("Erreur", errorData.message || "Une erreur s'est produite lors de la mise à jour du profil.");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la mise à jour du profil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={styles.rightHeaderPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </Text>
            )}
            <View style={styles.editAvatarButtonOverlay}>
              <View style={styles.editAvatarButton}>
                <Ionicons name="camera" size={22} color={themeColors.textOnAccent} />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Appuyez pour changer de photo</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor={themeColors.textPlaceholder}
          />

          <Text style={styles.label}>Biographie</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Parlez-nous de vous..."
            placeholderTextColor={themeColors.textPlaceholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            editable={false}
            placeholderTextColor={themeColors.textPlaceholder}
          />
          <Text style={styles.noteText}>
            L'adresse email ne peut pas être modifiée
          </Text>

          <TouchableOpacity 
            style={[
              styles.saveButton,
              saving && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={themeColors.textOnAccent} />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileEditScreen;