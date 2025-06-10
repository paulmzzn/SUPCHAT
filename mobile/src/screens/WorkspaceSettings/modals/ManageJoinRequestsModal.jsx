import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  TextInput,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../theme/ThemeContext';
import { getStyles } from './ManageJoinRequestsModal.styles';
import env from '../../../config/env';

const API_URL = env.API_URL;
const S3_BASE_URL = env.S3_BASE_URL;

// Fonction pour construire l'URL complète d'une image
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('file://') || imagePath.startsWith('content://')) return imagePath;
  return `${S3_BASE_URL}${imagePath}`;
};

const ManageJoinRequestsModal = ({ 
  visible, 
  onClose, 
  workspaceId, 
  workspaceName 
}) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Charger les demandes d'adhésion
  const loadJoinRequests = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/requests`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Impossible de charger les demandes d\'adhésion');
      }

      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger les demandes'
      });
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  };

  // Charger les demandes au montage et à l'ouverture de la modal
  useEffect(() => {
    if (visible) {
      loadJoinRequests();
    }
  }, [visible, workspaceId]);

  // Gérer le rafraîchissement
  const onRefresh = () => {
    setRefreshing(true);
    loadJoinRequests(true);
  };

  // Accepter une demande
  const acceptRequest = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accept: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Impossible d\'accepter la demande');
      }

      Toast.show({
        type: 'success',
        text1: 'Demande acceptée',
        text2: 'L\'utilisateur a été ajouté au workspace'
      });

      // Recharger les demandes
      loadJoinRequests();
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible d\'accepter la demande'
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Rejeter une demande
  const rejectRequest = async () => {
    try {
      setProcessingRequestId(selectedRequestId);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/requests/${selectedRequestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          accept: false,
          rejectReason: rejectReason.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Impossible de rejeter la demande');
      }

      Toast.show({
        type: 'success',
        text1: 'Demande rejetée',
        text2: 'L\'utilisateur a été notifié du refus'
      });

      // Fermer la modal de rejet et réinitialiser
      setShowRejectModal(false);
      setSelectedRequestId(null);
      setRejectReason('');

      // Recharger les demandes
      loadJoinRequests();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de rejeter la demande'
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Ouvrir la modal de rejet
  const openRejectModal = (requestId) => {
    setSelectedRequestId(requestId);
    setShowRejectModal(true);
  };

  // Fermer la modal de rejet
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedRequestId(null);
    setRejectReason('');
  };

  // Confirmer l'acceptation
  const confirmAccept = (request) => {
    Alert.alert(
      'Accepter la demande',
      `Êtes-vous sûr de vouloir accepter la demande de ${request.nom_utilisateur} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Accepter', 
          style: 'default',
          onPress: () => acceptRequest(request.id_request)
        }
      ]
    );
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Modal principale */}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          {/* En-tête */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Demandes d'adhésion</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={24} 
                color={refreshing ? themeColors.textMuted : themeColors.textPrimary} 
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{workspaceName}</Text>

          {/* Contenu */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.accentPrimary} />
              <Text style={styles.loadingText}>Chargement des demandes...</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.content}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[themeColors.accentPrimary]}
                  tintColor={themeColors.accentPrimary}
                />
              }
            >
              {requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={64} color={themeColors.textMuted} />
                  <Text style={styles.emptyTitle}>Aucune demande en attente</Text>
                  <Text style={styles.emptyDescription}>
                    Il n'y a actuellement aucune demande d'adhésion à traiter pour ce workspace.
                  </Text>
                </View>
              ) : (
                requests.map((request) => (
                  <View key={request.id_request} style={styles.requestCard}>
                    {/* En-tête de la demande */}
                    <View style={styles.requestHeader}>
                      <View style={styles.userInfo}>
                        {request.photo_url ? (
                          <Image 
                            source={{ uri: getImageUrl(request.photo_url) }} 
                            style={styles.userAvatar}
                          />
                        ) : (
                          <View style={styles.userAvatarPlaceholder}>
                            <Ionicons name="person" size={20} color={themeColors.textSecondary} />
                          </View>
                        )}
                        <View style={styles.userDetails}>
                          <Text style={styles.userName}>{request.nom_utilisateur}</Text>
                          <Text style={styles.userEmail}>{request.email}</Text>
                        </View>
                      </View>
                      <View style={styles.requestDate}>
                        <Text style={styles.dateText}>{formatDate(request.date_creation)}</Text>
                      </View>
                    </View>

                    {/* Message de la demande */}
                    {request.message && (
                      <View style={styles.messageContainer}>
                        <Text style={styles.messageLabel}>Message :</Text>
                        <Text style={styles.messageText}>{request.message}</Text>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => openRejectModal(request.id_request)}
                        disabled={processingRequestId === request.id_request}
                      >
                        {processingRequestId === request.id_request ? (
                          <ActivityIndicator size="small" color={themeColors.danger} />
                        ) : (
                          <>
                            <MaterialIcons name="close" size={18} color={themeColors.danger} />
                            <Text style={styles.rejectButtonText}>Rejeter</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => confirmAccept(request)}
                        disabled={processingRequestId === request.id_request}
                      >
                        {processingRequestId === request.id_request ? (
                          <ActivityIndicator size="small" color={themeColors.textOnAccent} />
                        ) : (
                          <>
                            <MaterialIcons name="check" size={18} color={themeColors.textOnAccent} />
                            <Text style={styles.acceptButtonText}>Accepter</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal de rejet avec raison */}
      <Modal
        visible={showRejectModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closeRejectModal}
      >
        <View style={styles.rejectModalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Rejeter la demande</Text>
            <Text style={styles.rejectModalDescription}>
              Vous pouvez optionnellement fournir une raison pour le rejet :
            </Text>
            
            <TextInput
              style={styles.rejectReasonInput}
              placeholder="Raison du rejet (optionnel)"
              placeholderTextColor={themeColors.textSecondary}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            
            <Text style={styles.characterCount}>{rejectReason.length}/200</Text>

            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={[styles.rejectModalButton, styles.cancelButton]}
                onPress={closeRejectModal}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.rejectModalButton, styles.confirmRejectButton]}
                onPress={rejectRequest}
                disabled={processingRequestId !== null}
              >
                {processingRequestId !== null ? (
                  <ActivityIndicator size="small" color={themeColors.textOnAccent} />
                ) : (
                  <Text style={styles.confirmRejectButtonText}>Rejeter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ManageJoinRequestsModal;
