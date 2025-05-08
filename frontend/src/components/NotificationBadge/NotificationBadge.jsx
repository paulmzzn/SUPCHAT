import React from 'react';
import './NotificationBadge.css';

const NotificationBadge = ({ count, className = '' }) => {
  if (!count || count <= 0) return null;
  
  // Limiter l'affichage à 99+ si le nombre est supérieur
  const displayCount = count > 99 ? '99+' : count;
  
  return (
    <div className={`notification-badge ${className}`}>
      {displayCount}
    </div>
  );
};

export default NotificationBadge;