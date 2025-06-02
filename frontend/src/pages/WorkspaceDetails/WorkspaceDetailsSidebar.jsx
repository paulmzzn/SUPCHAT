import React, { useEffect, useState, useRef } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaUserCircle,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAlt,
  FaCircle,
  FaClock,
  FaTimesCircle,
  FaRegMoon,
  FaUserPlus,
  FaBell,
  FaCheck,
  FaTimes,
  FaEdit,
  FaEye,
  FaUserCog,
  FaPlus,
} from "react-icons/fa";
import { useSocket } from "../../context/SocketContext";
import { API_URL } from "../../config/config";
import ReminderModal from "../../components/ReminderModal/ReminderModal";
import ReminderList from "../../components/ReminderList/ReminderList";
import ContextMenu from "../../components/shared/ContextMenu";
import { createMemberContextMenu, createStatusContextMenu } from "../../utils/contextMenuUtils";
import "./WorkspaceDetailsSidebar.css";

// Drapeau pour activer/désactiver les logs de débogage (mettre à false pour désactiver tous les logs)
const DEBUG_LOGGING = false;
const isProd = process.env.NODE_ENV === "production";

// Fonction utilitaire pour logger uniquement en développement ou si DEBUG_LOGGING est activé
const debugLog = (message, ...args) => {
  if (!isProd && DEBUG_LOGGING) {
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
  workspace,
  activeChannel,
  handleSetMemberChannelAccess,
  handleOpenMemberAccessModal,
}) {
  const { userStatuses, setUserStatus } = useSocket();

  // States for invitation functionality
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState({ status: "", message: "" });
  const [isInviting, setIsInviting] = useState(false);
  // States for join requests management
  const [joinRequests, setJoinRequests] = useState([]);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  // States for reminders management
  const [reminders, setReminders] = useState([]);
  const [showReminders, setShowReminders] = useState(false);  const [showReminderModal, setShowReminderModal] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [reminderError, setReminderError] = useState(null);
  const [creatingReminder, setCreatingReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null); // New state for editing
  // States for status context menu
  const [statusContextMenu, setStatusContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  // Référence pour le panneau des demandes d'adhésion
  const joinRequestsPanelRef = useRef(null);

  // Solution simplifiée: une référence pour suivre si une requête est en cours
  const isLoadingRef = useRef(false);

  // Gestionnaire de clic global pour fermer le panneau si on clique ailleurs
  useEffect(() => {
    if (!showJoinRequests) return;

    function handleClickOutside(event) {
      // Ne rien faire si on clique sur le bouton de demandes
      const requestButton = document.querySelector(".join-requests-btn");
      if (requestButton && requestButton.contains(event.target)) {
        return;
      }

      // Fermer le panneau si on clique en dehors
      if (
        joinRequestsPanelRef.current &&
        !joinRequestsPanelRef.current.contains(event.target)
      ) {
        setShowJoinRequests(false);
      }
    }

    // Ajouter l'écouteur d'événement après un délai
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showJoinRequests]);

  // Charger les demandes quand le composant est monté ou quand le workspace change
  useEffect(() => {
    if (
      (currentUserRole === "owner" || currentUserRole === "admin") &&
      workspace &&
      workspace.id
    ) {
      // Charger les demandes une première fois au montage du composant
      loadJoinRequests();
    }
  }, [workspace?.id, currentUserRole]);

  // Nouveau: effet qui charge les demandes quand le panel est ouvert
  useEffect(() => {
    if (
      showJoinRequests &&
      (currentUserRole === "owner" || currentUserRole === "admin") &&
      workspace &&
      workspace.id
    ) {
      loadJoinRequests();
    }
  }, [showJoinRequests]);

  // Fonction séparée pour charger les demandes
  const loadJoinRequests = () => {
    // Utiliser fetchJoinRequests seulement si aucune requête n'est en cours
    if (!isLoadingRef.current) {
      fetchJoinRequests();
    }
  };

  const fetchJoinRequests = async () => {
    if (!workspace || !workspace.id || isLoadingRef.current) return;

    // Marquer qu'une requête est en cours avec la référence
    isLoadingRef.current = true;
    setLoadingRequests(true);
    setRequestError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspaces/${workspace.id}/requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setJoinRequests(data);
      } else {
        setRequestError(
          data.message || "Erreur lors de la récupération des demandes"
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des demandes d'adhésion:",
        error
      );
      setRequestError("Erreur de connexion au serveur");
    } finally {
      setLoadingRequests(false);
      // Libérer le verrou après une petite pause
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 300);
    }
  };

  const handleRespondToRequest = async (
    requestId,
    accept,
    rejectReason = null
  ) => {
    if (!workspace || !workspace.id) return;

    try {
      setProcessingRequestId(requestId);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/workspaces/${workspace.id}/requests/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accept,
            rejectReason,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Retirer la demande de la liste
        setJoinRequests((requests) =>
          requests.filter((req) => req.id_request !== requestId)
        );

        // Si c'était la dernière demande et qu'il n'y en a plus, rafraîchir pour être sûr
        if (joinRequests.length === 1) {
          // Attendre un peu avant de rafraîchir
          setTimeout(() => {
            loadJoinRequests();
          }, 300);
        }
      } else {
        alert(data.message || "Erreur lors du traitement de la demande");
      }
    } catch (error) {
      console.error("Erreur lors du traitement de la demande:", error);
      alert("Erreur de connexion au serveur");
    } finally {
      setProcessingRequestId(null);
    }
  };

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
        `${API_URL}/api/workspaces/${workspace.id}/invite`,
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
    }  };

  // Reminder management functions
  const loadReminders = async () => {
    if (!activeChannel || !activeChannel.id) return;

    setLoadingReminders(true);
    setReminderError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/reminders/channel/${activeChannel.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      } else {
        const errorData = await response.json();
        setReminderError(
          errorData.message || "Erreur lors du chargement des rappels"
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des rappels:", error);
      setReminderError("Erreur de connexion au serveur");
    } finally {
      setLoadingReminders(false);
    }
  };  const handleCreateReminder = async (reminderData) => {
    if (!activeChannel || !activeChannel.id) return;

    setCreatingReminder(true);

    try {
      const token = localStorage.getItem("token");
      
      if (editingReminder) {
        // Mode édition - mettre à jour le rappel existant
        const response = await fetch(`${API_URL}/api/reminders/${editingReminder.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: reminderData.title,
            description: reminderData.description,
            reminder_date: reminderData.reminder_date,
          }),
        });

        if (response.ok) {
          // Recharger les rappels pour assurer la cohérence
          await loadReminders();
          setShowReminderModal(false);
          setEditingReminder(null);
          return true;
        } else {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Erreur lors de la modification du rappel"
          );
        }
      } else {
        // Mode création - créer un nouveau rappel
        const response = await fetch(`${API_URL}/api/reminders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...reminderData,
            channel_id: activeChannel.id,
          }),
        });

        if (response.ok) {
          const newReminder = await response.json();
          
          // Instead of adding to the state, reload all reminders to ensure consistency
          // This prevents any display issues from data structure mismatches
          await loadReminders();
          setShowReminderModal(false);
          return true;
        } else {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Erreur lors de la création du rappel"
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de la gestion du rappel:", error);
      throw error;
    } finally {
      setCreatingReminder(false);
    }
  };const handleEditReminder = async (reminderOrId, reminderData) => {
    try {
      // Si le premier paramètre est un objet (rappel complet), nous sommes appelés depuis ReminderList
      // Si c'est un ID, nous sommes appelés avec des données séparées
      let reminderId, dataToSend;
      
      if (typeof reminderOrId === 'object' && reminderOrId.id) {
        // Appelé depuis ReminderList avec l'objet rappel complet - ouvrir la modal d'édition
        setEditingReminder(reminderOrId);
        setShowReminderModal(true);
        return;
      } else {
        // Appelé avec ID et données séparées - effectuer la mise à jour
        reminderId = reminderOrId;
        dataToSend = reminderData;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/reminders/${reminderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const updatedReminder = await response.json();
        setReminders((prev) =>
          prev.map((reminder) =>
            reminder.id === reminderId ? updatedReminder : reminder
          )
        );
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la modification du rappel"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la modification du rappel:", error);
      throw error;
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rappel ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/reminders/${reminderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReminders((prev) =>
          prev.filter((reminder) => reminder.id !== reminderId)
        );
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la suppression du rappel"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du rappel:", error);
      alert(error.message);
    }
  };

  const toggleReminders = () => {
    setShowReminders(!showReminders);
  };
  // Load reminders when channel changes
  useEffect(() => {
    if (activeChannel && activeChannel.id) {
      loadReminders();
    } else {
    }
  }, [activeChannel?.id]);

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
      online: "status-indicator online",
      away: "status-indicator away",
      dnd: "status-indicator dnd",
      invisible: "status-indicator offline",
      offline: "status-indicator offline",
    };

    const iconComponent = {
      online: <FaCircle />,
      away: <FaClock />,
      dnd: <FaTimesCircle />,
      invisible: <FaRegMoon />,
      offline: <FaRegMoon />,
    };
  };

  const handleCurrentUserContextMenu = (e, member, isCurrentUser) => {
    if (!isCurrentUser) {
      handleMemberContextMenu(e, member);
      return;
    }

    e.preventDefault();
    
    // Create context menu items for status changes
    const statusMenuItems = createStatusContextMenu(handleStatusChange);
    
    // Show the context menu at the click position
    setStatusContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
    });
  };

  return (
    <div className="workspace-details-sidebar">
      <div className="details-section">
        <div className="section-header" onClick={toggleMembers}>
          {showMembers ? (
            <FaChevronDown className="toggle-icon" />
          ) : (
            <FaChevronRight className="toggle-icon" />
          )}
          <h3>Membres ({members.online.length + members.offline.length})</h3>

          {/* Boutons d'action pour les admins/owners, alignés avec le titre */}
          {(currentUserRole === "owner" || currentUserRole === "admin") && (
            <div
              className="member-actions-container"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bouton des demandes d'adhésion avec badge de notification */}
              <button
                className="member-action-btn join-requests-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowJoinRequests((prev) => !prev);
                  // Pas besoin de code supplémentaire ici car le useEffect sur showJoinRequests va charger les données
                }}
                title="Demandes d'adhésion"
              >
                <FaBell />
                {joinRequests.length > 0 && (
                  <span className="join-requests-badge">
                    {joinRequests.length}
                  </span>
                )}
              </button>

              {/* Bouton d'invitation */}
              <button
                className="member-action-btn invite-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenInviteModal();
                }}
                title="Inviter un utilisateur"
              >
                <FaUserPlus />
              </button>
            </div>
          )}
        </div>

        {/* Panel de demandes d'adhésion */}
        {showJoinRequests &&
          (currentUserRole === "owner" || currentUserRole === "admin") && (
            <div
              className="join-requests-panel"
              ref={joinRequestsPanelRef}
              onClick={(e) => e.stopPropagation()}
            >
              <h4>Demandes d'adhésion</h4>

              {loadingRequests ? (
                <div className="join-requests-loading">
                  Chargement des demandes...
                </div>
              ) : requestError ? (
                <div className="join-requests-error">{requestError}</div>
              ) : joinRequests.length === 0 ? (
                <div className="join-requests-empty">
                  Aucune demande en attente
                </div>
              ) : (
                <ul className="join-requests-list">
                  {joinRequests.map((request) => (
                    <li key={request.id_request} className="join-request-item">
                      <div className="join-request-user">
                        <div className="join-request-name">
                          {request.nom_utilisateur}
                        </div>
                        <div className="join-request-email">
                          {request.email}
                        </div>
                        {request.message && (
                          <div className="join-request-message">
                            <em>"{request.message}"</em>
                          </div>
                        )}
                      </div>
                      <div className="join-request-actions">
                        <button
                          className="join-request-accept"
                          onClick={() =>
                            handleRespondToRequest(request.id_request, true)
                          }
                          disabled={
                            processingRequestId === request.id_request
                          }
                        >
                          <FaCheck /> Accepter
                        </button>
                        <button
                          className="join-request-reject"
                          onClick={() => {
                            const reason = prompt(
                              "Raison du refus (optionnel):"
                            );
                            handleRespondToRequest(
                              request.id_request,
                              false,
                              reason
                            );
                          }}
                          disabled={
                            processingRequestId === request.id_request
                          }
                        >
                          <FaTimes /> Refuser
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

        {showMembers && (
          <div className="members-container">
            <div className="members-subsection">
              <div className="subsection-header" onClick={toggleOnlineMembers}>
                {showOnlineMembers ? (
                  <FaChevronDown className="toggle-icon" />
                ) : (
                  <FaChevronRight className="toggle-icon" />
                )}
                <h4>En ligne ({members.online.length})</h4>
              </div>
              {showOnlineMembers && (
                <ul className="members-list">
                  {members.online.map((member) => {
                    const isCurrentUser = member.id === currentUserId;
                    return (
                      <li
                        key={member.id}
                        className={`member-item online ${
                          isCurrentUser ? "current-user" : ""
                        }`}
                        onClick={() => handleOpenProfile(member)}
                        onContextMenu={(e) =>
                          handleCurrentUserContextMenu(e, member, isCurrentUser)
                        }
                        style={{
                          cursor: isCurrentUser
                            ? "context-menu"
                            : currentUserRole === "owner" &&
                              member.role !== "owner"
                            ? "context-menu"
                            : "pointer",
                          backgroundColor: isCurrentUser
                            ? "rgba(147, 72, 183, 0.1)"
                            : "transparent",
                        }}
                      >
                        {member.avatar || member.photo_de_profil ? (
                          <img
                            src={member.avatar || member.photo_de_profil}
                            alt={member.name}
                            className="member-avatar"
                          />
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
                {showOfflineMembers ? (
                  <FaChevronDown className="toggle-icon" />
                ) : (
                  <FaChevronRight className="toggle-icon" />
                )}
                <h4>Hors ligne ({members.offline.length})</h4>
              </div>
              {showOfflineMembers && (
                <ul className="members-list">
                  {members.offline.map((member) => {
                    const isCurrentUser = member.id === currentUserId;
                    return (
                      <li
                        key={member.id}
                        className={`member-item offline ${
                          isCurrentUser ? "current-user" : ""
                        }`}
                        onClick={() => handleOpenProfile(member)}
                        onContextMenu={(e) =>
                          handleCurrentUserContextMenu(e, member, isCurrentUser)
                        }
                        style={{
                          cursor: isCurrentUser
                            ? "context-menu"
                            : currentUserRole === "owner" &&
                              member.role !== "owner"
                            ? "context-menu"
                            : "pointer",
                          backgroundColor: isCurrentUser
                            ? "rgba(147, 72, 183, 0.1)"
                            : "transparent",
                        }}
                      >
                        {member.avatar || member.photo_de_profil ? (
                          <img
                            src={member.avatar || member.photo_de_profil}
                            alt={member.name}
                            className="member-avatar"
                          />
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

        {/* Member Context Menu */}
        {memberContextMenu.visible && memberContextMenu.member && (
          <ContextMenu
            visible={memberContextMenu.visible}
            x={memberContextMenu.x}
            y={memberContextMenu.y}
            items={createMemberContextMenu({
              member: memberContextMenu.member,
              currentUserRole,
              onPromoteToAdmin: () => handleChangeMemberRole("admin"),
              onDemoteToMember: () => handleChangeMemberRole("member"),
              onManageAccess: () => handleOpenMemberAccessModal(memberContextMenu.member),
            })}
            onClose={() => setMemberContextMenu({ visible: false })}
            className="channel-context-menu"
          />
        )}
      </div>

      {files.length > 0 && (
        <div className="details-section">
          <div className="section-header" onClick={toggleFiles}>
            {showFiles ? (
              <FaChevronDown className="toggle-icon" />
            ) : (
              <FaChevronRight className="toggle-icon" />
            )}
            <h3>Fichiers ({files.length})</h3>
          </div>
          {showFiles && (
            <ul
              className="files-list"
              style={{
                maxHeight: "220px",
                overflowY: files.length > 5 ? "auto" : "visible",
              }}
            >
              {files.slice(0, 5).map((file) => (
                <li key={file.id} className="file-item">
                  <div className="file-icon">
                    {(() => {
                      switch (file.type) {
                        case "pdf":
                          return <FaFilePdf />;
                        case "word":
                          return <FaFileWord />;
                        case "excel":
                          return <FaFileExcel />;
                        default:
                          return <FaFileAlt />;
                      }
                    })()}
                  </div>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">
                      {file.size} •{" "}
                      {file.uploadedAt && formatMessageDate(file.uploadedAt)}
                    </span>
                  </div>
                  <div className="file-actions">
                    <button
                      className="file-download-button"
                      title="Télécharger"
                      onClick={() => handleDownloadFile(file.url, file.name)}
                    >
                      <FaDownload />
                    </button>
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
            {showImages ? (
              <FaChevronDown className="toggle-icon" />
            ) : (
              <FaChevronRight className="toggle-icon" />
            )}
            <h3>Images ({images.length})</h3>
          </div>
          {showImages && (
            <div
              className="images-grid"
              style={{
                maxHeight: "220px",
                overflowY: images.length > 5 ? "auto" : "visible",
              }}
            >              {images.slice(0, 5).map((image) => (
                <div key={image.id} className="image-item">
                  <img
                    src={S3_BASE_URL + image.url}
                    alt={image.name}
                    className="shared-image"
                    onClick={() =>
                      handleOpenFileViewer({
                        ...image,
                        fullFileUrl: S3_BASE_URL + image.url,
                      })
                    }
                    style={{ cursor: "pointer" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Reminders Section - Always visible */}
      <div className="details-section">
        <div className="section-header" onClick={toggleReminders}>
          {showReminders ? (
            <FaChevronDown className="toggle-icon" />
          ) : (
            <FaChevronRight className="toggle-icon" />
          )}
          <h3>Rappels ({reminders.length})</h3>            <div className="reminder-actions" onClick={(e) => e.stopPropagation()}>            <button
              className={`reminder-create-btn ${activeChannel ? 'channel-active' : ''}`}
              onClick={() => {
                setEditingReminder(null); // Reset editing state for new reminder
                setShowReminderModal(true);
              }}
              title="Créer un rappel"
            >
              <FaPlus />
              <span style={{ marginLeft: '4px' }}>Nouveau</span>
            </button>
          </div>
        </div>
        
        {showReminders && (
          <div className="reminders-content">
            {!activeChannel ? (
              <div className="reminders-info">
                <p>Sélectionnez un canal pour voir les rappels ou créer un nouveau rappel.</p>
              </div>
            ) : loadingReminders ? (
              <div className="reminders-loading">Chargement des rappels...</div>
            ) : reminderError ? (
              <div className="reminders-error">
                {reminderError}
                <button 
                  onClick={loadReminders}
                  className="retry-btn"
                >
                  Réessayer
                </button>
              </div>            ) : (
              <ReminderList
                reminders={reminders}
                onEditReminder={handleEditReminder}
                onDeleteReminder={handleDeleteReminder}
                currentUserId={currentUserId}
              />
            )}
          </div>
        )}
      </div>
        {/* Reminder Modal */}
      {showReminderModal && (        <ReminderModal
          show={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setEditingReminder(null); // Reset editing state when modal closes
          }}
          onSubmit={handleCreateReminder}
          loading={creatingReminder}
          canalId={activeChannel?.id}
          workspaceId={workspace?.id}
          editingReminder={editingReminder} // Pass editing reminder to modal
        />
      )}
      
      {/* Invitation Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={handleCloseInviteModal}>
          <div
            className="modal-content modern"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Status Context Menu */}
      {statusContextMenu.visible && (
        <ContextMenu
          items={createStatusContextMenu(handleStatusChange)}
          onClose={handleCloseStatusContextMenu}
          x={statusContextMenu.x}
          y={statusContextMenu.y}
        />
      )}
    </div>
  );
}

export default React.memo(WorkspaceDetailsSidebar, (prevProps, nextProps) => {
  return false;
});
