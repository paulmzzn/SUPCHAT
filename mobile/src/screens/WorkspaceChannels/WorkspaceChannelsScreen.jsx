import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import env from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme/ThemeContext';
import { useSocket } from '../../context/SocketContext'; // Importer useSocket
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

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchWorkspaceDetails(),
        fetchChannels(),
        fetchMembers()
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkspaceData();
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

  const navigateToChannel = (channel) => {
    navigation.navigate('Workspace', {
      workspaceId,
      channelId: channel.id,
      channelName: channel.name,
      workspaceName: workspace?.nom
    });
  };

  const renderChannel = ({ item }) => (
    <TouchableOpacity
      style={styles.channelItem}
      onPress={() => navigation.navigate('Workspace', {
        workspaceId: workspaceId,
        channelId: item.id,
        channelName: item.name
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
        {item.description ? (
          <Text style={styles.channelDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
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
        
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => navigation.navigate('WorkspaceSettings', { 
            workspaceId, 
            workspaceName: workspace?.nom || 'Workspace' 
          })}
        >
          <Ionicons name="settings-outline" size={24} color={themeColors.textPrimary} />
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
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{channels.length}</Text>
              <Text style={styles.statLabel}>
                {channels.length === 1 ? 'Canal' : 'Canaux'}
              </Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{members.length}</Text>
              <Text style={styles.statLabel}>
                {members.length === 1 ? 'Membre' : 'Membres'}
              </Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {members.filter(m => m.status === 1).length}
              </Text>
              <Text style={styles.statLabel}>En ligne</Text>
            </View>
          </View>
        </View>

        {/* Channels List */}
        <View style={styles.channelsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Canaux</Text>
            <TouchableOpacity style={styles.addButton}>
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
    </View>
  );
};

export default WorkspaceChannelsScreen;
