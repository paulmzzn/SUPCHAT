import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MessageReply from './MessageReply';
import MessageContent from './MessageContent';
import MessageReactions from './MessageReactions';
import UserAvatar from './UserAvatar';

const MessageGroup = memo(({ 
  group, 
  styles, 
  themeColors, 
  currentUserId,
  messages,
  onLongPress,
  onRemoveReaction,
  onEmojiSelect,
  onOpenAttachment,
  onStrawpollVote,
  onStrawpollViewResults,
  onUserPress // Nouvelle prop pour les mentions
}) => {
  const chronologicalMessages = [...group.messages].reverse();
  
  // Si c'est un message système, utiliser un rendu spécial
  if (group.isSystem) {
    return (
      <View style={styles.systemMessageContainer}>
        {chronologicalMessages.map((message) => (
          <View key={message.id_message} style={styles.systemMessageBubble}>
            <Text style={styles.systemMessageText}>
              {message.contenu}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  
  return (
    <View style={[
      styles.messageGroupContainer,
      group.isOwn ? styles.ownMessageGroup : styles.otherMessageGroup
    ]}>
      {chronologicalMessages.map((message, index) => {
        const isFirstMessage = index === 0;
        const isLastMessage = index === chronologicalMessages.length - 1;
        
        return (
          <TouchableOpacity
            key={message.id_message}
            onLongPress={(event) => onLongPress(message, event)}
            style={[
              styles.messageContainer,
              group.isOwn ? styles.ownMessage : styles.otherMessage,
              isFirstMessage && styles.firstMessage,
              isLastMessage && styles.lastMessage,
              { marginVertical: 2 }
            ]}
          >
            {!group.isOwn && isFirstMessage && (
              <View style={styles.messageHeaderInBubble}>
                <UserAvatar 
                  user={{ nom: group.userName, photo_de_profil: group.userAvatar }}
                  style={styles.avatarInBubble}
                  placeholderStyle={styles.avatarPlaceholderInBubble}
                  textStyle={styles.avatarTextInBubble}
                />
                <View style={styles.messageHeaderInfo}>
                  <Text style={styles.messageAuthor} numberOfLines={1}>
                    {group.userName}
                  </Text>
                  <Text style={styles.messageTime}>
                    {new Date(message.date_creation).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            )}
            
            <MessageReply 
              message={message}
              messages={messages}
              styles={styles}
              themeColors={themeColors}
            />
            
            <MessageContent
              message={message}
              group={group}
              styles={styles}
              themeColors={themeColors}
              onOpenAttachment={onOpenAttachment}
              onStrawpollVote={onStrawpollVote}
              onStrawpollViewResults={onStrawpollViewResults}
              onUserPress={onUserPress}
            />
            
            {group.isOwn && isLastMessage && (
              <Text style={styles.ownMessageTime}>
                {new Date(message.date_creation).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
            
            <MessageReactions
              message={message}
              styles={styles}
              onRemoveReaction={onRemoveReaction}
              onEmojiSelect={onEmojiSelect}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

MessageGroup.displayName = 'MessageGroup';

export default MessageGroup;
