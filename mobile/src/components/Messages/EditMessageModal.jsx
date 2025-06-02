import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/MessagesScreen.styles";

const EditMessageModal = ({
  visible,
  message,
  editContent,
  onEditContentChange,
  onSave,
  onCancel,
  isDarkMode,
}) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  if (!visible || !message) return null;

  return (
    <View style={styles.editOverlay}>
      <View style={styles.editContainer}>
        <Text style={styles.editTitle}>Edit Message</Text>
        <TextInput
          style={styles.editInput}
          value={editContent}
          onChangeText={onEditContentChange}
          multiline
          autoFocus
          keyboardAppearance={isDarkMode ? "dark" : "light"}
        />
        <View style={styles.editButtonsContainer}>
          <TouchableOpacity
            style={[styles.editButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editButton, styles.saveButton]}
            onPress={onSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default EditMessageModal;
