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
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import env from '../../config/env';

const { width } = Dimensions.get('window');

const PasswordResetScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: email, 2: verification code, 3: new password
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const codeInputRefs = Array(6).fill(0).map(() => useRef(null));
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${env.API_URL}/api/users/request-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Un code de vérification a été envoyé à votre email.');
        setStep(2);
      } else {
        setError(data.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    // Handle paste
    if (value.length > 1) {
      const pastedValue = value.replace(/\D/g, '').slice(0, 6);
      setVerificationCode(pastedValue);
      
      // Focus last input if code is complete
      if (pastedValue.length === 6) {
        codeInputRefs[5].current?.focus();
      }
      return;
    }

    // Handle single digit input
    const newCode = verificationCode.split('');
    newCode[index] = value.replace(/\D/g, '');
    setVerificationCode(newCode.join(''));

    // Auto-move to next input
    if (value && index < 5) {
      codeInputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace if current is empty
    if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Veuillez entrer le code de vérification complet');
      return;
    }

    setStep(3);
    setError('');
    setMessage('Vous pouvez maintenant définir un nouveau mot de passe');
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${env.API_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Succès',
          'Votre mot de passe a été réinitialisé avec succès',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        setError(data.message || 'Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.subtitle}>
              Entrez votre email pour recevoir un code de réinitialisation
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[
                styles.inputContainer,
                email.trim() && styles.inputContainerFilled
              ]}>
                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="exemple@exemple.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="done"
                  onSubmitEditing={handleSendCode}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Envoyer le code</Text>
              )}
            </TouchableOpacity>
          </>
        );
      
      case 2:
        return (
          <>
            <Text style={styles.subtitle}>
              Entrez le code de vérification envoyé à votre email
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Code de vérification</Text>
              <View style={styles.codeContainer}>
                {Array(6).fill(0).map((_, index) => (
                  <TextInput
                    key={index}
                    ref={codeInputRefs[index]}
                    style={[
                      styles.codeInput,
                      verificationCode[index] && styles.codeInputFilled
                    ]}
                    value={verificationCode[index] || ''}
                    onChangeText={(value) => handleCodeChange(index, value)}
                    onKeyPress={(e) => handleKeyDown(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Vérifier le code</Text>
              )}
            </TouchableOpacity>
          </>
        );
      
      case 3:
        return (
          <>
            <Text style={styles.subtitle}>
              Définissez votre nouveau mot de passe
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
              <View style={[
                styles.inputContainer,
                newPassword && styles.inputContainerFilled
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <View style={[
                styles.inputContainer,
                confirmPassword && styles.inputContainerFilled
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordInputRef}
                  style={styles.input}
                  placeholder="Confirmer votre mot de passe"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Réinitialiser le mot de passe</Text>
              )}
            </TouchableOpacity>
          </>
        );
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
            <Text style={styles.headerTitle}>Réinitialiser le mot de passe</Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Mot de passe oublié?</Text>
            
            {message ? (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{message}</Text>
              </View>
            ) : null}
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {renderStep()}
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeInput: {
    width: width < 380 ? 40 : 45,
    height: width < 380 ? 50 : 56,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.3)',
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: '#9348B7',
    backgroundColor: 'rgba(147, 72, 183, 0.08)',
  },
  actionButton: {
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
  actionButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: 'rgba(72, 147, 183, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginTop: 0,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#4893B7',
  },
  messageText: {
    color: '#94DDFF',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 87, 87, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginTop: 0,
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

export default PasswordResetScreen;
