import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme/ThemeContext';
import env from '../config/env';

const CreateChannelModal = ({ visible, onClose, workspaceId, onChannelCreated }) => {
  const { colors: themeColors } = useTheme();
  const [channelName, setChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!channelName.trim()) {
      newErrors.channelName = 'Le nom du canal est requis';
    } else if (channelName.length < 2) {
      newErrors.channelName = 'Le nom doit contenir au moins 2 caractères';
    } else if (channelName.length > 50) {
      newErrors.channelName = 'Le nom ne peut pas dépasser 50 caractères';
    } else if (!/^[a-zA-Z0-9\-_\s]+$/.test(channelName)) {
      newErrors.channelName = 'Le nom ne peut contenir que des lettres, chiffres, tirets et espaces';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateChannel = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/workspace/${workspaceId}/canals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom: channelName.trim(),
          is_private: isPrivate,
        }),
      });

      if (response.ok) {
        const newChannel = await response.json();
        Toast.show({
          type: 'success',
          text1: 'Canal créé',
          text2: `Le canal "${channelName}" a été créé avec succès`,
          position: 'bottom',
          visibilityTime: 3000,
        });
        
        onChannelCreated(newChannel);
        handleClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du canal');
      }
    } catch (error) {
      console.error('Erreur création canal:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de créer le canal',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setChannelName('');
    setIsPrivate(false);
    setErrors({});
    setLoading(false);
    onClose();
  };

  const styles = {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 16,
      width: '100%',
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 25,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderColor,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 24,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.textPrimary,
      marginBottom: 8,
    },
    requiredStar: {
      color: themeColors.error,
    },
    inputContainer: {
      borderWidth: 1.5,
      borderColor: themeColors.borderColor,
      borderRadius: 12,
      backgroundColor: themeColors.inputBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inputContainerFocused: {
      borderColor: themeColors.accentPrimary,
      shadowColor: themeColors.accentPrimary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    inputContainerError: {
      borderColor: themeColors.error,
    },
    input: {
      fontSize: 16,
      color: themeColors.textPrimary,
      minHeight: 20,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: 12,
      color: themeColors.error,
      marginTop: 4,
      marginLeft: 4,
    },
    characterCount: {
      fontSize: 12,
      color: themeColors.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    switchGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 12,
      marginBottom: 24,
    },
    switchContent: {
      flex: 1,
      marginRight: 16,
    },
    switchLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.textPrimary,
      marginBottom: 4,
    },
    switchDescription: {
      fontSize: 14,
      color: themeColors.textSecondary,
      lineHeight: 18,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    cancelButton: {
      backgroundColor: themeColors.secondaryBackground,
      borderWidth: 1,
      borderColor: themeColors.borderColor,
    },
    createButton: {
      backgroundColor: themeColors.accentPrimary,
    },
    createButtonDisabled: {
      backgroundColor: themeColors.textMuted,
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: themeColors.textPrimary,
    },
    createButtonText: {
      color: themeColors.textOnAccent,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.header}>
                <View style={{ width: 32 }} />
                <Text style={styles.headerTitle}>Créer un canal</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Nom du canal */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Nom du canal <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.channelName && styles.inputContainerError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      value={channelName}
                      onChangeText={(text) => {
                        setChannelName(text);
                        if (errors.channelName) {
                          setErrors({ ...errors, channelName: null });
                        }
                      }}
                      placeholder="ex: general, random, dev..."
                      placeholderTextColor={themeColors.textMuted}
                      maxLength={50}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.channelName && (
                    <Text style={styles.errorText}>{errors.channelName}</Text>
                  )}
                  <Text style={styles.characterCount}>
                    {channelName.length}/50
                  </Text>
                </View>

                {/* Canal privé */}
                <View style={styles.switchGroup}>
                  <View style={styles.switchContent}>
                    <Text style={styles.switchLabel}>Canal privé</Text>
                    <Text style={styles.switchDescription}>
                      Seuls les membres invités peuvent voir et rejoindre ce canal
                    </Text>
                  </View>
                  <Switch
                    value={isPrivate}
                    onValueChange={setIsPrivate}
                    trackColor={{
                      false: themeColors.borderColor,
                      true: themeColors.accentPrimary + '40',
                    }}
                    thumbColor={isPrivate ? themeColors.accentPrimary : themeColors.textSecondary}
                  />
                </View>

                {/* Boutons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    <Text style={[styles.buttonText, styles.cancelButtonText]}>
                      Annuler
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.createButton,
                      (loading || !channelName.trim()) && styles.createButtonDisabled,
                    ]}
                    onPress={handleCreateChannel}
                    activeOpacity={0.7}
                    disabled={loading || !channelName.trim()}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={themeColors.textOnAccent}
                        />
                        <Text style={[styles.buttonText, styles.createButtonText]}>
                          Création...
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.buttonText, styles.createButtonText]}>
                        Créer le canal
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CreateChannelModal;