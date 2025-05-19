// Composant pour le menu contextuel des conversations
import React from "react";

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
        <div
          className="dm-context-menu-item"
          onClick={() => {
            onOpenConversation(userId);
            onClose();
          }}
        >
          Ouvrir la conversation
        </div>
        <div
          className="dm-context-menu-item dm-context-menu-item-danger"
          onClick={() => {
            // Confirmation avant suppression
            if (
              window.confirm(
                "Voulez-vous vraiment supprimer cette conversation ? Les messages seront définitivement supprimés."
              )
            ) {
              onDeleteConversation(userId);
            }
            onClose();
          }}
        >
          Supprimer la conversation
        </div>
      </div>
      {/* Couche transparente pour fermer le menu */}
      <div className="dm-context-menu-overlay" onClick={onClose} />
    </>
  );
};

export default ConversationContextMenu;
