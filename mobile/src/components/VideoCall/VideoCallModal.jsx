import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
  Animated,
  BackHandler,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { styles } from './VideoCallModal.styles';

const VideoCallModal = ({
  visible,
  onClose,
  workspaceId,
  channelId,
  channelName,
  currentUserName,
  socket,
  themeColors
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  
  const webViewRef = useRef(null);
  const isFirstParticipant = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Effet pour gérer le bouton retour sur Android
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  // Effet pour l'animation d'entrée
  useEffect(() => {
    if (visible) {
      StatusBar.setBarStyle('light-content');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        StatusBar.setBarStyle('default');
      });
    }
  }, [visible, fadeAnim]);

  // Effet pour générer le lien de la réunion
  useEffect(() => {
    if (visible && workspaceId && channelId) {
      const generateMeetLink = async () => {
        try {
          setIsLoading(true);
          setError('');

          // Générer un ID stable pour la salle basé sur le workspace et le canal
          const roomId = `supchat-${workspaceId}-${channelId}`;

          // Créer l'URL kMeet avec les paramètres et forcer l'utilisation de la version web
          // Combinaison maximale de paramètres pour forcer l'utilisation de la version web
          const url = `https://kmeet.infomaniak.com/${roomId}?userName=${encodeURIComponent(
            currentUserName || "Utilisateur"
          )}&autoJoin=true&enableChat=true&lang=fr&forceWeb=true&bypassNativeCheck=true&useWeb=1&skipAppCheck=1&platform=web&device=desktop&forcePlatform=web&web=true&browser=true&mobile=false&skipNativeDialog=true`;

          setMeetLink(url);
          isFirstParticipant.current = true;
        } catch (err) {
          console.error("Erreur lors de la génération de l'appel vidéo:", err);
          setError("Impossible de créer l'appel vidéo");
        } finally {
          setIsLoading(false);
        }
      };

      generateMeetLink();
    }

    // Nettoyer à la fermeture
    return () => {
      setMeetLink('');
      setParticipants(0);
      setHasJoinedCall(false);
      isFirstParticipant.current = false;
    };
  }, [visible, workspaceId, channelId, currentUserName]);

  // Fonction pour envoyer une notification d'appel vidéo au chat
  const sendVideoCallNotification = () => {
    if (socket && socket.connected && channelId && workspaceId) {
      // Envoyer un message système au canal
      socket.emit("message", {
        canal_id: channelId,
        content: `📹 **${
          currentUserName || "Un utilisateur"
        }** a lancé un appel vidéo dans ce canal.`,
        workspace_id: workspaceId,
        is_system_message: true,
      });
    }
  };

  // JavaScript à injecter dans la WebView pour communiquer avec kMeet
  const injectedJavaScript = `
    // Modifier la détection de l'agent utilisateur pour simuler un navigateur de bureau
    Object.defineProperty(navigator, 'userAgent', {
      get: function () { return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'; }
    });
    
    // Modifier la méthode matchMedia pour ne pas correspondre aux requêtes media mobiles
    window.originalMatchMedia = window.matchMedia;
    window.matchMedia = function(query) {
      if (query.includes('max-width') || query.includes('mobile')) {
        return { matches: false, media: query };
      }
      return window.originalMatchMedia(query);
    };

    // Bypasser toute redirection vers l'app store
    window.open = function(url, target) {
      if (url && (url.includes('app-store') || url.includes('play.google.com'))) {
        console.log('Blocked redirect to store: ' + url);
        return null;
      }
      return window.originalOpen ? window.originalOpen(url, target) : null;
    };
    
    // Écouter les messages pour obtenir le nombre de participants
    window.addEventListener('message', function(event) {
      if (event.data && event.data.participantCount !== undefined) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'participantCount',
          count: event.data.participantCount
        }));
      }
    });

    // Définir forceWeb=true et bypassNativeCheck=true dans le localStorage
    localStorage.setItem('kmeet-force-web', 'true');
    localStorage.setItem('kmeet-bypass-native', 'true');
    
    // Observer les boutons "Rejoindre depuis le navigateur" et cliquer automatiquement dessus
    function clickWebButton() {
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.innerText && btn.innerText.includes('navigateur')) {
          console.log('Clicking web button automatically');
          btn.click();
          return true;
        }
      }
      return false;
    }
    
    // Essayer immédiatement
    if (!clickWebButton()) {
      // Si le bouton n'est pas encore là, configurer un observateur
      const observer = new MutationObserver(function(mutations) {
        if (clickWebButton()) {
          observer.disconnect();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Essayer à nouveau après un délai
      setTimeout(clickWebButton, 1000);
      setTimeout(clickWebButton, 3000);
    }
    
    true;
  `;

  // Gestion des messages depuis la WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'participantCount') {
        const newCount = data.count;
        setParticipants(newCount);
        
        // Si on est le premier participant (1) et qu'on vient de rejoindre
        if (newCount === 1 && isFirstParticipant.current && !hasJoinedCall) {
          // On est la première personne à rejoindre, donc on lance une notification
          setTimeout(() => {
            sendVideoCallNotification();
          }, 1000);
          
          isFirstParticipant.current = false;
          setHasJoinedCall(true);
        }
      } else if (data.type === 'error') {
        setError(data.message || 'Erreur lors de l\'initialisation de l\'appel vidéo');
      } else if (data.type === 'webAppReady') {
        // L'application web est prête, injecter du code additionnel si nécessaire
        const additionalScript = `
          // Code additionnel une fois que l'app est chargée
          console.log('kMeet web app is ready, injecting additional code');
          true;
        `;
        webViewRef.current?.injectJavaScript(additionalScript);
      }
    } catch (error) {
      console.error('Erreur parsing message WebView:', error);
    }
  };

  // Fonction pour gérer les cas où la détection automatique échoue
  const handleBypassSelectionScreen = () => {
    // Script pour cliquer explicitement sur le bouton "Rejoindre depuis le navigateur"
    const bypassScript = `
      (function() {
        // Chercher tous les boutons et liens
        const elements = document.querySelectorAll('button, a, div[role="button"]');
        
        // Chercher par texte
        for (let el of elements) {
          const text = el.innerText || el.textContent;
          if (text && (
              text.includes('navigateur') || 
              text.includes('browser') ||
              text.includes('web') ||
              text.toLowerCase().includes('join')
            )) {
            console.log('Clicking bypass element:', text);
            el.click();
            return true;
          }
        }
        
        // Chercher par attributs
        for (let el of elements) {
          if (el.getAttribute('data-testid') === 'join-from-browser' || 
              el.getAttribute('id') === 'join-browser' ||
              el.getAttribute('class') && el.getAttribute('class').includes('browser')) {
            console.log('Clicking bypass element by attribute');
            el.click();
            return true;
          }
        }
        
        return false;
      })();
      true;
    `;
    
    webViewRef.current?.injectJavaScript(bypassScript);
    
    // Afficher un toast pour informer l'utilisateur
    Toast.show({
      type: 'info',
      text1: 'Activation du mode navigateur',
      text2: 'Tentative de contournement de l\'écran de sélection...',
      position: 'bottom',
    });
  };

  // Fonction pour basculer le micro
  const toggleMute = () => {
    setIsMuted(!isMuted);
    const script = isMuted 
      ? `document.dispatchEvent(new CustomEvent('kmeet-unmute')); true;`
      : `document.dispatchEvent(new CustomEvent('kmeet-mute')); true;`;
    
    webViewRef.current?.injectJavaScript(script);
  };

  // Fonction pour basculer la caméra
  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    const script = isVideoOff
      ? `document.dispatchEvent(new CustomEvent('kmeet-startVideo')); true;`
      : `document.dispatchEvent(new CustomEvent('kmeet-stopVideo')); true;`;
    
    webViewRef.current?.injectJavaScript(script);
  };

  // Fonction pour ouvrir l'appel dans le navigateur
  const openInBrowser = async () => {
    try {
      if (meetLink) {
        await Linking.openURL(meetLink);
        onClose();
      }
    } catch (error) {
      Toast.show({ 
        type: 'error', 
        text1: 'Erreur', 
        text2: 'Impossible d\'ouvrir le lien dans le navigateur' 
      });
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay, 
          { opacity: fadeAnim, backgroundColor: themeColors.modalOverlay }
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.modalContainer,
                { backgroundColor: themeColors.cardBackground }
              ]}>
                {/* Header */}
                <View style={[
                  styles.header,
                  { borderBottomColor: themeColors.borderColor }
                ]}>
                  <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
                      Appel vidéo
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
                      #{channelName}
                    </Text>
                  </View>
                  
                  <View style={styles.headerActions}>
                    <View style={styles.participantsContainer}>
                      <Ionicons name="people" size={16} color={themeColors.textSecondary} />
                      <Text style={[styles.participantsCount, { color: themeColors.textSecondary }]}>
                        {participants}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={onClose}
                    >
                      <Ionicons name="close" size={24} color={themeColors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Content */}
                <View style={styles.content}>
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={themeColors.accentPrimary} />
                      <Text style={[styles.loadingText, { color: themeColors.textPrimary }]}>
                        Préparation de l'appel vidéo...
                      </Text>
                    </View>
                  ) : error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="warning" size={48} color={themeColors.error} />
                      <Text style={[styles.errorText, { color: themeColors.textPrimary }]}>
                        {error}
                      </Text>
                      <TouchableOpacity
                        style={[styles.errorButton, { backgroundColor: themeColors.accentPrimary }]}
                        onPress={onClose}
                      >
                        <Text style={[styles.errorButtonText, { color: themeColors.textOnAccent }]}>
                          Fermer
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <WebView
                      ref={webViewRef}
                      source={{ uri: meetLink }}
                      style={styles.webView}
                      startInLoadingState={true}
                      renderLoading={() => (
                        <View style={[styles.webViewLoading, { backgroundColor: themeColors.primaryBackground }]}>
                          <ActivityIndicator size="large" color={themeColors.accentPrimary} />
                          <Text style={[styles.loadingText, { color: themeColors.textPrimary, marginTop: 16 }]}>
                            Chargement de l'appel vidéo...
                          </Text>
                          <TouchableOpacity
                            style={[styles.bypassButton, { backgroundColor: themeColors.accentPrimary, marginTop: 20 }]}
                            onPress={handleBypassSelectionScreen}
                          >
                            <Text style={{ color: 'white', fontWeight: '600' }}>
                              Utiliser mode navigateur
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      onMessage={handleWebViewMessage}
                      injectedJavaScript={injectedJavaScript}
                      onLoad={() => {
                        // Injecter un script supplémentaire après le chargement de la page
                        const onLoadScript = `
                          // Vérifier et cliquer sur le bouton "Rejoindre depuis le navigateur" s'il est visible
                          (function checkForWebButton() {
                            const buttons = document.querySelectorAll('button, a');
                            for (let el of buttons) {
                              if (el.innerText && (
                                  el.innerText.includes('navigateur') || 
                                  el.innerText.includes('Rejoindre') || 
                                  el.innerText.includes('browser')
                                )) {
                                console.log('Found web button:', el.innerText);
                                el.click();
                                return true;
                              }
                            }
                            // Si pas trouvé, essayer à nouveau après un délai
                            setTimeout(checkForWebButton, 1000);
                          })();
                          true;
                        `;
                        webViewRef.current?.injectJavaScript(onLoadScript);
                      }}
                      onNavigationStateChange={(navState) => {
                        // Détecter si nous sommes redirigés vers une page d'app store et annuler
                        if (navState.url.includes('apps.apple.com') || navState.url.includes('play.google.com')) {
                          webViewRef.current?.stopLoading();
                          webViewRef.current?.goBack();
                        }
                      }}
                      allowsInlineMediaPlayback={true}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                      applicationNameForUserAgent="SupchatWebapp"
                      cacheEnabled={false}
                      incognito={true}
                      allowsFullscreenVideo={true}
                      mediaPlaybackRequiresUserAction={false}
                      javaScriptCanOpenWindowsAutomatically={true}
                      originWhitelist={['*']}
                      mixedContentMode="always"
                      onShouldStartLoadWithRequest={(request) => {
                        // Bloquer les redirections vers app store ou autres pages non désirées
                        return !(
                          request.url.includes('apps.apple.com') || 
                          request.url.includes('play.google.com') || 
                          request.url.includes('app-store')
                        );
                      }}
                    />
                  )}
                </View>
                
                {/* Controls */}
                <View style={[
                  styles.controls,
                  { backgroundColor: themeColors.cardBackground, borderTopColor: themeColors.borderColor }
                ]}>
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      isMuted && [styles.controlButtonOff, { backgroundColor: themeColors.error }]
                    ]}
                    onPress={toggleMute}
                  >
                    <Ionicons
                      name={isMuted ? "mic-off" : "mic"}
                      size={24}
                      color={isMuted ? "white" : themeColors.textPrimary}
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      isVideoOff && [styles.controlButtonOff, { backgroundColor: themeColors.error }]
                    ]}
                    onPress={toggleVideo}
                  >
                    <Ionicons
                      name={isVideoOff ? "videocam-off" : "videocam"}
                      size={24}
                      color={isVideoOff ? "white" : themeColors.textPrimary}
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      styles.browserButton,
                      { backgroundColor: themeColors.secondaryCardBackground }
                    ]}
                    onPress={openInBrowser}
                  >
                    <Ionicons name="open-outline" size={24} color={themeColors.textPrimary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      styles.endCallButton,
                      { backgroundColor: themeColors.error }
                    ]}
                    onPress={onClose}
                  >
                    <Text style={styles.endCallText}>Quitter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
};

export default VideoCallModal;
