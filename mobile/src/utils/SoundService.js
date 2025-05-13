import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Référence au son une fois chargé
let sound = null;
let isInitialized = false;

// Clé pour les préférences
const PREFERENCES_KEY = '@SUPCHAT:userPreferences';

/**
 * Vérifie si le son des notifications est activé
 */
const isNotificationSoundEnabled = async () => {
  try {
    const preferences = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (preferences) {
      const { notificationSoundEnabled } = JSON.parse(preferences);
      return notificationSoundEnabled !== false; // Par défaut true si non défini
    }
    return true; // Activé par défaut
  } catch (error) {
    console.error('Erreur lors de la vérification des préférences de son:', error);
    return true; // En cas d'erreur, on permet le son par défaut
  }
};

/**
 * Initialise le son de notification avec expo-av
 */
const initializeSound = async () => {
  if (isInitialized) return;
  
  try {
    console.log('Initialisation du son de notification...');
    
    // Configurer l'audio
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false
    });
    
    try {
      const soundAssetUri = Asset.fromModule(require('../../assets/COMCell_Message 1 (ID 1111)_LS.mp3'));
      await soundAssetUri.downloadAsync();
      
      // Charger le son
      const { sound: soundObject } = await Audio.Sound.createAsync(
        { uri: soundAssetUri.localUri || soundAssetUri.uri },
        { shouldPlay: false }
      );
      
      sound = soundObject;
      isInitialized = true;
      console.log('Son de notification initialisé avec succès');
    } catch (assetError) {
      // Essayer une méthode alternative en cas d'échec
      const { sound: soundObject } = await Audio.Sound.createAsync(
        require('../../assets/COMCell_Message 1 (ID 1111)_LS.mp3'),
        { shouldPlay: false }
      );
      
      sound = soundObject;
      isInitialized = true;
      console.log('Son de notification initialisé (méthode alternative)');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du son:', error.message);
    isInitialized = false;
  }
};

/**
 * Joue le son de notification
 */
const playNotificationSound = async () => {
  try {
    // Vérifier d'abord si le son des notifications est activé dans les préférences
    const soundEnabled = await isNotificationSoundEnabled();
    if (!soundEnabled) {
      console.log('Son de notification désactivé dans les préférences, aucun son ne sera joué');
      return;
    }

    // Si le son n'est pas initialisé, l'initialiser
    if (!isInitialized || !sound) {
      await initializeSound();
    }
    
    // Jouer le son s'il est initialisé
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
      } catch (e) {
        // Ignore les erreurs si le son n'est pas déjà en lecture
      }
      
      // Jouer le son
      console.log('Lecture du son de notification');
      await sound.playAsync();
      
      // Vérifier si la lecture a commencé
      const newStatus = await sound.getStatusAsync();
      if (newStatus.isPlaying) {
        console.log('Son de notification en cours de lecture');
      }
    } else {
      console.error('Impossible de jouer le son - non disponible');
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du son:', error.message);
  }
};

// Exporter les fonctions
export default {
  initializeSound,
  playNotificationSound,
};