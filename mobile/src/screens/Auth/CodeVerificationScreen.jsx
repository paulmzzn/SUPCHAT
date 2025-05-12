import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../../config/env';
import { useAuth } from '../../../App';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './CodeVerificationScreen.styles';

const { width } = Dimensions.get('window');

const CodeVerificationScreen = ({ navigation }) => {
  const { colors: themeColors, themeMode } = useTheme();
  const styles = getStyles(themeColors);

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  
  const { signIn } = useAuth();
  const inputRefs = Array(6).fill(0).map(() => useRef(null));

  useEffect(() => {
    const getEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          Alert.alert(
            'Erreur',
            'Aucune adresse email trouvée. Veuillez vous reconnecter.',
            [{ text: 'OK', onPress: () => navigation.replace('Login') }]
          );
        }
      } catch (error) {
        console.error('Error retrieving email:', error);
      }
    };

    getEmail();
  }, [navigation]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Veuillez entrer le code complet à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${env.API_URL}/api/users/validate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          await signIn(data.token);
        } else {
          setError('Token manquant dans la réponse du serveur');
        }
      } else {
        setError(data.message || 'Code invalide');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
      console.error('Error validating code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Adresse email non disponible');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${env.API_URL}/api/users/resend-validation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès', 'Un nouveau code a été envoyé à votre adresse email.');
      } else {
        setError(data.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
      console.error('Error resending code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      const pastedValue = value.replace(/\D/g, '').slice(0, 6);
      const codeArray = pastedValue.split('').slice(0, 6);
      
      while (codeArray.length < 6) {
        codeArray.push('');
      }
      
      setCode(codeArray);
      
      if (pastedValue.length === 6) {
        inputRefs[5].current?.focus();
      }
      
      return;
    }

    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, '');
    setCode(newCode);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.appTitle}>
              SUPCHAT<Text style={styles.dot}>.</Text>
            </Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.title}>Vérification par email</Text>
            <Text style={styles.subtitle}>
              Veuillez entrer le code à 6 chiffres envoyé à votre adresse email
            </Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <View style={styles.codeInputContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled
                  ]}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(index, value)}
                  onKeyPress={(e) => handleKeyDown(e, index)}
                  selectTextOnFocus
                />
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={themeColors.textPrimary} size="small" />
              ) : (
                <Text style={styles.buttonText}>Vérifier</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Vous n'avez pas reçu de code ?</Text>
              <TouchableOpacity 
                onPress={handleResendCode}
                disabled={loading}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Text style={styles.resendButton}>Renvoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.glowCircleTop} />
      <View style={styles.glowCircleBottom} />
    </SafeAreaView>
  );
};

export default CodeVerificationScreen;
