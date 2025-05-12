import React from "react";
import {
  FaHashtag,
  FaLock,
  FaUser,
  FaComment,
  FaInfoCircle,
  FaCalendar,
  FaFile,
} from "react-icons/fa";
import "../pages/WorkspaceDetails/WorkspaceDetails.css";

const SearchResults = ({
  searchQuery,
  searchResults,
  workspace,
  isSearching,
  handleSelectSearchResult,
}) => {
  // Fonction pour obtenir la date formatée d'un message
  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fonction pour tronquer le texte
  const truncateText = (text, maxLength = 30) => {
    if (!text) return "";
    // Traiter les objets ou tableaux JSON sous forme de chaîne
    if (typeof text === "object") {
      try {
        text = JSON.stringify(text);
      } catch (e) {
        text = "Contenu non textuel";
      }
    }
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Fonction pour extraire le texte du contenu d'un message qui pourrait être du JSON
  const getMessageText = (content) => {
    if (!content) return "";

    // Si le contenu est déjà une chaîne et ne ressemble pas à du JSON
    if (
      typeof content === "string" &&
      !content.startsWith("{") &&
      !content.startsWith("[")
    ) {
      return content;
    }

    try {
      // Si c'est une chaîne JSON, on essaie de la parser
      const parsed =
        typeof content === "string" ? JSON.parse(content) : content;

      // Si c'est un message de type texte
      if (parsed.type === "text") {
        return parsed.text || "";
      }
      // Si c'est un fichier
      else if (parsed.type === "file") {
        return `[Fichier: ${parsed.fileName || "Sans nom"}]`;
      }
      // Si c'est un autre type de contenu structuré
      else {
        return (
          parsed.text ||
          parsed.content ||
          parsed.message ||
          JSON.stringify(parsed)
        );
      }
    } catch (e) {
      // Si ce n'est pas du JSON valide, on retourne le contenu tel quel
      return content;
    }
  };

  // Fonction pour mettre en surbrillance les termes recherchés
  const highlightSearchTerm = (text, term) => {
    if (!text || !term) return text;

    try {
      const regex = new RegExp(`(${term})`, "gi");
      return text.replace(regex, "<mark>$1</mark>");
    } catch (e) {
      return text;
    }
  };

  return (
    <div className="search-results">
      {workspace && (
        <div className="search-workspace-header">
          <h3>Recherche dans {workspace.name}</h3>
          {searchQuery && (
            <div className="search-query-info">
              Résultats pour : <span>"{searchQuery}"</span>
            </div>
          )}
        </div>
      )}

      <div className="search-results-content">
        {/* Section canaux */}
        {searchResults?.channels && searchResults.channels.length > 0 && (
          <div className="search-results-section">
            <div className="search-results-header">
              <FaHashtag /> Canaux ({searchResults.channels.length})
            </div>
            <ul className="search-results-list">
              {searchResults.channels.map((channel) => (
                <li
                  key={`channel-${channel.id || channel.id_canal}`}
                  className="search-result-item"
                  onClick={() => handleSelectSearchResult("channel", channel)}
                >
                  {channel.is_private ? (
                    <FaLock className="result-icon" />
                  ) : (
                    <FaHashtag className="result-icon" />
                  )}
                  <span>{channel.nom}</span>
                  {channel.description && (
                    <div className="channel-description">
                      {truncateText(channel.description, 40)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section utilisateurs */}
        {searchResults?.users && searchResults.users.length > 0 && (
          <div className="search-results-section">
            <div className="search-results-header">
              <FaUser /> Utilisateurs ({searchResults.users.length})
            </div>
            <ul className="search-results-list">
              {searchResults.users.map((user) => (
                <li
                  key={`user-${user.id || user.id_utilisateur}`}
                  className="search-result-item"
                  onClick={() => handleSelectSearchResult("user", user)}
                >
                  <div className="user-result-content">
                    {user.photo_de_profil ? (
                      <img
                        src={user.photo_de_profil}
                        alt={user.nom}
                        className="user-profile-pic"
                      />
                    ) : (
                      <FaUser className="result-icon" />
                    )}
                    <span className="user-name">{user.nom}</span>
                    {user.email && (
                      <span className="user-email">{user.email}</span>
                    )}
                    {user.status && (
                      <div
                        className={`status-indicator ${user.status.toLowerCase()}`}
                        title={user.status}
                      ></div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section messages */}
        {searchResults?.messages && searchResults.messages.length > 0 && (
          <div className="search-results-section">
            <div className="search-results-header">
              <FaComment /> Messages ({searchResults.messages.length})
            </div>
            <ul className="search-results-list messages-list">
              {searchResults.messages.map((message) => (
                <li
                  key={`message-${message.id || message.id_message}`}
                  className="search-result-item message-result"
                  onClick={() => handleSelectSearchResult("message", message)}
                >
                  <div className="message-result-content">
                    <div className="message-header">
                      <div className="message-user-info">
                        {message.photo_de_profil ? (
                          <img
                            src={message.photo_de_profil}
                            alt={message.nom_utilisateur}
                            className="message-user-avatar"
                          />
                        ) : (
                          <FaUser className="message-user-icon" />
                        )}
                        <strong>{message.nom_utilisateur}</strong>
                      </div>
                      <span className="message-date">
                        <FaCalendar className="date-icon" />
                        {formatDate(
                          message.date_creation || message.created_at
                        )}
                      </span>
                    </div>
                    <p
                      className="message-preview"
                      dangerouslySetInnerHTML={{
                        __html: highlightSearchTerm(
                          truncateText(getMessageText(message.contenu), 80),
                          searchQuery
                        ),
                      }}
                    ></p>
                  </div>
                  <div className="message-channel">
                    <FaHashtag className="result-icon" />
                    <span className="channel-name">{message.nom_canal}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Message si aucun résultat ou erreur */}
        {(!searchResults?.channels || searchResults.channels.length === 0) &&
          (!searchResults?.users || searchResults.users.length === 0) &&
          (!searchResults?.messages || searchResults.messages.length === 0) && (
            <div className="no-results">
              {!searchQuery || searchQuery.length < 2 ? (
                <div className="info-message">
                  <FaInfoCircle /> Entrez au moins 2 caractères pour lancer la
                  recherche
                </div>
              ) : isSearching ? (
                <div className="info-message">Recherche en cours...</div>
              ) : searchResults?.error ? (
                <div className="error-message">
                  <FaInfoCircle /> {searchResults.error}
                </div>
              ) : (
                <div className="info-message">
                  <FaInfoCircle /> Aucun résultat trouvé pour "{searchQuery}"
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default SearchResults;
