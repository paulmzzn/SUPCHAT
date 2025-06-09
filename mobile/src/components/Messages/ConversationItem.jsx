import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/ConversationsListScreen.styles";

const ConversationItem = ({
  userId,
  user,
  unreadCount,
  isPending,
  lastMessage,
  onPress,
  onLongPress,
}) => {
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

  const formatLastMessage = () => {
    if (!lastMessage) return "Aucun message récent";

    const message = lastMessage.contenu || "";

    if (!message.trim()) {
      return "Message vide";
    }

    if (message.length > 30) {
      return message.substring(0, 27) + "...";
    }

    return message;
  };

  return (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        isPending && styles.newConversation,
      ]}
      onPress={() => onPress(userId)}
      onLongPress={(event) => onLongPress(userId, event)}
      delayLongPress={500}
      data-user-id={userId}
    >
      {renderAvatar(user)}
      <View style={styles.conversationInfo}>
        <Text style={styles.userName}>
          {user?.name || "Loading..."}
        </Text>
        <Text
          style={[
            styles.lastMessage,
            unreadCount > 0 && styles.unreadLastMessage,
            lastMessage?.isNew && styles.newLastMessage,
          ]}
          numberOfLines={1}
        >
          {formatLastMessage()}
        </Text>
      </View>
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ConversationItem;
