import React from "react";
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/ConversationsListScreen.styles";

const SearchBar = ({ searchQuery, onSearchChange }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  return (
    <View style={styles.searchContainer}>
      <Ionicons
        name="search"
        size={20}
        color={themeColors.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search conversations..."
        placeholderTextColor={themeColors.textPlaceholder}
        value={searchQuery}
        onChangeText={onSearchChange}
      />
    </View>
  );
};

export default SearchBar;
