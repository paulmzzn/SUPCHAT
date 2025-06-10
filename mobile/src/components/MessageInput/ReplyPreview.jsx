import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStyles } from './MessageInput.styles';

const ReplyPreview = ({ replyingTo, replyUserName, onCancel, themeColors }) => {
  const styles = getStyles(themeColors);
  
  return (
    <View style={styles.replyContainer}>
      <View style={styles.replyContent}>
        <Text style={styles.replyText}>
          Réponse à {replyUserName}
        </Text>
        <Text style={styles.replyMessage} numberOfLines={1}>
          {replyingTo.contenu || replyingTo.content || ""}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.replyCloseButton}
        onPress={onCancel}
      >
        <Ionicons
          name="close"
          size={20}
          color={themeColors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ReplyPreview;