import React from 'react';
import { FaTimes, FaExternalLinkAlt, FaPoll } from 'react-icons/fa';

function StrawpollWebviewModal({ show, pollId, onClose }) {
  if (!show || !pollId) return null;
  
  // Format correct pour les URL Strawpoll
  const pollUrl = `https://strawpoll.com/polls/${pollId}`;
  
  const openInNewTab = () => {
    window.open(pollUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="webview-modal-overlay">
      <div className="webview-modal">
        <div className="webview-modal-header">
          <h2>Sondage Strawpoll</h2>
          <button className="webview-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="webview-modal-content">
          <div className="webview-external-content">
            <div className="strawpoll-redirect-message">
              <FaPoll className="strawpoll-icon" />
              <h3>Accéder au sondage</h3>
              <p>Pour des raisons de sécurité, ce sondage ne peut pas être affiché directement dans l'application.</p>
              <button 
                className="open-external-button" 
                onClick={openInNewTab}
              >
                <FaExternalLinkAlt /> Ouvrir le sondage dans un nouvel onglet
              </button>
              <p className="strawpoll-note">Une fois votre vote effectué, vous pouvez revenir à cette fenêtre et fermer cette boîte de dialogue.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StrawpollWebviewModal;
