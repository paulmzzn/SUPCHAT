// Composant pour les suggestions de mentions d'utilisateurs
import React from "react";

/**
 * Affiche une liste de suggestions d'utilisateurs pour les mentions
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element}
 */
const MentionSuggestions = ({ suggestions, activeIndex, onSelect }) => {
  return (
    <div className="dm-mention-suggestions">
      {suggestions.map((user, index) => (
        <div
          key={user.id || user.id_utilisateur}
          className={`dm-mention-suggestion ${
            index === activeIndex ? "active" : ""
          }`}
          onClick={() => onSelect(user)}
        >
          {user.avatar || user.photo_de_profil ? (
            <img
              src={user.avatar || user.photo_de_profil}
              alt={user.name || user.nom}
              className="dm-mention-avatar"
            />
          ) : (
            <div className="dm-mention-avatar-placeholder">
              {(user.name || user.nom || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="dm-mention-name">{user.name || user.nom}</span>
        </div>
      ))}
    </div>
  );
};

export default MentionSuggestions;
