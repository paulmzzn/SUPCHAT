// Composant pour l'édition d'un message
import React from "react";

/**
 * Éditeur pour modifier un message existant
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element}
 */
const MessageEditor = ({ content, setContent, onSave, onCancel }) => {
  return (
    <div className="dm-edit-container">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="dm-edit-textarea"
        autoFocus
      />
      <div className="dm-edit-actions">
        <button
          onClick={onSave}
          className="dm-edit-save"
          disabled={!content.trim()}
        >
          Enregistrer
        </button>
        <button onClick={onCancel} className="dm-edit-cancel">
          Annuler
        </button>
      </div>
    </div>
  );
};

export default MessageEditor;
