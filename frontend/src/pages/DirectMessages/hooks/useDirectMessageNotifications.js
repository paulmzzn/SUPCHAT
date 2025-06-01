import { useState, useEffect } from "react";

/**
 * Hook pour gérer les notifications de messages privés (DM).
 * Gère les compteurs de messages non lus par utilisateur et le total.
 *
 * @param {object} params
 * @param {object} params.socket - Instance du socket
 * @param {string} params.currentUserId - ID de l'utilisateur courant
 * @param {string} params.selectedUser - ID de l'utilisateur sélectionné (conversation ouverte)
 * @returns {object} { unreadMessageCounts, totalUnreadCount, setUnreadMessageCounts, setTotalUnreadCount }
 */
export default function useDirectMessageNotifications({
  socket,
  currentUserId,
  selectedUser,
}) {
  const [unreadMessageCounts, setUnreadMessageCounts] = useState({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Incrémente le compteur de messages non lus à la réception d'un message privé
  useEffect(() => {
    if (!socket || !currentUserId) return;
    const handlePrivateMessage = (msg) => {
      if (
        msg.fk_expediteur !== currentUserId &&
        msg.fk_destinataire === currentUserId
      ) {
        setUnreadMessageCounts((prev) => {
          const senderId = msg.fk_expediteur;
          const newCounts = {
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          };
          setTotalUnreadCount(
            Object.values(newCounts).reduce((a, b) => a + b, 0)
          );
          return newCounts;
        });
      }
    };
    socket.on("privateMessage", handlePrivateMessage);
    return () => {
      socket.off("privateMessage", handlePrivateMessage);
    };
  }, [socket, currentUserId]);

  // Remet à zéro le compteur de messages non lus quand on ouvre une conversation
  useEffect(() => {
    if (!selectedUser) return;
    setUnreadMessageCounts((prev) => {
      if (!prev[selectedUser]) return prev;
      const newCounts = { ...prev, [selectedUser]: 0 };
      setTotalUnreadCount(Object.values(newCounts).reduce((a, b) => a + b, 0));
      return newCounts;
    });
  }, [selectedUser]);

  return {
    unreadMessageCounts,
    totalUnreadCount,
    setUnreadMessageCounts,
    setTotalUnreadCount,
  };
}
