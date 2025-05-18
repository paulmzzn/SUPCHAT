import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image 
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { getStyles } from './WorkspaceDetailScreen.styles';
import { useTheme } from '../../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import env from '../../config/env';

const WorkspaceScreen = () => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const route = useRoute();
  const navigation = useNavigation();
  
  const { workspaceId, workspaceName } = route.params || {};
  
  const [workspace, setWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const S3_BASE_URL = env.S3_BASE_URL || "https://s3-supchat.s3.fr-par.scw.cloud/";

  useEffect(() => {
    // Définir le titre de la navigation
    navigation.setOptions({
      title: workspaceName || 'Workspace'
    });

    const fetchWorkspaceDetails = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          throw new Error("Vous devez être connecté pour accéder à ce workspace");
        }

        // Récupérer les détails du workspace
        const workspaceResponse = await fetch(`${env.API_URL}/api/workspaces/${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!workspaceResponse.ok) {
          throw new Error(`Erreur lors de la récupération du workspace: ${workspaceResponse.status}`);
        }

        const workspaceData = await workspaceResponse.json();
        
        // Formater les données du workspace
        const formattedWorkspace = {
          id: workspaceData.id_workspace,
          name: workspaceData.nom,
          description: workspaceData.description || 'Pas de description disponible',
          banner: workspaceData.banner_url && !workspaceData.banner_url.startsWith('http') 
            ? S3_BASE_URL + workspaceData.banner_url 
            : workspaceData.banner_url || null,
          icon: workspaceData.icon_url && !workspaceData.icon_url.startsWith('http') 
            ? S3_BASE_URL + workspaceData.icon_url 
            : workspaceData.icon_url || null,
          totalMembers: workspaceData.total_members || 0,
          onlineUsers: workspaceData.online_users || 0,
          userRole: workspaceData.user_role || 'member'
        };
        
        setWorkspace(formattedWorkspace);

        // Récupérer les canaux du workspace
        const channelsResponse = await fetch(`${env.API_URL}/api/workspaces/${workspaceId}/canals`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!channelsResponse.ok) {
          throw new Error(`Erreur lors de la récupération des canaux: ${channelsResponse.status}`);
        }

        const channelsData = await channelsResponse.json();
        setChannels(channelsData.map(channel => ({
          id: channel.id_canal,
          name: channel.nom,
          description: channel.description || '',
          isPrivate: channel.is_private || false,
          unreadMessages: channel.unread_messages || 0
        })));
      } catch (error) {
        console.error('Erreur:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchWorkspaceDetails();
    } else {
      setError("ID du workspace non fourni");
      setLoading(false);
    }
  }, [workspaceId, workspaceName]);

  const handleChannelPress = (channel) => {
    navigation.navigate('Channel', {
      channelId: channel.id,
      channelName: channel.name,
      workspaceId: workspaceId,
      workspaceName: workspace?.name
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={styles.loadingText}>Chargement du workspace...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <MaterialIcons name="error" size={60} color={themeColors.danger} />
        <Text style={styles.errorTitle}>Une erreur s'est produite</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {workspace && (
        <>
          <ScrollView style={styles.scrollContainer}>
            {/* En-tête avec bannière et informations du workspace */}
            <View style={styles.workspaceHeader}>
              {workspace.banner && (
                <Image
                  source={{ uri: workspace.banner }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.workspaceInfo}>
                <View style={styles.iconContainer}>
                  {workspace.icon ? (
                    <Image 
                      source={{ uri: workspace.icon }} 
                      style={styles.workspaceIcon} 
                    />
                  ) : (
                    <View style={[styles.workspaceIcon, styles.placeholderIcon]}>
                      <Text style={styles.placeholderText}>
                        {workspace.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.workspaceName}>{workspace.name}</Text>
                <Text style={styles.workspaceDescription}>{workspace.description}</Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <FontAwesome name="users" size={14} color={themeColors.textMuted} />
                    <Text style={styles.statText}>{workspace.totalMembers} membres</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.statText}>{workspace.onlineUsers} en ligne</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Liste des canaux */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Canaux</Text>
              <View style={styles.channelsList}>
                {channels.length > 0 ? (
                  channels.map(channel => (
                    <TouchableOpacity
                      key={channel.id}
                      style={styles.channelItem}
                      onPress={() => handleChannelPress(channel)}
                    >
                      <FontAwesome 
                        name={channel.isPrivate ? "lock" : "hashtag"} 
                        size={16} 
                        color={themeColors.textMuted}
                        style={styles.channelIcon}
                      />
                      <View style={styles.channelInfo}>
                        <Text style={styles.channelName}>{channel.name}</Text>
                        {channel.description ? (
                          <Text style={styles.channelDescription}>{channel.description}</Text>
                        ) : null}
                      </View>
                      {channel.unreadMessages > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{channel.unreadMessages}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyChannelsContainer}>
                    <Text style={styles.emptyChannelsText}>Aucun canal disponible</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Autres fonctionnalités pourront être ajoutées ici */}
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default WorkspaceScreen;