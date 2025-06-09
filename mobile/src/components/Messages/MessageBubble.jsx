import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { getStyles } from "../../screens/Messages/MessagesScreen.styles";
import MessageAttachments from "./MessageAttachments";
import MessageReactions from "./MessageReactions";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000003";

const formatMessageDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const MessageBubble = ({
  message,
  isOwn,
  isAnimating,
  isLastOwnMessage,
  currentUserId,
  userInfo,
  onLongPress,
  onOpenAttachment,
  onRemoveReaction,
  socket,
  setMessages,
}) => {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);

  const isSystemMessage = message.fk_expediteur === SYSTEM_USER_ID;

  if (isSystemMessage) {
    return (
      <View style={styles.systemMessageContainer}>
        <View style={styles.systemMessageBubble}>
          <Text style={styles.systemMessageText}>
            {message.contenu}
          </Text>
        </View>
      </View>
    );
  }

  const renderMessageReply = () => {
    if (!message.reply_data && !message.replyTo) return null;

    const replyData = message.reply_data || {
      reply_content: message.replyContent || "Message d'origine non disponible",
      reply_user_id: message.replyTo,
    };

    const isReplyFromSender = replyData.reply_user_id === currentUserId;
    const replyText = isReplyFromSender ? "vous" : userInfo?.name || "Utilisateur";

    return (
      <View
        style={[
          styles.messageReplyContainer,
          { borderLeftColor: isOwn ? "#8E8E8E" : themeColors.accentPrimary },
        ]}
      >
        <Text style={[styles.messageReplyText, isOwn && { color: "#FFFFFF" }]}>
          Réponse à {replyText}
        </Text>
        <Text
          style={[
            styles.messageReplyContent,
            { color: isOwn ? "#FFFFFF" : "rgba(0, 0, 0, 0.7)" },
          ]}
          numberOfLines={2}
        >
          {replyData.reply_content}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.messageWrapper,
        isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper,
        isAnimating && styles.animatingMessage,
      ]}
      onLongPress={(event) => onLongPress(message, event.nativeEvent)}
      delayLongPress={500}
      activeOpacity={0.9}
    >
      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {renderMessageReply()}

        <Text
          style={
            isOwn ? styles.ownMessageText : styles.otherMessageText
          }
        >
          {message.contenu}
        </Text>

        <MessageAttachments
          attachments={message.attachments}
          messageId={message.id_message_prive}
          onOpenAttachment={onOpenAttachment}
          styles={styles}
          themeColors={themeColors}
        />

        <MessageReactions
          reactions={message.reactions}
          messageId={message.id_message_prive}
          onRemoveReaction={onRemoveReaction}
          socket={socket}
          setMessages={setMessages}
          styles={styles}
        />

        <View style={styles.messageInfoContainer}>
          <Text
            style={
              isOwn ? styles.ownMessageTime : styles.otherMessageTime
            }
          >
            {formatMessageDate(message.date_creation || message.date_envoi)}
          </Text>
          {isOwn && isLastOwnMessage && (
            <View style={styles.readStatusInBubble}>
              {message.date_lecture ? (
                <>
                  <MaterialIcons
                    name="done-all"
                    size={14}
                    color={themeColors.accentPrimary}
                  />
                  <Text style={styles.readStatusText}>Lu</Text>
                </>
              ) : (
                <>
                  <MaterialIcons
                    name="done"
                    size={14}
                    color={
                      isOwn
                        ? "rgba(255, 255, 255, 0.7)"
                        : "rgba(0, 0, 0, 0.6)"
                    }
                  />
                  <Text style={styles.sentStatusText}>Envoyé</Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MessageBubble;
