import { useEffect } from "react";

export const useSocketMessages = ({
  socket,
  currentUserId,
  userId,
  messages,
  setMessages,
  addAnimatingMessage,
  scrollToBottom,
  saveConversationTimestamp,
}) => {
  useEffect(() => {
    if (!socket || !currentUserId || !userId) return;

    const handlePrivateMessage = async (msg) => {
      console.log("Received message:", msg);

      if (msg.fk_expediteur === userId || msg.fk_destinataire === userId) {
        const isNewMessage = !messages.some(
          (m) =>
            m.id_message_prive === msg.id_message_prive ||
            (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`) ||
            (m.isOptimistic &&
              m.fk_expediteur === msg.fk_expediteur &&
              Math.abs(new Date(m.date_envoi).getTime() - new Date(msg.date_envoi).getTime()) < 10000)
        );

        if (isNewMessage) {
          const messageId = msg.id_message_prive || `temp-${Date.now()}`;
          addAnimatingMessage(messageId);
        }

        setMessages((prev) => {
          const messageExists = prev.some(
            (m) =>
              m.id_message_prive === msg.id_message_prive ||
              (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`) ||
              (m.isOptimistic && m.fk_expediteur === msg.fk_expediteur && 
               Math.abs(new Date(m.date_envoi).getTime() - new Date(msg.date_envoi).getTime()) < 10000)
          );

          if (messageExists) {
            return prev.map((m) => {
              if (m.id_message_prive === msg.id_message_prive) return msg;
              if (msg.tempId && m.id_message_prive === `temp-${msg.tempId}`) return msg;
              if (
                m.isOptimistic &&
                m.fk_expediteur === msg.fk_expediteur &&
                Math.abs(new Date(m.date_envoi).getTime() - new Date(msg.date_envoi).getTime()) < 10000
              ) return msg;
              if (
                m.isOptimistic &&
                m.isFileUpload &&
                m.fk_expediteur === msg.fk_expediteur &&
                msg.attachments &&
                msg.attachments.length > 0 &&
                Math.abs(new Date(m.date_envoi).getTime() - new Date(msg.date_envoi).getTime()) < 30000
              ) return msg;
              return m;
            });
          } else {
            const hasOptimisticUpload = prev.some(
              (m) =>
                m.isOptimistic &&
                m.isFileUpload &&
                m.fk_expediteur === msg.fk_expediteur &&
                msg.attachments &&
                msg.attachments.length > 0 &&
                Math.abs(new Date(m.date_envoi).getTime() - new Date(msg.date_envoi).getTime()) < 30000
            );

            if (hasOptimisticUpload) {
              return prev.map((m) => {
                if (
                  m.isOptimistic &&
                  m.isFileUpload &&
                  m.fk_expediteur === msg.fk_expediteur &&
                  msg.attachments &&
                  msg.attachments.length > 0 &&
                  Math.abs(new Date(m.date_envoi).getTime() - new Date(msg.date_envoi).getTime()) < 30000
                ) {
                  return msg;
                }
                return m;
              });
            } else {
              return [...prev, msg];
            }
          }
        });

        setTimeout(() => {
          scrollToBottom(true);
        }, 50);

        await saveConversationTimestamp(userId);
      }
    };

    const handlePrivateMessageUpdated = (msg) => {
      console.log("Message updated:", msg);
      if (msg.fk_expediteur === userId || msg.fk_destinataire === userId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === msg.id_message_prive ? msg : m
          )
        );
      }
    };

    const handlePrivateMessageDeleted = (data) => {
      console.log("Message deleted:", data);
      if (data?.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === data.id
              ? {
                  ...m,
                  is_deleted: true,
                  contenu: "[Message deleted]",
                  attachments: [],
                }
              : m
          )
        );
      }
    };

    const handlePrivateMessageReaction = (data) => {
      console.log("Message reaction received:", data);
      if (data?.messageId && data?.reactions) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id_message_prive === data.messageId
              ? { ...m, reactions: data.reactions }
              : m
          )
        );
      }
    };

    socket.on("privateMessage", handlePrivateMessage);
    socket.on("privateMessageUpdated", handlePrivateMessageUpdated);
    socket.on("privateMessageDeleted", handlePrivateMessageDeleted);
    socket.on("privateMessageReaction", handlePrivateMessageReaction);

    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("privateMessageUpdated", handlePrivateMessageUpdated);
      socket.off("privateMessageDeleted", handlePrivateMessageDeleted);
      socket.off("privateMessageReaction", handlePrivateMessageReaction);
    };
  }, [socket, userId, currentUserId, messages]);
};
