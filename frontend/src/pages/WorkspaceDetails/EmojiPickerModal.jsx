import React from "react";

function EmojiPickerModal({
  commonEmojis,
  handleAddReaction,
  setShowEmojiPicker,
}) {
  return (
    <div className="modal-overlay" onClick={() => setShowEmojiPicker(false)}>
      <div className="emoji-picker-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Choisissez une réaction</h3>
        <div className="emoji-grid">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji.name}
              className="emoji-button"
              onClick={() => handleAddReaction(emoji.name)}
              title={emoji.name}
            >
              {emoji.label}
            </button>
          ))}
        </div>
        <div className="emoji-picker-actions">
          <button className="cancel-btn" onClick={() => setShowEmojiPicker(false)}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmojiPickerModal;
