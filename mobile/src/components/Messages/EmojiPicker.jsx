import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/MessagesScreen.styles";

const EmojiPicker = ({ visible, onClose, onEmojiSelect }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const emojis = [
    "👍",
    "👎",
    "❤️",
    "😂",
    "😮",
    "😢",
    "😡",
    "🎉",
    "👏",
    "🤔",
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
          {emojis.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiButton}
              onPress={() => onEmojiSelect(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </TouchableOpacity>
  );
};

export default EmojiPicker;
