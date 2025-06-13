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
  RefreshControl,
  Switch
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../theme/ThemeContext';
import { getStyles } from './ManageMembersModal.styles';
import env from '../../../config/env';

const API_URL = env.API_URL || "https://supchat.fr";
const S3_BASE_URL = env.S3_BASE_URL;

// Fonction pour construire l'URL complète d'une image
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('file://') || imagePath.startsWith('content://')) return imagePath;
  return `${S3_BASE_URL}${imagePath}`;
};

const ManageMembersModal = ({ 
  visible, 
  onClose, 
  workspaceId, 
  workspaceName,
  currentUserRole 
}) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const [members, setMembers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [memberChannelPermissions, setMemberChannelPermissions] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  // Charger les données initiales
  useEffect(() => {
    if (visible) {
      loadData();
      getCurrentUserId();
    }
  }, [visible, workspaceId]);

  // Obtenir l'ID utilisateur actuel
  const getCurrentUserId = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        setCurrentUserId(user.id);
      } else {
        // Fallback avec le token
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(payload.sub || payload.user_id || payload.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    }
  };

  // Charger tous les données
  const loadData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      await Promise.all([
        loadMembers(),
        loadChannels()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les données'
      });
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  };

  // Charger les membres
  const loadMembers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  // Charger les canaux
  const loadChannels = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspace/${workspaceId}/canals`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedChannels = data.map(canal => ({
          id: canal.id_canal,
          name: canal.nom,
          isPrivate: canal.is_private || false,
          description: canal.description || ''
        }));
        setChannels(formattedChannels);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des canaux:', error);
    }
  };

  // Charger les permissions d'un membre pour les canaux
  const loadMemberChannelPermissions = async (memberId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const permissions = {};
      
      for (const channel of channels) {
        if (channel.isPrivate) {
          // Utiliser la route existante pour vérifier l'accès
          const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${memberId}/channel-access`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const channelAccesses = await response.json();
            const channelAccess = channelAccesses.find(access => access.canalId === channel.id);
            
            permissions[channel.id] = {
              hasAccess: !!channelAccess,
              permission: channelAccess?.accessType || null
            };
          } else {
            permissions[channel.id] = {
              hasAccess: false,
              permission: null
            };
          }
        } else {
          // Accès automatique aux canaux publics avec lecture/écriture
          permissions[channel.id] = {
            hasAccess: true,
            permission: 'lecture_ecriture'
          };
        }
      }
      
      setMemberChannelPermissions(permissions);
    } catch (error) {
      console.error('Erreur lors du chargement des permissions:', error);
    }
  };

  // Gérer le rafraîchissement
  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Filtrer les membres selon la recherche
  const filteredMembers = members.filter(member =>
    member.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Changer le rôle d'un membre
  const changeMemberRole = async (memberId, newRole) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Impossible de changer le rôle');
      }

      Toast.show({
        type: 'success',
        text1: 'Rôle modifié',
        text2: `Le membre est maintenant ${newRole === 'admin' ? 'administrateur' : 'membre'}`
      });

      // Recharger les membres
      loadMembers();
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de changer le rôle'
      });
    }
  };

  // Supprimer un membre
  const removeMember = async (memberId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: currentUserId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Impossible de supprimer le membre');
      }

      Toast.show({
        type: 'success',
        text1: 'Membre supprimé',
        text2: 'Le membre a été retiré du workspace'
      });

      // Recharger les membres
      loadMembers();
      setShowMemberDetails(false);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de supprimer le membre'
      });
    }
  };

  // Gérer l'accès aux canaux privés avec permissions
  const updateChannelAccess = async (channelId, currentAccess, newPermission = null) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!newPermission) {
        // Retirer l'accès en utilisant la route existante
        const response = await fetch(`${API_URL}/api/canaux/${channelId}/members/${selectedMember.id_utilisateur}/access`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            accessType: 'remove'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Impossible de retirer l\'accès au canal');
        }
      } else {
        // Ajouter ou modifier l'accès
        const response = await fetch(`${API_URL}/api/canaux/${channelId}/members/${selectedMember.id_utilisateur}/access`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            accessType: newPermission
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Impossible de modifier l\'accès au canal');
        }
      }

      // Mettre à jour les permissions localement
      setMemberChannelPermissions(prev => ({
        ...prev,
        [channelId]: {
          hasAccess: !!newPermission,
          permission: newPermission
        }
      }));

      const channel = channels.find(c => c.id === channelId);
      const permissionText = newPermission === 'lecture_ecriture' ? 'lecture et écriture' : 'lecture seule';
      
      Toast.show({
        type: 'success',
        text1: !newPermission ? 'Accès retiré' : 'Accès modifié',
        text2: !newPermission 
          ? `Le membre n'a plus accès au canal ${channel?.name}` 
          : `Le membre a maintenant un accès en ${permissionText} au canal ${channel?.name}`
      });
    } catch (error) {
      console.error('Erreur lors de la modification de l\'accès:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de modifier l\'accès au canal'
      });
    }
  };

  // Ouvrir les détails d'un membre
  const openMemberDetails = (member) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
    loadMemberChannelPermissions(member.id_utilisateur);
  };

  // Confirmer le changement de rôle
  const confirmRoleChange = (member, newRole) => {
    const roleText = newRole === 'admin' ? 'administrateur' : 'membre';
    Alert.alert(
      'Changer le rôle',
      `Êtes-vous sûr de vouloir changer le rôle de ${member.nom} en ${roleText} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: () => changeMemberRole(member.id_utilisateur, newRole) 
        }
      ]
    );
  };

  // Confirmer la suppression d'un membre
  const confirmRemoveMember = (member) => {
    Alert.alert(
      'Supprimer le membre',
      `Êtes-vous sûr de vouloir retirer ${member.nom} de ce workspace ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => removeMember(member.id_utilisateur) 
        }
      ]
    );
  };

  // Obtenir l'icône et la couleur du rôle
  const getRoleInfo = (role) => {
    switch(role) {
      case 'owner':
        return { 
          icon: 'crown', 
          color: themeColors.accentPrimary,
          label: 'Propriétaire'
        };
      case 'admin':
        return { 
          icon: 'admin-panel-settings', 
          color: themeColors.accentSecondary,
          label: 'Administrateur'
        };
      default:
        return { 
          icon: 'person', 
          color: themeColors.textMuted,
          label: 'Membre'
        };
    }
  };

  return (
    <>
      {/* Modal principale */}
      <Modal
        visible={visible && !showMemberDetails}
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
            <Text style={styles.title}>Gérer les membres</Text>
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

          {/* Barre de recherche */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={themeColors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un membre..."
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Contenu */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.accentPrimary} />
              <Text style={styles.loadingText}>Chargement des membres...</Text>
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
              {filteredMembers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={64} color={themeColors.textMuted} />
                  <Text style={styles.emptyTitle}>Aucun membre trouvé</Text>
                  <Text style={styles.emptyDescription}>
                    {searchQuery ? 'Aucun membre ne correspond à votre recherche.' : 'Ce workspace n\'a aucun membre.'}
                  </Text>
                </View>
              ) : (
                filteredMembers.map((member) => {
                  const roleInfo = getRoleInfo(member.role);
                  const canManage = currentUserRole === 'owner' || 
                    (currentUserRole === 'admin' && member.role !== 'owner');
                  
                  return (
                    <TouchableOpacity 
                      key={member.id_utilisateur} 
                      style={styles.memberCard}
                      onPress={() => openMemberDetails(member)}
                    >
                      {/* Avatar et informations */}
                      <View style={styles.memberInfo}>
                        {member.photo_url ? (
                          <Image 
                            source={{ uri: getImageUrl(member.photo_url) }} 
                            style={styles.memberAvatar}
                          />
                        ) : (
                          <View style={styles.memberAvatarPlaceholder}>
                            <Ionicons name="person" size={20} color={themeColors.textSecondary} />
                          </View>
                        )}
                        
                        <View style={styles.memberDetails}>
                          <Text style={styles.memberName}>{member.nom}</Text>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                          
                          {/* Badge de rôle */}
                          <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20' }]}>
                            {member.role === 'owner' ? (
                              <FontAwesome5 name={roleInfo.icon} size={12} color={roleInfo.color} />
                            ) : (
                              <MaterialIcons name={roleInfo.icon} size={12} color={roleInfo.color} />
                            )}
                            <Text style={[styles.roleText, { color: roleInfo.color }]}>
                              {roleInfo.label}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Actions rapides */}
                      <View style={styles.memberActions}>
                        {canManage && member.id_utilisateur !== currentUserId && (
                          <>
                            {member.role === 'member' && (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.promoteButton]}
                                onPress={() => confirmRoleChange(member, 'admin')}
                              >
                                <MaterialIcons name="admin-panel-settings" size={16} color={themeColors.accentPrimary} />
                              </TouchableOpacity>
                            )}
                            
                            {member.role === 'admin' && currentUserRole === 'owner' && (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.demoteButton]}
                                onPress={() => confirmRoleChange(member, 'member')}
                              >
                                <MaterialIcons name="person" size={16} color={themeColors.textMuted} />
                              </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity
                              style={[styles.actionButton, styles.removeButton]}
                              onPress={() => confirmRemoveMember(member)}
                            >
                              <MaterialIcons name="person-remove" size={16} color={themeColors.danger} />
                            </TouchableOpacity>
                          </>
                        )}
                        
                        <TouchableOpacity style={styles.detailsButton}>
                          <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal des détails du membre */}
      <Modal
        visible={showMemberDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMemberDetails(false)}
      >
        <SafeAreaView style={styles.container}>
          {/* En-tête détails */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowMemberDetails(false)}
            >
              <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Détails du membre</Text>
            <View style={styles.headerSpacer} />
          </View>

          {selectedMember && (
            <ScrollView style={styles.content}>
              {/* Informations du membre */}
              <View style={styles.memberDetailsCard}>
                <View style={styles.memberDetailsHeader}>
                  {selectedMember.photo_url ? (
                    <Image 
                      source={{ uri: getImageUrl(selectedMember.photo_url) }} 
                      style={styles.memberDetailsAvatar}
                    />
                  ) : (
                    <View style={styles.memberDetailsAvatarPlaceholder}>
                      <Ionicons name="person" size={32} color={themeColors.textSecondary} />
                    </View>
                  )}
                  
                  <View style={styles.memberDetailsInfo}>
                    <Text style={styles.memberDetailsName}>{selectedMember.nom}</Text>
                    <Text style={styles.memberDetailsEmail}>{selectedMember.email}</Text>
                    
                    {/* Badge de rôle large */}
                    {(() => {
                      const roleInfo = getRoleInfo(selectedMember.role);
                      return (
                        <View style={[styles.roleDetailsCard, { backgroundColor: roleInfo.color + '20' }]}>
                          {selectedMember.role === 'owner' ? (
                            <FontAwesome5 name={roleInfo.icon} size={16} color={roleInfo.color} />
                          ) : (
                            <MaterialIcons name={roleInfo.icon} size={16} color={roleInfo.color} />
                          )}
                          <Text style={[styles.roleDetailsText, { color: roleInfo.color }]}>
                            {roleInfo.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              </View>

              {/* Gestion des rôles */}
              {currentUserRole === 'owner' && selectedMember.id_utilisateur !== currentUserId && selectedMember.role !== 'owner' && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Gestion des rôles</Text>
                  
                  <TouchableOpacity 
                    style={styles.roleOption}
                    onPress={() => confirmRoleChange(selectedMember, selectedMember.role === 'admin' ? 'member' : 'admin')}
                  >
                    <MaterialIcons 
                      name={selectedMember.role === 'admin' ? 'person' : 'admin-panel-settings'} 
                      size={24} 
                      color={themeColors.accentPrimary} 
                    />
                    <View style={styles.roleOptionContent}>
                      <Text style={styles.roleOptionTitle}>
                        {selectedMember.role === 'admin' ? 'Rétrograder en membre' : 'Promouvoir administrateur'}
                      </Text>
                      <Text style={styles.roleOptionDescription}>
                        {selectedMember.role === 'admin' 
                          ? 'Retirer les privilèges d\'administration' 
                          : 'Donner les privilèges d\'administration'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Accès aux canaux privés */}
              {channels.some(c => c.isPrivate) && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Accès aux canaux privés</Text>
                  
                  {channels.filter(c => c.isPrivate).map((channel) => {
                    const channelPermission = memberChannelPermissions[channel.id];
                    
                    return (
                      <View key={channel.id} style={styles.channelPermissionRow}>
                        <View style={styles.channelInfo}>
                          <Ionicons name="lock-closed" size={20} color={themeColors.textSecondary} />
                          <View style={styles.channelDetails}>
                            <Text style={styles.channelName}>{channel.name}</Text>
                            {channel.description && (
                              <Text style={styles.channelDescription}>{channel.description}</Text>
                            )}
                          </View>
                        </View>
                        
                        <Switch
                          value={channelPermission?.hasAccess}
                          onValueChange={() => updateChannelAccess(channel.id, channelPermission?.hasAccess, channelPermission?.hasAccess ? null : 'lecture_ecriture')}
                          trackColor={{ 
                            false: themeColors.switchTrackFalse, 
                            true: themeColors.switchTrackTrue 
                          }}
                          thumbColor={
                            channelPermission?.hasAccess 
                              ? themeColors.switchThumbTrue 
                              : themeColors.switchThumbFalse
                          }
                        />
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Actions dangereuses */}
              {selectedMember.id_utilisateur !== currentUserId && (
                <View style={styles.dangerSection}>
                  <Text style={styles.dangerSectionTitle}>Actions dangereuses</Text>
                  
                  <TouchableOpacity 
                    style={styles.dangerOption}
                    onPress={() => confirmRemoveMember(selectedMember)}
                  >
                    <MaterialIcons name="person-remove" size={24} color={themeColors.danger} />
                    <View style={styles.dangerOptionContent}>
                      <Text style={styles.dangerOptionTitle}>Retirer du workspace</Text>
                      <Text style={styles.dangerOptionDescription}>
                        Ce membre perdra l'accès à tous les canaux et messages
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={themeColors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default ManageMembersModal;
