import React, { useState, useRef } from 'react';
import {
  View,
  Text,
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
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './PasswordResetScreen.styles';

const { width } = Dimensions.get('window');

const PasswordResetScreen = ({ navigation }) => {
  const { colors: themeColors, themeMode } = useTheme();
  const styles = getStyles(themeColors);

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
                <Ionicons name="mail-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="exemple@exemple.com"
                  placeholderTextColor={themeColors.textPlaceholder}
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
                <ActivityIndicator color={themeColors.textPrimary} size="small" />
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
              style={[styles.actionButton, loading && styles.buttonDisabled, (verificationCode.length !== 6) && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color={themeColors.textPrimary} size="small" />
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
                <Ionicons name="lock-closed-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor={themeColors.textPlaceholder}
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
                    color={themeColors.textSecondary} 
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
                <Ionicons name="lock-closed-outline" size={20} color={themeColors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  ref={confirmPasswordInputRef}
                  style={styles.input}
                  placeholder="Confirmer votre mot de passe"
                  placeholderTextColor={themeColors.textPlaceholder}
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
                <ActivityIndicator color={themeColors.textPrimary} size="small" />
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

export default PasswordResetScreen;
