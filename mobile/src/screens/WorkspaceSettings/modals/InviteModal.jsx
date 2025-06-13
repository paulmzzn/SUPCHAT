import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../theme/ThemeContext';
import { getStyles } from './InviteModal.styles';
import env from '../../../config/env';

const API_URL = env.API_URL || "https://supchat.fr";

const InviteModal = ({ visible, onClose, workspaceId, workspaceName }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fonction pour valider une adresse email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Rechercher des utilisateurs
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Si c'est une adresse email complète, l'ajouter directement aux résultats
    if (isValidEmail(query)) {
      setSearchResults([{
        id: `email_${query}`,
        email: query,
        nom: query,
        isEmail: true,
        photo_de_profil: null
      }]);
      return;
    }

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      console.log('Searching for users with query:', query);
      
      // Essayer différents endpoints possibles
      let response;
      
      // Premier essai avec l'endpoint de recherche général
      try {
        response = await fetch(`${API_URL}/api/search/users?q=${encodeURIComponent(query)}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.log('First endpoint failed, trying alternative...');
      }

      // Si le premier échoue, essayer un autre endpoint
      if (!response || !response.ok) {
        response = await fetch(`${API_URL}/api/users?search=${encodeURIComponent(query)}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // Si ça échoue encore, essayer sans le workspace_id
      if (!response || !response.ok) {
        response = await fetch(`${API_URL}/api/users/search?query=${encodeURIComponent(query)}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      console.log('Search response status:', response.status);

      if (response.ok) {
        const users = await response.json();
        console.log('Search results count:', users.length);
        
        // Vérifier si la réponse est un tableau
        const usersList = Array.isArray(users) ? users : (users.data || users.users || []);
        
        // Filtrer côté client car l'API ne filtre pas correctement
        const queryLower = query.toLowerCase();
        const filteredUsers = usersList.filter(user => {
          const nameMatch = user.nom && user.nom.toLowerCase().includes(queryLower);
          const emailMatch = user.email && user.email.toLowerCase().includes(queryLower);
          return nameMatch || emailMatch;
        });
        
        console.log('Filtered results count:', filteredUsers.length);
        
        // Filtrer les utilisateurs déjà membres du workspace si l'info est disponible
        const availableUsers = filteredUsers.filter(user => !user.is_member && !user.is_workspace_member);
        
        // Récupérer la liste des membres actuels du workspace pour exclure ceux déjà présents
        try {
          const membersResponse = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            const memberIds = membersData.map(member => member.id_utilisateur || member.user_id || member.id);
            
            // Exclure les membres actuels
            const finalUsers = availableUsers.filter(user => 
              !memberIds.includes(user.id_utilisateur || user.user_id || user.id)
            );
            
            console.log('Final filtered results count:', finalUsers.length);
            setSearchResults(finalUsers);
          } else {
            setSearchResults(availableUsers);
          }
        } catch (memberError) {
          console.log('Could not fetch members, using filtered users:', memberError);
          setSearchResults(availableUsers);
        }
      } else {
        console.log('Search failed with status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        
        // Si c'est une erreur 404, l'endpoint n'existe pas
        if (response.status === 404) {
          console.log('Search endpoint not found, users search may not be implemented');
          Toast.show({
            type: 'info',
            text1: 'Recherche non disponible',
            text2: 'Vous pouvez inviter directement par email'
          });
        }
        
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce pour la recherche
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Ajouter/retirer un utilisateur de la sélection
  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const userId = user.id || user.id_utilisateur || user.user_id;
      const isSelected = prev.find(u => {
        const existingUserId = u.id || u.id_utilisateur || u.user_id;
        return existingUserId === userId;
      });
      
      if (isSelected) {
        return prev.filter(u => {
          const existingUserId = u.id || u.id_utilisateur || u.user_id;
          return existingUserId !== userId;
        });
      } else {
        return [...prev, user];
      }
    });
  };

  // Envoyer les invitations
  const sendInvitations = async () => {
    if (selectedUsers.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Aucun utilisateur sélectionné',
        text2: 'Veuillez sélectionner au moins un utilisateur à inviter'
      });
      return;
    }

    try {
      setInviting(true);
      const token = await AsyncStorage.getItem('token');

      const invitationPromises = selectedUsers.map(async (user) => {
        console.log('Processing invitation for user:', user);
        
        // Si c'est une invitation par email
        if (user.isEmail) {
          console.log('Sending email invitation to:', user.email);
          
          const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/invite`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: user.email
            })
          });

          return response;
        } else {
          // Invitation d'un utilisateur existant
          const userId = user.id_utilisateur || user.user_id || user.id;
          const userEmail = user.email;
          
          console.log('Sending user invitation:', {
            userId: userId,
            email: userEmail,
            workspaceId: workspaceId
          });
          
          const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/invite`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: userId,
              email: userEmail,
              workspaceId: workspaceId
            })
          });

          return response;
        }
      });

      const responses = await Promise.allSettled(invitationPromises);
      
      let successful = 0;
      let failed = 0;

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (response.status === 'fulfilled' && response.value && response.value.ok) {
          successful++;
          console.log(`Invitation successful for: ${selectedUsers[i].email || selectedUsers[i].nom}`);
        } else {
          failed++;
          console.log(`Invitation failed for user ${selectedUsers[i].email || selectedUsers[i].nom}:`, response);
          
          if (response.status === 'fulfilled' && response.value) {
            const errorText = await response.value.text();
            console.log('Error details:', errorText);
          }
        }
      }

      if (successful > 0) {
        Toast.show({
          type: 'success',
          text1: 'Invitations envoyées',
          text2: `${successful} invitation(s) envoyée(s) avec succès${failed > 0 ? `, ${failed} échouée(s)` : ''}`
        });
        
        // Réinitialiser et fermer la modal
        setSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible d\'envoyer les invitations. Vérifiez que les adresses sont valides.'
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des invitations:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Une erreur est survenue lors de l\'envoi'
      });
    } finally {
      setInviting(false);
    }
  };

  // Réinitialiser la modal à la fermeture
  const handleClose = () => {
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  // Rendu d'un utilisateur dans les résultats de recherche
  const renderUser = ({ item }) => {
    const userId = item.id || item.id_utilisateur || item.user_id;
    const isSelected = selectedUsers.find(u => {
      const existingUserId = u.id || u.id_utilisateur || u.user_id;
      return existingUserId === userId;
    });
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUserSelection(item)}
      >
        <View style={styles.userAvatar}>
          {item.photo_de_profil ? (
            <Image source={{ uri: item.photo_de_profil }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.userAvatar, item.isEmail && styles.emailAvatar]}>
              <Ionicons 
                name={item.isEmail ? "mail" : "person"} 
                size={20} 
                color={themeColors.textOnAccent} 
              />
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.isEmail ? item.email : (item.nom || 'Utilisateur sans nom')}
          </Text>
          {!item.isEmail && (
            <Text style={styles.userEmail}>{item.email}</Text>
          )}
          {item.isEmail && (
            <Text style={styles.emailLabel}>Envoyer une invitation par email</Text>
          )}
        </View>
        
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color={themeColors.textOnAccent} />}
        </View>
      </TouchableOpacity>
    );
  };

  // Rendu d'un utilisateur sélectionné
  const renderSelectedUser = ({ item }) => {
    const userId = item.id || item.id_utilisateur || item.user_id;
    
    return (
      <View style={styles.selectedUserChip}>
        <Text style={styles.selectedUserText}>
          {item.isEmail ? item.email : item.nom}
        </Text>
        <TouchableOpacity
          style={styles.removeUserButton}
          onPress={() => toggleUserSelection(item)}
        >
          <Ionicons name="close" size={16} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* En-tête */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Inviter des membres</Text>
            <TouchableOpacity
              style={[styles.sendButton, selectedUsers.length === 0 && styles.sendButtonDisabled]}
              onPress={sendInvitations}
              disabled={inviting || selectedUsers.length === 0}
            >
              {inviting ? (
                <ActivityIndicator size="small" color={themeColors.textOnAccent} />
              ) : (
                <Text style={[styles.sendButtonText, selectedUsers.length === 0 && styles.sendButtonTextDisabled]}>
                  Envoyer
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sous-titre */}
          <Text style={styles.subtitle}>
            Inviter des personnes à rejoindre "{workspaceName}"
          </Text>

          {/* Barre de recherche */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom, email ou saisir une adresse email..."
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            {searchLoading && (
              <ActivityIndicator size="small" color={themeColors.accentPrimary} style={styles.searchLoader} />
            )}
          </View>

          {/* Utilisateurs sélectionnés */}
          {selectedUsers.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedTitle}>
                Sélectionnés ({selectedUsers.length})
              </Text>
              <FlatList
                horizontal
                data={selectedUsers}
                keyExtractor={(item) => item.id || item.id_utilisateur || item.user_id || item.email}
                renderItem={renderSelectedUser}
                showsHorizontalScrollIndicator={false}
                style={styles.selectedList}
              />
            </View>
          )}

          {/* Résultats de recherche */}
          <View style={styles.resultsContainer}>
            {searchQuery.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={themeColors.textMuted} />
                <Text style={styles.emptyStateText}>
                  Recherchez des utilisateurs par nom ou email, ou saisissez une adresse email complète pour envoyer une invitation
                </Text>
              </View>
            ) : searchResults.length === 0 && !searchLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="person-outline" size={48} color={themeColors.textMuted} />
                <Text style={styles.emptyStateText}>
                  Aucun utilisateur trouvé
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id || item.id_utilisateur || item.user_id || item.email}
                renderItem={renderUser}
                showsVerticalScrollIndicator={false}
                style={styles.resultsList}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default InviteModal;
