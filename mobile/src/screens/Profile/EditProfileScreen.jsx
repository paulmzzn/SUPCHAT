import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './EditProfileScreen.styles';
import env from '../../config/env';
import { StatusBar } from 'expo-status-bar';

const EditProfileScreen = ({ navigation }) => {
  const { colors: themeColors, themeMode } = useTheme();
  const styles = getStyles(themeColors);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Email might not be editable or require special handling
  const [avatar, setAvatar] = useState(null); // URI for local image or URL for remote
  const [initialAvatar, setInitialAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${env.API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setName(data.nom || '');
          setEmail(data.email || '');
          setAvatar(data.photo_url);
          setInitialAvatar(data.photo_url);
        } else {
          Alert.alert('Erreur', 'Impossible de charger le profil.');
        }
      } catch (e) {
        Alert.alert('Erreur', 'Problème de connexion.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Désolé, nous avons besoin des permissions de la galerie pour cela.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    setError('');
    setSaving(true);

    const formData = new FormData();
    formData.append('nom', name);
    // formData.append('email', email); // Only if email is editable

    if (avatar && avatar !== initialAvatar) {
        const uriParts = avatar.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('avatar', {
          uri: avatar,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        });
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' // This is set automatically by fetch with FormData
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Succès', 'Profil mis à jour.');
        navigation.goBack();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la mise à jour.');
        Alert.alert('Erreur', errorData.message || 'Impossible de mettre à jour le profil.');
      }
    } catch (e) {
      console.error("Save profile error:", e);
      setError('Problème de connexion.');
      Alert.alert('Erreur', 'Problème de connexion.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -100} // Adjust as needed
    >
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarPlaceholderText}>{name.charAt(0).toUpperCase() || 'U'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={styles.changeAvatarButton}>
            <Ionicons name="camera-outline" size={20} color={themeColors.textPrimary} />
            <Text style={styles.changeAvatarText}>Changer la photo</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nom complet</Text>
          <View style={[styles.inputContainer, nameInputRef.current?.isFocused() && styles.inputContainerFocused]}>
            <Ionicons name="person-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              ref={nameInputRef}
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom complet"
              placeholderTextColor={themeColors.textPlaceholder}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={[styles.inputContainer, emailInputRef.current?.isFocused() && styles.inputContainerFocused]}>
            <Ionicons name="mail-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              ref={emailInputRef}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Votre adresse email"
              placeholderTextColor={themeColors.textPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false} // Typically email is not directly editable or requires verification
              selectTextOnFocus={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={themeColors.textOnAccent} />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;
