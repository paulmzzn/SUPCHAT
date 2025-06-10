import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Image, 
  Dimensions, 
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AttachmentViewer = ({ 
  visible, 
  attachment, 
  onClose,
  theme 
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleDownload = async () => {
    try {
      if (!attachment?.fileUrl) {
        console.error('No file URL provided');
        return;
      }
      
      // Open in browser (works for all file types)
      await WebBrowser.openBrowserAsync(attachment.fileUrl);
      
      // Close the modal after opening browser
      onClose();
    } catch (error) {
      console.error('Error opening attachment:', error);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (error) => {
    console.log('Erreur chargement image dans viewer:', error);
    setImageLoading(false);
    setImageError(true);
  };

  if (!visible || !attachment) return null;

  const isImage = attachment.fileType?.startsWith('image/');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.fileName} numberOfLines={1}>
            {attachment.fileName || 'File'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {isImage ? (
            <ScrollView
              style={styles.imageScrollView}
              contentContainerStyle={styles.imageScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              {imageLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFF" />
                  <Text style={styles.loadingText}>Chargement de l'image...</Text>
                </View>
              )}
              
              {imageError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="image-outline" size={80} color="#888" />
                  <Text style={styles.errorText}>Erreur de chargement</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => {
                      setImageError(false);
                      setImageLoading(true);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Image
                  source={{ uri: attachment.fileUrl }}
                  style={[
                    styles.fullImage,
                    imageLoading && { opacity: 0 }
                  ]}
                  resizeMode="contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </ScrollView>
          ) : attachment.fileType === 'application/pdf' ? (
            <View style={styles.pdfPreview}>
              <Ionicons name="document-text" size={80} color="#E44D26" />
              <Text style={styles.previewText}>Document PDF</Text>
              <Text style={styles.fileInfo}>{attachment.fileName}</Text>
            </View>
          ) : (
            <View style={styles.genericPreview}>
              <Ionicons 
                name={getFileIconName(attachment.fileType)} 
                size={80} 
                color="#4285F4" 
              />
              <Text style={styles.previewText}>
                {getFileTypeName(attachment.fileType)}
              </Text>
              <Text style={styles.fileInfo}>{attachment.fileName}</Text>
            </View>
          )}
        </View>

        {!isImage && (
          <TouchableOpacity 
            style={styles.openButton}
            onPress={handleDownload}
          >
            <Text style={styles.openButtonText}>Ouvrir dans le navigateur</Text>
          </TouchableOpacity>
        )}

        {isImage && (
          <View style={styles.imageActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDownload}
            >
              <Ionicons name="open-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Ouvrir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const getFileIconName = (fileType) => {
  if (!fileType) return 'document-outline';
  
  if (fileType.startsWith('image/')) return 'image-outline';
  if (fileType === 'application/pdf') return 'document-text-outline';
  if (fileType.startsWith('video/')) return 'videocam-outline';
  if (fileType.startsWith('audio/')) return 'musical-notes-outline';
  if (fileType.includes('word')) return 'document-outline';
  if (fileType.includes('excel') || fileType.includes('sheet')) return 'grid-outline';
  
  return 'document-outline';
};

const getFileTypeName = (fileType) => {
  if (!fileType) return 'File';
  
  if (fileType.startsWith('image/')) return 'Image';
  if (fileType === 'application/pdf') return 'PDF Document';
  if (fileType.startsWith('video/')) return 'Video';
  if (fileType.startsWith('audio/')) return 'Audio';
  if (fileType.includes('word')) return 'Word Document';
  if (fileType.includes('excel') || fileType.includes('sheet')) return 'Spreadsheet';
  
  return 'File';
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 50,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
  },
  fileName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight,
  },
  pdfPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  genericPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  previewText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
  },
  fileInfo: {
    color: '#CCC',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  openButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  openButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 5,
  },
});

export default AttachmentViewer;
