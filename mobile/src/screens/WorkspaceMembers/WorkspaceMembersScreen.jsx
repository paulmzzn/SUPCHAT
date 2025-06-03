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
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialIcons } from '@expo/vector-icons';
import env from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './WorkspaceMembersScreen.styles';

const WorkspaceMembersScreen = ({ route, navigation }) => {
  const { workspaceId, workspaceName } = route.params;
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/workspaces/${workspaceId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Membres chargés:', data);
        setMembers(data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de charger les membres'
        });
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Erreur réseau'
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <MaterialIcons name="star" size={16} color="#FFD700" />;
      case 'admin':
        return <MaterialIcons name="shield" size={16} color="#FF6B6B" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'admin':
        return 'Administrateur';
      case 'member':
        return 'Membre';
      default:
        return 'Membre';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 1: // En ligne
        return '#4CAF50';
      case 2: // Absent
        return '#FF9800';
      case 3: // Ne pas déranger
        return '#F44336';
      case 4: // Hors ligne
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 1:
        return 'En ligne';
      case 2:
        return 'Absent';
      case 3:
        return 'Ne pas déranger';
      case 4:
      default:
        return 'Hors ligne';
    }
  };

  const handleMemberPress = (member) => {
    Alert.alert(
      member.nom || 'Utilisateur',
      `Rôle: ${getRoleLabel(member.role)}\nStatut: ${getStatusLabel(member.status)}`,
      [
        { text: 'OK', style: 'cancel' },
        { 
          text: 'Envoyer un message', 
          onPress: () => {
            // Navigation vers les messages privés
            navigation.navigate('Messages', {
              screen: 'Conversation',
              params: {
                recipientId: member.id_utilisateur,
                recipientName: member.nom
              }
            });
          }
        }
      ]
    );
  };

  // Helper function to get member ID
  const getMemberId = (item) => {
    return item.id_utilisateur || item.id || item.user_id || Math.random().toString();
  };

  const renderMember = ({ item }) => {
    const memberId = getMemberId(item);
    
    return (
      <TouchableOpacity
        style={styles.memberItem}
        onPress={() => handleMemberPress(item)}
      >
        <View style={styles.memberContent}>
          <View style={styles.avatarContainer}>
            {item.photo_de_profil ? (
              <Image 
                source={{ 
                  uri: item.photo_de_profil.startsWith('http') 
                    ? item.photo_de_profil 
                    : env.S3_BASE_URL + item.photo_de_profil 
                }} 
                style={styles.memberAvatar} 
              />
            ) : (
              <View style={styles.memberAvatarPlaceholder}>
                <Text style={styles.memberAvatarText}>
                  {(item.nom || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            {/* Indicateur de statut */}
            <View 
              style={[
                styles.statusIndicator, 
                { backgroundColor: getStatusColor(item.status) }
              ]} 
            />
          </View>
          
          <View style={styles.memberInfo}>
            <View style={styles.memberHeader}>
              <Text style={styles.memberName}>
                {item.nom || 'Utilisateur'}
              </Text>
            </View>
            
            <View style={styles.roleContainer}>
              {getRoleIcon(item.role)}
              <Text style={styles.memberRole}>
                {getRoleLabel(item.role)}
              </Text>
            </View>
            
            <Text style={styles.memberStatus}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMemberPress(item)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={styles.loadingText}>Chargement des membres...</Text>
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
            Membres
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {workspaceName}
          </Text>
        </View>
        
        <View style={styles.headerAction}>
          <Text style={styles.memberCount}>
            {members.length} {members.length === 1 ? 'membre' : 'membres'}
          </Text>
        </View>
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => getMemberId(item).toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.accentPrimary}
          />
        }
        contentContainerStyle={styles.membersList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default WorkspaceMembersScreen;