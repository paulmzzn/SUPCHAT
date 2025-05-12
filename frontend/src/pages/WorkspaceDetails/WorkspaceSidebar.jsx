import React, { useState, useRef, useEffect } from "react";
import {
  FaSearch,
  FaPlus,
  FaHashtag,
  FaLock,
  FaChevronDown,
  FaChevronRight,
  FaUserPlus,
  FaUser,
  FaComment,
  FaInfoCircle,
  FaCalendar,
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
  // Nouvelles props pour la recherche
  members,
  messages,
  searchResults,
  handleSelectSearchResult,
  isSearching,
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState({ status: "", message: "" });
  const [isInviting, setIsInviting] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchResultsRef = useRef(null);

  // Fonction pour adapter les résultats et harmoniser les noms de propriétés
  const adaptedResults = React.useMemo(() => {
    if (!searchResults) return { canaux: [], utilisateurs: [], messages: [] };

    return {
      canaux: searchResults.channels || [],
      utilisateurs: searchResults.users || [],
      messages: searchResults.messages || [],
    };
  }, [searchResults]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ouvrir les résultats si on a une recherche
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      setShowSearchResults(true);
    }
  }, [searchQuery, searchResults]);

  // Fonction pour tronquer le texte
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

  // Fonction pour extraire le texte du contenu d'un message
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

  // Fonction pour formater la date
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

  // Fonction pour adapter la sélection de résultat
  const handleAdaptedSelectResult = (type, item) => {
    // Fermer le dropdown
    setShowSearchResults(false);
    // Appeler la fonction parent
    handleSelectSearchResult(type, item);
  };

  const handleOpenInviteModal = () => {
    setShowInviteModal(true);
    setInviteEmail("");
    setInviteStatus({ status: "", message: "" });
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
  };

  const handleInviteEmailChange = (e) => {
    setInviteEmail(e.target.value);
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteStatus({
        status: "error",
        message: "Veuillez saisir une adresse email",
      });
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteStatus({
        status: "error",
        message: "Veuillez saisir une adresse email valide",
      });
      return;
    }

    setIsInviting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Vous devez être connecté pour envoyer une invitation");
      }

      // Extraire l'ID utilisateur du token JWT
      let userId = null;
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          userId = payload.id;
        }
      } catch (e) {
        console.error("Erreur lors du décodage du token:", e);
        throw new Error("Impossible de récupérer l'utilisateur");
      }

      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:3001"
        }/api/workspaces/${workspace.id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: inviteEmail,
            userId: userId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setInviteStatus({
          status: "success",
          message: "Invitation envoyée avec succès",
        });
        // Réinitialiser le formulaire après 2 secondes
        setTimeout(() => {
          setInviteEmail("");
          setInviteStatus({ status: "", message: "" });
          setShowInviteModal(false);
        }, 2000);
      } else {
        setInviteStatus({
          status: "error",
          message: data.message || "Erreur lors de l'envoi de l'invitation",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'invitation:", error);
      setInviteStatus({
        status: "error",
        message: error.message || "Une erreur est survenue",
      });
    } finally {
      setIsInviting(false);
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
                style={{
                  backgroundImage: `url(${
                    workspace.icon ||
                    "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80"
                  })`,
                }}
              ></div>
              <h2 className="workspace-name">{workspace.name}</h2>
              {/*
              {(currentUserRole === "owner" || currentUserRole === "admin") && (
                <button 
                  className="invite-button" 
                  onClick={handleOpenInviteModal}
                  title="Inviter un utilisateur"
                >
                  <FaUserPlus />
                </button>
              )}
              */}
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
              <div className="channel-actions">
                <button
                  className="add-channel-btn"
                  onClick={handleCreateChannel}
                >
                  <FaPlus />
                </button>
                {/*
                <button className="invite-channel-btn" onClick={handleOpenInviteModal}>
                  <FaUserPlus />
                </button>
                */}
              </div>
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

      {/* Modal d'invitation */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={handleCloseInviteModal}>
          <div
            className="modal-content modern"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Inviter à {workspace.name}</h2>
            <p>Envoyer une invitation par email pour rejoindre ce workspace</p>

            <form onSubmit={handleSendInvitation}>
              <div className="form-group">
                <label htmlFor="inviteEmail">Email</label>
                <input
                  type="email"
                  id="inviteEmail"
                  value={inviteEmail}
                  onChange={handleInviteEmailChange}
                  placeholder="nom@exemple.com"
                  disabled={isInviting}
                  required
                />
              </div>

              {inviteStatus.message && (
                <div className={`invitation-status ${inviteStatus.status}`}>
                  {inviteStatus.message}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseInviteModal}
                  className="cancel-btn"
                  disabled={isInviting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="send-invite-btn"
                  disabled={isInviting}
                >
                  {isInviting ? "Envoi en cours..." : "Envoyer l'invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceSidebar;
