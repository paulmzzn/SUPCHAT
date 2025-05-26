import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { getStyles } from './WorkspacesScreen.styles';
import { useTheme } from '../../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../../config/env';
import { useNavigation } from '@react-navigation/native';
import { useSocket } from '../../context/SocketContext';

const WorkspacesScreen = () => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const navigation = useNavigation();
  
  const { 
    socket, 
    workspaceUnreadCounts,
    getWorkspaceUnreadCount,
    refreshUnreadCounts, 
    testSocketConnection, 
    forceRefreshCounts, 
    currentUserId 
  } = useSocket();

  const [workspaces, setWorkspaces] = useState([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const S3_BASE_URL = env.S3_BASE_URL || "https://s3-supchat.s3.fr-par.scw.cloud/";

  const navigateToWorkspace = (workspace) => {
    navigation.navigate('WorkspaceChannels', {
      workspaceId: workspace.id,
    });
  };

  const debugWebSocket = () => {
    console.log("=== WEBSOCKET DEBUG ===");
    console.log("Socket connected:", !!socket);
    console.log("Socket ID:", socket?.id);
    console.log("Current user ID:", currentUserId);
    console.log("Workspaces:", workspaces.length);
    console.log("Workspace unread counts:", workspaceUnreadCounts);
    
    testSocketConnection();
    forceRefreshCounts();
  };

  // Écouter les changements des compteurs de notifications
  useEffect(() => {
    console.log("📱 WorkspacesScreen: Workspace unread counts updated", workspaceUnreadCounts);
    // Forcer un re-render quand les compteurs changent
    setForceUpdate(prev => prev + 1);
  }, [workspaceUnreadCounts]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error("Vous devez être connecté pour accéder à vos workspaces");
        }

        let userId = null;
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            userId = payload.id;
          }
        } catch (e) {
          console.error("Erreur lors du décodage du token:", e);
          throw new Error("Impossible de récupérer votre identifiant utilisateur");
        }

        if (!userId) {
          throw new Error("Identifiant utilisateur non trouvé");
        }

        const response = await fetch(`${env.API_URL}/api/users/${userId}/workspaces`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération des workspaces: ${response.status}`);
        }

        const data = await response.json();

        const transformedWorkspaces = data.map(workspace => ({
          id: workspace.id_workspace,
          name: workspace.nom,
          description: workspace.description || 'Aucune description disponible',
          banner: workspace.banner_url && !workspace.banner_url.startsWith('http') 
            ? S3_BASE_URL + workspace.banner_url 
            : workspace.banner_url || null,
          icon: workspace.icon_url && !workspace.icon_url.startsWith('http') 
            ? S3_BASE_URL + workspace.icon_url 
            : workspace.icon_url || null,
          onlineUsers: workspace.online_users || 0,
          totalMembers: workspace.total_members || 0,
          userRole: workspace.user_role || 'member'
        }));

        setWorkspaces(transformedWorkspaces);
        setFilteredWorkspaces(transformedWorkspaces);
      } catch (error) {
        console.error('Erreur lors de la récupération des workspaces:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
    
    // Rafraîchir les compteurs après avoir chargé les workspaces
    setTimeout(() => {
      refreshUnreadCounts();
      debugWebSocket();
    }, 1000);
  }, [refreshUnreadCounts]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredWorkspaces(workspaces);
      return;
    }

    const filtered = workspaces.filter(workspace => 
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workspace.description && 
       workspace.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredWorkspaces(filtered);
  }, [searchQuery, workspaces]);

  const handleWorkspacePress = (workspace) => {
    navigateToWorkspace(workspace);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchQuery('');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={styles.loadingText}>Chargement de vos Mes Workspaces...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <MaterialIcons name="error" size={60} color={themeColors.danger} style={styles.errorIcon} />
        <Text style={styles.errorTitle}>Une erreur s'est produite</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.replace('Workspaces')}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Workspaces</Text>
        <TouchableOpacity style={styles.searchIconButton} onPress={toggleSearch}>
          <FontAwesome name="search" size={20} color={themeColors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans vos workspaces..."
            placeholderTextColor={themeColors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity 
            style={styles.clearSearchButton}
            onPress={() => {
              setSearchQuery('');
              toggleSearch();
            }}
          >
            <FontAwesome name="times" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {workspaces.length > 0 ? (
          <View style={styles.workspacesSection}>
            {showSearch && (
              <Text style={styles.sectionTitle}>
                {searchQuery ? 'Résultats de recherche' : 'Vos workspaces'}
              </Text>
            )}
            
            {filteredWorkspaces.length > 0 ? (
              filteredWorkspaces.map((workspace) => {
                const unreadCount = getWorkspaceUnreadCount(workspace.id);
                console.log(`📱 WorkspacesScreen: Workspace ${workspace.name} (${workspace.id}) - Unread: ${unreadCount}`);
                
                return (
                  <TouchableOpacity 
                    key={`${workspace.id}-${forceUpdate}`} // Ajouter forceUpdate pour forcer le re-render
                    style={styles.workspaceItem}
                    onPress={() => handleWorkspacePress(workspace)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionIcon}>
                      {workspace.icon ? (
                        <Image source={{ uri: workspace.icon }} style={styles.suggestionImage} />
                      ) : (
                        <Text style={styles.suggestionInitial}>{workspace.name.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                    
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{workspace.name}</Text>
                      <Text style={styles.suggestionMembers}>{workspace.totalMembers} membres</Text>
                    </View>
                    
                    {unreadCount > 0 && (
                      <View style={styles.workspaceBadge}>
                        <Text style={styles.workspaceBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noResultsContainer}>
                <FontAwesome name="search" size={50} color={themeColors.textMuted} />
                <Text style={styles.noResultsText}>
                  Aucun workspace trouvé correspondant à votre recherche
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="workspaces" size={80} color={themeColors.accentPrimary} style={styles.icon} />
            <Text style={styles.title}>Aucun  Workspaces</Text>
            <Text style={styles.description}>
              Vous n'avez pas encore rejoint de vos Workspaces. Visitez la page "Découvrir" pour en rejoindre ou en créer un nouveau.
            </Text>
            <TouchableOpacity 
              style={styles.discoverButton}
              onPress={() => navigation.navigate('Discover')}
            >
              <Text style={styles.discoverButtonText}>Découvrir des workspaces</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default WorkspacesScreen;