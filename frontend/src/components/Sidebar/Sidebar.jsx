import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { useEffect, useState } from 'react';

// Import logos and icons
import logoSupchat from '../../assets/icons/logo_supchat.svg';

// Desktop & active icons
import workspacesIcon from '../../assets/icons/workspaces.svg';
import discoverIcon from '../../assets/icons/discover.svg';
import tchatIcon from '../../assets/icons/tchat.svg';
import workspacesActiveIcon from '../../assets/icons/workspaces-active.svg';
import discoverActiveIcon from '../../assets/icons/discover-active.svg';
import tchatActiveIcon from '../../assets/icons/tchat-active.svg';

// White icons for mobile tab bar
import workspacesWhiteIcon from '../../assets/icons/workspaces-white.svg';
import discoverWhiteIcon from '../../assets/icons/discover-white.svg';
import tchatWhiteIcon from '../../assets/icons/tchat-white.svg';

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

  // Choose the appropriate icon based on device and active state
  const getIcon = (path, desktopIcon, activeIcon, whiteIcon) => {
    const active = isActive(path);
    
    if (isMobile) {
      return active ? activeIcon : whiteIcon;
    } else {
      return active ? activeIcon : desktopIcon;
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <Link to="/" className="sidebar-logo">
          <img src={logoSupchat} alt="Supchat Logo" className="logo-image" />
        </Link>
        
        <div className="sidebar-nav">
          <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <img 
              src={getIcon('/dashboard', tchatIcon, tchatActiveIcon, tchatWhiteIcon)} 
              alt="Dashboard" 
              className="nav-icon" 
            />
            <span className="notification-badge">12</span>
          </Link>
          
          <Link to="/workspaces" className={`nav-item ${isActive('/workspaces') ? 'active' : ''}`}>
            <img 
              src={getIcon('/workspaces', workspacesIcon, workspacesActiveIcon, workspacesWhiteIcon)} 
              alt="Workspaces" 
              className="nav-icon" 
            />
          </Link>
          
          <Link to="/discover" className={`nav-item ${isActive('/discover') ? 'active' : ''}`}>
            <img 
              src={getIcon('/discover', discoverIcon, discoverActiveIcon, discoverWhiteIcon)} 
              alt="Discover" 
              className="nav-icon" 
            />
          </Link>
        </div>
        
        <div className="sidebar-footer">
          <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="nav-icon">
              <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
