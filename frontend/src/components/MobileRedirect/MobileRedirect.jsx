import React from 'react';
import './MobileRedirect.css';

const MobileRedirect = () => {
  const handleDownloadClick = () => {
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
  };

  return (
    <div className="mobile-redirect-container">
      <div className="mobile-redirect-content">
        <div className="mobile-redirect-icon">
          📱
        </div>
        <h1 className="mobile-redirect-title">
          Application Mobile Requise
        </h1>
        <p className="mobile-redirect-description">
          Pour une meilleure expérience, veuillez télécharger notre application mobile.
        </p>
        <button 
          className="mobile-redirect-button"
          onClick={handleDownloadClick}
        >
          Télécharger l'Application
        </button>
        <p className="mobile-redirect-note">
          Vous serez redirigé vers le store approprié pour votre appareil.
        </p>
      </div>
    </div>
  );
};

export default MobileRedirect;
