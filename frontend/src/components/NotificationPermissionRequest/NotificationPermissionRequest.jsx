import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import { useNotificationSettings } from '../../context/NotificationSettingsContext';
import notificationService from '../../utils/notificationService';
import './NotificationPermissionRequest.css';

const NotificationPermissionRequest = () => {
  const [showRequest, setShowRequest] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { notificationSettings } = useNotificationSettings();

  useEffect(() => {
    // Vérifier si on doit afficher la demande de permission
    const checkShouldShow = () => {
      const permission = notificationService.getPermissionStatus();
      const hasAsked = localStorage.getItem('notification_permission_asked');
      const desktopEnabled = notificationSettings?.desktop;

      // Afficher si:
      // - Les notifications bureau sont activées dans les paramètres
      // - Le navigateur supporte les notifications
      // - On n'a jamais demandé OU la permission est par défaut
      // - On n'a pas déjà accordé la permission
      const shouldShow = desktopEnabled && 
                        notificationService.isSupported && 
                        !hasAsked && 
                        permission === 'default';

      setShowRequest(shouldShow);
    };

    checkShouldShow();
  }, [notificationSettings]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        console.log('Permission notifications accordée');
        // Afficher une notification de test
        notificationService.showNotification('Notifications activées !', {
          body: 'Vous recevrez maintenant des notifications pour vos messages.',
          icon: '/logo192.png'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
    } finally {
      setIsRequesting(false);
      setShowRequest(false);
      localStorage.setItem('notification_permission_asked', 'true');
    }
  };

  const handleDismiss = () => {
    setShowRequest(false);
    localStorage.setItem('notification_permission_asked', 'true');
  };

  if (!showRequest) {
    return null;
  }

  return (
    <div className="notification-permission-banner">
      <div className="notification-permission-content">
        <div className="notification-permission-icon">
          <FaBell />
        </div>
        <div className="notification-permission-text">
          <h4>Activer les notifications de bureau ?</h4>
          <p>Recevez des notifications même quand SUPCHAT n'est pas ouvert</p>
        </div>
        <div className="notification-permission-actions">
          <button 
            className="btn-permission-allow"
            onClick={handleRequestPermission}
            disabled={isRequesting}
          >
            {isRequesting ? 'Activation...' : 'Activer'}
          </button>
          <button 
            className="btn-permission-dismiss"
            onClick={handleDismiss}
            disabled={isRequesting}
          >
            <FaTimes />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionRequest;
