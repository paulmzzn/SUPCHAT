// Composant pour la modale de nouvelle conversation
import React from "react";
import { FaSearch, FaTimes, FaUserCircle } from "react-icons/fa";

/**
 * Modale pour créer une nouvelle conversation
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element | null}
 */
const NewConversationModal = ({
  show,
  onClose,
  searchQuery,
  setSearchQuery,
  filteredUsers,
  loadingUsers,
  onStartConversation,
}) => {
  if (!show) return null;

  return (
    <div className="dm-modal-overlay">
      <div className="dm-modal">
        <div className="dm-modal-header">
          <h3>Nouvelle conversation</h3>
          <button className="dm-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="dm-modal-body">
          <div className="dm-search-input-wrapper modal">
            <FaSearch className="dm-search-icon" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dm-search-input"
              autoFocus
            />
          </div>

          <div className="dm-users-list">
            {loadingUsers ? (
              <div className="dm-loading-users">
                Chargement des utilisateurs...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="dm-no-users">Aucun utilisateur trouvé</div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id_utilisateur}
                  className="dm-user-item"
                  onClick={() => onStartConversation(user.id_utilisateur)}
                >
                  {user.photo_de_profil ? (
                    <img
                      src={user.photo_de_profil}
                      alt={user.nom}
                      className="dm-avatar"
                    />
                  ) : (
                    <div className="dm-avatar">
                      <FaUserCircle className="dm-avatar-placeholder" />
                    </div>
                  )}
                  <span className="dm-username">
                    {user.nom ||
                      `Utilisateur ${user.id_utilisateur.substring(0, 6)}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
