import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { useEffect, useState } from 'react';
import { FaComment, FaCompass, FaCog } from 'react-icons/fa';
import { MdWorkspacesFilled } from "react-icons/md";
import { useSocket } from '../../context/SocketContext';

// Import logo
import logoSupchat from '../../assets/icons/logo_supchat.svg';

function Sidebar({ unreadMessageCount }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { globalNotifications } = useSocket() || {};

  // Check if the current path matches the given path
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const handleUnreadMessagesUpdate = (event) => {
      setLocalUnreadCount(event.detail.count);
    };
    
    // Get initial count from localStorage
    const storedCount = parseInt(localStorage.getItem('unreadPrivateMessages') || '0', 10);
    setLocalUnreadCount(storedCount);
    
    // Listen for updates
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
    };
  }, []);

  useEffect(() => {
    // Load initial count from localStorage
    const storedCount = parseInt(localStorage.getItem('unreadPrivateMessages') || '0', 10);
    setUnreadMessages(storedCount);
    
    // Listen for custom event when unread messages change
    const handleUnreadUpdate = (event) => {
      setUnreadMessages(event.detail.count);
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadUpdate);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadUpdate);
    };
  }, []);

  // Fonction pour déterminer la classe CSS basée sur le statut actif
  const getIconClasses = (path) => {
    return `sidebar-icon ${isActive(path) ? 'active' : ''}`;
  };

  // Determine which count to use
  const displayCount =
    unreadMessageCount !== undefined
      ? unreadMessageCount
      : globalNotifications?.private ?? localUnreadCount;

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <Link to="/" className="sidebar-logo">
          <img src={logoSupchat} alt="Supchat Logo" className="logo-image" />
        </Link>
        <div className="sidebar-nav">
          <Link to="/direct-messages" className={`nav-item ${isActive('/direct-messages') ? 'active' : ''}`}>
            <FaComment className={getIconClasses('/direct-messages')} />
            {displayCount > 0 && (
              <span className="nav-badge">{displayCount}</span>
            )}
          </Link>
          <Link to="/workspaces" className={`nav-item ${isActive('/workspaces') ? 'active' : ''}`}>
            <MdWorkspacesFilled className={getIconClasses('/workspaces')} />
            {/* Exemple pour badge workspace : */}
            {globalNotifications?.workspace > 0 && (
              <span className="nav-badge">{globalNotifications.workspace}</span>
            )}
          </Link>
          <Link to="/discover" className={`nav-item ${isActive('/discover') ? 'active' : ''}`}>
            <FaCompass className={getIconClasses('/discover')} />
          </Link>
        </div>
        <div className="sidebar-footer">
          <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
            <FaCog className={getIconClasses('/settings')} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
