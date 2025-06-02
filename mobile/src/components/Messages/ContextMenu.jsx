import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/MessagesScreen.styles";

const ContextMenu = ({
  visible,
  message,
  position,
  isOwnMessage,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onAddReaction,
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
      <View
        style={[
          styles.contextMenu,
          {
            top: position.y - (isOwnMessage ? 200 : 150),
            left: Math.min(
              position.x - 100,
              Dimensions.get("window").width - 230
            ),
          },
        ]}
      >
        {isOwnMessage ? (
          <>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={onReply}
            >
              <Ionicons
                name="arrow-undo-outline"
                size={20}
                color={themeColors.textPrimary}
              />
              <Text style={styles.contextMenuItemText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={onEdit}
            >
              <Ionicons
                name="pencil"
                size={20}
                color={themeColors.textPrimary}
              />
              <Text style={styles.contextMenuItemText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={onAddReaction}
            >
              <Ionicons
                name="happy-outline"
                size={20}
                color={themeColors.textPrimary}
              />
              <Text style={styles.contextMenuItemText}>React</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contextMenuItem, styles.deleteMenuItem]}
              onPress={onDelete}
            >
              <Ionicons name="trash-outline" size={20} color="red" />
              <Text
                style={[styles.contextMenuItemText, { color: "red" }]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={onReply}
            >
              <Ionicons
                name="arrow-undo-outline"
                size={20}
                color={themeColors.textPrimary}
              />
              <Text style={styles.contextMenuItemText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={onAddReaction}
            >
              <Ionicons
                name="happy-outline"
                size={20}
                color={themeColors.textPrimary}
              />
              <Text style={styles.contextMenuItemText}>React</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ContextMenu;
