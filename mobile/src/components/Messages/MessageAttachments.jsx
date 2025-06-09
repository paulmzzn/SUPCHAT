import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import env from "../../config/env";

const S3_BASE_URL = env.S3_BASE_URL || 'https://s3-supchat.s3.fr-par.scw.cloud/';
const API_URL = env.API_URL;

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "Unknown size";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

const getFileIcon = (fileType) => {
  switch (fileType) {
    case "application/pdf":
      return "document-text";
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "document";
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "calculator";
    case "application/vnd.ms-powerpoint":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "easel";
    case "application/zip":
    case "application/x-zip-compressed":
      return "archive";
    case "audio/mpeg":
    case "audio/mp3":
    case "audio/wav":
      return "musical-notes";
    case "video/mp4":
    case "video/quicktime":
      return "videocam";
    default:
      if (fileType?.startsWith("image/")) return "image";
      if (fileType?.startsWith("audio/")) return "musical-notes";
      if (fileType?.startsWith("video/")) return "videocam";
      return "document";
  }
};

const getFileURL = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("private-messages/files/") || url.startsWith("private-messages/")) {
    return `${S3_BASE_URL}${url}`;
  }
  if (url.startsWith("/api/files/")) return `${API_URL}${url}`;
  return `${API_URL}/api/files/${url}`;
};

const ImageComponent = ({ uri, style, resizeMode, fileName }) => {
  const [hasError, setHasError] = useState(false);

  return hasError ? (
    <View
      style={[
        style,
        {
          backgroundColor: "#f0f0f0",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#ddd",
          borderStyle: "dashed",
        },
      ]}
    >
      <Ionicons name="image-outline" size={32} color="#999" />
      <Text style={{ color: "#999", marginTop: 8, textAlign: "center" }}>
        Image non disponible
      </Text>
    </View>
  ) : (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
};

const MessageAttachments = ({
  attachments,
  messageId,
  onOpenAttachment,
  styles,
  themeColors,
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <View style={styles.attachmentsContainer}>
      {attachments.map((attachment, i) => {
        if (!attachment || (!attachment.url && !attachment.presignedUrl)) {
          console.warn(`Invalid attachment at index ${i}:`, attachment);
          return null;
        }

        const fileUrl = attachment.url || attachment.presignedUrl;
        const fullFileUrl = getFileURL(fileUrl);

        if (attachment.type?.startsWith("image/")) {
          return (
            <TouchableOpacity
              key={`${messageId}-attachment-${i}`}
              style={styles.imageAttachment}
              onPress={() => onOpenAttachment(attachment)}
            >
              <ImageComponent
                uri={fullFileUrl}
                style={styles.attachmentImage}
                resizeMode="cover"
                fileName={attachment.nom_fichier || "Image"}
              />
              <Text style={styles.imageCaption} numberOfLines={1}>
                {attachment.nom_fichier || "Image"}
              </Text>
            </TouchableOpacity>
          );
        } else {
          return (
            <TouchableOpacity
              key={`${messageId}-attachment-${i}`}
              style={styles.fileAttachment}
              onPress={() => onOpenAttachment(attachment)}
            >
              <View style={styles.fileIconContainer}>
                <Ionicons
                  name={getFileIcon(attachment.type)}
                  size={24}
                  color={themeColors.textPrimary}
                />
              </View>
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {attachment.nom_fichier || "Fichier"}
                </Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(attachment.taille_fichier)}
                </Text>
              </View>
              <Ionicons
                name="eye-outline"
                size={20}
                color={themeColors.accentPrimary}
              />
            </TouchableOpacity>
          );
        }
      })}
    </View>
  );
};

export default MessageAttachments;
