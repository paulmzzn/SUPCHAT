import React, { useState } from 'react';
import { API_URL } from '../../config/config';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaCheck, FaSpinner } from 'react-icons/fa';
import './JoinWorkspaceButton.css';

const JoinWorkspaceButton = ({ workspaceId, isPrivate, onSuccess, hasJoined }) => {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const navigate = useNavigate();

  // Si l'utilisateur a déjà rejoint ou a déjà envoyé une demande, afficher un bouton désactivé
  if (hasJoined || requestSent) {
    return (
      <div className="join-button-container">
        <button className="join-button joined" disabled>
          <FaCheck /> {requestSent ? 'Demande envoyée' : 'Déjà membre'}
        </button>
      </div>
    );
  }

  // Fonction pour envoyer une demande d'adhésion à un workspace privé
  const sendJoinRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return false;
      }

      // Option pour ajouter un message personnalisé
      const message = prompt('Message pour les administrateurs du workspace (optionnel):');
      
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/request-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message || ''
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'envoi de la demande');
      }

      // Afficher un message de confirmation
      setRequestSent(true);
      alert('Votre demande d\'adhésion a été envoyée avec succès. Vous serez notifié lorsqu\'elle sera traitée.');
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      setError(error.message);
      return false;
    }
  };

  const handleJoin = async () => {
    try {
      setIsJoining(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Si le workspace est privé, redirectionner vers la page de demande d'adhésion
      if (isPrivate) {
        const requestSuccess = await sendJoinRequest();
        if (requestSuccess && onSuccess) {
          onSuccess();
        }
        setIsJoining(false);
        return;
      }
      
      // Pour les workspaces publics, on les rejoint directement
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
        navigate(`/workspace/${workspaceId}`);
      } else {
        // Si l'erreur indique que le workspace est privé, proposer d'envoyer une demande
        if (data.message && data.message.includes('privé')) {
          if (confirm('Ce workspace est privé. Voulez-vous envoyer une demande d\'adhésion?')) {
            await sendJoinRequest();
          }
        } else {
          setError(data.message || 'Une erreur est survenue');
        }
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
        className={`join-button ${isPrivate ? 'private' : ''}`}
        onClick={handleJoin}
        disabled={isJoining}
      >
        {isJoining ? (
          <>
            <FaSpinner className="spinner" /> Traitement...
          </>
        ) : (
          <>
            {isPrivate && <FaLock />} 
            {isPrivate ? 'Demander à rejoindre' : 'Rejoindre'}
          </>
        )}
      </button>
      {error && <div className="join-error">{error}</div>}
    </div>
  );
};

export default JoinWorkspaceButton;
