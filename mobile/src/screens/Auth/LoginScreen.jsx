import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../../config/env';

// You'll need to replace these with actual assets
const googleIcon = require('../../assets/google-icon.png');
const githubIcon = require('../../assets/github-icon.png');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [error, setError] = useState('');
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Monitor keyboard visibility
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

    // Screen dimensions listener for orientation changes
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
        // Store email and token in AsyncStorage
        await AsyncStorage.setItem('email', email);
        if (data.token) {
          await AsyncStorage.setItem('token', data.token);
        }
        
        // Navigate to code verification screen instead of main
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

  // Adjust layout based on screen size and keyboard visibility
  const isSmallScreen = screenHeight < 700;
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      
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
            {/* App title - Conditionally hide on small screens with keyboard visible */}
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
              {/* Main headings - Conditionally adjust size */}
              <Text style={[
                styles.headline, 
                isSmallScreen && keyboardVisible && { fontSize: 24 }
              ]}>
                Se connecter
              </Text>
              
              {/* Subtitle - Hide on small screens with keyboard visible */}
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
                  <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="exemple@exemple.com"
                    placeholderTextColor="rgba(255,255,255,0.4)"
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
                  <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder="Votre mot de passe"
                    placeholderTextColor="rgba(255,255,255,0.4)"
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
                      color="rgba(255,255,255,0.7)" 
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
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              {/* Only show social logins when keyboard is not visible */}
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

      {/* Only show the glow effects when the keyboard is hidden */}
      {!keyboardVisible && (
        <>
          <View style={styles.glowCircleTop} />
          <View style={styles.glowCircleBottom} />
        </>
      )}
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
  dismissKeyboardArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 30,
    marginBottom: 60,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  dot: {
    color: '#9348B7',
  },
  formContainer: {
    width: '100%',
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subHeadline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    color: 'white',
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    color: '#9348B7',
    fontSize: 15,
    fontWeight: '500',
    padding: 5, // Increase touch target
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12, // slightly larger radius
    paddingHorizontal: 15,
    height: 58, // slightly taller for easier touch
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
    height: '100%',
  },
  passwordToggle: {
    padding: 8, // Larger padding for easier touch
  },
  loginButton: {
    backgroundColor: '#9348B7',
    height: 58,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(147, 72, 183, 0.5)',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
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
    marginBottom: 28,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flex: 0.48,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    padding: 10, // Increased touch area
  },
  registerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginRight: 5,
  },
  registerLink: {
    color: '#9348B7',
    fontSize: 15,
    fontWeight: '600',
    padding: 5, // Increase touch target
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
  errorContainer: {
    backgroundColor: 'rgba(255, 87, 87, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5757',
  },
  errorText: {
    color: '#FF9494',
    fontSize: 14,
  },
});

export default LoginScreen;
