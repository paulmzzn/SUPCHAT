// Composant pour sélectionner des emojis
import React from "react";

/**
 * Sélecteur d'emojis simple
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element | null}
 */
const EmojiPicker = ({ show, position, onSelect, pickerRef }) => {
  if (!show) return null;

  // Liste d'emojis prédéfinie
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "👏", "🎉", "🔥", "✅"];

  return (
    <div
      className="dm-emoji-picker"
      style={{
        top: position.top,
        left: position.left,
      }}
      ref={pickerRef}
    >
      <div className="dm-emoji-grid">
        {emojis.map((emoji) => (
          <div
            key={emoji}
            className="dm-emoji-item"
            onClick={() => onSelect(emoji)}
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
