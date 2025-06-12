// Hook pour gérer les réactions (emoji) sur les messages privés
import { useState, useCallback, useRef, useEffect } from "react";

export function useMessageReactions({
  socket,
  messageContextMenu,
  setMessages,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const emojiPickerRef = useRef(null);

  // Ouvre le sélecteur d'emoji à la bonne position
  const handleAddReaction = useCallback(() => {
    if (!messageContextMenu?.yPos || !messageContextMenu?.xPos) return;
    setShowEmojiPicker(true);
    setEmojiPickerPosition({
      top: messageContextMenu.yPos,
      left: messageContextMenu.xPos,
    });
  }, [messageContextMenu]);

  // Envoie la réaction au backend
  const handleEmojiSelect = useCallback(
    (emoji) => {
      if (!socket || !messageContextMenu?.messageId) return;
      socket.emit("addPrivateMessageReaction", {
        id: messageContextMenu.messageId,
        reaction: emoji,
      });
      setShowEmojiPicker(false);
    },
    [socket, messageContextMenu]
  );
  // Supprime une réaction
  const handleRemoveReaction = useCallback(
    (messageId, reactionType) => {
      if (!socket || !messageId || !reactionType) return;
      socket.emit("removePrivateMessageReaction", {
        id: messageId,
        reaction: reactionType,
      });

      // Optimistic UI update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id_message_prive === messageId
            ? {
                ...msg,
                reactions: (msg.reactions || []).filter(
                  (r) => r.reaction_type !== reactionType
                ),
              }
            : msg
        )
      );
    },
    [socket, setMessages]
  );

  // Ferme le picker si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  // Handler pour la réception d'une réaction sur un message privé
  useEffect(() => {
    if (!socket) return;
    const handlePrivateMessageReaction = (data) => {
      if (data?.messageId && data?.reactions) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id_message_prive === data.messageId
              ? { ...msg, reactions: data.reactions }
              : msg
          )
        );
      }
    };
    socket.on("privateMessageReaction", handlePrivateMessageReaction);
    return () => {
      socket.off("privateMessageReaction", handlePrivateMessageReaction);
    };
  }, [socket, setMessages]);

  return {
    showEmojiPicker,
    setShowEmojiPicker,
    emojiPickerPosition,
    setEmojiPickerPosition,
    emojiPickerRef,
    handleAddReaction,
    handleEmojiSelect,
    handleRemoveReaction,
  };
}
