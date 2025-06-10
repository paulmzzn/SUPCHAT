import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/MessagesScreen.styles";

const ChatHeader = ({ userInfo, onGoBack }) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const renderAvatar = (user) => {
    if (!user) return <View style={styles.avatar} />;

    if (user.avatar) {
      return (
        <Image
          source={{ uri: user.avatar }}
          style={styles.avatar}
          onError={(e) => {
            console.log("Avatar image failed to load, using placeholder");
          }}
        />
      );
    } else {
      return (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user.name ? user.name[0].toUpperCase() : "U"}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.chatHeader}>
      <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={themeColors.textPrimary}
        />
      </TouchableOpacity>

      <View style={styles.chatHeaderInfo}>
        {renderAvatar(userInfo)}
        <Text style={styles.chatHeaderName}>
          {userInfo?.name || "User"}
        </Text>
      </View>
    </View>
  );
};

export default ChatHeader;
