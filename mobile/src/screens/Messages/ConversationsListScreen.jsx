import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getStyles } from "./ConversationsListScreen.styles";
import { useTheme } from "../../theme/ThemeContext";
import SearchBar from "../../components/Messages/SearchBar";
import ConversationsList from "../../components/Messages/ConversationsList";

const ConversationsListScreen = ({ navigation }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity
            style={styles.newConversationHeaderButton}
            onPress={() => navigation.navigate("NewConversation")}
          >
            <Ionicons name="add" size={24} color={themeColors.textOnAccent} />
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <ConversationsList navigation={navigation} searchQuery={searchQuery} />
    </View>
  );
};

export default ConversationsListScreen;
