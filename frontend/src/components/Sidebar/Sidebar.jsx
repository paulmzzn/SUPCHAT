import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { useEffect, useState } from 'react';
import { FaComment, FaCompass, FaCog } from 'react-icons/fa';
import { MdWorkspacesFilled } from "react-icons/md";

// Import logo
import logoSupchat from '../../assets/icons/logo_supchat.svg';

function Sidebar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
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

  // Fonction pour déterminer la classe CSS basée sur le statut actif
  const getIconClasses = (path) => {
    return `sidebar-icon ${isActive(path) ? 'active' : ''}`;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <Link to="/" className="sidebar-logo">
          <img src={logoSupchat} alt="Supchat Logo" className="logo-image" />
        </Link>
        
        <div className="sidebar-nav">
          <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <FaComment className={getIconClasses('/dashboard')} />
            <span className="notification-badge">12</span>
          </Link>
          
          <Link to="/workspaces" className={`nav-item ${isActive('/workspaces') ? 'active' : ''}`}>
            <MdWorkspacesFilled className={getIconClasses('/workspaces')} />
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
