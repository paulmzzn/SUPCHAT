// Composant pour le menu contextuel des messages
import React from "react";
import { FaReply, FaRegSmile, FaEdit, FaTrashAlt } from "react-icons/fa";

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
        {/* Bouton Répondre toujours en premier */}
        <div
          className="dm-context-menu-item"
          tabIndex={0}
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof onReply === "function") {
              onReply();
            }
            if (typeof onClose === "function") {
              onClose();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (typeof onReply === "function") {
                onReply();
              }
              if (typeof onClose === "function") {
                onClose();
              }
            }
          }}
        >
          <FaReply className="dm-context-menu-icon" /> Répondre
        </div>
        {isOwnMessage && (
          <>
            <div
              className="dm-context-menu-item"
              onClick={() => {
                onEdit && onEdit(message);
                onClose();
              }}
            >
              <FaEdit className="dm-context-menu-icon" /> Modifier
            </div>
            <div
              className="dm-context-menu-item"
              onClick={() => {
                onDelete && onDelete(message);
                onClose();
              }}
            >
              <FaTrashAlt className="dm-context-menu-icon" /> Supprimer
            </div>
          </>
        )}
        <div className="dm-context-menu-item" onClick={onAddReaction}>
          <FaRegSmile className="dm-context-menu-icon" /> Ajouter une réaction
        </div>
      </div>

      {/* Couche transparente pour fermer le menu */}
      <div className="dm-context-menu-overlay" onClick={onClose} />
    </>
  );
};

export default MessageContextMenu;
