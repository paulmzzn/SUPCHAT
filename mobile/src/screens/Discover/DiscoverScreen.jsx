import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getStyles } from './DiscoverScreen.styles';
import { useTheme } from '../../theme/ThemeContext';
import env from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DiscoverScreen = () => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  // États pour gérer les workspaces et la recherche
  const [workspaces, setWorkspaces] = useState([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [userWorkspaces, setUserWorkspaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  // Utiliser S3_BASE_URL depuis le fichier .env
  const S3_BASE_URL = env.S3_BASE_URL;

  // Récupérer les workspaces auxquels appartient l'utilisateur
  useEffect(() => {
    const fetchUserWorkspaces = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          return;
        }

        const response = await fetch(`${env.API_URL}/api/workspaces/user/workspaces`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Extraire juste les IDs des workspaces de l'utilisateur
          const userWorkspaceIds = data.map(ws => ws.id_workspace);
          setUserWorkspaces(userWorkspaceIds);
        }
      } catch (error) {
        console.error('Error fetching user workspaces:', error);
      }
    };

    fetchUserWorkspaces();
  }, []);

  // Récupérer tous les workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${env.API_URL}/api/workspaces`);

        if (!response.ok) {
          throw new Error('Failed to fetch workspaces');
        }

        const data = await response.json();
        
        // Transformer les données pour correspondre au format attendu
        const transformedWorkspaces = data.map(workspace => ({
          id: workspace.id_workspace,
          name: workspace.nom,
          description: workspace.description || 'No description available',
          banner: workspace.banner_url && !workspace.banner_url.startsWith('http') 
            ? env.S3_BASE_URL + workspace.banner_url 
            : workspace.banner_url || null,
          icon: workspace.icon_url && !workspace.icon_url.startsWith('http') 
            ? env.S3_BASE_URL + workspace.icon_url 
            : workspace.icon_url || null,
          onlineUsers: workspace.online_users || 0,
          totalMembers: workspace.total_members || 0,
          isFavorite: workspace.is_favorite || false,
          isPrivate: workspace.is_private || false,
          hasJoined: userWorkspaces.includes(workspace.id_workspace)
        }));

        setWorkspaces(transformedWorkspaces);
        setFilteredWorkspaces(transformedWorkspaces);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        setError('Impossible de récupérer les workspaces');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [userWorkspaces]);

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

  // Fonction pour rejoindre un workspace
  const joinWorkspace = async (workspaceId, isPrivate = false) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour rejoindre un workspace");
        return;
      }

      let endpoint = isPrivate 
        ? `${env.API_URL}/api/workspaces/${workspaceId}/request-join` 
        : `${env.API_URL}/api/workspaces/${workspaceId}/join`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        if (isPrivate) {
          Alert.alert(
            "Demande envoyée", 
            "Votre demande pour rejoindre ce workspace privé a été envoyée. Vous serez notifié lorsqu'elle sera traitée.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Succès", 
            "Vous avez rejoint ce workspace !",
            [{ text: "OK" }]
          );
          // Mettre à jour la liste des workspaces de l'utilisateur
          setUserWorkspaces(prev => [...prev, workspaceId]);
        }
      } else {
        const errorData = await response.json();
        Alert.alert("Erreur", errorData.message || "Impossible de rejoindre ce workspace");
      }
    } catch (error) {
      console.error('Error joining workspace:', error);
      Alert.alert("Erreur", "Une erreur s'est produite lors de la tentative de rejoindre le workspace");
    }
  };

  // Afficher le champ de recherche
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
        <Text style={styles.loadingText}>Chargement des workspaces...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Découvrir</Text>
        <TouchableOpacity style={styles.searchIconButton} onPress={toggleSearch}>
          <FontAwesome name="search" size={20} color={themeColors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des workspaces..."
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
        {!showSearch && (
          <View style={styles.bannerSection}>
            <View style={styles.banner}>
              <FontAwesome name="compass" size={32} color={themeColors.textPrimary} style={styles.bannerIcon} />
              <Text style={styles.bannerTitle}>Explorez des communautés</Text>
              <Text style={styles.bannerText}>
                Découvrez de nouveaux espaces de travail et rejoignez des communautés qui vous intéressent
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {searchQuery ? 'Résultats de recherche' : 'Tous les workspaces'}
        </Text>
        
        <View style={styles.suggestionsSection}>
          {filteredWorkspaces.length > 0 ? (
            filteredWorkspaces.map((workspace) => (
              <View key={workspace.id} style={styles.suggestionItem}>
                <View style={styles.suggestionIcon}>
                  {workspace.icon ? (
                    <Image source={{ uri: workspace.icon }} style={styles.suggestionImage} />
                  ) : (
                    <Text style={styles.suggestionInitial}>{workspace.name.charAt(0)}</Text>
                  )}
                </View>
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{workspace.name}</Text>
                  {workspace.isPrivate && (
                    <View style={styles.privateIndicatorContainer}>
                      <FontAwesome 
                        name="lock" 
                        size={12} 
                        color={themeColors.textMuted} 
                        style={styles.privateIndicatorIcon} 
                      />
                      <Text style={styles.privateText}>Workspace privé</Text>
                    </View>
                  )}
                  <Text style={styles.suggestionMembers}>{workspace.totalMembers} membres</Text>
                </View>
                {workspace.hasJoined ? (
                  <TouchableOpacity style={styles.joinedButton}>
                    <Text style={styles.joinedButtonText}>Rejoint</Text>
                  </TouchableOpacity>
                ) : workspace.isPrivate ? (
                  <TouchableOpacity 
                    style={styles.requestJoinButton}
                    onPress={() => joinWorkspace(workspace.id, true)}
                  >
                    <Text style={styles.requestJoinButtonText}>Demander</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.joinButton}
                    onPress={() => joinWorkspace(workspace.id, false)}
                  >
                    <Text style={styles.joinButtonText}>Rejoindre</Text>
                  </TouchableOpacity>
                )}
              </View>
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
      </ScrollView>
    </View>
  );
};

export default DiscoverScreen;