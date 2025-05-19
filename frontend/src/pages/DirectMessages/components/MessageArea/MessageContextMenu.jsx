// Composant pour le menu contextuel des messages
import React from "react";
import { FaReply, FaRegSmile } from "react-icons/fa";

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
  onReply,
  onEdit,
  onDelete,
  onAddReaction,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <>
      <div
        className="dm-context-menu"
        style={{
          top: yPos,
          left: xPos,
        }}
      >
        {isOwnMessage ? (
          <>
            <div className="dm-context-menu-item" onClick={onEdit}>
              Modifier
            </div>
            <div className="dm-context-menu-item" onClick={onDelete}>
              Supprimer
            </div>
            <div className="dm-context-menu-item" onClick={onReply}>
              <FaReply className="dm-context-menu-icon" /> Répondre
            </div>
            <div className="dm-context-menu-item" onClick={onAddReaction}>
              <FaRegSmile className="dm-context-menu-icon" /> Ajouter une
              réaction
            </div>
          </>
        ) : (
          <>
            <div className="dm-context-menu-item" onClick={onReply}>
              <FaReply className="dm-context-menu-icon" /> Répondre
            </div>
            <div className="dm-context-menu-item" onClick={onAddReaction}>
              <FaRegSmile className="dm-context-menu-icon" /> Ajouter une
              réaction
            </div>
          </>
        )}
      </div>

      {/* Couche transparente pour fermer le menu */}
      <div className="dm-context-menu-overlay" onClick={onClose} />
    </>
  );
};

export default MessageContextMenu;
