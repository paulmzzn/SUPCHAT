import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import StrawpollMessageCard from '../Strawpoll/StrawpollMessageCard';
import { renderTextWithMentionsAndChannels } from '../../utils/mentionUtils';

const MessageContent = memo(({ 
  message, 
  group, 
  styles, 
  themeColors, 
  onOpenAttachment,
  onStrawpollVote,
  onStrawpollViewResults,
  onUserPress, // Handler pour les clics sur les mentions d'utilisateurs
  onChannelPress // Handler pour les clics sur les mentions de canaux
}) => {
  const parseFileContent = useCallback((content) => {
    if (!content) return null;
    
    const trimmedContent = content.trim();
    if (!trimmedContent.startsWith('{') && !trimmedContent.startsWith('[')) {
      return null;
    }
    
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      if (parsed && parsed.type === 'file') {
        return {
          fileName: parsed.fileName,
          fileUrl: parsed.fileUrl,
          fileSize: parsed.fileSize,
          fileType: parsed.fileType,
          isImage: parsed.isImage || false
        };
      }
    } catch (error) {
      return null;
    }
    
    return null;
  }, []);

  const getFileIcon = useCallback((fileType) => {
    if (!fileType) return 'document-outline';
    
    if (fileType.startsWith('image/')) return 'image-outline';
    if (fileType === 'application/pdf') return 'document-text-outline';
    if (fileType.startsWith('video/')) return 'videocam-outline';
    if (fileType.startsWith('audio/')) return 'musical-notes-outline';
    if (fileType.includes('word')) return 'document-outline';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'grid-outline';
    
    return 'document-outline';
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return '';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const fileData = parseFileContent(message.contenu);
  const isStrawpoll = message.contenu && message.contenu.includes('[strawpoll:');

  if (isStrawpoll) {
    return (
      <StrawpollMessageCard
        messageContent={message.contenu}
        theme={themeColors}
        onVote={onStrawpollVote}
        onViewResults={onStrawpollViewResults}
        isOwn={group.isOwn}
      />
    );
  }

  if (fileData) {
    if (fileData.isImage) {
      return (
        <TouchableOpacity 
          style={[
            styles.imageAttachment,
            { backgroundColor: group.isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
          onPress={() => onOpenAttachment(fileData)}
        >
          <Image
            source={{ 
              uri: fileData.fileUrl.startsWith('http') 
                ? fileData.fileUrl 
                : `https://s3-supchat.s3.fr-par.scw.cloud/${fileData.fileUrl}`
            }}
            style={styles.imagePreview}
            resizeMode="cover"
            onError={(e) => {
              console.log('Erreur chargement image:', e.nativeEvent.error);
            }}
          />
          <View style={styles.imageOverlay}>
            <Ionicons
              name="eye-outline"
              size={20}
              color="rgba(255,255,255,0.9)"
            />
          </View>
          {fileData.fileName && (
            <View style={[
              styles.imageCaptionContainer,
              { backgroundColor: group.isOwn ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)' }
            ]}>
              <Text 
                style={[
                  styles.imageCaption,
                  { color: group.isOwn ? '#FFFFFF' : '#000000' }
                ]}
                numberOfLines={1}
              >
                {fileData.fileName}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity 
          style={[
            styles.fileAttachment,
            { backgroundColor: group.isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
          onPress={() => onOpenAttachment(fileData)}
        >
          <View style={styles.fileIconContainer}>
            <Ionicons
              name={getFileIcon(fileData.fileType)}
              size={24}
              color={group.isOwn ? '#FFFFFF' : themeColors.textPrimary}
            />
          </View>
          <View style={styles.fileDetails}>
            <Text
              style={[
                styles.fileName,
                { color: group.isOwn ? '#FFFFFF' : themeColors.textPrimary }
              ]}
              numberOfLines={1}
            >
              {fileData.fileName}
            </Text>
            {fileData.fileSize && (
              <Text 
                style={[
                  styles.fileSize,
                  { color: group.isOwn ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary }
                ]}
              >
                {formatFileSize(fileData.fileSize)}
              </Text>
            )}
          </View>
          <Ionicons
            name="eye-outline"
            size={20}
            color={group.isOwn ? 'rgba(255,255,255,0.8)' : themeColors.accentPrimary}
          />
        </TouchableOpacity>
      );
    }
  }

  return renderTextWithMentionsAndChannels(
    message.contenu, 
    themeColors, 
    onUserPress,
    onChannelPress,
    [
      styles.messageText,
      group.isOwn ? styles.ownMessageText : styles.otherMessageText
    ],
    group.isOwn // Passer l'information si c'est notre message
  );
});

MessageContent.displayName = 'MessageContent';

export default MessageContent;
