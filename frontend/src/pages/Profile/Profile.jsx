import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaBriefcase,
  FaServer,
  FaUserClock,
  FaUserFriends,
  FaComment,
  FaShieldAlt,
  FaCrown,
  FaUserTag,
} from "react-icons/fa";
import "./Profile.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import Spinner from "../../components/Spinner/Spinner";
import ActivitySection from "./ActivitySection";

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userWorkspaces, setUserWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activityStats, setActivityStats] = useState(null);

  // Récupérer l'ID de l'utilisateur connecté
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setCurrentUserId(payload.id);
        }
      } catch (e) {
        console.error("Erreur lors du décodage du token:", e);
      }
    }
  }, []);

  // Récupérer les informations de l'utilisateur
  useEffect(() => {
    setLoading(true);
    setError(null);

    const apiUrl =
      (process.env.REACT_APP_API_URL || "http://192.168.1.69:3001") +
      `/api/users/${userId}`;

    console.log("Profile.jsx - Fetching user profile from:", apiUrl);

    fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          let backendError = "";
          try {
            if (contentType && contentType.includes("application/json")) {
              const errData = await res.json();
              backendError = errData.message || "";
            } else {
              backendError = await res.text();
            }
          } catch (e) {
            backendError = "";
          }
          throw new Error(backendError || "Utilisateur introuvable");
        }
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("La réponse du serveur n'est pas au format JSON.");
        }
        try {
          const data = await res.json();
          if (!data) {
            throw new Error("Aucune donnée utilisateur valide reçue.");
          }
          setUser(data);
        } catch (e) {
          setError("Erreur lors de la lecture des données utilisateur.");
        }
      })
      .catch((err) => {
        setError(err.message || "Erreur lors du chargement du profil.");
      })
      .finally(() => {
        // Maintenant on récupère les workspaces de l'utilisateur
        fetchUserWorkspaces();
      });
  }, [userId]);

  // Vérifier la structure des données reçues
  useEffect(() => {
    if (user) {
      console.log("Données utilisateur reçues:", user);
    }
  }, [user]);

  // Fonction pour récupérer les workspaces de l'utilisateur
  const fetchUserWorkspaces = async () => {
    try {
      const apiUrl =
        (process.env.REACT_APP_API_URL || "http://192.168.1.69:3001") +
        `/api/users/${userId}/workspaces`;

      console.log(`Fetching workspaces from: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Workspaces reçus:", data);
        setUserWorkspaces(data);
      } else {
        const errorData = await response.json();
        console.error(
          "Erreur lors de la récupération des workspaces:",
          errorData
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user activity stats (messages, replies, mentions, etc.)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl =
          (process.env.REACT_APP_API_URL || "http://192.168.1.69:3001") +
          `/api/users/${userId}/activity-stats`;
        const res = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (!res.ok) {
          setActivityStats(null);
          return;
        }
        const stats = await res.json();
        setActivityStats(stats);
      } catch (e) {
        setActivityStats(null);
      }
    };
    fetchStats();
  }, [userId]);

  // Fonction pour naviguer vers un workspace
  const navigateToWorkspace = (workspaceId) => {
    navigate(`/workspace/${workspaceId}`);
  };

  // Fonction d'affichage des icônes de rôle
  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return <FaCrown className="role-icon owner" title="Propriétaire" />;
      case "admin":
        return (
          <FaShieldAlt className="role-icon admin" title="Administrateur" />
        );
      default:
        return <FaUserTag className="role-icon member" title="Membre" />;
    }
  };

  // Fonction pour afficher la date d'inscription formatée
  const formatJoinDate = (dateString) => {
    if (!dateString) {
      console.log("Date manquante:", dateString);
      return "Date inconnue";
    }

    console.log("Date reçue:", dateString, typeof dateString);

    // Essayer de traiter différents formats de date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log("Date invalide après conversion:", date);
      return "Date invalide";
    }

    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper to extract stats from user object and API stats
  const getUserStats = () => {
    return {
      messages:
        (activityStats &&
          (activityStats.messageCount ?? activityStats.messages)) ??
        user?.message_count ??
        user?.messages ??
        user?.stats?.messages ??
        0,
      replies:
        (activityStats &&
          (activityStats.replyCount ?? activityStats.replies)) ??
        user?.reply_count ??
        user?.replies ??
        user?.stats?.replies ??
        0,
      mentions:
        (activityStats &&
          (activityStats.mentionCount ?? activityStats.mentions)) ??
        user?.mention_count ??
        user?.mentions ??
        user?.stats?.mentions ??
        0,
      workspaces: userWorkspaces?.length || activityStats?.workspaceCount || 0,
      activeChannels: activityStats?.activeChannelsCount ?? 0,
    };
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="loading-container">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <p className="error-text">Une erreur est survenue</p>
          <div className="error-details">{error}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="error-container">
          <FaUser className="error-icon" />
          <p className="error-text">Utilisateur introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="profile-page">
        <div className="glow-circle-right top-right"></div>
        <div className="glow-circle-left bottom-left"></div>

        <div className="profile-container">
          <div className="profile-header">
            {user.avatar ? (
              <img
                className="profile-avatar"
                src={user.avatar}
                alt={user.name}
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}

            <div className="profile-info">
              <h1 className="profile-name">
                {user.name || user.nom || "Utilisateur"}
              </h1>
              <div className="profile-meta">
                <div className="profile-status">
                  <span
                    className={`status-indicator ${
                      user.status === "online"
                        ? "status-online"
                        : "status-offline"
                    }`}
                  ></span>
                  <span className="status-text">
                    {user.status === "online" ? "En ligne" : "Hors ligne"}
                  </span>
                </div>

                {currentUserId !== userId && (
                  <div className="profile-actions">
                    <button
                      className="action-button message"
                      onClick={() =>
                        navigate(`/direct-messages?userId=${userId}`)
                      }
                    >
                      <FaComment /> Message
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="profile-sections">
            {/* Section 1: Informations personnelles (à gauche) */}
            <div className="profile-section">
              <h3 className="section-title">
                <FaUser />
                Informations personnelles
              </h3>

              <div className="info-row">
                <div className="info-label">Email</div>
                <div className="info-value">{user.email}</div>
              </div>

              <div className="info-row">
                <div className="info-label">Inscrit le</div>
                <div className="info-value">
                  {user.date_creation ? (
                    <>
                      {formatJoinDate(user.date_creation)}
                      <div className="date-raw">{user.date_creation}</div>
                    </>
                  ) : user.joinedAt ? (
                    <>
                      {formatJoinDate(user.joinedAt)}
                      <div className="date-raw">{user.joinedAt}</div>
                    </>
                  ) : (
                    "Date non disponible"
                  )}
                </div>
              </div>

              {user.bio && (
                <div className="info-row">
                  <div className="info-label">Bio</div>
                  <div className="info-value profile-bio">{user.bio}</div>
                </div>
              )}
            </div>

            {/* Section 2: Workspaces (pleine largeur en dessous) */}
            <div className="profile-section full-width">
              <h3 className="section-title">
                <FaServer />
                Workspaces ({userWorkspaces?.length || 0})
              </h3>
              <div className="workspaces-list">
                {userWorkspaces && userWorkspaces.length > 0 ? (
                  userWorkspaces.map((workspace) => (
                    <div
                      key={workspace.id_workspace || workspace.id}
                      className="workspace-item"
                      onClick={() =>
                        navigateToWorkspace(
                          workspace.id_workspace || workspace.id
                        )
                      }
                    >
                      <div className="workspace-item-header">
                        <span className="workspace-name">
                          {workspace.nom || workspace.name}
                        </span>
                        <div className="workspace-role">
                          {getRoleIcon(workspace.user_role || workspace.role)}
                          <span>
                            {workspace.user_role || workspace.role || "member"}
                          </span>
                        </div>
                      </div>
                      <div className="workspace-members">
                        <FaUserFriends /> {workspace.total_members || "?"}{" "}
                        membres
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="workspace-empty">Aucun workspace rejoint</p>
                )}
              </div>
            </div>
          </div>

          {/* Add the Activity Section with real stats */}
          <ActivitySection userStats={getUserStats()} />
        </div>
      </div>
    </div>
  );
}

export default Profile;
