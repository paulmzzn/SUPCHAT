import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

const StrawpollWebView = ({ visible, pollUrl, pollTitle, onClose, theme }) => {
  const [loading, setLoading] = useState(false);

  const handleOpenInBrowser = async () => {
    try {
      setLoading(true);
      
      // Ouvrir dans le navigateur intégré d'Expo avec des options simplifiées
      const result = await WebBrowser.openBrowserAsync(pollUrl, {
        // Options basiques compatibles avec toutes les versions
        showTitle: true,
        toolbarColor: theme.primaryBackground,
        enableBarCollapsing: false,
      });
      
      // Fermer le modal une fois que l'utilisateur revient
      if (result.type === 'dismiss' || result.type === 'cancel') {
        onClose();
      }
    } catch (error) {
      console.error('Erreur ouverture WebBrowser:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir le sondage. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExternal = async () => {
    try {
      // Ouvrir dans le navigateur par défaut du système
      await WebBrowser.openBrowserAsync(pollUrl);
      onClose();
    } catch (error) {
      console.error('Erreur ouverture externe:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir le lien externe.',
        [{ text: 'OK' }]
      );
    }
  };

  const styles = getStyles(theme);

  if (!pollUrl) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.statusBarStyle || 'light-content'} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Ionicons name="bar-chart" size={20} color={theme.accentPrimary} />
            <Text style={styles.title} numberOfLines={1}>
              {pollTitle || 'Sondage Strawpoll'}
            </Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>

        {/* Contenu principal */}
        <View style={styles.content}>
          <View style={styles.pollInfoContainer}>
            <View style={styles.pollIcon}>
              <Ionicons name="bar-chart" size={48} color={theme.accentPrimary} />
            </View>
            
            <Text style={styles.pollTitle}>
              {pollTitle || 'Sondage Strawpoll'}
            </Text>
            
            <Text style={styles.pollDescription}>
              Participez à ce sondage pour donner votre avis. Le sondage s'ouvrira dans votre navigateur.
            </Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]} 
              onPress={handleOpenInBrowser}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="open-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Ouvrir le sondage</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]} 
              onPress={handleOpenExternal}
            >
              <Ionicons name="link-outline" size={20} color={theme.textPrimary} />
              <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                Ouvrir dans le navigateur
              </Text>
            </TouchableOpacity>
          </View>

          {/* Informations de sécurité */}
          <View style={styles.securityInfo}>
            <View style={styles.securityIcon}>
              <Ionicons name="shield-checkmark" size={16} color={theme.textSecondary} />
            </View>
            <Text style={styles.securityText}>
              Vos votes sont sécurisés et anonymes sur Strawpoll.com
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginLeft: 8,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  pollInfoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pollIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.accentPrimary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pollTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  pollDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: theme.accentPrimary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  securityIcon: {
    marginRight: 8,
  },
  securityText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});

export default StrawpollWebView;