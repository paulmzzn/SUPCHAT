import React from "react";
import { TouchableOpacity, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/ConversationsListScreen.styles";

const ConversationContextMenu = ({
  visible,
  position,
  userId,
  fadeAnim,
  scaleAnim,
  onClose,
  onOpenConversation,
  onDeleteConversation,
}) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.contextMenuOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <Animated.View
        style={[
          styles.modernContextMenu,
          {
            top: position.y,
            left: position.x,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.contextMenuItem}
          onPress={() => {
            onClose();
            onOpenConversation(userId);
          }}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={themeColors.textPrimary}
          />
          <Text style={styles.contextMenuItemText}>Ouvrir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contextMenuItem, styles.deleteMenuItem]}
          onPress={() => onDeleteConversation(userId)}
        >
          <Ionicons name="trash-outline" size={20} color="red" />
          <Text style={[styles.contextMenuItemText, { color: "red" }]}>
            Supprimer
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default ConversationContextMenu;
