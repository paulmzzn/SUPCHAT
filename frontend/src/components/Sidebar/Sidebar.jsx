import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { useEffect, useState } from "react";
import { FaComment, FaCompass, FaCog } from "react-icons/fa";
import { MdWorkspacesFilled } from "react-icons/md";
import { useSocket } from "../../context/SocketContext";

// Import logo
import logoSupchat from "../../assets/icons/logo_supchat.svg";

function Sidebar({ unreadMessageCount }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const { globalNotifications, refreshUnreadDM } = useSocket() || {
    globalNotifications: { private: 0, workspace: 0 },
    refreshUnreadDM: () => {},
  };

  // Check if the current path matches the given path
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);
  // Effet pour gérer les mises à jour des messages non lus
  useEffect(() => {
    // Fonction pour gérer la mise à jour du compteur de messages non lus
    const handleUnreadMessagesUpdate = (event) => {
      setLocalUnreadCount(event.detail.count);
    };

    // Récupérer le compteur initial depuis localStorage
    const storedCount = parseInt(
      localStorage.getItem("unreadPrivateMessages") || "0",
      10
    );
    setLocalUnreadCount(storedCount);

    // Écouter les événements de mise à jour
    window.addEventListener(
      "unreadMessagesUpdated",
      handleUnreadMessagesUpdate
    );

    // Rafraîchir les compteurs au montage du composant
    try {
      refreshUnreadDM();
    } catch (error) {
      console.warn(
        "Erreur lors du premier rafraîchissement des messages non lus:",
        error
      );
    }

    // Rafraîchir périodiquement les compteurs (toutes les 60 secondes)
    // Augmenter l'intervalle à 2 minutes pour réduire la charge sur le serveur
    const intervalId = setInterval(() => {
      try {
        refreshUnreadDM();
      } catch (error) {
        console.warn(
          "Erreur lors du rafraîchissement périodique des messages non lus:",
          error
        );
        // Ne pas interrompre l'intervalle en cas d'erreur
      }
    }, 120000); // 2 minutes au lieu de 60 secondes

    return () => {
      window.removeEventListener(
        "unreadMessagesUpdated",
        handleUnreadMessagesUpdate
      );
      clearInterval(intervalId);
    };
  }, [refreshUnreadDM]);

  // Fonction pour déterminer la classe CSS basée sur le statut actif
  const getIconClasses = (path) => {
    return `sidebar-icon ${isActive(path) ? "active" : ""}`;
  };

  // Logique de priorité pour déterminer le compteur à afficher
  // 1. Utiliser unreadMessageCount si fourni et sur la page DirectMessages
  // 2. Utiliser globalNotifications.private du contexte Socket
  // 3. En dernier recours, utiliser localUnreadCount depuis localStorage
  const displayCount =
    isActive("/direct-messages") && unreadMessageCount !== undefined
      ? unreadMessageCount
      : globalNotifications?.private !== undefined &&
        globalNotifications.private > 0
      ? globalNotifications.private
      : localUnreadCount;

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
            {displayCount > 0 && (
              <span className="nav-badge">{displayCount}</span>
            )}
          </Link>
          <Link
            to="/workspaces"
            className={`nav-item ${isActive("/workspaces") ? "active" : ""}`}
          >
            <MdWorkspacesFilled className={getIconClasses("/workspaces")} />
            {/* Ensure we're using a consistent class for the workspace badge */}
            {globalNotifications?.workspace > 0 && (
              <span className="nav-badge">{globalNotifications.workspace}</span>
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
