import React, { useState } from 'react';
import { API_URL } from '../../config/config';
import { useNavigate } from 'react-router-dom';
import './JoinWorkspaceButton.css';

const JoinWorkspaceButton = ({ workspaceId, isPrivate, onSuccess }) => {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleJoin = async () => {
    try {
      setIsJoining(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}) // Le backend récupère l'ID utilisateur du token
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Workspace joined successfully');
        // Si une callback de succès est fournie, on l'appelle
        if (onSuccess) onSuccess();
        // Rediriger vers la page du workspace
        navigate(`/workspaces`);
      } else {
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      console.error('Error joining workspace:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="join-button-container">
      <button 
        className={`join-button ${isPrivate ? 'private' : 'public'}`}
        onClick={handleJoin}
        disabled={isJoining}
      >
        {isJoining ? 'En cours...' : isPrivate ? 'Demander à rejoindre' : 'Rejoindre'}
      </button>
      {error && <div className="join-error">{error}</div>}
    </div>
  );
};

export default JoinWorkspaceButton;
