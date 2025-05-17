import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { getStyles } from './WorkspacesScreen.styles';
import { useTheme } from '../../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../../config/env';
import { useNavigation } from '@react-navigation/native';

const WorkspacesScreen = () => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const navigation = useNavigation();

  const [workspaces, setWorkspaces] = useState([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const S3_BASE_URL = env.S3_BASE_URL || "https://s3-supchat.s3.fr-par.scw.cloud/";

  // Récupérer les workspaces de l'utilisateur
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error("Vous devez être connecté pour accéder à vos workspaces");
        }

        // Récupérer l'ID utilisateur depuis le token JWT
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

        // Transformer les données pour correspondre au format attendu
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
          unread: 0, // À remplacer par un vrai décompte de messages non lus si disponible
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
  }, []);

  // Filtrer les workspaces sur la base de la recherche
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

  // Gérer le clic sur un workspace
  const handleWorkspacePress = (workspace) => {
    navigation.navigate('Workspace', { 
      workspaceId: workspace.id,
      workspaceName: workspace.name 
    });
  };

  // Afficher/masquer le champ de recherche
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
              filteredWorkspaces.map((workspace) => (
                <TouchableOpacity 
                  key={workspace.id} 
                  style={styles.workspaceItem}
                  onPress={() => handleWorkspacePress(workspace)}
                  activeOpacity={0.7}
                >
                  {/* Icône du workspace */}
                  <View style={styles.suggestionIcon}>
                    {workspace.icon ? (
                      <Image source={{ uri: workspace.icon }} style={styles.suggestionImage} />
                    ) : (
                      <Text style={styles.suggestionInitial}>{workspace.name.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  
                  {/* Informations du workspace */}
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName}>{workspace.name}</Text>
                    <Text style={styles.suggestionMembers}>{workspace.totalMembers} membres</Text>
                  </View>
                  
                  {/* Badge pour les messages non lus */}
                  {workspace.unread > 0 && (
                    <View style={styles.workspaceBadge}>
                      <Text style={styles.workspaceBadgeText}>{workspace.unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
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