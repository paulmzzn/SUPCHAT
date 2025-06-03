import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { getEmojiForType } from "../../utils/reactionUtils";

const MessageReactions = ({
  reactions,
  messageId,
  onRemoveReaction,
  socket,
  setMessages,
  styles,
}) => {
  if (!reactions || reactions.length === 0) return null;

  const handleReactionPress = (reaction) => {
    if (reaction.user_reacted) {
      onRemoveReaction(messageId, reaction.reaction_type);
    } else {
      socket.emit("addPrivateMessageReaction", {
        id: messageId,
        reaction: reaction.reaction_type,
      });

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id_message_prive === messageId) {
            const updatedReactions = m.reactions.map((r) =>
              r.reaction_type === reaction.reaction_type
                ? {
                    ...r,
                    count: r.count + 1,
                    user_reacted: true,
                  }
                : r
            );
            return { ...m, reactions: updatedReactions };
          }
          return m;
        })
      );
    }
  };

  return (
    <View style={styles.reactionsContainer}>
      {reactions.map((reaction, index) => (
        <TouchableOpacity
          key={`${messageId}-reaction-${index}`}
          style={[
            styles.reactionBubble,
            reaction.user_reacted && styles.userReactedBubble,
          ]}
          onPress={() => handleReactionPress(reaction)}
        >
          <Text style={styles.reactionEmoji}>
            {getEmojiForType(reaction.reaction_type)}
          </Text>
          <Text style={styles.reactionCount}>
            {reaction.count}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default MessageReactions;
