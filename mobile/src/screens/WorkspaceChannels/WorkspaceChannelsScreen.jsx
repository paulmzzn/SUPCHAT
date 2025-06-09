import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import env from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme/ThemeContext';
import { useSocket } from '../../context/SocketContext'; // Importer useSocket
import CreateChannelModal from '../../components/CreateChannelModal';
import { getStyles } from './WorkspaceChannelsScreen.styles';

const WorkspaceChannelsScreen = ({ route, navigation }) => {
  const { workspaceId } = route.params;
  const { colors: themeColors } = useTheme();
  const { socket, channelUnreadCounts, getChannelUnreadCount, refreshUnreadCounts, markChannelAsRead } = useSocket(); // Ajouter markChannelAsRead
  const styles = getStyles(themeColors);
  
  const [workspace, setWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateChannelModalVisible, setCreateChannelModalVisible] = useState(false);
  const [userRole, setUserRole] = useState('member');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
  // États pour la recherche unifiée
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    channels: [],
    users: [],
    messages: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState('channels');
  const [lastSearchQuery, setLastSearchQuery] = useState(''); // Pour éviter les recherches en double

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  useEffect(() => {
    fetchChannels();
    refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  // Se connecter au workspace pour les notifications
  useEffect(() => {
    if (socket && workspaceId) {
      socket.emit('joinWorkspace', { 
        workspaceId, 
        userId: socket.userId 
      });

      return () => {
        socket.emit('leaveWorkspace', { 
          workspaceId, 
          userId: socket.userId 
        });
      };
    }
  }, [socket, workspaceId]);

  // Mettre à jour les canaux quand les compteurs changent
  useEffect(() => {
    if (channels.length > 0 && getChannelUnreadCount) {
      const updatedChannels = channels.map(channel => ({
        ...channel,
        unreadCount: getChannelUnreadCount(channel.id) || 0
      }));
      
      // Ne mettre à jour que si les compteurs ont changé
      const hasCountChanges = updatedChannels.some((channel, index) => 
        channel.unreadCount !== channels[index]?.unreadCount
      );
      
      if (hasCountChanges) {
        setChannels(updatedChannels);
      }
    }
  }, [channelUnreadCounts, getChannelUnreadCount]);

  // Fonction pour charger le nombre de demandes en attente
  const loadPendingRequestsCount = async () => {
    try {
      // Seulement pour les admins et owners
      if (userRole !== 'admin' && userRole !== 'owner') {
        return;
      }

      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/workspaces/${workspaceId}/requests`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const requests = await response.json();
        setPendingRequestsCount(requests.length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    }
  };

  // Fonction pour déterminer le rôle de l'utilisateur
  const checkUserRole = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/workspaces/${workspaceId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const membersData = await response.json();
        
        // Récupérer l'utilisateur actuel
        let currentUser = null;
        const possibleKeys = ['user', 'currentUser', 'authUser', 'userData'];
        
        for (const key of possibleKeys) {
          const userString = await AsyncStorage.getItem(key);
          if (userString) {
            currentUser = JSON.parse(userString);
            break;
          }
        }
        
        if (!currentUser) {
          // Fallback: décoder le token
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.sub || payload.user_id || payload.id;
            
            const currentMember = membersData.find(member => 
              member.id_utilisateur === userId
            );
            
            if (currentMember) {
              const role = currentMember.role || 'member';
              setUserRole(role);
              return;
            }
          } catch (tokenError) {
            console.log('Error decoding token:', tokenError);
          }
        } else {
          // Trouver le rôle de l'utilisateur actuel dans la liste des membres
          const currentMember = membersData.find(member => {
            return member.id_utilisateur === currentUser.id || 
                   member.user_id === currentUser.id ||
                   member.id === currentUser.id ||
                   member.email === currentUser.email ||
                   member.nom === currentUser.nom;
          });
          
          if (currentMember) {
            const role = currentMember.role || currentMember.pivot?.role || 'member';
            setUserRole(role);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
    }
  };

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchWorkspaceDetails(),
        fetchChannels(),
        fetchMembers(),
        checkUserRole()
      ]);
    } catch (error) {
      console.error('Erreur chargement workspace:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger le workspace'
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les demandes en attente après avoir déterminé le rôle
  useEffect(() => {
    if (userRole && (userRole === 'admin' || userRole === 'owner')) {
      loadPendingRequestsCount();
    }
  }, [userRole, workspaceId]);

  // Fonction de recherche unifiée avec debouncing
  const searchInWorkspace = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults({ channels: [], users: [], messages: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const token = await AsyncStorage.getItem('token');
      // Ajout du paramètre limit pour les messages (par défaut 100)
      const response = await fetch(
        `${env.API_URL}/api/search/workspace/${workspaceId}?query=${encodeURIComponent(query.trim())}&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Formater les résultats pour React Native
        const formattedResults = {
          channels: data.canaux?.map((channel) => ({
            id: channel.id_canal,
            name: channel.nom,
            description: channel.description || '',
            isPrivate: channel.is_private || false,
          })) || [],
          users: data.utilisateurs?.map((user) => ({
            id: user.id_utilisateur,
            name: user.nom,
            email: user.email,
            avatar: user.photo_de_profil,
          })) || [],
          messages: data.messages?.map((message) => ({
            id: message.id_message,
            content: message.contenu,
            date: message.date_creation || message.created_at,
            userName: message.nom_utilisateur,
            userId: message.id_utilisateur,
            channelId: message.id_canal,
            channelName: message.nom_canal,
          })) || [],
        };

        setSearchResults(formattedResults);
        
        // Déterminer l'onglet actif en fonction des résultats
        if (formattedResults.users.length > 0) {
          setActiveSearchTab('users');
        } else if (formattedResults.messages.length > 0) {
          setActiveSearchTab('messages');
        } else if (formattedResults.channels.length > 0) {
          setActiveSearchTab('channels');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults({ channels: [], users: [], messages: [] });
      Toast.show({
        type: 'error',
        text1: 'Erreur de recherche',
        text2: 'Impossible d\'effectuer la recherche'
      });
    } finally {
      setIsSearching(false);
    }
  }, [workspaceId]);

  // Debouncing pour la recherche
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchInWorkspace(searchQuery);
      } else {
        setSearchResults({ channels: [], users: [], messages: [] });
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchInWorkspace]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkspaceData();
    // Recharger aussi les demandes d'adhésion
    if (userRole === 'admin' || userRole === 'owner') {
      await loadPendingRequestsCount();
    }
    setRefreshing(false);
  };

  const fetchWorkspaceDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkspace(data);
      }
    } catch (error) {
      console.error('Erreur workspace details:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log(`Récupération des canaux pour workspace ${workspaceId}`);
      
      // Essayons une URL alternative au cas où
      const url = `${env.API_URL}/api/workspace/${workspaceId}/canals`;
      console.log('URL de la requête:', url);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Statut de la réponse:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Données des canaux reçues:', JSON.stringify(data));
        
        if (Array.isArray(data)) {
          const formattedChannels = data.map(canal => ({
            id: canal.id_canal,
            name: canal.nom,
            isPrivate: canal.is_private || false,
            description: canal.description || '',
            memberCount: canal.member_count || 0,
            unreadCount: 0, // Sera mis à jour par l'useEffect
            workspaceId: workspaceId // Inclure le workspaceId
          }));
          setChannels(formattedChannels);
          // Rafraîchir les compteurs après avoir chargé les canaux
          setTimeout(() => {
            refreshUnreadCounts();
          }, 500);
        }
      } else {
        // Essayons une URL alternative
        const alternativeUrl = `${env.API_URL}/api/workspaces/${workspaceId}/canals`;
        console.log('Essai avec URL alternative:', alternativeUrl);
        
        const alternativeResponse = await fetch(alternativeUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Statut de la réponse alternative:', alternativeResponse.status);
        
        if (alternativeResponse.ok) {
          const data = await alternativeResponse.json();
          console.log('Données des canaux reçues (alternative):', JSON.stringify(data));
          
          if (Array.isArray(data)) {
            const formattedChannels = data.map(canal => ({
              id: canal.id_canal,
              name: canal.nom,
              isPrivate: canal.is_private || false,
              description: canal.description || '',
              memberCount: canal.member_count || 0,
              unreadCount: 0, // Sera mis à jour par l'useEffect
              workspaceId: workspaceId // Inclure le workspaceId
            }));
            setChannels(formattedChannels);
            // Rafraîchir les compteurs après avoir chargé les canaux
            setTimeout(() => {
              refreshUnreadCounts();
            }, 500);
          }
        } else {
          console.error('Échec de la requête alternative:', alternativeResponse.status);
          const errorText = await response.text();
          console.error('Détails de l\'erreur:', errorText);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des canaux:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/workspaces/${workspaceId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Erreur members:', error);
    }
  };

  const handleChannelCreated = (newChannel) => {
    // Rafraîchir la liste des canaux après la création d'un nouveau canal
    fetchChannels();
    Toast.show({
      type: 'success',
      text1: 'Canal créé',
      text2: `Le canal a été créé avec succès`,
      position: 'bottom'
    });
  };

  const navigateToChannel = (channel) => {
    navigation.navigate('Workspace', {
      workspaceId,
      channelId: channel.id,
      channelName: channel.name,
      workspaceName: workspace?.nom
    });
  };

  // Fonctions de gestion des résultats de recherche
  const handleSearchResultSelect = (type, item) => {
    setShowSearchModal(false);
    setSearchQuery('');
    
    if (type === 'channel') {
      navigation.navigate('Workspace', {
        workspaceId,
        channelId: item.id,
        channelName: item.name,
        workspaceName: workspace?.nom
      });
    } else if (type === 'message') {
      // Naviguer vers le canal du message
      navigation.navigate('Workspace', {
        workspaceId,
        channelId: item.channelId,
        channelName: item.channelName,
        workspaceName: workspace?.nom,
        highlightMessageId: item.id
      });
    } else if (type === 'user') {
      // Ici on pourrait naviguer vers le profil utilisateur ou démarrer une conversation
      Toast.show({
        type: 'info',
        text1: 'Profil utilisateur',
        text2: `Profil de ${item.name} sélectionné`
      });
    }
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults({ channels: [], users: [], messages: [] });
  };

  const formatSearchDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const hasSearchResults = () => {
    return searchResults.channels.length > 0 || 
           searchResults.users.length > 0 || 
           searchResults.messages.length > 0;
  };

  const renderChannel = ({ item }) => (
    <TouchableOpacity
      style={styles.channelItem}
      onPress={() => navigation.navigate('Workspace', {
        workspaceId: workspaceId,
        channelId: item.id,
        channelName: item.name,
        workspaceName: workspace?.nom
      })}
    >
      <View style={styles.channelIcon}>
        {item.isPrivate ? (
          <Ionicons
            name="lock-closed"
            size={20}
            color={themeColors.textSecondary}
          />
        ) : (
          <Text style={[styles.hashtagIcon, { color: themeColors.textSecondary }]}>
            #
          </Text>
        )}
      </View>
      
      <View style={styles.channelContent}>
        <View style={styles.channelHeader}>
          <Text style={styles.channelName}>{item.name}</Text>
        </View>
      </View>

      {/* Badge de notification */}
      {item.unreadCount > 0 && (
        <View style={styles.channelBadge}>
          <Text style={styles.channelBadgeText}>
            {item.unreadCount > 99 ? '99+' : item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={styles.loadingText}>Chargement du workspace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {workspace?.nom || 'Workspace'}
          </Text>
        </View>
        
        {/* Bouton de recherche */}
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => navigation.navigate('WorkspaceSettings', { 
            workspaceId, 
            workspaceName: workspace?.nom || 'Workspace' 
          })}
        >
          <Ionicons name="settings-outline" size={24} color={themeColors.textPrimary} />
          {/* Badge de notification sur l'icône paramètres */}
          {pendingRequestsCount > 0 && (userRole === 'admin' || userRole === 'owner') && (
            <View style={styles.settingsNotificationBadge}>
              <Text style={styles.settingsNotificationText}>
                {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.accentPrimary}
          />
        }
      >
        {/* Workspace Info */}
        <View style={styles.workspaceInfo}>
          <View style={styles.workspaceHeader}>
            {workspace?.icon_url ? (
              <Image 
                source={{ uri: workspace.icon_url.startsWith('http') 
                  ? workspace.icon_url 
                  : env.S3_BASE_URL + workspace.icon_url 
                }} 
                style={styles.workspaceAvatar} 
              />
            ) : (
              <View style={styles.workspaceAvatar}>
                <Text style={styles.workspaceAvatarText}>
                  {workspace?.nom?.charAt(0)?.toUpperCase() || 'W'}
                </Text>
              </View>
            )}
            
            <View style={styles.workspaceDetails}>
              <Text style={styles.workspaceTitle}>{workspace?.nom}</Text>
              <Text style={styles.workspaceDescription}>
                {workspace?.description || 'Aucune description'}
              </Text>
            </View>
          </View>
          
          <View style={styles.workspaceStats}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                console.log('Navigation vers WorkspaceMembers avec params:', {
                  workspaceId,
                  workspaceName: workspace?.nom
                });
                navigation.navigate('WorkspaceMembers', {
                  workspaceId: workspaceId,
                  workspaceName: workspace?.nom || 'Workspace'
                });
              }}
            >
              <Text style={styles.statNumber}>{channels.length}</Text>
              <Text style={styles.statLabel}>
                {channels.length === 1 ? 'Canal' : 'Canaux'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                console.log('Navigation vers WorkspaceMembers avec params:', {
                  workspaceId,
                  workspaceName: workspace?.nom
                });
                navigation.navigate('WorkspaceMembers', {
                  workspaceId: workspaceId,
                  workspaceName: workspace?.nom || 'Workspace'
                });
              }}
            >
              <Text style={styles.statNumber}>{members.length}</Text>
              <Text style={styles.statLabel}>
                {members.length === 1 ? 'Membre' : 'Membres'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                console.log('Navigation vers WorkspaceMembers avec params:', {
                  workspaceId,
                  workspaceName: workspace?.nom
                });
                navigation.navigate('WorkspaceMembers', {
                  workspaceId: workspaceId,
                  workspaceName: workspace?.nom || 'Workspace'
                });
              }}
            >
              <Text style={styles.statNumber}>
                {members.filter(m => m.status === 1).length}
              </Text>
              <Text style={styles.statLabel}>En ligne</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Channels List */}
        <View style={styles.channelsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Canaux</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setCreateChannelModalVisible(true)}
            >
              <Ionicons name="add" size={20} color={themeColors.accentPrimary} />
            </TouchableOpacity>
          </View>
          
          {channels.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={60} color={themeColors.textMuted} />
              <Text style={styles.emptyStateText}>Aucun canal disponible</Text>
            </View>
          ) : (
            <FlatList
              data={channels}
              renderItem={renderChannel}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal de création de canal */}
      <CreateChannelModal
        visible={isCreateChannelModalVisible}
        onClose={() => setCreateChannelModalVisible(false)}
        workspaceId={workspaceId}
        onChannelCreated={handleChannelCreated}
      />

      {/* Modal de recherche unifiée */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseSearchModal}
      >
        <View style={styles.searchModal}>
          {/* Header de la modal de recherche */}
          <View style={styles.searchModalHeader}>
            <TouchableOpacity
              style={styles.searchModalCloseButton}
              onPress={handleCloseSearchModal}
            >
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.searchModalTitle}>Rechercher dans {workspace?.nom}</Text>
          </View>

          {/* Barre de recherche */}
          <View style={styles.searchInputContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher canaux, utilisateurs, messages..."
                placeholderTextColor={themeColors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {isSearching && (
                <ActivityIndicator 
                  size="small" 
                  color={themeColors.accentPrimary} 
                  style={styles.searchSpinner}
                />
              )}
            </View>
          </View>

          {/* Onglets de résultats */}
          {searchQuery.length >= 2 && hasSearchResults() && (
            <View style={styles.searchTabs}>
              {searchResults.channels.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.searchTab,
                    activeSearchTab === 'channels' && styles.searchTabActive
                  ]}
                  onPress={() => setActiveSearchTab('channels')}
                >
                  <Ionicons name="chatbubbles-outline" size={16} color={
                    activeSearchTab === 'channels' ? themeColors.accentPrimary : themeColors.textSecondary
                  } />
                  <Text style={[
                    styles.searchTabText,
                    activeSearchTab === 'channels' && styles.searchTabTextActive
                  ]}>
                    Canaux ({searchResults.channels.length})
                  </Text>
                </TouchableOpacity>
              )}
              
              {searchResults.users.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.searchTab,
                    activeSearchTab === 'users' && styles.searchTabActive
                  ]}
                  onPress={() => setActiveSearchTab('users')}
                >
                  <Ionicons name="person-outline" size={16} color={
                    activeSearchTab === 'users' ? themeColors.accentPrimary : themeColors.textSecondary
                  } />
                  <Text style={[
                    styles.searchTabText,
                    activeSearchTab === 'users' && styles.searchTabTextActive
                  ]}>
                    Utilisateurs ({searchResults.users.length})
                  </Text>
                </TouchableOpacity>
              )}
              
              {searchResults.messages.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.searchTab,
                    activeSearchTab === 'messages' && styles.searchTabActive
                  ]}
                  onPress={() => setActiveSearchTab('messages')}
                >
                  <Ionicons name="chatbox-outline" size={16} color={
                    activeSearchTab === 'messages' ? themeColors.accentPrimary : themeColors.textSecondary
                  } />
                  <Text style={[
                    styles.searchTabText,
                    activeSearchTab === 'messages' && styles.searchTabTextActive
                  ]}>
                    Messages ({searchResults.messages.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Résultats de recherche */}
          <ScrollView style={styles.searchResults}>
            {searchQuery.length < 2 ? (
              <View style={styles.searchEmptyState}>
                <Ionicons name="search" size={60} color={themeColors.textMuted} />
                <Text style={styles.searchEmptyText}>
                  Tapez au moins 2 caractères pour rechercher
                </Text>
              </View>
            ) : !hasSearchResults() && !isSearching ? (
              <View style={styles.searchEmptyState}>
                <Ionicons name="sad-outline" size={60} color={themeColors.textMuted} />
                <Text style={styles.searchEmptyText}>
                  Aucun résultat trouvé pour "{searchQuery}"
                </Text>
              </View>
            ) : (
              <>
                {/* Résultats des canaux */}
                {activeSearchTab === 'channels' && searchResults.channels.map((channel) => (
                  <TouchableOpacity
                    key={`channel-${channel.id}`}
                    style={styles.searchResultItem}
                    onPress={() => handleSearchResultSelect('channel', channel)}
                  >
                    <View style={styles.searchResultIcon}>
                      {channel.isPrivate ? (
                        <Ionicons name="lock-closed" size={20} color={themeColors.textSecondary} />
                      ) : (
                        <Text style={styles.searchResultHashtag}>#</Text>
                      )}
                    </View>
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultTitle}>{channel.name}</Text>
                      {channel.description && (
                        <Text style={styles.searchResultSubtitle}>
                          {truncateText(channel.description, 60)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Résultats des utilisateurs */}
                {activeSearchTab === 'users' && searchResults.users.map((user) => (
                  <TouchableOpacity
                    key={`user-${user.id}`}
                    style={styles.searchResultItem}
                    onPress={() => handleSearchResultSelect('user', user)}
                  >
                    <View style={styles.searchResultIcon}>
                      {user.avatar ? (
                        <Image
                          source={{ uri: user.avatar.startsWith('http') ? user.avatar : env.S3_BASE_URL + user.avatar }}
                          style={styles.searchResultAvatar}
                        />
                      ) : (
                        <View style={styles.searchResultAvatarPlaceholder}>
                          <Text style={styles.searchResultAvatarText}>
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultTitle}>{user.name}</Text>
                      {user.email && (
                        <Text style={styles.searchResultSubtitle}>{user.email}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Résultats des messages */}
                {activeSearchTab === 'messages' && searchResults.messages.map((message) => (
                  <TouchableOpacity
                    key={`message-${message.id}`}
                    style={styles.searchResultItem}
                    onPress={() => handleSearchResultSelect('message', message)}
                  >
                    <View style={styles.searchResultIcon}>
                      <Ionicons name="chatbox-outline" size={20} color={themeColors.textSecondary} />
                    </View>
                    <View style={styles.searchResultContent}>
                      <View style={styles.searchMessageHeader}>
                        <Text style={styles.searchResultTitle}>{message.userName}</Text>
                        <Text style={styles.searchMessageChannel}>#{message.channelName}</Text>
                      </View>
                      <Text style={styles.searchResultSubtitle}>
                        {truncateText(message.content, 80)}
                      </Text>
                      <Text style={styles.searchMessageDate}>
                        {formatSearchDate(message.date)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default WorkspaceChannelsScreen;
