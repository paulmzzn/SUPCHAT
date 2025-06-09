import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme/ThemeContext';
import Toast from 'react-native-toast-message';

const ReminderCreateModal = ({
  visible,
  onClose,
  onSave,
  reminder = null, // Si fourni, on est en mode édition
  loading = false,
  channelId,
  workspaceId,
}) => {
  const { colors: themeColors } = useTheme();
  const isEditing = !!reminder;

  // États du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('none'); // 'none', 'daily', 'weekly', 'monthly'
  const [errors, setErrors] = useState({});

  // Initialiser les champs en mode édition
  useEffect(() => {
    if (isEditing && reminder) {
      setTitle(reminder.title || '');
      setDescription(reminder.description || '');
      setReminderDate(new Date(reminder.reminder_date || Date.now()));
      setIsRecurring(reminder.is_recurring || false);
      setRecurringType(reminder.recurring_type || 'none');
    } else if (!isEditing) {
      // Réinitialiser en mode création
      setTitle('');
      setDescription('');
      setReminderDate(new Date());
      setIsRecurring(false);
      setRecurringType('none');
    }
    setErrors({});
  }, [isEditing, reminder, visible]);

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (title.length > 100) {
      newErrors.title = 'Le titre ne peut pas dépasser 100 caractères';
    }

    if (description && description.length > 500) {
      newErrors.description = 'La description ne peut pas dépasser 500 caractères';
    }

    if (reminderDate <= new Date()) {
      newErrors.date = 'La date du rappel doit être dans le futur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const reminderData = {
      title: title.trim(),
      description: description.trim(),
      reminder_date: reminderDate.toISOString(),
      is_recurring: isRecurring,
      recurring_type: isRecurring ? recurringType : 'none',
    };

    try {
      await onSave(reminderData);
      onClose();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de sauvegarder le rappel',
      });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const newDate = new Date(reminderDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setReminderDate(newDate);
      // Sur Android, fermer automatiquement après sélection
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDate = new Date(reminderDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setReminderDate(newDate);
      // Sur Android, fermer automatiquement après sélection
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
      }
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const RecurringTypeOption = ({ type, label, selected, onSelect }) => (
    <TouchableOpacity
      style={[
        styles.recurringOption,
        { borderColor: themeColors.borderColor },
        selected && { 
          borderColor: themeColors.accentPrimary,
          backgroundColor: themeColors.accentPrimary + '20'
        }
      ]}
      onPress={() => onSelect(type)}
    >
      <View style={styles.radioButton}>
        {selected && (
          <View style={[
            styles.radioButtonInner,
            { backgroundColor: themeColors.accentPrimary }
          ]} />
        )}
      </View>
      <Text style={[
        styles.recurringOptionText,
        { color: themeColors.textPrimary },
        selected && { color: themeColors.accentPrimary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const styles = {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: themeColors.cardBackground,
      borderRadius: 16,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderColor,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
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
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
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
    input: {
      borderWidth: 1,
      borderColor: themeColors.borderColor,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: themeColors.textPrimary,
      backgroundColor: themeColors.inputBackground,
    },
    inputError: {
      borderColor: themeColors.error,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      color: themeColors.error,
      fontSize: 14,
      marginTop: 4,
    },
    dateTimeGroup: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    dateTimeInput: {
      flex: 1,
      marginRight: 10,
    },
    dateTimeButton: {
      borderWidth: 1,
      borderColor: themeColors.borderColor,
      borderRadius: 8,
      padding: 12,
      backgroundColor: themeColors.inputBackground,
      alignItems: 'center',
    },
    dateTimeButtonText: {
      fontSize: 16,
      color: themeColors.textPrimary,
    },
    switchGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    switchContent: {
      flex: 1,
      marginRight: 15,
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
    },
    recurringSection: {
      marginBottom: 20,
    },
    recurringOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 8,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: themeColors.borderColor,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    recurringOptionText: {
      fontSize: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: themeColors.secondaryBackground,
    },
    saveButton: {
      backgroundColor: themeColors.accentPrimary,
    },
    saveButtonDisabled: {
      backgroundColor: themeColors.borderColor,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: themeColors.textPrimary,
    },
    saveButtonText: {
      color: themeColors.textOnAccent,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pickerContainer: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: themeColors.borderColor,
    },
    pickerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    picker: {
      backgroundColor: themeColors.cardBackground,
    },
    pickerConfirmButton: {
      backgroundColor: themeColors.accentPrimary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    pickerConfirmText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <View style={{ width: 32 }} />
            <Text style={styles.headerTitle}>
              {isEditing ? 'Modifier le rappel' : 'Nouveau rappel'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Titre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Titre <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errors.title && styles.inputError
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Réunion équipe"
                placeholderTextColor={themeColors.textMuted}
                maxLength={100}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.description && styles.inputError
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description du rappel..."
                placeholderTextColor={themeColors.textMuted}
                multiline
                maxLength={500}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Date et heure */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date et heure</Text>
              <View style={styles.dateTimeGroup}>
                <View style={styles.dateTimeInput}>
                  <TouchableOpacity
                    style={[
                      styles.dateTimeButton,
                      errors.date && styles.inputError
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateTimeButtonText}>
                      {formatDate(reminderDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateTimeInput}>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.dateTimeButtonText}>
                      {formatTime(reminderDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {errors.date && (
                <Text style={styles.errorText}>{errors.date}</Text>
              )}
            </View>

            {/* Récurrence */}
            <View style={styles.switchGroup}>
              <View style={styles.switchContent}>
                <Text style={styles.switchLabel}>Rappel récurrent</Text>
                <Text style={styles.switchDescription}>
                  Répéter ce rappel automatiquement
                </Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{
                  false: themeColors.borderColor,
                  true: themeColors.accentPrimary + '40',
                }}
                thumbColor={isRecurring ? themeColors.accentPrimary : themeColors.textSecondary}
              />
            </View>

            {/* Options de récurrence */}
            {isRecurring && (
              <View style={styles.recurringSection}>
                <Text style={styles.label}>Type de récurrence</Text>
                <RecurringTypeOption
                  type="daily"
                  label="Quotidien"
                  selected={recurringType === 'daily'}
                  onSelect={setRecurringType}
                />
                <RecurringTypeOption
                  type="weekly"
                  label="Hebdomadaire"
                  selected={recurringType === 'weekly'}
                  onSelect={setRecurringType}
                />
                <RecurringTypeOption
                  type="monthly"
                  label="Mensuel"
                  selected={recurringType === 'monthly'}
                  onSelect={setRecurringType}
                />
              </View>
            )}

            {/* Boutons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  loading && styles.saveButtonDisabled
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={themeColors.textOnAccent} />
                    <Text style={[styles.buttonText, styles.saveButtonText]}>
                      Sauvegarde...
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.buttonText, styles.saveButtonText]}>
                    {isEditing ? 'Modifier' : 'Créer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sélecteurs de date/heure */}
          {showDatePicker && (
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Sélectionnez une date</Text>
              <DateTimePicker
                value={reminderDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.picker}
              />
              <TouchableOpacity
                style={styles.pickerConfirmButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.pickerConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          )}

          {showTimePicker && (
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Sélectionnez une heure</Text>
              <DateTimePicker
                value={reminderDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={styles.picker}
              />
              <TouchableOpacity
                style={styles.pickerConfirmButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.pickerConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default ReminderCreateModal;
