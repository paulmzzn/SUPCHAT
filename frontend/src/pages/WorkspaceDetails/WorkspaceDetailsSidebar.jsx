import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronRight, FaUserCircle, FaArrowUp, FaArrowDown, FaDownload, FaFilePdf, FaFileWord, FaFileExcel, FaFileAlt, FaCircle, FaClock, FaTimesCircle, FaRegMoon, FaUserPlus } from "react-icons/fa";
import { useSocket } from "../../context/SocketContext";
import { API_URL } from "../../config/config";

// Drapeau pour activer/désactiver les logs de débogage (mettre à false pour désactiver tous les logs)
const DEBUG_LOGGING = false;
const isProd = process.env.NODE_ENV === 'production';

// Fonction utilitaire pour logger uniquement en développement ou si DEBUG_LOGGING est activé
const debugLog = (message, ...args) => {
  if (!isProd && DEBUG_LOGGING) {
    console.log(message, ...args);
  }
};

function WorkspaceDetailsSidebar({
  showMembers,
  showOnlineMembers,
  showOfflineMembers,
  showFiles,
  showImages,
  members,
  files,
  images,
  currentUserRole,
  currentUserId,
  handleOpenProfile,
  handleMemberContextMenu,
  memberContextMenu,
  handleChangeMemberRole,
  toggleMembers,
  toggleOnlineMembers,
  toggleOfflineMembers,
  toggleFiles,
  toggleImages,
  getRoleIcon,
  formatMessageDate,
  handleDownloadFile,
  S3_BASE_URL,
  handleOpenFileViewer,
  workspace
}) {
  const { userStatuses, setUserStatus } = useSocket();
  
  // States for invitation functionality
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState({ status: "", message: "" });
  const [isInviting, setIsInviting] = useState(false);

  // Handlers for invitation
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
        `${API_URL}/api/workspaces/${workspace.id}/invite`,
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

  // Log pour le débogage - s'exécute à chaque rendu mais uniquement si DEBUG_LOGGING est activé
  useEffect(() => {
    debugLog("[SIDEBAR] Statuts utilisateurs reçus:", userStatuses);
    debugLog("[SIDEBAR] Nombre de membres en ligne:", members.online.length);
    debugLog("[SIDEBAR] Nombre de membres hors ligne:", members.offline.length);
  }, [userStatuses, members]);

  const renderStatusIndicator = (member) => {
    // Récupération du statut depuis le contexte WebSocket avec fallback sur le statut du membre
    const realTimeStatus = userStatuses[member.id];
    const status = realTimeStatus || member.status;

    // On supprime ce log qui est appelé pour chaque membre et qui cause le flood
    // debugLog(`[SIDEBAR] Indicateur de statut pour ${member.name}: ${status} (from WS: ${realTimeStatus || 'non'})`);

    // Utiliser une couleur différente pour les indicateurs de statut selon la source
    const baseClasses = {
      'online': "status-indicator online",
      'away': "status-indicator away",
      'dnd': "status-indicator dnd",
      'invisible': "status-indicator offline",
      'offline': "status-indicator offline"
    };

    const iconComponent = {
      'online': <FaCircle />,
      'away': <FaClock />,
      'dnd': <FaTimesCircle />,
      'invisible': <FaRegMoon />,
      'offline': <FaRegMoon />
    };

    const titles = {
      'online': "En ligne",
      'away': "Absent",
      'dnd': "Ne pas déranger",
      'invisible': "Invisible",
      'offline': "Hors ligne"
    };

    const statusKey = status in baseClasses ? status : 'offline';

    return (
      <span 
        className={baseClasses[statusKey]} 
        title={titles[statusKey]}
        data-source={realTimeStatus ? "websocket" : "default"}
      >
        {iconComponent[statusKey]}
      </span>
    );
  };

  const handleCurrentUserContextMenu = (e, member, isCurrentUser) => {
    if (!isCurrentUser) {
      handleMemberContextMenu(e, member);
      return;
    }

    e.preventDefault();

    const statusMenu = document.createElement('div');
    statusMenu.className = 'status-context-menu';
    statusMenu.style.position = 'absolute';
    statusMenu.style.top = `${e.pageY}px`;
    statusMenu.style.left = `${e.pageX}px`;
    statusMenu.style.zIndex = '2000';
    statusMenu.style.background = 'rgba(40, 40, 45, 0.98)';
    statusMenu.style.borderRadius = '8px';
    statusMenu.style.padding = '8px 0';
    statusMenu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    statusMenu.style.border = '1px solid rgba(255, 255, 255, 0.1)';

    const statuses = [
      { id: 'online', label: 'En ligne', icon: FaCircle, color: '#44b700' },
      { id: 'away', label: 'Absent', icon: FaClock, color: '#ffc107' },
      { id: 'dnd', label: 'Ne pas déranger', icon: FaTimesCircle, color: '#f44336' },
      { id: 'invisible', label: 'Invisible', icon: FaRegMoon, color: '#9e9e9e' }
    ];

    statuses.forEach(status => {
      const option = document.createElement('div');
      option.style.padding = '8px 16px';
      option.style.display = 'flex';
      option.style.alignItems = 'center';
      option.style.gap = '10px';
      option.style.cursor = 'pointer';
      option.style.color = 'white';

      const icon = document.createElement('span');
      icon.style.color = status.color;
      icon.innerHTML = `<svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor"><path d="${getIconPath(status.id)}"></path></svg>`;

      const text = document.createElement('span');
      text.textContent = status.label;

      option.appendChild(icon);
      option.appendChild(text);

      option.addEventListener('click', () => {
        const success = setUserStatus(status.id);
        debugLog(`[SIDEBAR] Changement de statut envoyé: ${status.id}, succès: ${success}`);
        document.body.removeChild(statusMenu);
      });

      option.addEventListener('mouseover', () => {
        option.style.backgroundColor = 'rgba(147, 72, 183, 0.15)';
      });

      option.addEventListener('mouseout', () => {
        option.style.backgroundColor = 'transparent';
      });

      statusMenu.appendChild(option);
    });

    document.body.appendChild(statusMenu);

    const handleClickOutside = () => {
      if (document.body.contains(statusMenu)) {
        document.body.removeChild(statusMenu);
      }
      document.removeEventListener('click', handleClickOutside);
    };

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  };

  const getIconPath = (status) => {
    switch (status) {
      case 'online':
        return "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8z";
      case 'away':
        return "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z";
      case 'dnd':
        return "M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm101.8-262.2L295.6 256l62.2 62.2c4.7 4.7 4.7 12.3 0 17l-22.6 22.6c-4.7 4.7-12.3 4.7-17 0L256 295.6l-62.2 62.2c-4.7 4.7-12.3 4.7-17 0l-22.6-22.6c-4.7-4.7-4.7-12.3 0-17l62.2-62.2-62.2-62.2c-4.7-4.7-4.7-12.3 0-17l22.6-22.6c4.7-4.7 12.3-4.7 17 0l62.2 62.2 62.2-62.2c4.7-4.7 12.3-4.7 17 0l22.6 22.6c4.7 4.7 4.7 12.3 0 17z";
      case 'invisible':
      default:
        return "M248 12.8c-137 0-248 111-248 248s111 248 248 248 248-111 248-248-111-248-248-248zm0 48c110.5 0 200 89.5 200 200s-89.5 200-200 200-200-89.5-200-200 89.5-200 200-200zm0 304c-57.9 0-105.9-43.1-113.8-99.2 9.1 1.2 18.4 1.9 27.8 1.9 105.8 0 192-86.2 192-192 0-9.4-.7-18.7-1.9-27.8 56.2 7.9 99.2 55.9 99.2 113.8 0 62.8-51.2 114-114.3 114z";
    }
  };

  return (
    <div className="details-sidebar">
      {/* Add invite button in the top-right corner */}
      {(currentUserRole === "owner" || currentUserRole === "admin") && (
        <button 
          className="invite-button-sidebar"
          onClick={handleOpenInviteModal}
          title="Inviter un utilisateur"
        >
          <FaUserPlus />
        </button>
      )}

      <div className="details-section">
        <div className="section-header" onClick={toggleMembers}>
          {showMembers ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
          <h3>Membres ({members.online.length + members.offline.length})</h3>
        </div>
        {showMembers && (
          <div className="members-container">
            <div className="members-subsection">
              <div className="subsection-header" onClick={toggleOnlineMembers}>
                {showOnlineMembers ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
                <h4>En ligne ({members.online.length})</h4>
              </div>
              {showOnlineMembers && (
                <ul className="members-list">
                  {members.online.map((member) => {
                    const isCurrentUser = member.id === currentUserId;
                    return (
                      <li
                        key={member.id}
                        className={`member-item online ${isCurrentUser ? 'current-user' : ''}`}
                        onClick={() => handleOpenProfile(member)}
                        onContextMenu={(e) => handleCurrentUserContextMenu(e, member, isCurrentUser)}
                        style={{
                          cursor: isCurrentUser ? 'context-menu' :
                            (currentUserRole === "owner" && member.role !== "owner") ?
                              "context-menu" : "pointer",
                          backgroundColor: isCurrentUser ? 'rgba(147, 72, 183, 0.1)' : 'transparent'
                        }}
                      >
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="member-avatar" />
                        ) : (
                          <FaUserCircle className="member-avatar-placeholder" />
                        )}
                        <div className="member-info">
                          {getRoleIcon(member.role)}
                          <span className="member-name">
                            {member.name}
                            {isCurrentUser ? " (vous)" : ""}
                          </span>
                        </div>
                        {renderStatusIndicator(member)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="members-subsection">
              <div className="subsection-header" onClick={toggleOfflineMembers}>
                {showOfflineMembers ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
                <h4>Hors ligne ({members.offline.length})</h4>
              </div>
              {showOfflineMembers && (
                <ul className="members-list">
                  {members.offline.map((member) => {
                    const isCurrentUser = member.id === currentUserId;
                    return (
                      <li
                        key={member.id}
                        className={`member-item offline ${isCurrentUser ? 'current-user' : ''}`}
                        onClick={() => handleOpenProfile(member)}
                        onContextMenu={(e) => handleCurrentUserContextMenu(e, member, isCurrentUser)}
                        style={{
                          cursor: isCurrentUser ? 'context-menu' :
                            (currentUserRole === "owner" && member.role !== "owner") ?
                              "context-menu" : "pointer",
                          backgroundColor: isCurrentUser ? 'rgba(147, 72, 183, 0.1)' : 'transparent'
                        }}
                      >
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="member-avatar" />
                        ) : (
                          <FaUserCircle className="member-avatar-placeholder" />
                        )}
                        <div className="member-info">
                          {getRoleIcon(member.role)}
                          <span className="member-name">
                            {member.name}
                            {isCurrentUser ? " (vous)" : ""}
                          </span>
                        </div>
                        {renderStatusIndicator(member)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      {memberContextMenu.visible && memberContextMenu.member && (
        <div
          className="channel-context-menu"
          style={{ top: memberContextMenu.y, left: memberContextMenu.x, zIndex: 2000 }}
          onClick={(e) => e.stopPropagation()}
        >
          {((currentUserRole === "owner" && memberContextMenu.member.role === "member") ||
            (currentUserRole === "admin" && memberContextMenu.member.role === "member")) && (
            <div className="context-menu-item" onClick={() => handleChangeMemberRole("admin")}> <FaArrowUp className="context-menu-icon" />Promouvoir en admin</div>
          )}
          {currentUserRole === "owner" && memberContextMenu.member.role === "admin" && (
            <div className="context-menu-item" onClick={() => handleChangeMemberRole("member")}> <FaArrowDown className="context-menu-icon" />Rétrograder en membre</div>
          )}
        </div>
      )}
      {files.length > 0 && (
        <div className="details-section">
          <div className="section-header" onClick={toggleFiles}>
            {showFiles ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
            <h3>Fichiers ({files.length})</h3>
          </div>
          {showFiles && (
            <ul className="files-list" style={{ maxHeight: "220px", overflowY: files.length > 5 ? "auto" : "visible" }}>
              {files.slice(0, 5).map((file) => (
                <li key={file.id} className="file-item">
                  <div className="file-icon">{(() => {
                    switch (file.type) {
                      case "pdf": return <FaFilePdf />;
                      case "word": return <FaFileWord />;
                      case "excel": return <FaFileExcel />;
                      default: return <FaFileAlt />;
                    }
                  })()}</div>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">{file.size} • {file.uploadedAt && formatMessageDate(file.uploadedAt)}</span>
                  </div>
                  <div className="file-actions">
                    <button className="file-download-button" title="Télécharger" onClick={() => handleDownloadFile(file.url, file.name)}><FaDownload /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {images.length > 0 && (
        <div className="details-section">
          <div className="section-header" onClick={toggleImages}>
            {showImages ? <FaChevronDown className="toggle-icon" /> : <FaChevronRight className="toggle-icon" />}
            <h3>Images ({images.length})</h3>
          </div>
          {showImages && (
            <div className="images-grid" style={{ maxHeight: "220px", overflowY: images.length > 5 ? "auto" : "visible" }}>
              {images.slice(0, 5).map((image) => (
                <div key={image.id} className="image-item">
                  <img
                    src={S3_BASE_URL + image.url}
                    alt={image.name}
                    className="shared-image"
                    onClick={() => handleOpenFileViewer({ ...image, fullFileUrl: S3_BASE_URL + image.url })}
                    style={{ cursor: "pointer" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Invitation Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={handleCloseInviteModal}>
          <div className="modal-content modern" onClick={e => e.stopPropagation()}>
            <h2>Inviter à {workspace?.name}</h2>
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

export default React.memo(
  WorkspaceDetailsSidebar,
  (prevProps, nextProps) => {
    return false;
  }
);
