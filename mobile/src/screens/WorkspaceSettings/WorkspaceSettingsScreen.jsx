import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme/ThemeContext';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { getStyles } from './WorkspaceSettingsScreen.styles';
import env from '../../config/env';

const API_URL = env.API_URL;

const WorkspaceSettingsScreen = ({ route, navigation }) => {
  const { workspaceId, workspaceName } = route.params;
  const { colors: themeColors, themeMode } = useTheme();
  const { preferences, updatePreference } = useUserPreferences();
  const styles = getStyles(themeColors);

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('member'); // 'owner', 'admin', 'member'
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Effet d'animation au chargement
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Récupérer les détails du workspace et le rôle de l'utilisateur
  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        
        // Requête pour obtenir les détails du workspace
        const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Impossible de récupérer les détails du workspace');
        }
        
        const workspaceData = await response.json();
        setWorkspace(workspaceData);
        
        // Récupérer le rôle de l'utilisateur dans ce workspace
        const userRoleResponse = await fetch(`${API_URL}/api/workspaces/${workspaceId}/role`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userRoleResponse.ok) {
          const roleData = await userRoleResponse.json();
          setUserRole(roleData.role || 'member');
        }
        
        // Vérifier si les notifications sont activées pour ce workspace
        const workspaceNotifKey = `workspace_${workspaceId}_notifications`;
        const notifEnabled = preferences[workspaceNotifKey] !== false; // par défaut activé
        setNotificationsEnabled(notifEnabled);
        
      } catch (error) {
        console.error('Erreur lors de la récupération des détails du workspace:', error);
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de récupérer les détails du workspace'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkspaceDetails();
  }, [workspaceId, preferences]);

  // Gérer le changement d'état des notifications
  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    const workspaceNotifKey = `workspace_${workspaceId}_notifications`;
    await updatePreference(workspaceNotifKey, value);
    
    Toast.show({
      type: 'success',
      text1: value ? 'Notifications activées' : 'Notifications désactivées',
      text2: value 
        ? 'Vous recevrez des notifications pour ce workspace' 
        : 'Vous ne recevrez plus de notifications pour ce workspace'
    });
  };

  // Gérer la modification du workspace (pour les admins et owners)
  const handleEditWorkspace = () => {
    navigation.navigate('EditWorkspace', { 
      workspaceId, 
      workspaceName: workspace?.nom || workspaceName,
      description: workspace?.description || '',
      isPrivate: workspace?.is_private || false
    });
  };

  // Gérer l'invitation de nouveaux membres (pour les admins et owners)
  const handleInviteMembers = () => {
    navigation.navigate('InviteMembers', { 
      workspaceId, 
      workspaceName: workspace?.nom || workspaceName 
    });
  };
  
  // Gérer la gestion des membres (pour les admins et owners)
  const handleManageMembers = () => {
    navigation.navigate('ManageMembers', { 
      workspaceId, 
      workspaceName: workspace?.nom || workspaceName 
    });
  };

  // Gérer la suppression du workspace (uniquement pour les owners)
  const handleDeleteWorkspace = () => {
    Alert.alert(
      'Supprimer le workspace',
      'Êtes-vous sûr de vouloir supprimer ce workspace ? Cette action est irréversible et supprimera tous les canaux et messages associés.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('token');
              
              const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (!response.ok) {
                throw new Error('Impossible de supprimer le workspace');
              }
              
              Toast.show({
                type: 'success',
                text1: 'Workspace supprimé',
                text2: 'Le workspace a été supprimé avec succès'
              });
              
              // Naviguer vers la liste des workspaces
              navigation.navigate('WorkspacesList');
            } catch (error) {
              console.error('Erreur lors de la suppression du workspace:', error);
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: 'Impossible de supprimer le workspace'
              });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Gérer le départ de l'utilisateur du workspace
  const handleLeaveWorkspace = () => {
    Alert.alert(
      'Quitter le workspace',
      'Êtes-vous sûr de vouloir quitter ce workspace ? Vous devrez être invité à nouveau pour y accéder.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Quitter', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('token');
              
              const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/leave`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (!response.ok) {
                throw new Error('Impossible de quitter le workspace');
              }
              
              Toast.show({
                type: 'success',
                text1: 'Workspace quitté',
                text2: 'Vous avez quitté le workspace avec succès'
              });
              
              // Naviguer vers la liste des workspaces
              navigation.navigate('WorkspacesList');
            } catch (error) {
              console.error('Erreur lors du départ du workspace:', error);
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: 'Impossible de quitter le workspace'
              });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Obtenir le rôle en français avec l'icône associée
  const getRoleInfo = () => {
    switch(userRole) {
      case 'owner':
        return { 
          label: 'Propriétaire', 
          icon: <FontAwesome5 name="crown" size={16} color={themeColors.textOnAccent} /> 
        };
      case 'admin':
        return { 
          label: 'Administrateur', 
          icon: <MaterialIcons name="admin-panel-settings" size={16} color={themeColors.textOnAccent} /> 
        };
      default:
        return { 
          label: 'Membre', 
          icon: <Ionicons name="person" size={16} color={themeColors.textOnAccent} /> 
        };
    }
  };

  // État de chargement
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={{ color: themeColors.textSecondary, marginTop: 16 }}>
          Chargement des paramètres...
        </Text>
      </View>
    );
  }

  const roleInfo = getRoleInfo();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paramètres du workspace</Text>
        </View>
        
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Informations du workspace */}
          <View style={styles.workspaceCard}>
            <View style={styles.workspaceBanner}>
              <Text style={styles.workspaceName}>{workspace?.nom || workspaceName}</Text>
            </View>
            
            <View style={styles.workspaceInfo}>
              {workspace?.description ? (
                <Text style={styles.workspaceDescription}>{workspace.description}</Text>
              ) : (
                <Text style={styles.workspaceDescription}>Aucune description disponible pour ce workspace.</Text>
              )}
              
              {workspace?.membre_count && (
                <View style={styles.memberCountRow}>
                  <Ionicons name="people" size={18} color={themeColors.textSecondary} />
                  <Text style={styles.memberCountText}>
                    {workspace.membre_count} {workspace.membre_count > 1 ? 'membres' : 'membre'}
                  </Text>
                </View>
              )}
              
              {/* Badge du rôle */}
              <View style={[
                styles.roleTag,
                userRole === 'owner' ? styles.roleTagOwner : 
                userRole === 'admin' ? styles.roleTagAdmin : styles.roleTagMember
              ]}>
                {roleInfo.icon}
                <Text style={styles.roleTagText}>{roleInfo.label}</Text>
              </View>
            </View>
          </View>
          
          {/* Paramètres généraux */}
          <Text style={styles.sectionTitle}>Paramètres généraux</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name="notifications" size={22} color={themeColors.accentPrimary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingDescription}>
                  {notificationsEnabled 
                    ? 'Vous recevez des notifications pour ce workspace' 
                    : 'Les notifications sont désactivées pour ce workspace'}
                </Text>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ 
                    false: themeColors.switchTrackFalse, 
                    true: themeColors.switchTrackTrue 
                  }}
                  thumbColor={
                    notificationsEnabled 
                      ? themeColors.switchThumbTrue 
                      : themeColors.switchThumbFalse
                  }
                />
              </View>
            </View>
          </View>
          
          {/* Options d'administration (pour les admins et owners) */}
          {(userRole === 'admin' || userRole === 'owner') && (
            <>
              <Text style={styles.sectionTitle}>Administration</Text>
              <View style={styles.sectionCard}>
                <TouchableOpacity style={styles.settingRow} onPress={handleEditWorkspace}>
                  <View style={styles.settingIcon}>
                    <Ionicons name="create" size={22} color={themeColors.accentPrimary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Modifier le workspace</Text>
                    <Text style={styles.settingDescription}>Changer le nom, la description ou la visibilité</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingRow} onPress={handleInviteMembers}>
                  <View style={styles.settingIcon}>
                    <Ionicons name="person-add" size={22} color={themeColors.accentPrimary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Inviter des membres</Text>
                    <Text style={styles.settingDescription}>Ajouter de nouveaux participants au workspace</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.settingRow, styles.settingRowLast]} onPress={handleManageMembers}>
                  <View style={styles.settingIcon}>
                    <Ionicons name="people" size={22} color={themeColors.accentPrimary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>Gérer les membres</Text>
                    <Text style={styles.settingDescription}>Modifier les rôles ou retirer des membres</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {/* Zone de danger */}
          <Text style={[styles.sectionTitle, styles.dangerSection]}>Zone de danger</Text>
          <View style={styles.dangerCard}>
            {/* Option de suppression (uniquement pour les owners) */}
            {userRole === 'owner' && (
              <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteWorkspace}>
                <View style={styles.dangerIcon}>
                  <MaterialCommunityIcons name="delete" size={22} color={themeColors.danger} />
                </View>
                <View style={styles.dangerContent}>
                  <Text style={styles.dangerLabel}>Supprimer le workspace</Text>
                  <Text style={styles.dangerDescription}>
                    Cette action supprimera définitivement le workspace et tous ses canaux
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={handleDeleteWorkspace}
                >
                  <Text style={styles.dangerButtonText}>Supprimer</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            
            {/* Option de quitter le workspace (pour tout le monde) */}
            <TouchableOpacity 
              style={[styles.dangerRow, userRole === 'owner' && { borderTopWidth: 0 }]} 
              onPress={handleLeaveWorkspace}
            >
              <View style={styles.dangerIcon}>
                <MaterialIcons name="exit-to-app" size={22} color={themeColors.danger} />
              </View>
              <View style={styles.dangerContent}>
                <Text style={styles.dangerLabel}>Quitter le workspace</Text>
                <Text style={styles.dangerDescription}>
                  Vous n'aurez plus accès à ce workspace et à ses canaux
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleLeaveWorkspace}
              >
                <Text style={styles.dangerButtonText}>Quitter</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default WorkspaceSettingsScreen;