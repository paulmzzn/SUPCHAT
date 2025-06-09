import React from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { getStyles } from './MessageInput.styles';
import ReplyPreview from './ReplyPreview';
import FileUploader from '../FileUploader';

const MessageInput = ({
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
  // Nouvelles props pour le FileUploader
  uploadType = 'private-message',
  recipientId = null,
  workspaceId = null,
  channelId = null, // Ajout de la nouvelle prop
  onFileSelected = null,
  onUploadProgress = null,
  onUploadComplete = null,
  onUploadError = null,
}) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  return (
    <View
      style={[
        styles.container,
        keyboardVisible && Platform.OS === "android" && { paddingBottom: 5 },
        containerStyle,
      ]}
    >
      {replyingTo && onCancelReply && (
        <ReplyPreview 
          replyingTo={replyingTo}
          replyUserName={replyUserName || "Utilisateur"}
          onCancel={onCancelReply}
          themeColors={themeColors}
        />
      )}

      <View style={styles.inputRow}>
        <FileUploader
          uploadType={uploadType}
          recipientId={recipientId}
          workspaceId={workspaceId}
          channelId={channelId} // Ajoutez cette prop
          iconSize={24}
          iconColor={themeColors.textSecondary}
          onFileSelected={onFileSelected}
          onUploadProgress={onUploadProgress}
          onUploadComplete={onUploadComplete}
          onUploadError={onUploadError}
          style={styles.attachmentButton}
        />

        <TextInput
          ref={inputRef}
          style={styles.messageInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
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
          onPress={onSend}
        >
          <Ionicons
            name="send"
            size={24}
            color={themeColors.textOnAccent}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MessageInput;