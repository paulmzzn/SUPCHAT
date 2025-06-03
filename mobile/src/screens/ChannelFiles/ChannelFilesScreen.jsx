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
import { useTheme } from '../../theme/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import AttachmentViewer from '../../components/AttachmentViewer/AttachmentViewer';
import Toast from 'react-native-toast-message';
import { getStyles } from './ChannelFilesScreen.styles';

const ChannelFilesScreen = ({ route, navigation }) => {
  const { workspaceId, channelId, channelName, workspaceName } = route.params;
  const { colors: themeColors } = useTheme();
  const { socket } = useSocket();
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
      
      if (socket) {
        socket.emit('getChannelFiles', { channelId, workspaceId }, (response) => {
          if (response.success) {
            setFiles(response.files || []);
          } else {
            Toast.show({
              type: 'error',
              text1: 'Erreur',
              text2: 'Impossible de charger les fichiers'
            });
          }
          setLoading(false);
        });
      }
    } catch (error) {
      console.error('Error fetching channel files:', error);
      setLoading(false);
    }
  }, [socket, channelId, workspaceId]);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'images') return matchesSearch && file.fileType?.startsWith('image/');
    if (selectedFilter === 'documents') return matchesSearch && !file.fileType?.startsWith('image/') && !file.fileType?.startsWith('video/');
    if (selectedFilter === 'videos') return matchesSearch && file.fileType?.startsWith('video/');
    
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
    const fullUrl = file.fileUrl.startsWith('http')
      ? file.fileUrl
      : `${baseUrl}/${file.fileUrl}`;

    setSelectedAttachment({
      fileName: file.fileName,
      fileUrl: fullUrl,
      fileType: file.fileType,
      fileSize: file.fileSize
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
          name={getFileIcon(item.fileType)} 
          size={24} 
          color={themeColors.accentPrimary} 
        />
      </View>
      
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={2}>
          {item.fileName}
        </Text>
        <Text style={styles.fileDetails}>
          {formatFileSize(item.fileSize)} • {formatDate(item.createdAt)}
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
        keyExtractor={(item) => item.id || item._id}
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
