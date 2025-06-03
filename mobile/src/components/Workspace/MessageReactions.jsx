import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { getEmojiForType } from '../../utils/reactionUtils';

const MessageReactions = memo(({ message, styles, onRemoveReaction, onEmojiSelect }) => {
  if (!message.reactions || message.reactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.reactionsContainer}>
      {message.reactions.map((reaction, index) => (
        <TouchableOpacity
          key={`${reaction.reaction_type}-${index}`}
          style={[
            styles.reactionBubble,
            reaction.user_reacted && styles.userReactedBubble
          ]}
          onPress={() => {
            if (reaction.user_reacted) {
              onRemoveReaction(message, reaction.reaction_type);
            } else {
              onEmojiSelect(reaction.reaction_type);
            }
          }}
        >
          <Text style={styles.reactionEmoji}>{getEmojiForType(reaction.reaction_type)}</Text>
          <Text style={styles.reactionCount}>{reaction.count}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

MessageReactions.displayName = 'MessageReactions';

export default MessageReactions;
