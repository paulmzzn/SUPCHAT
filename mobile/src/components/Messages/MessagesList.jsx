import React, { useRef } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/MessagesScreen.styles";
import MessageBubble from "./MessageBubble";

const MessagesList = ({
  messages,
  currentUserId,
  userInfo,
  animatingMessages,
  loadingMoreMessages,
  hasMoreMessages,
  isInitialLoad,
  onScroll,
  onLongPress,
  onOpenAttachment,
  onRemoveReaction,
  onReply,
  socket,
  setMessages,
  scrollRef,
  onScrollToBottom,
}) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const swipeableRefs = useRef({});

  const onSwipeableWillOpen = (message) => {
    onReply(message);
    setTimeout(() => {
      if (swipeableRefs.current[message.id_message_prive]) {
        swipeableRefs.current[message.id_message_prive].close();
      }
    }, 100);
  };

  const renderRightActions = (message) => {
    return (
      <RectButton style={styles.replyAction} onPress={() => onReply(message)}>
        <Ionicons
          name="arrow-undo-outline"
          size={22}
          style={styles.replyActionIcon}
        />
        <Text style={styles.replyActionText}>Répondre</Text>
      </RectButton>
    );
  };

  const renderLeftActions = (message) => {
    return (
      <RectButton style={styles.replyAction} onPress={() => onReply(message)}>
        <Ionicons
          name="arrow-undo-outline"
          size={22}
          style={styles.replyActionIcon}
        />
        <Text style={styles.replyActionText}>Répondre</Text>
      </RectButton>
    );
  };

  return (
    <ScrollView
      style={styles.messagesContainer}
      ref={scrollRef}
      onContentSizeChange={() => !loadingMoreMessages && onScrollToBottom(false)}
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {loadingMoreMessages && (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={themeColors.accentPrimary} />
          <Text style={styles.loadingMoreText}>Loading older messages...</Text>
        </View>
      )}

      {!hasMoreMessages && messages.length > 0 && (
        <View style={styles.noMoreMessagesContainer}>
          <Text style={styles.noMoreMessagesText}>Beginning of conversation</Text>
        </View>
      )}

      {messages.length === 0 ? (
        <View style={styles.emptyMessages}>
          <Text style={styles.emptyMessagesText}>No messages yet</Text>
          <Text style={styles.emptyMessagesSubtext}>Start the conversation!</Text>
        </View>
      ) : (
        messages.map((msg, index) => {
          const isOwn = msg.fk_expediteur === currentUserId;
          const isAnimating = animatingMessages[msg.id_message_prive];

          const isLastOwnMessage =
            isOwn &&
            messages
              .slice(index + 1)
              .findIndex((m) => m.fk_expediteur === currentUserId) === -1;

          return (
            <Swipeable
              key={msg.id_message_prive || `temp-${Date.now()}-${Math.random()}`}
              renderRightActions={() => (isOwn ? renderRightActions(msg) : null)}
              renderLeftActions={() => (!isOwn ? renderLeftActions(msg) : null)}
              friction={2}
              overshootRight={false}
              overshootLeft={false}
              rightThreshold={40}
              leftThreshold={40}
              ref={(ref) => {
                if (ref) {
                  swipeableRefs.current[msg.id_message_prive] = ref;
                }
              }}
              onSwipeableWillOpen={() => onSwipeableWillOpen(msg)}
            >
              <MessageBubble
                message={msg}
                isOwn={isOwn}
                isAnimating={isAnimating}
                isLastOwnMessage={isLastOwnMessage}
                currentUserId={currentUserId}
                userInfo={userInfo}
                onLongPress={onLongPress}
                onOpenAttachment={onOpenAttachment}
                onRemoveReaction={onRemoveReaction}
                socket={socket}
                setMessages={setMessages}
              />
            </Swipeable>
          );
        })
      )}
    </ScrollView>
  );
};

export default MessagesList;
