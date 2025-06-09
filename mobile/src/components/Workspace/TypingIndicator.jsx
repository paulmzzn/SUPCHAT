import React, { memo } from 'react';
import { View, Text } from 'react-native';

const TypingIndicator = memo(({ typingUsers, styles }) => {
  if (typingUsers.length === 0) return null;
  
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingDots}>
        <View style={[styles.typingDot, styles.typingDot1]} />
        <View style={[styles.typingDot, styles.typingDot2]} />
        <View style={[styles.typingDot, styles.typingDot3]} />
      </View>
      <Text style={styles.typingText}>
        {typingUsers.length === 1 
          ? `${typingUsers[0]} est en train d'écrire...`
          : `${typingUsers.length} personnes écrivent...`
        }
      </Text>
    </View>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;
