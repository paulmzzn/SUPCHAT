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
    if (!socket || !currentUserId || !userId) {
      return;
    }

    const handlePrivateMessage = async (msg) => {

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
        });        setTimeout(() => {
          scrollToBottom(true);
        }, 50);

        // Marquer comme lu si c'est un message reçu (envoyé par l'utilisateur avec qui on discute vers nous)
        if (msg.fk_expediteur === userId && msg.fk_destinataire === currentUserId) {
          console.log("📖 [useSocketMessages] Marquage automatique du message comme lu:", msg.id_message_prive);
          socket.emit("readPrivateMessage", {
            id: msg.id_message_prive,
          }, (response) => {
            if (response && !response.ok) {
              console.error("❌ [useSocketMessages] Erreur lors de l'envoi de l'accusé de lecture:", response.message);
            } else {
              console.log("✅ [useSocketMessages] Message marqué comme lu avec succès");
              
              // Forcer le rafraîchissement des compteurs immédiatement
              setTimeout(() => {
                console.log("🔄 [useSocketMessages] Rafraîchissement forcé des compteurs");
                if (global.AppEvents) {
                  global.AppEvents.emit('forceUnreadCountsUpdate', {
                    timestamp: Date.now(),
                    source: 'useSocketMessages-autoRead',
                    messageId: msg.id_message_prive,
                    userId: userId
                  });
                }
              }, 200); // Délai pour s'assurer que le backend a traité la requête
            }
          });
        }

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

    // Handler pour les statuts de lecture en temps réel
    const handlePrivateMessageRead = ({ id, date_lecture }) => {
      console.log("Message marked as read:", { id, date_lecture });
      setMessages((prev) =>
        prev.map((m) =>
          m.id_message_prive === id ? { ...m, date_lecture } : m
        )
      );
    };

    // Handler pour tous les messages marqués comme lus d'un coup
    const handleAllMessagesRead = ({ readBy, count, timestamp }) => {
      console.log("All messages marked as read:", { readBy, count, timestamp });
      setMessages((prev) =>
        prev.map((m) => {
          // Marquer comme lu tous les messages envoyés par l'utilisateur actuel au destinataire
          if (m.fk_expediteur === currentUserId && m.fk_destinataire === readBy && !m.date_lecture) {
            return { ...m, date_lecture: timestamp };
          }
          return m;
        })
      );
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
    socket.on("privateMessageRead", handlePrivateMessageRead);
    socket.on("allMessagesRead", handleAllMessagesRead);

    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("privateMessageUpdated", handlePrivateMessageUpdated);
      socket.off("privateMessageDeleted", handlePrivateMessageDeleted);
      socket.off("privateMessageReaction", handlePrivateMessageReaction);
      socket.off("privateMessageRead", handlePrivateMessageRead);
      socket.off("allMessagesRead", handleAllMessagesRead);
    };
  }, [socket, userId, currentUserId, messages]); // Remise de messages pour éviter stale closures
};
