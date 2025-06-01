// Composant pour afficher la liste des conversations
import React from "react";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import Spinner from "../../../../components/Spinner/Spinner";

/**
 * Composant affichant la liste des conversations
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element}
 */
const ConversationList = ({
  conversations = [],
  usersInfo = {},
  selectedUser = null,
  loading = false,
  error = null,
  unreadMessageCounts = {},
  searchQuery = "",
  setSearchQuery = () => {},
  onUserSelect = () => {},
  onOpenNewConversation = () => {},
  onConversationContextMenu = () => {},
}) => {
  // Vérification défensive des entrées pour éviter des erreurs
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const safeUsersInfo =
    usersInfo && typeof usersInfo === "object" ? usersInfo : {};
  const safeSearch = typeof searchQuery === "string" ? searchQuery : "";

  // Filtrer les conversations en fonction de la recherche
  const filteredConversations = safeSearch.trim()
    ? safeConversations.filter((userId) => {
        const user = safeUsersInfo[userId] || {};
        const username = user.name || "";
        return username.toLowerCase().includes(safeSearch.toLowerCase());
      })
    : safeConversations;

  return (
    <div className="dm-sidebar">
      <div className="dm-sidebar-header">
        <h3 className="dm-title">Messages privés</h3>

        <div className="dm-search">
          <div className="dm-search-input-wrapper">
            <FaSearch className="dm-search-icon" />
            <input
              type="text"
              placeholder="Rechercher des conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dm-search-input"
            />
          </div>
        </div>

        {/* Bouton nouvelle conversation */}
        <button
          className="dm-new-conversation-button"
          onClick={onOpenNewConversation}
        >
          Démarrer une conversation
        </button>
      </div>

      {error && <div className="dm-error">{error}</div>}

      <ul className="dm-conv-list">
        {loading ? (
          <li className="dm-empty">
            <div className="loading-container">
              <Spinner size="small" />
              <span className="loading-text">
                Chargement des conversations...
              </span>
            </div>
          </li>
        ) : filteredConversations.length === 0 ? (
          <li className="dm-empty">
            {searchQuery ? "Aucun résultat" : "Aucune conversation"}
          </li>
        ) : (
          filteredConversations.map((userId) => {
            const user = usersInfo[userId] || {};
            const unreadCount = unreadMessageCounts[userId] || 0;

            return (
              <li
                key={userId}
                className={`dm-conv-item ${
                  selectedUser === userId ? "active" : ""
                }`}
                onClick={() => onUserSelect(userId)}
                onContextMenu={(e) => onConversationContextMenu(e, userId)}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User"}
                    className="dm-avatar"
                  />
                ) : (
                  <div className="dm-avatar">
                    <div className="dm-avatar-placeholder">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                  </div>
                )}
                <span className="dm-username">
                  {user.name || "Utilisateur"}
                </span>
                {unreadCount > 0 && (
                  <span className="dm-unread-badge">{unreadCount}</span>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default ConversationList;
