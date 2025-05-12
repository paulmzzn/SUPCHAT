import React, { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaPlus,
  FaHashtag,
  FaChevronDown,
  FaChevronRight,
  FaUser,
  FaComment,
  FaCalendar,
  FaInfoCircle,
  FaLock,
} from "react-icons/fa";
import "../WorkspaceDetails/WorkspaceDetails.css";
import ChannelList from "./ChannelList";
import SearchResults from "../../components/SearchResults";

function WorkspaceSidebar({
  workspace,
  searchQuery,
  handleSearchChange,
  showChannels,
  toggleChannelsVisibility,
  channels,
  canalsLoading,
  canalsError,
  activeChannel,
  handleSelectChannel,
  handleChannelContextMenu,
  currentUserRole,
  handleCreateChannel,
  // Nouveaux props pour la recherche unifiée
  searchResults,
  handleSelectSearchResult,
  isSearching,
}) {
  // État pour gérer l'affichage des résultats de recherche
  const [showSearchResults, setShowSearchResults] = useState(false);
  // Référence pour le dropdown des résultats
  const searchResultsRef = useRef(null);

  // Effet pour montrer/cacher les résultats de recherche
  useEffect(() => {
    if (searchQuery) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Effet pour fermer les résultats au clic ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target) &&
        !event.target.classList.contains("search-input")
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debug: vérifier les résultats de recherche reçus
  useEffect(() => {
    if (searchResults) {
      console.log("Résultats de recherche reçus:", searchResults);
    }
  }, [searchResults]);

  // Fonctions utilitaires pour l'affichage des résultats
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

  const truncateText = (text, maxLength = 30) => {
    if (!text) return "";
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

  const getMessageText = (content) => {
    if (!content) return "";
    if (
      typeof content === "string" &&
      !content.startsWith("{") &&
      !content.startsWith("[")
    ) {
      return content;
    }

    try {
      const parsed =
        typeof content === "string" ? JSON.parse(content) : content;
      if (parsed.type === "text") {
        return parsed.text || "";
      } else if (parsed.type === "file") {
        return `[Fichier: ${parsed.fileName || "Sans nom"}]`;
      } else {
        return (
          parsed.text ||
          parsed.content ||
          parsed.message ||
          JSON.stringify(parsed)
        );
      }
    } catch (e) {
      return content;
    }
  };

  const highlightSearchTerm = (text, term) => {
    if (!text || !term) return text;
    try {
      const regex = new RegExp(`(${term})`, "gi");
      return text.replace(regex, "<mark>$1</mark>");
    } catch (e) {
      return text;
    }
  };

  // Adapter le format des résultats de l'API au format attendu par l'affichage
  const adaptedResults = searchResults
    ? {
        canaux: searchResults.canaux || [],
        utilisateurs: searchResults.utilisateurs || [],
        messages: searchResults.messages || [],
      }
    : { canaux: [], utilisateurs: [], messages: [] };

  // Gère la sélection d'un résultat de recherche
  const handleAdaptedSelectResult = (type, item) => {
    // Fermer les résultats de recherche
    setShowSearchResults(false);

    // Appeler le handler parent
    if (handleSelectSearchResult) {
      handleSelectSearchResult(type, item);
    }
  };

  return (
    <div className="workspace-sidebar">
      <div className="workspace-sidebar-header">
        <div className="workspace-profile">
          {workspace && (
            <>
              <div
                className="workspace-avatar"
                style={{ backgroundImage: `url(${workspace.icon})` }}
              ></div>
              <h2 className="workspace-name">{workspace.name}</h2>
            </>
          )}
        </div>
        <div className="workspace-search">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher dans ce workspace..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
              onFocus={() => searchQuery && setShowSearchResults(true)}
            />
            {isSearching && <div className="search-spinner"></div>}
          </div>

          {/* Dropdown des résultats de recherche */}
          {showSearchResults && searchQuery && (
            <div className="search-results-dropdown" ref={searchResultsRef}>
              <div className="search-results">
                {workspace && (
                  <div className="search-workspace-header">
                    <h3>Recherche dans {workspace.name}</h3>
                    <div className="search-query-info">
                      Résultats pour : <span>"{searchQuery}"</span>
                    </div>
                  </div>
                )}

                <div className="search-results-content">
                  {/* Section canaux */}
                  {adaptedResults.canaux &&
                    adaptedResults.canaux.length > 0 && (
                      <div className="search-results-section">
                        <div className="search-results-header">
                          <FaHashtag /> Canaux ({adaptedResults.canaux.length})
                        </div>
                        <ul className="search-results-list">
                          {adaptedResults.canaux.map((canal) => (
                            <li
                              key={`canal-${canal.id || canal.id_canal}`}
                              className="search-result-item"
                              onClick={() =>
                                handleAdaptedSelectResult("channel", canal)
                              }
                            >
                              {canal.is_private ? (
                                <FaLock className="result-icon" />
                              ) : (
                                <FaHashtag className="result-icon" />
                              )}
                              <span>{canal.nom}</span>
                              {canal.description && (
                                <div className="channel-description">
                                  {truncateText(canal.description, 40)}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Section utilisateurs */}
                  {adaptedResults.utilisateurs &&
                    adaptedResults.utilisateurs.length > 0 && (
                      <div className="search-results-section">
                        <div className="search-results-header">
                          <FaUser /> Utilisateurs (
                          {adaptedResults.utilisateurs.length})
                        </div>
                        <ul className="search-results-list">
                          {adaptedResults.utilisateurs.map((user) => (
                            <li
                              key={`user-${user.id || user.id_utilisateur}`}
                              className="search-result-item"
                              onClick={() =>
                                handleAdaptedSelectResult("user", user)
                              }
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
                                  <span className="user-email">
                                    {user.email}
                                  </span>
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
                  {adaptedResults.messages &&
                    adaptedResults.messages.length > 0 && (
                      <div className="search-results-section">
                        <div className="search-results-header">
                          <FaComment /> Messages (
                          {adaptedResults.messages.length})
                        </div>
                        <ul className="search-results-list messages-list">
                          {adaptedResults.messages.map((message) => (
                            <li
                              key={`message-${
                                message.id || message.id_message
                              }`}
                              className="search-result-item message-result"
                              onClick={() =>
                                handleAdaptedSelectResult("message", message)
                              }
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
                                      message.date_creation ||
                                        message.created_at
                                    )}
                                  </span>
                                </div>
                                <p
                                  className="message-preview"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightSearchTerm(
                                      truncateText(
                                        getMessageText(message.contenu),
                                        80
                                      ),
                                      searchQuery
                                    ),
                                  }}
                                ></p>
                              </div>
                              <div className="message-channel">
                                <FaHashtag className="result-icon" />
                                <span className="channel-name">
                                  {message.nom_canal}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Message si aucun résultat ou erreur */}
                  {(!adaptedResults.canaux ||
                    adaptedResults.canaux.length === 0) &&
                    (!adaptedResults.utilisateurs ||
                      adaptedResults.utilisateurs.length === 0) &&
                    (!adaptedResults.messages ||
                      adaptedResults.messages.length === 0) && (
                      <div className="no-results">
                        {!searchQuery || searchQuery.length < 2 ? (
                          <div className="info-message">
                            <FaInfoCircle /> Entrez au moins 2 caractères pour
                            lancer la recherche
                          </div>
                        ) : isSearching ? (
                          <div className="info-message">
                            Recherche en cours...
                          </div>
                        ) : searchResults?.error ? (
                          <div className="error-message">
                            <FaInfoCircle /> {searchResults.error}
                          </div>
                        ) : (
                          <div className="info-message">
                            <FaInfoCircle /> Aucun résultat trouvé pour "
                            {searchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="workspace-sidebar-content">
        <div className="channels-section">
          <div className="section-header" onClick={toggleChannelsVisibility}>
            {showChannels ? (
              <FaChevronDown className="toggle-icon" />
            ) : (
              <FaChevronRight className="toggle-icon" />
            )}
            <h3>Canaux</h3>
            {(currentUserRole === "owner" || currentUserRole === "admin") && (
              <button className="add-channel-btn" onClick={handleCreateChannel}>
                <FaPlus />
              </button>
            )}
          </div>
          {showChannels && (
            <ChannelList
              channels={channels}
              canalsLoading={canalsLoading}
              canalsError={canalsError}
              activeChannel={activeChannel}
              handleSelectChannel={handleSelectChannel}
              handleChannelContextMenu={handleChannelContextMenu}
              currentUserRole={currentUserRole}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkspaceSidebar;
