import React, { useState, useRef, useEffect } from "react";
import { FaLock, FaUsers, FaCircle, FaEllipsisV, FaStar, FaSignOutAlt, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import JoinWorkspaceButton from "../../components/JoinWorkspaceButton/JoinWorkspaceButton";
import { API_URL } from "../../config/config";
import "./WorkspaceCard.css";

function WorkspaceCard({ workspace, showJoinButton = false, hasJoined = false, onWorkspaceLeave, onFavoriteToggle }) {
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

  const handleOptionClick = async (option, e) => {
    e.stopPropagation(); // Prevent card click
    
    switch (option) {
      case 'favorite':
        try {
          const token = localStorage.getItem('token');
          const method = workspace.isFavorite ? 'DELETE' : 'POST';
          
          const response = await fetch(`${API_URL}/api/workspaces/${workspace.id}/favorites`, {
            method: method,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) throw new Error('Failed to update favorite status');
          
          // Toggle favorite status locally and call parent callback
          const updatedWorkspace = { ...workspace, isFavorite: !workspace.isFavorite };
          if (onFavoriteToggle) onFavoriteToggle(updatedWorkspace);
        } catch (error) {
          console.error('Error updating favorite:', error);
        }
        break;
      case 'leave':
        try {
          if (!window.confirm("Êtes-vous sûr de vouloir quitter ce workspace?")) {
            return;
          }
          
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/login');
            return;
          }

          // Récupérer l'ID utilisateur depuis le token JWT
          let userId = null;
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              userId = payload.id;
            }
          } catch (e) {
            console.error("Erreur lors du décodage du token:", e);
          }

          if (!userId) {
            alert("Impossible de récupérer l'utilisateur.");
            return;
          }
          
          // Correction ici: ajouter le userId dans le corps de la requête
          const response = await fetch(`${API_URL}/api/workspaces/${workspace.id}/members/${userId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId }) // Ajout crucial pour identifier l'utilisateur demandant le retrait
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erreur lors de la sortie du workspace");
          }

          // Notification de succès
          alert("Vous avez quitté le workspace avec succès.");
          
          // Si onWorkspaceLeave est défini, appeler cette fonction pour mettre à jour la liste des workspaces
          if (typeof onWorkspaceLeave === 'function') {
            onWorkspaceLeave(workspace.id);
          } else {
            // Sinon, rediriger vers la page des workspaces pour rafraîchir
            navigate('/workspaces');
          }
        } catch (error) {
          console.error('Erreur lors de la sortie du workspace:', error);
          alert(error.message || "Erreur lors de la sortie du workspace");
        }
        break;
      case 'settings':
        console.log('Settings for workspace:', workspace.id);
        navigate(`/workspace/${workspace.id}/settings`);
        break;
      default:
        break;
    }
    
    setShowOptions(false);
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
          
          {/* Bouton rejoindre si nécessaire, avec l'état hasJoined */}
          {showJoinButton && (
            <JoinWorkspaceButton 
              workspaceId={workspace.id} 
              isPrivate={workspace.isPrivate}
              hasJoined={hasJoined} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkspaceCard;
