import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import Toast from 'react-native-toast-message';
import ReminderCreateModal from './ReminderCreateModal';

const RemindersModal = ({ 
  visible, 
  onClose, 
  reminders = [], 
  loading, 
  onCreateReminder,
  onUpdateReminder,
  onDeleteReminder,
  currentUserId,
  channelId,
  workspaceId 
}) => {
  const { colors: themeColors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const formatReminderDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Check if date is tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Demain à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Check if date is this week
    const daysDiff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7 && daysDiff > 1) {
      return `${date.toLocaleDateString('fr-FR', { weekday: 'long' })} à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Standard format for dates further away
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isReminderPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const canModifyReminder = (reminder) => {
    return reminder.user_id === currentUserId && !isReminderPast(reminder.reminder_date);
  };

  const handleDeleteReminder = (reminder) => {
    Alert.alert(
      'Supprimer le rappel',
      'Êtes-vous sûr de vouloir supprimer ce rappel ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            const result = await onDeleteReminder(reminder.id);
            if (result.success) {
              Toast.show({
                type: 'success',
                text1: 'Rappel supprimé',
                text2: 'Le rappel a été supprimé avec succès'
              });
            } else {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: result.error
              });
            }
          }
        }
      ]
    );
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setShowCreateModal(true);
  };

  const handleCreateReminderSubmit = async (reminderData) => {
    if (editingReminder) {
      // Mode édition
      const result = await onUpdateReminder(editingReminder.id, reminderData);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Rappel modifié',
          text2: 'Le rappel a été modifié avec succès'
        });
        setShowCreateModal(false);
        setEditingReminder(null);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: result.error
        });
      }
    } else {
      // Mode création
      const result = await onCreateReminder(reminderData);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Rappel créé',
          text2: 'Le rappel a été créé avec succès'
        });
        setShowCreateModal(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: result.error
        });
      }
    }
  };

  const renderReminderItem = ({ item: reminder }) => {
    const isPast = isReminderPast(reminder.reminder_date);
    const canModify = canModifyReminder(reminder);

    return (
      <View style={[
        styles.reminderItem,
        { backgroundColor: themeColors.cardBackground },
        isPast && styles.pastReminder,
        reminder.is_sent && styles.sentReminder
      ]}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderTitleSection}>
            <Ionicons 
              name="alarm" 
              size={20} 
              color={isPast ? themeColors.textSecondary : themeColors.accentPrimary} 
            />
            <Text style={[styles.reminderTitle, { color: themeColors.textPrimary }]}>
              {reminder.title}
            </Text>
            {reminder.is_sent && (
              <View style={[styles.sentBadge, { backgroundColor: themeColors.success }]}>
                <Text style={styles.sentBadgeText}>Envoyé</Text>
              </View>
            )}
          </View>
          
          {canModify && (
            <View style={styles.reminderActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: themeColors.accentPrimary + '20' }]}
                onPress={() => handleEditReminder(reminder)}
              >
                <Ionicons name="pencil" size={16} color={themeColors.accentPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: themeColors.error + '20' }]}
                onPress={() => handleDeleteReminder(reminder)}
              >
                <Ionicons name="trash" size={16} color={themeColors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {reminder.description && (
          <Text style={[styles.reminderDescription, { color: themeColors.textSecondary }]}>
            {reminder.description}
          </Text>
        )}

        <View style={styles.reminderMeta}>
          <View style={styles.reminderDateTime}>
            <Ionicons name="calendar" size={14} color={themeColors.textSecondary} />
            <Text style={[
              styles.reminderDateText,
              { color: isPast ? themeColors.error : themeColors.warning },
            ]}>
              {formatReminderDate(reminder.reminder_date)}
            </Text>
          </View>
          
          <View style={styles.reminderCreator}>
            <Ionicons name="person" size={14} color={themeColors.textSecondary} />
            <Text style={[styles.reminderCreatorText, { color: themeColors.textSecondary }]}>
              {reminder.user_name}
              {reminder.user_id === currentUserId && ' (vous)'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const styles = {
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: themeColors.primaryBackground,
      borderRadius: 12,
      width: '90%',
      maxHeight: '80%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.textPrimary,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: themeColors.cardBackground,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.accentPrimary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      marginLeft: 8,
    },
    remindersList: {
      maxHeight: 400,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.textPrimary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
      color: themeColors.textSecondary,
    },
    reminderItem: {
      margin: 12,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: themeColors.accentPrimary,
    },
    pastReminder: {
      opacity: 0.7,
      borderLeftColor: themeColors.textSecondary,
    },
    sentReminder: {
      borderLeftColor: themeColors.success,
    },
    reminderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    reminderTitleSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    reminderTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
      flex: 1,
    },
    sentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    sentBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    reminderActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
    },
    reminderDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
      marginLeft: 28,
    },
    reminderMeta: {
      marginLeft: 28,
    },
    reminderDateTime: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    reminderDateText: {
      fontSize: 14,
      marginLeft: 6,
      fontWeight: '500',
    },
    reminderCreator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reminderCreatorText: {
      fontSize: 12,
      marginLeft: 6,
    },
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Rappels ({reminders.length})
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {channelId && (
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => {
                      setEditingReminder(null);
                      setShowCreateModal(true);
                    }}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Nouveau</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColors.accentPrimary} />
                <Text style={styles.loadingText}>Chargement des rappels...</Text>
              </View>
            ) : reminders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="alarm-outline" 
                  size={48} 
                  color={themeColors.textSecondary} 
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>Aucun rappel</Text>
                <Text style={styles.emptySubtitle}>
                  {channelId 
                    ? 'Créez votre premier rappel pour ne rien oublier !'
                    : 'Sélectionnez un canal pour voir les rappels'
                  }
                </Text>
              </View>
            ) : (
              <FlatList
                data={reminders}
                renderItem={renderReminderItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.remindersList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      <ReminderCreateModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingReminder(null);
        }}
        onSave={handleCreateReminderSubmit}
        reminder={editingReminder}
        channelId={channelId}
        workspaceId={workspaceId}
      />
    </>
  );
};

export default RemindersModal;
