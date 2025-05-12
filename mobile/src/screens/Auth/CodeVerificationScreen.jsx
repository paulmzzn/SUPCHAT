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
  ActivityIndicator,
  Dimensions,
  Alert,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../../config/env';

const { width } = Dimensions.get('window');

const CodeVerificationScreen = ({ navigation }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  
  const inputRefs = Array(6).fill(0).map(() => useRef(null));

  // Get email from AsyncStorage on component mount
  useEffect(() => {
    const getEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          // Redirect to login if no email found
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
          // Clear any previous token
          await AsyncStorage.removeItem('token');
          
          // Store the new token
          await AsyncStorage.setItem('token', data.token);
          
          // Navigate to main screen
          navigation.replace('Main');
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
    // Handle paste
    if (value.length > 1) {
      const pastedValue = value.replace(/\D/g, '').slice(0, 6);
      const codeArray = pastedValue.split('').slice(0, 6);
      
      // Fill with empty strings if needed
      while (codeArray.length < 6) {
        codeArray.push('');
      }
      
      setCode(codeArray);
      
      // Focus the last input if code is complete
      if (pastedValue.length === 6) {
        inputRefs[5].current?.focus();
      }
      
      return;
    }

    // Handle single digit
    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, '');
    setCode(newCode);

    // Auto-move to next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace to move to previous input
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
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
                <ActivityIndicator color="#fff" size="small" />
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
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  dot: {
    color: '#9348B7',
  },
  card: {
    backgroundColor: 'rgba(19, 19, 22, 0.6)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  codeInput: {
    width: width < 380 ? (width - 80) / 6 - 5 : 45,
    height: width < 380 ? 50 : 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: 22,
    color: 'white',
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: '#9348B7',
    backgroundColor: 'rgba(147, 72, 183, 0.08)',
  },
  verifyButton: {
    backgroundColor: '#9348B7',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9348B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(147, 72, 183, 0.5)',
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  resendText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    marginRight: 5,
  },
  resendButton: {
    color: '#9348B7',
    fontSize: 15,
    fontWeight: '600',
    padding: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 87, 87, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5757',
  },
  errorText: {
    color: '#FF9494',
    fontSize: 14,
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

export default CodeVerificationScreen;
