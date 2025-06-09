// Hook pour la gestion du menu contextuel sur les messages
import { useCallback, useState } from "react";

export function useMessageContextMenu(currentUserId) {
  const [messageContextMenu, setMessageContextMenu] = useState({
    visible: false,
    xPos: 0,
    yPos: 0,
    messageId: null,
    isOwnMessage: false,
    message: null,
  });

  const handleMessageContextMenu = useCallback(
    (e, message) => {
      e.preventDefault();
      setMessageContextMenu({
        visible: true,
        xPos: e.clientX,
        yPos: e.clientY,
        messageId: message.id_message_prive,
        isOwnMessage: message.fk_expediteur === currentUserId,
        message,
      });
    },
    [currentUserId]
  );

  const handleCloseMessageContextMenu = useCallback(() => {
    setMessageContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    messageContextMenu,
    handleMessageContextMenu,
    handleCloseMessageContextMenu,
    setMessageContextMenu,
  };
}
