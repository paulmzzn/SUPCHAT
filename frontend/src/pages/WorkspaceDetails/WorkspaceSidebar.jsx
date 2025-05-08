import React, { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaPlus,
  FaHashtag,
  FaChevronDown,
  FaChevronRight,
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

  // Adapter le format des résultats de l'API au format attendu par le composant SearchResults
  const adaptedResults = searchResults
    ? {
        channels:
          searchResults.canaux?.map((canal) => ({
            ...canal,
            id: canal.id_canal,
            nom: canal.nom, // Correction: conserver le nom original de la propriété
          })) || [],
        users:
          searchResults.utilisateurs?.map((user) => ({
            ...user,
            id: user.id_utilisateur,
            nom: user.nom, // Correction: conserver le nom original de la propriété
          })) || [],
        messages:
          searchResults.messages?.map((message) => ({
            ...message,
            id: message.id_message,
            nom_utilisateur: message.nom_utilisateur || "Utilisateur inconnu", // Correction: utiliser le nom réel
            nom_canal: message.nom_canal || "Canal inconnu", // Correction: utiliser le nom réel du canal
            date_creation: message.date_creation || message.created_at, // Correction: utiliser la date correcte
          })) || [],
      }
    : { channels: [], users: [], messages: [] };

  // Gère la sélection d'un résultat de recherche avec adaptation des clés
  const handleAdaptedSelectResult = (type, item) => {
    const adaptedItem = { ...item };

    // Fermer les résultats de recherche
    setShowSearchResults(false);

    // Appeler le handler parent
    if (handleSelectSearchResult) {
      handleSelectSearchResult(type, adaptedItem);
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

          {/* Dropdown des résultats de recherche avec le nouveau composant */}
          {showSearchResults && (
            <div className="search-results-dropdown" ref={searchResultsRef}>
              <SearchResults
                searchQuery={searchQuery}
                searchResults={adaptedResults}
                workspace={workspace}
                isSearching={isSearching}
                handleSelectSearchResult={handleAdaptedSelectResult}
              />
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
