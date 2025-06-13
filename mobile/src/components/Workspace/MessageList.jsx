import React, { memo, useRef, useMemo, useCallback } from 'react';
import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import MessageGroup from './MessageGroup';

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000003";
const SYSTEM_USERNAME = "Système";

const MessageList = memo(({
  messages,
  styles,
  themeColors,
  currentUserId,
  hasMoreMessages,
  loadingMore,
  onLoadMore,
  onLongPress,
  onRemoveReaction,
  onEmojiSelect,
  onOpenAttachment,
  onStrawpollVote,
  onStrawpollViewResults,
  onUserPress, // Handler pour les clics sur les mentions d'utilisateurs
  onChannelPress // Handler pour les clics sur les mentions de canaux
}) => {
  const flatListRef = useRef(null);

  const groupedMessages = useMemo(() => {
    const grouped = [];
    let currentGroup = null;

    messages.forEach((message) => {
      const isSystemMessage = message.fk_utilisateur === SYSTEM_USER_ID ||
        message.nom === SYSTEM_USERNAME ||
        message.is_system_message === true;

      if (isSystemMessage) {
        grouped.push({
          id: message.id_message,
          userId: SYSTEM_USER_ID,
          userName: SYSTEM_USERNAME,
          messages: [message],
          lastMessageTime: new Date(message.date_creation),
          isOwn: false,
          isSystem: true
        });
        currentGroup = null;
      } else {
        const messageDate = new Date(message.date_creation);
        const shouldGroup = currentGroup &&
          currentGroup.userId === message.fk_utilisateur &&
          !currentGroup.isSystem &&
          (messageDate - currentGroup.lastMessageTime) < 5 * 60 * 1000;

        if (shouldGroup) {
          currentGroup.messages.push(message);
          currentGroup.lastMessageTime = messageDate;
        } else {
          currentGroup = {
            id: message.id_message,
            userId: message.fk_utilisateur,
            userName: message.nom,
            userAvatar: message.photo_de_profil,
            messages: [message],
            lastMessageTime: messageDate,
            isOwn: message.fk_utilisateur === currentUserId,
            isSystem: false
          };
          grouped.push(currentGroup);
        }
      }
    });

    return grouped;
  }, [messages, currentUserId]);

  const renderMessageGroup = useCallback(({ item: group }) => {
    return (
      <MessageGroup
        group={group}
        styles={styles}
        themeColors={themeColors}
        currentUserId={currentUserId}
        messages={messages}
        onLongPress={onLongPress}
        onRemoveReaction={onRemoveReaction}
        onEmojiSelect={onEmojiSelect}
        onOpenAttachment={onOpenAttachment}
        onStrawpollVote={onStrawpollVote}
        onStrawpollViewResults={onStrawpollViewResults}
        onUserPress={onUserPress}
        onChannelPress={onChannelPress}
      />
    );
  }, [styles, themeColors, currentUserId, messages, onLongPress, onRemoveReaction, onEmojiSelect, onOpenAttachment, onStrawpollVote, onStrawpollViewResults, onUserPress, onChannelPress]);

  const renderListFooter = useCallback(() => {
    if (!hasMoreMessages && messages.length > 0) {
      return (
        <View style={styles.endOfMessagesContainer}>
          <Text style={styles.endOfMessagesText}>Début de la conversation</Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={themeColors.accentPrimary} />
          <Text style={styles.loadingMoreText}>Chargement...</Text>
        </View>
      );
    }

    return null;
  }, [hasMoreMessages, loadingMore, messages.length, styles, themeColors]);

  const keyExtractorGroup = useCallback((item) => item.id.toString(), []);

  return (
    <FlatList
      ref={flatListRef}
      data={groupedMessages}
      renderItem={renderMessageGroup}
      keyExtractor={keyExtractorGroup}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={true}
      inverted={true}
      removeClippedSubviews={true}
      maxToRenderPerBatch={8}
      windowSize={8}
      initialNumToRender={12}
      ListFooterComponent={renderListFooter}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.2}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 5,
      }}
    />
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
