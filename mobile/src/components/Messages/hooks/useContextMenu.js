import { useState, useCallback } from "react";

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    message: null,
    position: { x: 0, y: 0 },
    isOwnMessage: false,
  });

  const openContextMenu = useCallback((message, event, currentUserId) => {
    const isOwnMessage = message.fk_expediteur === currentUserId;
    const pageX = event.pageX || 0;
    const pageY = event.pageY || 0;

    setContextMenu({
      visible: true,
      message: message,
      position: { x: pageX, y: pageY },
      isOwnMessage,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      message: null,
      position: { x: 0, y: 0 },
      isOwnMessage: false,
    });
  }, []);

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
};
