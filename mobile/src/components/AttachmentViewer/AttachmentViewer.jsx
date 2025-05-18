import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

const AttachmentViewer = ({ 
  visible, 
  attachment, 
  onClose,
  theme 
}) => {
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

  if (!visible || !attachment) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.fileName} numberOfLines={1}>{attachment.fileName || 'File'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {attachment.fileType?.startsWith('image/') ? (
            <View style={styles.imagePreview}>
              <Text style={styles.previewText}>Image Preview</Text>
              <Text style={styles.fileInfo}>Click button below to open in browser</Text>
            </View>
          ) : attachment.fileType === 'application/pdf' ? (
            <View style={styles.pdfPreview}>
              <Ionicons name="document-text" size={80} color="#E44D26" />
              <Text style={styles.previewText}>PDF Document</Text>
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

        <TouchableOpacity 
          style={styles.openButton}
          onPress={handleDownload}
        >
          <Text style={styles.openButtonText}>Open in Browser</Text>
        </TouchableOpacity>
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
  imagePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  }
});

export default AttachmentViewer;
