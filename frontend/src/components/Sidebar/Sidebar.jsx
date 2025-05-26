import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { useEffect, useState } from "react";
import { FaComment, FaCompass, FaCog } from "react-icons/fa";
import { MdWorkspacesFilled } from "react-icons/md";
import { useSocket } from "../../context/SocketContext";

// Import logo
import logoSupchat from "../../assets/icons/logo_supchat.svg";

function Sidebar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const { globalNotifications, refreshUnreadDM } = useSocket() || {
    globalNotifications: { private: 0, workspace: 0 },
    refreshUnreadDM: () => {},
  };
  const [localNotifications, setLocalNotifications] = useState({
    private: 0,
    workspace: 0,
  });

  // Check if the current path matches the given path
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  }; // Écouteur d'événements pour les mises à jour des messages non lus
  useEffect(() => {
    const handleUnreadMessagesUpdate = (event) => {
      if (event.detail && typeof event.detail.count === "number") {
        setLocalNotifications((prev) => ({
          ...prev,
          private: event.detail.count,
        }));
      }
    };

    const handleUnreadChannelMessagesUpdate = (event) => {
      if (event.detail && typeof event.detail.total === "number") {
        console.log(
          "[Sidebar] Mise à jour des messages de canal non lus:",
          event.detail
        );
        setLocalNotifications((prev) => ({
          ...prev,
          workspace: event.detail.total,
        }));
      }
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener(
      "unreadMessagesUpdated",
      handleUnreadMessagesUpdate
    );
    window.addEventListener(
      "unreadChannelMessagesUpdated",
      handleUnreadChannelMessagesUpdate
    );

    return () => {
      window.removeEventListener(
        "unreadMessagesUpdated",
        handleUnreadMessagesUpdate
      );
      window.removeEventListener(
        "unreadChannelMessagesUpdated",
        handleUnreadChannelMessagesUpdate
      );
    };
  }, []); // Effet séparé pour charger les valeurs initiales
  useEffect(() => {
    // Rafraîchir les compteurs au montage d'abord
    refreshUnreadDM();

    // On utilise un timeout pour s'assurer que refreshUnreadDM a le temps de mettre à jour localStorage
    const timeoutId = setTimeout(() => {
      // Récupérer les valeurs initiales depuis localStorage
      const unreadPrivate = parseInt(
        localStorage.getItem("unreadPrivateMessages") || "0",
        10
      );
      const unreadWorkspace = parseInt(
        localStorage.getItem("unreadChannelMessages") || "0",
        10
      );

      setLocalNotifications({
        private: unreadPrivate,
        workspace: unreadWorkspace,
      });
    }, 300); // Délai augmenté pour s'assurer que les valeurs sont à jour

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Utiliser les notifications globales du contexte OU les notifications locales (des événements)
  const displayPrivateCount = Math.max(
    globalNotifications?.private || 0,
    localNotifications.private || 0
  );
  const displayWorkspaceCount = Math.max(
    globalNotifications?.workspace || 0,
    localNotifications.workspace || 0
  );

  // Fonction pour déterminer la classe CSS basée sur le statut actif
  const getIconClasses = (path) => {
    return `sidebar-icon ${isActive(path) ? "active" : ""}`;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <Link to="/" className="sidebar-logo">
          <img src={logoSupchat} alt="Supchat Logo" className="logo-image" />
        </Link>
        <div className="sidebar-nav">
          <Link
            to="/direct-messages"
            className={`nav-item ${
              isActive("/direct-messages") ? "active" : ""
            }`}
          >
            <FaComment className={getIconClasses("/direct-messages")} />
            {displayPrivateCount > 0 && (
              <span className="nav-badge">{displayPrivateCount}</span>
            )}
          </Link>
          <Link
            to="/workspaces"
            className={`nav-item ${isActive("/workspaces") ? "active" : ""}`}
          >
            <MdWorkspacesFilled className={getIconClasses("/workspaces")} />
            {/* Ensure we're using a consistent class for the workspace badge */}
            {displayWorkspaceCount > 0 && (
              <span className="nav-badge">{displayWorkspaceCount}</span>
            )}
          </Link>
          <Link
            to="/discover"
            className={`nav-item ${isActive("/discover") ? "active" : ""}`}
          >
            <FaCompass className={getIconClasses("/discover")} />
          </Link>
        </div>
        <div className="sidebar-footer">
          <Link
            to="/settings"
            className={`nav-item ${isActive("/settings") ? "active" : ""}`}
          >
            <FaCog className={getIconClasses("/settings")} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
