// Utilitaire pour détecter les appareils mobiles
export const isMobileDevice = () => {
  // Détection basée sur l'user agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Vérification des patterns mobiles courants
  const mobilePatterns = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /Opera Mini/i,
    /IEMobile/i,
    /Mobile/i
  ];
  
  // Vérification avec les patterns
  const isMobileUA = mobilePatterns.some(pattern => pattern.test(userAgent));
  
  // Vérification avec la taille d'écran (pour être plus précis)
  const isMobileScreen = window.innerWidth <= 768;
  
  // Vérification avec l'API moderne si disponible
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isMobileScreen && isTouchDevice);
};

export const isTablet = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /iPad/i.test(userAgent) || (window.innerWidth >= 768 && window.innerWidth <= 1024 && 'ontouchstart' in window);
};
