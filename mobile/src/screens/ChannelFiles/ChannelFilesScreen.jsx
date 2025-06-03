import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import AttachmentViewer from '../../components/AttachmentViewer/AttachmentViewer';
import Toast from 'react-native-toast-message';
import { getStyles } from './ChannelFilesScreen.styles';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ChannelFilesScreen = ({ route, navigation }) => {
  const { workspaceId, channelId, channelName, workspaceName } = route.params;
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [attachmentViewerVisible, setAttachmentViewerVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  useEffect(() => {
    fetchChannelFiles();
  }, [channelId]);

  const fetchChannelFiles = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Token d\'authentification manquant'
        });
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching files for channel:', channelId);
      console.log('🌐 API URL:', `${API_URL}/api/canals/${channelId}/files`);

      // Utiliser la route correcte qui existe dans le backend
      const response = await fetch(`${API_URL}/api/canals/${channelId}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || 'Erreur lors du chargement des fichiers');
      }

      const filesData = await response.json();
      console.log('📁 Files data received:', filesData);
      console.log('📁 Number of files:', filesData ? filesData.length : 0);
      
      if (filesData && filesData.length > 0) {
        console.log('📁 First file structure:', filesData[0]);
      }
      
      setFiles(filesData || []);
      
    } catch (error) {
      console.error('❌ Error fetching channel files:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger les fichiers'
      });
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  const filteredFiles = files.filter(file => {
    const fileName = file.nom_fichier || file.fileName || '';
    const matchesSearch = fileName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'images') return matchesSearch && file.type?.startsWith('image/');
    if (selectedFilter === 'documents') return matchesSearch && !file.type?.startsWith('image/') && !file.type?.startsWith('video/');
    if (selectedFilter === 'videos') return matchesSearch && file.type?.startsWith('video/');
    
    return matchesSearch;
  });

  const getFileIcon = (fileType) => {
    if (!fileType) return 'document-outline';
    
    if (fileType.startsWith('image/')) return 'image-outline';
    if (fileType === 'application/pdf') return 'document-text-outline';
    if (fileType.startsWith('video/')) return 'videocam-outline';
    if (fileType.startsWith('audio/')) return 'musical-notes-outline';
    if (fileType.includes('word')) return 'document-outline';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'grid-outline';
    
    return 'document-outline';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenFile = useCallback((file) => {
    const baseUrl = 'https://s3-supchat.s3.fr-par.scw.cloud';
    const fileUrl = file.url || file.fileUrl || '';
    const fullUrl = fileUrl.startsWith('http')
      ? fileUrl
      : `${baseUrl}/${fileUrl}`;

    setSelectedAttachment({
      fileName: file.nom_fichier || file.fileName || 'Fichier sans nom',
      fileUrl: fullUrl,
      fileType: file.type || file.fileType || '',
      fileSize: file.taille_fichier || file.fileSize || 0
    });
    setAttachmentViewerVisible(true);
  }, []);

  const renderFile = ({ item }) => (
    <TouchableOpacity 
      style={styles.fileItem}
      onPress={() => handleOpenFile(item)}
    >
      <View style={styles.fileIcon}>
        <Ionicons 
          name={getFileIcon(item.type || item.fileType)} 
          size={24} 
          color={themeColors.accentPrimary} 
        />
      </View>
      
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={2}>
          {item.nom_fichier || item.fileName || 'Fichier sans nom'}
        </Text>
        <Text style={styles.fileDetails}>
          {formatFileSize(item.taille_fichier || item.fileSize || 0)} • {formatDate(item.date_upload || item.createdAt || new Date())}
        </Text>
        {item.senderName && (
          <Text style={styles.senderName}>
            Par {item.senderName}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.downloadButton}>
        <Ionicons name="download-outline" size={20} color={themeColors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accentPrimary} />
        <Text style={styles.loadingText}>Chargement des fichiers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Fichiers</Text>
          <Text style={styles.headerSubtitle}>#{channelName}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={themeColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des fichiers..."
            placeholderTextColor={themeColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Tous')}
        {renderFilterButton('images', 'Images')}
        {renderFilterButton('documents', 'Documents')}
        {renderFilterButton('videos', 'Vidéos')}
      </View>

      <View style={styles.filesCount}>
        <Text style={styles.filesCountText}>
          {filteredFiles.length} fichier{filteredFiles.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filteredFiles}
        renderItem={renderFile}
        keyExtractor={(item) => item.id_fichier || item.id || item._id || Math.random().toString()}
        style={styles.filesList}
        contentContainerStyle={styles.filesListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={themeColors.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun fichier trouvé' : 'Aucun fichier partagé'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? 'Essayez de modifier votre recherche'
                : 'Les fichiers partagés dans ce canal s\'afficheront ici'
              }
            </Text>
          </View>
        }
      />

      <AttachmentViewer
        visible={attachmentViewerVisible}
        attachment={selectedAttachment}
        onClose={() => {
          setAttachmentViewerVisible(false);
          setSelectedAttachment(null);
        }}
        theme={themeColors}
      />
    </View>
  );
};

export default ChannelFilesScreen;
