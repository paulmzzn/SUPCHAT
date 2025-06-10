import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './MessageInputWithMentions.styles';
import { useMentions } from '../../hooks/useMentions';
import MentionSuggestions from '../MentionSuggestions';
import ReplyPreview from './ReplyPreview';
import FileUploader from '../FileUploader';

const MessageInputWithMentions = ({
  value,
  onChangeText,
  onSend,
  placeholder = "Type a message...",
  replyingTo = null,
  onCancelReply = null,
  replyUserName = null,
  isDarkMode = false,
  inputRef = null,
  keyboardVisible = false,
  containerStyle = {},
  workspaceId = null,
  channelId = null,
  // Props pour FileUploader
  uploadType = 'workspace-message',
  recipientId = null,
  onFileSelected = null,
  onUploadProgress = null,
  onUploadComplete = null,
  onUploadError = null,
}) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  
  const internalInputRef = useRef(null);
  const textInputRef = inputRef || internalInputRef;
  
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const {
    showMentionSuggestions,
    mentionSuggestions,
    activeMentionIndex,
    fetchMentionableUsers,
    handleMentionInput,
    selectMention,
    closeMentionSuggestions,
  } = useMentions();

  // Charger les utilisateurs mentionnables quand workspaceId change
  React.useEffect(() => {
    if (workspaceId) {
      fetchMentionableUsers(workspaceId);
    }
  }, [workspaceId, fetchMentionableUsers]);

  // Gérer les changements de texte avec détection des mentions
  const handleTextChange = useCallback((text) => {
    onChangeText(text);
    
    // Utiliser la position du curseur actuelle ou la fin du texte
    const position = cursorPosition || text.length;
    handleMentionInput(text, position);
  }, [onChangeText, cursorPosition, handleMentionInput]);

  // Gérer les changements de position du curseur
  const handleSelectionChange = useCallback((event) => {
    const { selection } = event.nativeEvent;
    setCursorPosition(selection.start);
    
    // Re-vérifier les mentions à la nouvelle position
    handleMentionInput(value, selection.start);
  }, [value, handleMentionInput]);

  // Sélectionner une mention
  const handleSelectMention = useCallback((user) => {
    const result = selectMention(user, value, cursorPosition);
    
    if (result) {
      onChangeText(result.newText);
      
      // Mettre le focus et positionner le curseur
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.setNativeProps({
            selection: { start: result.newCursorPosition, end: result.newCursorPosition }
          });
        }
      }, 50);
    }
  }, [selectMention, value, cursorPosition, onChangeText, textInputRef]);

  // Gérer l'envoi du message
  const handleSend = useCallback(() => {
    closeMentionSuggestions();
    onSend();
  }, [closeMentionSuggestions, onSend]);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Suggestions de mentions */}
      <MentionSuggestions
        suggestions={mentionSuggestions}
        activeMentionIndex={activeMentionIndex}
        onSelectMention={handleSelectMention}
        themeColors={themeColors}
        visible={showMentionSuggestions}
      />
      
      {/* Container principal */}
      <View style={[
        styles.inputContainer,
        keyboardVisible && Platform.OS === "android" && { paddingBottom: 5 },
      ]}>
        {/* Prévisualisation de réponse */}
        {replyingTo && onCancelReply && (
          <ReplyPreview 
            replyingTo={replyingTo}
            replyUserName={replyUserName || "Utilisateur"}
            onCancel={onCancelReply}
            themeColors={themeColors}
          />
        )}

        {/* Ligne d'input */}
        <View style={styles.inputRow}>
          <FileUploader
            uploadType={uploadType}
            recipientId={recipientId}
            workspaceId={workspaceId}
            channelId={channelId}
            iconSize={24}
            iconColor={themeColors.textSecondary}
            onFileSelected={onFileSelected}
            onUploadProgress={onUploadProgress}
            onUploadComplete={onUploadComplete}
            onUploadError={onUploadError}
            style={styles.attachmentButton}
          />

          <TextInput
            ref={textInputRef}
            style={styles.messageInput}
            placeholder={placeholder}
            value={value}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            multiline
            keyboardAppearance={isDarkMode ? "dark" : "light"}
            placeholderTextColor={isDarkMode ? "#777" : "#999"}
            selectionColor={isDarkMode ? themeColors.accentPrimary : undefined}
            cursorColor={isDarkMode ? themeColors.accentPrimary : undefined}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !value.trim() && styles.sendButtonDisabled,
            ]}
            disabled={!value.trim()}
            onPress={handleSend}
          >
            <Ionicons
              name="send"
              size={24}
              color={themeColors.textOnAccent}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default MessageInputWithMentions;
