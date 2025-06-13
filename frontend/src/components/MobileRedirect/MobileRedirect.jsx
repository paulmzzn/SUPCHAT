import React from 'react';
import './MobileRedirect.css';

const MobileRedirect = () => {
  const handleDownloadClick = () => {
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
  };

  const handleExpoClick = () => {
    window.open('exp://jehqnry-anonymous-8081.exp.direct', '_self');
  };

  const handleExpoStoreClick = () => {
    // Détection du système pour rediriger vers le bon store
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open('https://apps.apple.com/app/expo-go/id982107779', '_blank');
    } else if (isAndroid) {
      window.open('https://play.google.com/store/apps/details?id=host.exp.exponent', '_blank');
    } else {
      // Pour desktop ou autres, on propose les deux
      window.open('https://expo.dev/client', '_blank');
    }
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
          Pour une meilleure expérience, veuillez utiliser notre application mobile.
        </p>
        
        <button 
          className="mobile-redirect-button"
          onClick={handleDownloadClick}
        >
          📦 Télécharger depuis les Stores
        </button>
        <p className="mobile-redirect-note" style={{ marginTop: '5px', marginBottom: '20px', color: '#e74c3c', fontWeight: '600' }}>
          ⚠️ L'application n'est pas encore disponible sur les stores officiels
        </p>
        
        <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '2px dashed #667eea' }}>
          <p style={{ margin: '0 0 15px 0', color: '#333', fontWeight: '600' }}>
            🚀 Accès en version test via Expo Go :
          </p>
          
          <button 
            className="mobile-redirect-button"
            onClick={handleExpoClick}
            style={{ background: 'linear-gradient(135deg, #000020 0%, #000051 100%)', marginBottom: '10px' }}
          >
            Ouvrir avec Expo Go
          </button>
          
          <button 
            className="mobile-redirect-button"
            onClick={handleExpoStoreClick}
            style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }}
          >
            📲 Télécharger Expo Go
          </button>
        </div>
        
        <p className="mobile-redirect-note">
          Téléchargez d'abord <strong>Expo Go</strong>, puis utilisez le bouton "Ouvrir avec Expo Go" pour accéder à l'application.
        </p>
      </div>
    </div>
  );
};

export default MobileRedirect;
