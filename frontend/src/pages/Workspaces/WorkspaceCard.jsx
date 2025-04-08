import React, { useState, useRef, useEffect } from "react";
import { FaLock, FaUsers, FaCircle, FaEllipsisV, FaStar, FaSignOutAlt, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import JoinWorkspaceButton from "../../components/JoinWorkspaceButton/JoinWorkspaceButton";
import "./WorkspaceCard.css";

function WorkspaceCard({ workspace, showJoinButton = false }) {
  const [showOptions, setShowOptions] = useState(false);
  const navigate = useNavigate();
  const optionsRef = useRef(null);
  const buttonRef = useRef(null);

  // Gestionnaire pour les clics en dehors du menu
  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Si le menu est ouvert et que le clic n'est ni sur le menu ni sur le bouton d'options
      if (
        showOptions && 
        optionsRef.current && 
        !optionsRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowOptions(false);
      }
    };

    // Ajouter l'event listener uniquement quand le menu est ouvert
    if (showOptions) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    // Nettoyer l'event listener
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showOptions]);

  const handleCardClick = () => {
    if (!showJoinButton) {
      navigate(`/workspace/${workspace.id}`);
    }
  };

  const toggleOptions = (e) => {
    e.stopPropagation();
    setShowOptions(!showOptions);
  };

  const handleOptionClick = (action, e) => {
    e.stopPropagation();
    setShowOptions(false);
    
    switch (action) {
      case 'favorite':
        console.log('Toggle favorite:', workspace.id);
        // Implémentation à faire
        break;
      case 'leave':
        console.log('Leave workspace:', workspace.id);
        // Implémentation à faire
        break;
      case 'settings':
        console.log('Settings for workspace:', workspace.id);
        // Implémentation à faire
        break;
      default:
        break;
    }
  };

  return (
    <div 
      className="workspace-card" 
      onClick={showJoinButton ? undefined : handleCardClick}
      style={showJoinButton ? { cursor: 'default' } : { cursor: 'pointer' }}
    >
      <div
        className="workspace-banner"
        style={{ backgroundImage: `url(${workspace.banner})` }}
      ></div>
      
      {/* Options Button avec ref */}
      <button 
        className="options-button" 
        onClick={toggleOptions} 
        aria-label="Options"
        ref={buttonRef}
      >
        <FaEllipsisV />
      </button>
      
      {/* Options Dropdown avec ref */}
      {showOptions && (
        <div className="options-dropdown" ref={optionsRef}>
          <ul>
            <li onClick={(e) => handleOptionClick('favorite', e)}>
              <FaStar />
              {workspace.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </li>
            {!showJoinButton && (
              <li onClick={(e) => handleOptionClick('leave', e)} className="danger">
                <FaSignOutAlt />
                Quitter le workspace
              </li>
            )}
            {workspace.userRole === 'owner' && (
              <li onClick={(e) => handleOptionClick('settings', e)}>
                <FaCog />
                Paramètres
              </li>
            )}
          </ul>
        </div>
      )}
      
      <div className="workspace-content">
        {/* Header avec icône et titre */}
        <div className="workspace-header">
          <div
            className="workspace-icon"
            style={{ backgroundImage: `url(${workspace.icon})` }}
          ></div>
          <div className="workspace-info">
            <div className="workspace-title-container">
              <h3 className="workspace-title">{workspace.name}</h3>
              {workspace.isPrivate && (
                <FaLock className="private-icon" title="Private workspace" />
              )}
            </div>
          </div>
        </div>
        
        {/* Description (prendra tout l'espace disponible) */}
        <p className="workspace-description">{workspace.description}</p>
        
        {/* Wrapper pour les éléments de bas de carte */}
        <div className="card-footer">
          {/* Stats toujours en bas */}
          <div className="workspace-stats">
            <div className="workspace-stat">
              <FaUsers className="stat-icon" />
              <span className="stat-value">{workspace.totalMembers}</span>
            </div>
            <div className="workspace-stat">
              <FaCircle className="online-icon" />
              <span className="stat-value">{workspace.onlineUsers} online</span>
            </div>
          </div>
          
          {/* Bouton rejoindre si nécessaire */}
          {showJoinButton && (
            <JoinWorkspaceButton 
              workspaceId={workspace.id} 
              isPrivate={workspace.isPrivate} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkspaceCard;
