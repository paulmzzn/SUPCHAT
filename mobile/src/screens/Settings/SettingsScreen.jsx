import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../App'; 
import env from '../../config/env'; 
import { getStyles } from './SettingsScreen.styles'; // Import getStyles
import { useTheme } from '../../theme/ThemeContext'; // Import useTheme
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const SettingsScreen = () => {
  const { themeMode, toggleTheme, colors: themeColors } = useTheme(); // Use theme context
  const styles = getStyles(themeColors); // Get styles based on current theme
  const navigation = useNavigation(); // Get navigation object

  const [notifications, setNotifications] = React.useState(true);
  const [soundEffects, setSoundEffects] = React.useState(true);
  
  const [userName, setUserName] = useState('Utilisateur');
  const [userEmail, setUserEmail] = useState('email@example.com');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { signOut } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoadingProfile(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.log('No token found, cannot fetch profile.');
          setLoadingProfile(false);
          return;
        }

        const response = await fetch(`${env.API_URL}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserName(data.nom || data.name || 'Utilisateur'); 
          setUserEmail(data.email || 'email@example.com');
          setAvatarUrl(data.photo_url);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch profile:', response.status, errorData.message);
          if (response.status === 401 || response.status === 403) {
            Alert.alert("Session expirée", "Veuillez vous reconnecter.", [{ text: "OK", onPress: signOut }]);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        Alert.alert("Erreur", "Impossible de charger les informations du profil.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        { 
          text: "Déconnecter", 
          onPress: async () => {
            await signOut();
          },
          style: "destructive"
        }
      ]
    );
  };

  if (loadingProfile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  const isDarkModeActive = themeMode === 'dark';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Section Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {userName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('Settings', { 
              screen: 'EditProfile' 
            })}
          >
            <Text style={styles.editProfileButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Section Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notifications push</Text>
              <Text style={styles.settingDescription}>Recevoir des alertes même lorsque l'app est fermée</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: themeColors.switchTrackFalse, true: themeColors.switchTrackTrue }}
              thumbColor={notifications ? themeColors.switchThumbTrue : themeColors.switchThumbFalse}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{isDarkModeActive ? "Mode sombre" : "Mode clair"}</Text>
              <Text style={styles.settingDescription}>
                {isDarkModeActive ? "Utiliser un thème sombre pour l'app" : "Utiliser un thème clair pour l'app"}
              </Text>
            </View>
            <Switch
              value={isDarkModeActive}
              onValueChange={toggleTheme} // Use toggleTheme from context
              trackColor={{ false: themeColors.switchTrackFalse, true: themeColors.switchTrackTrue }}
              thumbColor={isDarkModeActive ? themeColors.switchThumbTrue : themeColors.switchThumbFalse}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sons</Text>
              <Text style={styles.settingDescription}>Activer les sons de notification</Text>
            </View>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: themeColors.switchTrackFalse, true: themeColors.switchTrackTrue }}
              thumbColor={soundEffects ? themeColors.switchThumbTrue : themeColors.switchThumbFalse}
            />
          </View>
        </View>

        {/* Section Security */}
        <Text style={styles.sectionTitle}>Sécurité</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingButtonContent}>
              <Ionicons name="lock-closed-outline" size={22} color={themeColors.textPrimary} />
              <Text style={styles.settingButtonText}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingButtonContent}>
              <Ionicons name="shield-outline" size={22} color={themeColors.textPrimary} />
              <Text style={styles.settingButtonText}>Confidentialité</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingButton}>
            <View style={styles.settingButtonContent}>
              <Ionicons name="finger-print-outline" size={22} color={themeColors.textPrimary} />
              <Text style={styles.settingButtonText}>Authentification biométrique</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={themeColors.textPrimary} style={{ marginRight: 10 }} />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>SUPCHAT v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;