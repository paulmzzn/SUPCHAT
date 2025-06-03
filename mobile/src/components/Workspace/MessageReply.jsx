import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const MessageReply = memo(({ message, messages, styles, themeColors }) => {
  if (!message.reply_to && !message.parent_id) {
    return null;
  }

  const getReplyUserName = () => {
    if (message.reply_to_user_name) {
      return `Réponse à ${message.reply_to_user_name}`;
    }
    if (message.parent_message && message.parent_message.nom) {
      return `Réponse à ${message.parent_message.nom}`;
    }
    const parentId = message.reply_to || message.parent_id;
    const parentMessage = messages.find(m => m.id_message === parentId);
    if (parentMessage && parentMessage.nom) {
      return `Réponse à ${parentMessage.nom}`;
    }
    return "Réponse à un message";
  };

  const getReplyContent = () => {
    if (message.reply_to_content) {
      return message.reply_to_content;
    }
    if (message.parent_message && message.parent_message.contenu) {
      return message.parent_message.contenu;
    }
    const parentId = message.reply_to || message.parent_id;
    const parentMessage = messages.find(m => m.id_message === parentId);
    if (parentMessage && parentMessage.contenu) {
      return parentMessage.contenu;
    }
    return "Message original non disponible";
  };

  return (
    <View style={styles.messageReplyContainer}>
      <View style={styles.replyIndicator} />
      <TouchableOpacity
        style={styles.replyContent}
        onPress={() => {
          // TODO: Implémenter le scroll vers le message parent
        }}
      >
        <Ionicons name="return-down-forward-outline" size={12} color={themeColors.textMuted} />
        <Text style={styles.messageReplyText}>
          {getReplyUserName()}
        </Text>
      </TouchableOpacity>
      <Text style={styles.messageReplyContent} numberOfLines={2}>
        {getReplyContent()}
      </Text>
    </View>
  );
});

MessageReply.displayName = 'MessageReply';

export default MessageReply;
