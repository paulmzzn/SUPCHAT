import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext'; // Updated import path
import { useUserPreferences } from '../../context/UserPreferencesContext'; // Import du contexte de préférences utilisateur
import env from '../../config/env'; 
import { getStyles } from './SettingsScreen.styles'; // Import getStyles
import { useTheme } from '../../theme/ThemeContext'; // Import useTheme
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useNavigation and useFocusEffect
import { Buffer } from 'buffer'; // Import Buffer pour décodage base64

const SettingsScreen = () => {
  const { themeMode, toggleTheme, colors: themeColors } = useTheme(); // Use theme context
  const { preferences, toggleNotificationSound } = useUserPreferences(); // Utilisation du contexte de préférences
  const styles = getStyles(themeColors); // Get styles based on current theme
  const navigation = useNavigation(); // Initialize navigation

  const [notifications, setNotifications] = React.useState(true);
  
  const [userName, setUserName] = useState('Utilisateur');
  const [userEmail, setUserEmail] = useState('email@example.com');
  const [userBio, setUserBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { signOut } = useAuth();

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
        setUserBio(data.bio || '');
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

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
      return () => {}; // Cleanup if necessary
    }, [])
  );

  const handleLogout = () => {
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

  // Fonction pour supprimer le compte de l'utilisateur
  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues.",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        { 
          text: "Supprimer", 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert("Erreur", "Impossible de supprimer le compte. Veuillez vous reconnecter.");
                return;
              }
              
              // Décodage du token pour obtenir l'ID utilisateur
              const tokenParts = token.split('.');
              const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
              const userId = payload.id;
              
              // Appel à l'API pour supprimer le compte
              const response = await fetch(`${env.API_URL}/api/users/delete/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                Alert.alert(
                  "Compte supprimé",
                  "Votre compte a été supprimé avec succès.",
                  [
                    {
                      text: "OK",
                      onPress: async () => {
                        await signOut();
                      }
                    }
                  ]
                );
              } else {
                const errorData = await response.json();
                Alert.alert("Erreur", errorData.message || "Une erreur est survenue lors de la suppression du compte.");
              }
            } catch (error) {
              console.error("Erreur lors de la suppression du compte:", error);
              Alert.alert("Erreur", "Une erreur est survenue lors de la suppression du compte.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Function to navigate to profile edit screen
  const handleEditProfile = () => {
    navigation.navigate('ProfileEdit');
  };

  // Fonction pour exporter les données RGPD
  const handleRgpdExport = async () => {
    Alert.alert(
      "Export RGPD",
      "Télécharger toutes vos données personnelles au format JSON ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        { 
          text: "Télécharger", 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert("Erreur", "Vous devez être connecté pour exporter vos données.");
                return;
              }

              const response = await fetch(`${env.API_URL}/api/users/rgpd-export`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                throw new Error("Erreur lors de l'export RGPD");
              }

              const responseText = await response.text();
              const fileName = 'mes_donnees_rgpd.json';
              const fileUri = FileSystem.documentDirectory + fileName;

              await FileSystem.writeAsStringAsync(fileUri, responseText);

              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'application/json',
                  dialogTitle: 'Partager vos données RGPD',
                });
              } else {
                Alert.alert(
                  "Export terminé", 
                  `Vos données ont été sauvegardées dans : ${fileUri}`
                );
              }
            } catch (error) {
              console.error("Erreur lors de l'export RGPD:", error);
              Alert.alert("Erreur", "Erreur lors de l'export RGPD : " + error.message);
            }
          },
        }
      ]
    );
  };

  // Fonction pour ouvrir les CGU
  const handleOpenCGU = () => {
    navigation.navigate('CGU');
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
          {userBio ? (
            <Text style={styles.profileBio}>"{userBio}"</Text>
          ) : null}
          <TouchableOpacity 
            style={styles.editProfileButton} 
            onPress={handleEditProfile}
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
              value={preferences.notificationSoundEnabled}
              onValueChange={toggleNotificationSound}
              trackColor={{ false: themeColors.switchTrackFalse, true: themeColors.switchTrackTrue }}
              thumbColor={preferences.notificationSoundEnabled ? themeColors.switchThumbTrue : themeColors.switchThumbFalse}
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
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingButton} onPress={handleRgpdExport}>
            <View style={styles.settingButtonContent}>
              <Ionicons name="download-outline" size={22} color={themeColors.textPrimary} />
              <Text style={styles.settingButtonText}>Exporter mes données RGPD</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section Légal */}
        <Text style={styles.sectionTitle}>Légal</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingButton} onPress={handleOpenCGU}>
            <View style={styles.settingButtonContent}>
              <Ionicons name="document-text-outline" size={22} color={themeColors.textPrimary} />
              <Text style={styles.settingButtonText}>Conditions Générales d'Utilisation</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Supprimer le compte */}
        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={22} color={themeColors.textOnDanger || "#FFFFFF"} style={{ marginRight: 10 }} />
          <Text style={styles.deleteAccountButtonText}>Supprimer mon compte</Text>
        </TouchableOpacity>

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