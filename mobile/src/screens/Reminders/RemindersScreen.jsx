import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import Toast from 'react-native-toast-message';
import ReminderCreateModal from '../../components/Reminders/ReminderCreateModal';
import useReminders from '../../hooks/useReminders';
import { getStyles } from './RemindersScreen.styles';

const RemindersScreen = ({ navigation, route }) => {
  const { channelId, workspaceId, channelName } = route.params;
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    reminders,
    loading,
    error,
    loadReminders,
    createReminder,
    updateReminder,
    deleteReminder,
  } = useReminders(channelId, workspaceId);

  useEffect(() => {
    loadReminders();
  }, [channelId, workspaceId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const formatReminderDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Demain à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecurringText = (recurringType) => {
    switch (recurringType) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      default: return null;
    }
  };

  const handleCreateReminderSubmit = async (reminderData) => {
    if (editingReminder) {
      const result = await updateReminder(editingReminder.id, reminderData);
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
      const result = await createReminder(reminderData);
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

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setShowCreateModal(true);
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
            const result = await deleteReminder(reminder.id);
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
          },
        },
      ]
    );
  };

  const renderReminder = ({ item }) => {
    const reminderDate = new Date(item.reminder_date);
    const isExpired = reminderDate < new Date();
    const recurringText = getRecurringText(item.recurring_type);

    return (
      <View style={[styles.reminderItem, isExpired && styles.expiredReminder]}>
        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            <Text style={[styles.reminderTitle, isExpired && styles.expiredText]}>
              {item.title}
            </Text>
            <View style={styles.reminderActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditReminder(item)}
              >
                <Ionicons name="pencil" size={16} color={themeColors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteReminder(item)}
              >
                <Ionicons name="trash" size={16} color={themeColors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {item.description && (
            <Text style={[styles.reminderDescription, isExpired && styles.expiredText]}>
              {item.description}
            </Text>
          )}

          <View style={styles.reminderMeta}>
            <View style={styles.dateContainer}>
              <Ionicons 
                name="time-outline" 
                size={14} 
                color={isExpired ? themeColors.error : themeColors.textSecondary} 
              />
              <Text style={[styles.reminderDate, isExpired && styles.expiredText]}>
                {formatReminderDate(item.reminder_date)}
              </Text>
            </View>

            {recurringText && (
              <View style={styles.recurringContainer}>
                <Ionicons 
                  name="repeat" 
                  size={14} 
                  color={themeColors.accentPrimary} 
                />
                <Text style={styles.recurringText}>{recurringText}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={themeColors.textSecondary} />
      <Text style={styles.emptyTitle}>Aucun rappel</Text>
      <Text style={styles.emptyDescription}>
        Créez votre premier rappel pour ne rien oublier d'important dans ce canal.
      </Text>
      <TouchableOpacity
        style={styles.emptyActionButton}
        onPress={() => {
          setEditingReminder(null);
          setShowCreateModal(true);
        }}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyActionText}>Créer un rappel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Rappels</Text>
          <Text style={styles.headerSubtitle}>#{channelName}</Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            setEditingReminder(null);
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && reminders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.accentPrimary} />
            <Text style={styles.loadingText}>Chargement des rappels...</Text>
          </View>
        ) : reminders.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={reminders}
            renderItem={renderReminder}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[themeColors.accentPrimary]}
                tintColor={themeColors.accentPrimary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Create/Edit Modal */}
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
    </SafeAreaView>
  );
};

export default RemindersScreen;
