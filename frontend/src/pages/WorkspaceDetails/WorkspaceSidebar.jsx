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
  FaCommentDots,
} from "react-icons/fa";
import "../WorkspaceDetails/WorkspaceDetails.css";
import ChannelList from "./ChannelList";
import SearchResults from "../../components/SearchResults";
import defaultIcon from "../../assets/images/icon-dark.png";

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

  // Nouvel état pour gérer les onglets actifs
  const [activeTab, setActiveTab] = useState("channels");
  // État pour suivre si des résultats de recherche sont disponibles
  const [hasSearchResults, setHasSearchResults] = useState(false);

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

  // Mise à jour du useEffect pour la gestion des résultats de recherche
  useEffect(() => {
    // Vérifier s'il y a des résultats de recherche
    const hasResults =
      searchResults &&
      ((searchResults.users && searchResults.users.length > 0) ||
        (searchResults.messages && searchResults.messages.length > 0) ||
        (searchResults.channels && searchResults.channels.length > 0));

    setHasSearchResults(hasResults);

    // Si nous avons des résultats et que l'utilisateur est en train de rechercher
    if (hasResults && isSearching && searchQuery.trim() !== "") {
      // Activer automatiquement l'onglet des utilisateurs s'il y a des utilisateurs trouvés
      if (searchResults.users && searchResults.users.length > 0) {
        setActiveTab("users");
      }
      // Sinon, activer l'onglet des messages s'il y a des messages trouvés
      else if (searchResults.messages && searchResults.messages.length > 0) {
        setActiveTab("messages");
      }
      // Ou bien activer l'onglet des canaux s'il y a des canaux trouvés
      else if (searchResults.channels && searchResults.channels.length > 0) {
        setActiveTab("channels");
      }
    }
    // Si l'utilisateur efface la recherche, revenir à l'onglet des canaux
    else if (!searchQuery.trim()) {
      setActiveTab("channels");
    }
  }, [searchResults, searchQuery, isSearching]);

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

  // Fonction modifiée pour gérer la sélection directe des messages
  // sans passer par la prévisualisation
  const handleAdaptedSelectResult = (type, item) => {
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
          process.env.REACT_APP_API_URL || "http://185.98.137.166:3001"
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
                    defaultIcon
                  })`,
                }}
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
            />
            {isSearching && <div className="search-spinner"></div>}
          </div>
        </div>
      </div>

      {/* Nouvelle section de navigation par onglets */}
      {searchQuery && searchQuery.length >= 2 && hasSearchResults && (
        <div className="sidebar-tabs">
          <div
            className={`sidebar-tab ${
              activeTab === "channels" ? "active" : ""
            }`}
            onClick={() => setActiveTab("channels")}
          >
            <FaHashtag /> Canaux{" "}
            {adaptedResults.canaux.length > 0 &&
              `(${adaptedResults.canaux.length})`}
          </div>
          {adaptedResults.utilisateurs &&
            adaptedResults.utilisateurs.length > 0 && (
              <div
                className={`sidebar-tab ${
                  activeTab === "users" ? "active" : ""
                }`}
                onClick={() => setActiveTab("users")}
              >
                <FaUser /> Utilisateurs ({adaptedResults.utilisateurs.length})
              </div>
            )}
          {adaptedResults.messages && adaptedResults.messages.length > 0 && (
            <div
              className={`sidebar-tab ${
                activeTab === "messages" ? "active" : ""
              }`}
              onClick={() => setActiveTab("messages")}
            >
              <FaComment /> Messages ({adaptedResults.messages.length})
            </div>
          )}
        </div>
      )}

      <div className="workspace-sidebar-content">
        {/* Afficher les sections en fonction de l'onglet actif */}
        {activeTab === "channels" && (
          <div className="channels-section">
            <div className="section-header" onClick={toggleChannelsVisibility}>
              {showChannels ? (
                <FaChevronDown className="toggle-icon" />
              ) : (
                <FaChevronRight className="toggle-icon" />
              )}
              <h3>Canaux</h3>
              {(currentUserRole === "owner" ||
                currentUserRole === "admin" ||
                currentUserRole === "moderator") && (
                <button
                  className="add-channel-button"
                  onClick={handleCreateChannel}
                  title="Ajouter un canal"
                >
                  <div className="add-channel-icon">
                    <FaCommentDots className="channel-icon-bg" />
                    <FaPlus className="plus-icon" />
                  </div>
                </button>
              )}
            </div>
            {showChannels && (
              <div className="channels-list-wrapper">
                {/* Si on a une recherche active et des canaux dans les résultats */}
                {searchQuery &&
                searchQuery.length >= 2 &&
                adaptedResults.canaux.length > 0 ? (
                  <ul className="channel-list">
                    {adaptedResults.canaux.map((canal) => (
                      <li
                        key={`canal-${canal.id || canal.id_canal}`}
                        className="channel-item search-result"
                        onClick={() =>
                          handleAdaptedSelectResult("channel", canal)
                        }
                      >
                        {canal.is_private ? (
                          <FaLock className="channel-icon" />
                        ) : (
                          <FaHashtag className="channel-icon" />
                        )}
                        <div className="channel-info">
                          <span className="channel-name">{canal.nom}</span>
                          {canal.description && (
                            <div className="channel-description">
                              {truncateText(canal.description, 40)}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  /* Sinon, on affiche la liste normale des canaux */                  <ChannelList
                    channels={channels}
                    canalsLoading={canalsLoading}
                    canalsError={canalsError}
                    activeChannel={activeChannel}
                    handleSelectChannel={handleSelectChannel}
                    handleChannelContextMenu={handleChannelContextMenu}
                    currentUserRole={currentUserRole}
                    searchQuery={searchQuery} // On passe la requête pour filtrer les canaux si nécessaire
                  />
                )}

                {/* Message pas de résultats pour les canaux */}
                {searchQuery &&
                  searchQuery.length >= 2 &&
                  adaptedResults.canaux.length === 0 &&
                  activeTab === "channels" && (
                    <div className="no-results">
                      <div className="info-message">
                        <FaInfoCircle /> Aucun canal trouvé pour "{searchQuery}"
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Section utilisateurs (visible uniquement si l'onglet users est actif) */}
        {activeTab === "users" &&
          adaptedResults.utilisateurs &&
          adaptedResults.utilisateurs.length > 0 && (
            <div className="users-section">
              <div className="section-header">
                <FaUser className="toggle-icon" />
                <h3>Utilisateurs</h3>
              </div>
              <ul className="channel-list">
                {adaptedResults.utilisateurs.map((user) => (
                  <li
                    key={`user-${user.id || user.id_utilisateur}`}
                    className="channel-item user-item"
                    onClick={() => handleAdaptedSelectResult("user", user)}
                  >
                    {" "}
                    {user.avatar || user.photo_de_profil ? (
                      <img
                        src={user.avatar || user.photo_de_profil}
                        alt={user.nom || user.username || "Utilisateur"}
                        className="user-avatar"
                      />
                    ) : (
                      <FaUser className="channel-icon user-icon" />
                    )}
                    <div className="channel-info">
                      <span className="channel-name">
                        {user.nom ||
                          user.username ||
                          user.name ||
                          user.prenom ||
                          user.email?.split("@")[0] ||
                          user.id_utilisateur ||
                          "Utilisateur"}
                      </span>
                      {user.email && (
                        <span className="user-email">{user.email}</span>
                      )}
                    </div>{" "}
                    {/* Indicateur de statut supprimé */}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Section messages (visible uniquement si l'onglet messages est actif) */}
        {activeTab === "messages" &&
          adaptedResults.messages &&
          adaptedResults.messages.length > 0 && (
            <div className="messages-section">
              <div className="section-header">
                <FaComment className="toggle-icon" />
                <h3>Messages</h3>
              </div>
              <ul className="channel-list">
                {adaptedResults.messages.map((message) => (
                  <li
                    key={`message-${message.id || message.id_message}`}
                    className="channel-item message-item"
                    onClick={() =>
                      handleAdaptedSelectResult("message", message)
                    }
                  >
                    <div className="message-container">
                      {/* En-tête du message avec l'utilisateur et l'icône de canal */}
                      <div className="message-header">
                        <div className="user-info">
                          {" "}
                          {message.avatar || message.photo_de_profil ? (
                            <img
                              src={message.avatar || message.photo_de_profil}
                              alt={message.nom_utilisateur}
                              className="user-avatar"
                            />
                          ) : (
                            <FaUser className="channel-icon user-icon" />
                          )}
                          <span className="user-name">
                            {message.nom_utilisateur}
                          </span>
                        </div>
                        <div className="channel-tag">
                          <FaHashtag className="channel-icon-sm" />
                          <span>{message.nom_canal}</span>
                        </div>
                      </div>

                      {/* Contenu du message */}
                      <div className="message-sidebar">
                        <p
                          className="message-text"
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(
                              truncateText(getMessageText(message.contenu), 80),
                              searchQuery
                            ),
                          }}
                        ></p>
                        <span className="message-date">
                          {formatDate(
                            message.date_creation || message.created_at
                          )}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>

      {/* Fenêtre modale d'invitation (inchangée) */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="invite-modal">
            <div className="modal-header">
              <h3>Inviter au workspace</h3>
              <button className="close-button" onClick={handleCloseInviteModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSendInvitation}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="inviteEmail">Adresse email</label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={handleInviteEmailChange}
                    placeholder="exemple@email.com"
                    className="form-control"
                  />
                </div>
                {inviteStatus.status && (
                  <div className={`invite-status ${inviteStatus.status}`}>
                    {inviteStatus.message}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseInviteModal}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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
