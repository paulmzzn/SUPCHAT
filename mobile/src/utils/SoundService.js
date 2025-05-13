import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

// Référence au son une fois chargé
let sound = null;
let isInitialized = false;

/**
 * Initialise le son de notification avec expo-av
 */
const initializeSound = async () => {
  if (isInitialized) return;
  
  try {
    console.log('🔊 [SoundService] Début d\'initialisation du son de notification...');
    
    // Configurer l'audio pour permettre la lecture même en mode silencieux (iOS)
    console.log('🔊 [SoundService] Configuration du mode audio...');
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false
    });
    console.log('🔊 [SoundService] Mode audio configuré avec succès');
    
    // Créer l'URI pour le fichier audio dans le dossier assets
    console.log('🔊 [SoundService] Chargement du fichier son depuis les assets...');
    
    try {
      const soundAssetUri = Asset.fromModule(require('../../assets/COMCell_Message 1 (ID 1111)_LS.mp3'));
      console.log('🔊 [SoundService] Asset créé:', soundAssetUri);
      
      await soundAssetUri.downloadAsync();
      console.log('🔊 [SoundService] Asset téléchargé avec succès, URI:', soundAssetUri.localUri || soundAssetUri.uri);
      
      // Charger le son
      console.log('🔊 [SoundService] Création de l\'objet Sound...');
      const { sound: soundObject } = await Audio.Sound.createAsync(
        { uri: soundAssetUri.localUri || soundAssetUri.uri },
        { shouldPlay: false }
      );
      
      sound = soundObject;
      isInitialized = true;
      console.log('🔊 [SoundService] Son de notification initialisé avec succès!');
    } catch (assetError) {
      console.error('❌ [SoundService] Erreur lors du chargement de l\'asset:', assetError);
      
      // Essayer une méthode alternative en cas d'échec
      console.log('🔊 [SoundService] Tentative alternative de chargement du son...');
      const { sound: soundObject } = await Audio.Sound.createAsync(
        require('../../assets/COMCell_Message 1 (ID 1111)_LS.mp3'),
        { shouldPlay: false }
      );
      
      sound = soundObject;
      isInitialized = true;
      console.log('🔊 [SoundService] Son de notification initialisé avec la méthode alternative!');
    }
  } catch (error) {
    console.error('❌ [SoundService] Erreur lors de l\'initialisation du son:', error);
    console.error('❌ [SoundService] Type d\'erreur:', typeof error);
    console.error('❌ [SoundService] Message d\'erreur:', error.message);
    if (error.stack) console.error('❌ [SoundService] Stack:', error.stack);
    isInitialized = false;
  }
};

/**
 * Joue le son de notification
 */
const playNotificationSound = async () => {
  console.log('🔊 [SoundService] Tentative de lecture du son de notification...');
  
  try {
    // Si le son n'est pas initialisé, l'initialiser
    if (!isInitialized || !sound) {
      console.log('🔊 [SoundService] Son non initialisé, initialisation en cours...');
      await initializeSound();
      console.log('🔊 [SoundService] Initialisation terminée, status:', isInitialized ? 'Réussi' : 'Échec');
    }
    
    // Jouer le son s'il est initialisé
    if (sound) {
      console.log('🔊 [SoundService] Son prêt à être joué');
      
      try {
        console.log('🔊 [SoundService] Arrêt de toute lecture en cours...');
        await sound.stopAsync();
        console.log('🔊 [SoundService] Réinitialisation de la position...');
        await sound.setPositionAsync(0);
        console.log('🔊 [SoundService] Position réinitialisée');
      } catch (e) {
        console.log('ℹ️ [SoundService] Note: Le son n\'était probablement pas déjà en lecture');
      }
      
      // Vérifier l'état avant la lecture
      const status = await sound.getStatusAsync();
      console.log('🔊 [SoundService] État du son avant lecture:', status);
      
      // Jouer le son
      console.log('🔊 [SoundService] Lecture du son...');
      await sound.playAsync();
      
      // Vérifier si la lecture a commencé
      const newStatus = await sound.getStatusAsync();
      console.log('🔊 [SoundService] LECTURE DU SON - État après lecture:', newStatus);
      
      if (newStatus.isPlaying) {
        console.log('🔊 [SoundService] SON EN COURS DE LECTURE! 🎵🎵🎵');
      } else {
        console.log('⚠️ [SoundService] Le son n\'est pas en cours de lecture selon son état');
      }
    } else {
      console.error('❌ [SoundService] Impossible de jouer le son - objet son non disponible');
    }
  } catch (error) {
    console.error('❌ [SoundService] Erreur lors de la lecture du son:', error);
    console.error('❌ [SoundService] Type d\'erreur:', typeof error);
    console.error('❌ [SoundService] Message:', error.message);
    if (error.stack) console.error('❌ [SoundService] Stack:', error.stack);
  }
};

// Exporter les fonctions
export default {
  initializeSound,
  playNotificationSound,
};