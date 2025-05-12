import React, { useState } from "react";
import { FaSearch, FaPlus, FaHashtag, FaLock, FaChevronDown, FaChevronRight, FaUserPlus } from "react-icons/fa";
import "../WorkspaceDetails/WorkspaceDetails.css";
import ChannelList from "./ChannelList";

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
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState({ status: "", message: "" });
  const [isInviting, setIsInviting] = useState(false);

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
        message: "Veuillez saisir une adresse email"
      });
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteStatus({
        status: "error",
        message: "Veuillez saisir une adresse email valide"
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
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          userId = payload.id;
        }
      } catch (e) {
        console.error("Erreur lors du décodage du token:", e);
        throw new Error("Impossible de récupérer l'utilisateur");
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/workspaces/${workspace.id}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            email: inviteEmail,
            userId: userId
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setInviteStatus({
          status: "success",
          message: "Invitation envoyée avec succès"
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
          message: data.message || "Erreur lors de l'envoi de l'invitation"
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'invitation:", error);
      setInviteStatus({
        status: "error",
        message: error.message || "Une erreur est survenue"
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
                style={{ backgroundImage: `url(${workspace.icon || "https://images.unsplash.com/photo-1611162616475-46b635cb6868?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80"})` }}
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
              placeholder="Rechercher des canaux..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
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
                <button className="add-channel-btn" onClick={handleCreateChannel}>
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
          <div className="modal-content modern" onClick={e => e.stopPropagation()}>
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
