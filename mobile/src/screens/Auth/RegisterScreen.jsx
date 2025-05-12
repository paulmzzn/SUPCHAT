import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

const googleIcon = require('../../assets/google-icon.png');
const githubIcon = require('../../assets/github-icon.png');

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
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
      <StatusBar style="light" />
      
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
              <Ionicons name="chevron-back" size={28} color="white" />
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
                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Jean Dupont"
                  placeholderTextColor="rgba(255,255,255,0.4)"
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
                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  placeholder="exemple@exemple.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
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
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor="rgba(255,255,255,0.4)"
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
                    color="rgba(255,255,255,0.7)" 
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
                <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <Text style={[
                  styles.datePickerText,
                  formData.birthDate ? styles.datePickerTextFilled : styles.datePickerTextPlaceholder
                ]}>
                  {formData.birthDate ? formatDate(formData.birthDate) : "Sélectionner votre date de naissance"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
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
              buttonTextColorIOS="#9348B7"
              themeVariant="dark"
              isDarkModeEnabled={true}
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
                <ActivityIndicator color="#fff" size="small" />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E1E28',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width > 380 ? 24 : 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: width > 320 ? 28 : 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: width > 380 ? 20 : 16,
  },
  inputLabel: {
    color: 'white',
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: Platform.OS === 'ios' ? 54 : 56,
  },
  inputContainerFilled: {
    borderColor: '#9348B7',
    backgroundColor: 'rgba(147, 72, 183, 0.08)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    padding: 0,
  },
  passwordToggle: {
    padding: 10,
    marginRight: -5,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
  },
  datePickerTextFilled: {
    color: 'white',
  },
  datePickerTextPlaceholder: {
    color: 'rgba(255,255,255,0.4)',
  },
  registerButton: {
    backgroundColor: '#9348B7',
    height: Platform.OS === 'ios' ? 54 : 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#9348B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(147, 72, 183, 0.5)',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  orText: {
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 12,
    fontSize: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: (width - 48) / 2 - 8,
  },
  socialIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  socialButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    padding: 8,
  },
  loginText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginRight: 5,
  },
  loginLink: {
    color: '#9348B7',
    fontSize: 15,
    fontWeight: '600',
    padding: 4,
  },
  glowCircleTop: {
    position: 'absolute',
    width: 420,
    height: 400,
    borderRadius: 225,
    backgroundColor: '#9348B7',
    top: -100,
    right: -50,
    opacity: 0.05,
    zIndex: -1,
  },
  glowCircleBottom: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#9348B7',
    bottom: -200,
    left: -100,
    opacity: 0.05,
    zIndex: -1,
  },
});

export default RegisterScreen;
