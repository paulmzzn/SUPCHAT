// Composant pour le menu contextuel des conversations
import React from "react";
import ContextMenu from "../../../../components/shared/ContextMenu";
import { createConversationContextMenu } from "../../../../utils/contextMenuUtils";

/**
 * Composant de menu contextuel pour les conversations
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element | null}
 */
const ConversationContextMenu = ({
  visible,
  xPos,
  yPos,
  userId,
  onOpenConversation,
  onDeleteConversation,
  onClose,
}) => {
  const menuItems = createConversationContextMenu({
    onOpen: () => onOpenConversation(userId),
    onDelete: () => onDeleteConversation(userId),
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

export default ConversationContextMenu;
