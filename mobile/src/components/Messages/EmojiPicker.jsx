import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/MessagesScreen.styles";

const EmojiPicker = ({ visible, onClose, onEmojiSelect }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  // Utiliser les mêmes noms de réaction que le web
  const emojiReactions = [
    { name: "thumbsUp", emoji: "👍" },
    { name: "heart", emoji: "❤️" },
    { name: "laugh", emoji: "😂" },
    { name: "surprise", emoji: "😮" },
    { name: "sad", emoji: "😢" },
    { name: "angry", emoji: "😡" },
  ];

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.emojiPickerOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.emojiPicker}>
        <ScrollView horizontal style={styles.emojiScrollView}>
          {emojiReactions.map((reaction) => (
            <TouchableOpacity
              key={reaction.name}
              style={styles.emojiButton}
              onPress={() => onEmojiSelect(reaction.name)} // Envoyer le nom au lieu de l'emoji
            >
              <Text style={styles.emojiText}>{reaction.emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </TouchableOpacity>
  );
};

export default EmojiPicker;
