import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../../config/env';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './RegisterScreen.styles';

const googleIcon = require('../../assets/google-icon.png');
const githubIcon = require('../../assets/github-icon.png');

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const { colors: themeColors, themeMode } = useTheme();
  const styles = getStyles(themeColors);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    birthDate: null
  });
  
  // Input refs for focus management
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Calculate min and max dates (16-100 years old)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 15);
  const minDate = new Date();
  minDate.setFullYear(maxDate.getFullYear() - 85);

  const updateFormField = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date) => {
    updateFormField('birthDate', date);
    hideDatePicker();
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const { name, email, password, birthDate } = formData;
    
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return false;
    }
    
    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return false;
    }
    
    if (!password || password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    if (!birthDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre date de naissance');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    Keyboard.dismiss(); // Dismiss keyboard before validation
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Format birth date for the API
      const formattedBirthDate = formData.birthDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const response = await fetch(`${env.API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: formData.name,
          email: formData.email,
          mot_de_passe: formData.password,
          date_naissance: formattedBirthDate,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store email for the verification screen
        await AsyncStorage.setItem('email', formData.email);
        
        // Navigate to code verification screen
        navigation.navigate('CodeVerification');
      } else {
        Alert.alert(
          'Erreur', 
          data.message || 'Une erreur est survenue lors de l\'inscription'
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    Alert.alert('Information', 'Inscription via Google - Fonctionnalité à venir');
  };

  const handleGithubRegister = () => {
    Alert.alert('Information', 'Inscription via GitHub - Fonctionnalité à venir');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? "light" : "dark"} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            >
              <Ionicons name="chevron-back" size={28} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Inscription</Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez SUPCHAT pour discuter avec vos amis</Text>
            
            {/* Nom */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <View style={[
                styles.inputContainer,
                formData.name.trim() && styles.inputContainerFilled
              ]}>
                <Ionicons name="person-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Jean Dupont"
                  placeholderTextColor={themeColors.textPlaceholder}
                  value={formData.name}
                  onChangeText={(text) => updateFormField('name', text)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  textContentType="name"
                  autoComplete="name"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>
            
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[
                styles.inputContainer,
                formData.email.trim() && styles.inputContainerFilled
              ]}>
                <Ionicons name="mail-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  placeholder="exemple@exemple.com"
                  placeholderTextColor={themeColors.textPlaceholder}
                  value={formData.email}
                  onChangeText={(text) => updateFormField('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  textContentType="emailAddress"
                  autoComplete="email"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>
            
            {/* Mot de passe */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mot de passe</Text>
              <View style={[
                styles.inputContainer,
                formData.password && styles.inputContainerFilled
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor={themeColors.textPlaceholder}
                  value={formData.password}
                  onChangeText={(text) => updateFormField('password', text)}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  textContentType="none"
                  autoComplete="off"
                  onSubmitEditing={() => showDatePicker()}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color={themeColors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Date de naissance */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date de naissance</Text>
              <TouchableOpacity 
                style={[
                  styles.inputContainer,
                  formData.birthDate && styles.inputContainerFilled
                ]}
                onPress={showDatePicker}
                activeOpacity={0.6}
              >
                <Ionicons name="calendar-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                <Text style={[
                  styles.datePickerText,
                  formData.birthDate ? styles.datePickerTextFilled : styles.datePickerTextPlaceholder
                ]}>
                  {formData.birthDate ? formatDate(formData.birthDate) : "Sélectionner votre date de naissance"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={hideDatePicker}
              date={formData.birthDate || maxDate}
              maximumDate={maxDate}
              minimumDate={minDate}
              buttonTextColorIOS={themeColors.accentPrimary}
              themeVariant={themeMode}
              isDarkModeEnabled={themeMode === 'dark'}
              cancelTextIOS="Annuler"
              confirmTextIOS="Confirmer"
            />
            
            {/* Bouton d'inscription */}
            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color={themeColors.textPrimary} size="small" />
              ) : (
                <Text style={styles.registerButtonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>
            
            {/* Options alternatives d'inscription */}
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>ou</Text>
              <View style={styles.orLine} />
            </View>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={handleGoogleRegister}
                activeOpacity={0.7}
              >
                <Image source={googleIcon} style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={handleGithubRegister}
                activeOpacity={0.7}
              >
                <Image source={githubIcon} style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>GitHub</Text>
              </TouchableOpacity>
            </View>
            
            {/* Lien vers la connexion */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Vous avez déjà un compte?</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                hitSlop={{top: 10, bottom: 10, left: 5, right: 5}}
              >
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Éléments visuels */}
      <View style={styles.glowCircleTop} />
      <View style={styles.glowCircleBottom} />
    </SafeAreaView>
  );
};

export default RegisterScreen;
