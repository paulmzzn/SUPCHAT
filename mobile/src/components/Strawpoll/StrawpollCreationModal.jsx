import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import strawpollService from '../../services/StrawpollService';
import MessageService from '../../services/MessageService';

const StrawpollCreationModal = ({ visible, onClose, onPollCreated, theme, channelId, workspaceId }) => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour le sondage');
      return;
    }

    const filteredOptions = options.map(opt => opt.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      Alert.alert('Erreur', 'Au moins 2 options sont requises');
      return;
    }

    if (!channelId || !workspaceId) {
      Alert.alert('Erreur', 'Informations du canal manquantes');
      console.error('Paramètres manquants:', { channelId, workspaceId });
      return;
    }

    try {
      setLoading(true);
      
      // Créer le sondage sur Strawpoll via notre backend
      console.log('Création du sondage avec:', { title: title.trim(), options: filteredOptions });
      const result = await strawpollService.createPoll(title.trim(), filteredOptions);
      console.log('Réponse de la création du sondage:', result);
      
      // Correction: vérifier à la fois pollId et id pour la compatibilité
      const pollId = result?.pollId || result?.id;
      
      if (result && result.url && pollId) {
        // Envoyer le message avec le sondage dans le canal
        const messageText = `Sondage créé : ${title.trim()} [Voter](${result.url}) [strawpoll:${pollId}]`;
        
        console.log('Envoi du message:', {
          channelId,
          messageText,
          textLength: messageText.length
        });
        
        try {
          const messageResponse = await MessageService.sendMessage(channelId, messageText);
          console.log('Message envoyé avec succès:', messageResponse);
          
          // Notifier le parent que le sondage a été créé
          if (onPollCreated) {
            onPollCreated({
              title: title.trim(),
              url: result.url,
              pollId: pollId,
            });
          }
          
          handleClose();
          Alert.alert('Succès', 'Sondage créé et partagé dans le canal !');
        } catch (messageError) {
          console.error('Erreur détaillée lors de l\'envoi du message:', {
            error: messageError,
            message: messageError.message,
            channelId,
            messageText
          });
          
          // Afficher une erreur plus détaillée
          Alert.alert(
            'Erreur', 
            `Sondage créé mais erreur lors du partage: ${messageError.message}\n\nVous pouvez partager manuellement le lien: ${result.url}`
          );
        }
      } else {
        console.error('Réponse invalide du serveur:', result);
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Erreur création sondage:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la création du sondage');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setOptions(['', '']);
    setLoading(false);
    onClose();
  };

  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Créer un sondage</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Titre du sondage</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Entrez le titre de votre sondage..."
              placeholderTextColor={theme.textPlaceholder}
              multiline
              maxLength={200}
            />
            <Text style={styles.characterCount}>
              {title.length}/200 caractères
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options du sondage</Text>
            {options.map((option, index) => (
              <View key={index} style={styles.optionContainer}>
                <TextInput
                  style={styles.optionInput}
                  value={option}
                  onChangeText={(value) => handleOptionChange(index, value)}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={theme.textPlaceholder}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveOption(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {options.length < 10 && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddOption}>
                <Ionicons name="add" size={20} color={theme.accentPrimary} />
                <Text style={styles.addButtonText}>Ajouter une option</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.optionsNote}>
              Minimum 2 options, maximum 10 options
            </Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={20} color={theme.accentPrimary} />
              <Text style={styles.infoText}>
                Le sondage sera créé sur Strawpoll et partagé dans le canal
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="globe-outline" size={20} color={theme.accentPrimary} />
              <Text style={styles.infoText}>
                Les membres pourront voter en cliquant sur le lien
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="analytics-outline" size={20} color={theme.accentPrimary} />
              <Text style={styles.infoText}>
                Les résultats seront visibles en temps réel
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !title.trim() || options.filter(opt => opt.trim()).length < 2}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Créer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.borderColor,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  removeButton: {
    marginLeft: 12,
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.accentPrimary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    color: theme.accentPrimary,
    marginLeft: 8,
    fontWeight: '500',
  },
  optionsNote: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: theme.borderColor,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.cardBackground,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  createButton: {
    flex: 1,
    backgroundColor: theme.accentPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default StrawpollCreationModal;