// Composant pour le menu contextuel des messages
import React from "react";
import ContextMenu from "../../../../components/shared/ContextMenu";
import { createMessageContextMenu } from "../../../../utils/contextMenuUtils";

/**
 * Menu contextuel pour les actions sur un message
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element | null}
 */
const MessageContextMenu = ({
  visible,
  xPos,
  yPos,
  isOwnMessage,
  message,
  onReply,
  onEdit,
  onDelete,
  onAddReaction,
  onClose,
}) => {
  const menuItems = createMessageContextMenu({
    onReply: () => onReply && onReply(),
    onEdit: () => onEdit && onEdit(message),
    onDelete: () => onDelete && onDelete(message),
    onAddReaction: () => onAddReaction && onAddReaction(),
    isOwnMessage,
  });

  return (
    <ContextMenu
      visible={visible}
      x={xPos}
      y={yPos}
      items={menuItems}
      onClose={onClose}
      className="dm-context-menu"
    />
  );
};

export default MessageContextMenu;
