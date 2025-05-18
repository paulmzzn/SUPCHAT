import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationBadge.css';

/**
 * Composant NotificationBubble
 * Une bulle de notification plus riche avec contenu et photo de profil.
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.userId - ID de l'utilisateur qui a envoyé le message
 * @param {string} props.senderName - Nom de l'expéditeur
 * @param {string} props.content - Contenu du message
 * @param {string} props.photoUrl - URL de la photo de profil
 * @param {string} props.timestamp - Horodatage du message
 * @param {string} props.type - Type de notification ('privateMessage' ou 'channelMessage')
 * @param {string} props.channelId - ID du canal (pour les messages de canal)
 * @param {string} props.workspaceId - ID de l'espace de travail (pour les messages de canal)
 * @returns {JSX.Element} - Le composant bulle de notification
 */
const NotificationBubble = ({
  userId,
  senderName,
  content,
  photoUrl,
  timestamp,
  type,
  channelId,
  workspaceId,
  onClose
}) => {
  const navigate = useNavigate();

  // Fonction pour formater l'aperçu du message
  const getMessagePreview = (text) => {
    if (!text) return "Nouveau message";
    
    // Supprimer les balises HTML si présentes
    const cleanContent = text.replace(/<[^>]*>?/gm, '');
    
    // Limiter à 60 caractères
    const previewLength = 60;
    if (cleanContent.length <= previewLength) {
      return cleanContent;
    }
    
    // Couper intelligemment
    const truncated = cleanContent.substring(0, previewLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > previewLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + "...";
    }
    
    return truncated + "...";
  };

  // Fonction pour naviguer vers la conversation
  const handleClick = () => {
    if (type === "privateMessage" && userId) {
      navigate(`/direct-messages?user=${userId}`);
    } else if (type === "channelMessage" && channelId) {
      navigate(`/workspace/${workspaceId}?channel=${channelId}`);
    }
    
    // Fermer la notification après la navigation
    if (onClose) {
      onClose();
    }
  };

  return (
    <div 
      className={`notification-bubble ${type}`}
      onClick={handleClick}
    >
      <div className="notification-avatar">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={`Avatar de ${senderName}`} 
            className="avatar-image" 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none';
              e.target.parentNode.querySelector('.avatar-placeholder').style.display = 'flex';
            }}
          />
        ) : null}
        <div className="avatar-placeholder" style={{display: photoUrl ? 'none' : 'flex'}}>
          {senderName ? senderName.charAt(0).toUpperCase() : '?'}
        </div>
      </div>
      <div className="notification-content">
        <div className="notification-header">
          <h4>
            {type === "privateMessage" 
              ? `Message de ${senderName}` 
              : `Nouveau message dans un canal`}
          </h4>
          <button
            className="close-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onClose) onClose();
            }}
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
        <p className="notification-message">
          {getMessagePreview(content)}
        </p>
        <small className="notification-time">
          {new Date(timestamp).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </small>
      </div>
    </div>
  );
};

export default NotificationBubble;
