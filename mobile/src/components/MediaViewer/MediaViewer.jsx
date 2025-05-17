import React, { useState } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, Image, 
  StyleSheet, Linking, Platform, Dimensions,
  ActivityIndicator, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

const { width, height } = Dimensions.get('window');

const MediaViewer = ({ 
  visible, 
  media, 
  onClose,
  theme 
}) => {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Function to determine file type display info
  const getFileTypeInfo = () => {
    if (!media?.fileType) return { 
      icon: 'document-outline', 
      name: 'Fichier inconnu', 
      color: '#9E9E9E'
    };
    
    if (media.fileType.startsWith('image/')) 
      return { icon: 'image', name: 'Image', color: '#4CAF50' };
      
    if (media.fileType === 'application/pdf') 
      return { icon: 'document-text', name: 'Document PDF', color: '#FF5722' };
      
    if (media.fileType.startsWith('video/')) 
      return { icon: 'videocam', name: 'Vidéo', color: '#FF9800' };
      
    if (media.fileType.startsWith('audio/')) 
      return { icon: 'musical-notes', name: 'Fichier Audio', color: '#2196F3' };
      
    if (media.fileType.includes('word')) 
      return { icon: 'document', name: 'Document Word', color: '#2196F3' };
      
    if (media.fileType.includes('excel') || media.fileType.includes('sheet')) 
      return { icon: 'grid', name: 'Feuille de calcul', color: '#4CAF50' };
    
    return { icon: 'document-outline', name: 'Document', color: '#9E9E9E' };
  };

  // Function to handle opening file in external browser
  const handleOpenInBrowser = async () => {
    if (!media?.fileUrl) return;
    
    try {
      setLoading(true);
      // Use Expo's WebBrowser which is supported in Expo Go
      await WebBrowser.openBrowserAsync(media.fileUrl);
      // Close the modal after opening browser
      onClose();
    } catch (error) {
      console.error('Error opening file in browser:', error);
      // Fallback to basic Linking 
      try {
        await Linking.openURL(media.fileUrl);
        onClose();
      } catch (linkError) {
        console.error('Error opening URL via Linking:', linkError);
        alert("Impossible d'ouvrir ce fichier.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !media) return null;

  const fileTypeInfo = getFileTypeInfo();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {media.fileName || 'Aperçu du fichier'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* Content Area */}
        <View style={styles.contentContainer}>
          {media.fileType?.startsWith('image/') && !imgError ? (
            // For images - show directly
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: media.fileUrl }}
                style={styles.image}
                resizeMode="contain"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setImgError(true);
                }}
              />
              {loading && (
                <ActivityIndicator 
                  size="large" 
                  color="#4285F4" 
                  style={styles.loadingOverlay} 
                />
              )}
            </View>
          ) : (
            // For other files - show icon and info
            <View style={styles.fileInfoContainer}>
              <Ionicons
                name={fileTypeInfo.icon}
                size={80}
                color={fileTypeInfo.color}
                style={styles.fileIcon}
              />
              <Text style={styles.fileTypeName}>{fileTypeInfo.name}</Text>
              <Text style={styles.fileName}>{media.fileName}</Text>
              
              <Text style={styles.description}>
                Ce type de fichier nécessite d'être ouvert dans un navigateur externe.
                Utilisez le bouton ci-dessous pour le visualiser.
              </Text>
            </View>
          )}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.browserButton}
            onPress={handleOpenInBrowser}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="open-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Ouvrir dans le navigateur</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeTextButton} onPress={onClose}>
            <Text style={styles.closeTextButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 6,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fileInfoContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  fileIcon: {
    marginBottom: 20,
  },
  fileTypeName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  fileName: {
    color: '#DDDDDD',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    color: '#BBBBBB',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  browserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeTextButton: {
    marginTop: 16,
    padding: 8,
  },
  closeTextButtonText: {
    color: '#AAAAAA',
    fontSize: 14,
  }
});

export default MediaViewer;
