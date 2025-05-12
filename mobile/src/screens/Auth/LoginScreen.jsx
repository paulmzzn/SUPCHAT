import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../../config/env';
import { useTheme } from '../../theme/ThemeContext'; // Import useTheme
import { getStyles } from './LoginScreen.styles'; // Import getStyles

const googleIcon = require('../../assets/google-icon.png');
const githubIcon = require('../../assets/github-icon.png');

const LoginScreen = ({ navigation }) => {
  const { colors: themeColors, themeMode } = useTheme(); // Use theme context
  const styles = getStyles(themeColors); // Get styles based on current theme

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [error, setError] = useState('');
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    const dimensionsListener = Dimensions.addEventListener(
      'change',
      ({ window }) => {
        setScreenHeight(window.height);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      dimensionsListener.remove();
    };
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const storeUserData = async (token, email) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('email', email);
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      emailInputRef.current?.focus();
      return false;
    }
    
    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      passwordInputRef.current?.focus();
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    dismissKeyboard();
    setError('');
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(`${env.API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          mot_de_passe: password 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await storeUserData(data.token, email); // Use the updated function
        
        navigation.navigate('CodeVerification');
      } else {
        setError(data.message || 'Identifiants invalides');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    dismissKeyboard();
    navigation.navigate('PasswordReset');
  };

  const handleGoogleLogin = () => {
    Linking.openURL(`${env.API_URL}/api/users/auth/google`);
  };

  const handleGithubLogin = () => {
    Linking.openURL(`${env.API_URL}/api/users/auth/github`);
  };

  const isSmallScreen = screenHeight < 700;
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? "light" : "dark"} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.dismissKeyboardArea} 
          onPress={dismissKeyboard}
        >
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: isSmallScreen ? 20 : 40 }
            ]} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {(!keyboardVisible || !isSmallScreen) && (
              <View style={[
                styles.headerContainer, 
                { marginBottom: isSmallScreen ? 40 : (keyboardVisible ? 40 : 60) }
              ]}>
                <Text style={styles.appTitle}>
                  SUPCHAT<Text style={styles.dot}>.</Text>
                </Text>
              </View>
            )}

            <View style={styles.formContainer}>
              <Text style={[
                styles.headline, 
                isSmallScreen && keyboardVisible && { fontSize: 24 }
              ]}>
                Se connecter
              </Text>
              
              {(!keyboardVisible || !isSmallScreen) && (
                <Text style={styles.subHeadline}>
                  Bienvenue sur SUPCHAT
                </Text>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[
                  styles.inputContainer,
                  email.trim() && styles.inputContainerFilled
                ]}>
                  <Ionicons name="mail-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="exemple@exemple.com"
                    placeholderTextColor={themeColors.textMuted}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    autoComplete="email"
                    textContentType="emailAddress"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.inputLabel}>Mot de passe</Text>
                  <TouchableOpacity 
                    onPress={handleForgotPassword}
                    hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
                  >
                    <Text style={styles.forgotPassword}>Oublié?</Text>
                  </TouchableOpacity>
                </View>
                <View style={[
                  styles.inputContainer,
                  password && styles.inputContainerFilled
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder="Votre mot de passe"
                    placeholderTextColor={themeColors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError('');
                    }}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    autoComplete="off"
                    textContentType="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={22} 
                      color={themeColors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity 
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={themeColors.textPrimary} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              {!keyboardVisible && (
                <>
                  <View style={styles.orContainer}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>ou</Text>
                    <View style={styles.orLine} />
                  </View>

                  <View style={styles.socialButtons}>
                    <TouchableOpacity 
                      style={styles.socialButton} 
                      onPress={handleGoogleLogin}
                      activeOpacity={0.8}
                    >
                      <Image source={googleIcon} style={styles.socialIcon} />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.socialButton} 
                      onPress={handleGithubLogin}
                      activeOpacity={0.8}
                    >
                      <Image source={githubIcon} style={styles.socialIcon} />
                      <Text style={styles.socialButtonText}>GitHub</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>Vous n'avez pas encore de compte?</Text>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('Register')}
                      hitSlop={{ top: 15, right: 15, bottom: 15, left: 5 }}
                    >
                      <Text style={styles.registerLink}>S'inscrire</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {!keyboardVisible && (
        <>
          <View style={styles.glowCircleTop} />
          <View style={styles.glowCircleBottom} />
        </>
      )}
    </SafeAreaView>
  );
};

export default LoginScreen;
